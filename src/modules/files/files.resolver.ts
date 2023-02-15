import { CurrentUser } from '@decorators/CurrentUser';
import { JwtAuthGuard } from '@modules/auth/guards/jwt.guard';
import { FoldersService } from '@modules/folders/folders.service';
import { User } from '@modules/user/user.entity';
import { UseGuards } from '@nestjs/common';
import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { createWriteStream } from 'fs';
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
    const { createReadStream, filename } = await file;

    const newFile = new File();
    try {
      const folder = await this.folderService.getFolderByID(Number(folderID));

      const path = `${folder.path}/${filename}`;
      await new Promise((resolve, reject) =>
        createReadStream()
          .pipe(createWriteStream(process.cwd() + path))
          .on('finish', () => resolve(path))
          .on('error', reject),
      );

      newFile.name = filename;
      newFile.folder = null;
      newFile.url = path as string;
      newFile.ownerID = user.ID;
      await this.filesService.create(newFile);
    } catch (err) {
      throw err;
    }

    return newFile;
  }
}
