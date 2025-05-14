import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';
import { jest } from '@jest/globals';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let authClient: ClientProxy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-token'),
          },
        },
        {
          provide: 'AUTHENTICATION_SERVICE',
          useValue: {
            send: jest.fn().mockImplementation(() => of({})),
            connect: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    authClient = module.get<ClientProxy>('AUTHENTICATION_SERVICE');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should call authClient.send with correct parameters', async () => {
      const createUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      jest
        .spyOn(authClient, 'send')
        .mockImplementationOnce(() => of({ id: '1', ...createUserDto }));

      await service.register(createUserDto);

      expect(authClient.send).toHaveBeenCalledWith(
        { cmd: 'register_user' },
        createUserDto,
      );
    });
  });

  describe('login', () => {
    it('should return access token and user data', async () => {
      const user = {
        _id: '1',
        email: 'test@example.com',
        name: 'Test User',
      };

      const result = await service.login(user);

      expect(result).toEqual({
        access_token: 'test-token',
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        },
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: '1',
        email: 'test@example.com',
        name: 'Test User',
      });
    });
  });
});
