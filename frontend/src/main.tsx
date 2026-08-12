import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import toast from 'react-hot-toast';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
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

const updateSW = registerSW({
  onNeedRefresh() {
    if (!esPantallaDeVenta()) {
      // Fuera del POS: actualizar solo (con un aviso breve para que se note por qué recarga).
      toast.loading('Actualizando a la nueva versión…', { id: 'pwa-update', duration: 2500 });
      setTimeout(() => updateSW(true), 1200);
      return;
    }
    // Dentro del POS/kiosko: no interrumpir; botón manual para actualizar cuando convenga.
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
