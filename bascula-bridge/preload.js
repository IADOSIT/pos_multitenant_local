// Puente seguro entre la ventana de configuracion y el proceso principal.
// La ventana corre con contextIsolation y sin acceso a Node: solo puede llamar
// estas funciones concretas, nada mas.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bridge', {
  listarPuertos: () => ipcRenderer.invoke('listar-puertos'),
  obtenerEstado: () => ipcRenderer.invoke('obtener-estado'),
  detectar: (datos) => ipcRenderer.invoke('detectar', datos),
  guardar: (datos) => ipcRenderer.invoke('guardar', datos),
  abrirLog: () => ipcRenderer.invoke('abrir-log'),
  onEstado: (cb) => ipcRenderer.on('estado', (_e, data) => cb(data)),
});
