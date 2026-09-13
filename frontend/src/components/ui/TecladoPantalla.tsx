import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowBigUp, CornerDownLeft, Delete, Keyboard } from 'lucide-react';
import { useTecladoStore, tecladoHabilitado } from '../../store/teclado.store';

/**
 * Teclado en pantalla para TODO el POS.
 *
 * Se monta una sola vez en MainLayout y escucha el foco del documento: cualquier
 * input o textarea de cualquier pantalla interna lo levanta, sin tener que tocar
 * pantalla por pantalla. Las vistas publicas (kiosko, menu QR, self-order) cuelgan
 * fuera de MainLayout, asi que no se ven afectadas.
 *
 * Como escribe en el input: se usa el setter nativo de `value` + un evento `input`
 * sintetico; asi React ve el cambio y los componentes controlados se enteran igual
 * que si el cajero hubiera tecleado.
 *
 * Para excluir un campo: `data-sin-teclado` en el input o en cualquier contenedor.
 */

const FILAS: string[][] = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '-'],
];
// Fila de apoyo: acentos del español y los simbolos que mas se usan al capturar
// correos, claves y SKUs. Evita tener que inventar una tecla de simbolos.
const ACENTOS = ['á', 'é', 'í', 'ó', 'ú', 'ü', '@', '_', '/', '#'];

const NUMERICO: string[][] = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['0', '00', '.'],
];

type Campo = HTMLInputElement | HTMLTextAreaElement;

const TIPOS_TEXTO = new Set(['text', 'search', 'tel', 'email', 'url', 'password', 'number', '']);

function elegible(el: EventTarget | null): Campo | null {
  if (!el || !(el instanceof HTMLElement)) return null;
  const esInput = el instanceof HTMLInputElement;
  if (!esInput && !(el instanceof HTMLTextAreaElement)) return null;
  const campo = el as Campo;
  if (campo.readOnly || campo.disabled) return null;
  if (campo.closest('[data-sin-teclado]')) return null;
  if (esInput && !TIPOS_TEXTO.has((campo as HTMLInputElement).type)) return null;
  return campo;
}

/** Un campo de dinero/cantidad merece el teclado numerico grande, no el QWERTY. */
function esNumerico(campo: Campo): boolean {
  if (campo.dataset.teclado === 'numerico') return true;
  if (campo.dataset.teclado === 'texto') return false;
  if (campo instanceof HTMLInputElement && campo.type === 'number') return true;
  const im = campo.getAttribute('inputmode');
  return im === 'numeric' || im === 'decimal';
}

function rangoSeleccion(campo: Campo): [number, number] {
  try {
    const { selectionStart: s, selectionEnd: e } = campo;
    if (s !== null && e !== null) return [s, e];
  } catch { /* type=number no expone seleccion en algunos navegadores */ }
  return [campo.value.length, campo.value.length];
}

function escribirEnCampo(campo: Campo, valor: string, caret: number) {
  const proto = campo instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (setter) setter.call(campo, valor); else campo.value = valor;
  campo.dispatchEvent(new Event('input', { bubbles: true }));
  try { campo.setSelectionRange(caret, caret); } catch { /* idem type=number */ }
}

export default function TecladoPantalla() {
  const modo = useTecladoStore((s) => s.modo);
  const fisicoDetectado = useTecladoStore((s) => s.fisicoDetectado);
  const marcarFisico = useTecladoStore((s) => s.marcarFisico);
  const habilitado = tecladoHabilitado(modo, fisicoDetectado);

  const [abierto, setAbierto] = useState(false);
  const [numerico, setNumerico] = useState(false);
  const [mayus, setMayus] = useState(false);
  const campoRef = useRef<Campo | null>(null);
  // inputmode original del campo, para restaurarlo al soltarlo.
  const inputModeOriginal = useRef<string | null>(null);

  const soltarCampo = useCallback(() => {
    const campo = campoRef.current;
    if (campo) {
      if (inputModeOriginal.current === null) campo.removeAttribute('inputmode');
      else campo.setAttribute('inputmode', inputModeOriginal.current);
    }
    campoRef.current = null;
    inputModeOriginal.current = null;
    setAbierto(false);
    setMayus(false);
  }, []);

  const tomarCampo = useCallback((campo: Campo) => {
    if (campoRef.current === campo) return;
    soltarCampo();
    campoRef.current = campo;
    inputModeOriginal.current = campo.getAttribute('inputmode');
    // Evita que ademas salga el teclado nativo del sistema (tablets) y salgan dos.
    campo.setAttribute('inputmode', 'none');
    setNumerico(esNumerico(campo));
    setAbierto(true);
    // El teclado ocupa la parte baja: dejamos el campo a la vista.
    setTimeout(() => campo.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60);
  }, [soltarCampo]);

  // Foco: decide si el teclado se abre, cambia de campo o se cierra.
  useEffect(() => {
    if (!habilitado) { soltarCampo(); return; }
    let ultimoToque = 0;
    const onPointerDown = () => { ultimoToque = Date.now(); };
    const onFocusIn = (e: FocusEvent) => {
      const campo = elegible(e.target);
      if (!campo) { soltarCampo(); return; }
      // Muchas pantallas enfocan su buscador solas al abrir (el POS, por ejemplo):
      // ahi el teclado taparia media pantalla sin que nadie lo pidiera. Solo sube
      // si el cajero toco el campo, o si ya estaba arriba y el foco salto a otro.
      if (!campoRef.current && Date.now() - ultimoToque > 1000) return;
      tomarCampo(campo);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [habilitado, tomarCampo, soltarCampo]);

  // Si el equipo tactil ademas tiene teclado fisico, el de pantalla estorba: se
  // apaga solo en cuanto detecta que alguien esta tecleando de verdad.
  //
  // El lector de codigo de barras tambien manda teclas, pero en rafaga (decenas de
  // ms entre una y otra); una persona no pasa de ~8 caracteres por segundo. Por eso
  // solo cuentan las teclas separadas mas de 80 ms, y hacen falta tres.
  useEffect(() => {
    let ultima = 0;
    let humanas = 0;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.isTrusted || e.ctrlKey || e.altKey || e.metaKey || e.key.length !== 1) return;
      const t = e.timeStamp || Date.now();
      const delta = t - ultima;
      ultima = t;
      if (delta < 80) { humanas = 0; return; }
      if (++humanas >= 3) marcarFisico();
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [marcarFisico]);

  function insertar(txt: string) {
    const campo = campoRef.current;
    if (!campo) return;
    const [ini, fin] = rangoSeleccion(campo);
    const v = campo.value;
    escribirEnCampo(campo, v.slice(0, ini) + txt + v.slice(fin), ini + txt.length);
    if (mayus) setMayus(false);
  }

  function borrar() {
    const campo = campoRef.current;
    if (!campo) return;
    const [ini, fin] = rangoSeleccion(campo);
    const v = campo.value;
    if (ini !== fin) escribirEnCampo(campo, v.slice(0, ini) + v.slice(fin), ini);
    else if (ini > 0) escribirEnCampo(campo, v.slice(0, ini - 1) + v.slice(ini), ini - 1);
  }

  function enter() {
    const campo = campoRef.current;
    if (!campo) return;
    const ev = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true });
    const sinCancelar = campo.dispatchEvent(ev);
    campo.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }));
    // Igual que el Enter nativo: solo envia el formulario si nadie freno la tecla.
    if (sinCancelar && campo instanceof HTMLInputElement) {
      const form = campo.form;
      if (form?.querySelector('button[type="submit"], input[type="submit"]')) form.requestSubmit?.();
    }
  }

  if (!habilitado || !abierto) return null;

  const teclaBase =
    'rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold active:scale-95 transition-transform select-none';

  return (
    <div
      // Sin preventDefault el input pierde el foco al tocar una tecla y se cierra solo.
      onMouseDown={(e) => e.preventDefault()}
      className="fixed inset-x-0 bottom-0 z-[9999] bg-slate-900/98 backdrop-blur border-t border-slate-700 p-2 md:p-3 shadow-[0_-8px_30px_rgba(0,0,0,0.5)]"
    >
      <div className="mx-auto w-full max-w-[1100px] space-y-1.5 md:space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Keyboard size={12} /> Teclado en pantalla
          </span>
          <button onClick={() => setNumerico((n) => !n)} className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded">
            {numerico ? 'ABC' : '123'}
          </button>
        </div>

        {numerico ? (
          <div className="flex justify-center gap-2">
            <div className="grid grid-cols-3 gap-1.5 md:gap-2 w-full max-w-[420px]">
              {NUMERICO.flat().map((k) => (
                <button key={k} onClick={() => insertar(k)} className={`${teclaBase} h-12 md:h-14 text-xl`}>{k}</button>
              ))}
            </div>
            <div className="flex flex-col gap-1.5 md:gap-2 w-24 md:w-32">
              <button onClick={borrar} className={`${teclaBase} flex-1 flex items-center justify-center`}><Delete size={22} /></button>
              <button onClick={enter} className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center active:scale-95 transition-transform">
                <CornerDownLeft size={22} />
              </button>
              <button onClick={soltarCampo} className="h-11 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold">Listo</button>
            </div>
          </div>
        ) : (
          <>
            {FILAS.map((fila, i) => (
              <div key={i} className="flex justify-center gap-1 md:gap-2">
                {fila.map((k) => (
                  <button
                    key={k}
                    onClick={() => insertar(mayus ? k.toUpperCase() : k)}
                    className={`${teclaBase} flex-1 basis-0 min-w-0 max-w-[96px] h-10 md:h-12 text-base md:text-lg`}
                  >
                    {mayus ? k.toUpperCase() : k}
                  </button>
                ))}
              </div>
            ))}
            <div className="flex justify-center gap-1 md:gap-2">
              {ACENTOS.map((k) => (
                <button
                  key={k}
                  onClick={() => insertar(mayus ? k.toUpperCase() : k)}
                  className={`${teclaBase} flex-1 basis-0 min-w-0 max-w-[96px] h-9 md:h-10 text-sm md:text-base`}
                >
                  {mayus ? k.toUpperCase() : k}
                </button>
              ))}
            </div>
            <div className="flex justify-center gap-1 md:gap-2">
              <button
                onClick={() => setMayus((m) => !m)}
                className={`flex-1 basis-0 min-w-0 max-w-[120px] h-11 rounded-lg font-bold flex items-center justify-center active:scale-95 transition-transform ${
                  mayus ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-100'
                }`}
              >
                <ArrowBigUp size={20} />
              </button>
              <button onClick={() => insertar(' ')} className={`${teclaBase} flex-1 basis-0 min-w-0 max-w-[520px] h-11 text-sm`}>Espacio</button>
              <button onClick={borrar} className={`${teclaBase} flex-1 basis-0 min-w-0 max-w-[120px] h-11 flex items-center justify-center`}>
                <Delete size={20} />
              </button>
              <button onClick={enter} className="flex-1 basis-0 min-w-0 max-w-[120px] h-11 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center active:scale-95 transition-transform">
                <CornerDownLeft size={20} />
              </button>
              <button onClick={soltarCampo} className="flex-1 basis-0 min-w-0 max-w-[140px] h-11 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm">
                Listo
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
