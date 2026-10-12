'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { browserDb } from '@/lib/supabase/client';
import { Badge, Notice, Field } from './ui';
import { money } from '@/lib/format';
import type { Order } from '@/types/domain';
export function Account({ email }: { email: string }) {
  const [orders, setOrders] = useState<Order[]>([]),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const db = browserDb();
    void db
      .from('client_accounts')
      .select('client_id')
      .then(async ({ data, error }) => {
        if (error) {
          setError('No pudimos cargar tu cuenta.');
          return;
        }
        const ids = (data || []).map((x) => x.client_id);
        if (ids.length) {
          const result = await db
            .from('order_totals')
            .select('*')
            .in('client_id', ids)
            .order('created_at', { ascending: false });
          if (result.error) setError('No pudimos cargar tus órdenes.');
          else setOrders(result.data || []);
        }
      });
  }, []);
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-5 py-10">
      <header className="flex flex-wrap justify-between gap-4">
        <div>
          <Link href="/" className="font-bold text-emerald-700">
            Quality Motors
          </Link>
          <h1 className="mt-3 text-3xl font-bold">Mi cuenta</h1>
          <p className="mt-2 text-slate-500">{email}</p>
        </div>
        <div className="flex items-start gap-3">
          <Link href="/taller" className="btn">
            Panel del taller
          </Link>
          <button
            className="btn-secondary"
            onClick={async () => {
              await browserDb().auth.signOut();
              location.assign('/login');
            }}
          >
            Salir
          </button>
        </div>
      </header>
      {error && <Notice error>{error}</Notice>}
      <section className="card">
        <h2 className="mb-4 text-xl font-bold">Mis servicios</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-slate-500">
            Todavía no tienes servicios vinculados. Pide al taller una invitación para tu correo y
            ábrela después de iniciar sesión.
          </p>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <Link
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 hover:border-emerald-500"
                key={o.id}
                href={'/cuenta/orden/' + o.id}
              >
                <div>
                  <p className="font-semibold">
                    QM-{o.folio} · {o.title}
                  </p>
                  <p className="text-sm text-slate-500">{o.vehicle_label}</p>
                </div>
                <Badge status={o.status} />
                <b>{money(o.total)}</b>
              </Link>
            ))}
          </div>
        )}
      </section>
      <form
        className="card space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError('');
          const name = String(new FormData(e.currentTarget).get('name'));
          try {
            const { error } = await browserDb().rpc('app_mutate', {
              action: 'create_workshop',
              payload: { name },
            });
            if (error) throw error;
            location.assign('/taller');
          } catch {
            setError('No pudimos crear el taller. Confirma tu correo e intenta de nuevo.');
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2 className="text-lg font-bold">¿Administras un taller?</h2>
        <p className="text-sm text-slate-500">
          Crea un espacio independiente para tu equipo y tus clientes.
        </p>
        <Field label="Nombre del taller">
          <input name="name" className="field" minLength={2} maxLength={120} required />
        </Field>
        <button className="btn" disabled={busy}>
          Crear taller
        </button>
      </form>
    </main>
  );
}
