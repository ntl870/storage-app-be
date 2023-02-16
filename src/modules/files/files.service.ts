import { Injectable } from '@nestjs/common';
import { File } from '@modules/files/files.entity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { getRepository } from '@db/db';
import { getFileType } from '@utils/tools';

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
}
