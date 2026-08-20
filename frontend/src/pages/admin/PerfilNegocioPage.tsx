import { useState, useEffect } from 'react';
import { Flame, Snowflake, Layers, CheckCircle, XCircle, RefreshCw, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { perfilesApi, usersApi } from '../../api/endpoints';

const ICONO_MAP: Record<string, any> = { Flame, Snowflake };

export default function PerfilNegocioPage() {
  const [perfilActivo, setPerfilActivo] = useState<any>(null);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activando, setActivando] = useState(false);
  const [desactivando, setDesactivando] = useState(false);
  const [updatingUser, setUpdatingUser] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rPerfil, rUsers] = await Promise.all([
        perfilesApi.getActivo(),
        usersApi.list(),
      ]);
      setPerfilActivo(rPerfil.data);
      setUsuarios(rUsers.data || []);
    } catch {
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleActivar = async () => {
    setActivando(true);
    try {
      await perfilesApi.activar('carbon_hielo');
      toast.success('Perfil activado. Se crearon las categorías y productos base.');
      loadData();
    } catch {
      toast.error('Error al activar el perfil');
    } finally {
      setActivando(false);
    }
  };

  const handleDesactivar = async () => {
    if (!perfilActivo) return;
    setDesactivando(true);
    try {
      await perfilesApi.desactivar(perfilActivo.clave);
      toast.success('Perfil desactivado');
      loadData();
    } catch {
      toast.error('Error al desactivar el perfil');
    } finally {
      setDesactivando(false);
    }
  };

  const handleUpdateModulo = async (userId: number, modulo: string | null) => {
    setUpdatingUser(userId);
    try {
      await usersApi.update(userId, { modulo });
      setUsuarios((prev) => prev.map((u) => u.id === userId ? { ...u, modulo } : u));
      toast.success('Módulo actualizado');
    } catch {
      toast.error('Error actualizando módulo');
    } finally {
      setUpdatingUser(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  const modulos: string[] = perfilActivo?.config?.modulos || [];
  const modulosConfig: Record<string, any> = perfilActivo?.config?.modulos_config || {};
  const rolesConModulo = ['cajero', 'mesero'];

  return (
    <div className="p-4 space-y-6 max-w-3xl">
      {/* Card perfil carbon_hielo */}
      <div className="bg-iados-card rounded-2xl border border-slate-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold">Carbón + Hielo</span>
              {perfilActivo ? (
                <span className="bg-green-800 text-green-300 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle size={10} /> Activo
                </span>
              ) : (
                <span className="bg-slate-700 text-slate-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                  <XCircle size={10} /> Inactivo
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              Inventario dual por módulo para negocios de carbón y hielo
            </p>
          </div>
          <div className="flex gap-2">
            {perfilActivo ? (
              <button
                onClick={handleDesactivar}
                disabled={desactivando}
                className="px-3 py-1.5 rounded-lg border border-slate-600 text-slate-300 text-sm hover:border-red-600 hover:text-red-400 disabled:opacity-50"
              >
                {desactivando ? 'Desactivando...' : 'Desactivar'}
              </button>
            ) : (
              <button
                onClick={handleActivar}
                disabled={activando}
                className="px-3 py-1.5 rounded-lg bg-iados-primary text-white text-sm hover:opacity-80 disabled:opacity-50"
              >
                {activando ? 'Activando...' : 'Activar Perfil'}
              </button>
            )}
          </div>
        </div>

        {/* Módulos */}
        {perfilActivo && modulos.length > 0 && (
          <div className="px-5 py-4 border-b border-slate-700">
            <h3 className="text-xs text-slate-400 uppercase font-semibold mb-3">Módulos</h3>
            <div className="flex gap-3">
              {modulos.map((m) => {
                const cfg = modulosConfig[m] || {};
                const Icon = ICONO_MAP[cfg.icono] || Layers;
                return (
                  <div
                    key={m}
                    className="flex items-center gap-2 bg-iados-surface rounded-xl px-4 py-2 border border-slate-700"
                  >
                    <Icon size={16} style={{ color: cfg.color }} />
                    <span className="font-medium text-sm">{cfg.label || m}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Usuarios por módulo */}
        {perfilActivo && (
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Users size={14} className="text-slate-400" />
              <h3 className="text-xs text-slate-400 uppercase font-semibold">Usuarios por Módulo</h3>
            </div>
            <div className="space-y-2">
              {usuarios
                .filter((u) => rolesConModulo.includes(u.rol))
                .map((u) => (
                  <div key={u.id} className="flex items-center justify-between bg-iados-surface rounded-lg px-3 py-2">
                    <div>
                      <div className="text-sm font-medium">{u.nombre}</div>
                      <div className="text-xs text-slate-500">{u.email} · {u.rol}</div>
                    </div>
                    <select
                      value={u.modulo || ''}
                      onChange={(e) => handleUpdateModulo(u.id, e.target.value || null)}
                      disabled={updatingUser === u.id}
                      className="bg-iados-card border border-slate-600 rounded-lg px-2 py-1 text-xs disabled:opacity-50 min-w-[120px]"
                    >
                      <option value="">— Todos —</option>
                      {modulos.map((m) => (
                        <option key={m} value={m}>{modulosConfig[m]?.label || m}</option>
                      ))}
                    </select>
                  </div>
                ))}
              {usuarios.filter((u) => rolesConModulo.includes(u.rol)).length === 0 && (
                <p className="text-slate-500 text-sm py-2">No hay cajeros o meseros en este tenant.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Nota si no hay perfil activo */}
      {!perfilActivo && (
        <div className="bg-iados-card rounded-xl border border-slate-700 px-5 py-4 text-sm text-slate-400">
          Activa el perfil <strong className="text-white">Carbón + Hielo</strong> para habilitar el inventario dual,
          las categorías y los productos base predefinidos.
        </div>
      )}
    </div>
  );
}
