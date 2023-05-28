import 'reflect-metadata';
import { ConfigModule } from '@nestjs/config';
ConfigModule.forRoot();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';
import { connectToDb } from './db/db';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, { cors: true });
    await connectToDb();

    await app.listen(8000);
  } catch (err) {
    throw new Error(err);
  }
}

bootstrap();
