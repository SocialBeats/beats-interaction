// tests/setup/setup-tests.js
import { beforeAll, afterAll } from 'vitest';
import { DockerComposeEnvironment, Wait } from 'testcontainers';
import supertest from 'supertest';
import jwt from 'jsonwebtoken';

let environment;

beforeAll(async () => {}, 90000); // 90 segundos para dar tiempo a build + health checks

afterAll(async () => {}, 30000);
