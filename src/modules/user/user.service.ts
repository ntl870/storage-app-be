import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { DB } from 'src/db/db';
import { In, Like, Repository } from 'typeorm';
import { NewUserInput } from '../auth/auth.types';
import { User } from './user.entity';
import { getFolderSize, hashPassword } from 'src/utils/tools';
import { FoldersService } from '@modules/folders/folders.service';
import * as fs from 'fs';
import {
  StatisticPackage,
  UpdateUserPayload,
  UserSearchPaginationResponse,
} from './user.type';
import { PackagesService } from '@modules/packages/packages.service';

@Injectable()
export class UserService {
  public userRepository: Repository<User>;

  constructor(
    @Inject(forwardRef(() => FoldersService))
    private readonly folderService: FoldersService,
    @Inject(forwardRef(() => PackagesService))
    private readonly packageService: PackagesService,
  ) {
    this.userRepository = DB.getInstance().getRepository(User);
  }

  async create(
    input: NewUserInput & { stripeCustomerID: string },
  ): Promise<User> {
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
    const pkg = await this.packageService.packageRepository.findOne({
      where: {
        ID: 1,
      },
    });
    newUser.currentPackage = pkg;
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
      relations: ['rootFolder', 'currentPackage'],
    });
    return user;
  }

  async getUserByStripeCustomerID(stripeCustomerID: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        stripeCustomerID: stripeCustomerID,
      },
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
      skip: (page - 1) * limit,
      take: limit,
      relations: ['currentPackage'],
    });

    const hasMore = (page + 1) * limit < total;

    return { results: users, hasMore, total };
  }

  async getUsersPagination(
    page: number,
    limit: number,
  ): Promise<UserSearchPaginationResponse> {
    const [users, total] = await this.userRepository.findAndCount({
      skip: page === 1 ? 0 : page * limit,
      take: limit,
    });
    const hasMore = (page + 1) * limit < total;
    return { results: users, hasMore, total };
  }

  async updateUserUsedStorage(userID: string) {
    const user = await this.getOneByID(userID);
    const rootFolder = await this.folderService.getFolderByID(
      user.rootFolder.ID,
    );
    const storageUsed = getFolderSize(rootFolder.path);
    user.storageUsed = storageUsed;
    await this.save(user);
  }

  async updateUserProfile(userID: string, input: UpdateUserPayload) {
    const user = await this.getOneByID(userID);
    user.name = input.name;
    user.avatar = input.avatar;
    return await this.save(user);
  }

  async getStatisticPackages(): Promise<StatisticPackage[]> {
    // group by currentPackage
    const grouped = await this.userRepository
      .createQueryBuilder('user')
      .select('user.currentPackage')
      .addSelect('CAST(COUNT(user.currentPackage) AS INTEGER) as total')
      .innerJoinAndSelect('user.currentPackage', 'packages')
      .groupBy('packages.name, packages.ID, user.currentPackage')
      .orderBy('packages.ID', 'ASC')
      .getRawMany();
    return grouped;
  }
}
