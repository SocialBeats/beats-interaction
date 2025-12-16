import logger from '../../logger.js';
import ratingService from '../services/ratingService.js';

const baseAPIURL = '/api/v1';

export default function ratingRoutes(app) {
  /**
   * @swagger
   * /api/v1/beats/{beatId}/ratings:
   *   post:
   *     tags:
   *       - Ratings
   *     summary: Create a rating for a beat
   *     description: >
   *       Creates a new rating associated with the specified beat for the authenticated user.
   *       A user can only rate a beat once. If a rating already exists for this user and beat,
   *       a validation error (422) is returned.
   *       `beatId` must be a valid MongoDB ObjectId.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: beatId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the beat to rate.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - score
   *             properties:
   *               score:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 5
   *                 example: 5
   *               comment:
   *                 type: string
   *                 maxLength: 200
   *                 example: "El beat está muy limpio, me gusta mucho."
   *             additionalProperties: false
   *             description: >
   *               Only `score` and optional `comment` are accepted.
   *     responses:
   *       201:
   *         description: Rating successfully created.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Rating'
   *       401:
   *         description: Unauthorized. Token missing or invalid.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Unauthorized access.
   *       404:
   *         description: Beat not found (invalid or non-existent `beatId`).
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Beat not found.
   *       422:
   *         description: >
   *           Validation error (e.g., score out of range, comment too long,
   *           user already rated this beat, or user does not exist).
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: User has already rated this beat.
   *       500:
   *         description: Internal server error while creating rating.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while creating rating.
   */
  app.post(`${baseAPIURL}/beats/:beatId/ratings`, async (req, res) => {
    try {
      const { beatId } = req.params;
      const { score, comment } = req.body;
      const userId = req.user.id;

      const rating = await ratingService.createBeatRating({
        beatId,
        userId,
        score,
        comment,
      });

      return res.status(201).send({
        _id: rating._id,
        beatId: rating.beatId ?? null,
        playlistId: rating.playlistId ?? null,
        userId: rating.userId,
        user: rating.user,
        score: rating.score,
        comment: rating.comment,
        createdAt: rating.createdAt,
        updatedAt: rating.updatedAt,
      });
    } catch (err) {
      if (err.status) {
        return res.status(err.status).send({ message: err.message });
      }
      logger.error(`Internal server error while creating rating: ${err}`);
      return res.status(500).send({
        message: 'Internal server error while creating rating',
      });
    }
  });

  /**
   * @swagger
   * /api/v1/playlists/{playlistId}/ratings:
   *   post:
   *     tags:
   *       - Ratings
   *     summary: Create a rating for a playlist
   *     description: >
   *       Creates a new rating associated with the specified playlist for the authenticated user.
   *       The playlist must exist and be public. A user can only rate a playlist once.
   *       If a rating already exists for this user and playlist, a validation error (422) is returned.
   *       `playlistId` must be a valid MongoDB ObjectId.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: playlistId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the playlist to rate.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - score
   *             properties:
   *               score:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 5
   *                 example: 5
   *               comment:
   *                 type: string
   *                 maxLength: 200
   *                 example: "La playlist está muy limpio, me gusta mucho."
   *             additionalProperties: false
   *             description: Only `score` and optional `comment` are accepted.
   *     responses:
   *       201:
   *         description: Rating successfully created for the playlist.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Rating'
   *       401:
   *         description: Unauthorized. Token missing or invalid.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Unauthorized access.
   *       404:
   *         description: Playlist not found (invalid `playlistId` format).
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Playlist not found.
   *       422:
   *         description: >
   *           Validation error (e.g., score out of range, comment too long,
   *           playlist does not exist, playlist is private, user already rated this playlist,
   *           or user does not exist).
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: The playlist being rated does not exist.
   *       500:
   *         description: Internal server error while creating playlist rating.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while creating playlist rating.
   */
  app.post(`${baseAPIURL}/playlists/:playlistId/ratings`, async (req, res) => {
    try {
      const { playlistId } = req.params;
      const { score, comment } = req.body;
      const userId = req.user.id;

      const rating = await ratingService.createPlaylistRating({
        playlistId,
        userId,
        score,
        comment,
      });

      return res.status(201).send({
        _id: rating._id,
        beatId: rating.beatId ?? null,
        playlistId: rating.playlistId ?? null,
        userId: rating.userId,
        user: rating.user,
        score: rating.score,
        comment: rating.comment,
        createdAt: rating.createdAt,
        updatedAt: rating.updatedAt,
      });
    } catch (err) {
      if (err.status) {
        return res.status(err.status).send({ message: err.message });
      }
      logger.error(
        `Internal server error while creating playlist rating: ${err}`
      );
      return res.status(500).send({
        message: 'Internal server error while creating playlist rating',
      });
    }
  });

  /**
   * @swagger
   * /api/v1/ratings/{ratingId}:
   *   get:
   *     tags:
   *       - Ratings
   *     summary: Get a specific rating by its ID
   *     description: >
   *       Retrieves a single rating by its ID. Useful for moderation or admin tools.
   *       `ratingId` must be a valid MongoDB ObjectId.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: ratingId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the rating to retrieve.
   *     responses:
   *       200:
   *         description: Rating successfully retrieved.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Rating'
   *       401:
   *         description: Unauthorized. Token missing or invalid.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Unauthorized access.
   *       404:
   *         description: Rating not found (invalid or non-existent `ratingId`).
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Rating not found.
   *       500:
   *         description: Internal server error while retrieving rating.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while retrieving rating.
   */
  app.get(`${baseAPIURL}/ratings/:ratingId`, async (req, res) => {
    try {
      const { ratingId } = req.params;

      const rating = await ratingService.getRatingById({ ratingId });

      return res.status(200).send({
        _id: rating._id,
        beatId: rating.beatId ?? null,
        playlistId: rating.playlistId ?? null,
        userId: rating.userId,
        user: rating.user,
        score: rating.score,
        comment: rating.comment,
        createdAt: rating.createdAt,
        updatedAt: rating.updatedAt,
      });
    } catch (err) {
      if (err.status) {
        return res.status(err.status).send({ message: err.message });
      }

      logger.error(`Internal server error while retrieving rating: ${err}`);

      return res.status(500).send({
        message: 'Internal server error while retrieving rating',
      });
    }
  });

  /**
   * @swagger
   * /api/v1/beats/{beatId}/ratings/me:
   *   get:
   *     tags:
   *       - Ratings
   *     summary: Get the current user's rating for a beat
   *     description: >
   *       Returns the rating of the authenticated user for the specified beat.
   *       If the user has not rated this beat yet, a 404 is returned.
   *       `beatId` must be a valid MongoDB ObjectId.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: beatId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the beat whose rating is being requested.
   *     responses:
   *       200:
   *         description: Rating found for this beat and user.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Rating'
   *       401:
   *         description: Unauthorized. Token missing or invalid.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Unauthorized access.
   *       404:
   *         description: Beat not found or user has no rating for this beat.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Rating not found.
   *       422:
   *         description: Related resource not found (e.g., userId does not correspond to an existing user in materialized views).
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: userId must correspond to an existing user
   *       500:
   *         description: Internal server error while retrieving rating.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while retrieving rating.
   */
  app.get(`${baseAPIURL}/beats/:beatId/ratings/me`, async (req, res) => {
    try {
      const { beatId } = req.params;
      const userId = req.user.id;

      const rating = await ratingService.getMyBeatRating({ beatId, userId });

      return res.status(200).send({
        _id: rating._id,
        beatId: rating.beatId ?? null,
        playlistId: rating.playlistId ?? null,
        userId: rating.userId,
        score: rating.score,
        comment: rating.comment,
        createdAt: rating.createdAt,
        updatedAt: rating.updatedAt,
      });
    } catch (err) {
      if (err.status) {
        return res.status(err.status).send({ message: err.message });
      }
      logger.error(`Internal server error while retrieving rating: ${err}`);
      return res.status(500).send({
        message: 'Internal server error while retrieving rating',
      });
    }
  });

  /**
   * @swagger
   * /api/v1/playlists/{playlistId}/ratings/me:
   *   get:
   *     tags:
   *       - Ratings
   *     summary: Get the current user's rating for a playlist
   *     description: >
   *       Returns the rating of the authenticated user for the specified playlist.
   *       If the user has not rated this playlist yet, a 404 is returned.
   *       `playlistId` must be a valid MongoDB ObjectId.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: playlistId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the playlist whose rating is being requested.
   *     responses:
   *       200:
   *         description: Rating found for this playlist and user.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Rating'
   *       401:
   *         description: Unauthorized. Token missing or invalid.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Unauthorized access.
   *       404:
   *         description: Playlist not found or user has no rating for this playlist.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Rating not found.
   *       500:
   *         description: Internal server error while retrieving playlist rating.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while retrieving playlist rating.
   */
  app.get(
    `${baseAPIURL}/playlists/:playlistId/ratings/me`,
    async (req, res) => {
      try {
        const { playlistId } = req.params;
        const userId = req.user.id;

        const rating = await ratingService.getMyPlaylistRating({
          playlistId,
          userId,
        });

        return res.status(200).send({
          _id: rating._id,
          beatId: rating.beatId ?? null,
          playlistId: rating.playlistId ?? null,
          userId: rating.userId,
          score: rating.score,
          comment: rating.comment,
          createdAt: rating.createdAt,
          updatedAt: rating.updatedAt,
        });
      } catch (err) {
        if (err.status) {
          return res.status(err.status).send({ message: err.message });
        }
        logger.error(
          `Internal server error while retrieving playlist rating: ${err}`
        );
        return res.status(500).send({
          message: 'Internal server error while retrieving playlist rating',
        });
      }
    }
  );

  /**
   * @swagger
   * /api/v1/beats/{beatId}/ratings:
   *   get:
   *     tags:
   *       - Ratings
   *     summary: List ratings for a beat
   *     description: >
   *       Returns a paginated list of ratings associated with a given beat,
   *       along with the average score and total number of ratings.
   *       Supports `page` and `limit` query parameters. Maximum `limit` is 100.
   *       Sorted by `createdAt` descending.
   *       `beatId` must be a valid MongoDB ObjectId.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: beatId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the beat whose ratings are being requested.
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number for pagination. Defaults to 1 if invalid or not provided.
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *         description: Number of ratings per page. Defaults to 20 if invalid or not provided.
   *     responses:
   *       200:
   *         description: Paginated list of ratings for the beat, with average and total count.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                       $ref: '#/components/schemas/Rating'
   *                 average:
   *                   type: number
   *                   example: 4.5
   *                 count:
   *                   type: integer
   *                   example: 12
   *                 page:
   *                   type: integer
   *                   example: 1
   *                 limit:
   *                   type: integer
   *                   example: 20
   *       401:
   *         description: Unauthorized. Token missing or invalid.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Unauthorized access.
   *       404:
   *         description: Beat not found (invalid `beatId`).
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Beat not found.
   *       500:
   *         description: Internal server error while listing ratings for beat.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while listing ratings for beat.
   */
  app.get(`${baseAPIURL}/beats/:beatId/ratings`, async (req, res) => {
    try {
      const { beatId } = req.params;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;

      const result = await ratingService.listBeatRatings({
        beatId,
        page,
        limit,
      });

      return res.status(200).send({
        data: result.data.map((rating) => ({
          _id: rating._id,
          beatId: rating.beatId ?? null,
          playlistId: rating.playlistId ?? null,
          userId: rating.userId,
          score: rating.score,
          comment: rating.comment,
          createdAt: rating.createdAt,
          updatedAt: rating.updatedAt,
        })),
        average: result.average,
        count: result.count,
        page: result.page,
        limit: result.limit,
      });
    } catch (err) {
      if (err.status) {
        return res.status(err.status).send({ message: err.message });
      }
      logger.error(
        `Internal server error while listing ratings for beat: ${err}`
      );
      return res.status(500).send({
        message: 'Internal server error while listing ratings for beat',
      });
    }
  });

  /**
   * @swagger
   * /api/v1/playlists/{playlistId}/ratings:
   *   get:
   *     tags:
   *       - Ratings
   *     summary: List ratings for a playlist
   *     description: >
   *       Returns a paginated list of ratings associated with a given playlist,
   *       along with the average score and total number of ratings.
   *       Supports `page` and `limit` query parameters. Maximum `limit` is 100.
   *       Sorted by `createdAt` descending.
   *       `playlistId` must be a valid MongoDB ObjectId.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: playlistId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the playlist whose ratings are being requested.
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number for pagination. Defaults to 1 if invalid or not provided.
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 20
   *         description: Number of ratings per page. Defaults to 20 if invalid or not provided.
   *     responses:
   *       200:
   *         description: Paginated list of ratings for the playlist, with average and total count.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                       $ref: '#/components/schemas/Rating'
   *                 average:
   *                   type: number
   *                   example: 4.5
   *                 count:
   *                   type: integer
   *                   example: 12
   *                 page:
   *                   type: integer
   *                   example: 1
   *                 limit:
   *                   type: integer
   *                   example: 20
   *       401:
   *         description: Unauthorized. Token missing or invalid.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Unauthorized access.
   *       404:
   *         description: Playlist not found (invalid `playlistId`).
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Playlist not found.
   *       500:
   *         description: Internal server error while listing ratings for playlist.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while listing ratings for playlist.
   */
  app.get(`${baseAPIURL}/playlists/:playlistId/ratings`, async (req, res) => {
    try {
      const { playlistId } = req.params;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;

      const result = await ratingService.listPlaylistRatings({
        playlistId,
        page,
        limit,
      });

      return res.status(200).send({
        data: result.data.map((rating) => ({
          _id: rating._id,
          beatId: rating.beatId ?? null,
          playlistId: rating.playlistId ?? null,
          userId: rating.userId,
          score: rating.score,
          comment: rating.comment,
          createdAt: rating.createdAt,
          updatedAt: rating.updatedAt,
        })),
        average: result.average,
        count: result.count,
        page: result.page,
        limit: result.limit,
      });
    } catch (err) {
      if (err.status) {
        return res.status(err.status).send({ message: err.message });
      }
      logger.error(
        `Internal server error while listing ratings for playlist: ${err}`
      );
      return res.status(500).send({
        message: 'Internal server error while listing ratings for playlist',
      });
    }
  });

  /**
   * @swagger
   * /api/v1/ratings/{ratingId}:
   *   delete:
   *     tags:
   *       - Ratings
   *     summary: Delete a rating
   *     description: >
   *       Deletes a rating if it exists and belongs to the authenticated user.
   *       The operation is idempotent:
   *       - If the rating does not exist, or the ID is invalid, it returns `deleted: false` with status 200.
   *       - If the rating exists and is deleted, it returns `deleted: true` with status 200.
   *       - If the rating exists but belongs to another user, it returns 401.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: ratingId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the rating to delete. Must be a valid MongoDB ObjectId.
   *     responses:
   *       200:
   *         description: Rating deletion result. `deleted` is true if the rating was deleted, false otherwise.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 deleted:
   *                   type: boolean
   *                   example: true
   *       401:
   *         description: Unauthorized. Rating exists but does not belong to the authenticated user.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: You are not allowed to delete this rating.
   *       500:
   *         description: Internal server error while deleting rating.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while deleting rating.
   */
  app.delete(`${baseAPIURL}/ratings/:ratingId`, async (req, res) => {
    try {
      const { ratingId } = req.params;
      const userId = req.user.id;

      const result = await ratingService.deleteRating({ ratingId, userId });

      return res.status(200).send(result);
    } catch (err) {
      if (err.status) {
        return res.status(err.status).send({ message: err.message });
      }

      logger.error(`Internal server error while deleting rating: ${err}`);

      return res.status(500).send({
        message: 'Internal server error while deleting rating',
      });
    }
  });

  /**
   * @swagger
   * /api/v1/ratings/{ratingId}:
   *   put:
   *     tags:
   *       - Ratings
   *     summary: Update a rating
   *     description: >
   *       Updates the score (and optionally the comment) of a rating identified by its ID.
   *       Only the user who created the rating can update it.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: ratingId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the rating to edit. Must be a valid MongoDB ObjectId.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - score
   *             properties:
   *               score:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 5
   *                 example: 5
   *               comment:
   *                 type: string
   *                 maxLength: 200
   *                 example: "Muy pro, master limpio."
   *     responses:
   *       200:
   *         description: Rating successfully updated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Rating'
   *       401:
   *         description: Unauthorized. The authenticated user is not the owner of the rating.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: You are not allowed to edit this rating.
   *       404:
   *         description: Rating not found. Either the ID is invalid or the rating does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Rating not found.
   *       422:
   *         description: Validation error (e.g., score out of range, comment too long).
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Score must be between 1 and 5.
   *       500:
   *         description: Internal server error while updating rating.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while updating rating.
   */
  app.put(`${baseAPIURL}/ratings/:ratingId`, async (req, res) => {
    try {
      const { ratingId } = req.params;
      const { score, comment } = req.body;
      const userId = req.user.id;

      const rating = await ratingService.updateRatingById({
        ratingId,
        userId,
        score,
        comment,
      });

      return res.status(200).send({
        _id: rating._id,
        beatId: rating.beatId ?? null,
        playlistId: rating.playlistId ?? null,
        userId: rating.userId,
        score: rating.score,
        comment: rating.comment,
        createdAt: rating.createdAt,
        updatedAt: rating.updatedAt,
      });
    } catch (err) {
      if (err.status) {
        return res.status(err.status).send({ message: err.message });
      }
      logger.error(`Internal server error while updating rating: ${err}`);
      return res.status(500).send({
        message: 'Internal server error while updating rating',
      });
    }
  });

  /**
   * @swagger
   * /api/v1/ratings/{ratingId}:
   *   patch:
   *     tags:
   *       - Ratings
   *     summary: Update a rating
   *     description: >
   *       Updates the score (and optionally the comment) of a rating identified by its ID.
   *       Only the user who created the rating can update it.
   *       This endpoint behaves the same as the PUT version; it is provided for convenience.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: ratingId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the rating to edit. Must be a valid MongoDB ObjectId.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - score
   *             properties:
   *               score:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 5
   *                 example: 4
   *               comment:
   *                 type: string
   *                 maxLength: 200
   *                 example: "He ajustado la mezcla y ahora suena mejor."
   *     responses:
   *       200:
   *         description: Rating successfully updated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Rating'
   *       401:
   *         description: Unauthorized. The authenticated user is not the owner of the rating.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: You are not allowed to edit this rating.
   *       404:
   *         description: Rating not found. Either the ID is invalid or the rating does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Rating not found.
   *       422:
   *         description: Validation error (e.g., score out of range, comment too long).
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Score must be between 1 and 5.
   *       500:
   *         description: Internal server error while updating rating.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while updating rating.
   */
  app.patch(`${baseAPIURL}/ratings/:ratingId`, async (req, res) => {
    try {
      const { ratingId } = req.params;
      const { score, comment } = req.body;
      const userId = req.user.id;

      const rating = await ratingService.updateRatingById({
        ratingId,
        userId,
        score,
        comment,
      });

      return res.status(200).send({
        _id: rating._id,
        beatId: rating.beatId ?? null,
        playlistId: rating.playlistId ?? null,
        userId: rating.userId,
        score: rating.score,
        comment: rating.comment,
        createdAt: rating.createdAt,
        updatedAt: rating.updatedAt,
      });
    } catch (err) {
      if (err.status) {
        return res.status(err.status).send({ message: err.message });
      }

      logger.error(`Internal server error while updating rating: ${err}`);
      return res.status(500).send({
        message: 'Internal server error while updating rating',
      });
    }
  });
}
