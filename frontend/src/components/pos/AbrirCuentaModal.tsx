import { useState } from 'react';
import { X, BookOpen, CreditCard } from 'lucide-react';

interface Props {
  mesaInicial?: number | null;
  tipoServicio?: 'en_sitio' | 'para_llevar';
  datosEnvioEnabled?: boolean;
  onClose: () => void;
  onAbrirCuenta: (mesa: number, cliente: string, telefono: string, direccion: string) => void;
  onCobrar: (mesa: number, cliente: string, telefono: string, direccion: string) => void;
}

export default function AbrirCuentaModal({ mesaInicial, tipoServicio, datosEnvioEnabled, onClose, onAbrirCuenta, onCobrar }: Props) {
  const [mesa, setMesa] = useState<string>(mesaInicial ? String(mesaInicial) : '');
  const [cliente, setCliente] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [loading, setLoading] = useState(false);

  const mesaNum = Number(mesa);
  const canSubmit = mesaNum > 0;
  const mostrarDatosEnvio = datosEnvioEnabled && tipoServicio === 'para_llevar';

  const handleAbrirCuenta = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await onAbrirCuenta(mesaNum, cliente.trim(), telefono.trim(), direccion.trim());
    } finally {
      setLoading(false);
    }
  };

  const handleCobrar = () => {
    if (!canSubmit) return;
    onCobrar(mesaNum, cliente.trim(), telefono.trim(), direccion.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="card max-w-sm w-full space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen size={20} className="text-iados-secondary" />
            Abrir Cuenta
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-iados-card rounded-xl">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Mesa <span className="text-red-400">*</span></label>
            <input
              type="number"
              min="1"
              value={mesa}
              onChange={(e) => setMesa(e.target.value)}
              placeholder="Número de mesa"
              className="input-touch text-center text-2xl font-bold"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1 block">Cliente <span className="text-slate-500">(opcional)</span></label>
            <input
              type="text"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Nombre del cliente"
              className="input-touch"
            />
          </div>

          {mostrarDatosEnvio && (
            <>
              <div>
                <label className="text-sm text-orange-400 mb-1 block">🥡 Teléfono <span className="text-slate-500">(opcional)</span></label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Teléfono de contacto"
                  className="input-touch"
                  maxLength={20}
                />
              </div>
              <div>
                <label className="text-sm text-orange-400 mb-1 block">Dirección de entrega <span className="text-slate-500">(opcional)</span></label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Calle, número, colonia..."
                  className="input-touch"
                  maxLength={200}
                />
              </div>
            </>
          )}
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={handleAbrirCuenta}
            disabled={!canSubmit || loading}
            className="btn-secondary w-full flex items-center justify-center gap-2 text-base disabled:opacity-50"
          >
            <BookOpen size={18} />
            {loading ? 'Abriendo...' : 'Abrir Cuenta (sin cobrar)'}
          </button>

          <button
            onClick={handleCobrar}
            disabled={!canSubmit || loading}
            className="btn-accent w-full flex items-center justify-center gap-2 text-base disabled:opacity-50"
          >
            <CreditCard size={18} />
            Cobrar Ahora
          </button>

          <button onClick={onClose} className="w-full py-2 text-sm text-slate-400 hover:text-slate-200">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
