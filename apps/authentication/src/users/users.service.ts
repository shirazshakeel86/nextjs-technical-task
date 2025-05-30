import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { CreateUserDto } from '@app/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      // Check if user with this email already exists
      const existingUser = await this.findByEmail(createUserDto.email);
      if (existingUser) {
        this.logger.warn(
          `Attempted to register with existing email: ${createUserDto.email}`,
        );

        throw new ConflictException(`Email is already registered`);
      }
      // Hash the password
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      // Create and save the new user
      const createdUser = new this.userModel({
        ...createUserDto,
        password: hashedPassword,
      });

      return await createdUser.save();
    } catch (error) {
      // Handle MongoDB duplicate key error
      if (error.code === 11000) {
        this.logger.warn(
          `Attempted to create duplicate user: ${createUserDto.email}`,
        );
        throw new ConflictException(`Email is already registered`);
      }

      // Log other errors
      this.logger.error(`Error creating user: ${error.message}`, error.stack);

      // Re-throw the error if it's already a NestJS exception
      if (error.status) {
        throw error;
      }

      // Otherwise, throw a generic error
      throw new InternalServerErrorException(
        'An error occurred while creating the user',
      );
    }
  }

  async findAll(): Promise<User[] | { message: string }> {
    try {
      const users = await this.userModel.find().exec();

      if (users.length === 0) {
        return { message: 'No users found' };
      }

      return users;
    } catch (error) {
      this.logger.error(
        `Error finding all users: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'An error occurred while retrieving users',
      );
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.userModel.findOne({ email }).exec();
    } catch (error) {
      this.logger.error(
        `Error finding user by email: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'An error occurred while finding the user',
      );
    }
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.findByEmail(email);

      if (!user) {
        this.logger.warn(`Login attempt with non-existent email: ${email}`);
        throw new NotFoundException('Email not registered');
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        this.logger.warn(`Invalid password attempt for email: ${email}`);
        throw new UnauthorizedException('Password is invalid');
      }

      return user;
    } catch (error) {
      if (error.status) {
        throw error;
      }
      this.logger.error(`Error validating user: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'An error occurred while validating the user',
      );
    }
  }
}
