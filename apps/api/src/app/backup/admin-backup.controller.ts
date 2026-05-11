import { Controller, Get, Res } from '@nestjs/common';
import { Role } from '@hospital/shared';
import type { Response } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { BackupService } from './backup.service';

@Controller('admin/backup')
@Roles(Role.ADMIN)
export class AdminBackupController {
  constructor(private readonly backup: BackupService) {}

  @Get('export')
  async export(@Res() res: Response): Promise<void> {
    const payload = await this.backup.buildExport();
    const name = `hospital-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    res.send(JSON.stringify(payload, null, 2));
  }
}
