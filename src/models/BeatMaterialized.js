import mongoose from 'mongoose';

const BeatMaterializedSchema = new mongoose.Schema(
  {
    beatId: { type: String, index: true },
    title: { type: String, index: true },
    artist: { type: String, index: true },
    genre: { type: String, index: true },
    bpm: Number,
    key: String,
    duration: Number,
    tags: { type: [String], index: true },
    audioUrl: String,
    isFree: Boolean,
    price: Number,
    plays: { type: Number, index: -1 },
    updatedAt: { type: Date, default: Date.now, index: true },
  },
  { collection: 'beats_view' }
);

BeatMaterializedSchema.index({ genre: 1, bpm: 1 });
BeatMaterializedSchema.index({ isFree: 1, price: 1 });

const BeatMaterialized = mongoose.model(
  'BeatMaterialized',
  BeatMaterializedSchema
);

export default BeatMaterialized;
