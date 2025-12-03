import { BeatMaterialized, UserMaterialized } from '../models/models.js';
import logger from '../../logger.js';
import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'beats-interaction',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'beats-interaction-group' });

export async function startKafkaConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'beats-events', fromBeginning: true });
  await consumer.subscribe({ topic: 'users-events', fromBeginning: true });

  logger.info('Kafka ready; Waiting for users and beats events...');

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const event = JSON.parse(message.value.toString());
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
          logger.verbose('New Beat added in Materialized View');
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
            { $pull: { items: { beatId: beatId } } }
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

          await Rating.deleteMany({ userId: userId });
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
    },
  });
}
