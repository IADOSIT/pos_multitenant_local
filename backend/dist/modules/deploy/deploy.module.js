"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeployModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const app_deploy_entity_1 = require("./app-deploy.entity");
const deploy_service_1 = require("./deploy.service");
const deploy_controller_1 = require("./deploy.controller");
let DeployModule = class DeployModule {
};
exports.DeployModule = DeployModule;
exports.DeployModule = DeployModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([app_deploy_entity_1.AppDeploy])],
        controllers: [deploy_controller_1.DeployController],
        providers: [deploy_service_1.DeployService],
        exports: [deploy_service_1.DeployService],
    })
], DeployModule);
//# sourceMappingURL=deploy.module.js.map