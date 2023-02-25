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
}
