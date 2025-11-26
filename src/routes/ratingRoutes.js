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
   *                 example: "Muy pro, master limpio."
   *     responses:
   *       201:
   *         description: Rating successfully created.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 beatId:
   *                   type: string
   *                 userId:
   *                   type: string
   *                 score:
   *                   type: integer
   *                 comment:
   *                   type: string
   *                 createdAt:
   *                   type: string
   *                   format: date-time
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
   *         description: Validation error (e.g., score out of range, comment too long, or user already rated this beat).
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
        id: rating._id,
        beatId: rating.beatId,
        userId: rating.userId,
        score: rating.score,
        comment: rating.comment,
        createdAt: rating.createdAt,
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
   *                 example: "Muy buena selección de beats."
   *     responses:
   *       201:
   *         description: Rating successfully created for the playlist.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 playlistId:
   *                   type: string
   *                 userId:
   *                   type: string
   *                 score:
   *                   type: integer
   *                 comment:
   *                   type: string
   *                 createdAt:
   *                   type: string
   *                   format: date-time
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
   *         description: Playlist not found (invalid or non-existent `playlistId`).
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
   *           Validation error. For example:
   *           - score out of range
   *           - comment too long
   *           - playlist does not exist
   *           - playlist is private
   *           - user has already rated this playlist
   *       500:
   *         description: Internal server error while creating playlist rating.
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
        id: rating._id,
        playlistId: rating.playlistId,
        userId: rating.userId,
        score: rating.score,
        comment: rating.comment,
        createdAt: rating.createdAt,
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
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 beatId:
   *                   type: string
   *                   nullable: true
   *                 playlistId:
   *                   type: string
   *                   nullable: true
   *                 userId:
   *                   type: string
   *                 score:
   *                   type: integer
   *                 comment:
   *                   type: string
   *                 createdAt:
   *                   type: string
   *                   format: date-time
   *                 updatedAt:
   *                   type: string
   *                   format: date-time
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
        id: rating._id,
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
   *               type: object
   *               properties:
   *                 beatId:
   *                   type: string
   *                 userId:
   *                   type: string
   *                 score:
   *                   type: integer
   *                 comment:
   *                   type: string
   *                 createdAt:
   *                   type: string
   *                   format: date-time
   *                 updatedAt:
   *                   type: string
   *                   format: date-time
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
        beatId: rating.beatId,
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
   *               type: object
   *               properties:
   *                 playlistId:
   *                   type: string
   *                 userId:
   *                   type: string
   *                 score:
   *                   type: integer
   *                 comment:
   *                   type: string
   *                 createdAt:
   *                   type: string
   *                   format: date-time
   *                 updatedAt:
   *                   type: string
   *                   format: date-time
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
          playlistId: rating.playlistId,
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
   *       Returns all ratings associated with a given beat, along with the average score
   *       and total number of ratings.
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
   *     responses:
   *       200:
   *         description: List of ratings for the beat with average and total count.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       userId:
   *                         type: string
   *                       score:
   *                         type: integer
   *                       comment:
   *                         type: string
   *                 average:
   *                   type: number
   *                   example: 4.5
   *                 count:
   *                   type: integer
   *                   example: 12
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

      const result = await ratingService.listBeatRatings({ beatId });

      return res.status(200).send({
        data: result.data.map((rating) => ({
          userId: rating.userId,
          score: rating.score,
          comment: rating.comment,
        })),
        average: result.average,
        count: result.count,
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
   *       Returns all ratings associated with a given playlist, along with the average score
   *       and total number of ratings.
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
   *     responses:
   *       200:
   *         description: List of ratings for the playlist with average and total count.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       userId:
   *                         type: string
   *                       score:
   *                         type: integer
   *                       comment:
   *                         type: string
   *                 average:
   *                   type: number
   *                   example: 4.5
   *                 count:
   *                   type: integer
   *                   example: 12
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

      const result = await ratingService.listPlaylistRatings({ playlistId });

      return res.status(200).send({
        data: result.data.map((rating) => ({
          userId: rating.userId,
          score: rating.score,
          comment: rating.comment,
        })),
        average: result.average,
        count: result.count,
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
}
