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

      // comment model validation will ensure to check if playlist exists and if playlist is public
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

  async listBeatComments({ beatId, page = 1, limit = 20 }) {
    try {
      if (!mongoose.Types.ObjectId.isValid(beatId)) {
        const status = 404;
        const message = 'Beat not found';
        throw { status, message };
      }

      // TODO: check if beat exists in DB (404 if not found)

      // parameter normalization
      page = Number(page);
      limit = Number(limit);

      if (!Number.isInteger(page) || page < 1) page = 1;
      if (!Number.isInteger(limit) || limit < 1) limit = 20;
      if (limit > 100) limit = 100; // reasonable maximum

      const filter = { beatId };

      const total = await Comment.countDocuments(filter);

      // if total is 0, maxPage should be 1
      const maxPage = Math.max(1, Math.ceil(total / limit));

      // if page > maxPage, use the last page
      if (page > maxPage) page = maxPage;

      const skip = (page - 1) * limit;

      const comments = await Comment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return {
        data: comments,
        page,
        limit,
        total,
      };
    } catch (err) {
      if (err.status) {
        throw err;
      }

      throw err;
    }
  }

  async listPlaylistComments({ playlistId, page = 1, limit = 20 }) {
    try {
      if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        const status = 404;
        const message = 'Playlist not found';
        throw { status, message };
      }

      // parameter normalization
      page = Number(page);
      limit = Number(limit);

      if (!Number.isInteger(page) || page < 1) page = 1;
      if (!Number.isInteger(limit) || limit < 1) limit = 20;
      if (limit > 100) limit = 100; // reasonable maximum

      const filter = { playlistId };

      const total = await Comment.countDocuments(filter);

      const maxPage = Math.max(1, Math.ceil(total / limit));

      if (page > maxPage) page = maxPage;

      const skip = (page - 1) * limit;

      const comments = await Comment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return {
        data: comments,
        page,
        limit,
        total,
      };
    } catch (err) {
      if (err.status) {
        throw err;
      }

      throw err;
    }
  }

  async deleteCommentById(commentId, userId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(commentId)) {
        return { deleted: false }; // idempotente
      }

      const comment = await Comment.findById(commentId);

      if (!comment) {
        return { deleted: false }; // idempotente
      }

      if (comment.authorId.toString() !== userId.toString()) {
        const status = 401;
        const message = 'You are not allowed to delete this comment.';
        throw { status, message };
      }

      await Comment.deleteOne({ _id: commentId });

      return { deleted: true };
    } catch (err) {
      if (err.status) {
        throw err;
      }
      throw err;
    }
  }

  async updateCommentText({ commentId, userId, text }) {
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

      if (comment.authorId.toString() !== userId.toString()) {
        const status = 401;
        const message = 'You are not allowed to edit this comment.';
        throw { status, message };
      }

      comment.text = text;

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
