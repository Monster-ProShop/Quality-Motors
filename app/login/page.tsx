import { AuthForm } from '@/components/auth-form';
import Link from 'next/link';
import { BrandLogo, WorkshopContact } from '@/components/brand';
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ registro?: string }>;
}) {
  const { registro } = await searchParams;
  return (
    <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-2">
      <section className="mx-auto hidden max-w-md lg:block">
        <Link href="/"><BrandLogo /></Link>
        <h1 className="mt-8 text-4xl font-black tracking-tight">Servicio claro desde el primer momento.</h1>
        <p className="mb-7 mt-4 leading-relaxed text-slate-600">Consulta tus cotizaciones, fotografías y avances en un portal privado.</p>
        <WorkshopContact />
      </section>
      <div>
        <Link href="/" className="mb-7 flex justify-center lg:hidden"><BrandLogo compact /></Link>
        <AuthForm initialSignup={registro === '1'} />
      </div>
    </main>
  );
}
