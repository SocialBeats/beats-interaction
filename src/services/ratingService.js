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
}

export default new RatingService();
