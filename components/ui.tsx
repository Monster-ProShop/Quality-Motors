import { labels } from '@/lib/format';
import type { Status } from '@/types/domain';
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  return (
    <div
      role={error ? 'alert' : 'status'}
      className={`rounded-lg border p-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}
    >
      {children}
    </div>
  );
}
export function Badge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${['rechazada', 'cancelada'].includes(status) ? 'bg-red-50 text-red-700' : status === 'pendiente' ? 'bg-amber-50 text-amber-800' : status === 'borrador' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-800'}`}
    >
      {labels[status]}
    </span>
  );
}
export function Setup() {
  return (
    <main className="mx-auto max-w-xl px-5 py-20">
      <h1 className="mb-4 text-3xl font-bold">Conecta tu taller</h1>
      <Notice>
        Falta configurar Neon. Sigue el README del proyecto, despliega la configuración y el esquema
        en una rama de Neon, y agrega las variables a .env.local. Después reinicia la aplicación.
      </Notice>
      <a href="/" className="btn-secondary mt-5">
        Volver al inicio
      </a>
    </main>
  );
}
