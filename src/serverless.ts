import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { configure as serverlessExpress } from '@vendia/serverless-express';
import { Callback } from 'aws-lambda';
import { Handler } from 'express';
import 'reflect-metadata';
import { DB } from './db/db';
import { AppModule } from './modules/app/app.module';
ConfigModule.forRoot();

let server: Handler;

async function bootstrap(): Promise<any> {
  const app = await NestFactory.create(AppModule);
  await app.init();

  DB.getInstance();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

export const handler: any = async (
  event: any,
  context: any,
  callback: Callback,
) => {
  server = server ?? (await bootstrap());
  return server(event, context, callback);
};
