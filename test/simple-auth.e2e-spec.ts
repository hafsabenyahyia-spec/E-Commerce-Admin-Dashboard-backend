import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Simple Authentication Test (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication Endpoints', () => {
    it('should reject weak passwords', async () => {
      const registerDto = {
        email: `weak-password-test-${Date.now()}@example.com`,
        password: 'weak',
        full_name: 'Test User'
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject invalid email format', async () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'StrongPassword123!',
        full_name: 'Test User'
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject login with non-existent user', async () => {
      const loginDto = {
        email: `nonexistent-${Date.now()}@example.com`,
        password: 'StrongPassword123!'
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject access to protected route without token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject access to protected route with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject access to admin route without token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/admin')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });
});