import { getRepository } from '@db/db';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Folder } from './folders.entity';
import { NewFolderInput, UploadFolderInput } from './folders.types';
import { Upload } from 'graphql-upload';
@Injectable()
export class FoldersService {
  folderRepository: Repository<Folder>;
  constructor() {
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

    return newFolder;
  }

  async uploadFolder(userID: number, folders: UploadFolderInput) {
    return [];
  }
}
