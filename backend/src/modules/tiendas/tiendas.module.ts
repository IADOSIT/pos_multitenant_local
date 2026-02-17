import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tienda } from './tienda.entity';
import { TiendasController } from './tiendas.controller';
import { TiendasService } from './tiendas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tienda])],
  controllers: [TiendasController],
  providers: [TiendasService],
  exports: [TiendasService],
})
export class TiendasModule {}
