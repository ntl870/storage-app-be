import {
  Controller,
  Get,
  Param,
  Res,
  Request,
  Post,
  UploadedFile,
  UseInterceptors,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtRestGuard } from '@modules/auth/guards/jwt-rest.guard';
import { FoldersService } from '@modules/folders/folders.service';

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

  @UseGuards(JwtRestGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Query('folderID') folderID: string,
  ) {
    return await this.filesService.saveFileToStorageRestful(
      file,
      req.user.ID,
      folderID,
    );
  }
}
