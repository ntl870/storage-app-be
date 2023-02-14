import { FoldersModule } from '@modules/folders/folders.module';
import { UserModule } from '@modules/user/user.module';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';

@Module({
  imports: [PassportModule, UserModule, FoldersModule],
  providers: [AuthService, JwtService, AuthResolver],
})
export class AuthModule {}
