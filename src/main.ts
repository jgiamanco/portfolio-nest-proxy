import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('Starting server...');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Port:', process.env.PORT);

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
  const routes = router.stack
    .filter((layer) => layer.route)
    .map((layer) => ({
      path: layer.route?.path,
      method: layer.route?.stack[0].method,
    }));
  console.log('Routes:', JSON.stringify(routes, null, 2));

  // Log the full URL where the server is running
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : `http://localhost:${port}`;
  console.log(`Server is accessible at: ${baseUrl}`);
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
