import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  // Use the built-in NestJS logger initially
  const logger = new Logger('Gateway');

  try {
    const app = await NestFactory.create(AppModule);

    // Apply global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );

    // Set up Swagger documentation
    const config = new DocumentBuilder()
      .setTitle('Gateway API')
      .setDescription('The Gateway API description')
      .setVersion('1.0')
      .addTag('auth')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    await app.listen(3000);
    logger.log(`Gateway application is running on: ${await app.getUrl()}`);
  } catch (error) {
    logger.error(
      `Error starting Gateway application: ${error.message}`,
      error.stack,
    );
    process.exit(1);
  }
}
bootstrap();
