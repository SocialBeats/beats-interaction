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

describe('ModerationReportService.getModerationReportsByUser', () => {
  it('should return only reports where the given userId is the reported user', async () => {
    const reportedUserId = new mongoose.Types.ObjectId();
    const otherUserId = new mongoose.Types.ObjectId();
    const reporter = new mongoose.Types.ObjectId();

    const c1 = await Comment.create({
      beatId: new mongoose.Types.ObjectId(),
      authorId: reportedUserId,
      text: 'A',
    });

    const c2 = await Comment.create({
      beatId: new mongoose.Types.ObjectId(),
      authorId: reportedUserId,
      text: 'B',
    });

    const r1 = await ModerationReport.create({
      commentId: c1._id,
      userId: reporter,
      authorId: c1.authorId,
      state: 'Checking',
    });

    const r2 = await ModerationReport.create({
      commentId: c2._id,
      userId: reporter,
      authorId: c2.authorId,
      state: 'Checking',
    });

    const c3 = await Comment.create({
      beatId: new mongoose.Types.ObjectId(),
      authorId: otherUserId,
      text: 'C',
    });

    await ModerationReport.create({
      commentId: c3._id,
      userId: reporter,
      authorId: c3.authorId,
      state: 'Checking',
    });

    const reports = await moderationReportService.getModerationReportsByUser({
      userId: reportedUserId.toString(),
    });

    expect(reports.length).toBe(2);

    const ids = reports.map((x) => x._id.toString());
    expect(ids).toEqual(
      expect.arrayContaining([r1._id.toString(), r2._id.toString()])
    );
  });

  it('should return an empty array if userId has no received reports', async () => {
    const reportedUserId = new mongoose.Types.ObjectId();

    const reports = await moderationReportService.getModerationReportsByUser({
      userId: reportedUserId.toString(),
    });

    expect(reports).toEqual([]);
  });

  it('should rethrow unexpected errors', async () => {
    const originalFind = ModerationReport.find;

    ModerationReport.find = () => {
      throw new Error('Simulated DB error');
    };

    await expect(
      moderationReportService.getModerationReportsByUser({
        userId: new mongoose.Types.ObjectId().toString(),
      })
    ).rejects.toHaveProperty('message', 'Simulated DB error');

    ModerationReport.find = originalFind;
  });
});

describe('ModerationReportService.getModerationReportsByUserId', () => {
  it('should return reports sorted desc by createdAt', async () => {
    const reportedUserId = new mongoose.Types.ObjectId();
    const reporter = new mongoose.Types.ObjectId();

    const comment = await Comment.create({
      beatId: new mongoose.Types.ObjectId(),
      authorId: reportedUserId,
      text: 'Reported',
    });

    const first = await ModerationReport.create({
      commentId: comment._id,
      userId: reporter,
      authorId: comment.authorId,
      createdAt: new Date('2020-01-01'),
      updatedAt: new Date('2020-01-01'),
      state: 'Checking',
    });

    const second = await ModerationReport.create({
      commentId: comment._id,
      userId: reporter,
      authorId: comment.authorId,
      createdAt: new Date('2021-01-01'),
      updatedAt: new Date('2021-01-01'),
      state: 'Checking',
    });

    const reports = await moderationReportService.getModerationReportsByUserId({
      userId: reportedUserId.toString(),
    });

    expect(reports.length).toBe(2);
    expect(reports[0]._id.toString()).toBe(second._id.toString());
    expect(reports[1]._id.toString()).toBe(first._id.toString());
  });

  it('should return an empty array if user has no received reports', async () => {
    const reportedUserId = new mongoose.Types.ObjectId();

    const reports = await moderationReportService.getModerationReportsByUserId({
      userId: reportedUserId.toString(),
    });

    expect(reports).toEqual([]);
  });

  it('should throw 404 if userId is not a valid ObjectId', async () => {
    await expect(
      moderationReportService.getModerationReportsByUserId({
        userId: 'not-a-valid-id',
      })
    ).rejects.toMatchObject({
      status: 404,
      message: 'User not found',
    });
  });
});

describe('ModerationReportService.getAllModerationReports', () => {
  it('should return all moderation reports (sorted desc by createdAt)', async () => {
    await ModerationReport.deleteMany({});

    const reportedUserA = new mongoose.Types.ObjectId();
    const reportedUserB = new mongoose.Types.ObjectId();
    const reporterA = new mongoose.Types.ObjectId();
    const reporterB = new mongoose.Types.ObjectId();

    const commentA = await Comment.create({
      beatId: new mongoose.Types.ObjectId(),
      authorId: reportedUserA,
      text: 'Reported comment A',
    });

    const ratingB = await Rating.create({
      beatId: new mongoose.Types.ObjectId(),
      userId: reportedUserB,
      score: 4,
      comment: 'Reported rating B',
    });

    const playlistA = await Playlist.create({
      name: 'Reported playlist A',
      ownerId: reportedUserA,
      description: 'desc',
      isPublic: true,
      items: [],
    });

    const first = await ModerationReport.create({
      commentId: commentA._id,
      userId: reporterA,
      authorId: reportedUserA,
      createdAt: new Date('2020-01-01'),
      updatedAt: new Date('2020-01-01'),
    });

    const second = await ModerationReport.create({
      ratingId: ratingB._id,
      userId: reporterB,
      authorId: reportedUserB,
      createdAt: new Date('2021-01-01'),
      updatedAt: new Date('2021-01-01'),
    });

    const third = await ModerationReport.create({
      playlistId: playlistA._id,
      userId: reporterA,
      authorId: reportedUserA,
      createdAt: new Date('2022-01-01'),
      updatedAt: new Date('2022-01-01'),
    });

    const reports = await moderationReportService.getAllModerationReports();

    expect(Array.isArray(reports)).toBe(true);
    expect(reports.length).toBe(3);

    expect(reports[0]._id.toString()).toBe(third._id.toString());
    expect(reports[1]._id.toString()).toBe(second._id.toString());
    expect(reports[2]._id.toString()).toBe(first._id.toString());
  });

  it('should return an empty array if there are no moderation reports', async () => {
    await ModerationReport.deleteMany({});
    const reports = await moderationReportService.getAllModerationReports();
    expect(reports).toEqual([]);
  });

  it('should rethrow unexpected errors (e.g. DB error on find)', async () => {
    const originalFind = ModerationReport.find;

    ModerationReport.find = () => {
      throw new Error('Simulated DB error');
    };

    await expect(
      moderationReportService.getAllModerationReports()
    ).rejects.toHaveProperty('message', 'Simulated DB error');

    ModerationReport.find = originalFind;
  });
});
