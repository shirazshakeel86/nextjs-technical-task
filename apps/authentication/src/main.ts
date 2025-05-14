import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  // Use the built-in NestJS logger initially
  const logger = new Logger('Authentication');

  try {
    // Create a hybrid application (HTTP + Microservice)
    const app = await NestFactory.create(AppModule);

    // Apply global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );

    // Connect microservice
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: 3001,
      },
    });

    // Start microservice
    await app.startAllMicroservices();
    logger.log('Authentication microservice is listening on port 3001');

    // Also start HTTP server for health checks
    await app.listen(3001);
    logger.log(
      `Authentication HTTP server is running on: ${await app.getUrl()}`,
    );
  } catch (error) {
    logger.error(
      `Error starting Authentication application: ${error.message}`,
      error.stack,
    );
    process.exit(1);
  }
}
bootstrap();
