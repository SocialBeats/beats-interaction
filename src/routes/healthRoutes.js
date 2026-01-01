import { getVersion } from '../utils/versionUtils.js';
import { isKafkaConnected } from '../services/kafkaConsumer.js';
import mongoose from 'mongoose';
import { isRedisEnabled, isRedisConnected } from '../cache.js';
import { ModerationReport } from '../models/models.js';

export default function healthRoutes(app) {
  const version = getVersion();

  /**
   * @swagger
   * /api/v1/health:
   *   get:
   *     tags:
   *       - Health
   *     summary: Health check endpoint
   *     description: Returns basic information to verify that the API is running properly.
   *     responses:
   *       200:
   *         description: API is healthy and responding.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: ok
   *                 message:
   *                   type: string
   *                   example: Health check successful
   *                 version:
   *                   type: string
   *                   example: "1.0.0"
   *                 uptime:
   *                   type: number
   *                   example: 123.45
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                   example: "2025-11-08T13:41:47.074Z"
   *                 environment:
   *                   type: string
   *                   example: "development"
   *                 db:
   *                   type: string
   *                   example: connected
   */
  app.get('/api/v1/health', (req, res) => {
    const dbStatus =
      mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.status(200).json({
      status: 'ok',
      message: 'Health check successful',
      version,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      db: dbStatus,
    });
  });

  /**
   * @swagger
   * /api/v1/kafka/health:
   *   get:
   *     tags:
   *       - Kafka
   *     summary: Kafka health check
   *     description: Verifies whether Kafka is currently reachable and responding.
   *     responses:
   *       200:
   *         description: Kafka is running and the connection is successful.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 kafka:
   *                   type: string
   *                   example: connected
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                   example: "2025-11-08T13:41:47.074Z"
   *       503:
   *         description: Kafka is not reachable or connection failed.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 kafka:
   *                   type: string
   *                   example: disconnected
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                   example: "2025-11-08T13:41:47.074Z"
   */
  app.get('/api/v1/kafka/health', async (req, res) => {
    const status = await isKafkaConnected();

    res.status(status ? 200 : 503).json({
      kafka: status ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * @swagger
   * /api/v1/moderation/health:
   *   get:
   *     tags:
   *       - Moderation
   *     summary: Moderation system health check
   *     description: >
   *       Provides health information about the moderation system, including Redis connectivity,
   *       cron execution status, and pending moderation reports.
   *     responses:
   *       200:
   *         description: Moderation system is operational.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: healthy
   *                 moderation:
   *                   type: object
   *                   properties:
   *                     cronStatus:
   *                       type: string
   *                       example: running
   *                     redisEnabled:
   *                       type: boolean
   *                       example: true
   *                     redisConnected:
   *                       type: boolean
   *                       example: true
   *                     pendingReports:
   *                       type: number
   *                       example: 5
   *                     oldPendingReports:
   *                       type: number
   *                       example: 2
   *                     warning:
   *                       type: string
   *                       nullable: true
   *                       example: null
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                   example: "2025-11-08T13:41:47.074Z"
   *       500:
   *         description: Internal server error while checking moderation health.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 message:
   *                   type: string
   *                   example: Unexpected error while checking moderation health
   */
  app.get('/api/v1/moderation/health', async (req, res) => {
    try {
      const redisEnabled = isRedisEnabled();
      const redisConnected = isRedisConnected();

      let pendingReports = 0;
      let oldPendingReports = 0;

      if (redisConnected) {
        pendingReports = await ModerationReport.countDocuments({
          state: 'Checking',
        });

        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        oldPendingReports = await ModerationReport.countDocuments({
          state: 'Checking',
          createdAt: { $lt: tenMinutesAgo },
        });
      }

      const cronStatus = redisEnabled && redisConnected ? 'running' : 'stopped';
      const health = oldPendingReports > 10 ? 'degraded' : 'healthy';

      res.json({
        status: health,
        moderation: {
          cronStatus,
          redisEnabled,
          redisConnected,
          pendingReports,
          oldPendingReports,
          warning:
            oldPendingReports > 10
              ? 'High number of old pending reports. Check rate limits or API availability.'
              : null,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  });
}
