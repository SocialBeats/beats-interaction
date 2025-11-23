import mongoose from 'mongoose';
import { describe, it, expect, beforeEach } from 'vitest';
import PlaylistService from '../../src/services/playlistService';
import { Playlist } from '../../src/models/models';

describe('create playlist test', () => {
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

describe('get user playlists test', () => {
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

describe('get playlist by id test', () => {
  it('should throw 422 if playlistId or requesterId is missing', async () => {
    const userId = new mongoose.Types.ObjectId();

    await expect(
      PlaylistService.getPlaylistById({ playlistId: null, requesterId: userId })
    ).rejects.toMatchObject({ status: 422 });

    await expect(
      PlaylistService.getPlaylistById({
        playlistId: new mongoose.Types.ObjectId(),
        requesterId: null,
      })
    ).rejects.toMatchObject({ status: 422 });
  });

  it('should throw 422 if playlistId format is invalid', async () => {
    const invalidId = '12345';
    const userId = new mongoose.Types.ObjectId();

    await expect(
      PlaylistService.getPlaylistById({
        playlistId: invalidId,
        requesterId: userId,
      })
    ).rejects.toMatchObject({ status: 422 });
  });

  it('should throw 404 if playlist does not exist', async () => {
    const playlistId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

    await expect(
      PlaylistService.getPlaylistById({ playlistId, requesterId: userId })
    ).rejects.toMatchObject({ status: 404 });
  });

  it('should return the playlist if it is public', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const playlist = await Playlist.create({
      ownerId,
      name: 'Public Playlist',
      isPublic: true,
      collaborators: [],
    });

    const result = await PlaylistService.getPlaylistById({
      playlistId: playlist._id,
      requesterId: new mongoose.Types.ObjectId(),
    });

    expect(result.name).toBe('Public Playlist');
  });

  it('should allow owner to access private playlist', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const playlist = await Playlist.create({
      ownerId,
      name: 'Private Playlist',
      isPublic: false,
      collaborators: [],
    });

    const result = await PlaylistService.getPlaylistById({
      playlistId: playlist._id,
      requesterId: ownerId,
    });

    expect(result.name).toBe('Private Playlist');
  });

  it('should allow collaborator to access private playlist', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const collaboratorId = new mongoose.Types.ObjectId();

    const playlist = await Playlist.create({
      ownerId,
      name: 'Private Playlist',
      isPublic: true,
      collaborators: [collaboratorId],
    });

    const result = await PlaylistService.getPlaylistById({
      playlistId: playlist._id,
      requesterId: collaboratorId,
    });

    expect(result.name).toBe('Private Playlist');
  });

  it('should throw 403 if user is not owner, collaborator, or playlist is private', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const otherUserId = new mongoose.Types.ObjectId();

    const playlist = await Playlist.create({
      ownerId,
      name: 'Private Playlist',
      isPublic: false,
      collaborators: [],
    });

    await expect(
      PlaylistService.getPlaylistById({
        playlistId: playlist._id,
        requesterId: otherUserId,
      })
    ).rejects.toMatchObject({ status: 403 });
  });
});

describe('update playlist test', () => {
  it('should throw 422 if playlistId or userId is missing', async () => {
    const userId = new mongoose.Types.ObjectId();
    const playlistId = new mongoose.Types.ObjectId();

    await expect(
      PlaylistService.updatePlaylist({ playlistId: null, data: {}, userId })
    ).rejects.toMatchObject({ status: 422 });

    await expect(
      PlaylistService.updatePlaylist({ playlistId, data: {}, userId: null })
    ).rejects.toMatchObject({ status: 422 });
  });

  it('should throw 422 if playlistId format is invalid', async () => {
    const invalidId = '12345';
    const userId = new mongoose.Types.ObjectId();

    await expect(
      PlaylistService.updatePlaylist({
        playlistId: invalidId,
        data: {},
        userId,
      })
    ).rejects.toMatchObject({ status: 422 });
  });

  it('should throw 404 if playlist does not exist', async () => {
    const playlistId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

    await expect(
      PlaylistService.updatePlaylist({ playlistId, data: {}, userId })
    ).rejects.toMatchObject({ status: 404 });
  });

  it('should throw 403 if user is not owner', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const otherUserId = new mongoose.Types.ObjectId();

    const playlist = await Playlist.create({
      ownerId,
      name: 'Playlist',
      isPublic: true,
      collaborators: [],
    });

    await expect(
      PlaylistService.updatePlaylist({
        playlistId: playlist._id,
        data: {},
        userId: otherUserId,
      })
    ).rejects.toMatchObject({ status: 403 });
  });

  it('should update name and description correctly', async () => {
    const ownerId = new mongoose.Types.ObjectId();

    const playlist = await Playlist.create({
      ownerId,
      name: 'Old Name',
      description: 'Old description',
      isPublic: true,
      collaborators: [],
    });

    const data = { name: 'New Name', description: 'New description' };

    const updated = await PlaylistService.updatePlaylist({
      playlistId: playlist._id,
      data,
      userId: ownerId,
    });

    expect(updated.name).toBe('New Name');
    expect(updated.description).toBe('New description');
  });

  it('should update isPublic correctly', async () => {
    const ownerId = new mongoose.Types.ObjectId();

    const playlist = await Playlist.create({
      ownerId,
      name: 'Playlist',
      isPublic: false,
      collaborators: [],
    });

    const updated = await PlaylistService.updatePlaylist({
      playlistId: playlist._id,
      data: { isPublic: true },
      userId: ownerId,
    });

    expect(updated.isPublic).toBe(true);
  });

  it('should validate collaborators correctly', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const collaborator = new mongoose.Types.ObjectId();

    const playlist = await Playlist.create({
      ownerId,
      name: 'Playlist',
      isPublic: true,
      collaborators: [],
    });

    const data = { collaborators: [collaborator] };
    const updated = await PlaylistService.updatePlaylist({
      playlistId: playlist._id,
      data,
      userId: ownerId,
    });

    expect(updated.collaborators.map(String)).toContain(String(collaborator));
  });

  it('should throw 422 for invalid name or description', async () => {
    const ownerId = new mongoose.Types.ObjectId();

    const playlist = await Playlist.create({
      ownerId,
      name: 'Playlist',
      isPublic: true,
      collaborators: [],
    });

    await expect(
      PlaylistService.updatePlaylist({
        playlistId: playlist._id,
        data: { name: '' },
        userId: ownerId,
      })
    ).rejects.toMatchObject({ status: 422 });

    await expect(
      PlaylistService.updatePlaylist({
        playlistId: playlist._id,
        data: { description: 'a'.repeat(301) },
        userId: ownerId,
      })
    ).rejects.toMatchObject({ status: 422 });
  });

  it('should validate items correctly', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();

    const playlist = await Playlist.create({
      ownerId,
      name: 'Playlist',
      isPublic: true,
      collaborators: [],
    });

    const data = { items: [{ beatId }] }; // <-- PASAMOS UN OBJETO con beatId
    const updated = await PlaylistService.updatePlaylist({
      playlistId: playlist._id,
      data,
      userId: ownerId,
    });

    expect(updated.items.length).toBe(1);
    expect(String(updated.items[0].beatId)).toBe(String(beatId));
    expect(String(updated.items[0].addedBy)).toBe(String(ownerId));
  });

  it('should throw 422 for duplicate items', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();

    const playlist = await Playlist.create({
      ownerId,
      name: 'Playlist',
      isPublic: true,
      collaborators: [],
    });

    const data = { items: [beatId, beatId] };

    await expect(
      PlaylistService.updatePlaylist({
        playlistId: playlist._id,
        data,
        userId: ownerId,
      })
    ).rejects.toMatchObject({ status: 422 });
  });
});

describe('delete playlist test', () => {
  it('should throw 422 if playlistId or userId is missing', async () => {
    const userId = new mongoose.Types.ObjectId();
    const playlistId = new mongoose.Types.ObjectId();

    await expect(
      PlaylistService.deletePlaylist({ playlistId: null, userId })
    ).rejects.toMatchObject({ status: 422 });

    await expect(
      PlaylistService.deletePlaylist({ playlistId, userId: null })
    ).rejects.toMatchObject({ status: 422 });
  });

  it('should throw 422 if playlistId format is invalid', async () => {
    const invalidId = '12345';
    const userId = new mongoose.Types.ObjectId();

    await expect(
      PlaylistService.deletePlaylist({ playlistId: invalidId, userId })
    ).rejects.toMatchObject({ status: 422 });
  });

  it('should return success if playlist does not exist', async () => {
    const playlistId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

    const result = await PlaylistService.deletePlaylist({ playlistId, userId });
    expect(result).toEqual({
      status: 200,
      message: 'Playlist deleted successfully.',
    });
  });

  it('should throw 403 if user is not owner', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const otherUserId = new mongoose.Types.ObjectId();

    const playlist = await Playlist.create({
      ownerId,
      name: 'Playlist',
      isPublic: true,
      collaborators: [],
    });

    await expect(
      PlaylistService.deletePlaylist({
        playlistId: playlist._id,
        userId: otherUserId,
      })
    ).rejects.toMatchObject({ status: 403 });
  });

  it('should delete playlist if user is owner', async () => {
    const ownerId = new mongoose.Types.ObjectId();

    const playlist = await Playlist.create({
      ownerId,
      name: 'Playlist',
      isPublic: true,
      collaborators: [],
    });

    await expect(
      PlaylistService.deletePlaylist({
        playlistId: playlist._id,
        userId: ownerId,
      })
    ).resolves.toBeUndefined();

    const deleted = await Playlist.findById(playlist._id);
    expect(deleted).toBeNull();
  });
});

describe('add beat to playlist test', () => {
  it('should throw 422 if playlistId, userId or beatId is missing', async () => {
    const playlistId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();

    await expect(
      PlaylistService.addBeatToPlaylist({ playlistId: null, userId, beatId })
    ).rejects.toMatchObject({ status: 422 });

    await expect(
      PlaylistService.addBeatToPlaylist({ playlistId, userId: null, beatId })
    ).rejects.toMatchObject({ status: 422 });

    await expect(
      PlaylistService.addBeatToPlaylist({ playlistId, userId, beatId: null })
    ).rejects.toMatchObject({ status: 422 });
  });

  it('should throw 422 if playlistId format is invalid', async () => {
    const invalidId = '12345';
    const userId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();

    await expect(
      PlaylistService.addBeatToPlaylist({
        playlistId: invalidId,
        userId,
        beatId,
      })
    ).rejects.toMatchObject({ status: 422 });
  });

  it('should throw 404 if playlist does not exist', async () => {
    const playlistId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();

    await expect(
      PlaylistService.addBeatToPlaylist({ playlistId, userId, beatId })
    ).rejects.toMatchObject({ status: 404 });
  });

  it('should throw 403 if user is not owner or collaborator', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const otherUserId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();

    const playlist = await Playlist.create({
      ownerId,
      name: 'Playlist',
      isPublic: true,
      collaborators: [],
      items: [],
    });

    await expect(
      PlaylistService.addBeatToPlaylist({
        playlistId: playlist._id,
        userId: otherUserId,
        beatId,
      })
    ).rejects.toMatchObject({ status: 403 });
  });

  it('should throw 422 if playlist has 250 items', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();
    const playlist = await Playlist.create({
      ownerId,
      name: 'Playlist',
      isPublic: true,
      items: Array.from({ length: 250 }, () => ({
        beatId: new mongoose.Types.ObjectId(),
        addedBy: ownerId,
        addedAt: Date.now(),
      })),
    });

    await expect(
      PlaylistService.addBeatToPlaylist({
        playlistId: playlist._id,
        userId: ownerId,
        beatId,
      })
    ).rejects.toMatchObject({ status: 422 });
  });

  it('should throw 422 if beat already exists in playlist', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();

    const playlist = await Playlist.create({
      ownerId,
      name: 'Playlist',
      isPublic: true,
      items: [{ beatId, addedBy: ownerId, addedAt: Date.now() }],
    });

    await expect(
      PlaylistService.addBeatToPlaylist({
        playlistId: playlist._id,
        userId: ownerId,
        beatId,
      })
    ).rejects.toMatchObject({ status: 422 });
  });

  it('should add beat if user is owner', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();

    const playlist = await Playlist.create({
      ownerId,
      name: 'Playlist',
      isPublic: true,
      items: [],
    });

    const updated = await PlaylistService.addBeatToPlaylist({
      playlistId: playlist._id,
      userId: ownerId,
      beatId,
    });

    expect(updated.items.length).toBe(1);
    expect(String(updated.items[0].beatId)).toBe(String(beatId));
    expect(String(updated.items[0].addedBy)).toBe(String(ownerId));
  });

  it('should add beat if user is collaborator', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const collaboratorId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();

    const playlist = await Playlist.create({
      ownerId,
      name: 'Playlist',
      isPublic: true,
      collaborators: [collaboratorId],
      items: [],
    });

    const updated = await PlaylistService.addBeatToPlaylist({
      playlistId: playlist._id,
      userId: collaboratorId,
      beatId,
    });

    expect(updated.items.length).toBe(1);
    expect(String(updated.items[0].beatId)).toBe(String(beatId));
    expect(String(updated.items[0].addedBy)).toBe(String(collaboratorId));
  });
});

describe('remove beat from playlist test', () => {
  it('should throw 422 if playlistId, beatId, or userId is missing', async () => {
    const playlistId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

    await expect(
      PlaylistService.removeBeatFromPlaylist({
        playlistId: null,
        beatId,
        userId,
      })
    ).rejects.toMatchObject({ status: 422 });

    await expect(
      PlaylistService.removeBeatFromPlaylist({
        playlistId,
        beatId: null,
        userId,
      })
    ).rejects.toMatchObject({ status: 422 });

    await expect(
      PlaylistService.removeBeatFromPlaylist({
        playlistId,
        beatId,
        userId: null,
      })
    ).rejects.toMatchObject({ status: 422 });
  });

  it('should throw 422 if playlistId or beatId format is invalid', async () => {
    const invalidId = '12345';
    const beatId = new mongoose.Types.ObjectId();
    const playlistId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

    await expect(
      PlaylistService.removeBeatFromPlaylist({
        playlistId: invalidId,
        beatId,
        userId,
      })
    ).rejects.toMatchObject({ status: 422 });

    await expect(
      PlaylistService.removeBeatFromPlaylist({
        playlistId,
        beatId: invalidId,
        userId,
      })
    ).rejects.toMatchObject({ status: 422 });
  });

  it('should throw 404 if playlist does not exist', async () => {
    const playlistId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

    await expect(
      PlaylistService.removeBeatFromPlaylist({ playlistId, beatId, userId })
    ).rejects.toMatchObject({ status: 404 });
  });

  it('should throw 403 if user is not owner or collaborator', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const otherUserId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();

    const playlist = await Playlist.create({
      ownerId,
      name: 'Playlist',
      isPublic: true,
      collaborators: [],
      items: [{ beatId, addedBy: ownerId, addedAt: Date.now() }],
    });

    await expect(
      PlaylistService.removeBeatFromPlaylist({
        playlistId: playlist._id,
        beatId,
        userId: otherUserId,
      })
    ).rejects.toMatchObject({ status: 403 });
  });

  it('should throw 404 if beat is not in playlist', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();
    const nonExistentBeat = new mongoose.Types.ObjectId();

    const playlist = await Playlist.create({
      ownerId,
      name: 'Playlist',
      isPublic: true,
      items: [{ beatId, addedBy: ownerId, addedAt: Date.now() }],
    });

    await expect(
      PlaylistService.removeBeatFromPlaylist({
        playlistId: playlist._id,
        beatId: nonExistentBeat,
        userId: ownerId,
      })
    ).rejects.toMatchObject({ status: 404 });
  });

  it('should remove beat if user is owner', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();

    const playlist = await Playlist.create({
      ownerId,
      name: 'Playlist',
      isPublic: true,
      items: [{ beatId, addedBy: ownerId, addedAt: Date.now() }],
    });

    const updated = await PlaylistService.removeBeatFromPlaylist({
      playlistId: playlist._id,
      beatId,
      userId: ownerId,
    });

    expect(updated.items.length).toBe(0);
  });

  it('should remove beat if user is collaborator', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const collaboratorId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();

    const playlist = await Playlist.create({
      ownerId,
      name: 'Playlist',
      isPublic: true,
      collaborators: [collaboratorId],
      items: [{ beatId, addedBy: ownerId, addedAt: Date.now() }],
    });

    const updated = await PlaylistService.removeBeatFromPlaylist({
      playlistId: playlist._id,
      beatId,
      userId: collaboratorId,
    });

    expect(updated.items.length).toBe(0);
  });
});

describe('get public playlists test', () => {
  it('should return only public playlists', async () => {
    const ownerId = new mongoose.Types.ObjectId();

    await Playlist.create([
      { ownerId, name: 'Public 1', isPublic: true },
      { ownerId, name: 'Public 2', isPublic: true },
      { ownerId, name: 'Private', isPublic: false },
    ]);

    const result = await PlaylistService.getPublicPlaylists();

    expect(result.playlists.every((p) => p.isPublic)).toBe(true);
    expect(result.total).toBeGreaterThanOrEqual(2);
    expect(result.playlists.map((p) => p.name)).toContain('Public 1');
    expect(result.playlists.map((p) => p.name)).toContain('Public 2');
    expect(result.playlists.map((p) => p.name)).not.toContain('Private');
  });

  it('should filter playlists by name', async () => {
    const ownerId = new mongoose.Types.ObjectId();

    await Playlist.create([
      { ownerId, name: 'Rock Beats', isPublic: true },
      { ownerId, name: 'Trap Beats', isPublic: true },
    ]);

    const result = await PlaylistService.getPublicPlaylists({ name: 'Rock' });

    expect(result.playlists.length).toBeGreaterThanOrEqual(1);
    expect(result.playlists[0].name).toContain('Rock');
    expect(result.playlists.some((p) => p.name === 'Trap Beats')).toBe(false);
  });

  it('should filter playlists by ownerId', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const otherOwner = new mongoose.Types.ObjectId();

    await Playlist.create([
      { ownerId, name: 'Owner Playlist', isPublic: true },
      { ownerId: otherOwner, name: 'Other Playlist', isPublic: true },
    ]);

    const result = await PlaylistService.getPublicPlaylists({ ownerId });

    expect(
      result.playlists.every((p) => String(p.ownerId) === String(ownerId))
    ).toBe(true);
    expect(result.playlists.map((p) => p.name)).toContain('Owner Playlist');
    expect(result.playlists.map((p) => p.name)).not.toContain('Other Playlist');
  });

  it('should throw 422 for invalid ownerId format', async () => {
    await expect(
      PlaylistService.getPublicPlaylists({ ownerId: 'invalidId' })
    ).rejects.toMatchObject({ status: 422 });
  });

  it('should apply pagination correctly', async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const playlistsData = Array.from({ length: 30 }, (_, i) => ({
      ownerId,
      name: `Playlist ${i + 1}`,
      isPublic: true,
    }));

    await Playlist.create(playlistsData);

    const page1 = await PlaylistService.getPublicPlaylists({
      page: 1,
      limit: 10,
    });
    const page2 = await PlaylistService.getPublicPlaylists({
      page: 2,
      limit: 10,
    });

    expect(page1.playlists.length).toBe(10);
    expect(page2.playlists.length).toBe(10);
    expect(page1.playlists[0].name).not.toBe(page2.playlists[0].name);
    expect(page1.total).toBeGreaterThanOrEqual(30);
    expect(page1.totalPages).toBe(Math.ceil(page1.total / 10));
  });
});
