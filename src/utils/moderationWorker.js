import axios from 'axios';
import { moderateText } from './moderationEngine.js';
import {
  Rating,
  Comment,
  Playlist,
  ModerationReport,
} from '../models/models.js';
import { getRedis } from '../cache.js';
import { getRateLimitStatus } from './rateLimit.js';
import logger from '../../logger.js';

export async function processModeration(reportId) {
  const redis = getRedis();
  const lockKey = `moderation:lock:${reportId}`;

  const lock = await redis.set(lockKey, '1', 'NX', 'EX', 30);
  if (!lock) {
    logger.info(`Moderation ${reportId} already being processed`);
    return;
  }

  try {
    const report = await ModerationReport.findById(reportId);
    if (!report || report.state !== 'Checking') {
      logger.info(`Moderation ${reportId} not in Checking state`);
      return;
    }

    let target = null;
    let content = null;
    let contentType = null;
    let contentId = null;

    if (report.commentId) {
      target = await Comment.findById(report.commentId);
      content = target?.text;
      contentType = 'comment';
      contentId = report.commentId;
    } else if (report.ratingId) {
      target = await Rating.findById(report.ratingId);
      content = target?.comment;
      contentType = 'rating';
      contentId = report.ratingId;
    } else if (report.playlistId) {
      target = await Playlist.findById(report.playlistId);
      content = target
        ? `Título: ${target.name}\nDescripción: ${target.description || ''}`
        : null;
      contentType = 'playlist';
      contentId = report.playlistId;
    }

    if (!target || !content) {
      report.state = 'Accepted';
      await report.save();
      logger.info(
        `Moderation ${reportId} marked as Accepted (content deleted)`
      );
      return;
    }

    const result = await moderateText(content, contentId, contentType);

    if (result.verdict === 'pending') {
      logger.warn(
        `Moderation ${reportId} pending: ${result.reason || 'unknown'}`
      );
      return;
    }

    if (result.verdict === 'safe') {
      report.state = 'Rejected';
      await report.save();
      logger.info(
        `Moderation ${reportId} rejected (content is safe)${
          result.cached ? ' [cached]' : ''
        }`
      );
    } else {
      const stillExists = await target.constructor.findById(target._id);

      if (stillExists) {
        await stillExists.deleteOne();
        logger.info(
          `Deleted ${contentType} ${contentId} due to moderation verdict: ${result.verdict}`
        );
      }

      report.state = 'Accepted';
      await report.save();

      const acceptedCount = await ModerationReport.countDocuments({
        authorId: report.authorId,
        state: 'Accepted',
      });

      if (acceptedCount >= 5) {
        try {
          const deleteUrl = `${process.env.AUTH_SERVICE_URL}${report.authorId}`;

          await axios.delete(deleteUrl, {
            headers: {
              'x-internal-api-key': process.env.INTERNAL_API_KEY,
            },
            timeout: 30000,
          });

          logger.warn(
            `User ${report.authorId} deleted after reaching ${acceptedCount} accepted moderation reports`
          );
        } catch (err) {
          logger.error(
            `Failed to delete user ${report.authorId} after moderation threshold`,
            err.response?.data || err.message
          );
        }
      }

      logger.info(
        `Moderation ${reportId} accepted (content removed)${result.cached ? ' [cached]' : ''}`
      );
    }
  } catch (error) {
    logger.error(`Error processing moderation ${reportId}:`, error);
    throw error;
  } finally {
    await redis.del(lockKey);
  }
}

export async function retryPendingModerations() {
  const redis = getRedis();

  try {
    const status = await getRateLimitStatus(redis);

    if (status) {
      logger.info(
        `Starting retry with ${status.daily.available}/${status.daily.limit} daily requests available`
      );

      if (status.daily.available < 3) {
        logger.warn(
          'Aborting retry: insufficient daily quota (< 3 requests remaining)'
        );
        return;
      }
    }

    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);

    const pendingReports = await ModerationReport.find({
      state: 'Checking',
      createdAt: { $lt: threeMinutesAgo },
    })
      .sort({ createdAt: 1 })
      .limit(20);

    if (pendingReports.length === 0) {
      logger.info('No pending moderations to retry');
      return;
    }

    logger.info(
      `Retrying ${pendingReports.length} pending moderations (older than 3 minutes)`
    );

    const delayBetweenRequests = 5000;

    let processedCount = 0;
    let skippedCount = 0;

    for (const report of pendingReports) {
      const currentStatus = await getRateLimitStatus(redis);
      if (currentStatus && currentStatus.daily.available < 1) {
        logger.warn(
          `Stopping retry: daily quota exhausted after ${processedCount} reports`
        );
        skippedCount = pendingReports.length - processedCount;
        break;
      }

      setImmediate(() => processModeration(report._id));
      processedCount++;
      if (processedCount < pendingReports.length) {
        await new Promise((resolve) =>
          setTimeout(resolve, delayBetweenRequests)
        );
      }
    }

    logger.info(
      `Retry completed: ${processedCount} queued, ${skippedCount} skipped`
    );
  } catch (error) {
    logger.error('Error retrying pending moderations:', error);
  }
}

export async function getPendingModerationStats() {
  try {
    const total = await ModerationReport.countDocuments({ state: 'Checking' });

    const oldPending = await ModerationReport.countDocuments({
      state: 'Checking',
      createdAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) },
    });

    return {
      total,
      oldPending,
      recentPending: total - oldPending,
    };
  } catch (error) {
    logger.error('Error getting pending moderation stats:', error);
    return null;
  }
}
