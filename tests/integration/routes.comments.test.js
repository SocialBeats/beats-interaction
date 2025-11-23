import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { api } from '../setup/setup.js';
import { Comment } from '../../src/models/models.js';

describe('POST /api/v1/beats/:beatId/comments (integration)', () => {
  const withAuth = (req) =>
    req.set('Authorization', `Bearer ${global.testToken}`);

  it('should create a comment and return 201 with the created comment', async () => {
    const beatId = new mongoose.Types.ObjectId().toString();

    const response = await withAuth(
      api.post(`/api/v1/beats/${beatId}/comments`)
    )
      .send({ text: 'Nice beat bro!' })
      .expect(201);

    const createdId = response.body.id;

    // Respuesta API
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('beatId', beatId);
    expect(response.body).toHaveProperty('authorId');
    expect(response.body).toHaveProperty('text', 'Nice beat bro!');
    expect(response.body).toHaveProperty('createdAt');

    // Verificar directamente que existe el documento correcto
    const commentInDb = await Comment.findById(createdId).lean();
    expect(commentInDb).not.toBeNull();
    expect(commentInDb.text).toBe('Nice beat bro!');
    expect(commentInDb.beatId.toString()).toBe(beatId);
  });

  it('should return 404 if beatId is not a valid ObjectId', async () => {
    const response = await withAuth(
      api.post('/api/v1/beats/not-a-valid-objectid/comments')
    )
      .send({ text: 'Test comment' })
      .expect(404);

    expect(response.body).toEqual({
      message: 'Beat not found',
    });

    // No debería haberse creado ningún comentario con ese texto
    const comment = await Comment.findOne({ text: 'Test comment' });
    expect(comment).toBeNull();
  });

  it('should return 422 if text is empty or only spaces', async () => {
    const beatId = new mongoose.Types.ObjectId().toString();

    const response = await withAuth(
      api.post(`/api/v1/beats/${beatId}/comments`)
    )
      .send({ text: '   ' })
      .expect(422);

    expect(response.body.message).toBe(
      'The comment cannot be empty or have only spaces.'
    );

    // No se debe crear nada con ese text
    const comment = await Comment.findOne({ text: '   ' });
    expect(comment).toBeNull();
  });

  it('should return 422 if text exceeds maxlength', async () => {
    const beatId = new mongoose.Types.ObjectId().toString();
    const longText = 'a'.repeat(201);

    const response = await withAuth(
      api.post(`/api/v1/beats/${beatId}/comments`)
    )
      .send({ text: longText })
      .expect(422);

    expect(response.body).toHaveProperty('message');

    // Nada debería haberse guardado con ese texto
    const comment = await Comment.findOne({ text: longText });
    expect(comment).toBeNull();
  });
});
