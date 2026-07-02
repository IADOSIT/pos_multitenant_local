export interface CampoConfig {
  activo: boolean;
  requerido: boolean;
  selforder: boolean;
  ecommerce: boolean;
  label: string;
}

export type CamposFormulario = Record<
  'nombre' | 'telefono' | 'email' | 'direccion' | 'empresa' | 'notas',
  CampoConfig
>;

export function getDefaultCamposFormulario(): CamposFormulario {
  return {
    nombre:    { activo: true,  requerido: true,  selforder: true,  ecommerce: true,  label: 'Nombre' },
    telefono:  { activo: false, requerido: false, selforder: true,  ecommerce: true,  label: 'Teléfono' },
    email:     { activo: false, requerido: false, selforder: false, ecommerce: true,  label: 'Correo electrónico' },
    direccion: { activo: false, requerido: false, selforder: false, ecommerce: false, label: 'Dirección' },
    empresa:   { activo: false, requerido: false, selforder: false, ecommerce: false, label: 'Empresa / Razón Social' },
    notas:     { activo: true,  requerido: false, selforder: true,  ecommerce: true,  label: 'Notas / Comentarios' },
  };
}

// Obtener config mergeando defaults con lo guardado en BD
export function resolveCamposFormulario(configEspecial: any): CamposFormulario {
  const defaults = getDefaultCamposFormulario();
  const cfg = typeof configEspecial === 'string' ? JSON.parse(configEspecial) : configEspecial;
  const saved = cfg?.campos_formulario || {};
  const result = { ...defaults };
  for (const key of Object.keys(defaults) as Array<keyof CamposFormulario>) {
    if (saved[key]) result[key] = { ...defaults[key], ...saved[key] };
  }
  // nombre SIEMPRE activo y requerido en selforder — campo crítico
  result.nombre = { ...result.nombre, activo: true, requerido: true, selforder: true };
  return result;
}
