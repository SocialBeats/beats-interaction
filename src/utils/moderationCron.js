import cron from 'node-cron';
import { retryPendingModerations } from './moderationWorker.js';
import { isRedisEnabled } from '../cache.js';
import { getRateLimitStatus } from './rateLimit.js';
import { getRedis } from '../cache.js';
import logger from '../../logger.js';

let moderationCron = null;

export function startModerationCron() {
  if (!isRedisEnabled()) {
    logger.info('Redis disabled, moderation cron will not start');
    return;
  }

  if (moderationCron) {
    logger.info('Moderation cron already running');
    return;
  }

  moderationCron = cron.schedule('*/10 * * * *', async () => {
    logger.info('Running moderation retry cron');

    try {
      const redis = getRedis();
      const status = await getRateLimitStatus(redis);

      if (status) {
        logger.info(
          `Rate limit status - RPM: ${status.rpm.available}/${status.rpm.limit}, Daily: ${status.daily.available}/${status.daily.limit}`
        );

        if (status.daily.available < 5) {
          logger.warn(
            'Skipping moderation retry: daily quota too low (< 5 requests remaining)'
          );
          return;
        }

        if (status.rpm.available === 0) {
          logger.warn('Skipping moderation retry: RPM limit reached');
          return;
        }
      }

      await retryPendingModerations();
    } catch (error) {
      logger.error('Error in moderation cron:', error);
    }
  });

  logger.info('Moderation retry cron started (runs every 10 minutes)');
}

export function pauseModerationCron() {
  if (moderationCron) {
    moderationCron.stop();
    logger.info('Moderation cron paused');
  }
}

export function resumeModerationCron() {
  if (moderationCron) {
    moderationCron.start();
    logger.info('Moderation cron resumed');
  }
}

export function stopModerationCron() {
  if (moderationCron) {
    moderationCron.stop();
    moderationCron = null;
    logger.info('Moderation cron stopped and destroyed');
  }
}

export async function runModerationRetryNow() {
  if (!isRedisEnabled()) {
    throw new Error('Redis must be enabled to run moderation retry');
  }

  logger.info('Manual moderation retry triggered');

  try {
    const redis = getRedis();
    const status = await getRateLimitStatus(redis);

    if (status && status.daily.available < 1) {
      throw new Error('Daily quota exhausted');
    }

    await retryPendingModerations();
    logger.info('Manual moderation retry completed');
  } catch (error) {
    logger.error('Error in manual moderation retry:', error);
    throw error;
  }
}
