"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmpleadosModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const empleado_entity_1 = require("./empleado.entity");
const horario_empleado_entity_1 = require("./horario-empleado.entity");
const registro_asistencia_entity_1 = require("./registro-asistencia.entity");
const config_biometrico_entity_1 = require("./config-biometrico.entity");
const empleados_service_1 = require("./empleados.service");
const asistencia_service_1 = require("./asistencia.service");
const biometrico_service_1 = require("./biometrico.service");
const biometrico_gateway_1 = require("./biometrico.gateway");
const empleados_controller_1 = require("./empleados.controller");
const biometrico_public_controller_1 = require("./biometrico-public.controller");
let EmpleadosModule = class EmpleadosModule {
};
exports.EmpleadosModule = EmpleadosModule;
exports.EmpleadosModule = EmpleadosModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([empleado_entity_1.Empleado, horario_empleado_entity_1.HorarioEmpleado, registro_asistencia_entity_1.RegistroAsistencia, config_biometrico_entity_1.ConfigBiometrico])],
        controllers: [empleados_controller_1.EmpleadosController, biometrico_public_controller_1.BiometricoPublicController],
        providers: [empleados_service_1.EmpleadosService, asistencia_service_1.AsistenciaService, biometrico_service_1.BiometricoService, biometrico_gateway_1.BiometricoGateway],
        exports: [empleados_service_1.EmpleadosService, asistencia_service_1.AsistenciaService],
    })
], EmpleadosModule);
//# sourceMappingURL=empleados.module.js.map