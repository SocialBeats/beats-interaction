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

  /**
   * @swagger
   * /api/v1/comments/{commentId}:
   *   get:
   *     tags:
   *       - Comments
   *     summary: Get a specific comment
   *     description: Retrieves a single comment by its ID. Useful for moderation tools.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: commentId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the comment to retrieve.
   *     responses:
   *       200:
   *         description: Comment successfully retrieved.
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
   *                 authorId:
   *                   type: string
   *                 text:
   *                   type: string
   *                 createdAt:
   *                   type: string
   *                   format: date-time
   *                 updatedAt:
   *                   type: string
   *                   format: date-time
   *       401:
   *         description: Unauthorized. Token missing or invalid.
   *       404:
   *         description: Comment not found.
   *       500:
   *         description: Internal server error.
   */
  app.get(`${baseAPIURL}/comments/:commentId`, async (req, res) => {
    try {
      const { commentId } = req.params;

      const comment = await commentService.getCommentById({ commentId });

      return res.status(200).send({
        id: comment._id,
        beatId: comment.beatId ?? null,
        playlistId: comment.playlistId ?? null,
        authorId: comment.authorId,
        text: comment.text,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      });
    } catch (err) {
      if (err.status) {
        return res.status(err.status).send({ message: err.message });
      }
      logger.error(`Internal server error while retrieving comment: ${err}`);
      return res.status(500).send({
        message: 'Internal server error while retrieving comment',
      });
    }
  });

  /**
   * @swagger
   * /api/v1/beats/{beatId}/comments:
   *   get:
   *     tags:
   *       - Comments
   *     summary: List comments for a beat
   *     description: Returns a paginated list of comments associated with a given beat.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: beatId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the beat whose comments are being requested.
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number for pagination.
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 20
   *         description: Number of comments per page.
   *     responses:
   *       200:
   *         description: List of comments for the beat.
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
   *                       id:
   *                         type: string
   *                       authorId:
   *                         type: string
   *                       text:
   *                         type: string
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                 page:
   *                   type: integer
   *                 limit:
   *                   type: integer
   *                 total:
   *                   type: integer
   *       400:
   *         description: Invalid pagination parameters.
   *       401:
   *         description: Unauthorized. Token missing or invalid.
   *       404:
   *         description: Beat not found.
   *       500:
   *         description: Internal server error.
   */
  app.get(`${baseAPIURL}/beats/:beatId/comments`, async (req, res) => {
    try {
      const { beatId } = req.params;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;

      const result = await commentService.listBeatComments({
        beatId,
        page,
        limit,
      });

      return res.status(200).send({
        data: result.data.map((comment) => ({
          id: comment._id,
          authorId: comment.authorId,
          text: comment.text,
          createdAt: comment.createdAt,
        })),
        page: result.page,
        limit: result.limit,
        total: result.total,
      });
    } catch (err) {
      if (err.status) {
        return res.status(err.status).send({ message: err.message });
      }
      logger.error(
        `Internal server error while listing comments for beat: ${err}`
      );
      return res.status(500).send({
        message: 'Internal server error while listing comments for beat',
      });
    }
  });

  /**
   * @swagger
   * /api/v1/playlists/{playlistId}/comments:
   *   get:
   *     tags:
   *       - Comments
   *     summary: List comments for a playlist
   *     description: Returns a paginated list of comments associated with a given playlist.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: playlistId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the playlist whose comments are being requested.
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number for pagination.
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 20
   *         description: Number of comments per page.
   *     responses:
   *       200:
   *         description: List of comments for the playlist.
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
   *                       id:
   *                         type: string
   *                       authorId:
   *                         type: string
   *                       text:
   *                         type: string
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                 page:
   *                   type: integer
   *                 limit:
   *                   type: integer
   *                 total:
   *                   type: integer
   *       401:
   *         description: Unauthorized. Token missing or invalid.
   *       404:
   *         description: Playlist not found.
   *       500:
   *         description: Internal server error.
   */
  app.get(`${baseAPIURL}/playlists/:playlistId/comments`, async (req, res) => {
    try {
      const { playlistId } = req.params;
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;

      const result = await commentService.listPlaylistComments({
        playlistId,
        page,
        limit,
      });

      return res.status(200).send({
        data: result.data.map((comment) => ({
          id: comment._id,
          authorId: comment.authorId,
          text: comment.text,
          createdAt: comment.createdAt,
        })),
        page: result.page,
        limit: result.limit,
        total: result.total,
      });
    } catch (err) {
      if (err.status) {
        return res.status(err.status).send({ message: err.message });
      }
      logger.error(
        `Internal server error while listing comments for playlist: ${err}`
      );
      return res.status(500).send({
        message: 'Internal server error while listing comments for playlist',
      });
    }
  });

  /**
   * @swagger
   * /api/v1/comments/{commentId}:
   *   delete:
   *     tags:
   *       - Comments
   *     summary: Delete a comment
   *     description: Deletes a comment if it belongs to the authenticated user.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: commentId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the comment to delete.
   *     responses:
   *       200:
   *         description: Comment deleted or did not exist.
   *       401:
   *         description: Unauthorized. Comment does not belong to user.
   *       500:
   *         description: Internal server error.
   */
  app.delete(`${baseAPIURL}/comments/:commentId`, async (req, res) => {
    try {
      const { commentId } = req.params;
      const userId = req.user.id;

      const result = await commentService.deleteCommentById(commentId, userId);

      return res.status(200).send(result);
    } catch (err) {
      if (err.status) {
        return res.status(err.status).send({ message: err.message });
      }

      logger.error(`Internal server error while deleting comment: ${err}`);

      return res.status(500).send({
        message: 'Internal server error while deleting comment',
      });
    }
  });
}
