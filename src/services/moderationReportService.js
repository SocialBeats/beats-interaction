import mongoose from 'mongoose';
import {
  ModerationReport,
  Comment,
  Rating,
  Playlist,
} from '../models/models.js';

class ModerationReportService {
  async createCommentModerationReport({ commentId, userId }) {
    try {
      if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw { status: 404, message: 'Comment not found' };
      }

      const comment = await Comment.findById(commentId).select('authorId');
      if (!comment) {
        throw { status: 404, message: 'Comment not found' };
      }

      const report = new ModerationReport({
        commentId,
        userId,
        authorId: comment.authorId,
        // state defaults to 'Checking'
      });

      await report.validate();
      await report.save();

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

      if (err.status) throw err;
      throw err;
    }
  }

  async createRatingModerationReport({ ratingId, userId }) {
    try {
      if (!mongoose.Types.ObjectId.isValid(ratingId)) {
        throw { status: 404, message: 'Rating not found' };
      }

      const rating = await Rating.findById(ratingId).select('userId');
      if (!rating) {
        throw { status: 404, message: 'Rating not found' };
      }

      const report = new ModerationReport({
        ratingId,
        userId,
        authorId: rating.userId,
        // state defaults to 'Checking'
      });

      await report.validate();
      await report.save();

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

      if (err.status) throw err;
      throw err;
    }
  }

  async createPlaylistModerationReport({ playlistId, userId }) {
    try {
      if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw { status: 404, message: 'Playlist not found' };
      }

      const playlist = await Playlist.findById(playlistId).select('ownerId');
      if (!playlist) {
        throw { status: 404, message: 'Playlist not found' };
      }

      const report = new ModerationReport({
        playlistId,
        userId,
        authorId: playlist.ownerId,
        // state defaults to 'Checking'
      });

      await report.validate();
      await report.save();

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

      const reports = await ModerationReport.find({ authorId: userId }).sort({
        createdAt: -1,
      });

      return reports;
    } catch (err) {
      if (err.status) throw err;
      throw err;
    }
  }
}

export default new ModerationReportService();
