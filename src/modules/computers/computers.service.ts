import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Computer } from './computers.entity';
import { DB } from '@db/db';
import { ConnectComputerInput } from './computers.type';
import { UserService } from '@modules/user/user.service';

@Injectable()
export class ComputersService {
  computerRepository: Repository<Computer>;

  constructor(private readonly userService: UserService) {
    this.computerRepository = DB.getInstance().getRepository(Computer);
  }

  async createComputer(computer: Computer): Promise<Computer> {
    return await this.computerRepository.save(computer);
  }

  async connectComputer(
    userID: string,
    input: ConnectComputerInput,
  ): Promise<Computer> {
    const computer = new Computer();

    computer.macAddress = input.macAddress;
    computer.hostname = input.hostname;
    computer.storagePath = input.storagePath;
    computer.name = input.name;
    const user = await this.userService.getOneByID(userID);
    computer.user = user;

    return await this.createComputer(computer);
  }

  async getUserComputers(userID) {
    return await this.computerRepository.find({
      where: {
        user: {
          ID: userID,
        },
      },
    });
  }

  async getComputerByMacAddress(
    userID: string,
    macAddress: string,
  ): Promise<Computer> {
    return await this.computerRepository.findOne({
      where: {
        macAddress,
        user: {
          ID: userID,
        },
      },
    });
  }

  async removeComputer(userID: string, macAddress: string): Promise<string> {
    await this.computerRepository.delete({
      user: {
        ID: userID,
      },
      macAddress,
    });
    return 'Computer removed successfully';
  }

  async updateComputerStoragePath(
    userID: string,
    macAddress: string,
    storagePath: string,
  ): Promise<Computer> {
    const computer = await this.computerRepository.findOne({
      where: {
        user: {
          ID: userID,
        },
        macAddress,
      },
    });
    computer.storagePath = storagePath;
    return await this.computerRepository.save(computer);
  }
}
