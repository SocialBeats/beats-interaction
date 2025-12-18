import { describe, it, expect, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { api } from '../setup/setup.js';
import { Playlist } from '../../src/models/models.js';
import { withAuth } from '../setup/setup.js';

describe('POST /api/v1/playlists', () => {
  it('should create a playlist and return 201', async () => {
    const playlistData = {
      name: 'Test Playlist',
      description: 'A test playlist',
      isPublic: true,
      collaborators: [],
      items: [],
    };

    const response = await withAuth(api.post('/api/v1/playlists'))
      .send(playlistData)
      .expect(201);

    expect(response.body).toHaveProperty('_id');
    expect(response.body).toHaveProperty('name', playlistData.name);
    expect(response.body).toHaveProperty(
      'description',
      playlistData.description
    );
    expect(response.body).toHaveProperty('ownerId', global.testUserId);
    expect(response.body).toHaveProperty('isPublic', playlistData.isPublic);
    expect(response.body).toHaveProperty('collaborators');
    expect(response.body).toHaveProperty('items');

    const playlistInDb = await Playlist.findById(response.body._id).lean();
    expect(playlistInDb).not.toBeNull();
    expect(playlistInDb.name).toBe(playlistData.name);
  });

  it('should return 422 if name is empty', async () => {
    const response = await withAuth(api.post('/api/v1/playlists'))
      .send({ name: '   ' })
      .expect(422);

    expect(response.body).toHaveProperty(
      'message',
      'Playlist name cannot be empty.'
    );
  });

  it('should return 422 if name exceeds 50 characters', async () => {
    const longName = 'a'.repeat(51);
    const response = await withAuth(api.post('/api/v1/playlists'))
      .send({ name: longName })
      .expect(422);

    expect(response.body).toHaveProperty(
      'message',
      'Playlist name cannot exceed 50 characters.'
    );
  });

  it('should return 422 if description exceeds 300 characters', async () => {
    const longDescription = 'a'.repeat(301);
    const response = await withAuth(api.post('/api/v1/playlists'))
      .send({ name: 'Valid Name', description: longDescription })
      .expect(422);

    expect(response.body).toHaveProperty(
      'message',
      'Playlist description cannot exceed 300 characters.'
    );
  });

  it('should return 422 if collaborators is not an array', async () => {
    const response = await withAuth(api.post('/api/v1/playlists'))
      .send({ name: 'Valid Name', collaborators: 'not-an-array' })
      .expect(422);

    expect(response.body).toHaveProperty(
      'message',
      'collaborators must be an array.'
    );
  });

  it('should return 422 if items is not an array', async () => {
    const response = await withAuth(api.post('/api/v1/playlists'))
      .send({ name: 'Valid Name', items: 'not-an-array' })
      .expect(422);

    expect(response.body).toHaveProperty('message', 'items must be an array.');
  });
});

describe('GET /api/v1/playlists/me', () => {
  beforeEach(async () => {
    await Playlist.deleteMany({});
  });

  it('should return all playlists of the authenticated user', async () => {
    const userId = global.testUserId;

    const playlist1 = await Playlist.create({
      name: 'Playlist 1',
      ownerId: userId,
      isPublic: true,
    });

    const playlist2 = await Playlist.create({
      name: 'Playlist 2',
      ownerId: userId,
      isPublic: false,
    });

    const response = await withAuth(api.get('/api/v1/playlists/me')).expect(
      200
    );

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2);

    const playlistNames = response.body.map((p) => p.name);
    expect(playlistNames).toContain('Playlist 1');
    expect(playlistNames).toContain('Playlist 2');
  });

  it('should return an empty array if the user has no playlists', async () => {
    const response = await withAuth(api.get('/api/v1/playlists/me')).expect(
      200
    );
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(0);
  });
});

describe('GET /api/v1/playlists/user/:userId', () => {
  it('should return playlists of the specified user', async () => {
    const targetUserId = new mongoose.Types.ObjectId().toString();

    await Playlist.create([
      { name: 'Playlist A', ownerId: targetUserId, isPublic: true },
      { name: 'Playlist B', ownerId: targetUserId, isPublic: true },
    ]);

    const response = await withAuth(
      api.get(`/api/v1/playlists/user/${targetUserId}`)
    ).expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2);

    const playlistNames = response.body.map((p) => p.name);
    expect(playlistNames).toContain('Playlist A');
    expect(playlistNames).toContain('Playlist B');
  });

  it('should return an empty array if the specified user has no playlists', async () => {
    const targetUserId = new mongoose.Types.ObjectId().toString();

    const response = await withAuth(
      api.get(`/api/v1/playlists/user/${targetUserId}`)
    ).expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(0);
  });

  it('should return 422 if userId is not a valid ObjectId', async () => {
    const invalidUserId = 'not-a-valid-id';

    const response = await withAuth(
      api.get(`/api/v1/playlists/user/${invalidUserId}`)
    ).expect(422);

    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toMatch(/Invalid/i);
  });
});

describe('GET /api/v1/playlists/:id', () => {
  let userId;
  let token;

  beforeAll(() => {
    userId = global.testUserId;
    token = global.testToken;
  });

  afterEach(async () => {
    await Playlist.deleteMany({});
  });

  it('should return the playlist if the requester is the owner', async () => {
    const playlist = await Playlist.create({
      name: 'Owner Playlist',
      ownerId: userId,
      isPublic: false,
      collaborators: [],
    });

    const res = await withAuth(api.get(`/api/v1/playlists/${playlist._id}`));

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(String(playlist._id));
  });

  it('should return the playlist if the requester is a collaborator', async () => {
    const playlist = await Playlist.create({
      name: 'Collaborator Playlist',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
      collaborators: [userId],
    });

    const res = await withAuth(api.get(`/api/v1/playlists/${playlist._id}`));

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(String(playlist._id));
  });

  it('should return the playlist if it is public', async () => {
    const playlist = await Playlist.create({
      name: 'Public Playlist',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
      collaborators: [],
    });

    const res = await withAuth(api.get(`/api/v1/playlists/${playlist._id}`));

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(String(playlist._id));
  });

  it('should return 404 if the playlist does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const res = await withAuth(api.get(`/api/v1/playlists/${fakeId}`));

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Playlist not found.');
  });

  it('should return 403 if the playlist is private and the requester has no permission', async () => {
    const playlist = await Playlist.create({
      name: 'Private Playlist',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: false,
      collaborators: [],
    });

    const res = await withAuth(api.get(`/api/v1/playlists/${playlist._id}`));

    expect(res.status).toBe(403);
    expect(res.body.message).toBe(
      'You do not have permission to view this playlist.'
    );
  });

  it('should return 422 if the playlist ID is invalid', async () => {
    const res = await withAuth(api.get(`/api/v1/playlists/invalid-id`));

    expect(res.status).toBe(422);
    expect(res.body.message).toBe('Invalid playlist ID format.');
  });
});

describe('GET /api/v1/playlists/public', () => {
  let userId;
  let token;
  let otherUserId;

  beforeAll(() => {
    userId = global.testUserId;
    token = global.testToken;
    otherUserId = new mongoose.Types.ObjectId();
  });

  afterEach(async () => {
    await Playlist.deleteMany({});
  });

  it('should return all public playlists without filters', async () => {
    await Playlist.create([
      {
        name: 'Public Playlist 1',
        ownerId: userId,
        isPublic: true,
        collaborators: [],
      },
      {
        name: 'Public Playlist 2',
        ownerId: otherUserId,
        isPublic: true,
        collaborators: [],
      },
      {
        name: 'Private Playlist',
        ownerId: userId,
        isPublic: false,
        collaborators: [],
      },
    ]);

    const res = await withAuth(api.get('/api/v1/playlists/public'));

    expect(res.status).toBe(200);
    expect(res.body.playlists).toHaveLength(2);
    expect(res.body.playlists.every((p) => p.isPublic)).toBe(true);
  });

  it('should filter playlists by name', async () => {
    await Playlist.create([
      {
        name: 'Rock Classics',
        ownerId: userId,
        isPublic: true,
        collaborators: [],
      },
      {
        name: 'Jazz Vibes',
        ownerId: otherUserId,
        isPublic: true,
        collaborators: [],
      },
    ]);

    const res = await withAuth(api.get('/api/v1/playlists/public?name=Rock'));

    expect(res.status).toBe(200);
    expect(res.body.playlists).toHaveLength(1);
    expect(res.body.playlists[0].name).toContain('Rock');
  });

  it('should filter playlists by ownerId', async () => {
    await Playlist.create([
      {
        name: 'My Public Playlist',
        ownerId: userId,
        isPublic: true,
        collaborators: [],
      },
      {
        name: 'Other Public Playlist',
        ownerId: otherUserId,
        isPublic: true,
        collaborators: [],
      },
    ]);

    const res = await withAuth(
      api.get(`/api/v1/playlists/public?ownerId=${userId}`)
    );

    expect(res.status).toBe(200);
    expect(res.body.playlists).toHaveLength(1);
    expect(res.body.playlists[0].ownerId).toBe(String(userId));
  });

  it('should paginate results correctly', async () => {
    const playlists = Array.from({ length: 25 }, (_, i) => ({
      name: `Playlist ${i + 1}`,
      ownerId: userId,
      isPublic: true,
      collaborators: [],
    }));
    await Playlist.create(playlists);

    const res = await withAuth(
      api.get('/api/v1/playlists/public?page=1&limit=10')
    );

    expect(res.status).toBe(200);
    expect(res.body.playlists).toHaveLength(10);
    expect(res.body.totalPages).toBeGreaterThan(1);
    expect(res.body.currentPage).toBe(1);
  });

  it('should return second page of results', async () => {
    const playlists = Array.from({ length: 25 }, (_, i) => ({
      name: `Playlist ${i + 1}`,
      ownerId: userId,
      isPublic: true,
      collaborators: [],
    }));
    await Playlist.create(playlists);

    const res = await withAuth(
      api.get('/api/v1/playlists/public?page=2&limit=10')
    );

    expect(res.status).toBe(200);
    expect(res.body.playlists).toHaveLength(10);
    expect(res.body.currentPage).toBe(2);
  });

  it('should use default pagination values when not provided', async () => {
    const playlists = Array.from({ length: 5 }, (_, i) => ({
      name: `Playlist ${i + 1}`,
      ownerId: userId,
      isPublic: true,
      collaborators: [],
    }));
    await Playlist.create(playlists);

    const res = await withAuth(api.get('/api/v1/playlists/public'));

    expect(res.status).toBe(200);
    expect(res.body.playlists).toHaveLength(5);
    expect(res.body.currentPage).toBe(1);
  });

  it('should return empty array when no public playlists exist', async () => {
    await Playlist.create({
      name: 'Private Only',
      ownerId: userId,
      isPublic: false,
      collaborators: [],
    });

    const res = await withAuth(api.get('/api/v1/playlists/public'));

    expect(res.status).toBe(200);
    expect(res.body.playlists).toHaveLength(0);
  });

  it('should combine multiple filters', async () => {
    await Playlist.create([
      {
        name: 'Rock Classics',
        ownerId: userId,
        isPublic: true,
        collaborators: [],
      },
      {
        name: 'Rock Modern',
        ownerId: otherUserId,
        isPublic: true,
        collaborators: [],
      },
      {
        name: 'Jazz Classics',
        ownerId: userId,
        isPublic: true,
        collaborators: [],
      },
    ]);

    const res = await withAuth(
      api.get(`/api/v1/playlists/public?name=Rock&ownerId=${userId}`)
    );

    expect(res.status).toBe(200);
    expect(res.body.playlists).toHaveLength(1);
    expect(res.body.playlists[0].name).toBe('Rock Classics');
  });
});

describe('PUT /api/v1/playlists/:id', () => {
  let userId;
  let token;

  beforeAll(() => {
    userId = global.testUserId;
    token = global.testToken;
  });

  afterEach(async () => {
    await Playlist.deleteMany({});
  });

  it('should update the playlist if the requester is the owner', async () => {
    const playlist = await Playlist.create({
      name: 'Owner Playlist',
      ownerId: userId,
      isPublic: false,
      collaborators: [],
    });

    const updatedData = { name: 'Updated Name' };

    const res = await withAuth(
      api.put(`/api/v1/playlists/${playlist._id}`)
    ).send(updatedData);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe(updatedData.name);
  });

  it('should not update the playlist if the requester is a collaborator', async () => {
    const playlist = await Playlist.create({
      name: 'Collaborator Playlist',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
      collaborators: [userId],
    });

    const updatedData = { name: 'Updated Name' };

    const res = await withAuth(
      api.put(`/api/v1/playlists/${playlist._id}`)
    ).send(updatedData);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(
      /You do not have permission to update this playlist./i
    );
  });

  it('should return 404 if the playlist does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const updatedData = { name: 'Updated Name' };

    const res = await withAuth(api.put(`/api/v1/playlists/${fakeId}`)).send(
      updatedData
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Playlist not found.');
  });

  it('should return 403 if the playlist is private and the requester has no permission', async () => {
    const playlist = await Playlist.create({
      name: 'Private Playlist',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: false,
      collaborators: [],
    });

    const updatedData = { name: 'Updated Name' };

    const res = await withAuth(
      api.put(`/api/v1/playlists/${playlist._id}`)
    ).send(updatedData);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe(
      'You do not have permission to update this playlist.'
    );
  });

  it('should return 422 if the playlist ID is invalid', async () => {
    const updatedData = { name: 'Updated Name' };

    const res = await withAuth(api.put(`/api/v1/playlists/invalid-id`)).send(
      updatedData
    );

    expect(res.status).toBe(422);
    expect(res.body.message).toBe('Invalid playlist ID format.');
  });

  it('should return 200 if no data is sent', async () => {
    const playlist = await Playlist.create({
      name: 'Owner Playlist',
      ownerId: userId,
      isPublic: false,
      collaborators: [],
    });

    const res = await withAuth(
      api.put(`/api/v1/playlists/${playlist._id}`)
    ).send({});

    expect(res.status).toBe(200);
  });
});

describe('PATCH /api/v1/playlists/:id', () => {
  let userId;
  let token;

  beforeAll(() => {
    userId = global.testUserId;
    token = global.testToken;
  });

  afterEach(async () => {
    await Playlist.deleteMany({});
  });

  it('should update the playlist if the requester is the owner', async () => {
    const playlist = await Playlist.create({
      name: 'Owner Playlist',
      ownerId: userId,
      isPublic: false,
      collaborators: [],
    });

    const updatedData = { name: 'Updated Name' };

    const res = await withAuth(
      api.patch(`/api/v1/playlists/${playlist._id}`)
    ).send(updatedData);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe(updatedData.name);
  });

  it('should not update the playlist if the requester is a collaborator', async () => {
    const playlist = await Playlist.create({
      name: 'Collaborator Playlist',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
      collaborators: [userId],
    });

    const updatedData = { name: 'Updated Name' };

    const res = await withAuth(
      api.patch(`/api/v1/playlists/${playlist._id}`)
    ).send(updatedData);

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toMatch(
      /You do not have permission to update this playlist./i
    );
  });

  it('should return 404 if the playlist does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const updatedData = { name: 'Updated Name' };

    const res = await withAuth(api.patch(`/api/v1/playlists/${fakeId}`)).send(
      updatedData
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Playlist not found.');
  });

  it('should return 403 if the playlist is private and the requester has no permission', async () => {
    const playlist = await Playlist.create({
      name: 'Private Playlist',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: false,
      collaborators: [],
    });

    const updatedData = { name: 'Updated Name' };

    const res = await withAuth(
      api.patch(`/api/v1/playlists/${playlist._id}`)
    ).send(updatedData);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe(
      'You do not have permission to update this playlist.'
    );
  });

  it('should return 422 if the playlist ID is invalid', async () => {
    const updatedData = { name: 'Updated Name' };

    const res = await withAuth(api.patch(`/api/v1/playlists/invalid-id`)).send(
      updatedData
    );

    expect(res.status).toBe(422);
    expect(res.body.message).toBe('Invalid playlist ID format.');
  });

  it('should return 200 if no data is sent', async () => {
    const playlist = await Playlist.create({
      name: 'Owner Playlist',
      ownerId: userId,
      isPublic: false,
      collaborators: [],
    });

    const res = await withAuth(
      api.patch(`/api/v1/playlists/${playlist._id}`)
    ).send({});

    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/v1/playlists/:id', () => {
  let userId;
  let token;

  beforeAll(() => {
    userId = global.testUserId;
    token = global.testToken;
  });

  afterEach(async () => {
    await Playlist.deleteMany({});
  });

  it('should delete the playlist if the requester is the owner', async () => {
    const playlist = await Playlist.create({
      name: 'Owner Playlist',
      ownerId: userId,
      isPublic: false,
      collaborators: [],
    });

    const res = await withAuth(api.delete(`/api/v1/playlists/${playlist._id}`));

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Playlist deleted successfully.');

    const deleted = await Playlist.findById(playlist._id);
    expect(deleted).toBeNull();
  });

  it('should return 200 if the playlist does not exist or it has been removed', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const res = await withAuth(api.delete(`/api/v1/playlists/${fakeId}`));

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Playlist deleted successfully.');
  });

  it('should return 403 if the requester is not the owner', async () => {
    const playlist = await Playlist.create({
      name: 'Private Playlist',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: false,
      collaborators: [],
    });

    const res = await withAuth(api.delete(`/api/v1/playlists/${playlist._id}`));

    expect(res.status).toBe(403);
    expect(res.body.message).toBe(
      'You do not have permission to delete this playlist.'
    );

    const existing = await Playlist.findById(playlist._id);
    expect(existing).not.toBeNull();
  });

  it('should return 422 if the playlist ID is invalid', async () => {
    const res = await withAuth(api.delete(`/api/v1/playlists/invalid-id`));

    expect(res.status).toBe(422);
    expect(res.body.message).toBe('Invalid playlist ID format.');
  });
});

describe('POST /api/v1/playlists/:id/items', () => {
  let userId;
  let token;

  beforeAll(() => {
    userId = global.testUserId;
    token = global.testToken;
  });

  afterEach(async () => {
    await Playlist.deleteMany({});
  });

  it('should add a beat if requester is the owner', async () => {
    const playlist = await Playlist.create({
      name: 'Owner Playlist',
      ownerId: userId,
      isPublic: false,
      collaborators: [],
      items: [],
    });

    const res = await withAuth(
      api.post(`/api/v1/playlists/${playlist._id}/items`)
    ).send({ beatId: new mongoose.Types.ObjectId() });

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(String(res.body.items[0].addedBy)).toBe(userId);
  });

  it('should add a beat if requester is a collaborator', async () => {
    const playlist = await Playlist.create({
      name: 'Collaborator Playlist',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
      collaborators: [userId],
      items: [],
    });

    const res = await withAuth(
      api.post(`/api/v1/playlists/${playlist._id}/items`)
    ).send({ beatId: new mongoose.Types.ObjectId() });

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
  });

  it('should return 404 if playlist does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const res = await withAuth(
      api.post(`/api/v1/playlists/${fakeId}/items`)
    ).send({ beatId: new mongoose.Types.ObjectId() });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Playlist not found.');
  });

  it('should return 403 if requester has no permission', async () => {
    const playlist = await Playlist.create({
      name: 'Private Playlist',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: false,
      collaborators: [],
      items: [],
    });

    const res = await withAuth(
      api.post(`/api/v1/playlists/${playlist._id}/items`)
    ).send({ beatId: new mongoose.Types.ObjectId() });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe(
      'You do not have permission to add beats to this playlist.'
    );
  });

  it('should return 422 if playlist ID is invalid', async () => {
    const res = await withAuth(
      api.post(`/api/v1/playlists/invalid-id/items`)
    ).send({ beatId: new mongoose.Types.ObjectId() });

    expect(res.status).toBe(422);
    expect(res.body.message).toBe('Invalid playlist ID format.');
  });

  it('should return 422 if beatId is missing', async () => {
    const playlist = await Playlist.create({
      name: 'Owner Playlist',
      ownerId: userId,
      isPublic: false,
      collaborators: [],
      items: [],
    });

    const res = await withAuth(
      api.post(`/api/v1/playlists/${playlist._id}/items`)
    ).send({});

    expect(res.status).toBe(422);
    expect(res.body.message).toBe('beatId is required.');
  });

  it('should return 422 if beat is already in the playlist', async () => {
    const beatId = new mongoose.Types.ObjectId();
    const playlist = await Playlist.create({
      name: 'Owner Playlist',
      ownerId: userId,
      isPublic: false,
      collaborators: [],
      items: [{ beatId, addedBy: userId, addedAt: Date.now() }],
    });

    const res = await withAuth(
      api.post(`/api/v1/playlists/${playlist._id}/items`)
    ).send({ beatId });

    expect(res.status).toBe(422);
    expect(res.body.message).toBe('This beat is already in the playlist.');
  });

  it('should return 422 if playlist already has 250 items', async () => {
    const playlist = await Playlist.create({
      name: 'Full Playlist',
      ownerId: userId,
      isPublic: false,
      collaborators: [],
      items: Array.from({ length: 250 }, () => ({
        beatId: new mongoose.Types.ObjectId(),
        addedBy: userId,
        addedAt: Date.now(),
      })),
    });

    const res = await withAuth(
      api.post(`/api/v1/playlists/${playlist._id}/items`)
    ).send({ beatId: new mongoose.Types.ObjectId() });

    expect(res.status).toBe(422);
    expect(res.body.message).toBe(
      'A playlist cannot contain more than 250 items.'
    );
  });
});

describe('DELETE /api/v1/playlists/:id/items/:beatId', () => {
  let userId;
  let token;

  beforeAll(() => {
    userId = global.testUserId;
    token = global.testToken;
  });

  afterEach(async () => {
    await Playlist.deleteMany({});
  });

  it('should remove a beat if requester is the owner', async () => {
    const beatId = new mongoose.Types.ObjectId();
    const playlist = await Playlist.create({
      name: 'Owner Playlist',
      ownerId: userId,
      isPublic: false,
      collaborators: [],
      items: [{ beatId, addedBy: userId, addedAt: Date.now() }],
    });

    const res = await withAuth(
      api.delete(`/api/v1/playlists/${playlist._id}/items/${beatId}`)
    );

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
  });

  it('should remove a beat if requester is a collaborator', async () => {
    const beatId = new mongoose.Types.ObjectId();
    const playlist = await Playlist.create({
      name: 'Collaborator Playlist',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
      collaborators: [userId],
      items: [{ beatId, addedBy: userId, addedAt: Date.now() }],
    });

    const res = await withAuth(
      api.delete(`/api/v1/playlists/${playlist._id}/items/${beatId}`)
    );

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
  });

  it('should return 404 if playlist does not exist', async () => {
    const fakePlaylistId = new mongoose.Types.ObjectId();
    const beatId = new mongoose.Types.ObjectId();

    const res = await withAuth(
      api.delete(`/api/v1/playlists/${fakePlaylistId}/items/${beatId}`)
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Playlist not found.');
  });

  it('should return 404 if beat does not exist in playlist', async () => {
    const beatId = new mongoose.Types.ObjectId();
    const playlist = await Playlist.create({
      name: 'Owner Playlist',
      ownerId: userId,
      isPublic: false,
      collaborators: [],
      items: [],
    });

    const res = await withAuth(
      api.delete(`/api/v1/playlists/${playlist._id}/items/${beatId}`)
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Beat not found in the playlist.');
  });

  it('should return 403 if requester has no permission', async () => {
    const beatId = new mongoose.Types.ObjectId();
    const playlist = await Playlist.create({
      name: 'Private Playlist',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: false,
      collaborators: [],
      items: [{ beatId, addedBy: userId, addedAt: Date.now() }],
    });

    const res = await withAuth(
      api.delete(`/api/v1/playlists/${playlist._id}/items/${beatId}`)
    );

    expect(res.status).toBe(403);
    expect(res.body.message).toBe(
      'You do not have permission to remove beats from this playlist.'
    );
  });

  it('should return 422 if playlist ID is invalid', async () => {
    const beatId = new mongoose.Types.ObjectId();
    const res = await withAuth(
      api.delete(`/api/v1/playlists/invalid-id/items/${beatId}`)
    );

    expect(res.status).toBe(422);
    expect(res.body.message).toBe('Invalid playlist ID format.');
  });

  it('should return 422 if beat ID is invalid', async () => {
    const playlist = await Playlist.create({
      name: 'Owner Playlist',
      ownerId: userId,
      isPublic: false,
      collaborators: [],
      items: [],
    });

    const res = await withAuth(
      api.delete(`/api/v1/playlists/${playlist._id}/items/invalid-beat-id`)
    );

    expect(res.status).toBe(422);
    expect(res.body.message).toBe('Invalid beat ID format.');
  });
});
