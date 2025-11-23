import { describe, it, expect, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { api } from '../setup/setup.js';
import { Playlist } from '../../src/models/models.js';

describe('POST /api/v1/playlists (integration)', () => {
  const withAuth = (req) =>
    req.set('Authorization', `Bearer ${global.testToken}`);

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

describe('GET /api/v1/playlists/me (integration)', () => {
  const withAuth = (req) =>
    req.set('Authorization', `Bearer ${global.testToken}`);

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

describe('GET /api/v1/playlists/user/:userId (integration)', () => {
  const withAuth = (req) =>
    req.set('Authorization', `Bearer ${global.testToken}`);

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

  test('should return the playlist if the requester is the owner', async () => {
    const playlist = await Playlist.create({
      name: 'Owner Playlist',
      ownerId: userId,
      isPublic: false,
      collaborators: [],
    });

    const res = await api
      .get(`/api/v1/playlists/${playlist._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(String(playlist._id));
  });

  test('should return the playlist if the requester is a collaborator', async () => {
    const playlist = await Playlist.create({
      name: 'Collaborator Playlist',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
      collaborators: [userId],
    });

    const res = await api
      .get(`/api/v1/playlists/${playlist._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(String(playlist._id));
  });

  test('should return the playlist if it is public', async () => {
    const playlist = await Playlist.create({
      name: 'Public Playlist',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: true,
      collaborators: [],
    });

    const res = await api
      .get(`/api/v1/playlists/${playlist._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(String(playlist._id));
  });

  test('should return 404 if the playlist does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const res = await api
      .get(`/api/v1/playlists/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Playlist not found.');
  });

  test('should return 403 if the playlist is private and the requester has no permission', async () => {
    const playlist = await Playlist.create({
      name: 'Private Playlist',
      ownerId: new mongoose.Types.ObjectId(),
      isPublic: false,
      collaborators: [],
    });

    const res = await api
      .get(`/api/v1/playlists/${playlist._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe(
      'You do not have permission to view this playlist.'
    );
  });

  test('should return 422 if the playlist ID is invalid', async () => {
    const res = await api
      .get(`/api/v1/playlists/invalid-id`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(422);
    expect(res.body.message).toBe('Invalid playlist ID format.');
  });
});
