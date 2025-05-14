import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginDto } from '@app/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
  })
  async register(@Body() createUserDto: CreateUserDto): Promise<any> {
    try {
      return await this.authService.register(createUserDto);
    } catch (error) {
      this.logger.error(`Registration error: ${error.message}`, error.stack);

      // If it's already a HttpException, rethrow it
      if (error instanceof HttpException) {
        throw error;
      }

      // Check if it's a conflict error from the microservice
      if (error.message && error.message.includes('already exists')) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }

      // Otherwise, throw a generic error
      throw new HttpException(
        'An error occurred during registration',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Request() req, @Body() loginDto: LoginDto) {
    try {
      return await this.authService.login(req.user);
    } catch (error) {
      this.logger.error(`Login error: ${error.message}`, error.stack);
      throw new HttpException(
        'An error occurred during login',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Return user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@Request() req) {
    return req.user;
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Return all users' })
  async getUsers() {
    try {
      return await this.authService.getUsers();
    } catch (error) {
      this.logger.error(`Get users error: ${error.message}`, error.stack);
      throw new HttpException(
        'An error occurred while retrieving users',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
