import { Mutation, Query, Resolver } from '@nestjs/graphql';
import { PackagesService } from './packages.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/guards/jwt.guard';
import { Package } from './entities/package.entity';

@Resolver()
export class PackagesResolver {
  constructor(private readonly packagesService: PackagesService) {}

  @UseGuards(JwtAuthGuard)
  @Mutation(() => String)
  async bulkCreatePackages() {
    return await this.packagesService.bulkCreate();
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [Package])
  async getAllPackages() {
    return await this.packagesService.findAll();
  }
}
