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

  async createPlaylistComment({ playlistId, authorId, text }) {
    try {
      if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        const status = 404;
        const message = 'Playlist not found';
        throw { status, message };
      }

      // Comment model validation will ensure to check if playlist exists and if playlist is public
      const comment = new Comment({
        playlistId,
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

      if (err.name === 'Error') {
        const status = 422;
        const message = err.message;
        throw { status, message };
      }

      if (err.status) {
        throw err;
      }

      throw err;
    }
  }

  async getCommentById({ commentId }) {
    try {
      if (!mongoose.Types.ObjectId.isValid(commentId)) {
        const status = 404;
        const message = 'Comment not found';
        throw { status, message };
      }

      const comment = await Comment.findById(commentId);

      if (!comment) {
        const status = 404;
        const message = 'Comment not found';
        throw { status, message };
      }

      return comment;
    } catch (err) {
      if (err.status) {
        throw err;
      }

      throw err;
    }
  }
}

export default new CommentService();
