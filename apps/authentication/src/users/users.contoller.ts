import { Controller, UsePipes, ValidationPipe, Logger } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { CreateUserDto } from '@app/common';

@Controller()
@UsePipes(new ValidationPipe())
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @MessagePattern('register_user')
  async register(@Payload() createUserDto: CreateUserDto) {
    try {
      this.logger.log(`Registering user with email: ${createUserDto.email}`);
      return await this.usersService.create(createUserDto);
    } catch (error) {
      this.logger.error(
        `Error registering user: ${error.message}`,
        error.stack,
      );
      throw new RpcException(
        error.message || 'An error occurred during registration',
      );
    }
  }

  @MessagePattern({ cmd: 'get_users' })
  async getUsers() {
    try {
      this.logger.log('Getting all users');
      return await this.usersService.findAll();
    } catch (error) {
      this.logger.error(`Error getting users: ${error.message}`, error.stack);
      throw new RpcException(
        error.message || 'An error occurred while retrieving users',
      );
    }
  }

  @MessagePattern({ cmd: 'validate_user' })
  async validateUser(@Payload() payload: { email: string; password: string }) {
    try {
      this.logger.log(`Validating user with email: ${payload.email}`);
      return await this.usersService.validateUser(
        payload.email,
        payload.password,
      );
    } catch (error) {
      this.logger.error(`Error validating user: ${error.message}`, error.stack);
      throw new RpcException(
        error.message || 'An error occurred during user validation',
      );
    }
  }
}
