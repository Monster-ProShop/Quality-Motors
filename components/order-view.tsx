'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Camera,
  ImagePlus,
  Send,
  Trash2,
  Package,
  CheckCircle2,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { errorText, mutate } from '@/lib/api';
import { apiGet, apiPost } from '@/lib/http';
import { money, labels, date } from '@/lib/format';
import { messageTemplate, notificationLinks } from '@/lib/notifications';
import { Field, Notice, Badge } from './ui';
import type { OrderDetail, Product, ItemKind, Client } from '@/types/domain';
export function OrderView({
  id,
  editor = false,
  publicLink = false,
}: {
  id?: string;
  editor?: boolean;
  publicLink?: boolean;
}) {
  const [detail, setDetail] = useState<OrderDetail | null>(null),
    [products, setProducts] = useState<Product[]>([]),
    [contact, setContact] = useState<Client | null>(null);
  const [token, setToken] = useState<string | null>(null),
    [ready, setReady] = useState(false),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [share, setShare] = useState(''),
    [kind, setKind] = useState<ItemKind>('mano_obra'),
    [caption, setCaption] = useState('');
  useEffect(() => {
    if (publicLink) setToken(new URLSearchParams(location.hash.slice(1)).get('token'));
    setReady(true);
  }, [publicLink]);
  const reload = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    setError('');
    try {
      if (publicLink && !token)
        throw new Error('El enlace está incompleto. Pide al taller que te lo comparta de nuevo.');
      if (publicLink) {
        const data = await apiPost<{ detail: OrderDetail }>('/api/public-order', {
          action: 'read',
          token,
        });
        setDetail(data.detail);
      } else {
        const data = await apiGet<{
          detail: OrderDetail;
          products: Product[];
          contact: Client | null;
        }>(
          '/api/app?resource=order&id=' +
            encodeURIComponent(id || '') +
            '&editor=' +
            (editor ? '1' : '0'),
        );
        setDetail(data.detail);
        if (editor) {
          setProducts(data.products);
          setContact(data.contact);
        }
      }
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }, [ready, publicLink, token, id, editor]);
  useEffect(() => {
    void reload();
  }, [reload]);
  async function operation(action: string, payload: Record<string, unknown> = {}) {
    if (!detail) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await mutate(action, {
        workshop_id: detail.order.workshop_id,
        order_id: detail.order.id,
        ...payload,
      });
      if (action === 'share') setShare(location.origin + '/cotizacion#token=' + result.token);
      if (action === 'revoke_link') {
        setShare('');
        setNotice('Enlace revocado.');
      }
      await reload();
      return true;
    } catch (err) {
      setError(errorText(err));
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function addItem(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    if (await operation('add_item', data)) form.reset();
  }
  async function upload(file: File | undefined) {
    if (!file || !detail) return;
    setError('');
    setNotice('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8388608) {
      setError('Usa una imagen JPG, PNG o WebP de hasta 8 MB.');
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.set('file', file);
      form.set('workshop_id', detail.order.workshop_id);
      form.set('order_id', detail.order.id);
      form.set('caption', caption);
      const response = await fetch('/api/photos', { method: 'POST', body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No pudimos subir la foto.');
      setCaption('');
      setNotice('Foto agregada a la orden.');
      await reload();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  async function decide(decision: 'aprobada' | 'rechazada') {
    if (
      !detail ||
      !window.confirm(
        decision === 'aprobada'
          ? '¿Autorizas los trabajos y el total indicado?'
          : '¿Quieres rechazar esta cotización?',
      )
    )
      return;
    setBusy(true);
    setError('');
    try {
      if (publicLink) {
        await apiPost('/api/public-order', {
          action: 'decide',
          token,
          orderId: detail.order.id,
          decision,
        });
      } else {
        await mutate('decide', {
          workshop_id: detail.order.workshop_id,
          order_id: detail.order.id,
          decision,
        });
      }
      setNotice('Tu respuesta quedó registrada.');
      await reload();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  const o = detail?.order;
  const links =
    o && share
      ? notificationLinks(
          contact?.phone || '',
          contact?.email || '',
          messageTemplate(o.folio, o.total, share),
        )
      : null;
  const nextStatus =
    o?.status === 'aprobada'
      ? 'en_proceso'
      : o?.status === 'en_proceso'
        ? 'lista'
        : o?.status === 'lista'
          ? 'entregada'
          : null;
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-5 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={editor ? '/taller' : publicLink ? '/' : '/cuenta'}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500"
        >
          <ArrowLeft size={17} />
          {editor ? 'Volver al taller' : 'Quality Motors'}
        </Link>
        <button className="btn-secondary" disabled={busy || loading} onClick={() => void reload()}>
          <RefreshCw size={15} />
          Actualizar
        </button>
      </header>
      {error && <Notice error>{error}</Notice>}
      {notice && <Notice>{notice}</Notice>}
      {loading && !detail && <p role="status">Cargando orden…</p>}
      {detail && o && (
        <>
          <section className="card flex flex-wrap justify-between gap-6">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-emerald-700">
                {detail.workshop} · QM-{o.folio}
              </p>
              <h1 className="text-3xl font-bold tracking-tight">{o.title}</h1>
              <p className="mt-3 text-slate-500">
                {detail.client} · {detail.vehicle}
              </p>
              <p className="mt-2 text-xs text-slate-400">Creada el {date(o.created_at)}</p>
            </div>
            <div className="flex flex-col items-start gap-4">
              <Badge status={o.status} />
              {editor && nextStatus && (
                <button
                  disabled={busy}
                  className="btn"
                  onClick={() => operation('status', { status: nextStatus })}
                >
                  {labels[nextStatus]}
                </button>
              )}
              {editor && ['borrador', 'pendiente', 'aprobada'].includes(o.status) && (
                <button
                  disabled={busy}
                  className="text-xs text-red-700 underline"
                  onClick={() => {
                    if (confirm('¿Cancelar esta orden y liberar las refacciones reservadas?'))
                      void operation('status', { status: 'cancelada' });
                  }}
                >
                  Cancelar orden
                </button>
              )}
            </div>
          </section>
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
            <div className="min-w-0 space-y-6">
              <section className="card">
                <h2 className="mb-4 text-lg font-bold">Detalle de la cotización</h2>
                {!detail.items.length ? (
                  <p className="text-sm text-slate-500">
                    Agrega mano de obra y refacciones para preparar la cotización.
                  </p>
                ) : (
                  <div className="divide-y">
                    {detail.items.map((i) => (
                      <div key={i.id} className="py-4">
                        <div className="flex justify-between gap-4">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                              {labels[i.kind]}
                            </span>
                            <p className="mt-1 font-semibold">{i.description}</p>
                            <p className="mt-1 text-sm text-slate-500">
                              {i.quantity} × {money(i.unit_price)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{money(i.amount)}</p>
                            {editor && o.status === 'borrador' && (
                              <button
                                disabled={busy}
                                className="mt-3 text-slate-400 hover:text-red-600"
                                aria-label={'Eliminar ' + i.description}
                                onClick={() => operation('remove_item', { item_id: i.id })}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                        {i.kind === 'por_pedir' && (
                          <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
                            <p className="flex items-center gap-2 text-slate-500">
                              <Package size={15} />
                              Proveedor: {i.supplier || 'Por confirmar'}
                            </p>
                            <p className="mt-2">Guía: {i.tracking || 'Pendiente de asignar'}</p>
                            {editor && (
                              <form
                                className="mt-3 grid gap-2 sm:grid-cols-3"
                                onSubmit={async (e) => {
                                  e.preventDefault();
                                  const data = Object.fromEntries(new FormData(e.currentTarget));
                                  await operation('tracking', { ...data, item_id: i.id });
                                }}
                              >
                                <input
                                  aria-label="Proveedor"
                                  name="supplier"
                                  required
                                  maxLength={200}
                                  defaultValue={i.supplier || ''}
                                  className="field"
                                />
                                <input
                                  aria-label="Número de seguimiento"
                                  name="tracking"
                                  maxLength={200}
                                  defaultValue={i.tracking || ''}
                                  placeholder="Número de seguimiento"
                                  className="field"
                                />
                                <button className="btn-secondary" disabled={busy}>
                                  Guardar guía
                                </button>
                              </form>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
              {editor && o.status === 'borrador' && (
                <form className="card grid gap-4 sm:grid-cols-2" onSubmit={addItem}>
                  <h2 className="text-lg font-bold sm:col-span-2">Agregar concepto</h2>
                  <Field label="Tipo de concepto">
                    <select
                      name="kind"
                      value={kind}
                      onChange={(e) => setKind(e.target.value as ItemKind)}
                      className="field"
                    >
                      <option value="mano_obra">Mano de obra</option>
                      <option value="stock">Refacción en existencia</option>
                      <option value="por_pedir">Refacción por pedir</option>
                    </select>
                  </Field>
                  {kind === 'stock' ? (
                    <Field label="Refacción">
                      <select name="product_id" required className="field">
                        <option value="">Selecciona</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id} disabled={p.stock === 0}>
                            {p.name} · {p.stock} disponibles · {money(p.price)}
                          </option>
                        ))}
                      </select>
                    </Field>
                  ) : (
                    <Field label="Descripción">
                      <input name="description" required maxLength={200} className="field" />
                    </Field>
                  )}
                  <Field label="Cantidad">
                    <input
                      name="quantity"
                      type="number"
                      min={1}
                      max={10000}
                      defaultValue={1}
                      required
                      className="field"
                    />
                  </Field>
                  {kind !== 'stock' && (
                    <Field label="Precio unitario sin IVA">
                      <input
                        name="unit_price"
                        type="number"
                        min={0}
                        max={99999999}
                        step=".01"
                        required
                        className="field"
                      />
                    </Field>
                  )}
                  {kind === 'por_pedir' && (
                    <>
                      <Field label="Proveedor">
                        <input name="supplier" required maxLength={200} className="field" />
                      </Field>
                      <Field label="Número de seguimiento (opcional)">
                        <input name="tracking" maxLength={200} className="field" />
                      </Field>
                    </>
                  )}
                  <button className="btn sm:col-span-2" disabled={busy}>
                    Agregar a la cotización
                  </button>
                </form>
              )}
              {o.notes && (
                <section className="card">
                  <h2 className="mb-3 font-bold">Notas del taller</h2>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                    {o.notes}
                  </p>
                </section>
              )}
              <section className="card">
                <div className="mb-4 flex items-center gap-2">
                  <Camera size={20} className="text-emerald-700" />
                  <h2 className="text-lg font-bold">Evidencia del servicio</h2>
                </div>
                {editor && (
                  <div className="mb-5 space-y-3">
                    <Field label="Descripción de la foto">
                      <input
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        maxLength={250}
                        className="field"
                        placeholder="Ej. Desgaste de las balatas delanteras"
                      />
                    </Field>
                    <div className="flex flex-wrap gap-3">
                      <label className="btn cursor-pointer">
                        <Camera size={17} />
                        Tomar foto
                        <input
                          aria-label="Tomar foto"
                          className="sr-only"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          capture="environment"
                          disabled={busy}
                          onChange={(e) => {
                            void upload(e.target.files?.[0]);
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <label className="btn-secondary cursor-pointer">
                        <ImagePlus size={17} />
                        Elegir de galería
                        <input
                          aria-label="Elegir foto de galería"
                          className="sr-only"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={busy}
                          onChange={(e) => {
                            void upload(e.target.files?.[0]);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-slate-400">
                      JPG, PNG o WebP · Máximo 8 MB · Visibles para el cliente.
                    </p>
                  </div>
                )}
                {detail.photos.length ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {detail.photos.map((p) => (
                      <figure key={p.id} className="overflow-hidden rounded-lg border">
                        {p.url ? (
                          <a href={p.url} target="_blank" rel="noreferrer">
                            <img
                              src={p.url}
                              alt={p.caption || 'Evidencia del servicio'}
                              className="h-52 w-full object-cover"
                              onError={() =>
                                setNotice(
                                  'Si una foto dejó de cargar, pulsa Actualizar para renovar su acceso.',
                                )
                              }
                            />
                          </a>
                        ) : (
                          <p className="p-5 text-sm">Foto no disponible. Actualiza la página.</p>
                        )}
                        <figcaption className="p-3 text-sm text-slate-500">
                          {p.caption || 'Evidencia del taller'}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Las fotos del trabajo aparecerán aquí.</p>
                )}
              </section>
            </div>
            <aside className="space-y-5 lg:sticky lg:top-6">
              <section className="card">
                <h2 className="mb-5 font-bold">Resumen de la cotización</h2>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <dt>Subtotal</dt>
                    <dd>{money(o.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <dt>IVA ({Number(o.tax_rate) * 100}%)</dt>
                    <dd>{money(o.tax)}</dd>
                  </div>
                  <div className="flex justify-between border-t pt-4 text-xl font-bold">
                    <dt>Total</dt>
                    <dd>{money(o.total)}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-right text-xs text-slate-400">Pesos mexicanos · MXN</p>
                {!editor && o.status === 'pendiente' && (
                  <div className="mt-6 space-y-3">
                    <p className="text-sm text-slate-500">
                      Revisa los conceptos antes de autorizar. Tu respuesta quedará registrada y no
                      podrás cambiarla desde este enlace.
                    </p>
                    <button
                      className="btn w-full"
                      disabled={busy}
                      onClick={() => decide('aprobada')}
                    >
                      <CheckCircle2 size={18} />
                      Aprobar cotización
                    </button>
                    <button
                      className="btn-secondary w-full text-red-700"
                      disabled={busy}
                      onClick={() => decide('rechazada')}
                    >
                      Rechazar cotización
                    </button>
                  </div>
                )}
                {!editor && o.status !== 'pendiente' && (
                  <p className="mt-5 flex items-center gap-2 text-sm text-slate-500">
                    <Clock size={17} />
                    Estado actual: {labels[o.status]}
                  </p>
                )}
              </section>
              {editor && !['rechazada', 'cancelada'].includes(o.status) && (
                <section className="card space-y-4">
                  <h2 className="font-bold">Comparte con tu cliente</h2>
                  <p className="text-xs leading-relaxed text-slate-500">
                    El enlace permite ver y responder esta cotización durante 30 días. Al generarlo
                    se bloquean los precios. Renovarlo invalida el enlace anterior.
                  </p>
                  <button
                    disabled={busy || detail.items.length === 0}
                    className="btn w-full"
                    onClick={() => operation('share')}
                  >
                    <Send size={17} />
                    {o.status === 'borrador'
                      ? 'Generar enlace y enviar'
                      : 'Generar / renovar enlace'}
                  </button>
                  {share && links && (
                    <>
                      <input
                        readOnly
                        aria-label="Enlace de cotización"
                        value={share}
                        className="field"
                      />
                      <button
                        className="btn-secondary w-full"
                        onClick={() =>
                          navigator.clipboard
                            .writeText(share)
                            .then(() => setNotice('Enlace copiado.'))
                            .catch(() => setError('Copia el enlace manualmente.'))
                        }
                      >
                        Copiar enlace
                      </button>
                      <a
                        href={share}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-center text-sm text-emerald-700 underline"
                      >
                        Ver como cliente
                      </a>
                      {links.whatsapp ? (
                        <a
                          className="btn w-full"
                          target="_blank"
                          rel="noreferrer"
                          href={links.whatsapp}
                        >
                          Enviar por WhatsApp
                        </a>
                      ) : (
                        <p className="text-xs text-slate-500">
                          El cliente no tiene un teléfono válido para WhatsApp. Comparte el enlace
                          manualmente.
                        </p>
                      )}
                      <div className="flex gap-2">
                        {links.email && (
                          <a className="btn-secondary flex-1" href={links.email}>
                            Correo
                          </a>
                        )}
                        {links.sms && (
                          <a className="btn-secondary flex-1" href={links.sms}>
                            SMS
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        Se abrirá tu aplicación de mensajería. El envío lo confirmas ahí.
                      </p>
                    </>
                  )}
                  <button
                    disabled={busy}
                    className="text-xs text-red-700 underline"
                    onClick={() => {
                      if (confirm('¿Revocar el enlace actual?')) void operation('revoke_link');
                    }}
                  >
                    Revocar acceso por enlace
                  </button>
                </section>
              )}
              {!editor && (
                <section className="rounded-xl bg-emerald-50 p-5 text-sm text-emerald-900">
                  <h2 className="font-semibold">Tu servicio, siempre a la vista</h2>
                  <p className="mt-2 leading-relaxed">
                    Puedes revisar aquí las fotos y las guías de tus refacciones. Para consultar tus
                    servicios desde una cuenta, pide una invitación al taller.
                  </p>
                  <Link className="mt-3 inline-block underline" href="/cuenta">
                    Ir a mi cuenta
                  </Link>
                </section>
              )}
            </aside>
          </div>
        </>
      )}
    </main>
  );
}
