import logger from '../../logger.js';
import moderationReportService from '../services/moderationReportService.js';

const baseAPIURL = '/api/v1';

export default function moderationReportRoutes(app) {
  /**
   * @swagger
   * /api/v1/comments/{commentId}/moderationReports:
   *   post:
   *     tags:
   *       - ModerationReports
   *     summary: Create a moderation report for a comment
   *     description: >
   *       Creates a moderation report for the specified comment for the authenticated user.
   *       The report is created with state "Checking".
   *       `authorId` is automatically derived from the comment's author.
   *       `commentId` must be a valid MongoDB ObjectId.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: commentId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the comment to report.
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             additionalProperties: false
   *             description: No body is required. The authenticated user becomes the reporter.
   *     responses:
   *       201:
   *         description: Moderation report successfully created.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ModerationReport'
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
   *         description: Validation error (e.g., reporting own content or schema rule violations).
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: A user cannot report their own content.
   *       500:
   *         description: Internal server error while creating moderation report.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while creating moderation report.
   */
  app.post(
    `${baseAPIURL}/comments/:commentId/moderationReports`,
    async (req, res) => {
      try {
        const { commentId } = req.params;
        const userId = req.user.id;

        const report =
          await moderationReportService.createCommentModerationReport({
            commentId,
            userId,
          });

        return res.status(201).send({
          _id: report._id,
          commentId: report.commentId ?? null,
          ratingId: report.ratingId ?? null,
          playlistId: report.playlistId ?? null,
          userId: report.userId,
          authorId: report.authorId,
          state: report.state,
          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
        });
      } catch (err) {
        if (err.status) {
          return res.status(err.status).send({ message: err.message });
        }
        logger.error(
          `Internal server error while creating moderation report: ${err}`
        );
        return res.status(500).send({
          message: 'Internal server error while creating moderation report',
        });
      }
    }
  );

  /**
   * @swagger
   * /api/v1/ratings/{ratingId}/moderationReports:
   *   post:
   *     tags:
   *       - ModerationReports
   *     summary: Create a moderation report for a rating
   *     description: >
   *       Creates a moderation report for the specified rating for the authenticated user.
   *       The report is created with state "Checking".
   *       `authorId` is automatically derived from the rating's userId.
   *       `ratingId` must be a valid MongoDB ObjectId.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: ratingId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the rating to report.
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             additionalProperties: false
   *             description: No body is required. The authenticated user becomes the reporter.
   *     responses:
   *       201:
   *         description: Moderation report successfully created.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ModerationReport'
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
   *       422:
   *         description: Validation error (e.g., reporting own content or schema rule violations).
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: A user cannot report their own content.
   *       500:
   *         description: Internal server error while creating moderation report.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while creating moderation report.
   */
  app.post(
    `${baseAPIURL}/ratings/:ratingId/moderationReports`,
    async (req, res) => {
      try {
        const { ratingId } = req.params;
        const userId = req.user.id;

        const report =
          await moderationReportService.createRatingModerationReport({
            ratingId,
            userId,
          });

        return res.status(201).send({
          _id: report._id,
          commentId: report.commentId ?? null,
          ratingId: report.ratingId ?? null,
          playlistId: report.playlistId ?? null,
          userId: report.userId,
          authorId: report.authorId,
          state: report.state,
          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
        });
      } catch (err) {
        if (err.status) {
          return res.status(err.status).send({ message: err.message });
        }
        logger.error(
          `Internal server error while creating moderation report: ${err}`
        );
        return res.status(500).send({
          message: 'Internal server error while creating moderation report',
        });
      }
    }
  );

  /**
   * @swagger
   * /api/v1/playlists/{playlistId}/moderationReports:
   *   post:
   *     tags:
   *       - ModerationReports
   *     summary: Create a moderation report for a playlist
   *     description: >
   *       Creates a moderation report for the specified playlist for the authenticated user.
   *       The report is created with state "Checking".
   *       `authorId` is automatically derived from the playlist's ownerId.
   *       `playlistId` must be a valid MongoDB ObjectId.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: playlistId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the playlist to report.
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             additionalProperties: false
   *             description: No body is required. The authenticated user becomes the reporter.
   *     responses:
   *       201:
   *         description: Moderation report successfully created.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ModerationReport'
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
   *         description: Validation error (e.g., reporting own content or schema rule violations).
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: A user cannot report their own content.
   *       500:
   *         description: Internal server error while creating moderation report.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while creating moderation report.
   */
  app.post(
    `${baseAPIURL}/playlists/:playlistId/moderationReports`,
    async (req, res) => {
      try {
        const { playlistId } = req.params;
        const userId = req.user.id;

        const report =
          await moderationReportService.createPlaylistModerationReport({
            playlistId,
            userId,
          });

        return res.status(201).send({
          _id: report._id,
          commentId: report.commentId ?? null,
          ratingId: report.ratingId ?? null,
          playlistId: report.playlistId ?? null,
          userId: report.userId,
          authorId: report.authorId,
          state: report.state,
          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
        });
      } catch (err) {
        if (err.status) {
          return res.status(err.status).send({ message: err.message });
        }
        logger.error(
          `Internal server error while creating moderation report: ${err}`
        );
        return res.status(500).send({
          message: 'Internal server error while creating moderation report',
        });
      }
    }
  );

  /**
   * @swagger
   * /api/v1/moderationReports/users/{userId}:
   *   get:
   *     tags:
   *       - ModerationReports
   *     summary: Get all moderation reports where the specified user is the reported user
   *     description: >
   *       Retrieves all moderation reports where the specified user is the reported user (authorId).
   *       No pagination is applied.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the reported user (authorId).
   *     responses:
   *       200:
   *         description: List of moderation reports where the user is the reported user (authorId).
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/ModerationReport'
   *       401:
   *         description: Unauthorized.
   *       404:
   *         description: User not found (invalid userId).
   *       500:
   *         description: Internal server error.
   */
  app.get(`${baseAPIURL}/moderationReports/users/:userId`, async (req, res) => {
    try {
      const { userId } = req.params;

      const reports =
        await moderationReportService.getModerationReportsByUserId({
          userId,
        });

      return res.status(200).send(
        reports.map((report) => ({
          _id: report._id,
          commentId: report.commentId ?? null,
          ratingId: report.ratingId ?? null,
          playlistId: report.playlistId ?? null,
          userId: report.userId,
          authorId: report.authorId,
          state: report.state,
          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
        }))
      );
    } catch (err) {
      if (err.status) {
        return res.status(err.status).send({ message: err.message });
      }

      logger.error(
        `Internal server error while fetching moderation reports: ${err}`
      );

      return res.status(500).send({
        message: 'Internal server error while fetching moderation reports',
      });
    }
  });

  /**
   * @swagger
   * /api/v1/moderationReports/me:
   *   get:
   *     tags:
   *       - ModerationReports
   *     summary: Get all moderation reports where the authenticated user is the reported user
   *     description: >
   *       Retrieves all moderation reports where the authenticated user is the reported user (authorId).
   *       No pagination is applied.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of moderation reports where the user is the reported user (authorId).
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/ModerationReport'
   *       401:
   *         description: Unauthorized.
   *       500:
   *         description: Internal server error.
   */
  app.get(`${baseAPIURL}/moderationReports/me`, async (req, res) => {
    try {
      const userId = req.user.id;

      const reports = await moderationReportService.getModerationReportsByUser({
        userId,
      });

      return res.status(200).send(
        reports.map((report) => ({
          _id: report._id,
          commentId: report.commentId ?? null,
          ratingId: report.ratingId ?? null,
          playlistId: report.playlistId ?? null,
          userId: report.userId,
          authorId: report.authorId,
          state: report.state,
          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
        }))
      );
    } catch (err) {
      if (err.status) {
        return res.status(err.status).send({ message: err.message });
      }

      logger.error(
        `Internal server error while fetching moderation reports: ${err}`
      );

      return res.status(500).send({
        message: 'Internal server error while fetching moderation reports',
      });
    }
  });

  /**
   * @swagger
   * /api/v1/moderationReports/{moderationReportId}:
   *   get:
   *     tags:
   *       - ModerationReports
   *     summary: Get a moderation report by id
   *     description: >
   *       Retrieves a moderation report by its id.
   *       Authentication is required.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: moderationReportId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the moderation report.
   *     responses:
   *       200:
   *         description: Moderation report found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ModerationReport'
   *       401:
   *         description: Unauthorized.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Unauthorized access.
   *       404:
   *         description: Moderation report not found.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Moderation report not found.
   *       500:
   *         description: Internal server error.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while fetching moderation report.
   */
  app.get(
    `${baseAPIURL}/moderationReports/:moderationReportId`,
    async (req, res) => {
      try {
        const { moderationReportId } = req.params;

        const report = await moderationReportService.getModerationReportById({
          moderationReportId,
        });

        return res.status(200).send({
          _id: report._id,
          commentId: report.commentId ?? null,
          ratingId: report.ratingId ?? null,
          playlistId: report.playlistId ?? null,
          userId: report.userId,
          authorId: report.authorId,
          state: report.state,
          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
        });
      } catch (err) {
        if (err.status) {
          return res.status(err.status).send({ message: err.message });
        }

        logger.error(
          `Internal server error while fetching moderation report: ${err}`
        );

        return res.status(500).send({
          message: 'Internal server error while fetching moderation report',
        });
      }
    }
  );
}
