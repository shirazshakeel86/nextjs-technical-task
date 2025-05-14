import {
  Inject,
  Injectable,
  UnauthorizedException,
  Logger,
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
            throw error;
          }),
        ),
      );
    } catch (error) {
      this.logger.error(`Registration error: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getUsers() {
    try {
      return await firstValueFrom(
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
              throw error;
            }),
          ),
      );

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      return user;
    } catch (error) {
      this.logger.error(`Validate user error: ${error.message}`, error.stack);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
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
