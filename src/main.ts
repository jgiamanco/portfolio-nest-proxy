import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('Starting server...');
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

  // Add global prefix for all routes
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Server is running on port ${port}`);
  console.log('Available routes:');
  const server = app.getHttpServer();
  const router = server._events.request._router;
  console.log(
    router.stack
      .filter((layer) => layer.route)
      .map((layer) => ({
        path: layer.route?.path,
        method: layer.route?.stack[0].method,
      })),
  );
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
