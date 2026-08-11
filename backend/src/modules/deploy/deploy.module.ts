import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDeploy } from './app-deploy.entity';
import { DeployService } from './deploy.service';
import { DeployController } from './deploy.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AppDeploy])],
  controllers: [DeployController],
  providers: [DeployService],
  exports: [DeployService],
})
export class DeployModule {}
