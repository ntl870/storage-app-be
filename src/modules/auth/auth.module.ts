import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserService } from '../user/user.service';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';

@Module({
  imports: [AuthModule, PassportModule],
  providers: [AuthService, JwtService, UserService, AuthResolver],
})
export class AuthModule {}
