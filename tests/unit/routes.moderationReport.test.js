import mongoose from 'mongoose';
import { describe, it, expect } from 'vitest';
import { api, withAuth } from '../setup/setup.js';
import {
  Comment,
  ModerationReport,
  Playlist,
  Rating,
} from '../../src/models/models.js';

describe('POST /api/v1/comments/:commentId/moderationReports', () => {
  it('should create a moderation report and return 201', async () => {
    const authorId = new mongoose.Types.ObjectId();

    const comment = await Comment.create({
      beatId: new mongoose.Types.ObjectId(),
      authorId,
      text: 'Reportable comment',
    });

    const response = await withAuth(
      api.post(`/api/v1/comments/${comment._id}/moderationReports`)
    ).expect(201);

    expect(response.body).toHaveProperty('_id');
    expect(response.body.commentId).toBe(comment._id.toString());
    expect(response.body.userId).toBe(global.testUserId);
    expect(response.body.authorId).toBe(authorId.toString());
    expect(response.body.state).toBe('Checking');

    const inDb = await ModerationReport.findById(response.body._id);
    expect(inDb).not.toBeNull();
  });

  it('should return 404 if commentId is not a valid ObjectId', async () => {
    const response = await withAuth(
      api.post('/api/v1/comments/not-a-valid-id/moderationReports')
    ).expect(404);

    expect(response.body).toEqual({
      message: 'Comment not found',
    });
  });

  it('should return 404 if comment does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const response = await withAuth(
      api.post(`/api/v1/comments/${fakeId}/moderationReports`)
    ).expect(404);

    expect(response.body).toEqual({
      message: 'Comment not found',
    });
  });

  it('should return 422 if user reports own comment', async () => {
    const comment = await Comment.create({
      beatId: new mongoose.Types.ObjectId(),
      authorId: global.testUserId,
      text: 'Self report attempt',
    });

    const response = await withAuth(
      api.post(`/api/v1/comments/${comment._id}/moderationReports`)
    ).expect(422);

    expect(response.body.message).toBe(
      'A user cannot report their own content.'
    );
  });

  it('should return 422 if the comment belongs to a playlist that became private', async () => {
    const playlist = await Playlist.create({
      name: 'Public playlist then private',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    const comment = await Comment.create({
      playlistId: playlist._id,
      authorId: new mongoose.Types.ObjectId(),
      text: 'Comment on playlist',
    });

    await Playlist.updateOne(
      { _id: playlist._id },
      { $set: { isPublic: false } }
    );

    const response = await withAuth(
      api.post(`/api/v1/comments/${comment._id}/moderationReports`)
    ).expect(422);

    expect(response.body.message).toBe(
      'You cannot report a comment from a private playlist.'
    );
  });

  it('should return 401 if user is not authenticated', async () => {
    const comment = await Comment.create({
      beatId: new mongoose.Types.ObjectId(),
      authorId: new mongoose.Types.ObjectId(),
      text: 'Unauthorized report',
    });

    await api
      .post(`/api/v1/comments/${comment._id}/moderationReports`)
      .expect(401);
  });
});

describe('POST /api/v1/ratings/:ratingId/moderationReports', () => {
  it('should create a moderation report and return 201', async () => {
    const ratingAuthorId = new mongoose.Types.ObjectId();

    const rating = await Rating.create({
      beatId: new mongoose.Types.ObjectId(),
      userId: ratingAuthorId,
      score: 4,
      comment: 'Nice',
    });

    const response = await withAuth(
      api.post(`/api/v1/ratings/${rating._id}/moderationReports`)
    ).expect(201);

    expect(response.body).toHaveProperty('_id');
    expect(response.body.ratingId).toBe(rating._id.toString());
    expect(response.body.userId).toBe(global.testUserId);
    expect(response.body.authorId).toBe(ratingAuthorId.toString());
    expect(response.body.state).toBe('Checking');

    const inDb = await ModerationReport.findById(response.body._id);
    expect(inDb).not.toBeNull();
  });

  it('should return 404 if ratingId is not a valid ObjectId', async () => {
    const response = await withAuth(
      api.post('/api/v1/ratings/not-a-valid-id/moderationReports')
    ).expect(404);

    expect(response.body).toEqual({
      message: 'Rating not found',
    });
  });

  it('should return 404 if rating does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const response = await withAuth(
      api.post(`/api/v1/ratings/${fakeId}/moderationReports`)
    ).expect(404);

    expect(response.body).toEqual({
      message: 'Rating not found',
    });
  });

  it('should return 422 if user reports own rating', async () => {
    const rating = await Rating.create({
      beatId: new mongoose.Types.ObjectId(),
      userId: global.testUserId,
      score: 5,
      comment: 'Self rating',
    });

    const response = await withAuth(
      api.post(`/api/v1/ratings/${rating._id}/moderationReports`)
    ).expect(422);

    expect(response.body.message).toBe(
      'A user cannot report their own content.'
    );
  });

  it('should return 422 if the rating belongs to a playlist that became private', async () => {
    const playlist = await Playlist.create({
      name: 'Public playlist then private',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    const rating = await Rating.create({
      playlistId: playlist._id,
      userId: new mongoose.Types.ObjectId(),
      score: 3,
      comment: 'Rating on playlist',
    });

    await Playlist.updateOne(
      { _id: playlist._id },
      { $set: { isPublic: false } }
    );

    const response = await withAuth(
      api.post(`/api/v1/ratings/${rating._id}/moderationReports`)
    ).expect(422);

    expect(response.body.message).toBe(
      'You cannot report a rating from a private playlist.'
    );
  });

  it('should return 401 if user is not authenticated', async () => {
    const rating = await Rating.create({
      beatId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      score: 4,
      comment: 'Unauthorized report',
    });

    await api
      .post(`/api/v1/ratings/${rating._id}/moderationReports`)
      .expect(401);
  });
});

describe('POST /api/v1/playlists/:playlistId/moderationReports', () => {
  it('should create a moderation report and return 201', async () => {
    const ownerId = new mongoose.Types.ObjectId();

    const playlist = await Playlist.create({
      name: 'Public playlist',
      ownerId,
      description: 'desc',
      isPublic: true,
      items: [],
    });

    const response = await withAuth(
      api.post(`/api/v1/playlists/${playlist._id}/moderationReports`)
    ).expect(201);

    expect(response.body).toHaveProperty('_id');
    expect(response.body.playlistId).toBe(playlist._id.toString());
    expect(response.body.userId).toBe(global.testUserId);
    expect(response.body.authorId).toBe(ownerId.toString());
    expect(response.body.state).toBe('Checking');

    const inDb = await ModerationReport.findById(response.body._id);
    expect(inDb).not.toBeNull();
  });

  it('should return 404 if playlistId is not a valid ObjectId', async () => {
    const response = await withAuth(
      api.post('/api/v1/playlists/not-a-valid-id/moderationReports')
    ).expect(404);

    expect(response.body).toEqual({
      message: 'Playlist not found',
    });
  });

  it('should return 404 if playlist does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const response = await withAuth(
      api.post(`/api/v1/playlists/${fakeId}/moderationReports`)
    ).expect(404);

    expect(response.body).toEqual({
      message: 'Playlist not found',
    });
  });

  it('should return 422 if user reports own playlist', async () => {
    const playlist = await Playlist.create({
      name: 'My playlist',
      ownerId: global.testUserId,
      description: 'desc',
      isPublic: true,
      items: [],
    });

    const response = await withAuth(
      api.post(`/api/v1/playlists/${playlist._id}/moderationReports`)
    ).expect(422);

    expect(response.body.message).toBe(
      'A user cannot report their own content.'
    );
  });

  it('should return 422 if playlist is private', async () => {
    const ownerId = new mongoose.Types.ObjectId();

    const playlist = await Playlist.create({
      name: 'Private playlist',
      ownerId,
      description: 'desc',
      isPublic: false,
      items: [],
    });

    const response = await withAuth(
      api.post(`/api/v1/playlists/${playlist._id}/moderationReports`)
    ).expect(422);

    expect(response.body.message).toBe('You cannot report a private playlist.');
  });

  it('should return 401 if user is not authenticated', async () => {
    const playlist = await Playlist.create({
      name: 'Public playlist',
      ownerId: new mongoose.Types.ObjectId(),
      description: 'desc',
      isPublic: true,
      items: [],
    });

    await api
      .post(`/api/v1/playlists/${playlist._id}/moderationReports`)
      .expect(401);
  });
});

describe('GET /api/v1/moderationReports/:moderationReportId', () => {
  it('should return 200 and the moderation report', async () => {
    const reporterId = new mongoose.Types.ObjectId();
    const authorId = new mongoose.Types.ObjectId();

    const comment = await Comment.create({
      beatId: new mongoose.Types.ObjectId(),
      authorId,
      text: 'Reportable comment',
    });

    const report = await ModerationReport.create({
      commentId: comment._id,
      userId: reporterId,
      authorId,
      state: 'Checking',
    });

    const response = await withAuth(
      api.get(`/api/v1/moderationReports/${report._id}`)
    ).expect(200);

    expect(response.body._id).toBe(report._id.toString());
    expect(response.body.commentId).toBe(comment._id.toString());
    expect(response.body.ratingId).toBeNull();
    expect(response.body.playlistId).toBeNull();
    expect(response.body.userId).toBe(reporterId.toString());
    expect(response.body.authorId).toBe(authorId.toString());
    expect(response.body.state).toBe('Checking');
    expect(response.body).toHaveProperty('createdAt');
    expect(response.body).toHaveProperty('updatedAt');
  });

  it('should return 404 if moderationReportId is not a valid ObjectId', async () => {
    const response = await withAuth(
      api.get('/api/v1/moderationReports/not-a-valid-id')
    ).expect(404);

    expect(response.body).toEqual({
      message: 'Moderation report not found',
    });
  });

  it('should return 404 if moderation report does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const response = await withAuth(
      api.get(`/api/v1/moderationReports/${fakeId}`)
    ).expect(404);

    expect(response.body).toEqual({
      message: 'Moderation report not found',
    });
  });

  it('should return 401 if user is not authenticated', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    await api.get(`/api/v1/moderationReports/${fakeId}`).expect(401);
  });
});

describe('GET /api/v1/moderationReports/me', () => {
  it('should return 200 and list only moderation reports where the authenticated user is the reported user (authorId)', async () => {
    const reporterA = new mongoose.Types.ObjectId();
    const reporterB = new mongoose.Types.ObjectId();
    const otherReportedUserId = new mongoose.Types.ObjectId();

    const myComment = await Comment.create({
      beatId: new mongoose.Types.ObjectId(),
      authorId: global.testUserId,
      text: 'My comment',
    });

    const myRating = await Rating.create({
      beatId: new mongoose.Types.ObjectId(),
      userId: global.testUserId,
      score: 4,
      comment: 'My rating',
    });

    const myPlaylist = await Playlist.create({
      name: 'My playlist',
      ownerId: global.testUserId,
      description: 'desc',
      isPublic: true,
      items: [],
    });

    const receivedCommentReport = await ModerationReport.create({
      commentId: myComment._id,
      userId: reporterA,
      authorId: myComment.authorId,
      state: 'Checking',
    });

    const receivedRatingReport = await ModerationReport.create({
      ratingId: myRating._id,
      userId: reporterB,
      authorId: myRating.userId,
      state: 'Checking',
    });

    const receivedPlaylistReport = await ModerationReport.create({
      playlistId: myPlaylist._id,
      userId: reporterA,
      authorId: myPlaylist.ownerId,
      state: 'Checking',
    });

    const otherComment = await Comment.create({
      beatId: new mongoose.Types.ObjectId(),
      authorId: otherReportedUserId,
      text: 'Other comment',
    });

    await ModerationReport.create({
      commentId: otherComment._id,
      userId: reporterA,
      authorId: otherComment.authorId,
      state: 'Checking',
    });

    const response = await withAuth(
      api.get('/api/v1/moderationReports/me')
    ).expect(200);

    expect(Array.isArray(response.body)).toBe(true);

    for (const r of response.body) {
      expect(r.authorId).toBe(global.testUserId);
    }

    const returnedIds = response.body.map((x) => x._id);
    expect(returnedIds).toEqual(
      expect.arrayContaining([
        receivedCommentReport._id.toString(),
        receivedRatingReport._id.toString(),
        receivedPlaylistReport._id.toString(),
      ])
    );
  });

  it('should return 200 and an empty array if the authenticated user has received no reports', async () => {
    await ModerationReport.deleteMany({ authorId: global.testUserId });

    const response = await withAuth(
      api.get('/api/v1/moderationReports/me')
    ).expect(200);

    expect(response.body).toEqual([]);
  });

  it('should return 401 if user is not authenticated', async () => {
    await api.get('/api/v1/moderationReports/me').expect(401);
  });
});

describe('GET /api/v1/moderationReports/users/:userId', () => {
  it('should return 200 and list only moderation reports where the specified user is the reported user', async () => {
    const targetUserId = new mongoose.Types.ObjectId();
    const reporter = new mongoose.Types.ObjectId();
    const otherUserId = new mongoose.Types.ObjectId();

    const targetComment = await Comment.create({
      beatId: new mongoose.Types.ObjectId(),
      authorId: targetUserId,
      text: 'Target comment',
    });

    const targetRating = await Rating.create({
      beatId: new mongoose.Types.ObjectId(),
      userId: targetUserId,
      score: 2,
      comment: 'Target rating',
    });

    const targetPlaylist = await Playlist.create({
      name: 'Target playlist',
      ownerId: targetUserId,
      description: 'desc',
      isPublic: true,
      items: [],
    });

    const targetCommentReport = await ModerationReport.create({
      commentId: targetComment._id,
      userId: reporter,
      authorId: targetComment.authorId,
      state: 'Checking',
    });

    const targetRatingReport = await ModerationReport.create({
      ratingId: targetRating._id,
      userId: reporter,
      authorId: targetRating.userId,
      state: 'Checking',
    });

    const targetPlaylistReport = await ModerationReport.create({
      playlistId: targetPlaylist._id,
      userId: reporter,
      authorId: targetPlaylist.ownerId,
      state: 'Checking',
    });

    const otherComment = await Comment.create({
      beatId: new mongoose.Types.ObjectId(),
      authorId: otherUserId,
      text: 'Other comment',
    });

    await ModerationReport.create({
      commentId: otherComment._id,
      userId: reporter,
      authorId: otherComment.authorId,
      state: 'Checking',
    });

    const response = await withAuth(
      api.get(`/api/v1/moderationReports/users/${targetUserId}`)
    ).expect(200);

    expect(Array.isArray(response.body)).toBe(true);

    for (const r of response.body) {
      expect(r.authorId).toBe(targetUserId.toString());
    }

    const returnedIds = response.body.map((x) => x._id);
    expect(returnedIds).toEqual(
      expect.arrayContaining([
        targetCommentReport._id.toString(),
        targetRatingReport._id.toString(),
        targetPlaylistReport._id.toString(),
      ])
    );
  });

  it('should return 200 and an empty array if user has no received reports', async () => {
    const targetUserId = new mongoose.Types.ObjectId();

    const response = await withAuth(
      api.get(`/api/v1/moderationReports/users/${targetUserId}`)
    ).expect(200);

    expect(response.body).toEqual([]);
  });

  it('should return 404 if userId is not a valid ObjectId', async () => {
    const response = await withAuth(
      api.get('/api/v1/moderationReports/users/not-a-valid-id')
    ).expect(404);

    expect(response.body).toEqual({ message: 'User not found' });
  });

  it('should return 401 if user is not authenticated', async () => {
    const targetUserId = new mongoose.Types.ObjectId();
    await api
      .get(`/api/v1/moderationReports/users/${targetUserId}`)
      .expect(401);
  });
});
