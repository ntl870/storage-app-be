import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Computer } from './computers.entity';
import { getRepository } from '@db/db';

@Injectable()
export class ComputersService {
  computerRepository: Repository<Computer>;

  constructor() {
    this.computerRepository = getRepository(Computer);
  }

  async createComputer(computer: Computer): Promise<Computer> {
    return await this.computerRepository.save(computer);
  }

  async getComputerByMacAddress(macAddress: string): Promise<Computer> {
    return await this.computerRepository.findOne({
      where: {
        macAddress,
      },
    });
  }
}
