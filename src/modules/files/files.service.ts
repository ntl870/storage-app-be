import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { File } from '@modules/files/files.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { getRepository } from '@db/db';
import { Upload } from 'graphql-upload';
import { Folder } from '@modules/folders/folders.entity';
import { createWriteStream } from 'fs';
import { deleteFile, getFileType } from '@utils/tools';
import { FoldersService } from '@modules/folders/folders.service';
import { ErrorException } from '@utils/exceptions';
import { Response } from 'express';
import { join } from 'path';

@Injectable()
export class FilesService {
  fileRepository: Repository<File>;

  constructor(
    @Inject(forwardRef(() => FoldersService))
    private readonly folderService: FoldersService,
  ) {
    this.fileRepository = getRepository(File);
  }

  canModify(userID: string, file: File) {
    return (
      file?.ownerID === String(userID) ||
      !!file?.sharedUsers?.find((user) => user.ID === userID) ||
      file?.isPublic
    );
  }

  canAccess(userID: string, file: File) {
    return (
      file?.ownerID === String(userID) ||
      !!file?.readonlyUsers?.find((user) => user.ID === userID) ||
      file?.isPublic
    );
  }

  async create(input: File): Promise<File> {
    try {
      const savedFile = await this.fileRepository.save(input);
      return savedFile;
    } catch (err) {
      throw new Error(err);
    }
  }

  async findFileByOptions(
    options: FindOptionsWhere<File> | FindOptionsWhere<File>[],
  ): Promise<File[] | File> {
    return this.fileRepository.find({
      where: options,
    });
  }

  async getFileByID(ID: string): Promise<File> {
    return await this.fileRepository.findOne({
      where: {
        ID: ID,
      },
    });
  }

  async getUserFiles(userID: string): Promise<File[]> {
    try {
      return await this.fileRepository.find({
        where: {
          ownerID: userID,
        },
      });
    } catch (err) {
      throw err;
    }
  }

  async saveFileToStorage(
    file: Upload,
    userID: string,
    rootFolder: Folder,
  ): Promise<File> {
    if (!this.folderService.canModify(userID, rootFolder)) {
      throw ErrorException.forbidden("You don't have access to this folder");
    }
    const { createReadStream, filename } = await file;

    try {
      const path = `${rootFolder.path}/${filename}`;

      await new Promise((resolve, reject) =>
        createReadStream()
          .pipe(createWriteStream(`${process.cwd()}/${path}`))
          .on('finish', () => resolve(path))
          .on('error', reject),
      );
      const newFile = new File();
      newFile.name = filename;
      newFile.folder = rootFolder;
      newFile.url = path;
      newFile.ownerID = String(userID);
      newFile.fileType = getFileType(path);
      return await this.create(newFile);
    } catch (err) {
      throw err;
    }
  }

  async getFilesOfFolder(folderID: string, userID: string) {
    const folder = await this.folderService.getFolderByID(folderID);
    if (!this.folderService.canAccess(userID, folder)) {
      throw ErrorException.forbidden("You don't have access to this folder");
    }
    const files = await this.fileRepository.find({
      where: {
        folder: {
          ID: folderID,
        },
      },
    });
    return files;
  }

  async moveFileToTrash(fileID: string, userID: string) {
    try {
      const file = await this.getFileByID(fileID);
      if (this.canModify(userID, file)) {
        throw ErrorException.forbidden(
          'You are not allowed move this file to trash',
        );
      }
      return await this.fileRepository.save({
        ...file,
        isTrash: true,
      });
    } catch (err) {
      throw err;
    }
  }

  async getTrashFiles(userID: string) {
    try {
      const files = await this.fileRepository.find({
        where: {
          ownerID: userID,
          isTrash: true,
        },
      });
      return files;
    } catch (err) {
      throw err;
    }
  }

  async moveFileOutOfTrash(fileID: string) {
    try {
      const file = await this.getFileByID(fileID);
      return await this.fileRepository.save({
        ...file,
        isTrash: false,
      });
    } catch (err) {
      throw err;
    }
  }

  async deleteFileForever(fileID: string) {
    try {
      const file = await this.getFileByID(fileID);
      await this.fileRepository.delete({
        ID: fileID,
      });
      deleteFile(`${process.cwd()}${file.url}`);
      return 'File deleted';
    } catch (err) {
      throw err;
    }
  }

  async downloadFile(res: Response, fileID: string) {
    const file = await this.getFileByID(fileID);
    // if (!this.canAccess(userID, file)) {
    //   throw ErrorException.forbidden("You don't have access to this file");
    // }
    return res.download(join(process.cwd(), `${file.url}`), file.name);
  }
}
