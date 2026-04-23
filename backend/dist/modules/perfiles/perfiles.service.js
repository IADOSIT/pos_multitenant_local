"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerfilesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const perfil_negocio_entity_1 = require("./perfil-negocio.entity");
const tenant_perfil_entity_1 = require("./tenant-perfil.entity");
const producto_entity_1 = require("../productos/producto.entity");
const categoria_entity_1 = require("../categorias/categoria.entity");
let PerfilesService = class PerfilesService {
    constructor(perfilRepo, tenantPerfilRepo, productoRepo, categoriaRepo) {
        this.perfilRepo = perfilRepo;
        this.tenantPerfilRepo = tenantPerfilRepo;
        this.productoRepo = productoRepo;
        this.categoriaRepo = categoriaRepo;
    }
    async getPerfilActivo(tenant_id) {
        const tp = await this.tenantPerfilRepo.findOne({
            where: { tenant_id, activo: true },
        });
        if (!tp)
            return null;
        const perfil = await this.perfilRepo.findOne({ where: { clave: tp.perfil_clave, activo: true } });
        if (!perfil)
            return null;
        const config = {
            ...(perfil.config || {}),
            ...(tp.config_override || {}),
        };
        return { ...perfil, config, tenant_perfil_id: tp.id };
    }
    getCarbonHieloConfig() {
        return {
            modulos: ['carbon', 'hielo'],
            modulos_config: {
                carbon: { label: 'Carbón', color: '#374151', icono: 'Flame' },
                hielo: { label: 'Hielo', color: '#0ea5e9', icono: 'Snowflake' },
            },
            inventario_critico: true,
            alertas_stock: true,
            productos_base: [
                { modulo: 'carbon', sku: 'CARB-3KG', nombre: 'Carbón Bolsa 3kg', unidad: 'bolsa', precio: 0, costo: 0, controla_stock: true, stock_minimo: 20 },
                { modulo: 'carbon', sku: 'CARB-2.5KG', nombre: 'Carbón Bolsa 2.5kg', unidad: 'bolsa', precio: 0, costo: 0, controla_stock: true, stock_minimo: 20 },
                { modulo: 'carbon', sku: 'CARB-GRAN', nombre: 'Carbón Granel kg', unidad: 'kg', precio: 0, costo: 0, controla_stock: true, stock_minimo: 50 },
                { modulo: 'hielo', sku: 'HIEL-5KG', nombre: 'Hielo Bolsa 5kg', unidad: 'bolsa', precio: 0, costo: 0, controla_stock: true, stock_minimo: 30 },
                { modulo: 'hielo', sku: 'HIEL-20KG', nombre: 'Hielo Bolsa 20kg', unidad: 'bolsa', precio: 0, costo: 0, controla_stock: true, stock_minimo: 10 },
                { modulo: 'hielo', sku: 'HIEL-BARR', nombre: 'Hielo Barra', unidad: 'pieza', precio: 0, costo: 0, controla_stock: true, stock_minimo: 5 },
            ],
        };
    }
    async activarPerfil(tenant_id, empresa_id, tienda_id, perfil_clave, scope) {
        let perfil = await this.perfilRepo.findOne({ where: { clave: perfil_clave } });
        if (!perfil) {
            if (perfil_clave === 'carbon_hielo') {
                perfil = await this.perfilRepo.save(this.perfilRepo.create({
                    clave: 'carbon_hielo',
                    nombre: 'Carbón + Hielo',
                    descripcion: 'Perfil para negocios de venta de carbón y hielo con inventario dual',
                    config: this.getCarbonHieloConfig(),
                    activo: true,
                }));
            }
            else {
                throw new common_1.BadRequestException(`Perfil '${perfil_clave}' no encontrado`);
            }
        }
        if (!perfil.activo)
            throw new common_1.BadRequestException(`Perfil '${perfil_clave}' no encontrado`);
        let tp = await this.tenantPerfilRepo.findOne({ where: { tenant_id, perfil_clave } });
        if (tp) {
            tp.activo = true;
            await this.tenantPerfilRepo.save(tp);
        }
        else {
            tp = await this.tenantPerfilRepo.save(this.tenantPerfilRepo.create({ tenant_id, perfil_clave, activo: true }));
        }
        let seed = null;
        if (perfil_clave === 'carbon_hielo') {
            seed = await this.seedCarbonHielo(tenant_id, empresa_id, scope);
        }
        return { perfil, tenant_perfil: tp, seed };
    }
    async desactivarPerfil(tenant_id, perfil_clave) {
        await this.tenantPerfilRepo.update({ tenant_id, perfil_clave }, { activo: false });
    }
    async seedCarbonHielo(tenant_id, empresa_id, scope) {
        const perfil = await this.perfilRepo.findOne({ where: { clave: 'carbon_hielo' } });
        const productosBase = perfil?.config?.productos_base ?? this.getCarbonHieloConfig().productos_base;
        if (!productosBase?.length)
            return { categorias: [], productos: [] };
        const categoriasCreadas = [];
        const productosCreados = [];
        let catCarbon = await this.categoriaRepo.findOne({
            where: { tenant_id, empresa_id, nombre: 'Carbón' },
        });
        if (!catCarbon) {
            catCarbon = await this.categoriaRepo.save(this.categoriaRepo.create({
                tenant_id,
                empresa_id,
                nombre: 'Carbón',
                color: '#374151',
                icono: 'Flame',
                orden: 90,
                activo: true,
                modulo: 'carbon',
            }));
            categoriasCreadas.push(catCarbon);
        }
        let catHielo = await this.categoriaRepo.findOne({
            where: { tenant_id, empresa_id, nombre: 'Hielo' },
        });
        if (!catHielo) {
            catHielo = await this.categoriaRepo.save(this.categoriaRepo.create({
                tenant_id,
                empresa_id,
                nombre: 'Hielo',
                color: '#0ea5e9',
                icono: 'Snowflake',
                orden: 91,
                activo: true,
                modulo: 'hielo',
            }));
            categoriasCreadas.push(catHielo);
        }
        for (const pb of productosBase) {
            const existe = await this.productoRepo.findOne({
                where: { sku: pb.sku, tenant_id, empresa_id },
            });
            if (existe)
                continue;
            const catId = pb.modulo === 'carbon' ? catCarbon.id : catHielo.id;
            const prod = await this.productoRepo.save(this.productoRepo.create({
                tenant_id,
                empresa_id,
                sku: pb.sku,
                nombre: pb.nombre,
                precio: pb.precio ?? 0,
                costo: pb.costo ?? 0,
                unidad: pb.unidad ?? 'pza',
                controla_stock: pb.controla_stock ?? true,
                stock_minimo: pb.stock_minimo ?? 0,
                stock_actual: 0,
                categoria_id: catId,
                activo: true,
                disponible: true,
                modulo: pb.modulo,
            }));
            productosCreados.push(prod);
        }
        return { categorias: categoriasCreadas, productos: productosCreados };
    }
    async getAlertasStock(tenant_id, empresa_id, modulo) {
        const qb = this.productoRepo
            .createQueryBuilder('p')
            .where('p.tenant_id = :tenant_id', { tenant_id })
            .andWhere('p.empresa_id = :empresa_id', { empresa_id })
            .andWhere('p.controla_stock = 1')
            .andWhere('p.activo = 1')
            .andWhere('p.stock_minimo > 0')
            .andWhere('p.stock_actual <= p.stock_minimo');
        if (modulo)
            qb.andWhere('p.modulo = :modulo', { modulo });
        const productos = await qb
            .select(['p.id', 'p.sku', 'p.nombre', 'p.stock_actual', 'p.stock_minimo', 'p.unidad', 'p.modulo'])
            .orderBy('p.stock_actual', 'ASC')
            .getRawMany();
        return productos.map((p) => ({
            id: p.p_id,
            sku: p.p_sku,
            nombre: p.p_nombre,
            stock_actual: Number(p.p_stock_actual),
            stock_minimo: Number(p.p_stock_minimo),
            unidad: p.p_unidad,
            modulo: p.p_modulo,
            deficit: Number(p.p_stock_minimo) - Number(p.p_stock_actual),
        }));
    }
    async getResumenModulo(tenant_id, empresa_id, modulo) {
        const todos = await this.productoRepo.find({
            where: { tenant_id, empresa_id, activo: true, modulo },
        });
        const conStock = todos.filter((p) => p.controla_stock);
        const alertas = conStock.filter((p) => Number(p.stock_minimo) > 0 && Number(p.stock_actual) <= Number(p.stock_minimo));
        const stockBajo = conStock.filter((p) => Number(p.stock_minimo) > 0 && Number(p.stock_actual) > Number(p.stock_minimo) && Number(p.stock_actual) <= Number(p.stock_minimo) * 2);
        return {
            modulo,
            total_productos: todos.length,
            alertas_criticas: alertas.length,
            stock_bajo: stockBajo.length,
        };
    }
};
exports.PerfilesService = PerfilesService;
exports.PerfilesService = PerfilesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(perfil_negocio_entity_1.PerfilNegocio)),
    __param(1, (0, typeorm_1.InjectRepository)(tenant_perfil_entity_1.TenantPerfil)),
    __param(2, (0, typeorm_1.InjectRepository)(producto_entity_1.Producto)),
    __param(3, (0, typeorm_1.InjectRepository)(categoria_entity_1.Categoria)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PerfilesService);
//# sourceMappingURL=perfiles.service.js.map