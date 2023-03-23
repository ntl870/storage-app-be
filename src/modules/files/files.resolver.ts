import { CurrentUser } from '@decorators/CurrentUser';
import { JwtAuthGuard } from '@modules/auth/guards/jwt.guard';
import { FoldersService } from '@modules/folders/folders.service';
import { User } from '@modules/user/user.entity';
import { UseGuards } from '@nestjs/common';
import { Resolver, Args, Mutation, Query } from '@nestjs/graphql';
import { GraphQLUpload, Upload } from 'graphql-upload';
import { File } from './files.entity';
import { FilesService } from './files.service';
@Resolver()
export class FilesResolver {
  constructor(
    private readonly filesService: FilesService,
    private readonly folderService: FoldersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Mutation(() => File)
  async uploadFile(
    @Args({ name: 'file', type: () => GraphQLUpload })
    file: Upload,
    @Args({ name: 'folderID', type: () => String })
    folderID: string,
    @CurrentUser()
    user: User,
  ) {
    const folder = await this.folderService.getFolderByID(folderID);
    return await this.filesService.saveFileToStorage(file, user.ID, folder);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => File)
  async getFileByID(@Args('ID') ID: string) {
    return this.filesService.getFileByID(ID);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [File])
  async getFilesByFolder(
    @CurrentUser() user: User,
    @Args('folderID') folderID: string,
  ) {
    return this.filesService.getFilesOfFolder(folderID, user.ID);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [File])
  async getUserTrashFiles(@CurrentUser() user: User) {
    return this.filesService.getTrashFiles(user.ID);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => File)
  async moveFileToTrash(
    @CurrentUser() user: User,
    @Args('fileID') fileID: string,
  ) {
    return this.filesService.moveFileToTrash(fileID, user.ID);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => File)
  async restoreFileFromTrash(@Args('fileID') fileID: string) {
    return this.filesService.moveFileOutOfTrash(fileID);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => String)
  async deleteFile(@Args('fileID') fileID: string) {
    return this.filesService.deleteFileForever(fileID);
  }
}
