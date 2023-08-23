import { User } from 'src/modules/user/user.entity';
import {
  DataSource,
  Repository,
  QueryRunner,
  DataSourceOptions,
} from 'typeorm';
import { getEnvVar } from '@utils/tools';
import { EnvVar } from 'src/types';
import { Folder } from '@modules/folders/folders.entity';
import { File } from '@modules/files/files.entity';
import { Package } from '@modules/packages/entities/package.entity';
import { Computer } from '@modules/computers/computers.entity';
import { Transaction } from '../modules/transactions/entities/transaction.entity';

export class DB {
  private static instance: DB;
  private appDataSource!: DataSource;
  private connectionOptions: DataSourceOptions = {
    type: 'postgres',
    host: getEnvVar(EnvVar.DB_HOST),
    port: Number(getEnvVar(EnvVar.DB_PORT)),
    username: getEnvVar(EnvVar.DB_USER_NAME),
    password: getEnvVar(EnvVar.DB_PASSWORD),
    database: getEnvVar(EnvVar.DB_NAME),
    migrations: ['dist/migrations/**/*.js'],
    synchronize: true,
    logging: false,
    entities: [User, Folder, File, Package, Computer, Transaction],
    ssl: {
      rejectUnauthorized: false,
    },
    subscribers: [],
  };

  private constructor() {
    this.initializeConnection();
  }

  private async initializeConnection() {
    try {
      this.appDataSource = new DataSource(this.connectionOptions);
      await this.appDataSource.initialize();

      console.log('Connected to PostgreSQL successfully');
    } catch (err) {
      throw new Error(err);
    }
  }

  static getInstance(): DB {
    if (!DB.instance) {
      DB.instance = new DB();
    }

    return DB.instance;
  }

  getRepository<T>(entity: any): Repository<T> {
    return this.appDataSource.getRepository<T>(entity);
  }

  createQueryRunner(): QueryRunner {
    return this.appDataSource.createQueryRunner();
  }
}
