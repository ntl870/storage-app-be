import { CurrentUser } from '@decorators/CurrentUser';
import { JwtAuthGuard } from '@modules/auth/guards/jwt.guard';
import { User } from '@modules/user/user.entity';
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Folder } from './folders.entity';
import { FoldersService } from './folders.service';
import {
  NewFolderInput,
  PeopleWithAccessResponse,
  UploadFolderInput,
} from './folders.types';
import { ErrorException } from '@utils/exceptions';

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

  @UseGuards(JwtAuthGuard)
  @Mutation(() => String)
  async addSharedUserToFolder(
    @CurrentUser() user: User,
    @Args('folderID') folderID: string,
    @Args('sharedUserIDs', { type: () => [String] }) sharedUserIDs: string[],
    @Args('shouldSendMail') shouldSendMail: boolean,
    @Args('userMessage', { nullable: true }) userMessage: string,
  ) {
    return await this.folderService.addUserToFolderSharedUsers(
      user.ID,
      folderID,
      sharedUserIDs,
      shouldSendMail,
      userMessage,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => String)
  async addUserToFolderReadOnlyUsers(
    @CurrentUser() user: User,
    @Args('folderID') folderID: string,
    @Args('readOnlyUserIDs', { type: () => [String] })
    readOnlyUserIDs: string[],
    @Args('shouldSendMail') shouldSendMail: boolean,
    @Args('userMessage', { nullable: true }) userMessage: string,
  ) {
    return await this.folderService.addUserToFolderReadOnlyUsers(
      user.ID,
      folderID,
      readOnlyUserIDs,
      shouldSendMail,
      userMessage,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => PeopleWithAccessResponse)
  async getPeopleWithAccessToFolder(
    @CurrentUser() user: User,
    @Args('folderID') folderID: string,
  ) {
    return await this.folderService.getPeopleWithAccess(user.ID, folderID);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => String)
  async setGeneralFolderAccess(
    @CurrentUser() user: User,
    @Args('folderID') folderID: string,
    @Args('isPublic') isPublic: boolean,
  ) {
    return await this.folderService.setGeneralAccessOfFolder(
      user.ID,
      folderID,
      isPublic,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => String)
  async removeUserFromFolder(
    @CurrentUser() user: User,
    @Args('folderID') folderID: string,
    @Args('targetUserID') targetUserID: string,
  ) {
    return await this.folderService.removeUserFromFolder(
      user.ID,
      folderID,
      targetUserID,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => String)
  async changeUserRoleInFolder(
    @CurrentUser() user: User,
    @Args('folderID') folderID: string,
    @Args('targetUserID') targetUserID: string,
    @Args('targetRole') targetRole: 'Editor' | 'Viewer',
  ) {
    if (targetRole !== 'Editor' && targetRole !== 'Viewer')
      throw ErrorException.badRequest('Invalid role');

    return await this.folderService.changeUserRoleInFolder(
      user.ID,
      folderID,
      targetUserID,
      targetRole,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => String)
  async emptyUserTrash(@CurrentUser() user: User) {
    return await this.folderService.emptyTrash(user.ID);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [Folder])
  async getUserSharedFolders(@CurrentUser() user: User) {
    return await this.folderService.getUserSharedFolders(user.ID);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => String)
  async starFolder(
    @CurrentUser() user: User,
    @Args('folderID') folderID: string,
  ) {
    return await this.folderService.starFolder(user.ID, folderID);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [Folder])
  async getStarredFolders(@CurrentUser() user: User) {
    return await this.folderService.getStarredFolders(user.ID);
  }
}
