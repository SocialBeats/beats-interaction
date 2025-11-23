import request from 'supertest';
import app from '../../main.js';
import { connectDB, disconnectDB } from '../../src/db.js';
import jwt from 'jsonwebtoken';

beforeAll(async () => {
  await connectDB();

  global.testToken = jwt.sign(
    { id: '66f0bacbb6c946d88c40e123' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
});

afterAll(async () => {
  await disconnectDB();
});

export const api = request(app);
