import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    beatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Beat',
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { _id: false }
);

const playlistSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    collaborators: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      validate: [
        {
          validator: (arr) => arr.length <= 30,
          message: 'Playlists cannot have more than 30 collaborators.',
        },
        {
          validator: (arr) =>
            new Set(arr.map((id) => String(id))).size === arr.length,
          message:
            'You cannot add the same collaborator to a playlist more than once.',
        },
        {
          validator: function (arr) {
            if (!this.ownerId) return true;
            return !arr.some((id) => String(id) === String(this.ownerId));
          },
          message: 'The playlist owner cannot be added as a collaborator.',
        },
        {
          validator: function (arr) {
            if (this.isPublic === false && arr.length > 0) {
              return false;
            }
            return true;
          },
          message: 'You cannot add collaborators to a private playlist.',
        },
      ],
    },
    name: {
      type: String,
      required: true,
      maxlength: 50,
      validate: {
        validator: (value) => value.trim().length > 0,
        message: 'The name cannot be empty or have only spaces.',
      },
    },
    description: {
      type: String,
      default: '',
      maxlength: 300,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    items: {
      type: [itemSchema],
      validate: [
        {
          validator: (arr) => arr.length <= 250,
          message: 'Playlists cannot have more than 250 beats.',
        },
        {
          validator: (arr) => {
            const beatIds = arr.map((item) => String(item.beatId));
            return new Set(beatIds).size === beatIds.length;
          },
          message:
            'The same beat cannot be added more than once to the playlist.',
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

const Playlist = mongoose.model('Playlist', playlistSchema);

export default Playlist;
