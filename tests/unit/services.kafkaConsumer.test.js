import { describe, it, expect, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import {
  BeatMaterialized,
  UserMaterialized,
  Playlist,
  Rating,
  Comment,
} from '../../src/models/models.js';
import { processEvent } from '../../src/services/kafkaConsumer.js';

describe('Kafka Materialized Events Test', () => {
  const oid = () => new mongoose.Types.ObjectId();

  beforeEach(async () => {
    await Promise.all([
      BeatMaterialized.deleteMany({}),
      UserMaterialized.deleteMany({}),
      Playlist.deleteMany({}),
      Rating.deleteMany({}),
      Comment.deleteMany({}),
    ]);
  });

  it('BEAT_CREATED ➝ should store a new beat', async () => {
    const event = {
      type: 'BEAT_CREATED',
      payload: {
        _id: 'beat123',
        title: 'Drill Bogotá',
        artist: 'JuanBeats',
        bpm: 140,
        pricing: { isFree: true },
        stats: { plays: 0 },
      },
    };

    await processEvent(event);
    const beat = await BeatMaterialized.findOne({ beatId: 'beat123' });

    expect(beat).not.toBeNull();
    expect(beat.title).toBe('Drill Bogotá');
    expect(beat.isFree).toBe(true);
  });

  it('BEAT_UPDATED ➝ should modify existing data', async () => {
    await BeatMaterialized.create({ beatId: 'update1', title: 'Old name' });

    await processEvent({
      type: 'BEAT_UPDATED',
      payload: { _id: 'update1', title: 'New Name', bpm: 150 },
    });

    const beat = await BeatMaterialized.findOne({ beatId: 'update1' });

    expect(beat.title).toBe('New Name');
    expect(beat.bpm).toBe(150);
  });

  it('BEAT_DELETED ➝ should remove beat + ratings + comments + remove from playlists', async () => {
    const beatId = oid();
    const userId = oid();

    await BeatMaterialized.create({ beatId });

    await Comment.create({ beatId, authorId: userId, text: '🔥' });
    await Rating.create({ beatId, userId, score: 4 });

    await Playlist.create({
      name: 'Test Playlist',
      ownerId: oid(),
      items: [{ beatId, addedBy: userId }],
    });

    await processEvent({ type: 'BEAT_DELETED', payload: { _id: beatId } });

    expect(await BeatMaterialized.countDocuments()).toBe(0);
    expect(await Comment.countDocuments()).toBe(0);
    expect(await Rating.countDocuments()).toBe(0);

    const playlist = await Playlist.findOne({});
    expect(playlist.items).toHaveLength(0);
  });

  it('USER_CREATED ➝ should create materialized user', async () => {
    const event = {
      type: 'USER_CREATED',
      payload: {
        _id: 'user10',
        username: 'Neo',
        email: 'neo@test.com',
        roles: ['producer'],
      },
    };

    await processEvent(event);
    const user = await UserMaterialized.findOne({ userId: 'user10' });

    expect(user).not.toBeNull();
    expect(user.username).toBe('Neo');
  });

  it('USER_UPDATED ➝ should update existing user', async () => {
    await UserMaterialized.create({ userId: 'u-x', username: 'old' });

    await processEvent({
      type: 'USER_UPDATED',
      payload: { _id: 'u-x', username: 'new_name' },
    });

    const user = await UserMaterialized.findOne({ userId: 'u-x' });

    expect(user.username).toBe('new_name');
  });

  it('USER_DELETED ➝ should delete owned playlists + remove from collaborator lists + delete ratings & comments', async () => {
    const uid = oid();

    await UserMaterialized.create({
      userId: uid,
      username: 'Ghost',
      email: 'test@test.com',
    });

    const playlist1 = await Playlist.create({
      name: 'Owned playlist',
      ownerId: uid,
      items: [],
      isPublic: true,
    });

    const playlist2 = await Playlist.create({
      name: 'Collaborator playlist',
      ownerId: oid(),
      collaborators: [uid],
      isPublic: true,
    });

    await Comment.create({
      authorId: uid,
      playlistId: playlist2._id,
      text: 'Great track :O',
    });

    await Rating.create({
      userId: uid,
      playlistId: playlist2._id,
      score: 4,
    });

    await processEvent({
      type: 'USER_DELETED',
      payload: { _id: uid },
    });

    expect(await Playlist.countDocuments()).toBe(1);

    const pl = await Playlist.findOne({ name: 'Collaborator playlist' });
    expect(pl).not.toBeNull();
    expect(pl.collaborators).not.toContain(uid.toString());

    expect(await Comment.countDocuments()).toBe(0);
    expect(await Rating.countDocuments()).toBe(0);
    expect(await UserMaterialized.countDocuments()).toBe(0);
  });
});
