import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class MongooseHealthIndicator extends HealthIndicator {
  constructor(@InjectConnection() private readonly connection: Connection) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      if (this.connection.readyState === 1) {
        return this.getStatus(key, true);
      }
      throw new Error('Mongoose connection is not established');
    } catch (error) {
      throw new HealthCheckError(
        'MongooseHealthCheck failed',
        this.getStatus(key, false, { message: error.message }),
      );
    }
  }
}
