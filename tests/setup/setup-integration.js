import { beforeAll, afterAll } from 'vitest';
import { DockerComposeEnvironment, Wait } from 'testcontainers';
import supertest from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

export async function setupDockerEnvironment() {
  const environment = await new DockerComposeEnvironment(
    process.cwd(),
    'docker-compose-test.yml'
  )
    .withWaitStrategy('beats-interaction', Wait.forHealthCheck())
    .up();

  let beatsContainer;
  let mongoContainer;

  const possibleNames = ['beats-interaction-1'];

  for (const name of possibleNames) {
    try {
      beatsContainer = environment.getContainer(name);
      break;
    } catch (error) {}
  }

  const mongoNames = ['mongodb-1'];
  for (const name of mongoNames) {
    try {
      mongoContainer = environment.getContainer(name);
      break;
    } catch (error) {}
  }

  if (!beatsContainer) {
    throw new Error('No se pudo encontrar el contenedor beats-interaction');
  }

  if (!mongoContainer) {
    throw new Error('No se pudo encontrar el contenedor mongodb');
  }

  const port = beatsContainer.getMappedPort(3002);
  const host = beatsContainer.getHost();
  const mongoPort = mongoContainer.getMappedPort(27017);

  const api = supertest(`http://${host}:${port}`);
  const testUserId = '66f0bacbb6c946d88c40e123';
  const testToken = jwt.sign({ id: testUserId }, 'secret', {
    expiresIn: '1h',
  });

  const mongoUrl = `mongodb://${host}:${mongoPort}/beats-interaction`;
  await mongoose.connect(mongoUrl);

  await new Promise((resolve) => setTimeout(resolve, 2000));

  return {
    environment,
    api,
    testUserId,
    testToken,
  };
}

export async function teardownDockerEnvironment(context) {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (context && context.environment) {
    await context.environment.down({ removeVolumes: true });
  }
}

export const withAuth = (req) => {
  global.testUserId = '66f0bacbb6c946d88c40e123';
  global.testToken = jwt.sign({ id: global.testUserId }, 'secret', {
    expiresIn: '1h',
  });
  req.set('x-gateway-authenticated', `true`);
  req.set('x-user-id', global.testUserId);
  return req;
};

beforeAll(async () => {}, 90000);

afterAll(async () => {}, 30000);
