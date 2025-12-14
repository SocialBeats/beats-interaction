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
   *                  `beatId` must be a valid MongoDB ObjectId.
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
   *               $ref: '#/components/schemas/Comment'
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
   *         description: Validation error or related resource not found (e.g., text empty/too long, or authorId does not correspond to an existing user).
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: authorId must correspond to an existing user
   *       500:
   *         description: Internal server error while creating comment.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while creating comment.
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
        _id: comment._id,
        beatId: comment.beatId ?? null,
        playlistId: comment.playlistId ?? null,
        authorId: comment.authorId,
        author: comment.author,
        text: comment.text,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
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
   *                  `playlistId` must be a valid MongoDB ObjectId.
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
   *               $ref: '#/components/schemas/Comment'
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
   *         description: Validation error or related resource not found (e.g., playlist private, playlist does not exist, invalid text, or authorId does not correspond to an existing user).
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: The playlist being commented does not exist.
   *       500:
   *         description: Internal server error while creating comment.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while creating comment.
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
        _id: comment._id,
        beatId: comment.beatId ?? null,
        playlistId: comment.playlistId ?? null,
        authorId: comment.authorId,
        author: comment.author,
        text: comment.text,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
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
   *                  `commentId` must be a valid MongoDB ObjectId.
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
   *               $ref: '#/components/schemas/Comment'
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
   *         description: Comment not found (invalid or non-existent `commentId`).
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Comment not found.
   *       422:
   *         description: Related resource not found.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: authorId must correspond to an existing user
   *       500:
   *         description: Internal server error while retrieving comment.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while retrieving comment.
   */
  app.get(`${baseAPIURL}/comments/:commentId`, async (req, res) => {
    try {
      const { commentId } = req.params;

      const comment = await commentService.getCommentById({ commentId });

      return res.status(200).send({
        _id: comment._id,
        beatId: comment.beatId ?? null,
        playlistId: comment.playlistId ?? null,
        authorId: comment.authorId,
        author: comment.author,
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
   *     description: >
   *       Returns a paginated list of comments associated with a given beat.
   *       Supports `page` and `limit` query parameters. Maximum `limit` is 100.
   *       Sorted by `createdAt` descending.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: beatId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the beat whose comments are being requested. Must be a valid MongoDB ObjectId.
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
   *         description: Number of comments per page. Defaults to 20 if invalid or not provided.
   *     responses:
   *       200:
   *         description: Paginated list of comments for the beat.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Comment'
   *                 page:
   *                   type: integer
   *                   example: 1
   *                 limit:
   *                   type: integer
   *                   example: 20
   *                 total:
   *                   type: integer
   *                   example: 42
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
   *         description: Internal server error while listing comments.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while listing comments for beat.
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
          _id: comment._id,
          beatId: comment.beatId ?? null,
          playlistId: comment.playlistId ?? null,
          authorId: comment.authorId,
          author: comment.author,
          text: comment.text,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
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
   *     description: >
   *       Returns a paginated list of comments associated with a given playlist.
   *       Supports `page` and `limit` query parameters. Maximum `limit` is 100.
   *       Sorted by `createdAt` descending.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: playlistId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the playlist whose comments are being requested. Must be a valid MongoDB ObjectId.
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
   *         description: Number of comments per page. Defaults to 20 if invalid or not provided.
   *     responses:
   *       200:
   *         description: Paginated list of comments for the playlist.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Comment'
   *                 page:
   *                   type: integer
   *                   example: 1
   *                 limit:
   *                   type: integer
   *                   example: 20
   *                 total:
   *                   type: integer
   *                   example: 42
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
   *         description: Playlist not found (invalid or non-existent playlistId).
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Playlist not found.
   *       500:
   *         description: Internal server error while listing comments.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while listing comments for playlist.
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
          _id: comment._id,
          beatId: comment.beatId ?? null,
          playlistId: comment.playlistId ?? null,
          authorId: comment.authorId,
          author: comment.author,
          text: comment.text,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
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
   *     description: >
   *       Deletes a comment if it belongs to the authenticated user.
   *       The operation is idempotent: returns success even if the comment does not exist or the ID is invalid.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: commentId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the comment to delete. Must be a valid MongoDB ObjectId.
   *     responses:
   *       200:
   *         description: Comment deletion result. `deleted` is true if the comment was deleted, false otherwise.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 deleted:
   *                   type: boolean
   *                   example: true
   *       401:
   *         description: Unauthorized. Comment exists but does not belong to the authenticated user.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: You are not allowed to delete this comment.
   *       500:
   *         description: Internal server error while deleting comment.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while deleting comment.
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

  /**
   * @swagger
   * /api/v1/comments/{commentId}:
   *   put:
   *     tags:
   *       - Comments
   *     summary: Update a comment
   *     description: Updates the text of a comment. Only the author can edit their own comment.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: commentId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the comment to edit. Must be a valid Mongo ObjectId.
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
   *                 example: "Lo he escuchado mejor, el bombo está OK."
   *     responses:
   *       200:
   *         description: Comment successfully updated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Comment'
   *       401:
   *         description: Unauthorized. The authenticated user is not the author of the comment.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: You are not allowed to edit this comment.
   *       404:
   *         description: Comment not found. Either invalid ID or comment does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Comment not found.
   *       422:
   *         description: Validation error. For example, text is empty or exceeds 200 characters.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Comment text cannot be empty or exceed 200 characters.
   *       500:
   *         description: Internal server error while updating comment.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while updating comment.
   */
  app.put(`${baseAPIURL}/comments/:commentId`, async (req, res) => {
    try {
      const { commentId } = req.params;
      const { text } = req.body;
      const userId = req.user.id;

      const comment = await commentService.updateCommentText({
        commentId,
        userId,
        text,
      });

      return res.status(200).send({
        _id: comment._id,
        beatId: comment.beatId ?? null,
        playlistId: comment.playlistId ?? null,
        authorId: comment.authorId,
        author: comment.author,
        text: comment.text,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      });
    } catch (err) {
      if (err.status) {
        return res.status(err.status).send({ message: err.message });
      }
      logger.error(`Internal server error while updating comment: ${err}`);
      return res.status(500).send({
        message: 'Internal server error while updating comment',
      });
    }
  });

  /**
   * @swagger
   * /api/v1/comments/{commentId}:
   *   patch:
   *     tags:
   *      - Comments
   *     summary: Update a comment
   *     description: Updates the text of a comment. Only the author can edit their own comment.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: commentId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the comment to edit. Must be a valid Mongo ObjectId.
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
   *                 example: "Lo he escuchado mejor, el bombo está OK."
   *     responses:
   *       200:
   *         description: Comment successfully updated.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Comment'
   *       401:
   *         description: Unauthorized. The authenticated user is not the author of the comment.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: You are not allowed to edit this comment.
   *       404:
   *         description: Comment not found. Either invalid ID or comment does not exist.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Comment not found.
   *       422:
   *         description: Validation error. For example, text is empty or exceeds 200 characters.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Comment text cannot be empty or exceed 200 characters.
   *       500:
   *         description: Internal server error while updating comment.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while updating comment.
   */
  app.patch(`${baseAPIURL}/comments/:commentId`, async (req, res) => {
    try {
      const { commentId } = req.params;
      const { text } = req.body;
      const userId = req.user.id;

      const comment = await commentService.updateCommentText({
        commentId,
        userId,
        text,
      });

      return res.status(200).send({
        _id: comment._id,
        beatId: comment.beatId ?? null,
        playlistId: comment.playlistId ?? null,
        authorId: comment.authorId,
        author: comment.author,
        text: comment.text,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      });
    } catch (err) {
      if (err.status) {
        return res.status(err.status).send({ message: err.message });
      }
      logger.error(`Internal server error while updating comment: ${err}`);
      return res.status(500).send({
        message: 'Internal server error while updating comment',
      });
    }
  });
}
