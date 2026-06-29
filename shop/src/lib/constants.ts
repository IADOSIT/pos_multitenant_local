export const IADOS = {
  nombre: 'iaDoS',
  nombre_completo: 'Inteligencia Artificial DevOps Solutions',
  email: 'hello@iados.mx',
  telefono: '+52 831 898 9580',
  whatsapp: 'https://wa.me/528318989580',
  ubicacion: 'Apodaca, Nuevo León, México',
  web: 'https://iados.mx',
  año_fundacion: 2014,
}

export const ESTADOS_PEDIDO: Record<string, { label: string; color: string; icon: string }> = {
  pendiente:  { label: 'Pendiente',      color: '#d97706', icon: '⏳' },
  confirmado: { label: 'Confirmado',     color: '#3b82f6', icon: '✅' },
  preparando: { label: 'En preparación', color: '#8b5cf6', icon: '📦' },
  enviado:    { label: 'Enviado',        color: '#06b6d4', icon: '🚚' },
  entregado:  { label: 'Entregado',      color: '#16a34a', icon: '🎉' },
  cancelado:  { label: 'Cancelado',      color: '#dc2626', icon: '❌' },
}
