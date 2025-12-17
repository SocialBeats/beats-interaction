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

describe('RatingService.getRatingById', () => {
  it('should return the rating when it exists', async () => {
    const beatId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

    const created = await Rating.create({
      beatId,
      userId,
      score: 4,
      comment: 'Rating to fetch',
    });

    const result = await ratingService.getRatingById({
      ratingId: created._id.toString(),
    });

    expect(result).toBeDefined();
    expect(result._id.toString()).toBe(created._id.toString());
    expect(result.beatId.toString()).toBe(beatId.toString());
    expect(result.userId.toString()).toBe(userId.toString());
    expect(result.score).toBe(4);
    expect(result.comment).toBe('Rating to fetch');
  });

  it('should throw 404 if ratingId is not a valid ObjectId', async () => {
    await expect(
      ratingService.getRatingById({ ratingId: 'not-a-valid-id' })
    ).rejects.toMatchObject({
      status: 404,
      message: 'Rating not found',
    });
  });

  it('should throw 404 if rating does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    await expect(
      ratingService.getRatingById({ ratingId: fakeId })
    ).rejects.toMatchObject({
      status: 404,
      message: 'Rating not found',
    });
  });

  it('should rethrow unexpected errors (e.g. DB error on findById)', async () => {
    const originalFindById = Rating.findById;

    Rating.findById = async () => {
      const err = new Error('Simulated DB error on Rating.findById');
      err.name = 'SomeOtherError';
      throw err;
    };

    const someId = new mongoose.Types.ObjectId().toString();

    await expect(
      ratingService.getRatingById({ ratingId: someId })
    ).rejects.toHaveProperty(
      'message',
      'Simulated DB error on Rating.findById'
    );

    Rating.findById = originalFindById;
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

describe('RatingService.listBeatRatings', () => {
  it('should list ratings for a beat with correct average, count and default pagination', async () => {
    const beatId = new mongoose.Types.ObjectId();
    const otherBeatId = new mongoose.Types.ObjectId();

    const user1 = new mongoose.Types.ObjectId();
    const user2 = new mongoose.Types.ObjectId();
    const otherUser = new mongoose.Types.ObjectId();

    await Rating.insertMany([
      {
        beatId,
        userId: user1,
        score: 4,
        comment: 'Good but bassy',
      },
      {
        beatId,
        userId: user2,
        score: 5,
        comment: 'Perfect',
      },
      {
        beatId: otherBeatId,
        userId: otherUser,
        score: 1,
        comment: 'Other beat rating',
      },
    ]);

    const result = await ratingService.listBeatRatings({
      beatId: beatId.toString(),
    });

    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);

    expect(result.count).toBe(2);
    expect(result.average).toBeCloseTo(4.5);

    expect(result.data).toHaveLength(2);
    result.data.forEach((r) => {
      expect(r.beatId.toString()).toBe(beatId.toString());
      expect([user1.toString(), user2.toString()]).toContain(
        r.userId.toString()
      );
    });
  });

  it('should return empty data, average 0, count 0 and default pagination when there are no ratings', async () => {
    const beatId = new mongoose.Types.ObjectId();

    const result = await ratingService.listBeatRatings({
      beatId: beatId.toString(),
    });

    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.count).toBe(0);
    expect(result.average).toBe(0);
    expect(result.data).toEqual([]);
  });

  it('should throw 404 if beatId is not a valid ObjectId', async () => {
    await expect(
      ratingService.listBeatRatings({ beatId: 'not-a-valid-id' })
    ).rejects.toMatchObject({
      status: 404,
      message: 'Beat not found',
    });
  });

  it('should rethrow unexpected errors (e.g. DB error in Rating.aggregate)', async () => {
    const beatId = new mongoose.Types.ObjectId().toString();

    const originalAggregate = Rating.aggregate;

    Rating.aggregate = async () => {
      const err = new Error('Simulated Rating.aggregate error');
      err.name = 'SomeOtherError';
      throw err;
    };

    await expect(
      ratingService.listBeatRatings({ beatId })
    ).rejects.toHaveProperty('message', 'Simulated Rating.aggregate error');

    Rating.aggregate = originalAggregate;
  });
});

describe('RatingService.listPlaylistRatings', () => {
  it('should list ratings for a playlist with correct average, count and default pagination', async () => {
    const playlist = await Playlist.create({
      name: 'Playlist for ratings',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    const otherPlaylist = await Playlist.create({
      name: 'Other playlist',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    const user1 = new mongoose.Types.ObjectId();
    const user2 = new mongoose.Types.ObjectId();
    const otherUser = new mongoose.Types.ObjectId();

    await Rating.insertMany([
      {
        playlistId: playlist._id,
        userId: user1,
        score: 4,
        comment: 'Muy buena selección',
      },
      {
        playlistId: playlist._id,
        userId: user2,
        score: 5,
        comment: 'Top playlist',
      },
      {
        playlistId: otherPlaylist._id,
        userId: otherUser,
        score: 1,
        comment: 'Other playlist rating',
      },
    ]);

    const result = await ratingService.listPlaylistRatings({
      playlistId: playlist._id.toString(),
    });

    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);

    expect(result.count).toBe(2);
    expect(result.average).toBeCloseTo(4.5);
    expect(result.data).toHaveLength(2);

    result.data.forEach((r) => {
      expect(r.playlistId.toString()).toBe(playlist._id.toString());
      expect([user1.toString(), user2.toString()]).toContain(
        r.userId.toString()
      );
    });
  });

  it('should return empty data, average 0, count 0 and default pagination when there are no ratings', async () => {
    const playlist = await Playlist.create({
      name: 'Playlist without ratings (listPlaylistRatings)',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    const result = await ratingService.listPlaylistRatings({
      playlistId: playlist._id.toString(),
    });

    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.count).toBe(0);
    expect(result.average).toBe(0);
    expect(result.data).toEqual([]);
  });

  it('should rethrow unexpected errors (e.g. DB error in Rating.aggregate)', async () => {
    const playlist = await Playlist.create({
      name: 'Playlist for aggregate error test',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    const playlistId = playlist._id.toString();

    const originalAggregate = Rating.aggregate;

    Rating.aggregate = async () => {
      const err = new Error('Simulated Rating.aggregate error (playlist)');
      err.name = 'SomeOtherError';
      throw err;
    };

    await expect(
      ratingService.listPlaylistRatings({ playlistId })
    ).rejects.toHaveProperty(
      'message',
      'Simulated Rating.aggregate error (playlist)'
    );

    Rating.aggregate = originalAggregate;
  });
});

describe('RatingService.deleteRating', () => {
  it('should delete rating if it exists and belongs to the user', async () => {
    const userId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();

    const created = await Rating.create({
      beatId,
      userId,
      score: 5,
      comment: 'Rating to delete',
    });

    const result = await ratingService.deleteRating({
      ratingId: created._id.toString(),
      userId: userId.toString(),
    });

    expect(result).toEqual({ deleted: true });

    const inDb = await Rating.findById(created._id);
    expect(inDb).toBeNull();
  });

  it('should return deleted:false if ratingId is not a valid ObjectId', async () => {
    const userId = new mongoose.Types.ObjectId();

    const result = await ratingService.deleteRating({
      ratingId: 'not-a-valid-id',
      userId: userId.toString(),
    });

    expect(result).toEqual({ deleted: false });
  });

  it('should return deleted:false if rating does not exist', async () => {
    const userId = new mongoose.Types.ObjectId();
    const fakeId = new mongoose.Types.ObjectId().toString();

    const result = await ratingService.deleteRating({
      ratingId: fakeId,
      userId: userId.toString(),
    });

    expect(result).toEqual({ deleted: false });
  });

  it('should throw 401 if rating exists but belongs to another user', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const otherUserId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();

    const created = await Rating.create({
      beatId,
      userId: ownerId,
      score: 3,
      comment: 'Not your rating',
    });

    await expect(
      ratingService.deleteRating({
        ratingId: created._id.toString(),
        userId: otherUserId.toString(),
      })
    ).rejects.toMatchObject({
      status: 401,
      message: 'You are not allowed to delete this rating.',
    });

    const stillThere = await Rating.findById(created._id);
    expect(stillThere).not.toBeNull();
  });

  it('should rethrow unexpected errors (e.g. DB error on deleteOne)', async () => {
    const userId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();

    const created = await Rating.create({
      beatId,
      userId,
      score: 4,
      comment: 'Rating to trigger delete error',
    });

    const originalDeleteOne = Rating.deleteOne;

    Rating.deleteOne = async () => {
      const err = new Error('Simulated deleteOne error (rating)');
      err.name = 'SomeOtherError';
      throw err;
    };

    await expect(
      ratingService.deleteRating({
        ratingId: created._id.toString(),
        userId: userId.toString(),
      })
    ).rejects.toHaveProperty('message', 'Simulated deleteOne error (rating)');

    Rating.deleteOne = originalDeleteOne;
  });
});

describe('RatingService.updateRatingById', () => {
  it('should update score and comment when rating exists and belongs to the user', async () => {
    const userId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();

    const created = await Rating.create({
      beatId,
      userId,
      score: 3,
      comment: 'Old comment',
    });

    const updated = await ratingService.updateRatingById({
      ratingId: created._id.toString(),
      userId: userId.toString(),
      score: 5,
      comment: 'New updated comment',
    });

    expect(updated).toBeDefined();
    expect(updated._id.toString()).toBe(created._id.toString());
    expect(updated.score).toBe(5);
    expect(updated.comment).toBe('New updated comment');

    const inDb = await Rating.findById(created._id);
    expect(inDb.score).toBe(5);
    expect(inDb.comment).toBe('New updated comment');
  });

  it('should throw 404 if ratingId is not a valid ObjectId', async () => {
    const userId = new mongoose.Types.ObjectId();

    await expect(
      ratingService.updateRatingById({
        ratingId: 'not-a-valid-id',
        userId: userId.toString(),
        score: 4,
        comment: 'Whatever',
      })
    ).rejects.toMatchObject({
      status: 404,
      message: 'Rating not found',
    });
  });

  it('should throw 404 if rating does not exist', async () => {
    const userId = new mongoose.Types.ObjectId();
    const fakeId = new mongoose.Types.ObjectId().toString();

    await expect(
      ratingService.updateRatingById({
        ratingId: fakeId,
        userId: userId.toString(),
        score: 4,
        comment: 'Whatever',
      })
    ).rejects.toMatchObject({
      status: 404,
      message: 'Rating not found',
    });
  });

  it('should throw 401 if rating belongs to another user', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const otherUserId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();

    const created = await Rating.create({
      beatId,
      userId: ownerId,
      score: 3,
      comment: 'Original comment',
    });

    await expect(
      ratingService.updateRatingById({
        ratingId: created._id.toString(),
        userId: otherUserId.toString(),
        score: 5,
        comment: 'Hacked comment',
      })
    ).rejects.toMatchObject({
      status: 401,
      message: 'You are not allowed to edit this rating.',
    });

    const stillInDb = await Rating.findById(created._id);
    expect(stillInDb.score).toBe(3);
    expect(stillInDb.comment).toBe('Original comment');
  });

  it('should throw 422 if score is out of range', async () => {
    const userId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();

    const created = await Rating.create({
      beatId,
      userId,
      score: 3,
      comment: 'Valid comment',
    });

    await expect(
      ratingService.updateRatingById({
        ratingId: created._id.toString(),
        userId: userId.toString(),
        score: 6, // invalid (> 5)
        comment: 'New comment',
      })
    ).rejects.toMatchObject({
      status: 422,
    });

    const stillInDb = await Rating.findById(created._id);
    expect(stillInDb.score).toBe(3);
    expect(stillInDb.comment).toBe('Valid comment');
  });

  it('should throw 422 if comment exceeds maxlength', async () => {
    const userId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();
    const longComment = 'a'.repeat(201); // maxLength 200

    const created = await Rating.create({
      beatId,
      userId,
      score: 4,
      comment: 'Initial comment',
    });

    await expect(
      ratingService.updateRatingById({
        ratingId: created._id.toString(),
        userId: userId.toString(),
        score: 4,
        comment: longComment,
      })
    ).rejects.toMatchObject({
      status: 422,
    });

    const stillInDb = await Rating.findById(created._id);
    expect(stillInDb.comment).toBe('Initial comment');
  });

  it('should rethrow unexpected errors (e.g. DB error on save)', async () => {
    const userId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();

    const created = await Rating.create({
      beatId,
      userId,
      score: 3,
      comment: 'Original',
    });

    const originalSave = Rating.prototype.save;

    Rating.prototype.save = async function () {
      const err = new Error('Simulated save error on rating update');
      err.name = 'SomeOtherError';
      throw err;
    };

    await expect(
      ratingService.updateRatingById({
        ratingId: created._id.toString(),
        userId: userId.toString(),
        score: 5,
        comment: 'Trying to update',
      })
    ).rejects.toHaveProperty(
      'message',
      'Simulated save error on rating update'
    );

    Rating.prototype.save = originalSave;
  });
});
