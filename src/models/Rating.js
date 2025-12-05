import mongoose from 'mongoose';
import Playlist from './Playlist.js';

const ratingSchema = new mongoose.Schema(
  {
    beatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Beat',
      required: false,
    },
    playlistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Playlist',
      required: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: '',
      maxlength: 200,
    },
  },
  {
    timestamps: true,
  }
);

ratingSchema.pre('validate', function (next) {
  const hasBeat = !!this.beatId;
  const hasPlaylist = !!this.playlistId;

  if (hasBeat && hasPlaylist) {
    return next(
      new Error(
        'A rating cannot be associated with both a beat and a playlist at the same time.'
      )
    );
  }

  if (!hasBeat && !hasPlaylist) {
    return next(
      new Error('A rating must be associated with either a beat or a playlist.')
    );
  }

  next();
});

ratingSchema.pre('validate', async function (next) {
  if (!this.playlistId) return next();

  try {
    const playlist = await Playlist.findById(this.playlistId).select(
      'isPublic'
    );

    if (!playlist) {
      return next(new Error('The playlist being rated does not exist.'));
    }

    if (!playlist.isPublic) {
      return next(new Error('You cannot rate a private playlist.'));
    }

    next();
  } catch (err) {
    next(err);
  }
});

const Rating = mongoose.model('Rating', ratingSchema);

export default Rating;
