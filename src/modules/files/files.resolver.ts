import { createQueryRunner } from '@db/db';
import { CurrentUser } from '@decorators/CurrentUser';
import { JwtAuthGuard } from '@modules/auth/guards/jwt.guard';
import { User } from '@modules/user/user.entity';
import { UseGuards } from '@nestjs/common';
import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { createWriteStream } from 'fs';
import { GraphQLUpload, Upload } from 'graphql-upload';
import { File } from './files.entity';
import { FilesService } from './files.service';
@Resolver()
export class FilesResolver {
  constructor(private readonly filesService: FilesService) {}

  @UseGuards(JwtAuthGuard)
  @Mutation(() => String)
  async uploadFile(
    @Args({ name: 'file', type: () => GraphQLUpload })
    file: Upload,
    @CurrentUser() user: User,
  ) {
    const { createReadStream, filename } = await file;

    const queryRunner = createQueryRunner();

    await queryRunner.startTransaction();

    const newFile = new File();
    try {
      const checkSequenceExists = await queryRunner.query(
        `SELECT to_regclass('files_id_seq')`,
      );

      if (!checkSequenceExists[0].to_regclass) {
        await queryRunner.query(`CREATE SEQUENCE files_id_seq`);
      }

      const nextID = await queryRunner.manager.query(
        `SELECT nextval('files_id_seq') as next_id`,
      );

      console.log(nextID);
      const path = `/files/${filename}`;
      const filePath = await new Promise(async (resolve, reject) =>
        createReadStream()
          .pipe(createWriteStream(process.cwd() + path))
          .on('finish', () => resolve(`/files/${filename}`))
          .on('error', reject),
      );

      newFile.name = filename;
      newFile.folder = null;
      newFile.url = filePath as string;
      newFile.ownerID = user.ID;

      await this.filesService.create(newFile);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    return newFile;
  }
}
