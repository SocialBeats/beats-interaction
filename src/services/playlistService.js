import { Playlist } from '../models/models';
import mongoose from 'mongoose';

class PlaylistService {
  async createPlaylist(data, userId) {
    try {
      if (!userId) {
        throw { status: 422, message: 'ownerId is required.' };
      }

      if (!data.name || data.name.trim().length === 0) {
        throw { status: 422, message: 'Playlist name cannot be empty.' };
      }

      if (data.name.length > 50) {
        throw {
          status: 422,
          message: 'Playlist name cannot exceed 50 characters.',
        };
      }

      if (data.description && data.description.length > 300) {
        throw {
          status: 422,
          message: 'Playlist description cannot exceed 300 characters.',
        };
      }

      if (data.collaborators && !Array.isArray(data.collaborators)) {
        throw { status: 422, message: 'collaborators must be an array.' };
      }

      if (data.items && !Array.isArray(data.items)) {
        throw { status: 422, message: 'items must be an array.' };
      }

      data.ownerId = userId;
      data.collaborators = data.collaborators || [];
      data.items = data.items || [];

      data.items = data.items.map((item) => {
        return {
          beatId: item,
          addedBy: userId,
          addedAt: Date.now(),
        };
      });

      if (data.items.length > 250) {
        throw {
          status: 422,
          message: 'A playlist cannot contain more than 250 items.',
        };
      }

      const beatIds = data.items.map((i) => String(i.beatId));
      const uniqueBeats = new Set(beatIds);

      if (uniqueBeats.size !== beatIds.length) {
        throw { status: 422, message: 'A beat cannot be added twice.' };
      }

      for (const item of data.items) {
        if (!item.beatId) {
          throw { status: 422, message: 'Each item must contain beatId.' };
        }
        if (!item.addedBy) {
          throw { status: 422, message: 'Each item must have addedBy.' };
        }
      }

      if (data.collaborators.length > 0) {
        if (data.isPublic === false) {
          throw {
            status: 422,
            message: 'Cannot add collaborators to a private playlist.',
          };
        }

        if (data.collaborators.length > 30) {
          throw {
            status: 422,
            message: 'A playlist cannot have more than 30 collaborators.',
          };
        }

        if (data.collaborators.some((id) => String(id) === String(userId))) {
          throw { status: 422, message: 'Owner cannot be a collaborator.' };
        }

        const unique = new Set(data.collaborators.map((id) => String(id)));
        if (unique.size !== data.collaborators.length) {
          throw {
            status: 422,
            message: 'Duplicate collaborators are not allowed.',
          };
        }
      }

      const playlist = new Playlist(data);

      await playlist.validate();
      await playlist.save();

      return playlist;
    } catch (err) {
      if (err.name === 'ValidationError') {
        const message = Object.values(err.errors)
          .map((e) => e.message)
          .join(', ');

        throw { status: 422, message };
      }

      if (err.status) throw err;

      throw err;
    }
  }

  async getUserPlaylists({ targetUserId, askerUserId }) {
    try {
      if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
        throw {
          status: 422,
          message: 'Invalid userId.',
        };
      }
      if (!targetUserId || !askerUserId) {
        throw {
          status: 422,
          message: 'Both targetUserId and askerUserId are required.',
        };
      }

      let query;

      if (String(targetUserId) === String(askerUserId)) {
        query = {
          $or: [{ ownerId: targetUserId }, { collaborators: targetUserId }],
        };
      } else {
        query = {
          $or: [
            { ownerId: targetUserId, isPublic: true },
            { collaborators: askerUserId },
          ],
        };
      }

      const playlists = await Playlist.find(query)
        .sort({ createdAt: -1 })
        .lean();

      return playlists;
    } catch (err) {
      if (err.status) throw err;
      throw err;
    }
  }

  async getPlaylistById({ playlistId, requesterId }) {
    try {
      if (!playlistId) {
        throw { status: 422, message: 'playlistId is required.' };
      }

      if (!requesterId) {
        throw { status: 422, message: 'requesterId is required.' };
      }

      if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw { status: 422, message: 'Invalid playlist ID format.' };
      }

      const playlist = await Playlist.findById(playlistId).lean();

      if (!playlist) {
        throw { status: 404, message: 'Playlist not found.' };
      }

      const isOwner = String(playlist.ownerId) === String(requesterId);

      const collaborators = (playlist.collaborators || []).map((id) =>
        String(id)
      );

      const isCollaborator = collaborators.includes(String(requesterId));

      if (playlist.isPublic === true) {
        return {
          ...playlist,
          ownerId: String(playlist.ownerId),
          collaborators,
        };
      }

      if (isOwner || isCollaborator) {
        return {
          ...playlist,
          ownerId: String(playlist.ownerId),
          collaborators,
        };
      }

      throw {
        status: 403,
        message: 'You do not have permission to view this playlist.',
      };
    } catch (err) {
      if (err.status) throw err;
      throw err;
    }
  }

  async updatePlaylist({ playlistId, data, userId }) {
    try {
      if (!playlistId) {
        throw { status: 422, message: 'playlistId is required.' };
      }

      if (!userId) {
        throw { status: 422, message: 'userId is required.' };
      }

      if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw { status: 422, message: 'Invalid playlist ID format.' };
      }

      const playlist = await Playlist.findById(playlistId);
      if (!playlist) {
        throw { status: 404, message: 'Playlist not found.' };
      }

      if (String(playlist.ownerId) !== String(userId)) {
        throw {
          status: 403,
          message: 'You do not have permission to update this playlist.',
        };
      }

      if (data.name !== undefined) {
        if (!data.name || data.name.trim().length === 0) {
          throw { status: 422, message: 'Playlist name cannot be empty.' };
        }
        if (data.name.length > 50) {
          throw {
            status: 422,
            message: 'Playlist name cannot exceed 50 characters.',
          };
        }
        playlist.name = data.name;
      }

      if (data.description !== undefined) {
        if (data.description.length > 300) {
          throw {
            status: 422,
            message: 'Playlist description cannot exceed 300 characters.',
          };
        }
        playlist.description = data.description;
      }

      if (data.isPublic !== undefined) {
        playlist.isPublic = data.isPublic;
      }

      if (data.collaborators !== undefined) {
        if (!Array.isArray(data.collaborators)) {
          throw { status: 422, message: 'collaborators must be an array.' };
        }

        if (data.collaborators.length > 30) {
          throw {
            status: 422,
            message: 'A playlist cannot have more than 30 collaborators.',
          };
        }

        if (data.collaborators.some((id) => String(id) === String(userId))) {
          throw { status: 422, message: 'Owner cannot be a collaborator.' };
        }

        const unique = new Set(data.collaborators.map((id) => String(id)));
        if (unique.size !== data.collaborators.length) {
          throw {
            status: 422,
            message: 'Duplicate collaborators are not allowed.',
          };
        }

        if (playlist.isPublic === false && data.collaborators.length > 0) {
          throw {
            status: 422,
            message: 'Cannot add collaborators to a private playlist.',
          };
        }

        playlist.collaborators = data.collaborators;
      }

      if (data.items !== undefined) {
        if (!Array.isArray(data.items)) {
          throw { status: 422, message: 'items must be an array.' };
        }

        if (data.items.length > 250) {
          throw {
            status: 422,
            message: 'A playlist cannot contain more than 250 items.',
          };
        }

        const items = data.items.map((item) => {
          if (typeof item === 'object') {
            return {
              beatId: item.beatId,
              addedBy: item.addedBy || userId,
              addedAt: item.addedAt || Date.now(),
            };
          }
          return {
            beatId: item,
            addedBy: userId,
            addedAt: Date.now(),
          };
        });

        const beatIds = items.map((i) => String(i.beatId));
        const uniqueBeats = new Set(beatIds);
        if (uniqueBeats.size !== beatIds.length) {
          throw { status: 422, message: 'A beat cannot be added twice.' };
        }

        for (const item of items) {
          if (!item.beatId) {
            throw { status: 422, message: 'Each item must contain beatId.' };
          }
          if (!item.addedBy) {
            throw { status: 422, message: 'Each item must have addedBy.' };
          }
        }

        playlist.items = items;
      }

      await playlist.validate();
      await playlist.save();

      return playlist;
    } catch (err) {
      if (err.name === 'ValidationError') {
        const message = Object.values(err.errors)
          .map((e) => e.message)
          .join(', ');
        throw { status: 422, message };
      }

      if (err.status) throw err;
      throw err;
    }
  }

  async deletePlaylist({ playlistId, userId }) {
    try {
      if (!playlistId) {
        throw { status: 422, message: 'playlistId is required.' };
      }

      if (!userId) {
        throw { status: 422, message: 'userId is required.' };
      }

      if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw { status: 422, message: 'Invalid playlist ID format.' };
      }

      const playlist = await Playlist.findById(playlistId);
      if (!playlist) {
        return { status: 200, message: 'Playlist deleted successfully.' };
      }

      if (String(playlist.ownerId) !== String(userId)) {
        throw {
          status: 403,
          message: 'You do not have permission to delete this playlist.',
        };
      }

      await playlist.deleteOne();
      return;
    } catch (err) {
      if (err.status) throw err;
      throw err;
    }
  }

  async addBeatToPlaylist({ playlistId, beatId, userId }) {
    try {
      if (!playlistId) {
        throw { status: 422, message: 'playlistId is required.' };
      }
      if (!userId) {
        throw { status: 422, message: 'userId is required.' };
      }
      if (!beatId) {
        throw { status: 422, message: 'beatId is required.' };
      }
      if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw { status: 422, message: 'Invalid playlist ID format.' };
      }

      const playlist = await Playlist.findById(playlistId);
      if (!playlist) {
        throw { status: 404, message: 'Playlist not found.' };
      }

      const isOwner = String(playlist.ownerId) === String(userId);
      const isCollaborator = playlist.collaborators?.some(
        (id) => String(id) === String(userId)
      );

      if (!isOwner && !isCollaborator) {
        throw {
          status: 403,
          message: 'You do not have permission to add beats to this playlist.',
        };
      }

      if (playlist.items.length >= 250) {
        throw {
          status: 422,
          message: 'A playlist cannot contain more than 250 items.',
        };
      }

      if (
        playlist.items.some((item) => String(item.beatId) === String(beatId))
      ) {
        throw { status: 422, message: 'This beat is already in the playlist.' };
      }

      const newItem = {
        beatId,
        addedBy: userId,
        addedAt: Date.now(),
      };

      playlist.items.push(newItem);

      await playlist.validate();
      await playlist.save();

      return playlist;
    } catch (err) {
      if (err.name === 'ValidationError') {
        const message = Object.values(err.errors)
          .map((e) => e.message)
          .join(', ');
        throw { status: 422, message };
      }

      if (err.status) throw err;
      throw err;
    }
  }

  async removeBeatFromPlaylist({ playlistId, beatId, userId }) {
    try {
      if (!playlistId)
        throw { status: 422, message: 'playlistId is required.' };
      if (!beatId) throw { status: 422, message: 'beatId is required.' };
      if (!userId) throw { status: 422, message: 'userId is required.' };

      if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw { status: 422, message: 'Invalid playlist ID format.' };
      }

      if (!mongoose.Types.ObjectId.isValid(beatId)) {
        throw { status: 422, message: 'Invalid beat ID format.' };
      }

      const playlist = await Playlist.findById(playlistId);
      if (!playlist) throw { status: 404, message: 'Playlist not found.' };

      const isOwner = String(playlist.ownerId) === String(userId);
      const isCollaborator = playlist.collaborators?.some(
        (id) => String(id) === String(userId)
      );

      if (!isOwner && !isCollaborator) {
        throw {
          status: 403,
          message:
            'You do not have permission to remove beats from this playlist.',
        };
      }

      const index = playlist.items.findIndex(
        (item) => String(item.beatId) === String(beatId)
      );
      if (index === -1) {
        throw { status: 404, message: 'Beat not found in the playlist.' };
      }

      playlist.items.splice(index, 1);

      await playlist.validate();
      await playlist.save();

      return playlist;
    } catch (err) {
      if (err.name === 'ValidationError') {
        const message = Object.values(err.errors)
          .map((e) => e.message)
          .join(', ');
        throw { status: 422, message };
      }

      if (err.status) throw err;
      throw err;
    }
  }

  async getPublicPlaylists({ name, ownerId, page = 1, limit = 20 } = {}) {
    try {
      const query = { isPublic: true };

      if (name) {
        query.name = { $regex: name.trim(), $options: 'i' };
      }

      if (ownerId) {
        if (!mongoose.Types.ObjectId.isValid(ownerId)) {
          throw { status: 422, message: 'Invalid ownerId format.' };
        }
        query.ownerId = ownerId;
      }

      const skip = (page - 1) * limit;

      const [total, playlists] = await Promise.all([
        Playlist.countDocuments(query),
        Playlist.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        total,
        totalPages,
        currentPage: page,
        pageSize: limit,
        playlists,
      };
    } catch (err) {
      if (err.status) throw err;
      throw err;
    }
  }
}

export default new PlaylistService();
