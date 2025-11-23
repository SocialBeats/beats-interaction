import mongoose from 'mongoose';
import { describe, it, expect } from 'vitest';
import commentService from '../../src/services/commentService.js';
import { Comment, Playlist } from '../../src/models/models.js';

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

describe('CommentService.listBeatComments', () => {
  it('should list comments for a beat with default pagination', async () => {
    const beatId = new mongoose.Types.ObjectId();
    const otherBeatId = new mongoose.Types.ObjectId();
    const authorId = new mongoose.Types.ObjectId();

    // create 5 comments for beatId
    const commentsToCreate = Array.from({ length: 5 }, (_, i) => ({
      beatId,
      authorId,
      text: `Comment ${i + 1}`,
    }));
    await Comment.insertMany(commentsToCreate);

    // and 2 comments for another beat (should not appear)
    await Comment.insertMany([
      { beatId: otherBeatId, authorId, text: 'Other 1' },
      { beatId: otherBeatId, authorId, text: 'Other 2' },
    ]);

    const result = await commentService.listBeatComments({
      beatId,
      // page and limit default: 1, 20
    });

    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.total).toBe(5);
    expect(result.data).toHaveLength(5);
    result.data.forEach((c) => {
      expect(c.beatId.toString()).toBe(beatId.toString());
    });
  });

  it('should clamp page below 1 to 1', async () => {
    const beatId = new mongoose.Types.ObjectId();
    const authorId = new mongoose.Types.ObjectId();

    await Comment.insertMany(
      Array.from({ length: 3 }, (_, i) => ({
        beatId,
        authorId,
        text: `Comment P${i + 1}`,
      }))
    );

    const result = await commentService.listBeatComments({
      beatId,
      page: 0, // invalid, expected to use 1
      limit: 2,
    });

    expect(result.page).toBe(1);
    expect(result.limit).toBe(2);
    expect(result.data).toHaveLength(2);
  });

  it('should clamp page above maxPage to the last page', async () => {
    const beatId = new mongoose.Types.ObjectId();
    const authorId = new mongoose.Types.ObjectId();

    await Comment.insertMany(
      Array.from({ length: 5 }, (_, i) => ({
        beatId,
        authorId,
        text: `Comment C${i + 1}`,
      }))
    );

    // total = 5, limit = 2: maxPage = 3
    const result = await commentService.listBeatComments({
      beatId,
      page: 10, // way too high
      limit: 2,
    });

    expect(result.page).toBe(3);
    expect(result.limit).toBe(2);
    expect(result.total).toBe(5);
    expect(result.data).toHaveLength(1); // last page only has 1
  });

  it('should normalize limit < 1 to default (20)', async () => {
    const beatId = new mongoose.Types.ObjectId();
    const authorId = new mongoose.Types.ObjectId();

    await Comment.insertMany(
      Array.from({ length: 3 }, (_, i) => ({
        beatId,
        authorId,
        text: `Comment L${i + 1}`,
      }))
    );

    const result = await commentService.listBeatComments({
      beatId,
      page: 1,
      limit: 0, // invalid
    });

    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.total).toBe(3);
    expect(result.data).toHaveLength(3);
  });

  it('should clamp limit above max to 100', async () => {
    const beatId = new mongoose.Types.ObjectId();
    const authorId = new mongoose.Types.ObjectId();

    await Comment.insertMany(
      Array.from({ length: 10 }, (_, i) => ({
        beatId,
        authorId,
        text: `Comment XL${i + 1}`,
      }))
    );

    const result = await commentService.listBeatComments({
      beatId,
      page: 1,
      limit: 1000, // way too high, 100
    });

    expect(result.page).toBe(1);
    expect(result.limit).toBe(100);
    expect(result.total).toBe(10);
    expect(result.data).toHaveLength(10); // only 10 in total
  });

  it('should throw 404 if beatId is not a valid ObjectId', async () => {
    await expect(
      commentService.listBeatComments({
        beatId: 'not-a-valid-id',
        page: 1,
        limit: 10,
      })
    ).rejects.toMatchObject({
      status: 404,
      message: 'Beat not found',
    });
  });

  it('should rethrow unexpected errors (e.g. DB error in countDocuments)', async () => {
    const beatId = new mongoose.Types.ObjectId();

    const originalCountDocuments = Comment.countDocuments;

    Comment.countDocuments = async () => {
      const err = new Error('Simulated countDocuments error');
      err.name = 'SomeOtherError';
      throw err;
    };

    await expect(
      commentService.listBeatComments({
        beatId,
        page: 1,
        limit: 10,
      })
    ).rejects.toHaveProperty('message', 'Simulated countDocuments error');

    Comment.countDocuments = originalCountDocuments;
  });
});

describe('CommentService.listPlaylistComments', () => {
  it('should list comments for a playlist with default pagination', async () => {
    const playlist = await Playlist.create({
      name: 'Test playlist',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    const authorId = new mongoose.Types.ObjectId();

    await Comment.insertMany(
      Array.from({ length: 5 }, (_, i) => ({
        playlistId: playlist._id,
        authorId,
        text: `Playlist comment ${i + 1}`,
      }))
    );

    const result = await commentService.listPlaylistComments({
      playlistId: playlist._id,
      // default page and limit
    });

    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.total).toBe(5);
    expect(result.data).toHaveLength(5);
    result.data.forEach((c) => {
      expect(c.playlistId.toString()).toBe(playlist._id.toString());
    });
  });

  it('should clamp page below 1 to 1', async () => {
    const playlist = await Playlist.create({
      name: 'Page low playlist',
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

    const result = await commentService.listPlaylistComments({
      playlistId: playlist._id,
      page: 0, // invalid, normalized to 1
      limit: 2,
    });

    expect(result.page).toBe(1);
    expect(result.limit).toBe(2);
    expect(result.data).toHaveLength(2);
  });

  it('should clamp page above maxPage to the last page', async () => {
    const playlist = await Playlist.create({
      name: 'Page high playlist',
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
    const result = await commentService.listPlaylistComments({
      playlistId: playlist._id,
      page: 999, // very high, clamped to 3
      limit: 2,
    });

    expect(result.page).toBe(3);
    expect(result.limit).toBe(2);
    expect(result.total).toBe(5);
    expect(result.data).toHaveLength(1); // última página
  });

  it('should normalize limit < 1 to default (20)', async () => {
    const playlist = await Playlist.create({
      name: 'Limit low playlist',
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

    const result = await commentService.listPlaylistComments({
      playlistId: playlist._id,
      page: 1,
      limit: 0, // invalid, normalized to 20
    });

    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.total).toBe(3);
    expect(result.data).toHaveLength(3);
  });

  it('should clamp limit above max to 100', async () => {
    const playlist = await Playlist.create({
      name: 'Limit high playlist',
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

    const result = await commentService.listPlaylistComments({
      playlistId: playlist._id,
      page: 1,
      limit: 1000, // too high, clamped to 100
    });

    expect(result.page).toBe(1);
    expect(result.limit).toBe(100);
    expect(result.total).toBe(10);
    expect(result.data).toHaveLength(10);
  });

  it('should throw 404 if playlistId is not a valid ObjectId', async () => {
    await expect(
      commentService.listPlaylistComments({
        playlistId: 'not-a-valid-id',
        page: 1,
        limit: 10,
      })
    ).rejects.toMatchObject({
      status: 404,
      message: 'Playlist not found',
    });
  });

  it('should rethrow unexpected errors (e.g. DB error in countDocuments)', async () => {
    const playlistId = new mongoose.Types.ObjectId();

    const originalCountDocuments = Comment.countDocuments;

    Comment.countDocuments = async () => {
      const err = new Error('Simulated countDocuments error (playlist)');
      err.name = 'SomeOtherError';
      throw err;
    };

    await expect(
      commentService.listPlaylistComments({
        playlistId,
        page: 1,
        limit: 10,
      })
    ).rejects.toHaveProperty(
      'message',
      'Simulated countDocuments error (playlist)'
    );

    Comment.countDocuments = originalCountDocuments;
  });
});

describe('CommentService.deleteCommentById', () => {
  it('should delete comment if it exists and belongs to the user', async () => {
    const userId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();

    const created = await Comment.create({
      beatId,
      authorId: userId,
      text: 'Comment to delete',
    });

    const result = await commentService.deleteCommentById(
      created._id.toString(),
      userId.toString()
    );

    expect(result).toEqual({ deleted: true });

    const inDb = await Comment.findById(created._id);
    expect(inDb).toBeNull();
  });

  it('should return deleted: false if commentId is not a valid ObjectId', async () => {
    const userId = new mongoose.Types.ObjectId();

    const result = await commentService.deleteCommentById(
      'not-a-valid-id',
      userId.toString()
    );

    expect(result).toEqual({ deleted: false });
  });

  it('should return deleted: false if comment does not exist', async () => {
    const userId = new mongoose.Types.ObjectId();
    const fakeId = new mongoose.Types.ObjectId().toString();

    const result = await commentService.deleteCommentById(
      fakeId,
      userId.toString()
    );

    expect(result).toEqual({ deleted: false });
  });

  it('should throw 401 if comment exists but belongs to another user', async () => {
    const authorId = new mongoose.Types.ObjectId();
    const otherUserId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();

    const created = await Comment.create({
      beatId,
      authorId,
      text: 'Not your comment',
    });

    await expect(
      commentService.deleteCommentById(
        created._id.toString(),
        otherUserId.toString()
      )
    ).rejects.toMatchObject({
      status: 401,
      message: 'You are not allowed to delete this comment.',
    });

    const stillThere = await Comment.findById(created._id);
    expect(stillThere).not.toBeNull();
  });

  it('should rethrow unexpected errors (e.g. DB error on deleteOne)', async () => {
    const userId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();

    const created = await Comment.create({
      beatId,
      authorId: userId,
      text: 'Comment to trigger delete error',
    });

    const originalDeleteOne = Comment.deleteOne;

    Comment.deleteOne = async () => {
      const err = new Error('Simulated deleteOne error');
      err.name = 'SomeOtherError';
      throw err;
    };

    await expect(
      commentService.deleteCommentById(
        created._id.toString(),
        userId.toString()
      )
    ).rejects.toHaveProperty('message', 'Simulated deleteOne error');

    Comment.deleteOne = originalDeleteOne;
  });
});

describe('CommentService.updateCommentText', () => {
  it('should update the text of a comment if it exists and belongs to the user', async () => {
    const userId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();

    const created = await Comment.create({
      beatId,
      authorId: userId,
      text: 'Old text',
    });

    const updated = await commentService.updateCommentText({
      commentId: created._id.toString(),
      userId: userId.toString(),
      text: 'New updated text',
    });

    expect(updated).toBeDefined();
    expect(updated._id.toString()).toBe(created._id.toString());
    expect(updated.text).toBe('New updated text');

    const inDb = await Comment.findById(created._id);
    expect(inDb.text).toBe('New updated text');
  });

  it('should throw 404 if commentId is not a valid ObjectId', async () => {
    const userId = new mongoose.Types.ObjectId();

    await expect(
      commentService.updateCommentText({
        commentId: 'not-a-valid-id',
        userId: userId.toString(),
        text: 'Whatever',
      })
    ).rejects.toMatchObject({
      status: 404,
      message: 'Comment not found',
    });
  });

  it('should throw 404 if comment does not exist', async () => {
    const userId = new mongoose.Types.ObjectId();
    const fakeId = new mongoose.Types.ObjectId().toString();

    await expect(
      commentService.updateCommentText({
        commentId: fakeId,
        userId: userId.toString(),
        text: 'Whatever',
      })
    ).rejects.toMatchObject({
      status: 404,
      message: 'Comment not found',
    });
  });

  it('should throw 401 if the comment belongs to another user', async () => {
    const authorId = new mongoose.Types.ObjectId();
    const otherUserId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();

    const created = await Comment.create({
      beatId,
      authorId,
      text: 'Original text',
    });

    await expect(
      commentService.updateCommentText({
        commentId: created._id.toString(),
        userId: otherUserId.toString(),
        text: 'Hacked text',
      })
    ).rejects.toMatchObject({
      status: 401,
      message: 'You are not allowed to edit this comment.',
    });

    const stillInDb = await Comment.findById(created._id);
    expect(stillInDb.text).toBe('Original text');
  });

  it('should throw 422 if text is empty or only spaces', async () => {
    const userId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();

    const created = await Comment.create({
      beatId,
      authorId: userId,
      text: 'Some text',
    });

    await expect(
      commentService.updateCommentText({
        commentId: created._id.toString(),
        userId: userId.toString(),
        text: '   ',
      })
    ).rejects.toMatchObject({
      status: 422,
      message: 'The comment cannot be empty or have only spaces.',
    });

    const stillInDb = await Comment.findById(created._id);
    expect(stillInDb.text).toBe('Some text');
  });

  it('should throw 422 if text exceeds maxlength', async () => {
    const userId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();
    const longText = 'a'.repeat(201); // maxlength 200

    const created = await Comment.create({
      beatId,
      authorId: userId,
      text: 'Some text',
    });

    await expect(
      commentService.updateCommentText({
        commentId: created._id.toString(),
        userId: userId.toString(),
        text: longText,
      })
    ).rejects.toMatchObject({
      status: 422,
    });

    const stillInDb = await Comment.findById(created._id);
    expect(stillInDb.text).toBe('Some text');
  });

  it('should rethrow unexpected errors (e.g. DB error on save)', async () => {
    const userId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();

    const created = await Comment.create({
      beatId,
      authorId: userId,
      text: 'Original',
    });

    const originalSave = Comment.prototype.save;

    Comment.prototype.save = async function () {
      const err = new Error('Simulated save error on update');
      err.name = 'SomeOtherError';
      throw err;
    };

    await expect(
      commentService.updateCommentText({
        commentId: created._id.toString(),
        userId: userId.toString(),
        text: 'Trying to update',
      })
    ).rejects.toHaveProperty('message', 'Simulated save error on update');

    Comment.prototype.save = originalSave;
  });
});
