import {
  ShoppingCart, LayoutDashboard, ClipboardList, CreditCard, FileBarChart,
  Warehouse, BookOpen, Grid3X3, Users, Store, Settings, Building2, HelpCircle,
  Activity,
} from 'lucide-react';

export interface NavItem {
  to: string;
  icon: any;
  label: string;
  roles: string[];
  badge?: boolean;
}

// Fuente unica del menu lateral. Vivia dentro de MainLayout; se extrajo para que
// el monitor pueda traducir rutas a nombres legibles sin mantener un segundo
// diccionario que se desincronice.
export const navItems: NavItem[] = [
  { to: '/pos',                   icon: ShoppingCart,    label: 'POS',        roles: ['superadmin', 'admin', 'manager', 'cajero', 'mesero'] },
  { to: '/dashboard',             icon: LayoutDashboard, label: 'Dashboard',  roles: ['superadmin', 'admin', 'manager', 'cajero'] },
  { to: '/pedidos',               icon: ClipboardList,   label: 'Pedidos',    roles: ['superadmin', 'admin', 'manager', 'cajero', 'mesero'], badge: true },
  { to: '/caja',                  icon: CreditCard,      label: 'Caja',       roles: ['superadmin', 'admin', 'manager', 'cajero'] },
  { to: '/reportes',              icon: FileBarChart,    label: 'Reportes',   roles: ['superadmin', 'admin', 'manager', 'cajero'] },
  { to: '/inventario',            icon: Warehouse,       label: 'Inventario', roles: ['superadmin', 'admin', 'manager', 'cajero'] },
  { to: '/catalogos',             icon: BookOpen,        label: 'Catalogos',  roles: ['superadmin', 'admin'] },
  { to: '/admin/mesas',           icon: Grid3X3,         label: 'Mesas',      roles: ['superadmin', 'admin'] },
  { to: '/admin/usuarios',        icon: Users,           label: 'Usuarios',   roles: ['superadmin', 'admin'] },
  { to: '/admin/tienda-en-linea', icon: Store,           label: 'Tienda en Línea', roles: ['superadmin', 'admin'] },
  { to: '/admin/configuracion',   icon: Settings,        label: 'Config',     roles: ['superadmin', 'admin'] },
  { to: '/admin/tenants',         icon: Building2,       label: 'Tenants',    roles: ['superadmin'] },
  { to: '/superadmin/monitor',    icon: Activity,        label: 'Monitor',    roles: ['superadmin'] },
  { to: '/ayuda',                 icon: HelpCircle,      label: 'Ayuda',      roles: ['superadmin', 'admin', 'manager', 'cajero', 'mesero'] },
];

const ETIQUETAS = new Map(navItems.map(i => [i.to, i.label]));

/** Nombre legible de una ruta. Las que no estan en el menu se muestran crudas. */
export function etiquetaDeRuta(ruta: string): string {
  return ETIQUETAS.get(ruta) ?? ruta;
}
