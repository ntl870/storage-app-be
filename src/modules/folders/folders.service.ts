import { getRepository } from '@db/db';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Folder } from './folders.entity';
import { NewFolderInput, UploadFolderInput } from './folders.types';
import { createWriteStream, mkdirSync } from 'fs';
import { FilesService } from '@modules/files/files.service';
import * as archiver from 'archiver';
import { Response } from 'express';
import { deleteFile, deleteFolder } from '@utils/tools';
import { User } from '@modules/user/user.entity';
import { ErrorException } from '@utils/exceptions';

@Injectable()
export class FoldersService {
  folderRepository: Repository<Folder>;
  constructor(
    @Inject(forwardRef(() => FilesService))
    private readonly fileService: FilesService,
  ) {
    this.folderRepository = getRepository(Folder);
  }

  canModify(userID: string, folder: Folder) {
    return (
      folder?.ownerID === String(userID) ||
      !!folder?.sharedUsers?.find((user: User) => user.ID === userID) ||
      folder?.isPublic
    );
  }

  canAccess(userID: string, folder: Folder) {
    return (
      folder?.ownerID === String(userID) ||
      !!folder?.readonlyUsers?.find((user: User) => user.ID === userID) ||
      folder?.isPublic
    );
  }

  async createFolder(userID: string, input: NewFolderInput): Promise<Folder> {
    try {
      const rootFolder = input.rootFolderID
        ? await this.folderRepository.findOne({
            where: {
              ID: input.rootFolderID,
            },
          })
        : null;

      if (!this.canModify(userID, rootFolder) && !!rootFolder) {
        throw ErrorException.forbidden(
          'You are not allowed to create a folder in this folder',
        );
      }
      const newFolder = await this.folderRepository.save({
        name: input.name,
        ownerID: rootFolder?.ownerID || userID,
        rootFolder,
      });
      const path = !!rootFolder
        ? `${rootFolder?.path}/${newFolder.name}`
        : `/files/${newFolder.ID}`;

      mkdirSync(`${process.cwd()}${path}`, {
        recursive: true,
      });

      return await this.folderRepository.save({
        ...newFolder,
        path,
      });
    } catch (err) {
      throw new Error(err);
    }
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
      const rootFolder = await this.getFolderByID(input.rootFolderID);
      if (!this.canModify(userID, rootFolder)) {
        throw ErrorException.forbidden(
          'You are not allowed to upload a folder to this folder',
        );
      }
      await this.handleSaveFolder(rootFolder.ownerID, input);
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
      relations: ['rootFolder'],
    });
  }

  async getUserFolders(userID: string, folderID: string): Promise<Folder[]> {
    try {
      const currentFolder = await this.getFolderByID(folderID);
      if (!this.canAccess(userID, currentFolder)) {
        throw ErrorException.forbidden(
          'You are not allowed to access this folder',
        );
      }
      return await this.folderRepository.find({
        where: {
          ownerID: userID,
          rootFolder: {
            ID: folderID,
          },
        },
        relations: ['files', 'subFolders'],
      });
    } catch (err) {
      throw err;
    }
  }

  async downloadFolder(res: Response, folderID: string, userID: string) {
    try {
      const folder = await this.getFolderByID(folderID);
      if (!this.canAccess(userID, folder)) {
        throw ErrorException.forbidden(
          'You are not allowed to download this folder',
        );
      }
      const sourceDir = process.cwd() + folder.path;
      const zipFilePath = `${sourceDir}.zip`;
      const output = createWriteStream(sourceDir + '.zip');
      // create an archiver object to generate the zip file
      const archive = archiver('zip', {
        zlib: { level: 9 }, // set the compression level
      });

      // listen for errors on the output stream
      await new Promise((resolve, reject) => {
        archive
          .directory(sourceDir, false)
          .on('error', (err) => reject(err))
          .pipe(output);

        output.on('close', () => resolve('close'));
        archive.finalize();
      });
      res.download(zipFilePath, folder.name + '.zip', () => {
        deleteFile(zipFilePath);
      });
    } catch (err) {
      throw err;
    }
  }

  async moveFolderToTrash(folderID: string) {
    try {
      const folder = await this.getFolderByID(folderID);
      await this.folderRepository.save({
        ...folder,
        isTrash: true,
      });
      return 'Move folder to trash successfully';
    } catch (err) {
      throw err;
    }
  }

  async getTrashFolder(userID: string): Promise<Folder[]> {
    try {
      return await this.folderRepository.find({
        where: {
          ownerID: userID,
          isTrash: true,
        },
      });
    } catch (err) {
      throw err;
    }
  }

  async moveFolderOutOfTrash(folderID: string) {
    try {
      const folder = await this.getFolderByID(folderID);
      await this.folderRepository.save({
        ...folder,
        isTrash: false,
      });
      return 'Move folder out of trash successfully';
    } catch (err) {
      throw err;
    }
  }

  async deleteFolderForever(folderID: string) {
    try {
      const folder = await this.getFolderByID(folderID);
      await this.folderRepository.remove(folder);
      deleteFolder(`${process.cwd()}${folder.path}`);
      return 'Delete folder successfully';
    } catch (err) {
      throw err;
    }
  }

  async getArrayOfRootFoldersName(folderID: string) {
    const folder = await this.getFolderByID(folderID);
    const rootFolder = folder.rootFolder;
    if (rootFolder) {
      return [folder, ...(await this.getArrayOfRootFoldersName(rootFolder.ID))];
    }
    return [folder];
  }
}
