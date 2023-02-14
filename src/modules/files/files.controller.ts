import { Controller, Get, Param, Res } from '@nestjs/common';
import { join } from 'path';
import { Response } from 'express';
@Controller('files')
export class FilesController {
  @Get('/:filepath')
  async serveFile(@Res() res: Response, @Param('filepath') filepath: string) {
    return res.sendFile(join(process.cwd(), 'files', filepath));
  }
}
