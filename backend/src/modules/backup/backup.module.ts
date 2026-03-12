import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';
import { BackupConfig } from './entities/backup-config.entity';
import { BackupLog } from './entities/backup-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BackupConfig, BackupLog])],
  controllers: [BackupController],
  providers: [BackupService],
})
export class BackupModule {}
