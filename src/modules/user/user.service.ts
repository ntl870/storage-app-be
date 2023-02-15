import { Injectable } from '@nestjs/common';
import { getRepository } from 'src/db/db';
import { Repository } from 'typeorm';
import { NewUserInput } from '../auth/auth.types';
import { User } from './user.entity';
import { hashPassword } from 'src/utils/tools';
import { FoldersService } from '@modules/folders/folders.service';
import * as fs from 'fs';
@Injectable()
export class UserService {
  userRepository: Repository<User>;

  constructor(private readonly folderService: FoldersService) {
    this.userRepository = getRepository(User);
  }

  async create(input: NewUserInput): Promise<User> {
    const newUser = await this.userRepository.save({
      ...input,
      password: hashPassword(input.password),
    });

    const rootFolder = await this.folderService.createFolder(
      Number(newUser.ID),
      {
        rootFolderID: null,
        name: `${newUser.ID}-root`,
      },
    );

    const dir = `${process.cwd()}/files/${rootFolder.ID}`;
    fs.mkdirSync(dir, {
      recursive: true,
    });
    newUser.rootFolder = rootFolder;

    return await this.userRepository.save(newUser);
  }

  async getOne(email: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        email: email,
      },
    });
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    const users = await this.userRepository.find();
    return users;
  }

  async getOneByID(userID: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        ID: userID,
      },
      relations: ['rootFolder'],
    });
    return user;
  }
}
