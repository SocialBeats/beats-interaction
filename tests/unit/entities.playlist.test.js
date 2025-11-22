import mongoose from 'mongoose';
import { describe, it, expect, beforeEach } from 'vitest';
import { Playlist } from '../../src/models/models';

describe('Playlist model validations', () => {
  const fakeUserId = new mongoose.Types.ObjectId();
  const fakeCollaboratorId = new mongoose.Types.ObjectId();

  it('should save a valid playlist', async () => {
    const playlist = new Playlist({
      ownerId: fakeUserId,
      name: 'Trap Beats',
      description: 'Beats oscuros y drill',
      isPublic: true,
      collaborators: [fakeCollaboratorId],
      items: [
        { beatId: new mongoose.Types.ObjectId(), addedBy: fakeUserId },
        { beatId: new mongoose.Types.ObjectId(), addedBy: fakeUserId },
      ],
    });

    await expect(playlist.save()).resolves.toBeDefined();
  });

  it('should fail if name is empty or spaces', async () => {
    const playlist = new Playlist({
      ownerId: fakeUserId,
      name: '   ',
      isPublic: true,
    });

    await expect(playlist.save()).rejects.toThrow(
      'The name cannot be empty or have only spaces.'
    );
  });

  it('should fail if name exceeds maxlength', async () => {
    const longName = 'a'.repeat(51); // maxlength 50
    const playlist = new Playlist({
      ownerId: fakeUserId,
      name: longName,
    });

    await expect(playlist.save()).rejects.toThrow();
  });

  it('should fail if description exceeds maxlength', async () => {
    const longDesc = 'a'.repeat(301);
    const playlist = new Playlist({
      ownerId: fakeUserId,
      name: 'Valid Name',
      description: longDesc,
    });

    await expect(playlist.save()).rejects.toThrow();
  });

  it('should fail if collaborators exceed 30', async () => {
    const collaborators = Array.from(
      { length: 31 },
      () => new mongoose.Types.ObjectId()
    );
    const playlist = new Playlist({
      ownerId: fakeUserId,
      name: 'Playlist',
      isPublic: true,
      collaborators,
    });

    await expect(playlist.save()).rejects.toThrow(
      'Playlists cannot have more than 30 collaborators.'
    );
  });

  it('should fail if collaborators contain duplicates', async () => {
    const playlist = new Playlist({
      ownerId: fakeUserId,
      name: 'Playlist',
      isPublic: true,
      collaborators: [fakeCollaboratorId, fakeCollaboratorId],
    });

    await expect(playlist.save()).rejects.toThrow(
      'You cannot add the same collaborator to a playlist more than once.'
    );
  });

  it('should fail if owner is in collaborators', async () => {
    const playlist = new Playlist({
      ownerId: fakeUserId,
      name: 'Playlist',
      isPublic: true,
      collaborators: [fakeUserId],
    });

    await expect(playlist.save()).rejects.toThrow(
      'The playlist owner cannot be added as a collaborator.'
    );
  });

  it('should fail if playlist is private and has collaborators', async () => {
    const playlist = new Playlist({
      ownerId: fakeUserId,
      name: `Private Playlist ${new mongoose.Types.ObjectId()}`,
      isPublic: false,
      collaborators: [fakeCollaboratorId],
    });

    await expect(playlist.save()).rejects.toThrow(
      'You cannot add collaborators to a private playlist.'
    );
  });

  it('should fail if items exceed 250', async () => {
    const items = Array.from({ length: 251 }, () => ({
      beatId: new mongoose.Types.ObjectId(),
      addedBy: fakeUserId,
    }));

    const playlist = new Playlist({
      ownerId: fakeUserId,
      name: 'Playlist',
      items,
    });

    await expect(playlist.save()).rejects.toThrow(
      'Playlists cannot have more than 250 beats.'
    );
  });

  it('should fail if items contain duplicate beatIds', async () => {
    const beatId = new mongoose.Types.ObjectId();
    const items = [
      { beatId, addedBy: fakeUserId },
      { beatId, addedBy: fakeUserId },
    ];

    const playlist = new Playlist({
      ownerId: fakeUserId,
      name: 'Playlist',
      items,
    });

    await expect(playlist.save()).rejects.toThrow(
      'The same beat cannot be added more than once to the playlist.'
    );
  });
});
