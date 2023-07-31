import { JwtRestGuard } from '@modules/auth/guards/jwt-rest.guard';
import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { FilesService } from './files.service';
import 'multer';

@Controller('/api/files')
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

  @UseGuards(JwtRestGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Request() req,
    @UploadedFile() file: any,
    @Query('folderID') folderID: string,
  ) {
    return await this.filesService.saveFileToStorageRestful(
      file,
      req.user.ID,
      folderID,
    );
  }
}
