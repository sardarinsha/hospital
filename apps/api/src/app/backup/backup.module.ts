import { Module } from '@nestjs/common';
import { AdminBackupController } from './admin-backup.controller';
import { BackupService } from './backup.service';

@Module({
  controllers: [AdminBackupController],
  providers: [BackupService],
})
export class BackupModule {}
