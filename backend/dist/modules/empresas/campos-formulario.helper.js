"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultCamposFormulario = getDefaultCamposFormulario;
exports.resolveCamposFormulario = resolveCamposFormulario;
function getDefaultCamposFormulario() {
    return {
        nombre: { activo: true, requerido: true, selforder: true, ecommerce: true, label: 'Nombre' },
        telefono: { activo: false, requerido: false, selforder: true, ecommerce: true, label: 'Teléfono' },
        email: { activo: false, requerido: false, selforder: false, ecommerce: true, label: 'Correo electrónico' },
        direccion: { activo: false, requerido: false, selforder: false, ecommerce: false, label: 'Dirección' },
        empresa: { activo: false, requerido: false, selforder: false, ecommerce: false, label: 'Empresa / Razón Social' },
        notas: { activo: true, requerido: false, selforder: true, ecommerce: true, label: 'Notas / Comentarios' },
    };
}
function resolveCamposFormulario(configEspecial) {
    const defaults = getDefaultCamposFormulario();
    const cfg = typeof configEspecial === 'string' ? JSON.parse(configEspecial) : configEspecial;
    const saved = cfg?.campos_formulario || {};
    const result = { ...defaults };
    for (const key of Object.keys(defaults)) {
        if (saved[key])
            result[key] = { ...defaults[key], ...saved[key] };
    }
    result.nombre = { ...result.nombre, activo: true, requerido: true, selforder: true };
    return result;
}
//# sourceMappingURL=campos-formulario.helper.js.map