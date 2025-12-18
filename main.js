import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';
import { connectDB, disconnectDB } from './src/db.js';
import {
  startKafkaConsumer,
  consumer,
  producer,
} from './src/services/kafkaConsumer.js';
// import your middlewares here
import verifyToken from './src/middlewares/authMiddlewares.js';
// import your routes here
import aboutRoutes from './src/routes/aboutRoutes.js';
import healthRoutes from './src/routes/healthRoutes.js';
import commentRoutes from './src/routes/commentRoutes.js';
import ratingRoutes from './src/routes/ratingRoutes.js';
import playlistRoutes from './src/routes/playlistRoutes.js';
import moderationReportRoutes from './src/routes/moderationReportRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true });

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(cors());

// add your middlewares here like this:
app.use(verifyToken);

// add your routes here like this:
aboutRoutes(app);
healthRoutes(app);
commentRoutes(app);
ratingRoutes(app);
playlistRoutes(app);
moderationReportRoutes(app);

// Export app for tests. Do not remove this line
export default app;

let server;

if (process.env.NODE_ENV !== 'test') {
  await connectDB();

  if (process.env.ENABLE_KAFKA.toLocaleLowerCase() === 'true') {
    logger.warn('Kafka is enabled, trying to connect');
    await startKafkaConsumer();
  } else {
    logger.warn('Kafka is not enabled');
  }

  server = app.listen(PORT, () => {
    logger.warn(`Using log level: ${process.env.LOG_LEVEL}`);
    logger.info(`API running at http://localhost:${PORT}`);
    logger.info(`Health at http://localhost:${PORT}/api/v1/health`);
    logger.info(`API docs running at http://localhost:${PORT}/api/v1/docs/`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
  });
}

async function gracefulShutdown(signal) {
  logger.warn(`${signal} received. Starting secure shutdown...`);

  try {
    logger.warn('Disconnecting Kafka consumer...');
    await consumer.disconnect();
    logger.warn('Kafka consumer disconnected.');
    logger.warn('Disconnecting Kafka producer...');
    await producer.disconnect();
    logger.warn('Kafka producer disconnected.');
  } catch (err) {
    logger.error('Error disconnecting Kafka:', err);
  }
  if (server) {
    server.close(async () => {
      logger.info('Server closed');
      logger.info(
        'Since now new connections are not allowed. Waiting for current operations to finish...'
      );
      try {
        await disconnectDB();
        logger.info('MongoDB disconnected');
      } catch (err) {
        logger.error('Error disconnecting MongoDB:', err);
      }

      logger.info('Shutdown complete. Bye! ;)');
      process.exit(0);
    });
  }
}
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
