import mongoose from 'mongoose';
import { Rating } from '../models/models.js';

class RatingService {
  async createBeatRating({ beatId, userId, score, comment }) {
    try {
      if (!mongoose.Types.ObjectId.isValid(beatId)) {
        const status = 404;
        const message = 'Beat not found';
        throw { status, message };
      }

      // TODO: check if beat exists in DB (404 if not found)

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

      const rating = new Rating({
        playlistId,
        userId,
        score,
        comment,
      });

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
}

export default new RatingService();
