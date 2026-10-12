import Link from 'next/link';
import { Wrench, ArrowRight, ShieldCheck, Camera, ClipboardList } from 'lucide-react';
export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex items-center justify-between">
        <span className="flex items-center gap-3 text-xl font-bold">
          <Wrench className="text-emerald-700" />
          Quality Motors
        </span>
        <Link className="btn-secondary" href="/login">
          Iniciar sesión
        </Link>
      </header>
      <section className="grid items-center gap-12 py-24 md:grid-cols-2">
        <div>
          <p className="mb-5 text-sm font-bold uppercase tracking-widest text-emerald-700">
            Del diagnóstico a la entrega
          </p>
          <h1 className="text-5xl font-bold leading-tight tracking-tight">
            Tu taller,
            <br />
            en orden.
          </h1>
          <p className="my-6 max-w-lg text-lg leading-relaxed text-slate-500">
            Menos pendientes. Más confianza. Cotiza, organiza tus refacciones y comparte cada avance
            con tus clientes en un solo lugar.
          </p>
          <Link href="/login?registro=1" className="btn">
            Crear mi cuenta <ArrowRight size={18} />
          </Link>
          <Link href="/taller" className="ml-4 inline-block text-sm font-semibold text-emerald-800">
            Ir al taller
          </Link>
        </div>
        <div className="rounded-3xl bg-slate-900 p-8 text-white">
          <div className="flex items-center gap-3 border-b border-slate-700 pb-5">
            <Wrench size={28} />
            <div>
              <p className="font-bold">QUALITY MOTORS</p>
              <p className="text-sm text-slate-400">Gestión de talleres</p>
            </div>
          </div>
          <div className="space-y-7 py-8">
            {[
              [
                ClipboardList,
                'Cada concepto, claro',
                'Mano de obra y refacciones en una cotización.',
              ],
              [Camera, 'El avance a la vista', 'Fotos del trabajo, directamente desde el celular.'],
              [
                ShieldCheck,
                'La confianza se construye',
                'Autorización del cliente y acceso privado por taller.',
              ],
            ].map(([Icon, title, copy]) => {
              const I = Icon as typeof Wrench;
              return (
                <div key={String(title)} className="flex gap-4">
                  <I className="shrink-0 text-emerald-400" />
                  <div>
                    <p className="font-semibold">{String(title)}</p>
                    <p className="mt-1 text-sm text-slate-400">{String(copy)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <footer className="border-t border-slate-200 py-6 text-sm text-slate-500">
        Hecho para el ritmo de tu taller. Importes en pesos mexicanos.
      </footer>
    </main>
  );
}
