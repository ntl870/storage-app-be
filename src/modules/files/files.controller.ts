import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Response } from 'express';
import { FilesService } from './files.service';
import { JwtRestGuard } from '@modules/auth/guards/jwt-rest.guard';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  // @UseGuards(JwtRestGuard)
  @Get(':fileID')
  async downloadFile(
    @Request() req,
    @Res() res: Response,
    @Param('fileID') fileID: string,
  ) {
    return await this.filesService.downloadFile(res, fileID);
  }
}
