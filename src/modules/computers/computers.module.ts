import { forwardRef, Module } from '@nestjs/common';
import { ComputersService } from './computers.service';
import { ComputersResolver } from './computers.resolver';
import { UserModule } from '@modules/user/user.module';

@Module({
  imports: [
    forwardRef(() => UserModule),
  ],
  providers: [ComputersService, ComputersResolver],
  exports: [ComputersService],
})
export class ComputersModule {}
