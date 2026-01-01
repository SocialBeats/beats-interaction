import mongoose from 'mongoose';
import {
  Comment,
  UserMaterialized,
  BeatMaterialized,
  Playlist,
} from '../models/models.js';
import { isKafkaEnabled } from './kafkaConsumer.js';

class CommentService {
  async createBeatComment({ beatId, authorId, text }) {
    try {
      if (!mongoose.Types.ObjectId.isValid(beatId)) {
        const status = 404;
        const message = 'Beat not found';
        throw { status, message };
      }

      // check author and beat existence only if kafka is enabled
      let author = null;
      if (isKafkaEnabled()) {
        author = await UserMaterialized.findOne({ userId: authorId });
        if (!author) {
          throw {
            status: 422,
            message: 'authorId must correspond to an existing user',
          };
        }

        const beatExists = await BeatMaterialized.findOne({ beatId: beatId });
        if (!beatExists) {
          throw { status: 404, message: 'Beat not found' };
        }
      }

      const comment = new Comment({
        beatId,
        authorId,
        text,
      });

      await comment.validate();
      await comment.save();

      comment.author = author;

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

      // check author existence only if kafka is enabled
      let author = null;
      if (isKafkaEnabled()) {
        author = await UserMaterialized.findOne({ userId: authorId });
        if (!author) {
          throw {
            status: 422,
            message: 'authorId must correspond to an existing user',
          };
        }
      }

      // comment model validation will ensure to check if playlist exists and if playlist is public
      const comment = new Comment({
        playlistId,
        authorId,
        text,
      });

      await comment.validate();
      await comment.save();

      comment.author = author;

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

      let author = null;
      if (isKafkaEnabled()) {
        author = await UserMaterialized.findOne({ userId: comment.authorId });
        if (!author) {
          throw {
            status: 422,
            message: 'authorId must correspond to an existing user',
          };
        }
      }

      comment.author = author;

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

      // check beat existence only if kafka is enabled
      if (isKafkaEnabled()) {
        const beatExists = await BeatMaterialized.findOne({ beatId: beatId });
        if (!beatExists) {
          throw { status: 404, message: 'Beat not found' };
        }
      }

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

      let comments = await Comment.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit);

      comments = comments.map((comment) => {
        comment.author = null;
        return comment;
      });

      // if Kafka is enabled, try to enrich with materialized user data in one query
      if (isKafkaEnabled() && comments.length > 0) {
        const authorIds = [
          ...new Set(comments.map((c) => c.authorId.toString())),
        ];

        const authors = await UserMaterialized.find({
          userId: { $in: authorIds },
        }).lean();

        const authorMap = new Map(authors.map((a) => [a.userId.toString(), a]));

        comments = comments.map((comment) => {
          comment.author = authorMap.get(comment.authorId.toString()) ?? null;
          return comment;
        });
      }

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

      // check playlist existence
      const playlistExists = await Playlist.findById(playlistId);
      if (!playlistExists) {
        throw { status: 404, message: 'Playlist not found' };
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

      let comments = await Comment.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit);

      comments = comments.map((comment) => {
        comment.author = null;
        return comment;
      });

      if (isKafkaEnabled() && comments.length > 0) {
        const authorIds = [
          ...new Set(comments.map((c) => c.authorId.toString())),
        ];

        const authors = await UserMaterialized.find({
          userId: { $in: authorIds },
        }).lean();

        const authorMap = new Map(authors.map((a) => [a.userId.toString(), a]));

        comments = comments.map((comment) => {
          comment.author = authorMap.get(comment.authorId.toString()) ?? null;
          return comment;
        });
      }

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
        return { deleted: false };
      }

      const comment = await Comment.findById(commentId);

      if (!comment) {
        return { deleted: false };
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

      let author = null;
      if (isKafkaEnabled()) {
        author = await UserMaterialized.findOne({ userId: comment.authorId });
        if (!author) {
          throw {
            status: 422,
            message: 'authorId must correspond to an existing user',
          };
        }
      }

      comment.author = author;

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
