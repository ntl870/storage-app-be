import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module, forwardRef } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppService } from './app.service';
import { AuthModule } from '../auth/auth.module';
import { JwtStrategy } from '../auth/strategies/jwt-auth.strategy';
import { UserModule } from '../user/user.module';
import { FilesModule } from '../files/files.module';
import { getEnvVar } from '../../utils/tools';
import { EnvVar } from 'src/types';
import { ConfigModule } from '@nestjs/config';
import { FoldersModule } from '@modules/folders/folders.module';
import { StripeProviderModule } from '@modules/shared/stripe-provider/stripe-provider.module';
import { StripePaymentModule } from '@modules/stripe-payment/stripe-payment.module';
import { PackagesModule } from '@modules/packages/packages.module';
import { TransactionsModule } from '@modules/transactions/transactions.module';
import { ComputersModule } from '@modules/computers/computers.module';

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
    forwardRef(() => AuthModule),
    UserModule,
    PassportModule,
    FilesModule,
    ConfigModule,
    FoldersModule,
    StripeProviderModule,
    StripePaymentModule,
    PackagesModule,
    TransactionsModule,
    ComputersModule,
  ],
  controllers: [],
  providers: [AppService, JwtService, JwtStrategy],
})
export class AppModule {}
