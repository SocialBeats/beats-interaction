import mongoose from 'mongoose';
import { describe, it, expect, beforeEach } from 'vitest';
import { Rating, Playlist } from '../../src/models/models.js';

describe('Rating model validations', () => {
  const fakeUserId = new mongoose.Types.ObjectId();

  it('should save a rating with only beatId', async () => {
    const rating = new Rating({
      beatId: new mongoose.Types.ObjectId(),
      userId: fakeUserId,
      score: 4,
      comment: 'Nice beat!',
    });
    await expect(rating.save()).resolves.toBeDefined();
  });

  it('should save a rating with only playlistId if playlist is public', async () => {
    const playlist = await Playlist.create({
      name: `Public Playlist ${new mongoose.Types.ObjectId()}`,
      ownerId: fakeUserId,
      isPublic: true,
    });

    const rating = new Rating({
      playlistId: playlist._id,
      userId: fakeUserId,
      score: 5,
      comment: 'Great playlist!',
    });

    await expect(rating.save()).resolves.toBeDefined();
  });

  it('should fail if both beatId and playlistId are present', async () => {
    const playlist = await Playlist.create({
      name: `Public Playlist ${new mongoose.Types.ObjectId()}`,
      ownerId: fakeUserId,
      isPublic: true,
    });

    const rating = new Rating({
      beatId: new mongoose.Types.ObjectId(),
      playlistId: playlist._id,
      userId: fakeUserId,
      score: 3,
    });

    await expect(rating.save()).rejects.toThrow(
      'A rating cannot be associated with both a beat and a playlist at the same time.'
    );
  });

  it('should fail if neither beatId nor playlistId are present', async () => {
    const rating = new Rating({
      userId: fakeUserId,
      score: 4,
    });

    await expect(rating.save()).rejects.toThrow(
      'A rating must be associated with either a beat or a playlist.'
    );
  });

  it('should fail if playlist is private', async () => {
    const privatePlaylist = await Playlist.create({
      name: `Private Playlist ${new mongoose.Types.ObjectId()}`,
      ownerId: fakeUserId,
      isPublic: false,
    });

    const rating = new Rating({
      playlistId: privatePlaylist._id,
      userId: fakeUserId,
      score: 4,
      comment: 'Cannot rate here',
    });

    await expect(rating.save()).rejects.toThrow(
      'You cannot rate a private playlist.'
    );
  });

  it('should fail if playlist does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const rating = new Rating({
      playlistId: fakeId,
      userId: fakeUserId,
      score: 4,
    });

    await expect(rating.save()).rejects.toThrow(
      'The playlist being rated does not exist.'
    );
  });

  it('should fail if score is below 1 or above 5', async () => {
    const ratingLow = new Rating({
      beatId: new mongoose.Types.ObjectId(),
      userId: fakeUserId,
      score: 0,
    });

    const ratingHigh = new Rating({
      beatId: new mongoose.Types.ObjectId(),
      userId: fakeUserId,
      score: 6,
    });

    await expect(ratingLow.save()).rejects.toThrow();
    await expect(ratingHigh.save()).rejects.toThrow();
  });

  it('should fail if comment exceeds maxlength', async () => {
    const longComment = 'a'.repeat(201); // maxlength 200
    const rating = new Rating({
      beatId: new mongoose.Types.ObjectId(),
      userId: fakeUserId,
      score: 4,
      comment: longComment,
    });

    await expect(rating.save()).rejects.toThrow();
  });

  it('should save a rating without comment', async () => {
    const rating = new Rating({
      beatId: new mongoose.Types.ObjectId(),
      userId: fakeUserId,
      score: 3,
    });

    await expect(rating.save()).resolves.toBeDefined();
  });
});
