import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { api } from '../setup/setup.js';
import { Comment, Playlist } from '../../src/models/models.js';

describe('POST /api/v1/beats/:beatId/comments (integration)', () => {
  const withAuth = (req) =>
    req.set('Authorization', `Bearer ${global.testToken}`);

  it('should create a comment and return 201 with the created comment', async () => {
    const beatId = new mongoose.Types.ObjectId().toString();

    const response = await withAuth(
      api.post(`/api/v1/beats/${beatId}/comments`)
    )
      .send({ text: 'Nice beat bro!' })
      .expect(201);

    const createdId = response.body.id;

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('beatId', beatId);
    expect(response.body).toHaveProperty('authorId');
    expect(response.body).toHaveProperty('text', 'Nice beat bro!');
    expect(response.body).toHaveProperty('createdAt');

    const commentInDb = await Comment.findById(createdId).lean();
    expect(commentInDb).not.toBeNull();
    expect(commentInDb.text).toBe('Nice beat bro!');
    expect(commentInDb.beatId.toString()).toBe(beatId);
  });

  it('should return 404 if beatId is not a valid ObjectId', async () => {
    const response = await withAuth(
      api.post('/api/v1/beats/not-a-valid-objectid/comments')
    )
      .send({ text: 'Test comment' })
      .expect(404);

    expect(response.body).toEqual({
      message: 'Beat not found',
    });

    const comment = await Comment.findOne({ text: 'Test comment' });
    expect(comment).toBeNull();
  });

  it('should return 422 if text is empty or only spaces', async () => {
    const beatId = new mongoose.Types.ObjectId().toString();

    const response = await withAuth(
      api.post(`/api/v1/beats/${beatId}/comments`)
    )
      .send({ text: '   ' })
      .expect(422);

    expect(response.body.message).toBe(
      'The comment cannot be empty or have only spaces.'
    );

    const comment = await Comment.findOne({ text: '   ' });
    expect(comment).toBeNull();
  });

  it('should return 422 if text exceeds maxlength', async () => {
    const beatId = new mongoose.Types.ObjectId().toString();
    const longText = 'a'.repeat(201);

    const response = await withAuth(
      api.post(`/api/v1/beats/${beatId}/comments`)
    )
      .send({ text: longText })
      .expect(422);

    expect(response.body).toHaveProperty('message');

    const comment = await Comment.findOne({ text: longText });
    expect(comment).toBeNull();
  });
});

describe('POST /api/v1/playlists/:playlistId/comments (integration)', () => {
  const withAuth = (req) =>
    req.set('Authorization', `Bearer ${global.testToken}`);

  it('should create a comment on a public playlist', async () => {
    const playlist = await Playlist.create({
      name: 'Public test playlist',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    const response = await withAuth(
      api.post(`/api/v1/playlists/${playlist._id}/comments`)
    )
      .send({ text: 'Awesome playlist!' })
      .expect(201);

    const createdId = response.body.id;

    expect(response.body).toHaveProperty('playlistId', playlist._id.toString());
    expect(response.body).toHaveProperty('text', 'Awesome playlist!');

    const saved = await Comment.findById(createdId);
    expect(saved).not.toBeNull();
    expect(saved.text).toBe('Awesome playlist!');
  });

  it('should return 404 if playlistId is invalid', async () => {
    const response = await withAuth(
      api.post('/api/v1/playlists/not-valid/comments')
    )
      .send({ text: 'Test' })
      .expect(404);

    expect(response.body).toEqual({ message: 'Playlist not found' });
  });

  it('should return 422 if playlist does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const response = await withAuth(
      api.post(`/api/v1/playlists/${fakeId}/comments`)
    )
      .send({ text: 'Hello' })
      .expect(422);

    expect(response.body.message).toBe(
      'The playlist being commented does not exist.'
    );
  });

  it('should return 422 if playlist is private', async () => {
    const playlist = await Playlist.create({
      name: 'Private playlist',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: false,
    });

    const response = await withAuth(
      api.post(`/api/v1/playlists/${playlist._id}/comments`)
    )
      .send({ text: 'Hello' })
      .expect(422);

    expect(response.body.message).toBe(
      'You cannot comment on a private playlist.'
    );
  });

  it('should return 422 if text is empty or only spaces', async () => {
    const playlist = await Playlist.create({
      name: 'Another public playlist',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    const response = await withAuth(
      api.post(`/api/v1/playlists/${playlist._id}/comments`)
    )
      .send({ text: '   ' })
      .expect(422);

    expect(response.body.message).toBe(
      'The comment cannot be empty or have only spaces.'
    );
  });
});

describe('GET /api/v1/comments/:commentId (integration)', () => {
  const withAuth = (req) =>
    req.set('Authorization', `Bearer ${global.testToken}`);

  it('should return 200 and the comment when it exists', async () => {
    const authorId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();

    const created = await Comment.create({
      beatId,
      authorId,
      text: 'Existing comment',
    });

    const response = await withAuth(
      api.get(`/api/v1/comments/${created._id}`)
    ).expect(200);

    expect(response.body).toHaveProperty('id', created._id.toString());
    expect(response.body).toHaveProperty('text', 'Existing comment');
    expect(response.body).toHaveProperty('authorId', authorId.toString());
    // optional fields but good to check they exist
    expect(response.body).toHaveProperty('createdAt');
    expect(response.body).toHaveProperty('updatedAt');
  });

  it('should return 404 if commentId is not a valid ObjectId', async () => {
    const response = await withAuth(
      api.get('/api/v1/comments/not-a-valid-id')
    ).expect(404);

    expect(response.body).toEqual({ message: 'Comment not found' });
  });

  it('should return 404 if comment does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const response = await withAuth(
      api.get(`/api/v1/comments/${fakeId}`)
    ).expect(404);

    expect(response.body).toEqual({ message: 'Comment not found' });
  });
});
