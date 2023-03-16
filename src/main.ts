import 'reflect-metadata';
import { ConfigModule } from '@nestjs/config';
ConfigModule.forRoot();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';
import { graphqlUploadExpress } from 'graphql-upload';
import { connectToDb } from './db/db';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, { cors: true });
    await connectToDb();

    // initialize graphql-upload middleware
    app.use(
      graphqlUploadExpress({ maxFileSize: 100000000000000, maxFiles: 10000 }),
    );

    await app.listen(8000);
  } catch (err) {
    throw new Error(err);
  }
}

bootstrap();
