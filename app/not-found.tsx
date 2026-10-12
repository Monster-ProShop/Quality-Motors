import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-5 py-20">
      <h1 className="text-3xl font-bold">No encontramos esta página</h1>
      <p className="my-5 text-slate-500">Verifica el enlace o vuelve a tu cuenta.</p>
      <Link className="btn" href="/cuenta">
        Ir a mi cuenta
      </Link>
    </main>
  );
}
