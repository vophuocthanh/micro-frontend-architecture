import 'reflect-metadata';

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AppConfig } from './config/app.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(AppConfig);

  app.use(helmet());
  app.use(cookieParser());

  // `credentials: true` is what lets the refresh cookie travel; it is only safe
  // together with an explicit origin allowlist, because a wildcard origin plus
  // credentials would let any site on the internet drive an authenticated
  // request on the user's behalf.
  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Application-Id'],
    exposedHeaders: ['X-Request-Id'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      // Unknown properties are stripped and then rejected: a client cannot
      // smuggle `role: 'ADMIN'` into a body and hope some layer reads it.
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.enableShutdownHooks();

  await app.listen(config.port);
  new Logger('Bootstrap').log(`API listening on http://localhost:${config.port} [${config.nodeEnv}]`);
}

void bootstrap();
