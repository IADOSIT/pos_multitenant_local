import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mantenimientoApi } from '../../api/endpoints';
import { useAuthStore } from '../../store/auth.store';
import { Rocket, X } from 'lucide-react';

/**
 * Aviso de version nueva en una instalacion en sitio.
 *
 * Solo avisa: no instala nada. El boton lleva a Mantenimiento > Este equipo,
 * donde se confirma y ahi se respalda, se ensaya y se aplica. Asi nunca se
 * actualiza a media venta sin que el encargado lo decida.
 *
 * En la nube /mantenimiento/estado responde on_premise:false (o 404) y esto
 * no se dibuja ni vuelve a preguntar.
 */
const REVISAR_CADA_MS = 6 * 60 * 60 * 1000;

export default function AvisoSincronizar({ oculto = false }: { oculto?: boolean }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [aviso, setAviso] = useState<{ nueva: string; actual: string } | null>(null);
  // "Despues" lo esconde hasta cerrar la pestana del navegador, no para siempre.
  const [descartada, setDescartada] = useState<string | null>(() => {
    try { return sessionStorage.getItem('aviso-sincronizar-descartado'); } catch { return null; }
  });

  const esAdmin = ['superadmin', 'admin'].includes(user?.rol || '');

  useEffect(() => {
    if (!esAdmin) return;
    let vivo = true;
    let reloj: number | null = null;

    const revisar = async () => {
      try {
        const { data } = await mantenimientoApi.actualizacion();
        if (!vivo) return;
        setAviso(data?.disponible && data.version_nueva
          ? { nueva: data.version_nueva, actual: data.version_actual }
          : null);
      } catch {
        /* sin internet o reiniciando: se intenta en la siguiente vuelta */
      }
    };

    mantenimientoApi.estado()
      .then(({ data }) => {
        if (!vivo || !data?.on_premise || !data?.actualizacion?.automatica_disponible) return;
        revisar();
        reloj = window.setInterval(revisar, REVISAR_CADA_MS);
      })
      .catch(() => { /* nube: no hay nada que avisar */ });

    return () => {
      vivo = false;
      if (reloj) window.clearInterval(reloj);
    };
  }, [esAdmin]);

  if (oculto || !esAdmin || !aviso || descartada === aviso.nueva) return null;

  const despues = () => {
    setDescartada(aviso.nueva);
    try { sessionStorage.setItem('aviso-sincronizar-descartado', aviso.nueva); } catch { /* sin almacenamiento */ }
  };

  return (
    <div className="bg-emerald-700/90 text-white px-4 py-2 text-sm flex items-center justify-center gap-x-3 gap-y-1 flex-wrap">
      <Rocket size={16} className="shrink-0" />
      <span>
        Hay una versión nueva: <strong>v{aviso.nueva}</strong>
        <span className="opacity-80"> (este equipo tiene la v{aviso.actual})</span>
        <span className="opacity-80"> · Sincroniza cuando no se esté cobrando; antes se respalda todo.</span>
      </span>
      <button
        onClick={() => navigate('/admin/mantenimiento?tab=equipo')}
        className="bg-white text-emerald-800 font-semibold text-xs px-3 py-1 rounded-lg shrink-0"
      >
        Sincronizar
      </button>
      <button
        onClick={despues}
        className="text-xs underline opacity-80 hover:opacity-100 shrink-0 flex items-center gap-1"
        aria-label="Recordar después"
      >
        <X size={12} /> Después
      </button>
    </div>
  );
}
