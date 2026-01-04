import mongoose from 'mongoose';
import Comment from './Comment.js';
import Rating from './Rating.js';
import Playlist from './Playlist.js';

const moderationReportSchema = new mongoose.Schema(
  {
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      required: false,
    },
    ratingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rating',
      required: false,
    },
    playlistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Playlist',
      required: false,
    },
    userId: {
      // user who files the report
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorId: {
      // author of the content being reported
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    state: {
      type: String,
      enum: ['Checking', 'Rejected', 'Accepted'],
      default: 'Checking',
      required: true,
    },
  },
  { timestamps: true }
);

// exactly one of commentId, ratingId, playlistId must be set
moderationReportSchema.pre('validate', function (next) {
  const refs = [this.commentId, this.ratingId, this.playlistId].filter(Boolean);
  if (refs.length !== 1) {
    return next(
      new Error(
        'A moderation report must reference exactly one of: commentId, ratingId or playlistId.'
      )
    );
  }
  next();
});

// cannot report own content
moderationReportSchema.pre('validate', function (next) {
  if (
    this.userId &&
    this.authorId &&
    String(this.userId) === String(this.authorId)
  ) {
    return next(new Error('A user cannot report their own content.'));
  }
  next();
});

// validate existence + visibility + real authorId according to type
moderationReportSchema.pre('validate', async function (next) {
  // Relax validation for updates - if the content was deleted, we still want to be able to
  // update the report status to 'Accepted' or 'Rejected' without crashing.
  if (!this.isNew) {
    return next();
  }

  try {
    // PLAYLIST
    if (this.playlistId) {
      const playlist = await Playlist.findById(this.playlistId).select(
        'isPublic ownerId'
      );
      if (!playlist)
        return next(new Error('The playlist being reported does not exist.'));

      if (!playlist.isPublic)
        return next(new Error('You cannot report a private playlist.'));

      if (this.authorId && String(this.authorId) !== String(playlist.ownerId)) {
        return next(new Error('authorId does not match the playlist owner.'));
      }

      return next();
    }

    // COMMENT
    if (this.commentId) {
      const comment = await Comment.findById(this.commentId).select(
        'authorId playlistId'
      );
      if (!comment)
        return next(new Error('The comment being reported does not exist.'));

      // if the comment is on a playlist, same "public only" rule
      if (comment.playlistId) {
        const pl = await Playlist.findById(comment.playlistId).select(
          'isPublic'
        );
        if (!pl)
          return next(
            new Error('The playlist of the reported comment does not exist.')
          );
        if (!pl.isPublic)
          return next(
            new Error('You cannot report a comment from a private playlist.')
          );
      }

      if (this.authorId && String(this.authorId) !== String(comment.authorId)) {
        return next(new Error('authorId does not match the comment author.'));
      }

      return next();
    }

    // RATING
    if (this.ratingId) {
      const rating = await Rating.findById(this.ratingId).select(
        'userId playlistId'
      );
      if (!rating)
        return next(new Error('The rating being reported does not exist.'));

      // if the rating is on a playlist, same "public only" rule
      if (rating.playlistId) {
        const pl = await Playlist.findById(rating.playlistId).select(
          'isPublic'
        );
        if (!pl)
          return next(
            new Error('The playlist of the reported rating does not exist.')
          );
        if (!pl.isPublic)
          return next(
            new Error('You cannot report a rating from a private playlist.')
          );
      }

      if (this.authorId && String(this.authorId) !== String(rating.userId)) {
        return next(new Error('authorId does not match the rating author.'));
      }

      return next();
    }

    next();
  } catch (err) {
    next(err);
  }
});

moderationReportSchema.index(
  { commentId: 1, state: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      commentId: { $exists: true },
      state: 'Checking',
    },
  }
);

moderationReportSchema.index(
  { ratingId: 1, state: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      ratingId: { $exists: true },
      state: 'Checking',
    },
  }
);

moderationReportSchema.index(
  { playlistId: 1, state: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      playlistId: { $exists: true },
      state: 'Checking',
    },
  }
);

const ModerationReport = mongoose.model(
  'ModerationReport',
  moderationReportSchema
);

export default ModerationReport;
