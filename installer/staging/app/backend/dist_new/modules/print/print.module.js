"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrintModule = void 0;
const common_1 = require("@nestjs/common");
const print_service_1 = require("./print.service");
const print_controller_1 = require("./print.controller");
let PrintModule = class PrintModule {
};
exports.PrintModule = PrintModule;
exports.PrintModule = PrintModule = __decorate([
    (0, common_1.Module)({
        controllers: [print_controller_1.PrintController],
        providers: [print_service_1.PrintService],
        exports: [print_service_1.PrintService],
    })
], PrintModule);
//# sourceMappingURL=print.module.js.map