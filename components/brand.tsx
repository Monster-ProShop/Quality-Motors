import Image from 'next/image';
import { MapPin, MessageCircle, Phone } from 'lucide-react';

export const workshop = {
  name: 'Quality Motors',
  address: 'Priv. Atotonilco #625-A, Col. El Triángulo',
  phone: '33 1527 4680',
  phoneHref: 'tel:+523315274680',
  whatsappHref: 'https://wa.me/523315274680',
};

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Image
      src="/quality-motors-logo-v2.png"
      alt="Quality Motors"
      width={640}
      height={360}
      priority
      className={compact ? 'h-14 w-auto object-contain' : 'h-24 w-auto object-contain sm:h-28'}
    />
  );
}

export function WorkshopContact({ dark = false }: { dark?: boolean }) {
  const muted = dark ? 'text-slate-300' : 'text-slate-600';
  return (
    <section className={dark ? 'rounded-2xl border border-white/10 bg-white/5 p-5' : 'contact-card'}>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">
        Taller acreditado
      </p>
      <div className={`mt-4 space-y-3 text-sm ${muted}`}>
        <p className="flex items-start gap-3">
          <MapPin className="mt-0.5 shrink-0 text-red-600" size={18} />
          <span>{workshop.address}</span>
        </p>
        <a className="flex items-center gap-3 font-semibold hover:text-red-600" href={workshop.phoneHref}>
          <Phone className="shrink-0 text-red-600" size={18} />
          {workshop.phone}
        </a>
        <a
          className="flex items-center gap-3 font-semibold hover:text-red-600"
          href={workshop.whatsappHref}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle className="shrink-0 text-red-600" size={18} />
          Enviar mensaje por WhatsApp
        </a>
      </div>
    </section>
  );
}
