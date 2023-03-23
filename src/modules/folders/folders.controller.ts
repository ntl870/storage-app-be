import {
  Controller,
  Get,
  Param,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { FoldersService } from './folders.service';
import { Response } from 'express';
import { JwtRestGuard } from '@modules/auth/guards/jwt-rest.guard';

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
}
