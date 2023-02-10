import { Injectable } from '@nestjs/common';
import { File } from '@modules/files/files.entity';
import { Repository } from 'typeorm';
import { getRepository } from '@db/db';

@Injectable()
export class FilesService {
  fileRepository: Repository<File>;

  constructor() {
    this.fileRepository = getRepository(File);
  }

  async create(input: File): Promise<File> {
    const savedFile = await this.fileRepository.save(input);
    return savedFile;
  }
}
