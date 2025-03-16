import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'https://jacobgiamanco.vercel.app'],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  await app.listen(process.env.PORT || 3000);
}

if (require.main === module) {
  bootstrap().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export default bootstrap;
