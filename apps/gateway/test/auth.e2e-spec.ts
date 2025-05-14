import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';
import { expect } from '@jest/globals';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let authClient: ClientProxy;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('AUTHENTICATION_SERVICE')
      .useValue({
        send: jest.fn().mockImplementation(() => of({})),
        connect: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );

    authClient = moduleFixture.get<ClientProxy>('AUTHENTICATION_SERVICE');

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/auth/register (POST) - should register a new user', () => {
    const createUserDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser = {
      _id: '1',
      ...createUserDto,
      password: 'hashed-password',
    };

    jest.spyOn(authClient, 'send').mockImplementationOnce(() => of(mockUser));

    return request(app.getHttpServer())
      .post('/auth/register')
      .send(createUserDto)
      .expect(201)
      .expect((res) => {
        expect(authClient.send).toHaveBeenCalledWith(
          { cmd: 'register_user' },
          createUserDto,
        );
      });
  });

  it('/auth/register (POST) - should validate request body', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Test User',
        email: 'invalid-email',
        password: '123', // Too short
      })
      .expect(400);
  });
});
