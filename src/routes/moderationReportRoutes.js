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
}
