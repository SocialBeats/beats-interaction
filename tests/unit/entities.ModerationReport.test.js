import mongoose from 'mongoose';
import { describe, it, expect } from 'vitest';
import {
  ModerationReport,
  Playlist,
  Comment,
  Rating,
} from '../../src/models/models.js';

describe('ModerationReport model validations', () => {
  const reporterId = new mongoose.Types.ObjectId();
  const authorId = new mongoose.Types.ObjectId();

  it('should save a report for a public playlist with correct authorId', async () => {
    const playlist = await Playlist.create({
      name: `Public Playlist ${new mongoose.Types.ObjectId()}`,
      ownerId: authorId,
      isPublic: true,
    });

    const report = new ModerationReport({
      playlistId: playlist._id,
      userId: reporterId,
      authorId,
      state: 'Checking',
    });

    await expect(report.save()).resolves.toBeDefined();
  });

  it('should save a report for a comment with correct authorId', async () => {
    const comment = await Comment.create({
      beatId: new mongoose.Types.ObjectId(),
      authorId,
      text: 'This is a comment',
    });

    const report = new ModerationReport({
      commentId: comment._id,
      userId: reporterId,
      authorId,
    });

    await expect(report.save()).resolves.toBeDefined();
  });

  it('should save a report for a rating with correct authorId', async () => {
    const rating = await Rating.create({
      beatId: new mongoose.Types.ObjectId(),
      userId: authorId,
      score: 4,
      comment: 'ok',
    });

    const report = new ModerationReport({
      ratingId: rating._id,
      userId: reporterId,
      authorId,
    });

    await expect(report.save()).resolves.toBeDefined();
  });

  it('should default state to Checking', async () => {
    const playlist = await Playlist.create({
      name: `Public Playlist ${new mongoose.Types.ObjectId()}`,
      ownerId: authorId,
      isPublic: true,
    });

    const report = await ModerationReport.create({
      playlistId: playlist._id,
      userId: reporterId,
      authorId,
    });

    expect(report.state).toBe('Checking');
  });

  it('should fail if none of commentId/ratingId/playlistId are present', async () => {
    const report = new ModerationReport({
      userId: reporterId,
      authorId,
    });

    await expect(report.save()).rejects.toThrow(
      'A moderation report must reference exactly one of: commentId, ratingId or playlistId.'
    );
  });

  it('should fail if more than one reference is present', async () => {
    const playlist = await Playlist.create({
      name: `Public Playlist ${new mongoose.Types.ObjectId()}`,
      ownerId: authorId,
      isPublic: true,
    });

    const comment = await Comment.create({
      beatId: new mongoose.Types.ObjectId(),
      authorId,
      text: 'hey',
    });

    const report = new ModerationReport({
      playlistId: playlist._id,
      commentId: comment._id,
      userId: reporterId,
      authorId,
    });

    await expect(report.save()).rejects.toThrow(
      'A moderation report must reference exactly one of: commentId, ratingId or playlistId.'
    );
  });

  it('should fail if user reports own content (userId === authorId)', async () => {
    const playlist = await Playlist.create({
      name: `Public Playlist ${new mongoose.Types.ObjectId()}`,
      ownerId: reporterId,
      isPublic: true,
    });

    const report = new ModerationReport({
      playlistId: playlist._id,
      userId: reporterId,
      authorId: reporterId,
    });

    await expect(report.save()).rejects.toThrow(
      'A user cannot report their own content.'
    );
  });

  it('should fail if playlist being reported does not exist', async () => {
    const report = new ModerationReport({
      playlistId: new mongoose.Types.ObjectId(),
      userId: reporterId,
      authorId,
    });

    await expect(report.save()).rejects.toThrow(
      'The playlist being reported does not exist.'
    );
  });

  it('should fail if playlist is private', async () => {
    const playlist = await Playlist.create({
      name: `Private Playlist ${new mongoose.Types.ObjectId()}`,
      ownerId: authorId,
      isPublic: false,
    });

    const report = new ModerationReport({
      playlistId: playlist._id,
      userId: reporterId,
      authorId,
    });

    await expect(report.save()).rejects.toThrow(
      'You cannot report a private playlist.'
    );
  });

  it('should fail if playlist authorId does not match ownerId', async () => {
    const playlist = await Playlist.create({
      name: `Public Playlist ${new mongoose.Types.ObjectId()}`,
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    const report = new ModerationReport({
      playlistId: playlist._id,
      userId: reporterId,
      authorId,
    });

    await expect(report.save()).rejects.toThrow(
      'authorId does not match the playlist owner.'
    );
  });

  it('should fail if comment being reported does not exist', async () => {
    const report = new ModerationReport({
      commentId: new mongoose.Types.ObjectId(),
      userId: reporterId,
      authorId,
    });

    await expect(report.save()).rejects.toThrow(
      'The comment being reported does not exist.'
    );
  });

  it('should fail if comment authorId does not match', async () => {
    const comment = await Comment.create({
      beatId: new mongoose.Types.ObjectId(),
      authorId: new mongoose.Types.ObjectId(),
      text: 'hello',
    });

    const report = new ModerationReport({
      commentId: comment._id,
      userId: reporterId,
      authorId,
    });

    await expect(report.save()).rejects.toThrow(
      'authorId does not match the comment author.'
    );
  });

  it('should fail if rating being reported does not exist', async () => {
    const report = new ModerationReport({
      ratingId: new mongoose.Types.ObjectId(),
      userId: reporterId,
      authorId,
    });

    await expect(report.save()).rejects.toThrow(
      'The rating being reported does not exist.'
    );
  });

  it('should fail if rating authorId does not match rating.userId', async () => {
    const realAuthor = new mongoose.Types.ObjectId();

    const rating = await Rating.create({
      beatId: new mongoose.Types.ObjectId(),
      userId: realAuthor,
      score: 5,
    });

    const report = new ModerationReport({
      ratingId: rating._id,
      userId: reporterId,
      authorId,
    });

    await expect(report.save()).rejects.toThrow(
      'authorId does not match the rating author.'
    );
  });

  it('should fail if state is not in enum', async () => {
    const playlist = await Playlist.create({
      name: `Public Playlist ${new mongoose.Types.ObjectId()}`,
      ownerId: authorId,
      isPublic: true,
    });

    const report = new ModerationReport({
      playlistId: playlist._id,
      userId: reporterId,
      authorId,
      state: 'Pending',
    });

    await expect(report.save()).rejects.toThrow();
  });

  it('should save reporting a rating on a beat (playlistId is null)', async () => {
    const rating = await Rating.create({
      beatId: new mongoose.Types.ObjectId(),
      userId: authorId,
      score: 3,
    });

    const report = new ModerationReport({
      ratingId: rating._id,
      userId: reporterId,
      authorId,
    });

    await expect(report.save()).resolves.toBeDefined();
  });

  it('should save a report for a comment on a PUBLIC playlist (covers comment.playlistId branch)', async () => {
    const playlist = await Playlist.create({
      name: `PL ${new mongoose.Types.ObjectId()}`,
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    const comment = await Comment.create({
      playlistId: playlist._id,
      authorId,
      text: 'comment on public playlist',
    });

    const report = new ModerationReport({
      commentId: comment._id,
      userId: reporterId,
      authorId,
    });

    await expect(report.save()).resolves.toBeDefined();
  });

  it('should fail if the playlist of the reported comment does not exist (covers !pl)', async () => {
    const playlist = await Playlist.create({
      name: `PL ${new mongoose.Types.ObjectId()}`,
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    const comment = await Comment.create({
      playlistId: playlist._id,
      authorId,
      text: 'comment then playlist deleted',
    });

    await Playlist.deleteOne({ _id: playlist._id });

    const report = new ModerationReport({
      commentId: comment._id,
      userId: reporterId,
      authorId,
    });

    await expect(report.save()).rejects.toThrow(
      'The playlist of the reported comment does not exist.'
    );
  });

  it('should fail if the comment belongs to a playlist that became private (covers !pl.isPublic)', async () => {
    const playlist = await Playlist.create({
      name: `PL ${new mongoose.Types.ObjectId()}`,
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    const comment = await Comment.create({
      playlistId: playlist._id,
      authorId,
      text: 'comment then playlist becomes private',
    });

    await Playlist.updateOne(
      { _id: playlist._id },
      { $set: { isPublic: false } }
    );

    const report = new ModerationReport({
      commentId: comment._id,
      userId: reporterId,
      authorId,
    });

    await expect(report.save()).rejects.toThrow(
      'You cannot report a comment from a private playlist.'
    );
  });

  it('should save a report for a rating on a PUBLIC playlist (covers rating.playlistId branch)', async () => {
    const playlist = await Playlist.create({
      name: `PL ${new mongoose.Types.ObjectId()}`,
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    const rating = await Rating.create({
      playlistId: playlist._id,
      userId: authorId,
      score: 4,
    });

    const report = new ModerationReport({
      ratingId: rating._id,
      userId: reporterId,
      authorId,
    });

    await expect(report.save()).resolves.toBeDefined();
  });

  it('should fail if the playlist of the reported rating does not exist (covers !pl)', async () => {
    const playlist = await Playlist.create({
      name: `PL ${new mongoose.Types.ObjectId()}`,
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    const rating = await Rating.create({
      playlistId: playlist._id,
      userId: authorId,
      score: 3,
    });

    await Playlist.deleteOne({ _id: playlist._id });

    const report = new ModerationReport({
      ratingId: rating._id,
      userId: reporterId,
      authorId,
    });

    await expect(report.save()).rejects.toThrow(
      'The playlist of the reported rating does not exist.'
    );
  });

  it('should fail if the rating belongs to a playlist that became private (covers !pl.isPublic)', async () => {
    const playlist = await Playlist.create({
      name: `PL ${new mongoose.Types.ObjectId()}`,
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
    });

    const rating = await Rating.create({
      playlistId: playlist._id,
      userId: authorId,
      score: 2,
    });

    await Playlist.updateOne(
      { _id: playlist._id },
      { $set: { isPublic: false } }
    );

    const report = new ModerationReport({
      ratingId: rating._id,
      userId: reporterId,
      authorId,
    });

    await expect(report.save()).rejects.toThrow(
      'You cannot report a rating from a private playlist.'
    );
  });
});
