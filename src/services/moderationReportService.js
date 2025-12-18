import mongoose from 'mongoose';
import { ModerationReport, Comment } from '../models/models.js';

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
}

export default new ModerationReportService();
