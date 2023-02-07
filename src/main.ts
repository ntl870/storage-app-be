import 'reflect-metadata';
import { ConfigModule } from '@nestjs/config';
ConfigModule.forRoot();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';
import { graphqlUploadExpress } from 'graphql-upload';
import { connectToDb } from './db/db';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    await connectToDb();

    // initialize graphql-upload middleware
    app.use(graphqlUploadExpress());

    await app.listen(3000);
  } catch (err) {
    throw new Error(err);
  }
}

bootstrap();
