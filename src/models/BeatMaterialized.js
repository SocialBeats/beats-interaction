import mongoose from 'mongoose';

const BeatMaterializedSchema = new mongoose.Schema(
  {
    beatId: { type: String, index: true },
    title: { type: String, index: true },
    artist: { type: String, index: true },
    genre: { type: String, index: true },
    tags: { type: [String], index: true },
    description: String,
    audio: {
      url: String,
      s3Key: String,
    },
    plays: { type: Number, default: 0, index: -1 },
    downloads: { type: Number, default: 0 },
    isPublic: { type: Boolean, default: true },
    isDownloadable: { type: Boolean, default: false },
    createdBy: {
      userId: String,
      username: String,
      roles: [String],
    },
    updatedAt: { type: Date, default: Date.now, index: true },
  },
  { collection: 'beats_view' }
);

BeatMaterializedSchema.index({ genre: 1 });
BeatMaterializedSchema.index({ 'createdBy.userId': 1 });

const BeatMaterialized = mongoose.model(
  'BeatMaterialized',
  BeatMaterializedSchema
);

export default BeatMaterialized;
