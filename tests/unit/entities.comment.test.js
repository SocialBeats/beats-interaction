import mongoose from 'mongoose';
import { describe, it, expect } from 'vitest';
import { Comment, Playlist } from '../../src/models/models';

describe('Comment model validations', () => {
  const fakeUserId = new mongoose.Types.ObjectId();

  it('should save a comment with only beatId', async () => {
    const comment = new Comment({
      beatId: new mongoose.Types.ObjectId(),
      authorId: fakeUserId,
      text: 'Nice beat!',
    });
    await expect(comment.save()).resolves.toBeDefined();
  });

  it('should save a comment with only playlistId if playlist is public', async () => {
    const playlist = await Playlist.create({
      name: `Public Playlist ${new mongoose.Types.ObjectId()}`,
      ownerId: fakeUserId,
      isPublic: true,
    });

    const comment = new Comment({
      playlistId: playlist._id,
      authorId: fakeUserId,
      text: 'Great playlist!',
    });

    await expect(comment.save()).resolves.toBeDefined();
  });

  it('should fail if both beatId and playlistId are present', async () => {
    const playlist = await Playlist.create({
      name: `Public Playlist ${new mongoose.Types.ObjectId()}`,
      ownerId: fakeUserId,
      isPublic: true,
    });

    const comment = new Comment({
      beatId: new mongoose.Types.ObjectId(),
      playlistId: playlist._id,
      authorId: fakeUserId,
      text: 'Invalid comment',
    });

    await expect(comment.save()).rejects.toThrow(
      'A comment cannot be associated with both a beat and a playlist at the same time.'
    );
  });

  it('should fail if neither beatId nor playlistId are present', async () => {
    const comment = new Comment({
      authorId: fakeUserId,
      text: 'Invalid comment',
    });

    await expect(comment.save()).rejects.toThrow(
      'A comment must be associated with either a beat or a playlist.'
    );
  });

  it('should fail if playlist is private', async () => {
    const privatePlaylist = await Playlist.create({
      name: `Private Playlist ${new mongoose.Types.ObjectId()}`,
      ownerId: fakeUserId,
      isPublic: false,
    });

    const comment = new Comment({
      playlistId: privatePlaylist._id,
      authorId: fakeUserId,
      text: 'Cannot comment here',
    });

    await expect(comment.save()).rejects.toThrow(
      'You cannot comment on a private playlist.'
    );
  });

  it('should fail if playlist does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const comment = new Comment({
      playlistId: fakeId,
      authorId: fakeUserId,
      text: 'Nonexistent playlist',
    });

    await expect(comment.save()).rejects.toThrow(
      'The playlist being commented does not exist.'
    );
  });

  it('should fail if text is empty or only spaces', async () => {
    const comment = new Comment({
      beatId: new mongoose.Types.ObjectId(),
      authorId: fakeUserId,
      text: '   ',
    });

    await expect(comment.save()).rejects.toThrow(
      'The comment cannot be empty or have only spaces.'
    );
  });

  it('should fail if text exceeds maxlength', async () => {
    const longText = 'a'.repeat(201); // maxlength 200
    const comment = new Comment({
      beatId: new mongoose.Types.ObjectId(),
      authorId: fakeUserId,
      text: longText,
    });

    await expect(comment.save()).rejects.toThrow();
  });
});
