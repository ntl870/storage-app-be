import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { getRepository } from 'src/db/db';
import { In, Like, Repository } from 'typeorm';
import { NewUserInput } from '../auth/auth.types';
import { User } from './user.entity';
import { hashPassword } from 'src/utils/tools';
import { FoldersService } from '@modules/folders/folders.service';
import * as fs from 'fs';
import { UserSearchPaginationResponse } from './user.type';
import { Folder } from '@modules/folders/folders.entity';
@Injectable()
export class UserService {
  userRepository: Repository<User>;

  constructor(
    @Inject(forwardRef(() => FoldersService))
    private readonly folderService: FoldersService,
  ) {
    this.userRepository = getRepository(User);
  }

  async create(input: NewUserInput): Promise<User> {
    const newUser = await this.userRepository.save({
      ...input,
      password: hashPassword(input.password),
    });

    const rootFolder = await this.folderService.createFolder(newUser.ID, {
      rootFolderID: null,
      name: `${newUser.ID}-root`,
    });

    const dir = `${process.cwd()}/files/${rootFolder.ID}`;
    fs.mkdirSync(dir, {
      recursive: true,
    });
    newUser.rootFolder = rootFolder;

    return await this.userRepository.save(newUser);
  }

  async save(user: User): Promise<User> {
    return await this.userRepository.save(user);
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

  async getManyByArrayOfIDs(folderIDs: string[]): Promise<User[]> {
    return await this.userRepository.findBy({ ID: In(folderIDs) });
  }

  async getUsersBySearchPagination(
    search: string,
    page: number,
    limit: number,
  ): Promise<UserSearchPaginationResponse> {
    const [users, total] = await this.userRepository.findAndCount({
      where: [{ email: Like(`%${search}%`) }, { name: Like(`%${search}%`) }],
      skip: page === 1 ? 0 : page * limit,
      take: limit,
    });
    const hasMore = (page + 1) * limit < total;

    return { results: users, hasMore };
  }
}
