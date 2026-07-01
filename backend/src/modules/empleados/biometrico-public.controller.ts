import { Controller, Get, Post, Param } from '@nestjs/common';
import { BiometricoService } from './biometrico.service';

@Controller('public/biometrico')
export class BiometricoPublicController {
  constructor(private readonly bio: BiometricoService) {}

  // Bridge descarga templates al iniciar / refrescar cada 2 min
  @Get('templates/:empresa_token')
  getTemplates(@Param('empresa_token') token: string) {
    return this.bio.getTemplates(token);
  }

  // Heartbeat del bridge cada 5s
  @Post('heartbeat/:empresa_token')
  heartbeat(@Param('empresa_token') token: string) {
    return this.bio.heartbeat(token);
  }
}
