import { money } from './format';
export function messageTemplate(folio: number, total: number, url: string) {
  return `Hola. Tu cotización QM-${folio} de Quality Motors es de ${money(total)}. Revisa los conceptos, fotos y seguimiento, y autoriza el trabajo aquí: ${url}`;
}
export function notificationLinks(phone: string, email: string, message: string) {
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 10) digits = `52${digits}`;
  return {
    whatsapp:
      digits.length >= 10 && digits.length <= 15
        ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
        : null,
    email: email
      ? `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('Tu cotización de Quality Motors')}&body=${encodeURIComponent(message)}`
      : null,
    sms: digits ? `sms:+${digits}?body=${encodeURIComponent(message)}` : null,
  };
}
export interface NotificationAdapter {
  send(input: { to: string; message: string }): Promise<{ id: string }>;
}
export const unavailableAdapter: NotificationAdapter = {
  async send() {
    throw new Error('Proveedor de envío no configurado. Usa las opciones para compartir.');
  },
};
