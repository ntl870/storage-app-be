import { Module } from '@nestjs/common';
import { PackagesResolver } from './packages.resolver';
import { PackagesService } from './packages.service';

@Module({
  imports: [],
  providers: [PackagesResolver, PackagesService],
  exports: [PackagesService],
})
export class PackagesModule {}
