import logger from '../../logger.js';
import commentService from '../services/commentService.js';

const baseAPIURL = '/api/v1';

export default function commentRoutes(app) {
  /**
   * @swagger
   * /api/v1/beats/{beatId}/comments:
   *   post:
   *     tags:
   *       - Comments
   *     summary: Create a comment on a beat
   *     description: Creates a new comment associated with the specified beat for the authenticated user.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: beatId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the beat to comment on.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - text
   *             properties:
   *               text:
   *                 type: string
   *                 maxLength: 200
   *                 example: "La caja entra tarde, yo la adelantaría un poco."
   *     responses:
   *       201:
   *         description: Comment successfully created.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 beatId:
   *                   type: string
   *                 authorId:
   *                   type: string
   *                 text:
   *                   type: string
   *                 createdAt:
   *                   type: string
   *                   format: date-time
   *       401:
   *         description: Unauthorized. Token missing or invalid.
   *       404:
   *         description: Beat not found.
   *       422:
   *         description: Validation error.
   *       500:
   *         description: Internal server error.
   */
  app.post(`${baseAPIURL}/beats/:beatId/comments`, async (req, res) => {
    try {
      const { beatId } = req.params;
      const { text } = req.body;
      const authorId = req.user.id;

      const comment = await commentService.createBeatComment({
        beatId,
        authorId,
        text,
      });

      return res.status(201).send({
        id: comment._id,
        beatId: comment.beatId,
        authorId: comment.authorId,
        text: comment.text,
        createdAt: comment.createdAt,
      });
    } catch (err) {
      if (err.status) {
        return res.status(err.status).send({ message: err.message });
      }
      logger.error(`Internal server error while creating comment: ${err}`);
      return res.status(500).send({
        message: 'Internal server error while creating comment',
      });
    }
  });

  /**
   * @swagger
   * /api/v1/playlists/{playlistId}/comments:
   *   post:
   *     tags:
   *       - Comments
   *     summary: Create a comment on a playlist
   *     description: Creates a new comment associated with the specified playlist for the authenticated user.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: playlistId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the playlist to comment on.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - text
   *             properties:
   *               text:
   *                 type: string
   *                 maxLength: 200
   *                 example: "Muy buena selección de temas."
   *     responses:
   *       201:
   *         description: Comment successfully created.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 playlistId:
   *                   type: string
   *                 authorId:
   *                   type: string
   *                 text:
   *                   type: string
   *                 createdAt:
   *                   type: string
   *                   format: date-time
   *       401:
   *         description: Unauthorized. Token missing or invalid.
   *       404:
   *         description: Playlist not found.
   *       422:
   *         description: Validation error.
   *       500:
   *         description: Internal server error.
   */
  app.post(`${baseAPIURL}/playlists/:playlistId/comments`, async (req, res) => {
    try {
      const { playlistId } = req.params;
      const { text } = req.body;
      const authorId = req.user.id;

      const comment = await commentService.createPlaylistComment({
        playlistId,
        authorId,
        text,
      });

      return res.status(201).send({
        id: comment._id,
        playlistId: comment.playlistId,
        authorId: comment.authorId,
        text: comment.text,
        createdAt: comment.createdAt,
      });
    } catch (err) {
      if (err.status) {
        return res.status(err.status).send({ message: err.message });
      }
      logger.error(`Internal server error while creating comment: ${err}`);
      return res.status(500).send({
        message: 'Internal server error while creating comment',
      });
    }
  });
}
