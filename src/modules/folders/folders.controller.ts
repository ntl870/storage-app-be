import {
  Controller,
  Get,
  Param,
  Post,
  Request,
  Res,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  UploadedFiles,
  ArgumentsHost,
  BadRequestException,
  Catch,
  HttpStatus,
  Body,
  Query,
} from '@nestjs/common';
import { FoldersService } from './folders.service';
import { Response } from 'express';
import { JwtRestGuard } from '@modules/auth/guards/jwt-rest.guard';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { groupFilesByFolder } from '@utils/tools';

@Controller('folders')
export class FoldersController {
  constructor(private readonly folderService: FoldersService) {}

  @UseGuards(JwtRestGuard)
  @Get(':folderID')
  async downloadFolder(
    @Request() req,
    @Res() res: Response,
    @Param('folderID') folderID: string,
  ) {
    await this.folderService.downloadFolder(res, folderID, req.user.ID);
  }

  @UseGuards(JwtRestGuard)
  @Post('upload')
  @UseInterceptors(
    AnyFilesInterceptor({
      preservePath: true,
    }),
  )
  async uploadFolder(
    @Request() req,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Query('folderID') folderID: string,
  ) {
    const input = {
      rootFolderID: folderID,
      folder: groupFilesByFolder(files)[0],
    };
    return await this.folderService.uploadFolder(req.user.ID, input);
  }
}
