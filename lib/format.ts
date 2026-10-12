export const money = (value: number | string) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(value));
export const date = (value: string) =>
  new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeZone: 'America/Mexico_City' }).format(
    new Date(value),
  );
export const labels: Record<string, string> = {
  borrador: 'Borrador',
  pendiente: 'Por autorizar',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  en_proceso: 'En proceso',
  lista: 'Lista para entrega',
  entregada: 'Entregada',
  cancelada: 'Cancelada',
  mano_obra: 'Mano de obra',
  stock: 'En existencia',
  por_pedir: 'Por pedir',
};
