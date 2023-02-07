import { User } from 'src/modules/user/user.entity';
import { DataSource } from 'typeorm';
import { getEnvVar } from '@utils/tools';
import { EnvVar } from 'src/types';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: getEnvVar(EnvVar.DB_HOST),
  port: Number(getEnvVar(EnvVar.DB_PORT)),
  username: getEnvVar(EnvVar.DB_USER_NAME),
  password: getEnvVar(EnvVar.DB_PASSWORD),
  database: getEnvVar(EnvVar.DB_NAME),
  synchronize: true,
  logging: true,
  entities: [User],
  subscribers: [],
  migrations: [],
});

export const getRepository = <T>(entity: any) => {
  return AppDataSource.getRepository<T>(entity);
};

export const connectToDb = async () => {
  try {
    await AppDataSource.initialize();
    console.log('connect to postgresql successfully');
  } catch (err) {
    throw new Error(err);
  }
};
