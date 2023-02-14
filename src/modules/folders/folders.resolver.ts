import { CurrentUser } from '@decorators/CurrentUser';
import { JwtAuthGuard } from '@modules/auth/guards/jwt.guard';
import { User } from '@modules/user/user.entity';
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Folder } from './folders.entity';
import { FoldersService } from './folders.service';
import { NewFolderInput, UploadFolderInput } from './folders.types';
import { GraphQLUpload, Upload } from 'graphql-upload';
import { File } from '@modules/files/files.entity';

@Resolver()
export class FoldersResolver {
  constructor(private readonly folderService: FoldersService) {}

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Folder)
  async createFolder(
    @CurrentUser() user: User,
    @Args('input') input: NewFolderInput,
  ): Promise<Folder> {
    return await this.folderService.createFolder(Number(user.ID), input);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => [File])
  async uploadFolder(
    @CurrentUser() user: User,
    @Args('folder', { type: () => [GraphQLUpload] }) input: UploadFolderInput,
  ) {
    return await this.folderService.uploadFolder(Number(user.ID), input);
  }
}
