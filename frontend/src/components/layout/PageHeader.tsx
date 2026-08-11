import { usePageHeaderStore } from '../../store/pageHeader.store';

// Header estandarizado para las pantallas admin: barra de ancho completo con
// icono + título + subtítulo a la izquierda y una toolbar de acciones a la derecha.
// Recibe un fallback (título por ruta) para cuando la pantalla aún no fija su header.
export default function PageHeader({ fallbackTitle }: { fallbackTitle?: string }) {
  const config = usePageHeaderStore((s) => s.config);
  const title = config?.title || fallbackTitle;
  if (!title) return null;
  const Icon = config?.icon;

  return (
    <header className="shrink-0 w-full bg-iados-surface/60 border-b border-slate-700 px-4 md:px-6 h-16 flex items-center gap-3">
      {Icon && (
        <div className="w-9 h-9 rounded-xl bg-iados-primary/15 text-iados-secondary flex items-center justify-center shrink-0">
          <Icon size={18} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-base md:text-lg font-bold text-white leading-tight truncate">{title}</h1>
        {config?.subtitle && <p className="text-xs text-slate-400 leading-tight truncate">{config.subtitle}</p>}
      </div>
      {config?.actions && <div className="flex items-center gap-2 shrink-0">{config.actions}</div>}
    </header>
  );
}
