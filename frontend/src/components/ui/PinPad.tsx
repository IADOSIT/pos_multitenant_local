import { useState, useEffect } from 'react';
import { Delete } from 'lucide-react';

interface Props {
  onComplete: (pin: string) => void;
  loading?: boolean;
  error?: string | null;
  label?: string;
  digits?: number;
}

const PIN_LENGTH = 4;

export default function PinPad({ onComplete, loading = false, error, label, digits: pinLength = PIN_LENGTH }: Props) {
  const [digits, setDigits] = useState<string[]>([]);

  // Limpiar dígitos cuando llega un error (PIN incorrecto)
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setDigits([]), 600);
      return () => clearTimeout(t);
    }
  }, [error]);

  // Auto-submit al completar (solo cuando cambian los dígitos)
  useEffect(() => {
    if (digits.length === pinLength) {
      onComplete(digits.join(''));
    }
  }, [digits]);

  const press = (d: string) => {
    if (loading || digits.length >= pinLength) return;
    setDigits((prev) => [...prev, d]);
  };

  const del = () => {
    if (loading) return;
    setDigits((prev) => prev.slice(0, -1));
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div className="flex flex-col items-center gap-5 select-none">
      {label && <p className="text-slate-400 text-sm text-center px-4">{label}</p>}

      {/* Indicador de dígitos */}
      <div className="flex gap-4">
        {Array.from({ length: pinLength }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
              digits.length > i
                ? error
                  ? 'bg-red-500 border-red-500'
                  : 'bg-iados-primary border-iados-primary scale-110'
                : 'border-slate-500'
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-red-400 text-sm font-medium text-center animate-shake">
          {error}
        </p>
      )}

      {loading && !error && (
        <p className="text-slate-400 text-sm animate-pulse">Verificando...</p>
      )}

      {/* Teclado numérico */}
      <div className="grid grid-cols-3 gap-3">
        {keys.map((k, i) => {
          if (k === '') return <div key={i} />;

          if (k === 'del') {
            return (
              <button
                key={i}
                onClick={del}
                disabled={loading || digits.length === 0}
                className="w-20 h-20 rounded-2xl bg-iados-card text-slate-400 flex items-center justify-center active:scale-90 active:bg-iados-surface transition-all disabled:opacity-30 touch-manipulation"
              >
                <Delete size={22} />
              </button>
            );
          }

          return (
            <button
              key={i}
              onClick={() => press(k)}
              disabled={loading || digits.length >= pinLength}
              className="w-20 h-20 rounded-2xl bg-iados-card hover:bg-iados-surface text-2xl font-bold active:scale-90 active:bg-iados-primary transition-all disabled:opacity-30 touch-manipulation"
            >
              {k}
            </button>
          );
        })}
      </div>
    </div>
  );
}
