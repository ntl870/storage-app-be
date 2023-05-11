import { JwtRestGuard } from '@modules/auth/guards/jwt-rest.guard';
import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { groupFilesByFolder } from '@utils/tools';
import { Response } from 'express';
import { FoldersService } from './folders.service';

@Controller('/api/folders')
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
