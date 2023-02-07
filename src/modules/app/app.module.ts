import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppService } from './app.service';
import { AuthModule } from '../auth/auth.module';
import { AuthService } from '../auth/auth.service';
import { JwtStrategy } from '../auth/strategies/jwt-auth.strategy';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';
import { FilesModule } from '../files/files.module';
import { getEnvVar } from '../../utils/tools';
import { EnvVar } from 'src/types';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      typePaths: ['./**/*.graphql'],
      driver: ApolloDriver,
      autoSchemaFile: 'schema.graphql',
    }),
    JwtModule.register({
      secret: getEnvVar(EnvVar.JWT_SECRET),
      signOptions: { expiresIn: '1d' },
    }),
    AuthModule,
    UserModule,
    PassportModule,
    FilesModule,
    ConfigModule,
  ],
  controllers: [],
  providers: [AppService, JwtService, JwtStrategy, UserService, AuthService],
})
export class AppModule {}
