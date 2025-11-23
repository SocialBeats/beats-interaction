import mongoose from 'mongoose';
import { describe, it, expect, beforeEach } from 'vitest';
import PlaylistService from '../../src/services/playlistService';
import { Playlist } from '../../src/models/models';

describe('create playlist Test', () => {
  const fakeUserId = new mongoose.Types.ObjectId();
  const fakeCollaboratorId = new mongoose.Types.ObjectId();

  it('should create a valid playlist', async () => {
    const data = {
      name: 'Trap Beats',
      description: 'Beats oscuros y drill',
      isPublic: true,
      collaborators: [fakeCollaboratorId],
      items: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
    };

    const playlist = await PlaylistService.createPlaylist(data, fakeUserId);

    expect(playlist).toBeDefined();
    expect(String(playlist.ownerId)).toBe(String(fakeUserId));
    expect(playlist.name).toBe(data.name);
    expect(playlist.items).toHaveLength(2);
    expect(playlist.collaborators).toHaveLength(1);
  });

  it('should throw 422 in playlist creation if ownerId is missing', async () => {
    const data = { name: 'Playlist' };
    await expect(
      PlaylistService.createPlaylist(data, null)
    ).rejects.toMatchObject({
      status: 422,
      message: 'ownerId is required.',
    });
  });

  it('should throw 422 in playlist creation if name is empty or spaces', async () => {
    const data = { name: '   ' };
    await expect(
      PlaylistService.createPlaylist(data, fakeUserId)
    ).rejects.toMatchObject({
      status: 422,
      message: 'Playlist name cannot be empty.',
    });
  });

  it('should throw 422 in playlist creation if name exceeds 50 chars', async () => {
    const data = { name: 'a'.repeat(51) };
    await expect(
      PlaylistService.createPlaylist(data, fakeUserId)
    ).rejects.toMatchObject({
      status: 422,
      message: 'Playlist name cannot exceed 50 characters.',
    });
  });

  it('should throw 422 in playlist creation if description exceeds 300 chars', async () => {
    const data = { name: 'Valid Name', description: 'a'.repeat(301) };
    await expect(
      PlaylistService.createPlaylist(data, fakeUserId)
    ).rejects.toMatchObject({
      status: 422,
      message: 'Playlist description cannot exceed 300 characters.',
    });
  });

  it('should throw 422 in playlist creation if collaborators is not an array', async () => {
    const data = { name: 'Playlist', collaborators: 'not-an-array' };
    await expect(
      PlaylistService.createPlaylist(data, fakeUserId)
    ).rejects.toMatchObject({
      status: 422,
      message: 'collaborators must be an array.',
    });
  });

  it('should throw 422 in playlist creation if items is not an array', async () => {
    const data = { name: 'Playlist', items: 'not-an-array' };
    await expect(
      PlaylistService.createPlaylist(data, fakeUserId)
    ).rejects.toMatchObject({
      status: 422,
      message: 'items must be an array.',
    });
  });

  it('should throw 422 in playlist creation if more than 30 collaborators', async () => {
    const collaborators = Array.from(
      { length: 31 },
      () => new mongoose.Types.ObjectId()
    );
    const data = { name: 'Playlist', collaborators, isPublic: true };
    await expect(
      PlaylistService.createPlaylist(data, fakeUserId)
    ).rejects.toMatchObject({
      status: 422,
      message: 'A playlist cannot have more than 30 collaborators.',
    });
  });

  it('should throw 422 in playlist creation if duplicate collaborators', async () => {
    const data = {
      name: 'Playlist',
      collaborators: [fakeCollaboratorId, fakeCollaboratorId],
      isPublic: true,
    };
    await expect(
      PlaylistService.createPlaylist(data, fakeUserId)
    ).rejects.toMatchObject({
      status: 422,
      message: 'Duplicate collaborators are not allowed.',
    });
  });

  it('should throw 422 in playlist creation if owner is in collaborators', async () => {
    const data = {
      name: 'Playlist',
      collaborators: [fakeUserId],
      isPublic: true,
    };
    await expect(
      PlaylistService.createPlaylist(data, fakeUserId)
    ).rejects.toMatchObject({
      status: 422,
      message: 'Owner cannot be a collaborator.',
    });
  });

  it('should throw 422 in playlist creation if adding collaborators to private playlist', async () => {
    const data = {
      name: 'Playlist',
      collaborators: [fakeCollaboratorId],
      isPublic: false,
    };
    await expect(
      PlaylistService.createPlaylist(data, fakeUserId)
    ).rejects.toMatchObject({
      status: 422,
      message: 'Cannot add collaborators to a private playlist.',
    });
  });

  it('should throw 422 in playlist creation if items exceed 250', async () => {
    const items = Array.from(
      { length: 251 },
      () => new mongoose.Types.ObjectId()
    );
    const data = { name: 'Playlist', items };
    await expect(
      PlaylistService.createPlaylist(data, fakeUserId)
    ).rejects.toMatchObject({
      status: 422,
      message: 'A playlist cannot contain more than 250 items.',
    });
  });

  it('should throw 422 in playlist creation if duplicate beats in items', async () => {
    const beatId = new mongoose.Types.ObjectId();
    const data = { name: 'Playlist', items: [beatId, beatId] };
    await expect(
      PlaylistService.createPlaylist(data, fakeUserId)
    ).rejects.toMatchObject({
      status: 422,
      message: 'A beat cannot be added twice.',
    });
  });
});

describe('get user playlists Test', () => {
  it('should throw 422 if targetUserId or askerUserId is missing', async () => {
    const collaboratorId = new mongoose.Types.ObjectId();
    const ownerId = new mongoose.Types.ObjectId();

    await expect(
      PlaylistService.getUserPlaylists({
        targetUserId: null,
        askerUserId: collaboratorId,
      })
    ).rejects.toMatchObject({ status: 422 });

    await expect(
      PlaylistService.getUserPlaylists({
        targetUserId: ownerId,
        askerUserId: null,
      })
    ).rejects.toMatchObject({ status: 422 });
  });

  it('should return all playlists for the user if targetUserId equals askerUserId', async () => {
    const ownerId = new mongoose.Types.ObjectId();

    await Playlist.create({
      ownerId,
      name: 'Public Playlist',
      isPublic: true,
    });
    await Playlist.create({
      ownerId,
      name: 'Private Playlist',
      isPublic: false,
    });

    const playlists = await PlaylistService.getUserPlaylists({
      targetUserId: ownerId,
      askerUserId: ownerId,
    });

    expect(playlists.length).toBeGreaterThanOrEqual(2);
    const names = playlists.map((p) => p.name);
    expect(names).toContain('Public Playlist');
    expect(names).toContain('Private Playlist');
  });

  it('should return only public and collaborated playlists if targetUserId != askerUserId', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const collaboratorId = new mongoose.Types.ObjectId();

    await Playlist.create({ ownerId, name: 'Public Playlist', isPublic: true });
    await Playlist.create({
      ownerId,
      name: 'Private Playlist',
      isPublic: false,
    });
    await Playlist.create({
      ownerId,
      name: 'Collaborated Playlist',
      isPublic: true,
      collaborators: [collaboratorId],
    });

    const playlists = await PlaylistService.getUserPlaylists({
      targetUserId: ownerId,
      askerUserId: collaboratorId,
    });

    const names = playlists.map((p) => p.name);
    expect(names).toContain('Public Playlist');
    expect(names).toContain('Collaborated Playlist');
    expect(names).not.toContain('Private Playlist');
  });
});
