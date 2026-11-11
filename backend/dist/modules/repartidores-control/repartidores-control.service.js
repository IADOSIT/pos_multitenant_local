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
exports.RepartidoresControlService = void 0;
exports.normalizarCodigo = normalizarCodigo;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const uuid_1 = require("uuid");
const repartidor_entity_1 = require("../logistica/repartidor.entity");
const repartidor_qr_entity_1 = require("./repartidor-qr.entity");
const repartidor_asignacion_entity_1 = require("./repartidor-asignacion.entity");
const repartidor_liquidacion_entity_1 = require("./repartidor-liquidacion.entity");
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function normalizarCodigo(c) {
    return String(c ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}
const n = (v) => Number(v || 0);
const r2 = (v) => Math.round(v * 100) / 100;
let RepartidoresControlService = class RepartidoresControlService {
    constructor(repartidorRepo, qrRepo, asigRepo, liqRepo, dataSource) {
        this.repartidorRepo = repartidorRepo;
        this.qrRepo = qrRepo;
        this.asigRepo = asigRepo;
        this.liqRepo = liqRepo;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger('RepartidoresControl');
    }
    async configTienda(scope) {
        if (!scope?.tienda_id)
            return null;
        const [row] = await this.dataSource.query('SELECT config_pos FROM tiendas WHERE id = ? AND tenant_id = ?', [scope.tienda_id, scope.tenant_id]);
        let cp = row?.config_pos ?? null;
        if (typeof cp === 'string') {
            try {
                cp = JSON.parse(cp);
            }
            catch {
                cp = null;
            }
        }
        return cp || {};
    }
    async estado(scope) {
        const cp = await this.configTienda(scope).catch(() => null);
        return {
            habilitado: cp?.repartidores_control_enabled === true,
            preguntar: cp?.repartidores_preguntar === 'para_llevar' ? 'para_llevar' : 'todas',
        };
    }
    async exigirHabilitado(scope) {
        if (!scope?.tienda_id) {
            throw new common_1.BadRequestException('Elige la tienda (arriba, en "Elegir tienda...") para usar Repartidores');
        }
        const cp = await this.configTienda(scope);
        if (cp?.repartidores_control_enabled !== true) {
            throw new common_1.ForbiddenException('El control de repartidores no está habilitado para esta tienda');
        }
    }
    async generarCodigoUnico(tenant_id) {
        for (let intento = 0; intento < 12; intento++) {
            let codigo = 'R';
            for (let i = 0; i < 7; i++)
                codigo += ALFABETO[(0, crypto_1.randomInt)(ALFABETO.length)];
            const existe = await this.qrRepo.count({ where: { tenant_id, codigo } });
            if (!existe)
                return codigo;
        }
        throw new common_1.ConflictException('No se pudo generar un código único, intenta de nuevo');
    }
    async qrDe(rep) {
        const actual = await this.qrRepo.findOne({ where: { repartidor_id: rep.id, tenant_id: rep.tenant_id } });
        if (actual)
            return actual;
        return this.qrRepo.save(this.qrRepo.create({
            tenant_id: rep.tenant_id,
            empresa_id: rep.empresa_id,
            repartidor_id: rep.id,
            codigo: await this.generarCodigoUnico(rep.tenant_id),
        }));
    }
    async listarRepartidores(scope) {
        await this.exigirHabilitado(scope);
        const reps = await this.repartidorRepo.find({
            where: { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id },
            order: { nombre: 'ASC' },
        });
        const out = [];
        for (const rep of reps) {
            const qr = await this.qrDe(rep);
            out.push({ id: rep.id, nombre: rep.nombre, telefono: rep.telefono, activo: rep.activo, codigo: qr.codigo });
        }
        return out;
    }
    async crearRepartidor(data, scope) {
        await this.exigirHabilitado(scope);
        const nombre = String(data?.nombre || '').trim();
        if (!nombre)
            throw new common_1.BadRequestException('Escribe el nombre del repartidor');
        const rep = await this.repartidorRepo.save(this.repartidorRepo.create({
            tenant_id: scope.tenant_id,
            empresa_id: scope.empresa_id,
            nombre: nombre.slice(0, 100),
            telefono: (String(data?.telefono || '').trim().slice(0, 20) || null),
            token: (0, uuid_1.v4)(),
            activo: true,
        }));
        const qr = await this.qrDe(rep);
        return { id: rep.id, nombre: rep.nombre, telefono: rep.telefono, activo: rep.activo, codigo: qr.codigo };
    }
    async repartidorDeEmpresa(id, scope) {
        const rep = await this.repartidorRepo.findOne({
            where: { id: Number(id), tenant_id: scope.tenant_id, empresa_id: scope.empresa_id },
        });
        if (!rep)
            throw new common_1.NotFoundException('Repartidor no encontrado');
        return rep;
    }
    async actualizarRepartidor(id, data, scope) {
        await this.exigirHabilitado(scope);
        const rep = await this.repartidorDeEmpresa(id, scope);
        if (data?.nombre !== undefined) {
            const nombre = String(data.nombre || '').trim();
            if (!nombre)
                throw new common_1.BadRequestException('El nombre no puede quedar vacío');
            rep.nombre = nombre.slice(0, 100);
        }
        if (data?.telefono !== undefined)
            rep.telefono = (String(data.telefono || '').trim().slice(0, 20) || null);
        if (data?.activo !== undefined)
            rep.activo = !!data.activo;
        await this.repartidorRepo.save(rep);
        const qr = await this.qrDe(rep);
        return { id: rep.id, nombre: rep.nombre, telefono: rep.telefono, activo: rep.activo, codigo: qr.codigo };
    }
    async regenerarCodigo(id, scope) {
        await this.exigirHabilitado(scope);
        const rep = await this.repartidorDeEmpresa(id, scope);
        const qr = await this.qrDe(rep);
        qr.codigo = await this.generarCodigoUnico(rep.tenant_id);
        await this.qrRepo.save(qr);
        return { id: rep.id, nombre: rep.nombre, telefono: rep.telefono, activo: rep.activo, codigo: qr.codigo };
    }
    async resolverRepartidor(data, scope) {
        let rep = null;
        if (data?.codigo) {
            const codigo = normalizarCodigo(data.codigo);
            const qr = codigo
                ? await this.qrRepo.findOne({ where: { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id, codigo } })
                : null;
            if (!qr)
                throw new common_1.BadRequestException('Código no reconocido: no es el gafete de un repartidor de esta empresa');
            rep = await this.repartidorRepo.findOne({
                where: { id: qr.repartidor_id, tenant_id: scope.tenant_id, empresa_id: scope.empresa_id },
            });
        }
        else if (data?.repartidor_id) {
            rep = await this.repartidorRepo.findOne({
                where: { id: Number(data.repartidor_id), tenant_id: scope.tenant_id, empresa_id: scope.empresa_id },
            });
        }
        else {
            throw new common_1.BadRequestException('Escanea el QR del repartidor o elígelo de la lista');
        }
        if (!rep)
            throw new common_1.BadRequestException('Repartidor no encontrado');
        if (!rep.activo)
            throw new common_1.BadRequestException(`${rep.nombre} está dado de baja; actívalo en Repartidores`);
        return rep;
    }
    async resumenPendiente(repartidor_id, scope) {
        const [row] = await this.dataSource.query(`SELECT COUNT(*) AS pedidos,
              COALESCE(SUM(CASE WHEN v.estado = 'cancelada' THEN 0 ELSE a.efectivo END), 0) AS efectivo
         FROM repartidor_asignaciones a
         LEFT JOIN ventas v ON v.id = a.venta_id
        WHERE a.tenant_id = ? AND a.tienda_id = ? AND a.repartidor_id = ? AND a.estado = 'pendiente'`, [scope.tenant_id, scope.tienda_id, repartidor_id]);
        return { pedidos: n(row?.pedidos), efectivo: r2(n(row?.efectivo)) };
    }
    async ventaDeTienda(data, scope) {
        let venta = null;
        if (data?.venta_id) {
            [venta] = await this.dataSource.query('SELECT * FROM ventas WHERE id = ? AND tenant_id = ? AND tienda_id = ?', [Number(data.venta_id), scope.tenant_id, scope.tienda_id]);
        }
        else if (data?.folio_offline) {
            [venta] = await this.dataSource.query('SELECT * FROM ventas WHERE folio_offline = ? AND tenant_id = ? AND tienda_id = ? ORDER BY id DESC LIMIT 1', [String(data.folio_offline), scope.tenant_id, scope.tienda_id]);
        }
        else if (data?.folio) {
            [venta] = await this.dataSource.query('SELECT * FROM ventas WHERE folio = ? AND tenant_id = ? AND tienda_id = ? ORDER BY id DESC LIMIT 1', [String(data.folio).trim(), scope.tenant_id, scope.tienda_id]);
        }
        if (!venta)
            throw new common_1.NotFoundException('La venta todavía no está en el servidor');
        return venta;
    }
    async crearAsignacion(manager, venta, rep, origen, scope) {
        const detalles = await manager.query('SELECT producto_nombre, cantidad FROM venta_detalles WHERE venta_id = ? ORDER BY id', [venta.id]);
        const productos = (detalles || [])
            .map((d) => `${Number(d.cantidad)}x ${d.producto_nombre}`)
            .join(', ')
            .slice(0, 2000);
        const efectivo = venta.pago_efectivo != null
            ? Math.max(0, Math.min(n(venta.total), n(venta.pago_efectivo) - n(venta.cambio)))
            : 0;
        const repo = manager.getRepository(repartidor_asignacion_entity_1.RepartidorAsignacion);
        return repo.save(repo.create({
            tenant_id: scope.tenant_id,
            empresa_id: venta.empresa_id ?? scope.empresa_id,
            tienda_id: venta.tienda_id,
            repartidor_id: rep.id,
            repartidor_nombre: rep.nombre,
            venta_id: venta.id,
            pedido_id: venta.pedido_id ?? null,
            folio: venta.folio,
            numero_orden: venta.numero_orden ?? null,
            productos: productos || null,
            cliente_nombre: venta.cliente_nombre || null,
            cliente_direccion: venta.cliente_direccion || null,
            total: r2(n(venta.total)),
            metodo_pago: venta.metodo_pago || null,
            efectivo: r2(efectivo),
            fecha_venta: venta.created_at || null,
            estado: 'pendiente',
            origen,
            asignado_por_id: scope.id ?? null,
            asignado_por_nombre: scope.nombre ?? null,
        }));
    }
    async asignar(data, scope) {
        await this.exigirHabilitado(scope);
        const rep = await this.resolverRepartidor(data, scope);
        const venta = await this.ventaDeTienda(data, scope);
        if (venta.estado === 'cancelada')
            throw new common_1.BadRequestException(`La venta ${venta.folio} está cancelada`);
        const vigente = await this.asigRepo.findOne({
            where: { venta_id: venta.id, tenant_id: scope.tenant_id, estado: (0, typeorm_2.In)(['pendiente', 'liquidada']) },
        });
        if (vigente) {
            if (vigente.repartidor_id === rep.id) {
                return { asignacion: vigente, repartidor: { id: rep.id, nombre: rep.nombre }, resumen: await this.resumenPendiente(rep.id, scope), ya_estaba: true };
            }
            throw new common_1.ConflictException(`El pedido ${venta.folio} ya lo lleva ${vigente.repartidor_nombre}. Para cambiarlo usa "Reasignar" en Repartidores.`);
        }
        const origen = ['escaner', 'lista', 'sin_internet'].includes(data?.origen) ? data.origen : 'escaner';
        const asignacion = await this.crearAsignacion(this.dataSource.manager, venta, rep, origen, scope);
        return { asignacion, repartidor: { id: rep.id, nombre: rep.nombre }, resumen: await this.resumenPendiente(rep.id, scope) };
    }
    async asignacionPendiente(manager, id, scope) {
        const [row] = await manager.query(`SELECT id FROM repartidor_asignaciones
        WHERE id = ? AND tenant_id = ? AND tienda_id = ? FOR UPDATE`, [Number(id), scope.tenant_id, scope.tienda_id]);
        if (!row)
            throw new common_1.NotFoundException('Asignación no encontrada');
        const a = await manager.getRepository(repartidor_asignacion_entity_1.RepartidorAsignacion).findOne({ where: { id: row.id } });
        if (a.estado !== 'pendiente') {
            throw new common_1.ConflictException(`Ese pedido ya no está pendiente (${a.estado}); recarga la pantalla`);
        }
        return a;
    }
    async reasignar(id, data, scope) {
        await this.exigirHabilitado(scope);
        const rep = await this.resolverRepartidor(data, scope);
        const motivo = String(data?.motivo || '').trim().slice(0, 255) || null;
        return this.dataSource.transaction(async (manager) => {
            const a = await this.asignacionPendiente(manager, id, scope);
            if (a.repartidor_id === rep.id)
                throw new common_1.BadRequestException(`Ese pedido ya lo lleva ${rep.nombre}`);
            const [venta] = await manager.query('SELECT * FROM ventas WHERE id = ?', [a.venta_id]);
            if (!venta)
                throw new common_1.NotFoundException('La venta ya no existe');
            a.estado = 'reasignada';
            a.motivo = motivo ? `A ${rep.nombre}: ${motivo}` : `A ${rep.nombre}`;
            a.cerrado_por_id = scope.id ?? null;
            a.cerrado_por_nombre = scope.nombre ?? null;
            a.cerrado_at = new Date();
            await manager.getRepository(repartidor_asignacion_entity_1.RepartidorAsignacion).save(a);
            const nueva = await this.crearAsignacion(manager, venta, rep, 'reasignacion', scope);
            return { asignacion: nueva, anterior: a.id };
        });
    }
    async quitar(id, data, scope) {
        await this.exigirHabilitado(scope);
        const motivo = String(data?.motivo || '').trim().slice(0, 255);
        if (!motivo)
            throw new common_1.BadRequestException('Escribe el motivo para quitar el pedido al repartidor');
        return this.dataSource.transaction(async (manager) => {
            const a = await this.asignacionPendiente(manager, id, scope);
            a.estado = 'cancelada';
            a.motivo = motivo;
            a.cerrado_por_id = scope.id ?? null;
            a.cerrado_por_nombre = scope.nombre ?? null;
            a.cerrado_at = new Date();
            return manager.getRepository(repartidor_asignacion_entity_1.RepartidorAsignacion).save(a);
        });
    }
    async tablero(scope) {
        await this.exigirHabilitado(scope);
        const reps = await this.repartidorRepo.find({
            where: { tenant_id: scope.tenant_id, empresa_id: scope.empresa_id },
            order: { nombre: 'ASC' },
        });
        const pendientes = await this.dataSource.query(`SELECT a.repartidor_id,
              COUNT(*) AS pedidos,
              SUM(CASE WHEN v.estado = 'cancelada' THEN 0 ELSE a.efectivo END) AS efectivo,
              SUM(CASE WHEN v.estado = 'cancelada' THEN 0 ELSE a.total END) AS total,
              SUM(CASE WHEN v.estado = 'cancelada' THEN 1 ELSE 0 END) AS canceladas,
              MIN(a.created_at) AS desde
         FROM repartidor_asignaciones a
         LEFT JOIN ventas v ON v.id = a.venta_id
        WHERE a.tenant_id = ? AND a.tienda_id = ? AND a.estado = 'pendiente'
        GROUP BY a.repartidor_id`, [scope.tenant_id, scope.tienda_id]);
        const ultimas = await this.dataSource.query(`SELECT repartidor_id, MAX(created_at) AS ultima
         FROM repartidor_liquidaciones
        WHERE tenant_id = ? AND tienda_id = ?
        GROUP BY repartidor_id`, [scope.tenant_id, scope.tienda_id]);
        const porRep = new Map(pendientes.map((p) => [Number(p.repartidor_id), p]));
        const ultimaPor = new Map(ultimas.map((u) => [Number(u.repartidor_id), u.ultima]));
        const filas = reps
            .map((rep) => {
            const p = porRep.get(rep.id);
            return {
                id: rep.id,
                nombre: rep.nombre,
                telefono: rep.telefono,
                activo: rep.activo,
                pedidos: n(p?.pedidos),
                efectivo: r2(n(p?.efectivo)),
                total: r2(n(p?.total)),
                canceladas: n(p?.canceladas),
                desde: p?.desde || null,
                ultima_liquidacion: ultimaPor.get(rep.id) || null,
            };
        })
            .filter((f) => f.activo || f.pedidos > 0);
        return {
            repartidores: filas,
            totales: {
                pedidos: filas.reduce((s, f) => s + f.pedidos, 0),
                efectivo: r2(filas.reduce((s, f) => s + f.efectivo, 0)),
                total: r2(filas.reduce((s, f) => s + f.total, 0)),
            },
        };
    }
    async pendientesDe(repartidor_id, scope) {
        await this.exigirHabilitado(scope);
        const rep = await this.repartidorDeEmpresa(repartidor_id, scope);
        const filas = await this.dataSource.query(`SELECT a.*, v.estado AS venta_estado
         FROM repartidor_asignaciones a
         LEFT JOIN ventas v ON v.id = a.venta_id
        WHERE a.tenant_id = ? AND a.tienda_id = ? AND a.repartidor_id = ? AND a.estado = 'pendiente'
        ORDER BY a.created_at ASC, a.id ASC`, [scope.tenant_id, scope.tienda_id, rep.id]);
        return {
            repartidor: { id: rep.id, nombre: rep.nombre, telefono: rep.telefono, activo: rep.activo },
            pedidos: filas.map((f) => this.filaAsignacion(f)),
        };
    }
    filaAsignacion(f) {
        const cancelada = f.venta_estado === 'cancelada';
        return {
            ...f,
            total: n(f.total),
            efectivo: cancelada ? 0 : n(f.efectivo),
            venta_cancelada: cancelada,
        };
    }
    async liquidar(data, scope) {
        await this.exigirHabilitado(scope);
        const rep = await this.repartidorDeEmpresa(data?.repartidor_id, scope);
        const ids = Array.from(new Set((data?.asignacion_ids || []).map((x) => Number(x)).filter((x) => x > 0)));
        if (!ids.length)
            throw new common_1.BadRequestException('Selecciona al menos un pedido para liquidar');
        const recibido = r2(n(data?.efectivo_recibido));
        if (!Number.isFinite(recibido) || recibido < 0)
            throw new common_1.BadRequestException('El efectivo recibido no es válido');
        const notas = String(data?.notas || '').trim().slice(0, 255) || null;
        return this.dataSource.transaction(async (manager) => {
            const filas = await manager.query(`SELECT a.id, a.total, a.efectivo, v.estado AS venta_estado
           FROM repartidor_asignaciones a
           LEFT JOIN ventas v ON v.id = a.venta_id
          WHERE a.id IN (${ids.map(() => '?').join(',')})
            AND a.tenant_id = ? AND a.tienda_id = ? AND a.repartidor_id = ? AND a.estado = 'pendiente'
          FOR UPDATE`, [...ids, scope.tenant_id, scope.tienda_id, rep.id]);
            if (filas.length !== ids.length) {
                throw new common_1.ConflictException('Algunos pedidos ya se liquidaron o cambiaron de repartidor; recarga la pantalla');
            }
            const [{ quedan }] = await manager.query(`SELECT COUNT(*) AS quedan FROM repartidor_asignaciones
          WHERE tenant_id = ? AND tienda_id = ? AND repartidor_id = ? AND estado = 'pendiente'`, [scope.tenant_id, scope.tienda_id, rep.id]);
            const vivas = filas.filter((f) => f.venta_estado !== 'cancelada');
            const esperado = r2(vivas.reduce((s, f) => s + n(f.efectivo), 0));
            const vendido = r2(vivas.reduce((s, f) => s + n(f.total), 0));
            const [caja] = await manager.query(`SELECT id FROM cajas WHERE tienda_id = ? AND estado = 'abierta' ORDER BY id DESC LIMIT 1`, [scope.tienda_id]);
            const liqRepo = manager.getRepository(repartidor_liquidacion_entity_1.RepartidorLiquidacion);
            const liq = await liqRepo.save(liqRepo.create({
                tenant_id: scope.tenant_id,
                empresa_id: scope.empresa_id,
                tienda_id: scope.tienda_id,
                repartidor_id: rep.id,
                repartidor_nombre: rep.nombre,
                caja_id: caja?.id ?? null,
                tipo: n(quedan) > ids.length ? 'parcial' : 'total',
                num_pedidos: ids.length,
                total_vendido: vendido,
                efectivo_esperado: esperado,
                efectivo_recibido: recibido,
                diferencia: r2(recibido - esperado),
                notas,
                usuario_id: scope.id ?? null,
                usuario_nombre: scope.nombre ?? null,
            }));
            await manager.query(`UPDATE repartidor_asignaciones
            SET estado = 'liquidada', liquidacion_id = ?, cerrado_por_id = ?, cerrado_por_nombre = ?, cerrado_at = NOW()
          WHERE id IN (${ids.map(() => '?').join(',')}) AND estado = 'pendiente'`, [liq.id, scope.id ?? null, scope.nombre ?? null, ...ids]);
            this.logger.log(`Liquidacion ${liq.id}: ${rep.nombre} ${ids.length} pedidos, esperado ${esperado}, recibido ${recibido} (tienda ${scope.tienda_id})`);
            return this.detalleLiquidacionCon(manager, liq.id, scope);
        });
    }
    async detalleLiquidacionCon(manager, id, scope) {
        const liq = await manager.getRepository(repartidor_liquidacion_entity_1.RepartidorLiquidacion).findOne({
            where: { id: Number(id), tenant_id: scope.tenant_id, tienda_id: scope.tienda_id },
        });
        if (!liq)
            throw new common_1.NotFoundException('Liquidación no encontrada');
        const pedidos = await manager.query(`SELECT a.*, v.estado AS venta_estado
         FROM repartidor_asignaciones a
         LEFT JOIN ventas v ON v.id = a.venta_id
        WHERE a.liquidacion_id = ? AND a.tenant_id = ?
        ORDER BY a.created_at ASC, a.id ASC`, [liq.id, scope.tenant_id]);
        const [tienda] = await manager.query('SELECT nombre FROM tiendas WHERE id = ?', [liq.tienda_id]);
        return {
            ...liq,
            total_vendido: n(liq.total_vendido),
            efectivo_esperado: n(liq.efectivo_esperado),
            efectivo_recibido: n(liq.efectivo_recibido),
            diferencia: n(liq.diferencia),
            tienda_nombre: tienda?.nombre || '',
            pedidos: pedidos.map((f) => this.filaAsignacion(f)),
        };
    }
    async liquidacion(id, scope) {
        await this.exigirHabilitado(scope);
        return this.detalleLiquidacionCon(this.dataSource.manager, id, scope);
    }
    rangoFechas(q) {
        const hasta = q?.hasta ? new Date(q.hasta) : new Date();
        const desde = q?.desde ? new Date(q.desde) : new Date(hasta.getTime() - 7 * 24 * 3600 * 1000);
        if (isNaN(desde.getTime()) || isNaN(hasta.getTime()))
            throw new common_1.BadRequestException('Rango de fechas no válido');
        return { desde, hasta };
    }
    async liquidaciones(q, scope) {
        await this.exigirHabilitado(scope);
        const { desde, hasta } = this.rangoFechas(q);
        const params = [scope.tenant_id, scope.tienda_id, desde, hasta];
        let extra = '';
        if (q?.repartidor_id) {
            extra = ' AND repartidor_id = ?';
            params.push(Number(q.repartidor_id));
        }
        const filas = await this.dataSource.query(`SELECT * FROM repartidor_liquidaciones
        WHERE tenant_id = ? AND tienda_id = ? AND created_at BETWEEN ? AND ?${extra}
        ORDER BY created_at DESC, id DESC
        LIMIT 500`, params);
        return filas.map((f) => ({
            ...f,
            total_vendido: n(f.total_vendido),
            efectivo_esperado: n(f.efectivo_esperado),
            efectivo_recibido: n(f.efectivo_recibido),
            diferencia: n(f.diferencia),
        }));
    }
    async historial(q, scope) {
        await this.exigirHabilitado(scope);
        const { desde, hasta } = this.rangoFechas(q);
        const params = [scope.tenant_id, scope.tienda_id, desde, hasta];
        let extra = '';
        if (q?.repartidor_id) {
            extra += ' AND a.repartidor_id = ?';
            params.push(Number(q.repartidor_id));
        }
        if (q?.estado) {
            extra += ' AND a.estado = ?';
            params.push(String(q.estado));
        }
        if (q?.folio) {
            extra += ' AND a.folio LIKE ?';
            params.push(`%${String(q.folio).trim()}%`);
        }
        const filas = await this.dataSource.query(`SELECT a.*, v.estado AS venta_estado
         FROM repartidor_asignaciones a
         LEFT JOIN ventas v ON v.id = a.venta_id
        WHERE a.tenant_id = ? AND a.tienda_id = ? AND a.created_at BETWEEN ? AND ?${extra}
        ORDER BY a.created_at DESC, a.id DESC
        LIMIT 1000`, params);
        return filas.map((f) => this.filaAsignacion(f));
    }
};
exports.RepartidoresControlService = RepartidoresControlService;
exports.RepartidoresControlService = RepartidoresControlService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(repartidor_entity_1.Repartidor)),
    __param(1, (0, typeorm_1.InjectRepository)(repartidor_qr_entity_1.RepartidorQr)),
    __param(2, (0, typeorm_1.InjectRepository)(repartidor_asignacion_entity_1.RepartidorAsignacion)),
    __param(3, (0, typeorm_1.InjectRepository)(repartidor_liquidacion_entity_1.RepartidorLiquidacion)),
    __param(4, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], RepartidoresControlService);
//# sourceMappingURL=repartidores-control.service.js.map