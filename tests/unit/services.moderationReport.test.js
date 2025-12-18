import mongoose from 'mongoose';
import { describe, it, expect } from 'vitest';
import moderationReportService from '../../src/services/moderationReportService.js';
import {
  ModerationReport,
  Comment,
  Playlist,
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
