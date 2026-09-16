import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import toast from 'react-hot-toast';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { usePOSStore } from './store/pos.store';
import { useSyncStore } from './store/sync.store';
import { hayConexion } from './api/conexion';
import './index.css';
import './store/theme.store'; // initialize theme on load

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);

// PWA: la versión nueva se descarga en segundo plano; cuando está lista, avisamos
// con un botón "Actualizar" (no se recarga solo para no interrumpir una venta en el POS).
// Pantallas de venta donde NO conviene recargar solo (puede haber una venta en curso).
const esPantallaDeVenta = () => /^\/(pos|kiosco|bascula-kiosko)(\/|$)/.test(window.location.pathname);

// Cada cuanto se le pregunta al servidor si hay version nueva. Sin esto, una PWA
// instalada que se deja abierta todo el dia puede tardar dias en enterarse de un
// deploy: el navegador solo revisa el service worker al navegar o cada 24 h, y en
// una caja nadie navega — la pantalla se queda en el POS.
const REVISAR_VERSION_MS = 30 * 60 * 1000;

// El POS esta ocioso cuando no hay nada que se pueda perder al recargar: sin
// carrito y sin una subida de ventas en curso (la cola vive en IndexedDB, asi que
// recargar no la toca, pero cortar la subida a medias no aporta nada).
const posOcioso = () =>
  usePOSStore.getState().cart.length === 0 && !useSyncStore.getState().sincronizando;

let reintentoActualizar: ReturnType<typeof setInterval> | null = null;

const updateSW = registerSW({
  onRegisteredSW(_url, registro) {
    if (!registro) return;
    const revisar = () => { if (hayConexion()) registro.update().catch(() => {}); };
    setInterval(revisar, REVISAR_VERSION_MS);
    // Volver a la pestana/ventana es el momento natural para enterarse.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') revisar();
    });
    window.addEventListener('conexion:cambio', revisar);
  },
  onNeedRefresh() {
    if (!esPantallaDeVenta()) {
      // Fuera del POS: actualizar solo (con un aviso breve para que se note por qué recarga).
      toast.loading('Actualizando a la nueva versión…', { id: 'pwa-update', duration: 2500 });
      setTimeout(() => updateSW(true), 1200);
      return;
    }
    // Dentro del POS/kiosko: no interrumpir una venta. Queda el boton manual, y
    // ademas se aplica sola en cuanto el POS quede ocioso (carrito vacio): si no,
    // una caja que nunca sale del POS se queda con la version vieja para siempre.
    if (!reintentoActualizar) {
      reintentoActualizar = setInterval(() => {
        if (!posOcioso()) return;
        clearInterval(reintentoActualizar!);
        reintentoActualizar = null;
        toast.dismiss('pwa-update');
        updateSW(true);
      }, 20000);
    }
    toast(
      (t) => (
        <span className="flex items-center gap-3">
          Hay una versión nueva.
          <button
            onClick={() => { toast.dismiss(t.id); updateSW(true); }}
            className="px-3 py-1 rounded-lg bg-iados-primary text-white text-sm font-semibold"
          >
            Actualizar
          </button>
        </span>
      ),
      { duration: Infinity, id: 'pwa-update' },
    );
  },
});
