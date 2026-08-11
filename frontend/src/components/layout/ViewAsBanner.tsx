import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { useAdminContextStore } from '../../store/adminContext.store';
import { tiendasApi } from '../../api/endpoints';
import { Building2, X } from 'lucide-react';

// Selector global "ver como tienda", solo para superadmin. Al elegir una tienda, TODO el
// resto del app (POS, Dashboard, Productos, Caja, Config, etc.) empieza a operar sobre esa
// tienda especifica — ver src/store/adminContext.store.ts y src/api/client.ts.
export default function ViewAsBanner() {
  const { user } = useAuthStore();
  const { viewAs, setViewAs, loadFromStorage } = useAdminContextStore();
  const [tiendas, setTiendas] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { loadFromStorage(); }, []);

  useEffect(() => {
    if (user?.rol === 'superadmin' && !loaded) {
      tiendasApi.list().then(({ data }) => { setTiendas(data || []); setLoaded(true); }).catch(() => {});
    }
  }, [user?.rol, loaded]);

  if (user?.rol !== 'superadmin') return null;

  const handleChange = (tiendaId: string) => {
    if (!tiendaId) {
      setViewAs(null);
      window.location.reload();
      return;
    }
    const t = tiendas.find((x) => String(x.id) === tiendaId);
    if (!t) return;
    setViewAs({ tienda_id: t.id, empresa_id: t.empresa_id, tenant_id: t.tenant_id, nombre: t.nombre });
    window.location.reload();
  };

  return (
    <div className={`flex items-center gap-2 px-4 py-1.5 text-xs border-t shrink-0 ${viewAs ? 'bg-purple-900/40 border-purple-600/60 text-purple-100' : 'bg-amber-900/40 border-amber-600/60 text-amber-100'}`}>
      <Building2 size={13} className="shrink-0" />
      {viewAs ? (
        <>
          <span>Viendo como: <strong>{viewAs.nombre}</strong> — POS, Dashboard, Productos, etc. muestran solo esta tienda.</span>
          <button onClick={() => handleChange('')} className="ml-auto flex items-center gap-1 hover:text-white underline shrink-0">
            <X size={12} /> Salir
          </button>
        </>
      ) : (
        <>
          <span>Vista superadmin (sin tienda seleccionada — POS/Dashboard/Productos no muestran datos de ninguna tienda).</span>
          <select
            onChange={(e) => handleChange(e.target.value)}
            defaultValue=""
            className="ml-auto bg-iados-card border border-slate-600 rounded-lg px-2 py-1 text-xs shrink-0"
          >
            <option value="">Elegir tienda...</option>
            {tiendas.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}
