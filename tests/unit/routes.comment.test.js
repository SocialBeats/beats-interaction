import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { api } from '../setup/setup.js';
import { Comment, Playlist } from '../../src/models/models.js';
import { withAuth } from '../setup/setup.js';

describe('POST /api/v1/beats/:beatId/comments', () => {
  it('should create a comment and return 201 with the created comment', async () => {
    const beatId = new mongoose.Types.ObjectId().toString();

    const response = await withAuth(
      api.post(`/api/v1/beats/${beatId}/comments`)
    )
      .send({ text: 'Nice beat bro!' })
      .expect(201);

    const createdId = response.body._id;

    expect(response.body).toHaveProperty('_id');
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

describe('POST /api/v1/playlists/:playlistId/comments', () => {
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

    const createdId = response.body._id;

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

describe('GET /api/v1/comments/:commentId', () => {
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

    expect(response.body).toHaveProperty('_id', created._id.toString());
    expect(response.body).toHaveProperty('text', 'Existing comment');
    expect(response.body).toHaveProperty('authorId', authorId.toString());
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

describe('GET /api/v1/beats/:beatId/comments', () => {
  it('should return comments with default pagination', async () => {
    const beatId = new mongoose.Types.ObjectId();
    const authorId = new mongoose.Types.ObjectId();

    await Comment.insertMany(
      Array.from({ length: 3 }, (_, i) => ({
        beatId,
        authorId,
        text: `Beat comment ${i + 1}`,
      }))
    );

    const response = await withAuth(
      api.get(`/api/v1/beats/${beatId}/comments`)
    ).expect(200);

    expect(response.body.page).toBe(1);
    expect(response.body.limit).toBe(20);
    expect(response.body.total).toBe(3);
    expect(response.body.data).toHaveLength(3);

    response.body.data.forEach((c) => {
      expect(c).toHaveProperty('_id');
      expect(c).toHaveProperty('authorId');
      expect(c).toHaveProperty('text');
      expect(c).toHaveProperty('createdAt');
    });
  });

  it('should clamp page below 1 to 1', async () => {
    const beatId = new mongoose.Types.ObjectId();
    const authorId = new mongoose.Types.ObjectId();

    await Comment.insertMany(
      Array.from({ length: 3 }, (_, i) => ({
        beatId,
        authorId,
        text: `Page test ${i + 1}`,
      }))
    );

    const response = await withAuth(
      api.get(`/api/v1/beats/${beatId}/comments?page=0&limit=2`)
    ).expect(200);

    expect(response.body.page).toBe(1);
    expect(response.body.limit).toBe(2);
    expect(response.body.data).toHaveLength(2);
  });

  it('should clamp page above maxPage to the last page', async () => {
    const beatId = new mongoose.Types.ObjectId();
    const authorId = new mongoose.Types.ObjectId();

    await Comment.insertMany(
      Array.from({ length: 5 }, (_, i) => ({
        beatId,
        authorId,
        text: `Page high ${i + 1}`,
      }))
    );

    // total = 5, limit = 2, maxPage = 3
    const response = await withAuth(
      api.get(`/api/v1/beats/${beatId}/comments?page=999&limit=2`)
    ).expect(200);

    expect(response.body.page).toBe(3);
    expect(response.body.limit).toBe(2);
    expect(response.body.total).toBe(5);
    expect(response.body.data).toHaveLength(1);
  });

  it('should normalize limit < 1 to default 20', async () => {
    const beatId = new mongoose.Types.ObjectId();
    const authorId = new mongoose.Types.ObjectId();

    await Comment.insertMany(
      Array.from({ length: 3 }, (_, i) => ({
        beatId,
        authorId,
        text: `Limit low ${i + 1}`,
      }))
    );

    const response = await withAuth(
      api.get(`/api/v1/beats/${beatId}/comments?page=1&limit=0`)
    ).expect(200);

    expect(response.body.page).toBe(1);
    expect(response.body.limit).toBe(20);
    expect(response.body.total).toBe(3);
    expect(response.body.data).toHaveLength(3);
  });

  it('should clamp limit above max to 100', async () => {
    const beatId = new mongoose.Types.ObjectId();
    const authorId = new mongoose.Types.ObjectId();

    await Comment.insertMany(
      Array.from({ length: 10 }, (_, i) => ({
        beatId,
        authorId,
        text: `Limit high ${i + 1}`,
      }))
    );

    const response = await withAuth(
      api.get(`/api/v1/beats/${beatId}/comments?page=1&limit=1000`)
    ).expect(200);

    expect(response.body.page).toBe(1);
    expect(response.body.limit).toBe(100);
    expect(response.body.total).toBe(10);
    expect(response.body.data).toHaveLength(10);
  });

  it('should return 404 if beatId is not a valid ObjectId', async () => {
    const response = await withAuth(
      api.get('/api/v1/beats/not-a-valid-id/comments')
    ).expect(404);

    expect(response.body).toEqual({ message: 'Beat not found' });
  });
});

describe('GET /api/v1/playlists/:playlistId/comments', () => {
  it('should return comments with default pagination', async () => {
    const playlist = await Playlist.create({
      name: 'Playlist for listing',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });
    const authorId = new mongoose.Types.ObjectId();

    await Comment.insertMany(
      Array.from({ length: 3 }, (_, i) => ({
        playlistId: playlist._id,
        authorId,
        text: `Playlist comment ${i + 1}`,
      }))
    );

    const response = await withAuth(
      api.get(`/api/v1/playlists/${playlist._id}/comments`)
    ).expect(200);

    expect(response.body.page).toBe(1);
    expect(response.body.limit).toBe(20);
    expect(response.body.total).toBe(3);
    expect(response.body.data).toHaveLength(3);

    response.body.data.forEach((c) => {
      expect(c).toHaveProperty('_id');
      expect(c).toHaveProperty('authorId');
      expect(c).toHaveProperty('text');
      expect(c).toHaveProperty('createdAt');
    });
  });

  it('should clamp page below 1 to 1', async () => {
    const playlist = await Playlist.create({
      name: 'Playlist page low',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });
    const authorId = new mongoose.Types.ObjectId();

    await Comment.insertMany(
      Array.from({ length: 3 }, (_, i) => ({
        playlistId: playlist._id,
        authorId,
        text: `Page low ${i + 1}`,
      }))
    );

    const response = await withAuth(
      api.get(`/api/v1/playlists/${playlist._id}/comments?page=0&limit=2`)
    ).expect(200);

    expect(response.body.page).toBe(1);
    expect(response.body.limit).toBe(2);
    expect(response.body.data).toHaveLength(2);
  });

  it('should clamp page above maxPage to the last page', async () => {
    const playlist = await Playlist.create({
      name: 'Playlist page high',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });
    const authorId = new mongoose.Types.ObjectId();

    await Comment.insertMany(
      Array.from({ length: 5 }, (_, i) => ({
        playlistId: playlist._id,
        authorId,
        text: `Page high ${i + 1}`,
      }))
    );

    // total = 5, limit = 2 → maxPage = 3
    const response = await withAuth(
      api.get(`/api/v1/playlists/${playlist._id}/comments?page=999&limit=2`)
    ).expect(200);

    expect(response.body.page).toBe(3);
    expect(response.body.limit).toBe(2);
    expect(response.body.total).toBe(5);
    expect(response.body.data).toHaveLength(1);
  });

  it('should normalize limit < 1 to default 20', async () => {
    const playlist = await Playlist.create({
      name: 'Playlist limit low',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });
    const authorId = new mongoose.Types.ObjectId();

    await Comment.insertMany(
      Array.from({ length: 3 }, (_, i) => ({
        playlistId: playlist._id,
        authorId,
        text: `Limit low ${i + 1}`,
      }))
    );

    const response = await withAuth(
      api.get(`/api/v1/playlists/${playlist._id}/comments?page=1&limit=0`)
    ).expect(200);

    expect(response.body.page).toBe(1);
    expect(response.body.limit).toBe(20);
    expect(response.body.total).toBe(3);
    expect(response.body.data).toHaveLength(3);
  });

  it('should clamp limit above max to 100', async () => {
    const playlist = await Playlist.create({
      name: 'Playlist limit high',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });
    const authorId = new mongoose.Types.ObjectId();

    await Comment.insertMany(
      Array.from({ length: 10 }, (_, i) => ({
        playlistId: playlist._id,
        authorId,
        text: `Limit high ${i + 1}`,
      }))
    );

    const response = await withAuth(
      api.get(`/api/v1/playlists/${playlist._id}/comments?page=1&limit=1000`)
    ).expect(200);

    expect(response.body.page).toBe(1);
    expect(response.body.limit).toBe(100);
    expect(response.body.total).toBe(10);
    expect(response.body.data).toHaveLength(10);
  });

  it('should return 404 if playlistId is not a valid ObjectId', async () => {
    const response = await withAuth(
      api.get('/api/v1/playlists/not-a-valid-id/comments')
    ).expect(404);

    expect(response.body).toEqual({ message: 'Playlist not found' });
  });
});

describe('DELETE /api/v1/comments/:commentId', () => {
  it('should delete an existing comment of the authenticated user and return 200', async () => {
    const beatId = new mongoose.Types.ObjectId();

    // first, create a comment to delete
    const createResponse = await withAuth(
      api.post(`/api/v1/beats/${beatId}/comments`)
    )
      .send({ text: 'Comment to delete' })
      .expect(201);

    const commentId = createResponse.body._id;

    const deleteResponse = await withAuth(
      api.delete(`/api/v1/comments/${commentId}`)
    ).expect(200);

    expect(deleteResponse.body).toEqual({ deleted: true });

    const inDb = await Comment.findById(commentId);
    expect(inDb).toBeNull();
  });

  it('should return 200 and deleted:false if comment does not exist', async () => {
    const nonExistingId = new mongoose.Types.ObjectId().toString();

    const response = await withAuth(
      api.delete(`/api/v1/comments/${nonExistingId}`)
    ).expect(200);

    expect(response.body).toEqual({ deleted: false });
  });

  it('should return 200 and deleted:false if commentId is not a valid ObjectId', async () => {
    const response = await withAuth(
      api.delete('/api/v1/comments/not-a-valid-id')
    ).expect(200);

    expect(response.body).toEqual({ deleted: false });
  });

  it('should return 401 if the comment belongs to another user', async () => {
    const beatId = new mongoose.Types.ObjectId();
    const otherAuthorId = new mongoose.Types.ObjectId();

    const foreignComment = await Comment.create({
      beatId,
      authorId: otherAuthorId,
      text: 'Not your comment',
    });

    const response = await withAuth(
      api.delete(`/api/v1/comments/${foreignComment._id}`)
    ).expect(401);

    expect(response.body).toHaveProperty(
      'message',
      'You are not allowed to delete this comment.'
    );

    const stillThere = await Comment.findById(foreignComment._id);
    expect(stillThere).not.toBeNull();
  });
});

describe('PUT /api/v1/comments/:commentId', () => {
  it('should update the text of an existing comment of the authenticated user and return 200', async () => {
    const beatId = new mongoose.Types.ObjectId();

    // create a comment to update
    const createResponse = await withAuth(
      api.post(`/api/v1/beats/${beatId}/comments`)
    )
      .send({ text: 'Old text' })
      .expect(201);

    const commentId = createResponse.body._id;

    const updateResponse = await withAuth(
      api.put(`/api/v1/comments/${commentId}`)
    )
      .send({ text: 'New text from PUT' })
      .expect(200);

    expect(updateResponse.body).toHaveProperty('_id', commentId);
    expect(updateResponse.body).toHaveProperty('text', 'New text from PUT');
    expect(updateResponse.body).toHaveProperty('updatedAt');

    const inDb = await Comment.findById(commentId);
    expect(inDb.text).toBe('New text from PUT');
  });

  it('should return 404 if commentId is not a valid ObjectId', async () => {
    const response = await withAuth(api.put('/api/v1/comments/not-a-valid-id'))
      .send({ text: 'Whatever' })
      .expect(404);

    expect(response.body).toEqual({ message: 'Comment not found' });
  });

  it('should return 404 if comment does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const response = await withAuth(api.put(`/api/v1/comments/${fakeId}`))
      .send({ text: 'Whatever' })
      .expect(404);

    expect(response.body).toEqual({ message: 'Comment not found' });
  });

  it('should return 401 if the comment belongs to another user', async () => {
    const beatId = new mongoose.Types.ObjectId();
    const otherAuthorId = new mongoose.Types.ObjectId();

    const foreignComment = await Comment.create({
      beatId,
      authorId: otherAuthorId,
      text: 'Not your comment',
    });

    const response = await withAuth(
      api.put(`/api/v1/comments/${foreignComment._id}`)
    )
      .send({ text: 'Trying to edit' })
      .expect(401);

    expect(response.body).toHaveProperty(
      'message',
      'You are not allowed to edit this comment.'
    );

    const stillThere = await Comment.findById(foreignComment._id);
    expect(stillThere.text).toBe('Not your comment');
  });

  it('should return 422 if text is empty or only spaces', async () => {
    const beatId = new mongoose.Types.ObjectId();

    const createResponse = await withAuth(
      api.post(`/api/v1/beats/${beatId}/comments`)
    )
      .send({ text: 'Initial text' })
      .expect(201);

    const commentId = createResponse.body._id;

    const response = await withAuth(api.put(`/api/v1/comments/${commentId}`))
      .send({ text: '   ' })
      .expect(422);

    expect(response.body).toHaveProperty(
      'message',
      'The comment cannot be empty or have only spaces.'
    );

    const inDb = await Comment.findById(commentId);
    expect(inDb.text).toBe('Initial text');
  });

  it('should return 422 if text exceeds maxlength', async () => {
    const beatId = new mongoose.Types.ObjectId();
    const longText = 'a'.repeat(201);

    const createResponse = await withAuth(
      api.post(`/api/v1/beats/${beatId}/comments`)
    )
      .send({ text: 'Initial text' })
      .expect(201);

    const commentId = createResponse.body._id;

    const response = await withAuth(api.put(`/api/v1/comments/${commentId}`))
      .send({ text: longText })
      .expect(422);

    expect(response.body).toHaveProperty('message');

    const inDb = await Comment.findById(commentId);
    expect(inDb.text).toBe('Initial text');
  });
});

describe('PATCH /api/v1/comments/:commentId', () => {
  it('should update the text of an existing comment using PATCH and return 200', async () => {
    const beatId = new mongoose.Types.ObjectId();

    const createResponse = await withAuth(
      api.post(`/api/v1/beats/${beatId}/comments`)
    )
      .send({ text: 'Old text (patch)' })
      .expect(201);

    const commentId = createResponse.body._id;

    const patchResponse = await withAuth(
      api.patch(`/api/v1/comments/${commentId}`)
    )
      .send({ text: 'New text from PATCH' })
      .expect(200);

    expect(patchResponse.body).toHaveProperty('_id', commentId);
    expect(patchResponse.body).toHaveProperty('text', 'New text from PATCH');

    const inDb = await Comment.findById(commentId);
    expect(inDb.text).toBe('New text from PATCH');
  });

  it('should return 404 if commentId is invalid (PATCH)', async () => {
    const response = await withAuth(
      api.patch('/api/v1/comments/not-a-valid-id')
    )
      .send({ text: 'New text' })
      .expect(404);

    expect(response.body).toEqual({
      message: 'Comment not found',
    });
  });

  it('should return 404 if comment does not exist (PATCH)', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const response = await withAuth(api.patch(`/api/v1/comments/${fakeId}`))
      .send({ text: 'New text' })
      .expect(404);

    expect(response.body).toEqual({
      message: 'Comment not found',
    });
  });

  it('should return 401 if the comment belongs to another user (PATCH)', async () => {
    const beatId = new mongoose.Types.ObjectId();
    const otherUserId = new mongoose.Types.ObjectId();

    const foreignComment = await Comment.create({
      beatId,
      authorId: otherUserId,
      text: 'Not yours',
    });

    const response = await withAuth(
      api.patch(`/api/v1/comments/${foreignComment._id}`)
    )
      .send({ text: 'Attempt to edit' })
      .expect(401);

    expect(response.body).toHaveProperty(
      'message',
      'You are not allowed to edit this comment.'
    );

    const stillThere = await Comment.findById(foreignComment._id);
    expect(stillThere.text).toBe('Not yours');
  });

  it('should return 422 when PATCH text is invalid (empty)', async () => {
    const beatId = new mongoose.Types.ObjectId();

    const createResponse = await withAuth(
      api.post(`/api/v1/beats/${beatId}/comments`)
    )
      .send({ text: 'Initial patch text' })
      .expect(201);

    const commentId = createResponse.body._id;

    const response = await withAuth(api.patch(`/api/v1/comments/${commentId}`))
      .send({ text: '   ' })
      .expect(422);

    expect(response.body).toHaveProperty(
      'message',
      'The comment cannot be empty or have only spaces.'
    );

    const inDb = await Comment.findById(commentId);
    expect(inDb.text).toBe('Initial patch text');
  });
});
