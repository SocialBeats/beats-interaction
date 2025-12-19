import request from 'supertest';
import app from '../../main.js';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  global.testUserId = '66f0bacbb6c946d88c40e123';
  global.testToken = jwt.sign(
    { id: global.testUserId },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

export const api = request(app);

export const withAuth = (req) => {
  req.set('x-gateway-authenticated', `true`);
  req.set('x-user-id', global.testUserId);
  return req;
};
