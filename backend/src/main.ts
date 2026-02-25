import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';
import { AppModule } from './app.module';
import { LicenciaGuard } from './common/guards/licencia.guard';
import { LicenciasService } from './modules/licencias/licencias.service';

async function bootstrap() {
  // bodyParser: false → registramos nuestros propios con límite ampliado para upload de imágenes
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ limit: '20mb', extended: true }));

  // License guard global
  const licService = app.get(LicenciasService);
  app.useGlobalGuards(new LicenciaGuard(licService));

  // Static assets BEFORE global prefix so /api/uploads works directly
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/api/uploads' });
  app.setGlobalPrefix('api');

  app.enableCors({
    origin: true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      skipMissingProperties: true,
    }),
  );

  const port = process.env.APP_PORT || 3000;
  const host = process.env.APP_HOST || '0.0.0.0';
  await app.listen(port, host);
  console.log(`🟢 POS-iaDoS Backend corriendo en http://${host}:${port}`);
  console.log(`   iaDoS - iados.mx`);
}
bootstrap();
