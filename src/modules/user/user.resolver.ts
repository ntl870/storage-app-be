import { File } from '@modules/files/files.entity';
import { FilesService } from '@modules/files/files.service';
import { Folder } from '@modules/folders/folders.entity';
import { FoldersService } from '@modules/folders/folders.service';
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from 'src/decorators/CurrentUser';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { User } from './user.entity';
import { UserService } from './user.service';
import { StatisticPackage, UpdateUserPayload, UserSearchPaginationResponse } from './user.type';

@Resolver(() => User)
export class UserResolver {
  constructor(
    private readonly userService: UserService,
    private readonly folderService: FoldersService,
    private readonly fileService: FilesService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Query(() => User)
  getMe(@CurrentUser() user: User) {
    return this.userService.getOneByID(user.ID);
  }

  @Query(() => [User])
  getAllUsers() {
    return this.userService.getAllUsers();
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => User)
  getUserByID(@Args('ID') ID: string) {
    return this.userService.getOneByID(ID);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [Folder])
  async getFoldersOfFolder(
    @CurrentUser() user: User,
    @Args('folderID') folderID: string,
  ) {
    return await this.folderService.getFoldersOfFolder(user.ID, folderID);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [File])
  async getUserFiles(@CurrentUser() user: User) {
    return await this.fileService.getUserFiles(user.ID);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => UserSearchPaginationResponse)
  async getUsersBySearchPagination(
    @Args('search') search: string,
    @Args('page') page: number,
    @Args('limit') limit: number,
  ) {
    return await this.userService.getUsersBySearchPagination(
      search,
      page,
      limit,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => UserSearchPaginationResponse)
  async getUsersPagination(
    @Args('page') page: number,
    @Args('limit') limit: number,
  ) {
    return await this.userService.getUsersPagination(page, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => User)
  async updateUser(
    @CurrentUser() user: User,
    @Args('input') input: UpdateUserPayload,
  ) {
    return await this.userService.updateUserProfile(user.ID, input);
  }

  @Query(() => [StatisticPackage])
  async getStatisticPackages() {
    return this.userService.getStatisticPackages();
  }
}
