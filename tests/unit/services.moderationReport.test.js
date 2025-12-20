import mongoose from 'mongoose';
import { describe, it, expect } from 'vitest';
import moderationReportService from '../../src/services/moderationReportService.js';
import {
  ModerationReport,
  Comment,
  Playlist,
  Rating,
} from '../../src/models/models.js';

describe('ModerationReportService.createCommentModerationReport', () => {
  const reporterId = new mongoose.Types.ObjectId();
  const authorId = new mongoose.Types.ObjectId();

  it('should create a moderation report for an existing comment', async () => {
    const comment = await Comment.create({
      beatId: new mongoose.Types.ObjectId(),
      authorId,
      text: 'Offensive comment',
    });

    const report = await moderationReportService.createCommentModerationReport({
      commentId: comment._id.toString(),
      userId: reporterId.toString(),
    });

    expect(report).toBeDefined();
    expect(report.commentId.toString()).toBe(comment._id.toString());
    expect(report.userId.toString()).toBe(reporterId.toString());
    expect(report.authorId.toString()).toBe(authorId.toString());
    expect(report.state).toBe('Checking');

    const inDb = await ModerationReport.findById(report._id);
    expect(inDb).not.toBeNull();
  });

  it('should throw 404 if commentId is not a valid ObjectId', async () => {
    await expect(
      moderationReportService.createCommentModerationReport({
        commentId: 'not-a-valid-id',
        userId: reporterId.toString(),
      })
    ).rejects.toMatchObject({
      status: 404,
      message: 'Comment not found',
    });
  });

  it('should throw 404 if comment does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    await expect(
      moderationReportService.createCommentModerationReport({
        commentId: fakeId.toString(),
        userId: reporterId.toString(),
      })
    ).rejects.toMatchObject({
      status: 404,
      message: 'Comment not found',
    });
  });

  it('should throw 422 if user reports own comment', async () => {
    const comment = await Comment.create({
      beatId: new mongoose.Types.ObjectId(),
      authorId: reporterId,
      text: 'Self report',
    });

    await expect(
      moderationReportService.createCommentModerationReport({
        commentId: comment._id.toString(),
        userId: reporterId.toString(),
      })
    ).rejects.toMatchObject({
      status: 422,
      message: 'A user cannot report their own content.',
    });
  });

  it('should throw 422 if the comment belongs to a playlist that became private', async () => {
    const playlist = await Playlist.create({
      name: 'Public playlist',
      ownerId: authorId,
      isPublic: true,
    });

    const comment = await Comment.create({
      playlistId: playlist._id,
      authorId,
      text: 'Comment on playlist',
    });

    await Playlist.updateOne(
      { _id: playlist._id },
      { $set: { isPublic: false } }
    );

    await expect(
      moderationReportService.createCommentModerationReport({
        commentId: comment._id.toString(),
        userId: reporterId.toString(),
      })
    ).rejects.toMatchObject({
      status: 422,
      message: 'You cannot report a comment from a private playlist.',
    });
  });

  it('should throw 422 (ValidationError) if userId is missing', async () => {
    const authorId = new mongoose.Types.ObjectId();

    const comment = await Comment.create({
      beatId: new mongoose.Types.ObjectId(),
      authorId,
      text: 'Reportable comment',
    });

    await expect(
      moderationReportService.createCommentModerationReport({
        commentId: comment._id.toString(),
        userId: undefined,
      })
    ).rejects.toMatchObject({
      status: 422,
    });
  });

  it('should throw 422 (ValidationError) with message built from err.errors', async () => {
    const authorId = new mongoose.Types.ObjectId();

    const comment = await Comment.create({
      beatId: new mongoose.Types.ObjectId(),
      authorId,
      text: 'Reportable comment',
    });

    await expect(
      moderationReportService.createCommentModerationReport({
        commentId: comment._id.toString(),
        userId: undefined,
      })
    ).rejects.toMatchObject({
      status: 422,
      message: expect.stringContaining('userId'),
    });
  });

  it('should rethrow unexpected errors (e.g. DB error on save)', async () => {
    const comment = await Comment.create({
      beatId: new mongoose.Types.ObjectId(),
      authorId,
      text: 'Trigger DB error',
    });

    const originalSave = ModerationReport.prototype.save;

    ModerationReport.prototype.save = async function () {
      const err = new Error('Simulated DB error');
      err.name = 'SomeOtherError';
      throw err;
    };

    await expect(
      moderationReportService.createCommentModerationReport({
        commentId: comment._id.toString(),
        userId: reporterId.toString(),
      })
    ).rejects.toHaveProperty('message', 'Simulated DB error');

    ModerationReport.prototype.save = originalSave;
  });
});

describe('ModerationReportService.createRatingModerationReport', () => {
  const reporterId = new mongoose.Types.ObjectId();
  const ratingAuthorId = new mongoose.Types.ObjectId();

  it('should create a moderation report for an existing rating', async () => {
    const rating = await Rating.create({
      beatId: new mongoose.Types.ObjectId(),
      userId: ratingAuthorId,
      score: 4,
      comment: 'Good',
    });

    const report = await moderationReportService.createRatingModerationReport({
      ratingId: rating._id.toString(),
      userId: reporterId.toString(),
    });

    expect(report).toBeDefined();
    expect(report.ratingId.toString()).toBe(rating._id.toString());
    expect(report.userId.toString()).toBe(reporterId.toString());
    expect(report.authorId.toString()).toBe(ratingAuthorId.toString());
    expect(report.state).toBe('Checking');

    const inDb = await ModerationReport.findById(report._id);
    expect(inDb).not.toBeNull();
  });

  it('should throw 404 if ratingId is not a valid ObjectId', async () => {
    await expect(
      moderationReportService.createRatingModerationReport({
        ratingId: 'not-a-valid-id',
        userId: reporterId.toString(),
      })
    ).rejects.toMatchObject({
      status: 404,
      message: 'Rating not found',
    });
  });

  it('should throw 404 if rating does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    await expect(
      moderationReportService.createRatingModerationReport({
        ratingId: fakeId.toString(),
        userId: reporterId.toString(),
      })
    ).rejects.toMatchObject({
      status: 404,
      message: 'Rating not found',
    });
  });

  it('should throw 422 if user reports own rating', async () => {
    const rating = await Rating.create({
      beatId: new mongoose.Types.ObjectId(),
      userId: reporterId,
      score: 5,
      comment: 'Self rating',
    });

    await expect(
      moderationReportService.createRatingModerationReport({
        ratingId: rating._id.toString(),
        userId: reporterId.toString(),
      })
    ).rejects.toMatchObject({
      status: 422,
      message: 'A user cannot report their own content.',
    });
  });

  it('should throw 422 if the rating belongs to a playlist that became private', async () => {
    const playlist = await Playlist.create({
      name: 'Public playlist',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    const rating = await Rating.create({
      playlistId: playlist._id,
      userId: ratingAuthorId,
      score: 3,
      comment: 'Rating on playlist',
    });

    await Playlist.updateOne(
      { _id: playlist._id },
      { $set: { isPublic: false } }
    );

    await expect(
      moderationReportService.createRatingModerationReport({
        ratingId: rating._id.toString(),
        userId: reporterId.toString(),
      })
    ).rejects.toMatchObject({
      status: 422,
      message: 'You cannot report a rating from a private playlist.',
    });
  });

  it('should throw 422 (ValidationError) if userId is missing', async () => {
    const rating = await Rating.create({
      beatId: new mongoose.Types.ObjectId(),
      userId: ratingAuthorId,
      score: 4,
      comment: 'Reportable',
    });

    await expect(
      moderationReportService.createRatingModerationReport({
        ratingId: rating._id.toString(),
        userId: undefined,
      })
    ).rejects.toMatchObject({
      status: 422,
    });
  });

  it('should throw 422 (ValidationError) with message built from err.errors', async () => {
    const rating = await Rating.create({
      beatId: new mongoose.Types.ObjectId(),
      userId: ratingAuthorId,
      score: 4,
      comment: 'Reportable',
    });

    await expect(
      moderationReportService.createRatingModerationReport({
        ratingId: rating._id.toString(),
        userId: undefined,
      })
    ).rejects.toMatchObject({
      status: 422,
      message: expect.stringContaining('userId'),
    });
  });

  it('should rethrow unexpected errors (e.g. DB error on save)', async () => {
    const rating = await Rating.create({
      beatId: new mongoose.Types.ObjectId(),
      userId: ratingAuthorId,
      score: 4,
      comment: 'Trigger DB error',
    });

    const originalSave = ModerationReport.prototype.save;

    ModerationReport.prototype.save = async function () {
      const err = new Error('Simulated DB error');
      err.name = 'SomeOtherError';
      throw err;
    };

    await expect(
      moderationReportService.createRatingModerationReport({
        ratingId: rating._id.toString(),
        userId: reporterId.toString(),
      })
    ).rejects.toHaveProperty('message', 'Simulated DB error');

    ModerationReport.prototype.save = originalSave;
  });
});

describe('ModerationReportService.createPlaylistModerationReport', () => {
  const reporterId = new mongoose.Types.ObjectId();
  const ownerId = new mongoose.Types.ObjectId();

  it('should create a moderation report for an existing public playlist', async () => {
    const playlist = await Playlist.create({
      name: 'Public playlist',
      ownerId,
      description: 'desc',
      isPublic: true,
      items: [],
    });

    const report = await moderationReportService.createPlaylistModerationReport(
      {
        playlistId: playlist._id.toString(),
        userId: reporterId.toString(),
      }
    );

    expect(report).toBeDefined();
    expect(report.playlistId.toString()).toBe(playlist._id.toString());
    expect(report.userId.toString()).toBe(reporterId.toString());
    expect(report.authorId.toString()).toBe(ownerId.toString());
    expect(report.state).toBe('Checking');

    const inDb = await ModerationReport.findById(report._id);
    expect(inDb).not.toBeNull();
  });

  it('should throw 404 if playlistId is not a valid ObjectId', async () => {
    await expect(
      moderationReportService.createPlaylistModerationReport({
        playlistId: 'not-a-valid-id',
        userId: reporterId.toString(),
      })
    ).rejects.toMatchObject({
      status: 404,
      message: 'Playlist not found',
    });
  });

  it('should throw 404 if playlist does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    await expect(
      moderationReportService.createPlaylistModerationReport({
        playlistId: fakeId.toString(),
        userId: reporterId.toString(),
      })
    ).rejects.toMatchObject({
      status: 404,
      message: 'Playlist not found',
    });
  });

  it('should throw 422 if user reports own playlist', async () => {
    const playlist = await Playlist.create({
      name: 'My playlist',
      ownerId: reporterId,
      description: 'desc',
      isPublic: true,
      items: [],
    });

    await expect(
      moderationReportService.createPlaylistModerationReport({
        playlistId: playlist._id.toString(),
        userId: reporterId.toString(),
      })
    ).rejects.toMatchObject({
      status: 422,
      message: 'A user cannot report their own content.',
    });
  });

  it('should throw 422 if playlist is private', async () => {
    const playlist = await Playlist.create({
      name: 'Private playlist',
      ownerId,
      description: 'desc',
      isPublic: false,
      items: [],
    });

    await expect(
      moderationReportService.createPlaylistModerationReport({
        playlistId: playlist._id.toString(),
        userId: reporterId.toString(),
      })
    ).rejects.toMatchObject({
      status: 422,
      message: 'You cannot report a private playlist.',
    });
  });

  it('should throw 422 (ValidationError) if userId is missing', async () => {
    const playlist = await Playlist.create({
      name: 'Public playlist',
      ownerId,
      description: 'desc',
      isPublic: true,
      items: [],
    });

    await expect(
      moderationReportService.createPlaylistModerationReport({
        playlistId: playlist._id.toString(),
        userId: undefined,
      })
    ).rejects.toMatchObject({
      status: 422,
    });
  });

  it('should throw 422 (ValidationError) with message built from err.errors', async () => {
    const playlist = await Playlist.create({
      name: 'Public playlist',
      ownerId,
      description: 'desc',
      isPublic: true,
      items: [],
    });

    await expect(
      moderationReportService.createPlaylistModerationReport({
        playlistId: playlist._id.toString(),
        userId: undefined,
      })
    ).rejects.toMatchObject({
      status: 422,
      message: expect.stringContaining('userId'),
    });
  });

  it('should rethrow unexpected errors (e.g. DB error on save)', async () => {
    const playlist = await Playlist.create({
      name: 'Public playlist',
      ownerId,
      description: 'desc',
      isPublic: true,
      items: [],
    });

    const originalSave = ModerationReport.prototype.save;

    ModerationReport.prototype.save = async function () {
      const err = new Error('Simulated DB error');
      err.name = 'SomeOtherError';
      throw err;
    };

    await expect(
      moderationReportService.createPlaylistModerationReport({
        playlistId: playlist._id.toString(),
        userId: reporterId.toString(),
      })
    ).rejects.toHaveProperty('message', 'Simulated DB error');

    ModerationReport.prototype.save = originalSave;
  });
});

describe('ModerationReportService.getModerationReportById', () => {
  it('should return a moderation report by id', async () => {
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

    const found = await moderationReportService.getModerationReportById({
      moderationReportId: report._id.toString(),
    });

    expect(found).toBeDefined();
    expect(found._id.toString()).toBe(report._id.toString());
  });

  it('should throw 404 if moderationReportId is not a valid ObjectId', async () => {
    await expect(
      moderationReportService.getModerationReportById({
        moderationReportId: 'not-a-valid-id',
      })
    ).rejects.toMatchObject({
      status: 404,
      message: 'Moderation report not found',
    });
  });

  it('should throw 404 if moderation report does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    await expect(
      moderationReportService.getModerationReportById({
        moderationReportId: fakeId.toString(),
      })
    ).rejects.toMatchObject({
      status: 404,
      message: 'Moderation report not found',
    });
  });

  it('should rethrow unexpected errors (e.g. DB error on findById)', async () => {
    const originalFindById = ModerationReport.findById;

    ModerationReport.findById = async () => {
      throw new Error('Simulated DB error');
    };

    const someId = new mongoose.Types.ObjectId().toString();

    await expect(
      moderationReportService.getModerationReportById({
        moderationReportId: someId,
      })
    ).rejects.toHaveProperty('message', 'Simulated DB error');

    ModerationReport.findById = originalFindById;
  });
});
