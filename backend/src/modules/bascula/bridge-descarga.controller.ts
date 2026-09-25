import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigBascula } from './config-bascula.entity';
import { BasculaService } from './bascula.service';

/**
 * Descarga del instalador del bridge, ya configurado para una tienda.
 *
 * Por que es publico (sin JWT): el instalador se baja en la computadora de la caja,
 * que muchas veces no es donde esta abierta la sesion del administrador. Con un link
 * que se pueda mandar por WhatsApp, la instalacion es "bajar y doble clic"; con JWT
 * habria que iniciar sesion en esa maquina o traer 80 MB a memoria para renombrarlos.
 *
 * Que se expone: el binario es EXACTAMENTE el mismo para todas las tiendas — lo unico
 * que cambia es el nombre con el que se entrega, y de ahi el instalador saca el token
 * (ver bascula-bridge/installer.nsh). El token va en la URL porque ya es la credencial
 * del bridge; si no corresponde a ninguna tienda, esto responde 404 y no sirve nada.
 */
@Controller('bridge')
export class BridgeDescargaController {
  constructor(
    private readonly service: BasculaService,
    @InjectRepository(ConfigBascula) private readonly configRepo: Repository<ConfigBascula>,
  ) {}

  @Get('descargar/:token')
  async descargar(@Param('token') token: string, @Res() res: Response) {
    // Un token corto o vacio nunca es real: se corta antes de tocar la base.
    if (!token || token.length < 16) throw new NotFoundException('Enlace no valido');

    const config = await this.configRepo.findOne({ where: { tienda_token: token } });
    if (!config) throw new NotFoundException('Enlace no valido');

    const ruta = this.service.rutaInstalador();
    if (!ruta) {
      throw new NotFoundException(
        'El instalador del bridge todavia no esta publicado en el servidor.',
      );
    }

    res.download(ruta, `POS-iaDoS-Bridge__TKN-${token}.exe`);
  }
}
