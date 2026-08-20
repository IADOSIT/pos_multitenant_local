import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle, UtensilsCrossed, ShoppingBasket, Droplet, Wrench, Carrot,
  ArrowRight, Lightbulb, Users, Store, Grid3x3 as Grid3X3, QrCode, Printer,
  Scale, Barcode, MessageCircle, Truck, Layers, ClipboardList, Warehouse,
  FileBarChart, CreditCard, ShoppingCart, Settings, LucideIcon,
} from 'lucide-react';
import { usePageHeader } from '../../store/pageHeader.store';

type RubroId = 'general' | 'restaurante' | 'abarrotes' | 'albercas' | 'ferreteria' | 'frutas';

interface FlowStep {
  icon: LucideIcon;
  titulo: string;
  detalle: string;
}

interface ConfigHighlight {
  icon: LucideIcon;
  titulo: string;
  detalle: string;
  ruta?: string;
}

interface RubroInfo {
  id: RubroId;
  label: string;
  icon: LucideIcon;
  resumen: string;
  flujo: FlowStep[];
  configuracion: ConfigHighlight[];
  tips: string[];
}

const RUBROS: RubroInfo[] = [
  {
    id: 'general',
    label: 'Primeros pasos',
    icon: HelpCircle,
    resumen: 'Estos pasos aplican a cualquier tipo de negocio, sin importar el giro. Es el flujo base del sistema.',
    flujo: [
      { icon: Users, titulo: 'Iniciar sesión', detalle: 'Cada cajero o mesero entra con su propio usuario y contraseña.' },
      { icon: CreditCard, titulo: 'Abrir caja', detalle: 'Antes de vender se registra el fondo inicial en el módulo de Caja.' },
      { icon: ShoppingCart, titulo: 'Vender', detalle: 'Se agregan productos al carrito, se cobra y se imprime o comparte el ticket.' },
      { icon: ClipboardList, titulo: 'Cerrar caja', detalle: 'Al final del turno se cuenta el efectivo y el sistema compara contra lo vendido.' },
      { icon: FileBarChart, titulo: 'Revisar reportes', detalle: 'El dueño o admin revisa ventas, productos más vendidos e inventario.' },
    ],
    configuracion: [
      { icon: Settings, titulo: 'Configuración > Tienda', detalle: 'Datos generales del negocio, impresora de tickets y apariencia.', ruta: '/admin/configuracion' },
      { icon: Users, titulo: 'Usuarios y roles', detalle: 'Crea cajeros, meseros o encargados y define qué puede hacer cada uno.', ruta: '/admin/usuarios' },
      { icon: Warehouse, titulo: 'Inventario', detalle: 'Actívalo si necesitas controlar existencias y alertas de stock mínimo.', ruta: '/inventario' },
      { icon: Store, titulo: 'Tienda en Línea', detalle: 'Catálogo público opcional para que tus clientes vean tus productos.', ruta: '/admin/tienda-en-linea' },
    ],
    tips: [
      'El sistema funciona offline: si se pierde internet las ventas se guardan localmente y se sincronizan al reconectar.',
      'Puedes personalizar qué opciones del menú ve cada rol desde Configuración.',
    ],
  },
  {
    id: 'restaurante',
    label: 'Restaurante',
    icon: UtensilsCrossed,
    resumen: 'Para restaurantes, cafeterías y taquerías con servicio en mesa, para llevar o por app.',
    flujo: [
      { icon: Grid3X3, titulo: 'Abrir mesa', detalle: 'El mesero elige una mesa disponible desde el módulo de Mesas.' },
      { icon: ClipboardList, titulo: 'Tomar pedido', detalle: 'Se agregan platillos al pedido de la mesa y se puede enviar a cocina.' },
      { icon: UtensilsCrossed, titulo: 'Cocina prepara', detalle: 'La comanda llega impresa o en pantalla al área de cocina.' },
      { icon: CreditCard, titulo: 'Cobrar y cerrar mesa', detalle: 'El cajero cobra la cuenta, reparte propina si aplica y libera la mesa.' },
      { icon: QrCode, titulo: 'Menú digital (opcional)', detalle: 'Los clientes piden desde su celular escaneando el QR de su mesa.' },
    ],
    configuracion: [
      { icon: Grid3X3, titulo: 'Mesas', detalle: 'Da de alta las mesas de tu salón con su número y capacidad.', ruta: '/admin/mesas' },
      { icon: QrCode, titulo: 'Menú Digital QR', detalle: 'Genera un código QR por mesa para que el cliente pida desde su celular.', ruta: '/admin/configuracion' },
      { icon: Printer, titulo: 'Impresora de comandas', detalle: 'Configura la impresora de cocina y la de caja por separado.', ruta: '/admin/configuracion' },
      { icon: Layers, titulo: 'Categorías del menú', detalle: 'Organiza los platillos por categoría: entradas, fuertes, bebidas, postres.', ruta: '/admin/categorias' },
      { icon: Users, titulo: 'Roles mesero / cajero', detalle: 'Permisos separados: el mesero toma el pedido, el cajero cobra.', ruta: '/admin/usuarios' },
    ],
    tips: [
      'El mesero recibe una notificación en tiempo real cuando el cliente pide desde el Menú Digital.',
      'Puedes dividir la cuenta y activar propina sugerida desde la pantalla de cobro.',
    ],
  },
  {
    id: 'abarrotes',
    label: 'Abarrotes',
    icon: ShoppingBasket,
    resumen: 'Para minisúper, tiendas de conveniencia y papelerías: venta rápida por código de barras.',
    flujo: [
      { icon: Barcode, titulo: 'Escanear o buscar', detalle: 'El cajero escanea el código de barras o busca el producto por nombre.' },
      { icon: Scale, titulo: 'Ajustar cantidad', detalle: 'Para productos a granel se pesa o se indica la cantidad manualmente.' },
      { icon: CreditCard, titulo: 'Cobrar', detalle: 'Se cobra en efectivo, tarjeta o el método configurado.' },
      { icon: Warehouse, titulo: 'Reponer stock', detalle: 'Se registran entradas de mercancía conforme llega nueva reposición.' },
      { icon: FileBarChart, titulo: 'Revisar stock bajo', detalle: 'El sistema avisa qué productos están por agotarse.' },
    ],
    configuracion: [
      { icon: Barcode, titulo: 'Código de barras', detalle: 'Asigna un código a cada producto para escaneo rápido en caja.', ruta: '/admin/productos' },
      { icon: Warehouse, titulo: 'Control de stock', detalle: 'Actívalo para ver existencias en tiempo real y alertas de stock mínimo.', ruta: '/inventario' },
      { icon: Scale, titulo: 'Báscula (si vendes a granel)', detalle: 'Actívala en Configuración > Tienda si manejas dulces, granos o similares.', ruta: '/admin/configuracion' },
      { icon: Layers, titulo: 'Categorías', detalle: 'Organiza tu catálogo por pasillo o tipo de producto.', ruta: '/admin/categorias' },
      { icon: FileBarChart, titulo: 'Reportes', detalle: 'Consulta productos más vendidos y márgenes de ganancia.', ruta: '/reportes' },
    ],
    tips: [
      'El escaneo funciona con cualquier lector USB conectado a la computadora del punto de venta.',
      'Define un stock mínimo por producto para recibir alertas antes de que se agote.',
    ],
  },
  {
    id: 'albercas',
    label: 'Albercas y químicos',
    icon: Droplet,
    resumen: 'Para negocios de químicos, refacciones o insumos especializados, con catálogo técnico y clientes frecuentes.',
    flujo: [
      { icon: Layers, titulo: 'Catálogo técnico', detalle: 'Cada producto con nombre, marca, descripción y unidad de venta.' },
      { icon: Store, titulo: 'Tienda en línea', detalle: 'El cliente consulta el catálogo público con precios antes de comprar.' },
      { icon: MessageCircle, titulo: 'Vincular cliente', detalle: 'Se identifica al cliente por teléfono para dar seguimiento a su compra.' },
      { icon: CreditCard, titulo: 'Cobrar', detalle: 'Se cobra en caja o se registra el pedido para entrega posterior.' },
      { icon: Truck, titulo: 'Entrega', detalle: 'Si hay reparto a domicilio, se gestiona desde Logística.' },
    ],
    configuracion: [
      { icon: Store, titulo: 'Tienda en Línea', detalle: 'Catálogo público con categorías e imágenes por producto.', ruta: '/admin/tienda-en-linea' },
      { icon: MessageCircle, titulo: 'Cliente por teléfono', detalle: 'Vincula clientes frecuentes en cada venta para historial y seguimiento.', ruta: '/admin/configuracion' },
      { icon: Layers, titulo: 'Categorías con imagen', detalle: 'Cada categoría con foto representativa para el catálogo público.', ruta: '/admin/categorias' },
      { icon: Truck, titulo: 'Logística', detalle: 'Actívala si haces entregas a domicilio de productos pesados o voluminosos.', ruta: '/logistica' },
      { icon: Droplet, titulo: 'Multi-moneda', detalle: 'Actívala en Configuración si compras insumos importados en dólares.', ruta: '/admin/configuracion' },
    ],
    tips: [
      'Las fichas de producto pueden incluir marca y notas técnicas en la descripción para orientar al cliente.',
      'Un catálogo de categorías con imagen ayuda a que el cliente identifique rápido lo que busca.',
    ],
  },
  {
    id: 'ferreteria',
    label: 'Ferretería',
    icon: Wrench,
    resumen: 'Para ferreterías y negocios con catálogos grandes: cientos o miles de productos en muchas categorías.',
    flujo: [
      { icon: Barcode, titulo: 'Importar catálogo', detalle: 'Carga inicial masiva de productos vía archivo CSV o Excel.' },
      { icon: Layers, titulo: 'Organizar categorías', detalle: 'Se agrupan por línea: plomería, eléctrico, herramientas, pintura.' },
      { icon: ShoppingCart, titulo: 'Vender por búsqueda', detalle: 'El cajero busca por nombre, SKU o código de barras.' },
      { icon: Warehouse, titulo: 'Controlar stock', detalle: 'Cada producto con su propia rotación y existencia.' },
      { icon: FileBarChart, titulo: 'Reportes por categoría', detalle: 'Se identifica qué líneas de producto rotan más.' },
    ],
    configuracion: [
      { icon: Barcode, titulo: 'Importar CSV', detalle: 'Productos > Importar, para dar de alta catálogos grandes de un jalón.', ruta: '/admin/productos' },
      { icon: Layers, titulo: 'Categorías', detalle: 'Estructura tu catálogo por línea de producto.', ruta: '/admin/categorias' },
      { icon: Warehouse, titulo: 'Inventario', detalle: 'Fundamental aquí por la cantidad de productos distintos (SKUs).', ruta: '/inventario' },
      { icon: FileBarChart, titulo: 'Reportes por categoría', detalle: 'Identifica qué líneas de producto son más rentables.', ruta: '/reportes' },
    ],
    tips: [
      'Usa la plantilla CSV de Productos para preparar tu catálogo antes de importar y evitar errores.',
      'Puedes marcar productos como inactivos temporalmente sin borrarlos si se agotan por temporada.',
    ],
  },
  {
    id: 'frutas',
    label: 'Frutas y verduras',
    icon: Carrot,
    resumen: 'Para fruterías, verdulerías o cualquier negocio que vende por peso (kg), estilo HEB.',
    flujo: [
      { icon: ShoppingBasket, titulo: 'Marcar producto en kg', detalle: 'Al crear el producto se define la unidad de venta como kilogramo.' },
      { icon: Scale, titulo: 'Pesar en báscula', detalle: 'En el kiosko de autodespacho o directo en el punto de venta.' },
      { icon: Barcode, titulo: 'Etiqueta con peso', detalle: 'Se imprime una etiqueta con código de barras de peso variable.' },
      { icon: CreditCard, titulo: 'Cobrar', detalle: 'El precio ya viene calculado según el peso al escanear la etiqueta.' },
    ],
    configuracion: [
      { icon: Scale, titulo: 'Báscula', detalle: 'Actívala en Configuración > Tienda: modo Kiosko (autoservicio) y/o modo POS (autocobro).', ruta: '/admin/configuracion' },
      { icon: Barcode, titulo: 'Etiqueta de peso variable', detalle: 'Se imprime automáticamente al pesar, con código EAN-13.', ruta: '/admin/configuracion' },
      { icon: ShoppingBasket, titulo: 'Productos por kg', detalle: 'Marca la unidad "kg" en cada producto de fruta o verdura.', ruta: '/admin/productos' },
    ],
    tips: [
      'El kiosko de autodespacho es una pantalla aparte para que el cliente se pese sin ayuda del cajero.',
      'El modo POS-integrado permite mezclar productos por peso y por pieza en el mismo carrito.',
    ],
  },
];

function FlowDiagram({ steps }: { steps: FlowStep[] }) {
  return (
    <div className="flex flex-wrap items-stretch gap-2">
      {steps.map((step, i) => {
        const Icon = step.icon;
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="bg-iados-surface border border-slate-700 rounded-xl p-4 w-44 flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-iados-primary/15 text-iados-primary flex items-center justify-center">
                <Icon size={20} />
              </div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Paso {i + 1}</div>
              <div className="text-sm font-semibold leading-snug">{step.titulo}</div>
              <div className="text-xs text-slate-400 leading-snug">{step.detalle}</div>
            </div>
            {i < steps.length - 1 && (
              <ArrowRight size={20} className="text-slate-600 shrink-0 hidden sm:block" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ConfigGrid({ items }: { items: ConfigHighlight[] }) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {items.map((item, i) => {
        const Icon = item.icon;
        const card = (
          <div className="bg-iados-card border border-slate-700 rounded-xl p-4 flex gap-3 h-full hover:border-iados-primary/50 transition-colors">
            <div className="w-9 h-9 shrink-0 rounded-lg bg-iados-primary/15 text-iados-primary flex items-center justify-center">
              <Icon size={18} />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm">{item.titulo}</div>
              <div className="text-xs text-slate-400 mt-0.5 leading-snug">{item.detalle}</div>
            </div>
          </div>
        );
        return item.ruta ? (
          <Link key={i} to={item.ruta}>{card}</Link>
        ) : (
          <div key={i}>{card}</div>
        );
      })}
    </div>
  );
}

export default function AyudaPage() {
  usePageHeader({ title: 'Ayuda', subtitle: 'Cómo usar el sistema y qué configurar según tu tipo de negocio', icon: HelpCircle });
  const [activo, setActivo] = useState<RubroId>('general');
  const rubro = RUBROS.find(r => r.id === activo)!;

  return (
    <div className="p-4 space-y-6 max-w-5xl">
      <div className="flex flex-wrap gap-1 border-b border-slate-700">
        {RUBROS.map(r => {
          const Icon = r.icon;
          return (
            <button
              key={r.id}
              onClick={() => setActivo(r.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                activo === r.id ? 'bg-iados-primary text-white' : 'text-slate-400 hover:text-white hover:bg-iados-card'
              }`}
            >
              <Icon size={15} />
              {r.label}
            </button>
          );
        })}
      </div>

      <div className="bg-iados-card rounded-2xl border border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-700 flex items-start gap-3">
          <rubro.icon size={20} className="text-iados-primary mt-0.5 shrink-0" />
          <p className="text-sm text-slate-300 leading-relaxed">{rubro.resumen}</p>
        </div>

        <div className="p-5 space-y-3 border-b border-slate-700">
          <h2 className="text-sm font-bold flex items-center gap-2 text-slate-200">
            <ArrowRight size={16} className="text-iados-primary" /> Flujo de proceso
          </h2>
          <div className="overflow-x-auto pb-1">
            <FlowDiagram steps={rubro.flujo} />
          </div>
        </div>

        <div className="p-5 space-y-3 border-b border-slate-700">
          <h2 className="text-sm font-bold flex items-center gap-2 text-slate-200">
            <Settings size={16} className="text-iados-primary" /> Configuración recomendada
          </h2>
          <ConfigGrid items={rubro.configuracion} />
        </div>

        <div className="p-5 space-y-2">
          <h2 className="text-sm font-bold flex items-center gap-2 text-slate-200">
            <Lightbulb size={16} className="text-iados-primary" /> Tips
          </h2>
          <ul className="space-y-1.5">
            {rubro.tips.map((tip, i) => (
              <li key={i} className="text-xs text-slate-400 flex gap-2">
                <span className="text-iados-primary shrink-0">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
