import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const A = '10000000-0000-0000-0000-000000000001',
  B = '10000000-0000-0000-0000-000000000002',
  C = '10000000-0000-0000-0000-000000000003',
  D = '10000000-0000-0000-0000-000000000004',
  U = '10000000-0000-0000-0000-000000000005';
test('Esquema, aislamiento, autorizaciones y reservas de Quality Motors', async (t) => {
  const db = new PGlite();
  await db.exec(`
 create schema neon_auth;
 create table neon_auth.user(id uuid primary key,email text,"emailVerified" boolean not null default false);
 insert into neon_auth.user values ('${A}','admin@taller.mx',true),('${B}','otro@taller.mx',true),('${C}','cliente@correo.mx',true),('${D}','worker@taller.mx',true),('${U}','sinconfirmar@correo.mx',false);
 `);
  await db.exec(await readFile(new URL('../schema.sql', import.meta.url), 'utf8'));
  async function as(user: string | null) {
    await db.exec('reset role');
    await db.query("select set_config('app.user_id',$1,false)", [user || '']);
    await db.exec('set role quality_motors_app');
  }
  async function rpc(action: string, payload: object): Promise<any> {
    const r = await db.query<{ value: any }>('select public.app_mutate($1,$2::jsonb) value', [
      action,
      JSON.stringify(payload),
    ]);
    return r.rows[0].value;
  }
  async function scalar(sql: string, params: unknown[] = []) {
    const r = await db.query<any>(sql, params);
    return Object.values(r.rows[0])[0] as any;
  }
  await as(A);
  const w = (await rpc('create_workshop', { name: 'Taller A' })).id;
  await as(B);
  const w2 = (await rpc('create_workshop', { name: 'Taller B' })).id;
  const c2 = (await rpc('create_client', { workshop_id: w2, name: 'Ajeno' })).id;
  await as(A);
  const c = (
    await rpc('create_client', {
      workshop_id: w,
      name: 'Cliente de prueba',
      email: 'cliente@correo.mx',
      phone: '5512345678',
    })
  ).id;
  const v = (
    await rpc('create_vehicle', {
      workshop_id: w,
      client_id: c,
      make: 'Nissan',
      model: 'Versa',
      year: 2022,
      plates: 'ABC123',
      vin: '',
    })
  ).id;
  const p = (
    await rpc('create_product', {
      workshop_id: w,
      sku: 'BAL-01',
      name: 'Balatas',
      stock: 5,
      price: 250.5,
    })
  ).id;
  const o = (
    await rpc('create_order', {
      workshop_id: w,
      client_id: c,
      vehicle_id: v,
      title: 'Servicio de frenos',
      tax_rate: 0.16,
    })
  ).id;
  await t.test('No permite crear un taller sin correo confirmado', async () => {
    await as(U);
    await assert.rejects(rpc('create_workshop', { name: 'Sin confirmar' }), /correo confirmado/);
    await as(A);
  });
  await t.test('RLS oculta clientes y órdenes de otros talleres', async () => {
    assert.equal(await scalar('select count(*) from public.clients'), 1);
    await as(B);
    assert.equal(await scalar('select count(*) from public.orders'), 0);
    await assert.rejects(
      rpc('add_item', {
        workshop_id: w,
        order_id: o,
        kind: 'mano_obra',
        description: 'Ataque',
        quantity: 1,
        unit_price: 1,
      }),
      /acceso/,
    );
    await assert.rejects(db.query('select public.get_order($1)', [o]), /acceso/);
    await as(A);
  });
  await t.test('Llaves compuestas impiden relaciones entre tenants', async () => {
    await assert.rejects(
      rpc('create_vehicle', {
        workshop_id: w,
        client_id: c2,
        make: 'Ford',
        model: 'Fiesta',
        year: 2020,
        plates: 'XX',
      }),
      /foreign key/,
    );
  });
  await t.test('Reserva stock, toma el precio del catálogo y deriva IVA', async () => {
    await rpc('add_item', {
      workshop_id: w,
      order_id: o,
      kind: 'stock',
      product_id: p,
      quantity: 2,
      unit_price: 0.01,
    });
    await rpc('add_item', {
      workshop_id: w,
      order_id: o,
      kind: 'mano_obra',
      description: 'Instalación',
      quantity: 1,
      unit_price: 300,
    });
    assert.equal(await scalar('select stock from public.inventory where id=$1', [p]), 3);
    const d = await scalar('select public.get_order($1)', [o]);
    assert.equal(d.order.subtotal, 801);
    assert.equal(d.order.tax, 128.16);
    assert.equal(d.order.total, 929.16);
  });
  await t.test('Rechaza sobreventa sin cambios parciales', async () => {
    await assert.rejects(
      rpc('add_item', { workshop_id: w, order_id: o, kind: 'stock', product_id: p, quantity: 4 }),
      /existencias/,
    );
    assert.equal(await scalar('select stock from public.inventory where id=$1', [p]), 3);
    assert.equal(
      await scalar('select count(*) from public.service_items where order_id=$1', [o]),
      2,
    );
  });
  await t.test('No permite escritura directa ni funciones internas privilegiadas', async () => {
    await assert.rejects(
      db.query('update public.inventory set stock=999 where id=$1', [p]),
      /permission denied/,
    );
    await assert.rejects(
      db.query("update public.orders set status='aprobada' where id=$1", [o]),
      /permission denied/,
    );
    await assert.rejects(db.query('select private.order_json($1)', [o]), /permission denied/);
  });
  let invite = '';
  await t.test('Invitación ligada a correo, un solo uso y cliente específico', async () => {
    invite = (
      await rpc('invite', {
        workshop_id: w,
        email: 'cliente@correo.mx',
        role: 'client',
        client_id: c,
      })
    ).token;
    await as(B);
    await assert.rejects(rpc('accept_invite', { token: invite }), /correo/);
    await as(C);
    await rpc('accept_invite', { token: invite });
    await assert.rejects(rpc('accept_invite', { token: invite }), /correo/);
    assert.equal(await scalar('select count(*) from public.orders'), 0);
    await assert.rejects(rpc('create_client', { workshop_id: w, name: 'Ataque' }), /acceso/);
    await as(A);
  });
  await t.test('Colaborador no puede ajustar inventario ni invitar administradores', async () => {
    const inv = (await rpc('invite', { workshop_id: w, email: 'worker@taller.mx', role: 'worker' }))
      .token;
    await as(D);
    await rpc('accept_invite', { token: inv });
    await assert.rejects(
      rpc('adjust_stock', { workshop_id: w, product_id: p, delta: 100, reason: 'Ataque' }),
      /administración/,
    );
    await assert.rejects(
      rpc('invite', { workshop_id: w, email: 'otro@taller.mx', role: 'admin' }),
      /administración/,
    );
    await as(A);
  });
  let token = '';
  await t.test('Publicar bloquea los precios; rotar el enlace revoca el anterior', async () => {
    token = (await rpc('share', { workshop_id: w, order_id: o })).token;
    await assert.rejects(
      rpc('add_item', {
        workshop_id: w,
        order_id: o,
        kind: 'mano_obra',
        description: 'Cambio',
        quantity: 1,
        unit_price: 99,
      }),
      /borrador/,
    );
    const old = token;
    token = (await rpc('share', { workshop_id: w, order_id: o })).token;
    await as(null);
    await assert.rejects(db.query('select public.get_public_order($1)', [old]), /venció/);
    const d = await scalar('select public.get_public_order($1)', [token]);
    assert.equal(d.order.id, o);
    assert.equal(d.order.total, 929.16);
    assert.equal(await scalar('select count(*) from public.clients'), 0);
    await assert.rejects(
      db.query('select public.get_public_order($1)', ['a'.repeat(64)]),
      /venció/,
    );
    await as(A);
  });
  await t.test(
    'La evidencia exige una ruta del taller y respeta el acceso a la orden',
    async () => {
      const path = w + '/' + o + '/prueba.jpg';
      await rpc('add_photo', { workshop_id: w, order_id: o, path, caption: 'Balata desgastada' });
      await as(B);
      assert.equal(await scalar('select count(*) from public.service_photos'), 0);
      await assert.rejects(
        rpc('add_photo', {
          workshop_id: w,
          order_id: o,
          path: w + '/' + o + '/ajena.jpg',
          caption: 'Ajena',
        }),
        /acceso/,
      );
      await as(null);
      const publicDetail = await scalar('select public.get_public_order($1)', [token]);
      assert.equal(publicDetail.photos[0].path, path);
      await as(A);
    },
  );
  await t.test('No acepta respuestas con token de otra orden ni de otro cliente', async () => {
    const other = (
      await rpc('create_order', {
        workshop_id: w,
        client_id: c,
        vehicle_id: v,
        title: 'Otra orden',
      })
    ).id;
    await as(null);
    await assert.rejects(
      db.query('select public.decide_order($1,$2,$3)', [other, 'aprobada', token]),
      /acceso/,
    );
    await as(B);
    await assert.rejects(db.query('select public.decide_order($1,$2)', [o, 'aprobada']), /acceso/);
    await as(A);
  });
  await t.test('Rechazo libera stock una vez y conserva importes auditables', async () => {
    await as(null);
    await db.query('select public.decide_order($1,$2,$3)', [o, 'rechazada', token]);
    await db.query('select public.decide_order($1,$2,$3)', [o, 'rechazada', token]);
    await assert.rejects(
      db.query('select public.decide_order($1,$2,$3)', [o, 'aprobada', token]),
      /no acepta/,
    );
    await as(A);
    assert.equal(await scalar('select stock from public.inventory where id=$1', [p]), 5);
    const d = await scalar('select public.get_order($1)', [o]);
    assert.equal(d.order.total, 929.16);
    assert.equal(d.order.status, 'rechazada');
  });
  await t.test('Caducidad de enlaces e invitaciones se valida en base de datos', async () => {
    await db.exec('reset role');
    await db.exec("update private.order_links set expires_at=now()-interval '1 second'");
    await as(null);
    await assert.rejects(db.query('select public.get_public_order($1)', [token]), /venció/);
    await as(A);
    const inv = (await rpc('invite', { workshop_id: w, email: 'otro@taller.mx', role: 'worker' }))
      .token;
    await db.exec('reset role');
    await db.exec("update public.invitations set expires_at=now()-interval '1 second'");
    await as(B);
    await assert.rejects(rpc('accept_invite', { token: inv }), /venció/);
    await as(A);
  });
  await t.test('Aprobación y entrega siguen transiciones válidas', async () => {
    const fresh = (
      await rpc('create_order', {
        workshop_id: w,
        client_id: c,
        vehicle_id: v,
        title: 'Segunda cotización',
      })
    ).id;
    await rpc('add_item', {
      workshop_id: w,
      order_id: fresh,
      kind: 'stock',
      product_id: p,
      quantity: 1,
    });
    const tk = (await rpc('share', { workshop_id: w, order_id: fresh })).token;
    await assert.rejects(
      rpc('status', { workshop_id: w, order_id: fresh, status: 'entregada' }),
      /no permitido/,
    );
    await as(C);
    await db.query('select public.decide_order($1,$2)', [fresh, 'aprobada']);
    await as(A);
    await rpc('status', { workshop_id: w, order_id: fresh, status: 'en_proceso' });
    await rpc('status', { workshop_id: w, order_id: fresh, status: 'lista' });
    await rpc('status', { workshop_id: w, order_id: fresh, status: 'entregada' });
    assert.equal(await scalar('select stock from public.inventory where id=$1', [p]), 4);
    await rpc('revoke_link', { workshop_id: w, order_id: fresh });
    await as(null);
    await assert.rejects(db.query('select public.get_public_order($1)', [tk]), /revocado/);
    await as(A);
  });
  await t.test('Cancelación devuelve reservas una sola vez', async () => {
    const fresh = (
      await rpc('create_order', {
        workshop_id: w,
        client_id: c,
        vehicle_id: v,
        title: 'Orden cancelable',
      })
    ).id;
    await rpc('add_item', {
      workshop_id: w,
      order_id: fresh,
      kind: 'stock',
      product_id: p,
      quantity: 1,
    });
    await rpc('status', { workshop_id: w, order_id: fresh, status: 'cancelada' });
    await assert.rejects(
      rpc('status', { workshop_id: w, order_id: fresh, status: 'cancelada' }),
      /no permitido/,
    );
    assert.equal(await scalar('select stock from public.inventory where id=$1', [p]), 4);
  });
  await db.close();
});
