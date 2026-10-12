import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Quality Motors | Tu taller, en orden',
  description: 'Cotizaciones, evidencias y seguimiento para tu taller mecánico.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX">
      <body>{children}</body>
    </html>
  );
}
