import { getRepository } from '@db/db';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Folder } from './folders.entity';
import { NewFolderInput, UploadFolderInput } from './folders.types';
import { mkdirSync } from 'fs';
import { FilesService } from '@modules/files/files.service';

@Injectable()
export class FoldersService {
  folderRepository: Repository<Folder>;
  constructor(private readonly fileService: FilesService) {
    this.folderRepository = getRepository(Folder);
  }
  async createFolder(userID: string, input: NewFolderInput): Promise<Folder> {
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
      rootFolder: rootFolder,
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
    userID: string,
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
        return await this.fileService.saveFileToStorage(
          file,
          userID,
          rootFolder,
        );
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

  async uploadFolder(userID: string, input: UploadFolderInput) {
    try {
      await this.handleSaveFolder(userID, input);
      return 'Upload folder successfully';
    } catch (err) {
      throw err;
    }
  }

  async getFolderByID(folderID: string): Promise<Folder> {
    return await this.folderRepository.findOne({
      where: {
        ID: folderID,
      },
    });
  }

  async getUserFolders(userID: string, folderID: string): Promise<Folder[]> {
    return await this.folderRepository.find({
      where: {
        ownerID: userID,
        rootFolder: {
          ID: folderID,
        },
      },
      relations: ['files', 'subFolders'],
    });
  }
}
