import mongoose from 'mongoose';
import Playlist from './Playlist.js';

const commentSchema = new mongoose.Schema(
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
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 200,
      validate: {
        validator: (value) => value.trim().length > 0,
        message: 'The comment cannot be empty or have only spaces.',
      },
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.pre('validate', function (next) {
  const hasBeat = !!this.beatId;
  const hasPlaylist = !!this.playlistId;

  if (hasBeat && hasPlaylist) {
    return next(
      new Error(
        'A comment cannot be associated with both a beat and a playlist at the same time.'
      )
    );
  }

  if (!hasBeat && !hasPlaylist) {
    return next(
      new Error(
        'A comment must be associated with either a beat or a playlist.'
      )
    );
  }

  next();
});

commentSchema.pre('validate', async function (next) {
  if (!this.playlistId) return next();

  try {
    const playlist = await Playlist.findById(this.playlistId).select(
      'isPublic'
    );

    if (!playlist) {
      return next(new Error('The playlist being commented does not exist.'));
    }

    if (!playlist.isPublic) {
      return next(new Error('You cannot comment on a private playlist.'));
    }

    next();
  } catch (err) {
    next(err);
  }
});

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
