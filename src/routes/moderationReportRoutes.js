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
   *       Creates a moderation report for the specified comment.
   *       The authenticated user becomes the reporter (`userId`).
   *       The reported user (`authorId`) is inferred from the comment owner.
   *       The report is created with state "Checking".
   *
   *       When Kafka is enabled, the `userId` must exist in the materialized users store.
   *       If Redis is enabled, the moderation process is executed asynchronously.
   *
   *     security:
   *       - bearerAuth: []
   *
   *     parameters:
   *       - in: path
   *         name: commentId
   *         required: true
   *         schema:
   *           type: string
   *         description: MongoDB ObjectId of the comment to report.
   *
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             additionalProperties: false
   *             description: No request body is required.
   *
   *     responses:
   *       201:
   *         description: Moderation report successfully created.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ModerationReport'
   *
   *       401:
   *         description: Unauthorized – missing or invalid JWT token.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Unauthorized access.
   *
   *       404:
   *         description: Resource not found.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *             examples:
   *               invalidCommentId:
   *                 summary: Invalid or non-existing comment ID
   *                 value:
   *                   message: Comment not found
   *
   *       409:
   *         description: Conflict – moderation report already exists.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *             examples:
   *               duplicateReport:
   *                 summary: Report already exists
   *                 value:
   *                   message: This comment has already been reported and is currently being reviewed
   *
   *       422:
   *         description: Unprocessable entity – validation or domain rule violation.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *             examples:
   *               invalidObjectId:
   *                 summary: Invalid commentId format
   *                 value:
   *                   message: Comment not found
   *               reportingOwnContent:
   *                 summary: User attempts to report their own content
   *                 value:
   *                   message: A user cannot report their own content.
   *               userNotFoundKafka:
   *                 summary: Kafka enabled but user does not exist in materialized view
   *                 value:
   *                   message: userId must correspond to an existing user
   *               validationError:
   *                 summary: Mongoose validation error
   *                 value:
   *                   message: Validation failed
   *
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
   *       Creates a moderation report for the specified rating.
   *       The authenticated user becomes the reporter (`userId`).
   *       The reported user (`authorId`) is derived from the rating's owner (`rating.userId`).
   *       The report is created with state "Checking".
   *
   *       When Kafka is enabled, the `userId` must exist in the materialized users store.
   *       If Redis is enabled, the moderation process is executed asynchronously.
   *
   *     security:
   *       - bearerAuth: []
   *
   *     parameters:
   *       - in: path
   *         name: ratingId
   *         required: true
   *         schema:
   *           type: string
   *         description: MongoDB ObjectId of the rating to report.
   *
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             additionalProperties: false
   *             description: No request body is required.
   *
   *     responses:
   *       201:
   *         description: Moderation report successfully created.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ModerationReport'
   *
   *       401:
   *         description: Unauthorized – missing or invalid JWT token.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Unauthorized access.
   *
   *       404:
   *         description: Resource not found.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *             examples:
   *               invalidRatingId:
   *                 summary: Invalid or non-existent rating ID
   *                 value:
   *                   message: Rating not found
   *
   *       409:
   *         description: Conflict – moderation report already exists.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *             examples:
   *               duplicateReport:
   *                 summary: Report already exists
   *                 value:
   *                   message: This rating has already been reported and is currently being reviewed
   *
   *       422:
   *         description: Unprocessable entity – validation or business rule violation.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *             examples:
   *               invalidObjectId:
   *                 summary: Invalid ratingId format
   *                 value:
   *                   message: Rating not found
   *               reportingOwnContent:
   *                 summary: User attempts to report their own content
   *                 value:
   *                   message: A user cannot report their own content.
   *               userNotFoundKafka:
   *                 summary: Kafka enabled but user does not exist in materialized view
   *                 value:
   *                   message: userId must correspond to an existing user
   *               validationError:
   *                 summary: Mongoose validation error
   *                 value:
   *                   message: Validation failed
   *
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
   *       Creates a moderation report for the specified playlist.
   *       The authenticated user becomes the reporter (`userId`).
   *       The reported user (`authorId`) is derived from the playlist's owner (`ownerId`).
   *       The report is created with state "Checking".
   *
   *       When Kafka is enabled, the `userId` must exist in the materialized users store.
   *       If Redis is enabled, the moderation process is executed asynchronously.
   *
   *     security:
   *       - bearerAuth: []
   *
   *     parameters:
   *       - in: path
   *         name: playlistId
   *         required: true
   *         schema:
   *           type: string
   *         description: MongoDB ObjectId of the playlist to report.
   *
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             additionalProperties: false
   *             description: No request body is required.
   *
   *     responses:
   *       201:
   *         description: Moderation report successfully created.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ModerationReport'
   *
   *       401:
   *         description: Unauthorized – missing or invalid JWT token.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Unauthorized access.
   *
   *       404:
   *         description: Resource not found.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *             examples:
   *               invalidPlaylistId:
   *                 summary: Invalid or non-existent playlist ID
   *                 value:
   *                   message: Playlist not found
   *
   *       409:
   *         description: Conflict – moderation report already exists.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *             examples:
   *               duplicateReport:
   *                 summary: Report already exists
   *                 value:
   *                   message: This playlist has already been reported and is currently being reviewed
   *
   *       422:
   *         description: Unprocessable entity – validation or business rule violation.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *             examples:
   *               invalidObjectId:
   *                 summary: Invalid playlistId format
   *                 value:
   *                   message: Playlist not found
   *               reportingOwnContent:
   *                 summary: User attempts to report their own content
   *                 value:
   *                   message: A user cannot report their own content.
   *               userNotFoundKafka:
   *                 summary: Kafka enabled but user does not exist in materialized view
   *                 value:
   *                   message: userId must correspond to an existing user
   *               validationError:
   *                 summary: Mongoose validation error
   *                 value:
   *                   message: Validation failed
   *
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
   *       Retrieves all moderation reports where the specified user is the reported user (`authorId`).
   *       Results are sorted by `createdAt` in descending order.
   *       No pagination is applied.
   *       When Kafka is enabled, `userId` must correspond to an existing user in the materialized store.
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
   *         description: Unauthorized. Token missing or invalid.
   *       404:
   *         description: User not found (invalid userId).
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               additionalProperties: false
   *               properties:
   *                 message:
   *                   type: string
   *                   example: User not found
   *       422:
   *         description: Validation error when Kafka is enabled.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               additionalProperties: false
   *               properties:
   *                 message:
   *                   type: string
   *             examples:
   *               userIdNotExistingKafkaEnabled:
   *                 summary: Kafka enabled and userId does not exist in materialized users
   *                 value:
   *                   message: userId must correspond to an existing user
   *       500:
   *         description: Internal server error while fetching moderation reports.
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
   *       Retrieves all moderation reports where the authenticated user is the reported user (`authorId`).
   *       Results are sorted by `createdAt` in descending order.
   *       No pagination is applied.
   *       When Kafka is enabled, the authenticated user must exist in the materialized users store.
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
   *         description: Unauthorized. Token missing or invalid.
   *       422:
   *         description: Validation error when Kafka is enabled.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               additionalProperties: false
   *               properties:
   *                 message:
   *                   type: string
   *             examples:
   *               userIdNotExistingKafkaEnabled:
   *                 summary: Kafka enabled and authenticated user does not exist in materialized users
   *                 value:
   *                   message: userId must correspond to an existing user
   *       500:
   *         description: Internal server error while fetching moderation reports.
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
   *       `moderationReportId` must be a valid MongoDB ObjectId.
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
   *         description: Unauthorized. Token missing or invalid.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               additionalProperties: false
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Unauthorized access.
   *       404:
   *         description: Moderation report not found (invalid id or does not exist).
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               additionalProperties: false
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Moderation report not found
   *       500:
   *         description: Internal server error while fetching moderation report.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               additionalProperties: false
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

  /**
   * @swagger
   * /api/v1/moderationReports:
   *   get:
   *     tags:
   *       - ModerationReports
   *     summary: Get all moderation reports
   *     description: >
   *       Retrieves all moderation reports in the database, sorted by `createdAt` in descending order.
   *       No pagination is applied.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of all moderation reports.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/ModerationReport'
   *             examples:
   *               exampleList:
   *                 summary: Example list of moderation reports
   *                 value:
   *                   - _id: "6946f225a458033638ada8ab"
   *                     commentId: "6946f225a458033638ada8aa"
   *                     ratingId: null
   *                     playlistId: null
   *                     userId: "6946f225a458033638ada800"
   *                     authorId: "6946f225a458033638ada999"
   *                     state: "Checking"
   *                     createdAt: "2025-12-20T10:00:00.000Z"
   *                     updatedAt: "2025-12-20T10:00:00.000Z"
   *                   - _id: "6946f225a458033638ada8ae"
   *                     commentId: null
   *                     ratingId: "6946f225a458033638ada8ad"
   *                     playlistId: null
   *                     userId: "6946f225a458033638ada800"
   *                     authorId: "6946f225a458033638ada998"
   *                     state: "Checking"
   *                     createdAt: "2025-12-20T09:30:00.000Z"
   *                     updatedAt: "2025-12-20T09:30:00.000Z"
   *       401:
   *         description: Unauthorized. Token missing or invalid.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               additionalProperties: false
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Unauthorized access.
   *       500:
   *         description: Internal server error while fetching moderation reports.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               additionalProperties: false
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Internal server error while fetching moderation reports
   */
  app.get(`${baseAPIURL}/moderationReports`, async (req, res) => {
    try {
      const reports = await moderationReportService.getAllModerationReports();

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
      logger.error(
        `Internal server error while fetching moderation reports: ${err}`
      );

      return res.status(500).send({
        message: 'Internal server error while fetching moderation reports',
      });
    }
  });
}
