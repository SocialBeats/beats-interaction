import mongoose from 'mongoose';
import { Comment } from '../models/models.js';

class CommentService {
  async createBeatComment({ beatId, authorId, text }) {
    try {
      if (!mongoose.Types.ObjectId.isValid(beatId)) {
        const status = 404;
        const message = 'Beat not found';
        throw { status, message };
      }

      // TODO: check if beat exists in DB (404 if not found)

      const comment = new Comment({
        beatId,
        authorId,
        text,
      });

      await comment.validate();
      await comment.save();
      return comment;
    } catch (err) {
      if (err.name === 'ValidationError') {
        const message = Object.values(err.errors)
          .map((e) => e.message)
          .join(', ');
        const status = 422;
        throw { status, message };
      }

      if (err.status) {
        throw err;
      }

      throw err;
    }
  }
}

export default new CommentService();
