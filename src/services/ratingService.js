import mongoose from 'mongoose';
import {
  Rating,
  UserMaterialized,
  BeatMaterialized,
} from '../models/models.js';
import { isKafkaEnabled } from './kafkaConsumer.js';

class RatingService {
  async createBeatRating({ beatId, userId, score, comment }) {
    try {
      if (!mongoose.Types.ObjectId.isValid(beatId)) {
        const status = 404;
        const message = 'Beat not found';
        throw { status, message };
      }

      // check user and beat existence only if kafka is enabled
      let user = null;
      if (isKafkaEnabled()) {
        user = await UserMaterialized.findById(userId);
        if (!user) {
          throw {
            status: 422,
            message: 'userId must correspond to an existing user',
          };
        }

        const beatExists = await BeatMaterialized.findById(beatId);
        if (!beatExists) {
          throw { status: 404, message: 'Beat not found' };
        }
      }

      // check if user has already rated this beat
      const existing = await Rating.findOne({ beatId, userId });
      if (existing) {
        const status = 422;
        const message = 'User has already rated this beat';
        throw { status, message };
      }

      const rating = new Rating({
        beatId,
        userId,
        score,
        comment,
      });

      await rating.validate();
      await rating.save();

      rating.user = user;

      return rating;
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

  async createPlaylistRating({ playlistId, userId, score, comment }) {
    try {
      if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        const status = 404;
        const message = 'Playlist not found';
        throw { status, message };
      }

      const existing = await Rating.findOne({ playlistId, userId });
      if (existing) {
        const status = 422;
        const message = 'User has already rated this playlist';
        throw { status, message };
      }

      // check user existence only if kafka is enabled
      let user = null;
      if (isKafkaEnabled()) {
        user = await UserMaterialized.findById(userId);
        if (!user) {
          throw {
            status: 422,
            message: 'userId must correspond to an existing user',
          };
        }
      }

      const rating = new Rating({
        playlistId,
        userId,
        score,
        comment,
      });

      await rating.validate();
      await rating.save();

      rating.user = user;

      return rating;
    } catch (err) {
      if (err.name === 'ValidationError') {
        const message = Object.values(err.errors)
          .map((e) => e.message)
          .join(', ');
        const status = 422;
        throw { status, message };
      }
      // errors thrown from pre-validate hooks (e.g., playlist not found or not public)
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

  async getRatingById({ ratingId }) {
    try {
      if (!mongoose.Types.ObjectId.isValid(ratingId)) {
        const status = 404;
        const message = 'Rating not found';
        throw { status, message };
      }

      const rating = await Rating.findById(ratingId);

      if (!rating) {
        const status = 404;
        const message = 'Rating not found';
        throw { status, message };
      }

      let user = null;
      if (isKafkaEnabled()) {
        user = await UserMaterialized.findById(rating.userId);
        if (!user) {
          throw {
            status: 422,
            message: 'userId must correspond to an existing user',
          };
        }
      }

      rating.user = user;

      return rating;
    } catch (err) {
      if (err.status) {
        throw err;
      }

      throw err;
    }
  }

  async getMyBeatRating({ beatId, userId }) {
    try {
      if (!mongoose.Types.ObjectId.isValid(beatId)) {
        const status = 404;
        const message = 'Beat not found';
        throw { status, message };
      }

      // TODO: check beat existence via Beats microservice

      const rating = await Rating.findOne({ beatId, userId });

      if (!rating) {
        const status = 404;
        const message = 'Rating not found';
        throw { status, message };
      }

      return rating;
    } catch (err) {
      if (err.status) {
        throw err;
      }

      throw err;
    }
  }

  async getMyPlaylistRating({ playlistId, userId }) {
    try {
      if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        const status = 404;
        const message = 'Playlist not found';
        throw { status, message };
      }

      const rating = await Rating.findOne({ playlistId, userId });

      if (!rating) {
        const status = 404;
        const message = 'Rating not found';
        throw { status, message };
      }

      return rating;
    } catch (err) {
      if (err.status) {
        throw err;
      }

      throw err;
    }
  }

  async listBeatRatings({ beatId, page = 1, limit = 20 }) {
    try {
      if (!mongoose.Types.ObjectId.isValid(beatId)) {
        const status = 404;
        const message = 'Beat not found';
        throw { status, message };
      }

      // TODO: check if beat exists in DB (404 if not found)

      page = Number(page);
      limit = Number(limit);

      if (!Number.isInteger(page) || page < 1) page = 1;
      if (!Number.isInteger(limit) || limit < 1) limit = 20;
      if (limit > 100) limit = 100;

      const beatObjectId = new mongoose.Types.ObjectId(beatId);
      const match = { beatId: beatObjectId };

      const [stats] = await Rating.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            average: { $avg: '$score' },
          },
        },
      ]);

      const count = stats ? stats.count : 0;
      const average = stats ? stats.average : 0;

      const maxPage = Math.max(1, Math.ceil(count / limit));
      if (page > maxPage) page = maxPage;

      const skip = (page - 1) * limit;

      const ratings = await Rating.find(match)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return {
        data: ratings,
        average,
        count,
        page,
        limit,
      };
    } catch (err) {
      if (err.status) {
        throw err;
      }
      throw err;
    }
  }

  async listPlaylistRatings({ playlistId, page = 1, limit = 20 }) {
    try {
      if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        const status = 404;
        const message = 'Playlist not found';
        throw { status, message };
      }

      page = Number(page);
      limit = Number(limit);

      if (!Number.isInteger(page) || page < 1) page = 1;
      if (!Number.isInteger(limit) || limit < 1) limit = 20;
      if (limit > 100) limit = 100;

      const playlistObjectId = new mongoose.Types.ObjectId(playlistId);
      const match = { playlistId: playlistObjectId };

      const [stats] = await Rating.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            average: { $avg: '$score' },
          },
        },
      ]);

      const count = stats ? stats.count : 0;
      const average = stats ? stats.average : 0;

      const maxPage = Math.max(1, Math.ceil(count / limit));
      if (page > maxPage) page = maxPage;

      const skip = (page - 1) * limit;

      const ratings = await Rating.find(match)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return {
        data: ratings,
        average,
        count,
        page,
        limit,
      };
    } catch (err) {
      if (err.status) {
        throw err;
      }
      throw err;
    }
  }

  async deleteRating({ ratingId, userId }) {
    try {
      if (!mongoose.Types.ObjectId.isValid(ratingId)) {
        return { deleted: false };
      }

      const rating = await Rating.findById(ratingId);

      if (!rating) {
        return { deleted: false };
      }

      if (rating.userId.toString() !== userId.toString()) {
        const status = 401;
        const message = 'You are not allowed to delete this rating.';
        throw { status, message };
      }

      await Rating.deleteOne({ _id: ratingId });
      return { deleted: true };
    } catch (err) {
      if (err.status) {
        throw err;
      }
      throw err;
    }
  }

  async updateRatingById({ ratingId, userId, score, comment }) {
    try {
      if (!mongoose.Types.ObjectId.isValid(ratingId)) {
        const status = 404;
        const message = 'Rating not found';
        throw { status, message };
      }

      const rating = await Rating.findById(ratingId);

      if (!rating) {
        const status = 404;
        const message = 'Rating not found';
        throw { status, message };
      }

      if (rating.userId.toString() !== userId.toString()) {
        const status = 401;
        const message = 'You are not allowed to edit this rating.';
        throw { status, message };
      }

      rating.score = score;
      if (comment !== undefined) {
        rating.comment = comment;
      }

      await rating.validate();
      await rating.save();
      return rating;
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

export default new RatingService();
