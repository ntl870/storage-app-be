import { CurrentUser } from '@decorators/CurrentUser';
import { JwtAuthGuard } from '@modules/auth/guards/jwt.guard';
import { User } from '@modules/user/user.entity';
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Folder } from './folders.entity';
import { FoldersService } from './folders.service';
import { NewFolderInput, UploadFolderInput } from './folders.types';

@Resolver()
export class FoldersResolver {
  constructor(private readonly folderService: FoldersService) {}

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Folder)
  async createFolder(
    @CurrentUser() user: User,
    @Args('input') input: NewFolderInput,
  ): Promise<Folder> {
    return await this.folderService.createFolder(user.ID, input);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => String)
  async uploadFolder(
    @CurrentUser() user: User,
    @Args('input', { type: () => UploadFolderInput }) input: UploadFolderInput,
  ) {
    return await this.folderService.uploadFolder(user.ID, input);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => String)
  async moveFolderToTrash(@Args('folderID') folderID: string) {
    return await this.folderService.moveFolderToTrash(folderID);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [Folder])
  async getUserTrashFolder(@CurrentUser() user: User) {
    return await this.folderService.getTrashFolder(user.ID);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => String)
  async moveFolderOutOfTrash(@Args('folderID') folderID: string) {
    return await this.folderService.moveFolderOutOfTrash(folderID);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => String)
  async deleteFolder(@Args('folderID') folderID: string) {
    return await this.folderService.deleteFolderForever(folderID);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [Folder])
  getArrayOfRootFoldersName(@Args('folderID') folderID: string) {
    return this.folderService.getArrayOfRootFoldersName(folderID);
  }
}
