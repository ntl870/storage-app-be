import { Controller, Get, Param, Res } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { Response } from 'express';

@Controller('folders')
export class FoldersController {
  constructor(private readonly folderService: FoldersService) {}

  @Get(':folderID')
  async downloadFolder(
    @Res() res: Response,
    @Param('folderID') folderID: string,
  ) {
    await this.folderService.downloadFolder(res, folderID);
  }
}
