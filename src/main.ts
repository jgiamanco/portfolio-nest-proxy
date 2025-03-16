import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  await app.listen(process.env.PORT || 3001); // Updated default port to match development setup
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
