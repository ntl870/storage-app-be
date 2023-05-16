import { Module } from '@nestjs/common';
import { ComputersService } from './computers.service';
import { ComputersResolver } from './computers.resolver';
import { UserModule } from '@modules/user/user.module';

@Module({
  imports: [UserModule],
  providers: [ComputersService, ComputersResolver],
})
export class ComputersModule {}
