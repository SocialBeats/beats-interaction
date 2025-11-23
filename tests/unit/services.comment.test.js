import mongoose from 'mongoose';
import { describe, it, expect } from 'vitest';
import commentService from '../../src/services/commentService.js';
import { Comment } from '../../src/models/models.js';

describe('CommentService.createBeatComment', () => {
  const fakeAuthorId = new mongoose.Types.ObjectId();

  //   beforeEach(async () => {
  //     await Comment.deleteMany({});
  //   });

  it('should create a comment with valid beatId, authorId and text', async () => {
    const beatId = new mongoose.Types.ObjectId();

    const comment = await commentService.createBeatComment({
      beatId,
      authorId: fakeAuthorId,
      text: 'Nice beat bro!',
    });

    expect(comment).toBeDefined();
    expect(comment._id).toBeDefined();
    expect(comment.beatId.toString()).toBe(beatId.toString());
    expect(comment.authorId.toString()).toBe(fakeAuthorId.toString());
    expect(comment.text).toBe('Nice beat bro!');
    expect(comment.createdAt).toBeInstanceOf(Date);
  });

  it('should throw 404 if beatId is not a valid ObjectId', async () => {
    await expect(
      commentService.createBeatComment({
        beatId: 'not-a-valid-objectid',
        authorId: fakeAuthorId,
        text: 'Test comment',
      })
    ).rejects.toMatchObject({
      status: 404,
      message: 'Beat not found',
    });
  });

  it('should throw 422 if authorId is missing (validation error)', async () => {
    const beatId = new mongoose.Types.ObjectId();

    await expect(
      commentService.createBeatComment({
        beatId,
        authorId: undefined,
        text: 'Nice beat',
      })
    ).rejects.toMatchObject({
      status: 422,
    });
  });

  it('should throw 422 if text is empty or only spaces', async () => {
    const beatId = new mongoose.Types.ObjectId();

    await expect(
      commentService.createBeatComment({
        beatId,
        authorId: fakeAuthorId,
        text: '   ',
      })
    ).rejects.toMatchObject({
      status: 422,
      message: 'The comment cannot be empty or have only spaces.',
    });
  });

  it('should throw 422 if text exceeds maxlength', async () => {
    const beatId = new mongoose.Types.ObjectId();
    const longText = 'a'.repeat(201); // maxlength 200

    await expect(
      commentService.createBeatComment({
        beatId,
        authorId: fakeAuthorId,
        text: longText,
      })
    ).rejects.toMatchObject({
      status: 422,
    });
  });

  it('should rethrow non-validation, non-status errors (e.g. DB error on save)', async () => {
    const beatId = new mongoose.Types.ObjectId();
    // mock the save method to throw a generic error
    const originalSave = Comment.prototype.save;

    Comment.prototype.save = async function () {
      const error = new Error('Simulated DB error');
      error.name = 'SomeOtherError';
      throw error;
    };

    await expect(
      commentService.createBeatComment({
        beatId,
        authorId: fakeAuthorId,
        text: 'Nice beat!',
      })
    ).rejects.toHaveProperty('message', 'Simulated DB error');

    // restore the original save method to avoid affecting other tests
    Comment.prototype.save = originalSave;
  });
});
