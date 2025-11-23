import logger from '../../logger.js';
import playlistService from '../services/playlistService.js';

export default function playlistRoutes(app) {
  const basAPIURL = '/api/v1';

  app.post(`${basAPIURL}/playlists`, async (req, res) => {
    try {
      const newPlaylist = await playlistService.createPlaylist(
        req.body,
        req.user.id
      );
      return res.status(201).send(newPlaylist.toObject());
    } catch (err) {
      if (err.status) {
        return res.status(err.status).send({ message: err.message });
      }
      logger.error(`Internal server error while creating playlist: ${err}`);
      return res.status(500).send({
        message: 'Internal server error while creating playlist',
      });
    }
  });

  app.get(`${basAPIURL}/playlists/me`, async (req, res) => {
    try {
      const userId = req.user.id;
      const playlists = await playlistService.getUserPlaylists({
        targetUserId: userId,
        askerUserId: userId,
      });
      return res.status(200).send(playlists);
    } catch (err) {
      if (err.status) {
        return res.status(err.status).send({ message: err.message });
      }
      logger.error(`Error getting user playlists: ${err}`);
      return res.status(500).send({
        message: 'Internal server error while getting user playlists',
      });
    }
  });

  app.get(`${basAPIURL}/playlists/user/:userId`, async (req, res) => {
    try {
      const userId = req.user.id;
      const playlists = await playlistService.getUserPlaylists({
        targetUserId: req.params.userId,
        askerUserId: userId,
      });
      return res.status(200).send(playlists);
    } catch (err) {
      if (err.status) {
        return res.status(err.status).send({ message: err.message });
      }
      logger.error(`Error getting user playlists: ${err}`);
      return res.status(500).send({
        message: 'Internal server error while getting user playlists',
      });
    }
  });

  app.get(`${basAPIURL}/playlists/public`, async (req, res) => {
    try {
      const filters = {
        page: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 20,
      };

      if (req.query.name) {
        filters.name = req.query.name;
      }

      if (req.query.ownerId) {
        filters.ownerId = req.query.ownerId;
      }

      const publicPlaylists = await playlistService.getPublicPlaylists(filters);
      return res.status(200).send(publicPlaylists);
    } catch (err) {
      if (err.status) {
        return res.status(err.status).send({ message: err.message });
      }

      logger.error(`Error retrieving public playlists: ${err}`);
      return res.status(500).send({
        message: 'Internal server error while retrieving public playlists',
      });
    }
  });

  app.get(`${basAPIURL}/playlists/:id`, async (req, res) => {
    try {
      const playlistId = req.params.id;
      const userId = req.user.id;

      const playlist = await playlistService.getPlaylistById({
        playlistId,
        requesterId: userId,
      });

      return res.status(200).send(playlist);
    } catch (err) {
      if (err.status) {
        return res.status(err.status).send({ message: err.message });
      }

      logger.error(`Error getting playlist: ${err}`);
      return res.status(500).send({
        message: 'Internal server error while getting playlist',
      });
    }
  });

  app.put(`${basAPIURL}/playlists/:id`, async (req, res) => {
    try {
      const playlistId = req.params.id;
      const userId = req.user.id;
      const updatedPlaylist = await playlistService.updatePlaylist({
        playlistId,
        data: req.body,
        userId,
      });
      return res.status(200).send(updatedPlaylist);
    } catch (err) {
      if (err.status) {
        return res.status(err.status).send({ message: err.message });
      }

      logger.error(`Error updating playlist: ${err}`);
      return res.status(500).send({
        message: 'Internal server error while updating playlist',
      });
    }
  });

  app.patch(`${basAPIURL}/playlists/:id`, async (req, res) => {
    try {
      const playlistId = req.params.id;
      const userId = req.user.id;
      const updatedPlaylist = await playlistService.updatePlaylist({
        playlistId,
        data: req.body,
        userId,
      });
      return res.status(200).send(updatedPlaylist);
    } catch (err) {
      if (err.status) {
        return res.status(err.status).send({ message: err.message });
      }

      logger.error(`Error updating playlist: ${err}`);
      return res.status(500).send({
        message: 'Internal server error while updating playlist',
      });
    }
  });

  app.delete(`${basAPIURL}/playlists/:id`, async (req, res) => {
    try {
      const playlistId = req.params.id;
      const userId = req.user.id;

      await playlistService.deletePlaylist({
        playlistId,
        userId,
      });

      return res
        .status(200)
        .send({ message: 'Playlist deleted successfully.' });
    } catch (err) {
      if (err.status) {
        return res.status(err.status).send({ message: err.message });
      }

      logger.error(`Error deleting playlist: ${err}`);
      return res.status(500).send({
        message: 'Internal server error while deleting playlist',
      });
    }
  });

  app.post(`${basAPIURL}/playlists/:id/items`, async (req, res) => {
    try {
      const playlistId = req.params.id;
      const userId = req.user.id;
      const { beatId } = req.body;

      const updatedPlaylist = await playlistService.addBeatToPlaylist({
        playlistId,
        beatId,
        userId,
      });

      return res.status(200).send(updatedPlaylist);
    } catch (err) {
      if (err.status) {
        return res.status(err.status).send({ message: err.message });
      }

      logger.error(`Error adding beat to playlist: ${err}`);
      return res.status(500).send({
        message: 'Internal server error while adding beat to playlist',
      });
    }
  });

  app.delete(`${basAPIURL}/playlists/:id/items/:beatId`, async (req, res) => {
    try {
      const playlistId = req.params.id;
      const beatId = req.params.beatId;
      const userId = req.user.id;

      const updatedPlaylist = await playlistService.removeBeatFromPlaylist({
        playlistId,
        beatId,
        userId,
      });

      return res.status(200).send(updatedPlaylist);
    } catch (err) {
      if (err.status) {
        return res.status(err.status).send({ message: err.message });
      }

      logger.error(`Error deleting beat from playlist: ${err}`);
      return res.status(500).send({
        message: 'Internal server error while deleting beat from playlist',
      });
    }
  });
}
