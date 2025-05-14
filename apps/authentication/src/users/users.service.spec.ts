import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let userModel: any;

  const mockUserModel = {
    new: jest.fn().mockResolvedValue({}),
    constructor: jest.fn().mockResolvedValue({}),
    find: jest.fn(),
    findOne: jest.fn(),
    exec: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userModel = module.get(getModelToken(User.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should hash password and create a new user', async () => {
      const createUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const hashedPassword = 'hashed-password';

      jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce(hashedPassword as never);

      const saveSpy = jest.fn().mockResolvedValueOnce({
        _id: '1',
        ...createUserDto,
        password: hashedPassword,
      });

      userModel.new = jest.fn().mockImplementationOnce(() => ({
        save: saveSpy,
      }));

      const result = await service.create(createUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(result).toEqual({
        _id: '1',
        ...createUserDto,
        password: hashedPassword,
      });
    });
  });

  describe('validateUser', () => {
    it('should return null if user not found', async () => {
      jest.spyOn(service, 'findByEmail').mockResolvedValueOnce(null);

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      const user = {
        _id: '1',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
      };

      jest.spyOn(service, 'findByEmail').mockResolvedValueOnce(user as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false as never);

      const result = await service.validateUser(
        'test@example.com',
        'wrong-password',
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrong-password',
        'hashed-password',
      );
      expect(result).toBeNull();
    });

    it('should return user if credentials are valid', async () => {
      const user = {
        _id: '1',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
      };

      jest.spyOn(service, 'findByEmail').mockResolvedValueOnce(user as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true as never);

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashed-password',
      );
      expect(result).toEqual(user);
    });
  });
});
