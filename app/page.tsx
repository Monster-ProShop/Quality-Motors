import Link from 'next/link';
import { ArrowRight, ShieldCheck, Camera, ClipboardList, MapPin, Phone } from 'lucide-react';
import { BrandLogo, workshop } from '@/components/brand';
export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <BrandLogo compact />
        <Link className="btn-secondary" href="/login">
          Iniciar sesión
        </Link>
      </header>
      <section className="border-y border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:py-28">
          <div>
            <p className="mb-5 text-sm font-bold uppercase tracking-[0.22em] text-red-500">
              Mecánica con transparencia
            </p>
            <h1 className="max-w-2xl text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl">
              Tu auto en buenas manos.
            </h1>
            <p className="my-7 max-w-xl text-lg leading-relaxed text-slate-300">
              Consulta cotizaciones, autoriza trabajos y sigue el avance de tu servicio con fotos y
              datos claros, desde cualquier dispositivo.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/login" className="btn">
                Entrar a mi portal <ArrowRight size={18} />
              </Link>
              <Link href="/login?registro=1" className="btn-dark">
                Crear cuenta
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[.04] p-7 shadow-2xl shadow-black/20 sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">Nuestro compromiso</p>
            <div className="mt-7 space-y-7">
            {[
              [
                ClipboardList,
                'Cotizaciones claras',
                'Mano de obra y refacciones desglosadas antes de autorizar.',
              ],
              [Camera, 'Evidencia del servicio', 'Revisa fotografías y avances del trabajo desde tu portal.'],
              [
                ShieldCheck,
                'Acceso protegido',
                'Tu historial y tus decisiones quedan disponibles sólo para ti.',
              ],
            ].map(([Icon, title, copy]) => {
              const I = Icon as typeof ClipboardList;
              return (
                <div key={String(title)} className="flex gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-600/15">
                    <I className="text-red-500" size={22} />
                  </span>
                  <div>
                    <p className="font-semibold">{String(title)}</p>
                    <p className="mt-1 text-sm text-slate-400">{String(copy)}</p>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      </section>
      <footer className="mx-auto grid max-w-6xl gap-6 px-5 py-8 text-sm text-slate-600 sm:px-8 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="font-bold text-slate-900">{workshop.name} · Taller acreditado</p>
          <p className="mt-2 flex items-center gap-2"><MapPin size={16} className="text-red-600" />{workshop.address}</p>
        </div>
        <a className="flex items-center gap-2 font-bold text-red-700" href={workshop.phoneHref}>
          <Phone size={17} /> {workshop.phone}
        </a>
      </footer>
    </main>
  );
}
