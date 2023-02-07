import { Injectable } from '@nestjs/common';
import { getRepository } from 'src/db/db';
import { Repository } from 'typeorm';
import { NewUserInput } from '../auth/auth.types';
import { User } from './user.entity';
import { hashPassword } from 'src/utils/tools';

@Injectable()
export class UserService {
  userRepository: Repository<User>;

  constructor() {
    this.userRepository = getRepository(User);
  }

  async create(input: NewUserInput): Promise<User> {
    const newUser = await this.userRepository.save({
      ...input,
      password: hashPassword(input.password),
    });
    return newUser;
  }

  async getOne(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        email: email,
      },
    });
    return user;
  }

  async getOneByID(ID: string): Promise<User> {
    const user = await this.userRepository.findOneBy({
      ID,
    });
    return user;
  }
}
