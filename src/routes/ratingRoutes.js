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
   *       404:
   *         description: Playlist not found (invalid `playlistId`).
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
}
