import {
  Injectable,
  type LoggerService as NestLoggerService,
  Logger,
} from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;
  private nestLogger = new Logger('AppLogger');

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      defaultMeta: { service: 'nest-monorepo' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.printf(
              ({ timestamp, level, message, context, ...meta }) => {
                return `${timestamp} [${context || 'Application'}] ${level}: ${message} ${
                  Object.keys(meta).length ? JSON.stringify(meta) : ''
                }`;
              },
            ),
          ),
        }),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
    this.nestLogger.log(message, context);
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
    this.nestLogger.error(message, trace, context);
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
    this.nestLogger.warn(message, context);
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
    this.nestLogger.debug(message, context);
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
    this.nestLogger.verbose(message, context);
  }
}
