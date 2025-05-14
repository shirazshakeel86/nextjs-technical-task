import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(LocalStrategy.name);

  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string) {
    try {
      const user = await this.authService.validateUser(email, password);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
      return user;
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`);

      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException(error.message);
      }

      throw new UnauthorizedException('Authentication failed');
    }
  }
}
