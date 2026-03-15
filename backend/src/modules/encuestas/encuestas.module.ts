import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EncuestaServicio } from './encuesta.entity';
import { EncuestasService } from './encuestas.service';
import { EncuestasController } from './encuestas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EncuestaServicio])],
  controllers: [EncuestasController],
  providers: [EncuestasService],
  exports: [EncuestasService],
})
export class EncuestasModule {}
