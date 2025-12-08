import {
  BeatMaterialized,
  UserMaterialized,
  Playlist,
  Rating,
  Comment,
} from '../models/models.js';
import logger from '../../logger.js';
import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'beats-interaction',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'beats-interaction-group' });
const producer = kafka.producer();

const admin = kafka.admin();

async function processEvent(event) {
  const data = event.payload;

  switch (event.type) {
    case 'BEAT_CREATED':
      await BeatMaterialized.create({
        beatId: data._id,
        title: data.title,
        artist: data.artist,
        genre: data.genre,
        bpm: data.bpm,
        key: data.key,
        duration: data.duration,
        tags: data.tags,
        audioUrl: data.audio?.url,
        isFree: data.pricing?.isFree,
        price: data.pricing?.price,
        plays: data.stats?.plays,
        updatedAt: new Date(),
      });
      logger.verbose(`New Beat ${data._id} added in Materialized View`);
      break;

    case 'BEAT_UPDATED':
      await BeatMaterialized.findOneAndUpdate(
        { beatId: data._id },
        {
          title: data.title,
          artist: data.artist,
          genre: data.genre,
          bpm: data.bpm,
          key: data.key,
          duration: data.duration,
          tags: data.tags,
          audioUrl: data.audio?.url,
          isFree: data.pricing?.isFree,
          price: data.pricing?.price,
          plays: data.stats?.plays,
          updatedAt: new Date(),
        },
        { upsert: true, new: true }
      );
      logger.verbose(`Beat ${data._id} updated in Materialized View`);
      break;

    case 'BEAT_DELETED':
      const beatId = data._id;
      await BeatMaterialized.findOneAndDelete({ beatId });
      logger.verbose(`Beat ${beatId} deleted from Materialized View`);
      await Comment.deleteMany({ beatId });
      logger.verbose(`All comments for beat ${beatId} deleted`);
      await Rating.deleteMany({ beatId });
      logger.verbose(`All ratings for beat ${beatId} deleted`);
      await Playlist.updateMany(
        { 'items.beatId': beatId },
        { $pull: { items: { beatId } } }
      );
      logger.verbose(`Beat ${beatId} removed from all playlists`);
      break;
    case 'USER_CREATED':
      await UserMaterialized.create({
        userId: data._id,
        username: data.username,
        email: data.email,
        roles: data.roles,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
      });
      logger.verbose(`New User ${data._id} added in Materialized View`);
      break;

    case 'USER_UPDATED':
      await UserMaterialized.findOneAndUpdate(
        { userId: data._id },
        {
          username: data.username,
          email: data.email,
          roles: data.roles,
          updatedAt: new Date(),
        },
        { upsert: true, new: true }
      );
      logger.verbose(`User ${data._id} updated in Materialized View`);
      break;

    case 'USER_DELETED':
      const userId = data._id;
      await Playlist.deleteMany({ ownerId: userId });
      logger.verbose(`All playlists owned by user ${userId} deleted`);
      await Playlist.updateMany(
        { collaborators: userId },
        { $pull: { collaborators: userId } }
      );
      logger.verbose(
        `User ${userId} removed from collaborators in all playlists`
      );
      await Comment.deleteMany({ authorId: userId });
      logger.verbose(`All comments by user ${userId} deleted`);
      await Rating.deleteMany({ userId });
      logger.verbose(`All ratings by user ${userId} deleted`);
      await UserMaterialized.findOneAndDelete({ userId });
      logger.verbose(`User ${userId} deleted from Materialized View`);
      await BeatMaterialized.deleteMany({ artist: data.username });
      logger.verbose(
        `All beats from user ${userId} deleted from Materialized View`
      );
      break;

    default:
      logger.warn('⚠ Unknown event detected:', event.type);
  }
}

async function sendToDLQ(event, reason) {
  try {
    await producer.send({
      topic: 'beats-interaction-dlq',
      messages: [
        {
          value: JSON.stringify({
            originalEvent: event,
            error: reason,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });
    logger.warn(`Event sent to DLQ: ${event.type}, reason: ${reason}`);
  } catch (err) {
    logger.error('Failed to send event to DLQ:', err);
  }
}

export async function startKafkaConsumer() {
  const MAX_RETRIES = Number(process.env.KAFKA_CONNECTION_MAX_RETRIES || 5);
  const RETRY_DELAY = Number(process.env.KAFKA_CONNECTION_RETRY_DELAY || 5000);
  const COOLDOWN_AFTER_FAIL = Number(process.env.KAFKA_COOLDOWN || 30000);

  let attempt = 1;

  while (true) {
    try {
      logger.info(`Connecting to Kafka... (Attempt ${attempt}/${MAX_RETRIES})`);
      await consumer.connect();
      await consumer.subscribe({ topic: 'beats-events', fromBeginning: true });
      await consumer.subscribe({ topic: 'users-events', fromBeginning: true });

      logger.info('Kafka connected & listening');

      await consumer.run({
        eachMessage: async ({ topic, message }) => {
          try {
            const event = JSON.parse(message.value.toString());
            await processEvent(event);
          } catch (err) {
            logger.error(
              'Error processing message:',
              err,
              'Message:',
              message.value.toString()
            );
            await sendToDLQ(message.value.toString(), err.message);
          }
        },
      });

      attempt = 1;
      break;
    } catch (err) {
      logger.error(`Kafka connection failed: ${err.message}`);

      if (attempt >= MAX_RETRIES) {
        logger.warn(
          `Max retries reached. Cooling down for ${COOLDOWN_AFTER_FAIL / 1000}s before trying again...`
        );
        await new Promise((res) => setTimeout(res, COOLDOWN_AFTER_FAIL));
        attempt = 1;
      } else {
        attempt++;
        logger.warn(`Retrying in ${RETRY_DELAY / 1000}s...`);
        await new Promise((res) => setTimeout(res, RETRY_DELAY));
      }
    }
  }
}

export async function isKafkaConnected() {
  try {
    await admin.connect();
    await admin.describeCluster();
    await admin.disconnect();
    return true;
  } catch (err) {
    return false;
  }
}

export function isKafkaEnabled() {
  return process.env.ENABLE_KAFKA.toLocaleLowerCase() === 'true';
}

export { consumer, producer };
