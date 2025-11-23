import mongoose from 'mongoose';
import { describe, it, expect } from 'vitest';
import commentService from '../../src/services/commentService.js';
import { Comment, Playlist } from '../../src/models/models.js';

describe('CommentService.createBeatComment', () => {
  const fakeAuthorId = new mongoose.Types.ObjectId();

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

    Comment.prototype.save = originalSave;
  });
});

describe('CommentService.createPlaylistComment', () => {
  const fakeAuthorId = new mongoose.Types.ObjectId();

  it('should create a comment on a public playlist', async () => {
    const playlist = await Playlist.create({
      name: 'Public playlist',
      ownerId: fakeAuthorId,
      isPublic: true,
    });

    const comment = await commentService.createPlaylistComment({
      playlistId: playlist._id,
      authorId: fakeAuthorId,
      text: 'Great playlist!',
    });

    expect(comment).toBeDefined();
    expect(comment.playlistId.toString()).toBe(playlist._id.toString());
    expect(comment.text).toBe('Great playlist!');

    const saved = await Comment.findById(comment._id);
    expect(saved).not.toBeNull();
  });

  it('should throw 404 if playlistId is invalid', async () => {
    await expect(
      commentService.createPlaylistComment({
        playlistId: 'invalid-id',
        authorId: fakeAuthorId,
        text: 'Test',
      })
    ).rejects.toMatchObject({
      status: 404,
      message: 'Playlist not found',
    });
  });

  it('should fail if playlist does not exist', async () => {
    const fakePlaylistId = new mongoose.Types.ObjectId();

    await expect(
      commentService.createPlaylistComment({
        playlistId: fakePlaylistId,
        authorId: fakeAuthorId,
        text: 'Hello',
      })
    ).rejects.toMatchObject({
      status: 422,
      message: 'The playlist being commented does not exist.',
    });
  });

  it('should fail if playlist is private', async () => {
    const playlist = await Playlist.create({
      name: 'Private playlist',
      ownerId: fakeAuthorId,
      isPublic: false,
    });

    await expect(
      commentService.createPlaylistComment({
        playlistId: playlist._id,
        authorId: fakeAuthorId,
        text: 'Hello',
      })
    ).rejects.toMatchObject({
      status: 422,
      message: 'You cannot comment on a private playlist.',
    });
  });

  it('should fail if text is empty or only spaces', async () => {
    const playlist = await Playlist.create({
      name: 'Public playlist',
      ownerId: fakeAuthorId,
      isPublic: true,
    });

    await expect(
      commentService.createPlaylistComment({
        playlistId: playlist._id,
        authorId: fakeAuthorId,
        text: '   ',
      })
    ).rejects.toMatchObject({
      status: 422,
      message: 'The comment cannot be empty or have only spaces.',
    });
  });

  it('should rethrow non-validation, non-status errors for playlist comments (e.g. DB error)', async () => {
    const playlist = await Playlist.create({
      name: 'Public playlist for error test',
      ownerId: fakeAuthorId,
      isPublic: true,
    });

    const originalSave = Comment.prototype.save;

    Comment.prototype.save = async function () {
      const error = new Error('Simulated DB error for playlist');
      error.name = 'SomeOtherError';
      throw error;
    };

    await expect(
      commentService.createPlaylistComment({
        playlistId: playlist._id,
        authorId: fakeAuthorId,
        text: 'Nice playlist!',
      })
    ).rejects.toHaveProperty('message', 'Simulated DB error for playlist');

    Comment.prototype.save = originalSave;
  });
});

describe('CommentService.getCommentById', () => {
  it('should return the comment when it exists', async () => {
    const authorId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();

    const created = await Comment.create({
      beatId,
      authorId,
      text: 'Comment to fetch',
    });

    const result = await commentService.getCommentById({
      commentId: created._id.toString(),
    });

    expect(result).toBeDefined();
    expect(result._id.toString()).toBe(created._id.toString());
    expect(result.text).toBe('Comment to fetch');
  });

  it('should throw 404 if commentId is not a valid ObjectId', async () => {
    await expect(
      commentService.getCommentById({ commentId: 'not-a-valid-id' })
    ).rejects.toMatchObject({
      status: 404,
      message: 'Comment not found',
    });
  });

  it('should throw 404 if comment does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    await expect(
      commentService.getCommentById({ commentId: fakeId })
    ).rejects.toMatchObject({
      status: 404,
      message: 'Comment not found',
    });
  });

  it('should rethrow unexpected errors (e.g. DB error on find)', async () => {
    const originalFindById = Comment.findById;

    Comment.findById = async () => {
      const err = new Error('Simulated DB error on findById');
      err.name = 'SomeOtherError';
      throw err;
    };

    const someId = new mongoose.Types.ObjectId().toString();

    await expect(
      commentService.getCommentById({ commentId: someId })
    ).rejects.toHaveProperty('message', 'Simulated DB error on findById');

    Comment.findById = originalFindById;
  });
});
