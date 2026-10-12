import { test } from 'node:test';
import assert from 'node:assert/strict';
import { messageTemplate, notificationLinks, unavailableAdapter } from '../lib/notifications';
test('WhatsApp normaliza teléfonos mexicanos y codifica el enlace completo', () => {
  const url = 'https://taller.mx/cotizacion#token=abc';
  const message = messageTemplate(42, 116, url);
  const links = notificationLinks('(55) 1234-5678', 'cliente@correo.mx', message);
  assert.ok(links.whatsapp?.startsWith('https://wa.me/525512345678?text='));
  assert.ok(decodeURIComponent(links.whatsapp!).includes(url));
  assert.ok(links.email?.startsWith('mailto:'));
  assert.equal(notificationLinks('', '', message).whatsapp, null);
});
test('Los adaptadores no simulan envíos', async () => {
  await assert.rejects(unavailableAdapter.send({ to: 'x', message: 'x' }), /no configurado/);
});
