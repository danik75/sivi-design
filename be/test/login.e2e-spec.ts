import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { UserRepository } from './../src/auth/user.repository';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(UserRepository)
      .useValue({ findByUsername: async () => null })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/login (POST) - placeholder', async () => {
    await request(app.getHttpServer())
      .post('/login')
      .send({ username: 'nonexistent', password: 'x' })
      .expect(401);
  });

  afterEach(async () => {
    await app.close();
  });
});
