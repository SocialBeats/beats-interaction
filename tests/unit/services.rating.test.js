import mongoose from 'mongoose';
import { describe, it, expect } from 'vitest';
import ratingService from '../../src/services/ratingService.js';
import { Rating, Playlist } from '../../src/models/models.js';

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

describe('RatingService.createPlaylistRating', () => {
  const fakeUserId = new mongoose.Types.ObjectId();

  it('should create a rating on a public playlist', async () => {
    const playlist = await Playlist.create({
      name: 'Public playlist for ratings',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    const rating = await ratingService.createPlaylistRating({
      playlistId: playlist._id,
      userId: fakeUserId,
      score: 5,
      comment: 'Great playlist!',
    });

    expect(rating).toBeDefined();
    expect(rating._id).toBeDefined();
    expect(rating.playlistId.toString()).toBe(playlist._id.toString());
    expect(rating.userId.toString()).toBe(fakeUserId.toString());
    expect(rating.score).toBe(5);
    expect(rating.comment).toBe('Great playlist!');

    const saved = await Rating.findById(rating._id);
    expect(saved).not.toBeNull();
  });

  it('should throw 404 if playlistId is invalid', async () => {
    await expect(
      ratingService.createPlaylistRating({
        playlistId: 'invalid-id',
        userId: fakeUserId,
        score: 4,
        comment: 'Test',
      })
    ).rejects.toMatchObject({
      status: 404,
      message: 'Playlist not found',
    });
  });

  it('should fail with 422 if playlist does not exist', async () => {
    const fakePlaylistId = new mongoose.Types.ObjectId();

    await expect(
      ratingService.createPlaylistRating({
        playlistId: fakePlaylistId,
        userId: fakeUserId,
        score: 4,
        comment: 'Hello',
      })
    ).rejects.toMatchObject({
      status: 422,
      message: 'The playlist being rated does not exist.',
    });
  });

  it('should fail with 422 if playlist is private', async () => {
    const playlist = await Playlist.create({
      name: 'Private playlist',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: false,
    });

    await expect(
      ratingService.createPlaylistRating({
        playlistId: playlist._id,
        userId: fakeUserId,
        score: 4,
        comment: 'Hello',
      })
    ).rejects.toMatchObject({
      status: 422,
      message: 'You cannot rate a private playlist.',
    });
  });

  it('should throw 422 if the user has already rated this playlist', async () => {
    const playlist = await Playlist.create({
      name: 'Already rated playlist',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    await Rating.create({
      playlistId: playlist._id,
      userId: fakeUserId,
      score: 3,
      comment: 'Existing rating',
    });

    await expect(
      ratingService.createPlaylistRating({
        playlistId: playlist._id,
        userId: fakeUserId,
        score: 5,
        comment: 'Trying to rate again',
      })
    ).rejects.toMatchObject({
      status: 422,
      message: 'User has already rated this playlist',
    });
  });

  it('should throw 422 if score is below minimum (1)', async () => {
    const playlist = await Playlist.create({
      name: 'Score low playlist',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    await expect(
      ratingService.createPlaylistRating({
        playlistId: playlist._id,
        userId: fakeUserId,
        score: 0,
        comment: 'Too low score',
      })
    ).rejects.toMatchObject({
      status: 422,
    });
  });

  it('should throw 422 if score is above maximum (5)', async () => {
    const playlist = await Playlist.create({
      name: 'Score high playlist',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    await expect(
      ratingService.createPlaylistRating({
        playlistId: playlist._id,
        userId: fakeUserId,
        score: 6,
        comment: 'Too high score',
      })
    ).rejects.toMatchObject({
      status: 422,
    });
  });

  it('should throw 422 if comment exceeds maxlength', async () => {
    const playlist = await Playlist.create({
      name: 'Long comment playlist',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    const longComment = 'a'.repeat(201); // maxlength 200

    await expect(
      ratingService.createPlaylistRating({
        playlistId: playlist._id,
        userId: fakeUserId,
        score: 4,
        comment: longComment,
      })
    ).rejects.toMatchObject({
      status: 422,
    });
  });

  it('should rethrow non-validation, non-status errors (e.g. DB error on save)', async () => {
    const playlist = await Playlist.create({
      name: 'Error playlist',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    const originalSave = Rating.prototype.save;

    Rating.prototype.save = async function () {
      const error = new Error('Simulated DB error for playlist rating');
      error.name = 'SomeOtherError';
      throw error;
    };

    await expect(
      ratingService.createPlaylistRating({
        playlistId: playlist._id,
        userId: fakeUserId,
        score: 5,
        comment: 'This will fail on save',
      })
    ).rejects.toHaveProperty(
      'message',
      'Simulated DB error for playlist rating'
    );

    Rating.prototype.save = originalSave;
  });
});

describe('RatingService.getMyBeatRating', () => {
  it('should return the rating when it exists for this beat and user', async () => {
    const beatId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

    const created = await Rating.create({
      beatId,
      userId,
      score: 4,
      comment: 'Existing rating',
    });

    const result = await ratingService.getMyBeatRating({
      beatId: beatId.toString(),
      userId: userId.toString(),
    });

    expect(result).toBeDefined();
    expect(result._id.toString()).toBe(created._id.toString());
    expect(result.beatId.toString()).toBe(beatId.toString());
    expect(result.userId.toString()).toBe(userId.toString());
    expect(result.score).toBe(4);
    expect(result.comment).toBe('Existing rating');
  });

  it('should throw 404 if beatId is not a valid ObjectId', async () => {
    const someUserId = new mongoose.Types.ObjectId().toString();

    await expect(
      ratingService.getMyBeatRating({
        beatId: 'not-a-valid-id',
        userId: someUserId,
      })
    ).rejects.toMatchObject({
      status: 404,
      message: 'Beat not found',
    });
  });

  it('should throw 404 if rating does not exist for this beat and user', async () => {
    const beatId = new mongoose.Types.ObjectId().toString();
    const userId = new mongoose.Types.ObjectId().toString();

    await expect(
      ratingService.getMyBeatRating({
        beatId,
        userId,
      })
    ).rejects.toMatchObject({
      status: 404,
      message: 'Rating not found',
    });
  });

  it('should rethrow unexpected errors (e.g. DB error on findOne)', async () => {
    const beatId = new mongoose.Types.ObjectId().toString();
    const userId = new mongoose.Types.ObjectId().toString();

    const originalFindOne = Rating.findOne;

    Rating.findOne = async () => {
      const err = new Error('Simulated DB error on findOne');
      err.name = 'SomeOtherError';
      throw err;
    };

    await expect(
      ratingService.getMyBeatRating({
        beatId,
        userId,
      })
    ).rejects.toHaveProperty('message', 'Simulated DB error on findOne');

    Rating.findOne = originalFindOne;
  });
});

describe('RatingService.getMyPlaylistRating', () => {
  it('should return the rating when it exists for this playlist and user', async () => {
    const playlistId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

    await Playlist.create({
      _id: playlistId,
      name: 'Playlist for getMyPlaylistRating',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    const insertResult = await Rating.collection.insertOne({
      playlistId,
      userId,
      score: 4,
      comment: 'Existing playlist rating',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await ratingService.getMyPlaylistRating({
      playlistId: playlistId.toString(),
      userId: userId.toString(),
    });

    expect(result).toBeDefined();
    expect(result._id.toString()).toBe(insertResult.insertedId.toString());
    expect(result.playlistId.toString()).toBe(playlistId.toString());
    expect(result.userId.toString()).toBe(userId.toString());
    expect(result.score).toBe(4);
    expect(result.comment).toBe('Existing playlist rating');
  });

  it('should throw 404 if playlistId is not a valid ObjectId', async () => {
    const someUserId = new mongoose.Types.ObjectId().toString();

    await expect(
      ratingService.getMyPlaylistRating({
        playlistId: 'not-a-valid-id',
        userId: someUserId,
      })
    ).rejects.toMatchObject({
      status: 404,
      message: 'Playlist not found',
    });
  });

  it('should throw 404 if rating does not exist for this playlist and user', async () => {
    const playlistId = new mongoose.Types.ObjectId().toString();
    const userId = new mongoose.Types.ObjectId().toString();

    await expect(
      ratingService.getMyPlaylistRating({
        playlistId,
        userId,
      })
    ).rejects.toMatchObject({
      status: 404,
      message: 'Rating not found',
    });
  });

  it('should rethrow unexpected errors (e.g. DB error on findOne)', async () => {
    const playlistId = new mongoose.Types.ObjectId().toString();
    const userId = new mongoose.Types.ObjectId().toString();

    const originalFindOne = Rating.findOne;

    Rating.findOne = async () => {
      const err = new Error('Simulated DB error on findOne (playlist)');
      err.name = 'SomeOtherError';
      throw err;
    };

    await expect(
      ratingService.getMyPlaylistRating({
        playlistId,
        userId,
      })
    ).rejects.toHaveProperty(
      'message',
      'Simulated DB error on findOne (playlist)'
    );

    Rating.findOne = originalFindOne;
  });
});
