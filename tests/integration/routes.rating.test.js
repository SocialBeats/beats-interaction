import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { api } from '../setup/setup.js';
import { Rating, Playlist } from '../../src/models/models.js';

describe('POST /api/v1/beats/:beatId/ratings (integration)', () => {
  const withAuth = (req) =>
    req.set('Authorization', `Bearer ${global.testToken}`);

  it('should create a rating and return 201 with the created rating', async () => {
    const beatId = new mongoose.Types.ObjectId().toString();

    const response = await withAuth(api.post(`/api/v1/beats/${beatId}/ratings`))
      .send({
        score: 5,
        comment: 'Muy pro, master limpio.',
      })
      .expect(201);

    const createdId = response.body.id;

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('beatId', beatId);
    expect(response.body).toHaveProperty('userId');
    expect(response.body).toHaveProperty('score', 5);
    expect(response.body).toHaveProperty('comment', 'Muy pro, master limpio.');
    expect(response.body).toHaveProperty('createdAt');

    const ratingInDb = await Rating.findById(createdId).lean();
    expect(ratingInDb).not.toBeNull();
    expect(ratingInDb.score).toBe(5);
    expect(ratingInDb.comment).toBe('Muy pro, master limpio.');
    expect(ratingInDb.beatId.toString()).toBe(beatId);
  });

  it('should return 404 if beatId is not a valid ObjectId', async () => {
    const response = await withAuth(
      api.post('/api/v1/beats/not-a-valid-objectid/ratings')
    )
      .send({
        score: 4,
        comment: 'Test rating',
      })
      .expect(404);

    expect(response.body).toEqual({
      message: 'Beat not found',
    });

    const rating = await Rating.findOne({ comment: 'Test rating' });
    expect(rating).toBeNull();
  });

  it('should return 422 if the score is below minimum (1)', async () => {
    const beatId = new mongoose.Types.ObjectId().toString();

    const response = await withAuth(api.post(`/api/v1/beats/${beatId}/ratings`))
      .send({
        score: 0,
        comment: 'Too low score',
      })
      .expect(422);

    expect(response.body).toHaveProperty('message');

    const rating = await Rating.findOne({ comment: 'Too low score' });
    expect(rating).toBeNull();
  });

  it('should return 422 if the score is above maximum (5)', async () => {
    const beatId = new mongoose.Types.ObjectId().toString();

    const response = await withAuth(api.post(`/api/v1/beats/${beatId}/ratings`))
      .send({
        score: 6,
        comment: 'Too high score',
      })
      .expect(422);

    expect(response.body).toHaveProperty('message');

    const rating = await Rating.findOne({ comment: 'Too high score' });
    expect(rating).toBeNull();
  });

  it('should return 422 if comment exceeds maxlength', async () => {
    const beatId = new mongoose.Types.ObjectId().toString();
    const longComment = 'a'.repeat(201); // maxlength 200

    const response = await withAuth(api.post(`/api/v1/beats/${beatId}/ratings`))
      .send({
        score: 4,
        comment: longComment,
      })
      .expect(422);

    expect(response.body).toHaveProperty('message');

    const rating = await Rating.findOne({ comment: longComment });
    expect(rating).toBeNull();
  });

  it('should return 422 if the user has already rated this beat', async () => {
    const beatId = new mongoose.Types.ObjectId().toString();

    // primer rating OK
    const firstResponse = await withAuth(
      api.post(`/api/v1/beats/${beatId}/ratings`)
    )
      .send({
        score: 4,
        comment: 'First rating',
      })
      .expect(201);

    expect(firstResponse.body).toHaveProperty('id');

    // segundo rating sobre el mismo beat y mismo usuario → 422
    const secondResponse = await withAuth(
      api.post(`/api/v1/beats/${beatId}/ratings`)
    )
      .send({
        score: 5,
        comment: 'Trying to rate again',
      })
      .expect(422);

    expect(secondResponse.body).toHaveProperty(
      'message',
      'User has already rated this beat'
    );

    const ratingsForBeat = await Rating.find({ beatId }).lean();
    expect(ratingsForBeat).toHaveLength(1);
    expect(ratingsForBeat[0].score).toBe(4);
    expect(ratingsForBeat[0].comment).toBe('First rating');
  });
});

describe('POST /api/v1/playlists/:playlistId/ratings (integration)', () => {
  const withAuth = (req) =>
    req.set('Authorization', `Bearer ${global.testToken}`);

  it('should create a rating on a public playlist and return 201', async () => {
    const playlist = await Playlist.create({
      name: 'Public playlist for rating',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    const response = await withAuth(
      api.post(`/api/v1/playlists/${playlist._id}/ratings`)
    )
      .send({
        score: 5,
        comment: 'Great playlist!',
      })
      .expect(201);

    const createdId = response.body.id;

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('playlistId', playlist._id.toString());
    expect(response.body).toHaveProperty('userId');
    expect(response.body).toHaveProperty('score', 5);
    expect(response.body).toHaveProperty('comment', 'Great playlist!');
    expect(response.body).toHaveProperty('createdAt');

    const ratingInDb = await Rating.findById(createdId).lean();
    expect(ratingInDb).not.toBeNull();
    expect(ratingInDb.score).toBe(5);
    expect(ratingInDb.comment).toBe('Great playlist!');
    expect(ratingInDb.playlistId.toString()).toBe(playlist._id.toString());
  });

  it('should return 404 if playlistId is invalid', async () => {
    const response = await withAuth(
      api.post('/api/v1/playlists/not-valid/ratings')
    )
      .send({
        score: 4,
        comment: 'Test',
      })
      .expect(404);

    expect(response.body).toEqual({ message: 'Playlist not found' });

    const rating = await Rating.findOne({ comment: 'Test' });
    expect(rating).toBeNull();
  });

  it('should return 422 if playlist does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const response = await withAuth(
      api.post(`/api/v1/playlists/${fakeId}/ratings`)
    )
      .send({
        score: 4,
        comment: 'Hello',
      })
      .expect(422);

    expect(response.body.message).toBe(
      'The playlist being rated does not exist.'
    );
  });

  it('should return 422 if playlist is private', async () => {
    const playlist = await Playlist.create({
      name: 'Private playlist',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: false,
    });

    const response = await withAuth(
      api.post(`/api/v1/playlists/${playlist._id}/ratings`)
    )
      .send({
        score: 4,
        comment: 'Hello',
      })
      .expect(422);

    expect(response.body.message).toBe('You cannot rate a private playlist.');

    const rating = await Rating.findOne({ playlistId: playlist._id }).lean();
    expect(rating).toBeNull();
  });

  it('should return 422 if score is below minimum (1)', async () => {
    const playlist = await Playlist.create({
      name: 'Score low playlist',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    const response = await withAuth(
      api.post(`/api/v1/playlists/${playlist._id}/ratings`)
    )
      .send({
        score: 0,
        comment: 'Too low score',
      })
      .expect(422);

    expect(response.body).toHaveProperty('message');

    const rating = await Rating.findOne({ comment: 'Too low score' });
    expect(rating).toBeNull();
  });

  it('should return 422 if score is above maximum (5)', async () => {
    const playlist = await Playlist.create({
      name: 'Score high playlist',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    const response = await withAuth(
      api.post(`/api/v1/playlists/${playlist._id}/ratings`)
    )
      .send({
        score: 6,
        comment: 'Too high score',
      })
      .expect(422);

    expect(response.body).toHaveProperty('message');

    const rating = await Rating.findOne({ comment: 'Too high score' });
    expect(rating).toBeNull();
  });

  it('should return 422 if comment exceeds maxlength', async () => {
    const playlist = await Playlist.create({
      name: 'Long comment playlist',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    const longComment = 'a'.repeat(201);

    const response = await withAuth(
      api.post(`/api/v1/playlists/${playlist._id}/ratings`)
    )
      .send({
        score: 4,
        comment: longComment,
      })
      .expect(422);

    expect(response.body).toHaveProperty('message');

    const rating = await Rating.findOne({ comment: longComment });
    expect(rating).toBeNull();
  });

  it('should return 422 if the user has already rated this playlist', async () => {
    const playlist = await Playlist.create({
      name: 'Already rated playlist',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    // first rating OK
    const firstResponse = await withAuth(
      api.post(`/api/v1/playlists/${playlist._id}/ratings`)
    )
      .send({
        score: 4,
        comment: 'First playlist rating',
      })
      .expect(201);

    expect(firstResponse.body).toHaveProperty('id');

    // second rating on the same playlist and same user: 422
    const secondResponse = await withAuth(
      api.post(`/api/v1/playlists/${playlist._id}/ratings`)
    )
      .send({
        score: 5,
        comment: 'Trying to rate playlist again',
      })
      .expect(422);

    expect(secondResponse.body.message).toBe(
      'User has already rated this playlist'
    );

    const ratingsForPlaylist = await Rating.find({
      playlistId: playlist._id,
    }).lean();

    expect(ratingsForPlaylist).toHaveLength(1);
    expect(ratingsForPlaylist[0].score).toBe(4);
    expect(ratingsForPlaylist[0].comment).toBe('First playlist rating');
  });
});

describe('GET /api/v1/ratings/:ratingId (integration)', () => {
  const withAuth = (req) =>
    req.set('Authorization', `Bearer ${global.testToken}`);

  it('should return 200 and the rating when it exists', async () => {
    const beatId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

    const created = await Rating.create({
      beatId,
      userId,
      score: 5,
      comment: 'Existing rating',
    });

    const response = await withAuth(
      api.get(`/api/v1/ratings/${created._id}`)
    ).expect(200);

    expect(response.body).toHaveProperty('id', created._id.toString());
    expect(response.body).toHaveProperty('userId', userId.toString());
    expect(response.body).toHaveProperty('score', 5);
    expect(response.body).toHaveProperty('comment', 'Existing rating');
    expect(response.body).toHaveProperty('createdAt');
    expect(response.body).toHaveProperty('updatedAt');
  });

  it('should return 404 if ratingId is not a valid ObjectId', async () => {
    const response = await withAuth(
      api.get('/api/v1/ratings/not-a-valid-id')
    ).expect(404);

    expect(response.body).toEqual({ message: 'Rating not found' });
  });

  it('should return 404 if rating does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const response = await withAuth(
      api.get(`/api/v1/ratings/${fakeId}`)
    ).expect(404);

    expect(response.body).toEqual({ message: 'Rating not found' });
  });
});

describe('GET /api/v1/beats/:beatId/ratings/me (integration)', () => {
  const withAuth = (req) =>
    req.set('Authorization', `Bearer ${global.testToken}`);

  it('should return 200 and the rating of the authenticated user for the beat', async () => {
    const beatId = new mongoose.Types.ObjectId().toString();

    const createResponse = await withAuth(
      api.post(`/api/v1/beats/${beatId}/ratings`)
    )
      .send({
        score: 5,
        comment: 'My personal rating',
      })
      .expect(201);

    expect(createResponse.body).toHaveProperty('id');

    const response = await withAuth(
      api.get(`/api/v1/beats/${beatId}/ratings/me`)
    ).expect(200);

    expect(response.body).toHaveProperty('beatId', beatId);
    expect(response.body).toHaveProperty('userId');
    expect(response.body).toHaveProperty('score', 5);
    expect(response.body).toHaveProperty('comment', 'My personal rating');
    expect(response.body).toHaveProperty('createdAt');
    expect(response.body).toHaveProperty('updatedAt');
  });

  it('should return 404 if beatId is not a valid ObjectId', async () => {
    const response = await withAuth(
      api.get('/api/v1/beats/not-a-valid-id/ratings/me')
    ).expect(404);

    expect(response.body).toEqual({ message: 'Beat not found' });
  });

  it('should return 404 if the user has not rated this beat', async () => {
    const beatId = new mongoose.Types.ObjectId().toString();

    const response = await withAuth(
      api.get(`/api/v1/beats/${beatId}/ratings/me`)
    ).expect(404);

    expect(response.body).toEqual({ message: 'Rating not found' });
  });
});

describe('GET /api/v1/playlists/:playlistId/ratings/me (integration)', () => {
  const withAuth = (req) =>
    req.set('Authorization', `Bearer ${global.testToken}`);

  it('should return the rating when it exists for this playlist and user', async () => {
    const playlist = await Playlist.create({
      name: 'Playlist for my rating',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    const createResponse = await withAuth(
      api.post(`/api/v1/playlists/${playlist._id}/ratings`)
    )
      .send({
        score: 5,
        comment: 'My playlist rating',
      })
      .expect(201);

    expect(createResponse.body).toHaveProperty('id');

    const response = await withAuth(
      api.get(`/api/v1/playlists/${playlist._id}/ratings/me`)
    ).expect(200);

    expect(response.body).toHaveProperty('playlistId', playlist._id.toString());
    expect(response.body).toHaveProperty('userId');
    expect(response.body).toHaveProperty('score', 5);
    expect(response.body).toHaveProperty('comment', 'My playlist rating');
    expect(response.body).toHaveProperty('createdAt');
    expect(response.body).toHaveProperty('updatedAt');
  });

  it('should return 404 if playlistId is not a valid ObjectId', async () => {
    const response = await withAuth(
      api.get('/api/v1/playlists/not-a-valid-id/ratings/me')
    ).expect(404);

    expect(response.body).toEqual({ message: 'Playlist not found' });
  });

  it('should return 404 if the user has not rated this playlist', async () => {
    const playlist = await Playlist.create({
      name: 'Playlist without rating',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    const response = await withAuth(
      api.get(`/api/v1/playlists/${playlist._id}/ratings/me`)
    ).expect(404);

    expect(response.body).toEqual({ message: 'Rating not found' });
  });
});

describe('GET /api/v1/beats/:beatId/ratings (integration)', () => {
  const withAuth = (req) =>
    req.set('Authorization', `Bearer ${global.testToken}`);

  it('should return ratings with average and count for a beat', async () => {
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
        comment: 'El bajo tapa la voz',
      },
      {
        beatId,
        userId: user2,
        score: 5,
        comment: 'Muy pro',
      },
      {
        beatId: otherBeatId,
        userId: otherUser,
        score: 2,
        comment: 'Other beat',
      },
    ]);

    const response = await withAuth(
      api.get(`/api/v1/beats/${beatId}/ratings`)
    ).expect(200);

    expect(response.body).toHaveProperty('count', 2);
    expect(response.body).toHaveProperty('average');
    expect(response.body.average).toBeCloseTo(4.5);

    expect(response.body.data).toHaveLength(2);

    const userIdsFromResponse = response.body.data.map((r) => r.userId);
    expect(userIdsFromResponse).toEqual(
      expect.arrayContaining([user1.toString(), user2.toString()])
    );

    response.body.data.forEach((r) => {
      expect(r).toHaveProperty('userId');
      expect(r).toHaveProperty('score');
      // comment is optional we only check its value if present
      if (r.userId === user1.toString()) {
        expect(r.comment).toBe('El bajo tapa la voz');
      }
    });
  });

  it('should return empty data, average 0 and count 0 when there are no ratings for the beat', async () => {
    const beatId = new mongoose.Types.ObjectId();

    const response = await withAuth(
      api.get(`/api/v1/beats/${beatId}/ratings`)
    ).expect(200);

    expect(response.body).toEqual({
      data: [],
      average: 0,
      count: 0,
    });
  });

  it('should return 404 if beatId is not a valid ObjectId', async () => {
    const response = await withAuth(
      api.get('/api/v1/beats/not-a-valid-id/ratings')
    ).expect(404);

    expect(response.body).toEqual({ message: 'Beat not found' });
  });
});

describe('GET /api/v1/playlists/:playlistId/ratings (integration)', () => {
  const withAuth = (req) =>
    req.set('Authorization', `Bearer ${global.testToken}`);

  it('should return ratings with average and count for a playlist', async () => {
    const playlist = await Playlist.create({
      name: 'Playlist for ratings (integration)',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    const otherPlaylist = await Playlist.create({
      name: 'Other playlist (integration)',
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
        comment: 'El bajo tapa la voz',
      },
      {
        playlistId: playlist._id,
        userId: user2,
        score: 5,
        comment: 'Muy pro',
      },
      {
        playlistId: otherPlaylist._id,
        userId: otherUser,
        score: 2,
        comment: 'Other playlist',
      },
    ]);

    const response = await withAuth(
      api.get(`/api/v1/playlists/${playlist._id}/ratings`)
    ).expect(200);

    expect(response.body).toHaveProperty('count', 2);
    expect(response.body).toHaveProperty('average');
    expect(response.body.average).toBeCloseTo(4.5);

    expect(response.body.data).toHaveLength(2);

    const userIdsFromResponse = response.body.data.map((r) => r.userId);
    expect(userIdsFromResponse).toEqual(
      expect.arrayContaining([user1.toString(), user2.toString()])
    );

    response.body.data.forEach((r) => {
      expect(r).toHaveProperty('userId');
      expect(r).toHaveProperty('score');
      // comment is optional we only check its value if present
      if (r.userId === user1.toString()) {
        expect(r.comment).toBe('El bajo tapa la voz');
      }
    });
  });

  it('should return empty data, average 0 and count 0 when there are no ratings for the playlist', async () => {
    const playlist = await Playlist.create({
      name: 'Playlist without ratings',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    const response = await withAuth(
      api.get(`/api/v1/playlists/${playlist._id}/ratings`)
    ).expect(200);

    expect(response.body).toEqual({
      data: [],
      average: 0,
      count: 0,
    });
  });

  it('should return 404 if playlistId is not a valid ObjectId', async () => {
    const response = await withAuth(
      api.get('/api/v1/playlists/not-a-valid-id/ratings')
    ).expect(404);

    expect(response.body).toEqual({ message: 'Playlist not found' });
  });
});

describe('DELETE /api/v1/ratings/:ratingId (integration)', () => {
  const withAuth = (req) =>
    req.set('Authorization', `Bearer ${global.testToken}`);

  it('should delete an existing rating of the authenticated user and return 200', async () => {
    const beatId = new mongoose.Types.ObjectId().toString();

    // first create the rating via API so that the userId is the one from the token
    const createResponse = await withAuth(
      api.post(`/api/v1/beats/${beatId}/ratings`)
    )
      .send({ score: 5, comment: 'Rating to delete' })
      .expect(201);

    const ratingId = createResponse.body.id;

    const deleteResponse = await withAuth(
      api.delete(`/api/v1/ratings/${ratingId}`)
    ).expect(200);

    expect(deleteResponse.body).toEqual({ deleted: true });

    const inDb = await Rating.findById(ratingId);
    expect(inDb).toBeNull();
  });

  it('should return 200 and deleted:false if rating does not exist', async () => {
    const nonExistingId = new mongoose.Types.ObjectId().toString();

    const response = await withAuth(
      api.delete(`/api/v1/ratings/${nonExistingId}`)
    ).expect(200);

    expect(response.body).toEqual({ deleted: false });
  });

  it('should return 200 and deleted:false if ratingId is not a valid ObjectId', async () => {
    const response = await withAuth(
      api.delete('/api/v1/ratings/not-a-valid-id')
    ).expect(200);

    expect(response.body).toEqual({ deleted: false });
  });

  it('should return 401 if the rating belongs to another user', async () => {
    const beatId = new mongoose.Types.ObjectId();
    const otherUserId = new mongoose.Types.ObjectId();

    // create a rating for another user directly in the DB
    const foreignRating = await Rating.create({
      beatId,
      userId: otherUserId,
      score: 3,
      comment: 'Not your rating',
    });

    const response = await withAuth(
      api.delete(`/api/v1/ratings/${foreignRating._id}`)
    ).expect(401);

    expect(response.body).toHaveProperty(
      'message',
      'You are not allowed to delete this rating.'
    );

    const stillThere = await Rating.findById(foreignRating._id);
    expect(stillThere).not.toBeNull();
  });
});
