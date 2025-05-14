import {
  Inject,
  Injectable,
  UnauthorizedException,
  Logger,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateUserDto } from '@app/common';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject('AUTHENTICATION_SERVICE')
    private readonly authClient: ClientProxy,
    private readonly jwtService: JwtService,
  ) {}

  async onModuleInit() {
    try {
      await this.authClient.connect();
      this.logger.log('Successfully connected to Authentication microservice');
    } catch (error) {
      this.logger.error(
        `Failed to connect to Authentication microservice: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async register(createUserDto: CreateUserDto) {
    try {
      return await firstValueFrom(
        this.authClient.send({ cmd: 'register_user' }, createUserDto).pipe(
          timeout(5000), // 5 second timeout
          catchError((error) => {
            this.logger.error(
              `Error in register microservice call: ${error.message}`,
              error.stack,
            );

            // Handle specific error types based on the RPC response
            if (
              error.message &&
              error.message.includes('Email is already registered')
            ) {
              throw new ConflictException('Email is already registered');
            }

            throw new InternalServerErrorException(
              error.message || 'User already registered',
            );
          }),
        ),
      );
    } catch (error) {
      // If it's already a HTTP exception, just rethrow it
      if (error.status) {
        throw error;
      }

      this.logger.error(`Registration error: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Registration failed');
    }
  }

  async getUsers() {
    try {
      const result = await firstValueFrom(
        this.authClient.send({ cmd: 'get_users' }, {}).pipe(
          timeout(5000), // 5 second timeout
          catchError((error) => {
            this.logger.error(
              `Error in getUsers microservice call: ${error.message}`,
              error.stack,
            );
            throw error;
          }),
        ),
      );

      return result;
    } catch (error) {
      this.logger.error(`Get users error: ${error.message}`, error.stack);
      throw error;
    }
  }

  async validateUser(email: string, password: string) {
    try {
      const user = await firstValueFrom(
        this.authClient
          .send({ cmd: 'validate_user' }, { email, password })
          .pipe(
            timeout(5000), // 5 second timeout
            catchError((error) => {
              this.logger.error(
                `Error in validateUser microservice call: ${error.message}`,
                error.stack,
              );

              // Handle specific error types based on the RPC response
              if (
                error.message &&
                error.message.includes('Email not registered')
              ) {
                throw new NotFoundException('Email not registered');
              }

              if (
                error.message &&
                error.message.includes('Password is invalid')
              ) {
                throw new UnauthorizedException('Password is invalid');
              }

              throw error;
            }),
          ),
      );

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      return user;
    } catch (error) {
      // If it's already a HTTP exception, just rethrow it
      if (error.status) {
        throw error;
      }

      this.logger.error(`Validate user error: ${error.message}`, error.stack);
      throw new UnauthorizedException(
        'An error occurred during authentication',
      );
    }
  }

  async login(user: any) {
    try {
      const payload = {
        sub: user._id,
        email: user.email,
        name: user.name,
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
      };
    } catch (error) {
      this.logger.error(`Login error: ${error.message}`, error.stack);
      throw error;
    }
  }
}
