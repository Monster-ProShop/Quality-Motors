import "./globals.css";
import Image from "next/image";
import Link from "next/link";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body><header className="site-header"><Link href="/" className="brand"><Image src="/quality-motors-logo.png" alt="Quality Motors" width={58} height={58} className="brand-logo" /><span><strong>QUALITY MOTORS</strong><small>SERVICE & REPAIR</small></span></Link><nav><Link href="/">Inicio</Link><Link href="/portal">Consultar servicio</Link><Link href="/admin">Panel del taller</Link></nav></header>{children}</body></html>;
}
