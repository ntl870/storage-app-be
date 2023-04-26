import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Package } from './entities/package.entity';
import { getRepository } from '@db/db';
import { packagesData } from './seeder/packages-data';

@Injectable()
export class PackagesService {
  public packageRepository: Repository<Package>;
  constructor() {
    this.packageRepository = getRepository(Package);
  }

  async bulkCreate() {
    await this.packageRepository.delete({});
    await this.packageRepository.save(packagesData);
    const packages = await this.packageRepository.find();
    console.log(packages);
    return 'ok';
  }

  async getPackageByID(ID: number) {
    return await this.packageRepository.findOne({ where: { ID } });
  }

  async findAll() {
    return await this.packageRepository.find();
  }
}
