// src/services/moderationReportService.js
import mongoose from 'mongoose';
import {
  ModerationReport,
  Comment,
  Rating,
  Playlist,
  UserMaterialized,
} from '../models/models.js';
import { isKafkaEnabled } from './kafkaConsumer.js';
import { processModeration } from '../utils/moderationWorker.js';
import { isRedisEnabled } from '../cache.js';

async function checkExistingReport(query, contentType) {
  const existingReport = await ModerationReport.findOne({
    ...query,
    state: 'Checking',
  });

  if (existingReport) {
    throw {
      status: 409,
      message: `This ${contentType} has already been reported and is currently being reviewed`,
    };
  }
}

class ModerationReportService {
  async createCommentModerationReport({ commentId, userId }) {
    try {
      if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw { status: 404, message: 'Comment not found' };
      }

      let user = null;
      if (isKafkaEnabled()) {
        user = await UserMaterialized.findOne({ userId: userId });
        if (!user) {
          throw {
            status: 422,
            message: 'userId must correspond to an existing user',
          };
        }
      }

      const comment = await Comment.findById(commentId).select('authorId');
      if (!comment) {
        throw { status: 404, message: 'Comment not found' };
      }

      await checkExistingReport({ commentId }, 'comment');

      const report = new ModerationReport({
        commentId,
        userId,
        authorId: comment.authorId,
      });

      await report.validate();
      await report.save();
      if (isRedisEnabled()) {
        setImmediate(() => processModeration(report._id));
      }
      return report;
    } catch (err) {
      if (err.name === 'ValidationError') {
        const message = Object.values(err.errors)
          .map((e) => e.message)
          .join(', ');
        throw { status: 422, message };
      }

      if (err.name === 'Error') {
        throw { status: 422, message: err.message };
      }

      if (err.code === 11000) {
        throw {
          status: 409,
          message:
            'This comment has already been reported and is currently being reviewed',
        };
      }

      if (err.status) throw err;
      throw err;
    }
  }

  async createRatingModerationReport({ ratingId, userId }) {
    try {
      if (!mongoose.Types.ObjectId.isValid(ratingId)) {
        throw { status: 404, message: 'Rating not found' };
      }

      let user = null;
      if (isKafkaEnabled()) {
        user = await UserMaterialized.findOne({ userId: userId });
        if (!user) {
          throw {
            status: 422,
            message: 'userId must correspond to an existing user',
          };
        }
      }

      const rating = await Rating.findById(ratingId).select('userId');
      if (!rating) {
        throw { status: 404, message: 'Rating not found' };
      }

      await checkExistingReport({ ratingId }, 'rating');

      const report = new ModerationReport({
        ratingId,
        userId,
        authorId: rating.userId,
      });

      await report.validate();
      await report.save();

      if (isRedisEnabled()) {
        setImmediate(() => processModeration(report._id));
      }

      return report;
    } catch (err) {
      if (err.name === 'ValidationError') {
        const message = Object.values(err.errors)
          .map((e) => e.message)
          .join(', ');
        throw { status: 422, message };
      }

      if (err.name === 'Error') {
        throw { status: 422, message: err.message };
      }

      if (err.code === 11000) {
        throw {
          status: 409,
          message:
            'This rating has already been reported and is currently being reviewed',
        };
      }

      if (err.status) throw err;
      throw err;
    }
  }

  async createPlaylistModerationReport({ playlistId, userId }) {
    try {
      if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw { status: 404, message: 'Playlist not found' };
      }

      let user = null;
      if (isKafkaEnabled()) {
        user = await UserMaterialized.findOne({ userId: userId });
        if (!user) {
          throw {
            status: 422,
            message: 'userId must correspond to an existing user',
          };
        }
      }

      const playlist = await Playlist.findById(playlistId).select('ownerId');
      if (!playlist) {
        throw { status: 404, message: 'Playlist not found' };
      }

      await checkExistingReport({ playlistId }, 'playlist');

      const report = new ModerationReport({
        playlistId,
        userId,
        authorId: playlist.ownerId,
      });

      await report.validate();
      await report.save();

      if (isRedisEnabled()) {
        setImmediate(() => processModeration(report._id));
      }

      return report;
    } catch (err) {
      if (err.name === 'ValidationError') {
        const message = Object.values(err.errors)
          .map((e) => e.message)
          .join(', ');
        throw { status: 422, message };
      }

      if (err.name === 'Error') {
        throw { status: 422, message: err.message };
      }

      if (err.code === 11000) {
        throw {
          status: 409,
          message:
            'This playlist has already been reported and is currently being reviewed',
        };
      }

      if (err.status) throw err;
      throw err;
    }
  }

  async getModerationReportById({ moderationReportId }) {
    try {
      if (!mongoose.Types.ObjectId.isValid(moderationReportId)) {
        throw { status: 404, message: 'Moderation report not found' };
      }

      const report = await ModerationReport.findById(moderationReportId);
      if (!report) {
        throw { status: 404, message: 'Moderation report not found' };
      }

      return report;
    } catch (err) {
      if (err.status) throw err;
      throw err;
    }
  }

  async getModerationReportsByUser({ userId }) {
    try {
      // check author existence only if kafka is enabled
      let user = null;
      if (isKafkaEnabled()) {
        user = await UserMaterialized.findOne({ userId: userId });
        if (!user) {
          throw {
            status: 422,
            message: 'userId must correspond to an existing user',
          };
        }
      }

      const reports = await ModerationReport.find({ authorId: userId }).sort({
        createdAt: -1,
      });
      return reports;
    } catch (err) {
      throw err;
    }
  }

  async getModerationReportsByUserId({ userId }) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw { status: 404, message: 'User not found' };
      }

      // check author existence only if kafka is enabled
      let user = null;
      if (isKafkaEnabled()) {
        user = await UserMaterialized.findOne({ userId: userId });
        if (!user) {
          throw {
            status: 422,
            message: 'userId must correspond to an existing user',
          };
        }
      }

      const reports = await ModerationReport.find({ authorId: userId }).sort({
        createdAt: -1,
      });

      return reports;
    } catch (err) {
      if (err.status) throw err;
      throw err;
    }
  }

  async getAllModerationReports() {
    try {
      const reports = await ModerationReport.find({}).sort({ createdAt: -1 });
      return reports;
    } catch (err) {
      throw err;
    }
  }
}

export default new ModerationReportService();
