"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const path_1 = require("path");
const express = require("express");
const app_module_1 = require("./app.module");
const licencia_guard_1 = require("./common/guards/licencia.guard");
const licencias_service_1 = require("./modules/licencias/licencias.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bodyParser: false });
    app.use(express.json({ limit: '20mb' }));
    app.use(express.urlencoded({ limit: '20mb', extended: true }));
    const licService = app.get(licencias_service_1.LicenciasService);
    app.useGlobalGuards(new licencia_guard_1.LicenciaGuard(licService));
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads'), { prefix: '/api/uploads' });
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads-builtin'), { prefix: '/api/uploads' });
    app.setGlobalPrefix('api');
    app.enableCors({
        origin: true,
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        skipMissingProperties: true,
    }));
    const port = process.env.APP_PORT || 3000;
    const host = process.env.APP_HOST || '0.0.0.0';
    await app.listen(port, host);
    console.log(`🟢 POS-iaDoS Backend corriendo en http://${host}:${port}`);
    console.log(`   iaDoS - iados.mx`);
}
bootstrap();
//# sourceMappingURL=main.js.map