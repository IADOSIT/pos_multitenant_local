import { useDeployStore } from '../store/deploy.store';

// Aviso global flotante cuando hay una actualización en progreso. La versión/build se
// muestra en el sidebar (ver MainLayout). El poll vive en el deploy.store (compartido).
export default function DeployWatermark() {
  const estado = useDeployStore((s) => s.estado);
  if (estado !== 'en_progreso') return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9998] pointer-events-none flex justify-center">
      <span className="pointer-events-auto mb-6 rounded-full bg-amber-500/90 text-black text-xs font-semibold px-3 py-1 shadow-lg animate-pulse">
        Actualización en progreso…
      </span>
    </div>
  );
}
