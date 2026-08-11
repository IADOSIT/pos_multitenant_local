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
const updateSW = registerSW({
  onNeedRefresh() {
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
