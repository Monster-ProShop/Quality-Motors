'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  Wrench,
  LayoutDashboard,
  Users,
  Package,
  UserPlus,
  Plus,
  ArrowUpRight,
  LogOut,
  Search,
  ClipboardList,
} from 'lucide-react';
import { authClient } from '@/lib/auth/client';
import { mutate, errorText } from '@/lib/api';
import { apiGet } from '@/lib/http';
import { money, date } from '@/lib/format';
import { Field, Notice, Badge } from './ui';
import type { Workshop, Client, Vehicle, Product, Order } from '@/types/domain';
type Tab = 'ordenes' | 'clientes' | 'inventario' | 'equipo';
type Invite = {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  used_at: string | null;
};
export function Dashboard({ email }: { email: string }) {
  const [workshops, setWorkshops] = useState<Workshop[]>([]),
    [wid, setWid] = useState(''),
    [tab, setTab] = useState<Tab>('ordenes');
  const [clients, setClients] = useState<Client[]>([]),
    [vehicles, setVehicles] = useState<Vehicle[]>([]),
    [products, setProducts] = useState<Product[]>([]),
    [orders, setOrders] = useState<Order[]>([]),
    [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [query, setQuery] = useState(''),
    [showNew, setShowNew] = useState(false),
    [clientId, setClientId] = useState(''),
    [inviteRole, setInviteRole] = useState('worker');
  const selected = workshops.find((w) => w.id === wid),
    admin = selected?.role === 'admin';
  useEffect(() => {
    async function start() {
      try {
        const { workshops: ws } = await apiGet<{ workshops: Workshop[] }>(
          '/api/app?resource=dashboard',
        );
        setWorkshops(ws);
        setWid(ws[0]?.id || '');
      } catch {
        setError(
          'No pudimos cargar tus talleres. Verifica la conexión y la instalación del esquema.',
        );
      } finally {
        setLoading(false);
      }
    }
    void start();
  }, []);
  const reload = useCallback(async () => {
    if (!wid) return;
    setLoading(true);
    try {
      const data = await apiGet<{
        clients: Client[];
        vehicles: Vehicle[];
        products: Product[];
        orders: Order[];
        invitations: Invite[];
      }>('/api/app?resource=dashboard&workshop_id=' + encodeURIComponent(wid));
      setClients(data.clients);
      setVehicles(data.vehicles);
      setProducts(data.products);
      setOrders(data.orders);
      setInvites(admin ? data.invitations : []);
    } catch {
      setError('No pudimos cargar los datos del taller. Intenta actualizar.');
    } finally {
      setLoading(false);
    }
  }, [wid, admin]);
  useEffect(() => {
    void reload();
  }, [reload]);
  async function submit(e: FormEvent<HTMLFormElement>, action: string) {
    e.preventDefault();
    const form = e.currentTarget;
    const fields = Object.fromEntries(new FormData(form).entries());
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await mutate(action, { ...fields, workshop_id: wid });
      if (action === 'create_order') {
        location.assign('/taller/orden/' + result.id);
        return;
      }
      if (action === 'invite') setNotice(location.origin + '/invitacion#token=' + result.token);
      else {
        setNotice('Cambios guardados.');
        form.reset();
      }
      await reload();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  const nav = [
    { id: 'ordenes', label: 'Órdenes de servicio', icon: LayoutDashboard },
    { id: 'clientes', label: 'Clientes y vehículos', icon: Users },
    { id: 'inventario', label: 'Inventario', icon: Package },
    { id: 'equipo', label: 'Equipo y accesos', icon: UserPlus },
  ] as const;
  const filtered = orders.filter((o) =>
    (o.title + ' ' + o.client_name + ' ' + o.vehicle_label + ' ' + o.folio)
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="bg-slate-950 p-5 text-slate-300 lg:sticky lg:top-0 lg:h-screen">
        <Link href="/" className="mb-8 flex items-center gap-3 text-lg font-bold text-white">
          <span className="rounded-lg bg-red-600 p-2">
            <Wrench size={22} />
          </span>
          Quality Motors
        </Link>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[.2em] text-slate-500">
          Espacio de trabajo
        </p>
        <select
          aria-label="Taller activo"
          className="mb-7 w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-sm text-white"
          value={wid}
          onChange={(e) => {
            setWid(e.target.value);
            setClientId('');
            setNotice('');
            setError('');
            setShowNew(false);
          }}
        >
          {workshops.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <nav className="flex flex-wrap gap-2 lg:block lg:space-y-2">
          {nav
            .filter((n) => n.id !== 'equipo' || admin)
            .map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  setTab(n.id);
                  setNotice('');
                  setError('');
                }}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm lg:w-full ${tab === n.id ? 'bg-red-500/15 text-red-300' : 'hover:bg-slate-800'}`}
              >
                <n.icon size={18} />
                {n.label}
              </button>
            ))}
        </nav>
        <div className="mt-8 border-t border-slate-800 pt-5 lg:absolute lg:bottom-6 lg:max-w-[195px]">
          <p className="break-all text-xs text-slate-400">{email}</p>
          <Link className="mt-3 block text-sm" href="/cuenta">
            Mi cuenta / portal del cliente
          </Link>
          <button
            className="mt-4 flex items-center gap-2 text-xs"
            onClick={async () => {
              await authClient.signOut();
              location.assign('/login');
            }}
          >
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="min-w-0 px-5 py-7 md:px-9">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
              {selected?.name || 'Mi taller'} / Operación
            </p>
            <h1 className="text-3xl font-bold tracking-tight">
              {nav.find((n) => n.id === tab)?.label}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Todo lo que necesita tu taller, en un solo lugar.
            </p>
          </div>
          {tab === 'ordenes' && wid && (
            <button className="btn" onClick={() => setShowNew(!showNew)}>
              <Plus size={18} />
              {showNew ? 'Cerrar formulario' : 'Nueva cotización'}
            </button>
          )}
        </header>
        <div className="mb-5 space-y-3">
          {error && <Notice error>{error}</Notice>}
          {notice && (
            <Notice>
              {notice.startsWith('http') ? (
                <>
                  <p className="mb-2">
                    Invitación creada. Vence en 7 días. Comparte este enlace únicamente con la
                    persona indicada:
                  </p>
                  <input
                    readOnly
                    aria-label="Enlace de invitación"
                    className="field"
                    value={notice}
                  />
                  <button
                    className="mt-2 text-sm underline"
                    onClick={() =>
                      navigator.clipboard
                        .writeText(notice)
                        .catch(() => setError('Copia el enlace manualmente.'))
                    }
                  >
                    Copiar enlace
                  </button>
                </>
              ) : (
                notice
              )}
            </Notice>
          )}
        </div>
        {loading && (
          <p role="status" className="mb-4 text-sm text-slate-500">
            Cargando información…
          </p>
        )}
        {!loading && !wid ? (
          <div className="card">
            <h2 className="text-xl font-bold">Tu taller comienza aquí</h2>
            <p className="my-3 text-slate-500">
              Crea un taller desde tu cuenta o acepta una invitación de tu administrador.
            </p>
            <Link href="/cuenta" className="btn">
              Ir a mi cuenta
            </Link>
          </div>
        ) : (
          <>
            {tab === 'ordenes' && (
              <>
                <div className="mb-7 grid gap-4 sm:grid-cols-3">
                  {[
                    {
                      label: 'Por autorizar',
                      value: orders.filter((o) => o.status === 'pendiente').length,
                      detail: 'Cotizaciones con el cliente',
                    },
                    {
                      label: 'En el taller',
                      value: orders.filter((o) =>
                        ['aprobada', 'en_proceso', 'lista'].includes(o.status),
                      ).length,
                      detail: 'Servicios en seguimiento',
                    },
                    {
                      label: 'Importe autorizado',
                      value: money(
                        orders
                          .filter((o) => ['aprobada', 'en_proceso', 'lista'].includes(o.status))
                          .reduce((s, o) => s + Number(o.total), 0),
                      ),
                      detail: 'Órdenes activas · incluye IVA',
                    },
                  ].map((s) => (
                    <div key={s.label} className="card">
                      <p className="text-sm text-slate-500">{s.label}</p>
                      <p className="my-3 text-3xl font-bold">{s.value}</p>
                      <p className="text-xs text-slate-400">{s.detail}</p>
                    </div>
                  ))}
                </div>
                {showNew && (
                  <form
                    key={wid}
                    onSubmit={(e) => submit(e, 'create_order')}
                    className="card mb-6 grid gap-4 md:grid-cols-2"
                  >
                    <h2 className="text-lg font-bold md:col-span-2">Nueva cotización</h2>
                    <Field label="Cliente">
                      <select
                        required
                        name="client_id"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        className="field"
                      >
                        <option value="">Selecciona un cliente</option>
                        {clients.map((c) => (
                          <option value={c.id} key={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Vehículo">
                      <select key={clientId} required name="vehicle_id" className="field">
                        <option value="">Selecciona un vehículo</option>
                        {vehicles
                          .filter((v) => v.client_id === clientId)
                          .map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.make} {v.model} · {v.plates}
                            </option>
                          ))}
                      </select>
                    </Field>
                    <Field label="Motivo del servicio">
                      <input
                        name="title"
                        required
                        minLength={2}
                        maxLength={150}
                        placeholder="Ej. Servicio de frenos"
                        className="field"
                      />
                    </Field>
                    <Field label="IVA">
                      <select name="tax_rate" className="field">
                        <option value="0.16">16%</option>
                        <option value="0.08">8%</option>
                        <option value="0">0%</option>
                      </select>
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Notas visibles para el cliente">
                        <textarea name="notes" maxLength={4000} className="field" />
                      </Field>
                    </div>
                    <p className="text-xs text-slate-500">
                      Primero registra al cliente y su vehículo en Clientes y vehículos.
                    </p>
                    <button disabled={busy} className="btn">
                      Crear y agregar conceptos
                    </button>
                  </form>
                )}
                <section className="card">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                    <h2 className="font-bold">
                      Actividad del taller{' '}
                      <span className="ml-2 text-sm font-normal text-slate-400">
                        {orders.length} órdenes
                      </span>
                    </h2>
                    <label className="flex items-center gap-2 rounded-lg border px-3">
                      <Search size={16} className="text-slate-400" />
                      <input
                        className="py-2 text-sm outline-none"
                        placeholder="Buscar cliente, placas o folio"
                        aria-label="Buscar órdenes"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </label>
                  </div>
                  {filtered.length === 0 ? (
                    <div className="py-12 text-center text-slate-500">
                      <ClipboardList size={36} className="mx-auto mb-4 text-slate-300" />
                      <p className="font-semibold">
                        {orders.length ? 'Sin coincidencias' : 'Aún no hay órdenes de servicio'}
                      </p>
                      <p className="mt-2 text-sm">
                        Registra un cliente y crea su primera cotización.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b text-xs uppercase text-slate-400">
                          <tr>
                            {['Folio / servicio', 'Cliente / vehículo', 'Estado', 'Total', ''].map(
                              (h, i) => (
                                <th key={i} className="px-2 py-3 font-medium">
                                  {h}
                                </th>
                              ),
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((o) => (
                            <tr key={o.id} className="border-b last:border-0">
                              <td className="px-2 py-5">
                                <Link
                                  href={'/taller/orden/' + o.id}
                                  className="font-semibold text-emerald-800"
                                >
                                  QM-{o.folio} · {o.title}
                                </Link>
                                <p className="mt-1 text-xs text-slate-400">{date(o.created_at)}</p>
                              </td>
                              <td className="px-2">
                                <p>{o.client_name}</p>
                                <p className="mt-1 text-xs text-slate-400">{o.vehicle_label}</p>
                              </td>
                              <td className="px-2">
                                <Badge status={o.status} />
                              </td>
                              <td className="px-2 font-semibold">{money(o.total)}</td>
                              <td>
                                <Link
                                  aria-label={'Abrir orden ' + o.folio}
                                  href={'/taller/orden/' + o.id}
                                >
                                  <ArrowUpRight size={18} />
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            )}
            {tab === 'clientes' && (
              <div className="grid gap-6 xl:grid-cols-2">
                <form onSubmit={(e) => submit(e, 'create_client')} className="card space-y-4">
                  <h2 className="text-lg font-bold">Registrar cliente</h2>
                  <Field label="Nombre completo">
                    <input className="field" name="name" required minLength={2} maxLength={150} />
                  </Field>
                  <Field label="Correo electrónico">
                    <input className="field" name="email" type="email" maxLength={254} />
                  </Field>
                  <Field label="Celular / WhatsApp">
                    <input
                      className="field"
                      name="phone"
                      type="tel"
                      maxLength={30}
                      placeholder="10 dígitos o código de país"
                    />
                  </Field>
                  <button className="btn" disabled={busy}>
                    Guardar cliente
                  </button>
                </form>
                <form
                  onSubmit={(e) => submit(e, 'create_vehicle')}
                  className="card grid gap-4 sm:grid-cols-2"
                >
                  <h2 className="text-lg font-bold sm:col-span-2">Registrar vehículo</h2>
                  <div className="sm:col-span-2">
                    <Field label="Cliente">
                      <select name="client_id" required className="field">
                        <option value="">Selecciona</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  {[
                    { name: 'make', label: 'Marca' },
                    { name: 'model', label: 'Modelo' },
                    { name: 'plates', label: 'Placas' },
                    { name: 'vin', label: 'VIN (opcional)' },
                  ].map((f) => (
                    <Field key={f.name} label={f.label}>
                      <input
                        className="field"
                        name={f.name}
                        required={f.name !== 'vin'}
                        maxLength={f.name === 'vin' ? 17 : f.name === 'plates' ? 20 : 80}
                      />
                    </Field>
                  ))}
                  <Field label="Año">
                    <input
                      className="field"
                      name="year"
                      type="number"
                      min={1900}
                      max={2100}
                      required
                    />
                  </Field>
                  <button className="btn self-end" disabled={busy}>
                    Guardar vehículo
                  </button>
                </form>
                <div className="card xl:col-span-2">
                  <h2 className="mb-5 font-bold">Directorio · {clients.length} clientes</h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    {clients.map((c) => (
                      <div key={c.id} className="rounded-lg border p-4">
                        <h3 className="font-semibold">{c.name}</h3>
                        <p className="text-sm text-slate-500">
                          {c.email || 'Sin correo'} · {c.phone || 'Sin teléfono'}
                        </p>
                        {vehicles
                          .filter((v) => v.client_id === c.id)
                          .map((v) => (
                            <p key={v.id} className="mt-2 text-sm">
                              {v.make} {v.model} {v.year} · {v.plates}
                            </p>
                          ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {tab === 'inventario' && (
              <div className="space-y-6">
                {admin && (
                  <div className="grid gap-6 xl:grid-cols-2">
                    <form
                      className="card grid gap-4 sm:grid-cols-2"
                      onSubmit={(e) => submit(e, 'create_product')}
                    >
                      <h2 className="font-bold sm:col-span-2">Agregar refacción</h2>
                      {[
                        { n: 'name', l: 'Nombre', t: 'text' },
                        { n: 'sku', l: 'Código / SKU', t: 'text' },
                        { n: 'price', l: 'Precio unitario sin IVA', t: 'number' },
                        { n: 'stock', l: 'Existencia inicial', t: 'number' },
                      ].map((f) => (
                        <Field label={f.l} key={f.n}>
                          <input
                            className="field"
                            name={f.n}
                            type={f.t}
                            required
                            min="0"
                            step={f.n === 'price' ? '0.01' : '1'}
                            maxLength={f.n === 'sku' ? 80 : 150}
                          />
                        </Field>
                      ))}
                      <button className="btn" disabled={busy}>
                        Agregar al catálogo
                      </button>
                    </form>
                    <form className="card space-y-4" onSubmit={(e) => submit(e, 'adjust_stock')}>
                      <h2 className="font-bold">Entrada o ajuste de existencia</h2>
                      <Field label="Refacción">
                        <select className="field" name="product_id" required>
                          <option value="">Selecciona</option>
                          {products.map((p) => (
                            <option value={p.id} key={p.id}>
                              {p.name} · {p.stock} disponibles
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Cantidad (negativa para salida)">
                        <input
                          className="field"
                          type="number"
                          name="delta"
                          min={-100000}
                          max={100000}
                          required
                        />
                      </Field>
                      <Field label="Motivo">
                        <input className="field" name="reason" required maxLength={250} />
                      </Field>
                      <button className="btn" disabled={busy}>
                        Registrar ajuste
                      </button>
                    </form>
                  </div>
                )}
                <section className="card">
                  <h2 className="mb-2 font-bold">Refacciones disponibles</h2>
                  <p className="mb-5 text-sm text-slate-500">
                    Las refacciones se reservan al agregarlas a una cotización. Rechazar o cancelar
                    libera la reserva.
                  </p>
                  <div className="grid gap-3 md:grid-cols-3">
                    {products.map((p) => (
                      <div className="rounded-lg border p-4" key={p.id}>
                        <p className="text-xs text-slate-400">{p.sku}</p>
                        <h3 className="my-2 font-semibold">{p.name}</h3>
                        <div className="flex justify-between text-sm">
                          <span className={p.stock === 0 ? 'text-red-600' : 'text-emerald-700'}>
                            {p.stock} disponibles
                          </span>
                          <span>{money(p.price)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {!products.length && (
                    <p className="text-sm text-slate-500">Tu catálogo está vacío.</p>
                  )}
                </section>
              </div>
            )}
            {tab === 'equipo' && admin && (
              <div className="grid gap-6 xl:grid-cols-2">
                <form className="card space-y-4" onSubmit={(e) => submit(e, 'invite')}>
                  <h2 className="font-bold">Invitar a una persona</h2>
                  <Field label="Correo que deberá confirmar">
                    <input type="email" name="email" required className="field" />
                  </Field>
                  <Field label="Tipo de acceso">
                    <select
                      className="field"
                      name="role"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                    >
                      <option value="worker">Colaborador del taller</option>
                      <option value="admin">Administrador del taller</option>
                      <option value="client">Cliente · sólo sus servicios</option>
                    </select>
                  </Field>
                  {inviteRole === 'client' && (
                    <Field label="Cliente que se vinculará">
                      <select className="field" name="client_id" required>
                        <option value="">Selecciona</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}
                  <p className="text-xs text-slate-500">
                    Se generará un enlace de un solo uso. El envío es manual; no se enviará un
                    correo automáticamente.
                  </p>
                  <button className="btn" disabled={busy}>
                    Generar invitación
                  </button>
                </form>
                <div className="card">
                  <h2 className="mb-4 font-bold">Invitaciones</h2>
                  <div className="space-y-4">
                    {invites.map((i) => (
                      <div key={i.id} className="border-b pb-4">
                        <p className="break-all text-sm font-semibold">{i.email}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {i.role === 'client'
                            ? 'Cliente'
                            : i.role === 'admin'
                              ? 'Administrador'
                              : 'Colaborador'}{' '}
                          · {i.used_at ? 'Aceptada' : 'Vence: ' + date(i.expires_at)}
                        </p>
                        {!i.used_at && new Date(i.expires_at) > new Date() && (
                          <button
                            disabled={busy}
                            className="mt-2 text-xs text-red-700 underline"
                            onClick={async () => {
                              setBusy(true);
                              try {
                                await mutate('revoke_invite', { workshop_id: wid, id: i.id });
                                await reload();
                              } catch (err) {
                                setError(errorText(err));
                              } finally {
                                setBusy(false);
                              }
                            }}
                          >
                            Revocar invitación
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
