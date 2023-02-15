import { getRepository } from '@db/db';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Folder } from './folders.entity';
import { NewFolderInput, UploadFolderInput } from './folders.types';
import { File } from '@modules/files/files.entity';
import { createWriteStream, mkdirSync } from 'fs';
import { FilesService } from '@modules/files/files.service';

@Injectable()
export class FoldersService {
  folderRepository: Repository<Folder>;
  constructor(private readonly fileService: FilesService) {
    this.folderRepository = getRepository(Folder);
  }
  async createFolder(userID: number, input: NewFolderInput): Promise<Folder> {
    const rootFolder = input.rootFolderID
      ? await this.folderRepository.findOne({
          where: {
            ID: input.rootFolderID,
          },
        })
      : null;

    const newFolder = await this.folderRepository.save({
      name: input.name,
      ownerID: String(userID),
      rootFolder: rootFolder ?? null,
    });
    const path = !!rootFolder
      ? `${rootFolder.path}/${newFolder.name}`
      : `/files/${newFolder.ID}`;

    mkdirSync(`${process.cwd()}${path}`, {
      recursive: true,
    });

    return await this.folderRepository.save({
      ...newFolder,
      path: path,
    });
  }

  async handleSaveFolder(
    userID: number,
    input: UploadFolderInput,
    parentFolder?: Folder,
  ) {
    let rootFolder: Folder;
    if (!parentFolder) {
      rootFolder = await this.createFolder(userID, {
        name: input.folder.name,
        rootFolderID: input.rootFolderID,
      });
    } else {
      rootFolder = parentFolder;
    }

    await Promise.all(
      input.folder.files.map(async (file) => {
        const { createReadStream, filename } = await file;

        const newFile = new File();
        try {
          const path = `${rootFolder.path}/${filename}`;

          await new Promise((resolve, reject) =>
            createReadStream()
              .pipe(createWriteStream(`${process.cwd()}/${path}`))
              .on('finish', () => resolve(path))
              .on('error', reject),
          );

          newFile.name = filename;
          newFile.folder = null;
          newFile.url = path as string;
          newFile.ownerID = String(userID);
          await this.fileService.create(newFile);
        } catch (err) {
          throw err;
        }

        return newFile;
      }),
    );
    if (input.folder.folders.length > 0) {
      await Promise.all(
        input.folder.folders.map(async (folder) => {
          const newFolder = await this.createFolder(userID, {
            name: folder.name,
            rootFolderID: rootFolder.ID,
          });

          await this.handleSaveFolder(
            userID,
            {
              folder,
              rootFolderID: newFolder.ID,
            },
            newFolder,
          );
        }),
      );
    }
  }

  async uploadFolder(userID: number, input: UploadFolderInput) {
    try {
      await this.handleSaveFolder(userID, input);
      return 'Upload folder successfully';
    } catch (err) {
      throw err;
    }
  }

  async getFolderByID(folderID: number): Promise<Folder> {
    return await this.folderRepository.findOne({
      where: {
        ID: String(folderID),
      },
    });
  }
}
