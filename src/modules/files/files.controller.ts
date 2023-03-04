import { Controller, Get, Param, Res } from '@nestjs/common';
import { join } from 'path';
import { Response } from 'express';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get(':fileID')
  async downloadFile(@Res() res: Response, @Param('fileID') fileID: string) {
    const file = await this.filesService.getFileByID(fileID);
    return res.download(join(process.cwd(), `${file.url}`), file.name);
  }
}
