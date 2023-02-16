import { CurrentUser } from '@decorators/CurrentUser';
import { JwtAuthGuard } from '@modules/auth/guards/jwt.guard';
import { FoldersService } from '@modules/folders/folders.service';
import { User } from '@modules/user/user.entity';
import { UseGuards } from '@nestjs/common';
import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { getFileType } from '@utils/tools';
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

      const isDupplicated = !!(await this.filesService.findFileByOptions({
        folder: folder.ID,
        name: filename,
      }));

      const fileNameWithoutExtension = filename.split('.')[0];
      const extension = filename.split('.')[1];
      const generatedName = `${fileNameWithoutExtension}_${Date.now()}.${extension}`;

      const path = isDupplicated
        ? `${folder.path}/${generatedName}`
        : `${folder.path}/${filename}`;

      newFile.name = generatedName;
      newFile.folder = folderID ?? null;
      newFile.url = path;
      newFile.ownerID = user.ID;
      newFile.fileType = getFileType(path);

      await new Promise((resolve, reject) =>
        createReadStream()
          .pipe(createWriteStream(process.cwd() + path))
          .on('finish', () => resolve(path))
          .on('error', reject),
      );

      return await this.filesService.create(newFile);
    } catch (err) {
      throw err;
    }
  }
}
