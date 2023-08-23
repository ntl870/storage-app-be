import 'reflect-metadata';
import { ConfigModule } from '@nestjs/config';
ConfigModule.forRoot();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';
import { DB } from './db/db';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, { cors: true });
    DB.getInstance();

    await app.listen(8000);
  } catch (err) {
    throw new Error(err);
  }
}

bootstrap();
