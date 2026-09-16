import { Component, ErrorInfo, ReactNode } from 'react';
import { CloudOff, RefreshCw } from 'lucide-react';

/**
 * Red de seguridad de toda la app.
 *
 * Cada pantalla es su propio chunk (`lazy()` en App.tsx). Si una no esta en la
 * cache del service worker y no hay internet, el `import()` revienta; sin este
 * limite React desmonta el arbol entero y el cajero ve una pantalla en blanco,
 * sin siquiera el menu para irse a otro lado. Aqui al menos se le dice que pasa
 * y se le deja volver al POS, que si funciona sin internet.
 */
interface Props { children: ReactNode }
interface State { error: Error | null }

function esErrorDeDescarga(err: Error | null): boolean {
  const m = `${err?.message || ''} ${err?.name || ''}`.toLowerCase();
  return m.includes('dynamically imported module')
    || m.includes('loading chunk')
    || m.includes('importing a module script failed')
    || m.includes('failed to fetch');
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Sin servicio de errores externo: queda en consola para soporte.
    console.error('[POS] pantalla caida:', error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const sinRed = esErrorDeDescarga(error);
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 p-6 text-center bg-slate-900 text-slate-200">
        <CloudOff size={48} className="text-amber-400" />
        <h1 className="text-xl font-semibold">
          {sinRed ? 'Esta pantalla no se pudo abrir sin internet' : 'Algo salió mal en esta pantalla'}
        </h1>
        <p className="max-w-md text-sm text-slate-400">
          {sinRed
            ? 'Es la primera vez que se abre en este equipo, así que hace falta internet para descargarla. El punto de venta sí funciona sin conexión.'
            : 'El resto del sistema sigue funcionando. Puedes volver al punto de venta e intentar de nuevo.'}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-semibold"
          >
            <RefreshCw size={16} /> Reintentar
          </button>
          <button
            onClick={() => { window.location.href = '/pos'; }}
            className="px-4 py-2 rounded-lg bg-iados-primary text-white text-sm font-semibold"
          >
            Ir al punto de venta
          </button>
        </div>
        <span className="text-[11px] text-slate-600 max-w-md break-words">{error.message}</span>
      </div>
    );
  }
}
