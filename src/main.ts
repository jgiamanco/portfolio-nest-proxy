import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'debug', 'log', 'verbose'],
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Enable CORS with updated origins
  app.enableCors({
    origin: [
      'http://localhost:8080', // Frontend development
      'http://localhost:3001', // Backend development
      'https://jacobgiamanco.vercel.app', // Frontend production
      'https://portfolio-nest-proxy.vercel.app', // Backend production
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'Origin',
      'X-Requested-With',
    ],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    credentials: false,
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400, // 24 hours
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(
    `OpenAI endpoint should be available at: http://localhost:${port}/api/chatbot/message`,
  );
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
