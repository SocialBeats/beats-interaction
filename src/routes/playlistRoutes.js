import logger from '../../logger.js';
import playlistService from '../services/playlistService.js';

export default function playlistRoutes(app) {
  const baseAPIURL = '/api/v1';

  /**
   * @swagger
   * /api/v1/playlists:
   *   post:
   *     tags:
   *       - Playlists
   *     summary: Create a new playlist
   *     description: Creates a new playlist for the authenticated user. Validates input data including name, description, items, and collaborators.
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 example: My Awesome Playlist
   *                 description: The name of the playlist (max 50 characters).
   *               description:
   *                 type: string
   *                 example: A playlist with my favorite beats
   *                 description: Optional description of the playlist (max 300 characters).
   *               isPublic:
   *                 type: boolean
   *                 example: true
   *                 description: Whether the playlist is public or private.
   *               collaborators:
   *                 type: array
   *                 items:
   *                   type: string
   *                 example: ["userId1", "userId2"]
   *                 description: List of user IDs allowed to collaborate on the playlist (max 30).
   *               items:
   *                 type: array
   *                 items:
   *                   type: string
   *                 example: ["beatId1", "beatId2"]
   *                 description: List of beat IDs to include in the playlist (max 250, no duplicates).
   *             required:
   *               - name
   *     responses:
   *       201:
   *         description: Playlist created successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 _id:
   *                   type: string
   *                   example: 654321abcdef
   *                 name:
   *                   type: string
   *                   example: My Awesome Playlist
   *                 description:
   *                   type: string
   *                   example: A playlist with my favorite beats
   *                 ownerId:
   *                   type: string
   *                   example: 123456abcdef
   *                 isPublic:
   *                   type: boolean
   *                   example: true
   *                 collaborators:
   *                   type: array
   *                   items:
   *                     type: string
   *                   example: ["userId1", "userId2"]
   *                 items:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       beatId:
   *                         type: string
   *                         example: beatId1
   *                       addedBy:
   *                         type: string
   *                         example: 123456abcdef
   *                       addedAt:
   *                         type: string
   *                         format: date-time
   *                         example: "2025-11-23T12:00:00.000Z"
   *       422:
   *         description: Validation error due to invalid input.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Playlist name cannot exceed 50 characters.
   *       500:
   *         description: Internal server error while creating playlist.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while creating playlist
   */
  app.post(`${baseAPIURL}/playlists`, async (req, res) => {
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

  /**
   * @swagger
   * /api/v1/playlists/me:
   *   get:
   *     tags:
   *       - Playlists
   *     summary: Get authenticated user's playlists
   *     description: Retrieves all playlists owned by or collaborated on by the authenticated user. Returns playlists sorted by creation date descending.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of user's playlists
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   _id:
   *                     type: string
   *                     example: 654321abcdef
   *                   name:
   *                     type: string
   *                     example: My Awesome Playlist
   *                   description:
   *                     type: string
   *                     example: A playlist with my favorite beats
   *                   ownerId:
   *                     type: string
   *                     example: 123456abcdef
   *                   isPublic:
   *                     type: boolean
   *                     example: true
   *                   collaborators:
   *                     type: array
   *                     items:
   *                       type: string
   *                     example: ["userId1", "userId2"]
   *                   items:
   *                     type: array
   *                     items:
   *                       type: object
   *                       properties:
   *                         beatId:
   *                           type: string
   *                           example: beatId1
   *                         addedBy:
   *                           type: string
   *                           example: 123456abcdef
   *                         addedAt:
   *                           type: string
   *                           format: date-time
   *                           example: "2025-11-23T12:00:00.000Z"
   *                   createdAt:
   *                     type: string
   *                     format: date-time
   *                     example: "2025-11-23T10:00:00.000Z"
   *                   updatedAt:
   *                     type: string
   *                     format: date-time
   *                     example: "2025-11-23T11:00:00.000Z"
   *       422:
   *         description: Validation error due to invalid userId or missing parameters.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Invalid userId.
   *       500:
   *         description: Internal server error while getting user playlists.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while getting user playlists
   */
  app.get(`${baseAPIURL}/playlists/me`, async (req, res) => {
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

  /**
   * @swagger
   * /api/v1/playlists/user/{userId}:
   *   get:
   *     tags:
   *       - Playlists
   *     summary: Get playlists of a specific user
   *     description: Retrieves playlists of a user specified by `userId`. Returns public playlists and playlists the requester collaborates on. Sorted by creation date descending.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: userId
   *         in: path
   *         required: true
   *         description: The ID of the user whose playlists are being requested.
   *         schema:
   *           type: string
   *           example: 123456abcdef
   *     responses:
   *       200:
   *         description: List of the user's playlists
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   _id:
   *                     type: string
   *                     example: 654321abcdef
   *                   name:
   *                     type: string
   *                     example: My Awesome Playlist
   *                   description:
   *                     type: string
   *                     example: A playlist with my favorite beats
   *                   ownerId:
   *                     type: string
   *                     example: 123456abcdef
   *                   isPublic:
   *                     type: boolean
   *                     example: true
   *                   collaborators:
   *                     type: array
   *                     items:
   *                       type: string
   *                     example: ["userId1", "userId2"]
   *                   items:
   *                     type: array
   *                     items:
   *                       type: object
   *                       properties:
   *                         beatId:
   *                           type: string
   *                           example: beatId1
   *                         addedBy:
   *                           type: string
   *                           example: 123456abcdef
   *                         addedAt:
   *                           type: string
   *                           format: date-time
   *                           example: "2025-11-23T12:00:00.000Z"
   *                   createdAt:
   *                     type: string
   *                     format: date-time
   *                     example: "2025-11-23T10:00:00.000Z"
   *                   updatedAt:
   *                     type: string
   *                     format: date-time
   *                     example: "2025-11-23T11:00:00.000Z"
   *       422:
   *         description: Validation error due to invalid or missing userId.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Invalid userId.
   *       500:
   *         description: Internal server error while getting user playlists.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while getting user playlists
   */
  app.get(`${baseAPIURL}/playlists/user/:userId`, async (req, res) => {
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

  /**
   * @swagger
   * /api/v1/playlists/public:
   *   get:
   *     tags:
   *       - Playlists
   *     summary: Get public playlists
   *     description: Retrieves public playlists with optional filters by name and owner. Supports pagination.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: page
   *         in: query
   *         required: false
   *         description: Page number for pagination (default is 1)
   *         schema:
   *           type: integer
   *           example: 1
   *       - name: limit
   *         in: query
   *         required: false
   *         description: Number of playlists per page (default is 20)
   *         schema:
   *           type: integer
   *           example: 20
   *       - name: name
   *         in: query
   *         required: false
   *         description: Filter playlists by name (case-insensitive, partial match)
   *         schema:
   *           type: string
   *           example: "Awesome"
   *       - name: ownerId
   *         in: query
   *         required: false
   *         description: Filter playlists by owner user ID
   *         schema:
   *           type: string
   *           example: 123456abcdef
   *     responses:
   *       200:
   *         description: Paginated list of public playlists
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 total:
   *                   type: integer
   *                   example: 100
   *                 totalPages:
   *                   type: integer
   *                   example: 5
   *                 currentPage:
   *                   type: integer
   *                   example: 1
   *                 pageSize:
   *                   type: integer
   *                   example: 20
   *                 playlists:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       _id:
   *                         type: string
   *                         example: 654321abcdef
   *                       name:
   *                         type: string
   *                         example: Public Playlist 1
   *                       description:
   *                         type: string
   *                         example: A playlist with public beats
   *                       ownerId:
   *                         type: string
   *                         example: 123456abcdef
   *                       isPublic:
   *                         type: boolean
   *                         example: true
   *                       collaborators:
   *                         type: array
   *                         items:
   *                           type: string
   *                         example: ["userId1", "userId2"]
   *                       items:
   *                         type: array
   *                         items:
   *                           type: object
   *                           properties:
   *                             beatId:
   *                               type: string
   *                               example: beatId1
   *                             addedBy:
   *                               type: string
   *                               example: 123456abcdef
   *                             addedAt:
   *                               type: string
   *                               format: date-time
   *                               example: "2025-11-23T12:00:00.000Z"
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                         example: "2025-11-23T10:00:00.000Z"
   *                       updatedAt:
   *                         type: string
   *                         format: date-time
   *                         example: "2025-11-23T11:00:00.000Z"
   *       422:
   *         description: Invalid ownerId format.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Invalid ownerId format.
   *       500:
   *         description: Internal server error while retrieving public playlists.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while retrieving public playlists
   */
  app.get(`${baseAPIURL}/playlists/public`, async (req, res) => {
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

  /**
   * @swagger
   * /api/v1/playlists/{id}:
   *   get:
   *     tags:
   *       - Playlists
   *     summary: Get a specific playlist by ID
   *     description: Retrieves a playlist by its ID. Only accessible if the playlist is public, or if the requester is the owner or a collaborator.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: The ID of the playlist to retrieve
   *         schema:
   *           type: string
   *           example: 654321abcdef
   *     responses:
   *       200:
   *         description: Playlist details
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 _id:
   *                   type: string
   *                   example: 654321abcdef
   *                 name:
   *                   type: string
   *                   example: My Awesome Playlist
   *                 description:
   *                   type: string
   *                   example: A playlist with my favorite beats
   *                 ownerId:
   *                   type: string
   *                   example: 123456abcdef
   *                 isPublic:
   *                   type: boolean
   *                   example: true
   *                 collaborators:
   *                   type: array
   *                   items:
   *                     type: string
   *                   example: ["userId1", "userId2"]
   *                 items:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       beatId:
   *                         type: string
   *                         example: beatId1
   *                       addedBy:
   *                         type: string
   *                         example: 123456abcdef
   *                       addedAt:
   *                         type: string
   *                         format: date-time
   *                         example: "2025-11-23T12:00:00.000Z"
   *                 createdAt:
   *                   type: string
   *                   format: date-time
   *                   example: "2025-11-23T10:00:00.000Z"
   *                 updatedAt:
   *                   type: string
   *                   format: date-time
   *                   example: "2025-11-23T11:00:00.000Z"
   *       403:
   *         description: Access denied to view this playlist
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: You do not have permission to view this playlist.
   *       404:
   *         description: Playlist not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Playlist not found.
   *       422:
   *         description: Validation error due to missing or invalid playlist ID
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Invalid playlist ID format.
   *       500:
   *         description: Internal server error while retrieving playlist
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while getting playlist
   */
  app.get(`${baseAPIURL}/playlists/:id`, async (req, res) => {
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

  /**
   * @swagger
   * /api/v1/playlists/{id}:
   *   put:
   *     tags:
   *       - Playlists
   *     summary: Update a playlist
   *     description: Updates a playlist's details. Only the owner can update. Supports updating name, description, isPublic, collaborators, and items.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: The ID of the playlist to update
   *         schema:
   *           type: string
   *           example: 654321abcdef
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 example: Updated Playlist Name
   *                 description: Playlist name (max 50 characters)
   *               description:
   *                 type: string
   *                 example: Updated description for the playlist
   *                 description: Playlist description (max 300 characters)
   *               isPublic:
   *                 type: boolean
   *                 example: true
   *               collaborators:
   *                 type: array
   *                 items:
   *                   type: string
   *                 example: ["userId1", "userId2"]
   *                 description: List of collaborator user IDs (max 30, owner cannot be a collaborator, no duplicates, only for public playlists)
   *               items:
   *                 type: array
   *                 items:
   *                   oneOf:
   *                     - type: string
   *                     - type: object
   *                       properties:
   *                         beatId:
   *                           type: string
   *                           example: beatId1
   *                         addedBy:
   *                           type: string
   *                           example: 123456abcdef
   *                         addedAt:
   *                           type: string
   *                           format: date-time
   *                           example: "2025-11-23T12:00:00.000Z"
   *                 description: List of beats in the playlist (max 250, no duplicates)
   *     responses:
   *       200:
   *         description: Playlist updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Playlist'
   *       403:
   *         description: User does not have permission to update this playlist
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: You do not have permission to update this playlist.
   *       404:
   *         description: Playlist not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Playlist not found.
   *       422:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Playlist name cannot exceed 50 characters.
   *       500:
   *         description: Internal server error while updating playlist
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while updating playlist
   */
  app.put(`${baseAPIURL}/playlists/:id`, async (req, res) => {
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

  /**
   * @swagger
   * /api/v1/playlists/{id}:
   *   patch:
   *     tags:
   *       - Playlists
   *     summary: Update a playlist
   *     description: Updates a playlist's details. Only the owner can update. Supports updating name, description, isPublic, collaborators, and items.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: The ID of the playlist to update
   *         schema:
   *           type: string
   *           example: 654321abcdef
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 example: Updated Playlist Name
   *                 description: Playlist name (max 50 characters)
   *               description:
   *                 type: string
   *                 example: Updated description for the playlist
   *                 description: Playlist description (max 300 characters)
   *               isPublic:
   *                 type: boolean
   *                 example: true
   *               collaborators:
   *                 type: array
   *                 items:
   *                   type: string
   *                 example: ["userId1", "userId2"]
   *                 description: List of collaborator user IDs (max 30, owner cannot be a collaborator, no duplicates, only for public playlists)
   *               items:
   *                 type: array
   *                 items:
   *                   oneOf:
   *                     - type: string
   *                     - type: object
   *                       properties:
   *                         beatId:
   *                           type: string
   *                           example: beatId1
   *                         addedBy:
   *                           type: string
   *                           example: 123456abcdef
   *                         addedAt:
   *                           type: string
   *                           format: date-time
   *                           example: "2025-11-23T12:00:00.000Z"
   *                 description: List of beats in the playlist (max 250, no duplicates)
   *     responses:
   *       200:
   *         description: Playlist updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Playlist'
   *       403:
   *         description: User does not have permission to update this playlist
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: You do not have permission to update this playlist.
   *       404:
   *         description: Playlist not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Playlist not found.
   *       422:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Playlist name cannot exceed 50 characters.
   *       500:
   *         description: Internal server error while updating playlist
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while updating playlist
   */
  app.patch(`${baseAPIURL}/playlists/:id`, async (req, res) => {
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

  /**
   * @swagger
   * /api/v1/playlists/{id}:
   *   delete:
   *     tags:
   *       - Playlists
   *     summary: Delete a playlist
   *     description: Deletes a playlist by its ID. Only the owner can delete it.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: The ID of the playlist to delete
   *         schema:
   *           type: string
   *           example: 654321abcdef
   *     responses:
   *       200:
   *         description: Playlist deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Playlist deleted successfully.
   *       403:
   *         description: User does not have permission to delete this playlist
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: You do not have permission to delete this playlist.
   *       422:
   *         description: Validation error due to missing or invalid playlist ID
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Invalid playlist ID format.
   *       500:
   *         description: Internal server error while deleting playlist
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while deleting playlist
   */
  app.delete(`${baseAPIURL}/playlists/:id`, async (req, res) => {
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

  /**
   * @swagger
   * /api/v1/playlists/{id}/items:
   *   post:
   *     tags:
   *       - Playlists
   *     summary: Add a beat to a playlist
   *     description: Adds a beat to a playlist. Only the owner or collaborators can add beats. Maximum 250 items per playlist, no duplicates allowed.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: The ID of the playlist
   *         schema:
   *           type: string
   *           example: 654321abcdef
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               beatId:
   *                 type: string
   *                 example: beatId1
   *                 description: ID of the beat to add to the playlist
   *             required:
   *               - beatId
   *     responses:
   *       200:
   *         description: Beat added successfully, returns updated playlist
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Playlist'
   *       403:
   *         description: User does not have permission to add beats
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: You do not have permission to add beats to this playlist.
   *       404:
   *         description: Playlist not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Playlist not found.
   *       422:
   *         description: Validation error (missing IDs, duplicate beat, max items exceeded)
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: This beat is already in the playlist.
   *       500:
   *         description: Internal server error while adding beat to playlist
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while adding beat to playlist
   */
  app.post(`${baseAPIURL}/playlists/:id/items`, async (req, res) => {
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

  /**
   * @swagger
   * /api/v1/playlists/{id}/items/{beatId}:
   *   delete:
   *     tags:
   *       - Playlists
   *     summary: Remove a beat from a playlist
   *     description: Removes a beat from a playlist. Only the owner or collaborators can remove beats.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: The ID of the playlist
   *         schema:
   *           type: string
   *           example: 654321abcdef
   *       - name: beatId
   *         in: path
   *         required: true
   *         description: The ID of the beat to remove
   *         schema:
   *           type: string
   *           example: beatId1
   *     responses:
   *       200:
   *         description: Beat removed successfully, returns updated playlist
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Playlist'
   *       403:
   *         description: User does not have permission to remove beats
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: You do not have permission to remove beats from this playlist.
   *       404:
   *         description: Playlist or beat not found
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Beat not found in the playlist.
   *       422:
   *         description: Validation error (missing or invalid IDs)
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Invalid playlist ID format.
   *       500:
   *         description: Internal server error while removing beat from playlist
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while deleting beat from playlist
   */
  app.delete(`${baseAPIURL}/playlists/:id/items/:beatId`, async (req, res) => {
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
