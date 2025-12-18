export const ItemSchema = {
  type: 'object',
  properties: {
    beatId: { type: 'string', example: '654321abcdef' },
    addedBy: { type: 'string', example: '123456abcdef' },
    addedAt: {
      type: 'string',
      format: 'date-time',
      example: '2025-11-23T12:00:00.000Z',
    },
  },
  required: ['beatId', 'addedBy', 'addedAt'],
};

export const PlaylistSchema = {
  type: 'object',
  properties: {
    _id: { type: 'string', example: '654321abcdef' },
    ownerId: { type: 'string', example: '123456abcdef' },
    name: { type: 'string', example: 'My Awesome Playlist' },
    description: {
      type: 'string',
      example: 'A playlist with my favorite beats',
    },
    isPublic: { type: 'boolean', example: true },
    collaborators: {
      type: 'array',
      items: { type: 'string' },
      example: ['userId1', 'userId2'],
    },
    items: {
      type: 'array',
      items: { $ref: '#/components/schemas/Item' },
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      example: '2025-11-23T10:00:00.000Z',
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      example: '2025-11-23T11:00:00.000Z',
    },
  },
  required: ['_id', 'ownerId', 'name', 'items', 'collaborators'],
};

export const DetailedPlaylistSchema = {
  type: 'object',
  properties: {
    _id: { type: 'string', example: '654321abcdef' },
    ownerId: { type: 'string', example: '123456abcdef' },
    name: { type: 'string', example: 'My Awesome Playlist' },
    description: {
      type: 'string',
      example: 'A playlist with my favorite beats',
    },
    isPublic: { type: 'boolean', example: true },
    collaborators: {
      type: 'array',
      items: { type: 'string' },
      example: ['userId1', 'userId2'],
    },
    items: {
      type: 'array',
      items: { $ref: '#/components/schemas/Item' },
    },
    collaboratorsData: {
      type: 'array',
      items: { $ref: '#/components/schemas/UserMaterialized' },
      description: 'Array with full collaborators data',
    },
    beatsData: {
      type: 'array',
      items: { $ref: '#/components/schemas/BeatMaterialized' },
      description: 'Array with full beats data',
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      example: '2025-11-23T10:00:00.000Z',
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      example: '2025-11-23T11:00:00.000Z',
    },
  },
  required: ['_id', 'ownerId', 'name', 'items', 'collaborators'],
};

export const RatingSchema = {
  type: 'object',
  properties: {
    _id: { type: 'string', example: '654321abcdef' },
    beatId: { type: 'string', example: 'beatId1', nullable: true },
    playlistId: { type: 'string', example: 'playlistId1', nullable: true },
    userId: { type: 'string', example: '123456abcdef' },
    user: {
      allOf: [{ $ref: '#/components/schemas/UserMaterialized' }],
      description: 'Full information about the user author.',
    },
    score: { type: 'number', minimum: 1, maximum: 5, example: 4 },
    comment: {
      type: 'string',
      example: 'This beat is awesome!',
      maxLength: 200,
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      example: '2025-11-23T10:00:00.000Z',
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      example: '2025-11-23T11:00:00.000Z',
    },
  },
  required: ['userId', 'score'],
  description:
    'Represents a rating given by a user to a beat or a playlist. Only one of beatId or playlistId must be present.',
};

export const CommentSchema = {
  type: 'object',
  properties: {
    _id: { type: 'string', example: '654321abcdef' },
    beatId: { type: 'string', example: 'beatId1', nullable: true },
    playlistId: { type: 'string', example: 'playlistId1', nullable: true },
    authorId: { type: 'string', example: '123456abcdef' },
    author: {
      allOf: [{ $ref: '#/components/schemas/UserMaterialized' }],
      description: 'Full information about the comment author.',
    },
    text: {
      type: 'string',
      example: 'This is an awesome beat!',
      maxLength: 200,
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      example: '2025-11-23T10:00:00.000Z',
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      example: '2025-11-23T11:00:00.000Z',
    },
  },
  required: ['authorId', 'text'],
  description:
    'Represents a comment made by a user on either a beat or a playlist. Only one of beatId or playlistId must be present.',
};

export const BeatMaterializedSchema = {
  type: 'object',
  properties: {
    beatId: { type: 'string', example: 'abcdef123456' },
    title: { type: 'string', example: 'Midnight Drive' },
    artist: { type: 'string', example: 'John Beatmaker' },
    genre: { type: 'string', example: 'Hip-hop' },
    bpm: { type: 'number', example: 94 },
    key: { type: 'string', example: 'Cm' },
    duration: { type: 'number', example: 180 },
    tags: {
      type: 'array',
      items: { type: 'string' },
      example: ['chill', 'lofi', 'smooth'],
    },
    audioUrl: { type: 'string', example: 'https://cdn.mysite.com/beat.mp3' },
    isFree: { type: 'boolean', example: true },
    price: { type: 'number', example: 14.99 },
    plays: { type: 'number', example: 15430 },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      example: '2025-11-23T11:00:00.000Z',
    },
  },
  required: ['beatId', 'title', 'artist', 'genre', 'updatedAt'],
  description:
    'Materialized view of beats used for efficient querying and filtering.',
};

export const UserMaterializedSchema = {
  type: 'object',
  properties: {
    userId: { type: 'string', example: '123456abcdef' },
    username: { type: 'string', example: 'beatMaster99' },
    email: { type: 'string', example: 'user@email.com' },
    roles: {
      type: 'array',
      items: { type: 'string' },
      example: ['producer', 'premium'],
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      example: '2025-11-20T10:00:00.000Z',
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      example: '2025-11-23T14:32:00.000Z',
    },
  },
  required: ['userId', 'username', 'email'],
  description: 'Materialized view of users optimized for quick lookup.',
};
