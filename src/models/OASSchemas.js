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

export const RatingSchema = {
  type: 'object',
  properties: {
    _id: { type: 'string', example: '654321abcdef' },
    beatId: { type: 'string', example: 'beatId1', nullable: true },
    playlistId: { type: 'string', example: 'playlistId1', nullable: true },
    userId: { type: 'string', example: '123456abcdef' },
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
