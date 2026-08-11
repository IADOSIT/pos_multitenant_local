import { useEffect, useState } from 'react';
import { deployApi } from '../api/endpoints';

// Marca de agua de versión + estado de despliegue. La versión es autoritativa (viene de
// la BD vía /deploy/version, NO del build local). Si hay una actualización en progreso,
// se muestra un aviso. `build` es el sello del bundle del frontend (para detectar caché
// vieja del PWA aunque la BD ya reporte otra versión).
type Estado = 'en_progreso' | 'completada';

export default function DeployWatermark() {
  const [version, setVersion] = useState<string>('');
  const [estado, setEstado] = useState<Estado | ''>('');

  useEffect(() => {
    let activo = true;
    const cargar = () => {
      deployApi.version()
        .then(({ data }) => {
          if (!activo) return;
          setVersion(data?.version || '');
          setEstado((data?.estado as Estado) || '');
        })
        .catch(() => { /* silencioso: no romper la UI por esto */ });
    };
    cargar();
    const t = setInterval(cargar, 60000); // revalida cada 60s
    return () => { activo = false; clearInterval(t); };
  }, []);

  const buildId = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : '';

  return (
    <>
      {estado === 'en_progreso' && (
        <div className="fixed bottom-0 left-0 right-0 z-[9998] pointer-events-none flex justify-center">
          <span className="pointer-events-auto mb-6 rounded-full bg-amber-500/90 text-black text-xs font-semibold px-3 py-1 shadow-lg animate-pulse">
            Actualización en progreso…
          </span>
        </div>
      )}
      <div className="fixed bottom-0.5 right-1.5 z-[9999] pointer-events-none select-none font-mono text-[10px] leading-none text-slate-400/50">
        {version ? `v${version} · ` : ''}build {buildId}
      </div>
    </>
  );
}
