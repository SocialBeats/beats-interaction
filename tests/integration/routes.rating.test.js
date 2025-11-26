// tests/integration/routes.rating.test.js
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
