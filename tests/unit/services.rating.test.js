import mongoose from 'mongoose';
import { describe, it, expect } from 'vitest';
import ratingService from '../../src/services/ratingService.js';
import { Rating } from '../../src/models/models.js';

describe('RatingService.createBeatRating', () => {
  const fakeUserId = new mongoose.Types.ObjectId();

  it('should create a rating with valid beatId, userId, score and comment', async () => {
    const beatId = new mongoose.Types.ObjectId();

    const rating = await ratingService.createBeatRating({
      beatId,
      userId: fakeUserId,
      score: 5,
      comment: 'Muy pro, master limpio.',
    });

    expect(rating).toBeDefined();
    expect(rating._id).toBeDefined();
    expect(rating.beatId.toString()).toBe(beatId.toString());
    expect(rating.userId.toString()).toBe(fakeUserId.toString());
    expect(rating.score).toBe(5);
    expect(rating.comment).toBe('Muy pro, master limpio.');
    expect(rating.createdAt).toBeInstanceOf(Date);

    const inDb = await Rating.findById(rating._id);
    expect(inDb).not.toBeNull();
  });

  it('should throw 404 if beatId is not a valid ObjectId', async () => {
    await expect(
      ratingService.createBeatRating({
        beatId: 'not-a-valid-objectid',
        userId: fakeUserId,
        score: 4,
        comment: 'Test rating',
      })
    ).rejects.toMatchObject({
      status: 404,
      message: 'Beat not found',
    });
  });

  it('should throw 422 if the user has already rated this beat', async () => {
    const beatId = new mongoose.Types.ObjectId();

    await Rating.create({
      beatId,
      userId: fakeUserId,
      score: 3,
      comment: 'Existing rating',
    });

    await expect(
      ratingService.createBeatRating({
        beatId,
        userId: fakeUserId,
        score: 5,
        comment: 'Trying to rate again',
      })
    ).rejects.toMatchObject({
      status: 422,
      message: 'User has already rated this beat',
    });
  });

  it('should throw 422 if userId is missing (validation error)', async () => {
    const beatId = new mongoose.Types.ObjectId();

    await expect(
      ratingService.createBeatRating({
        beatId,
        userId: undefined,
        score: 4,
        comment: 'Missing userId',
      })
    ).rejects.toMatchObject({
      status: 422,
    });
  });

  it('should throw 422 if score is below minimum (1)', async () => {
    const beatId = new mongoose.Types.ObjectId();

    await expect(
      ratingService.createBeatRating({
        beatId,
        userId: fakeUserId,
        score: 0, // invalid
        comment: 'Too low score',
      })
    ).rejects.toMatchObject({
      status: 422,
    });
  });

  it('should throw 422 if score is above maximum (5)', async () => {
    const beatId = new mongoose.Types.ObjectId();

    await expect(
      ratingService.createBeatRating({
        beatId,
        userId: fakeUserId,
        score: 6, // invalid
        comment: 'Too high score',
      })
    ).rejects.toMatchObject({
      status: 422,
    });
  });

  it('should throw 422 if comment exceeds maxlength', async () => {
    const beatId = new mongoose.Types.ObjectId();
    const longComment = 'a'.repeat(201); // maxlength 200

    await expect(
      ratingService.createBeatRating({
        beatId,
        userId: fakeUserId,
        score: 4,
        comment: longComment,
      })
    ).rejects.toMatchObject({
      status: 422,
    });
  });

  it('should rethrow non-validation, non-status errors (e.g. DB error on save)', async () => {
    const beatId = new mongoose.Types.ObjectId();
    const originalSave = Rating.prototype.save;

    Rating.prototype.save = async function () {
      const error = new Error('Simulated DB error on Rating.save');
      error.name = 'SomeOtherError';
      throw error;
    };

    await expect(
      ratingService.createBeatRating({
        beatId,
        userId: fakeUserId,
        score: 5,
        comment: 'This will fail on save',
      })
    ).rejects.toHaveProperty('message', 'Simulated DB error on Rating.save');

    Rating.prototype.save = originalSave;
  });
});
