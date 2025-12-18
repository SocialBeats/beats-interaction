// tests/integration/integration.health.test.js
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  setupDockerEnvironment,
  teardownDockerEnvironment,
} from '../setup/docker-helper.js';

describe('GET /api/v1/health (integration)', () => {
  let testContext;

  beforeAll(async () => {
    testContext = await setupDockerEnvironment();
  }, 90000);

  afterAll(async () => {
    await teardownDockerEnvironment(testContext);
  }, 30000);

  it('should be healthy', async () => {
    const res = await testContext.api.get('/api/v1/health');

    // Debug: imprime la respuesta completa
    console.log('Status:', res.status);
    console.log('Body:', JSON.stringify(res.body, null, 2));
    console.log('Text:', res.text);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('message', 'Health check successful');
    expect(res.body).toHaveProperty('version');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('db', 'connected');
  });
});
