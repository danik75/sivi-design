import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.use(require('express').json({ limit: '20mb' }));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  const port = parseInt(process.env.PORT || '3000', 10);
  // bind to 0.0.0.0 to ensure local and LAN access during development
  await app.listen(port, '0.0.0.0');
}
bootstrap();
