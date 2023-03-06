import { Injectable } from '@nestjs/common';
import { File } from '@modules/files/files.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { getRepository } from '@db/db';
import { Upload } from 'graphql-upload';
import { Folder } from '@modules/folders/folders.entity';
import { createWriteStream } from 'fs';
import { deleteFile, getFileType } from '@utils/tools';

@Injectable()
export class FilesService {
  fileRepository: Repository<File>;

  constructor() {
    this.fileRepository = getRepository(File);
  }

  async create(input: File): Promise<File> {
    try {
      const savedFile = await this.fileRepository.save(input);
      return savedFile;
    } catch (err) {
      throw err;
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

  async getFilesOfFolder(folderID: string) {
    try {
      const files = await this.fileRepository.find({
        where: {
          folder: {
            ID: folderID,
          },
        },
      });
      return files;
    } catch (err) {
      throw err;
    }
  }

  async moveFileToTrash(fileID: string) {
    try {
      const file = await this.getFileByID(fileID);
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
}
