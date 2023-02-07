import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { createWriteStream } from 'fs';
import { GraphQLUpload, Upload } from 'graphql-upload';

@Resolver()
export class FilesResolver {
  @Mutation(() => String)
  async uploadFile(
    @Args({ name: 'file', type: () => GraphQLUpload })
    file: Upload,
  ) {
    const { createReadStream, filename } = await file;
    const path = `/files/${filename}`;
    return new Promise(async (resolve, reject) =>
      createReadStream()
        .pipe(createWriteStream(process.cwd() + path))
        .on('finish', () => resolve(`http://localhost:3000/files/${filename}`))
        .on('error', reject),
    );
  }
}
