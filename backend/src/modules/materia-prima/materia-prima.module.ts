import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MateriaPrima } from './materia-prima.entity';
import { MateriaPrimaController } from './materia-prima.controller';
import { MateriaPrimaService } from './materia-prima.service';

@Module({
  imports: [TypeOrmModule.forFeature([MateriaPrima])],
  controllers: [MateriaPrimaController],
  providers: [MateriaPrimaService],
  exports: [MateriaPrimaService],
})
export class MateriaPrimaModule {}
