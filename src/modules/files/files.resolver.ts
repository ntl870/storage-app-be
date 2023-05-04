import { CurrentUser } from '@decorators/CurrentUser';
import { JwtAuthGuard } from '@modules/auth/guards/jwt.guard';
import { FoldersService } from '@modules/folders/folders.service';
import { User } from '@modules/user/user.entity';
import { UseGuards } from '@nestjs/common';
import { Resolver, Args, Mutation, Query } from '@nestjs/graphql';
import { GraphQLUpload, Upload } from 'graphql-upload';
import { File } from './files.entity';
import { FilesService } from './files.service';
import { PeopleWithAccessResponse } from '@modules/folders/folders.types';
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

  @UseGuards(JwtAuthGuard)
  @Query(() => PeopleWithAccessResponse)
  async getPeopleWithAccessToFile(
    @CurrentUser() user: User,
    @Args('fileID') fileID: string,
  ) {
    return await this.filesService.getPeopleWithAccessToFile(user.ID, fileID);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => String)
  async addUsersToReadonlyFile(
    @CurrentUser() user: User,
    @Args('fileID') fileID: string,
    @Args('readonlyUserIDs', { type: () => [String] })
    readonlyUserIDs: string[],
    @Args('shouldSendMail') shouldSendMail: boolean,
    @Args('userMessage', { nullable: true }) userMessage: string,
  ) {
    return await this.filesService.addUsersToReadOnlyFile(
      user.ID,
      fileID,
      readonlyUserIDs,
      shouldSendMail,
      userMessage,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => String)
  async addUsersToSharedUserFile(
    @CurrentUser() user: User,
    @Args('fileID') fileID: string,
    @Args('sharedUserIDs', { type: () => [String] }) sharedUserIDs: string[],
    @Args('shouldSendMail') shouldSendMail: boolean,
    @Args('userMessage', { nullable: true }) userMessage: string,
  ) {
    return await this.filesService.addUsersToSharedUserFile(
      user.ID,
      fileID,
      sharedUserIDs,
      shouldSendMail,
      userMessage,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => String)
  async changeUserRoleInFile(
    @CurrentUser() user: User,
    @Args('fileID') fileID: string,
    @Args('targetUserID') targetUserID: string,
    @Args('targetRole') targetRole: 'Editor' | 'Viewer',
  ) {
    return await this.filesService.changeUserRoleInFile(
      user.ID,
      fileID,
      targetUserID,
      targetRole,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => String)
  async removeUserFromFile(
    @CurrentUser() user: User,
    @Args('fileID') fileID: string,
    @Args('targetUserID') targetUserID: string,
  ) {
    return this.filesService.removeUserFromFile(user.ID, fileID, targetUserID);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => String)
  async setGeneralAccessOfFile(
    @CurrentUser() user: User,
    @Args('fileID') fileID: string,
    @Args('isPublic') isPublic: boolean,
  ) {
    return this.filesService.setGeneralAccessOfFile(user.ID, fileID, isPublic);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => File)
  async getFileByIDWithAccess(
    @CurrentUser() user: User,
    @Args('fileID') fileID: string,
  ) {
    return await this.filesService.getFileByIDWithAccess(user.ID, fileID);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [File])
  async getUserSharedFiles(@CurrentUser() user: User) {
    return await this.filesService.getUserSharedFiles(user.ID);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [File])
  async getStarredFiles(@CurrentUser() user: User) {
    return await this.filesService.getStarredFiles(user.ID);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => String)
  async starFile(@CurrentUser() user: User, @Args('fileID') fileID: string) {
    return await this.filesService.starFile(user.ID, fileID);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => String)
  async unstarFile(@CurrentUser() user: User, @Args('fileID') fileID: string) {
    return await this.filesService.unStarFile(user.ID, fileID);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => String)
  async renameFile(
    @CurrentUser() user: User,
    @Args('fileID') fileID: string,
    @Args('newName') newName: string,
  ) {
    return await this.filesService.renameFile(user.ID, fileID, newName);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => String)
  async makeCopyOfFile(
    @CurrentUser() user: User,
    @Args('fileID') fileID: string,
  ) {
    return await this.filesService.makeCopyOfFile(user.ID, fileID);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => String)
  async moveFileToNewFolder(
    @CurrentUser() user: User,
    @Args('fileID') fileID: string,
    @Args('targetFolderID') targetFolderID: string,
  ) {
    return await this.filesService.moveFileToFolder(
      user.ID,
      fileID,
      targetFolderID,
    );
  }
}
