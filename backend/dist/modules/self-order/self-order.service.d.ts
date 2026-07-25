import { Repository } from 'typeorm';
import { Pedido, PedidoEstado } from '../pedidos/pedido.entity';
import { Mesa } from '../mesas/mesa.entity';
import { MesasService } from '../mesas/mesas.service';
import { EncuestasService } from '../encuestas/encuestas.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { LogisticaService } from '../logistica/logistica.service';
import { DataSource } from 'typeorm';
export declare class SelfOrderService {
    private pedidoRepo;
    private mesaRepo;
    private mesasService;
    private encuestasService;
    private notificacionesService;
    private logisticaService;
    private dataSource;
    private logger;
    constructor(pedidoRepo: Repository<Pedido>, mesaRepo: Repository<Mesa>, mesasService: MesasService, encuestasService: EncuestasService, notificacionesService: NotificacionesService, logisticaService: LogisticaService, dataSource: DataSource);
    getTiendaPublica(tienda_id: number, mesa_numero: number): Promise<{
        tienda_nombre: any;
        empresa_nombre: any;
        empresa_logo: any;
        mesa_numero: number;
        mesa_nombre: string;
        mesa_id: number;
    }>;
    private cleanDesc;
    getMenuPublico(tienda_id: number): Promise<{
        categorias: any;
        productos: any;
        config_especial: {
            mostrar_precios: boolean;
            notif_cliente_estados: boolean;
            campos_formulario: import("../empresas/campos-formulario.helper").CamposFormulario;
        };
    }>;
    crearPedidoCliente(tienda_id: number, mesa_numero: number, body: any): Promise<{
        pedido_id: number;
        folio: string;
        encuesta_token: string;
        estado: PedidoEstado;
    }>;
    getEstadoPedido(encuesta_token: string): Promise<{
        estado: PedidoEstado;
        mesero_confirmado: boolean;
        venta_id: number;
        encuesta_lista: boolean;
    }>;
    confirmarPedidoMesero(pedido_id: number, scope: any): Promise<Pedido | null>;
    rechazarPedido(pedido_id: number, motivo: string, scope: any): Promise<Pedido>;
    crearEncuestaAlCobrar(pedido: Pedido): Promise<void>;
    responderEncuesta(encuesta_token: string, data: {
        calificacion_servicio: number;
        calificacion_comida: number;
        comentario?: string;
    }): Promise<import("../encuestas/encuesta.entity").EncuestaServicio | null>;
    getKPIs(scope: any, desde?: string, hasta?: string): Promise<any>;
    getTiendaPublicaBySlug(slug: string, mesa_numero: number): Promise<{
        tienda_nombre: any;
        empresa_nombre: any;
        empresa_logo: any;
        mesa_numero: number;
        mesa_nombre: string;
        mesa_id: number;
    }>;
    getMenuPublicoBySlug(slug: string): Promise<{
        categorias: any;
        productos: any;
        config_especial: {
            mostrar_precios: boolean;
            notif_cliente_estados: boolean;
            campos_formulario: import("../empresas/campos-formulario.helper").CamposFormulario;
        };
    }>;
    crearPedidoBySlug(slug: string, mesa_numero: number, body: any): Promise<{
        pedido_id: number;
        folio: string;
        encuesta_token: string;
        estado: PedidoEstado;
    }>;
    getQRPrintable(tienda_id: number, mesa_id: number, baseUrl: string): Promise<string>;
}
