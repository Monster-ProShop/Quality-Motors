'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-lg px-5 py-20">
      <h1 className="text-3xl font-bold">No pudimos cargar esta página</h1>
      <p className="my-5 text-slate-500">Revisa tu conexión y vuelve a intentar.</p>
      <button className="btn" onClick={reset}>
        Intentar de nuevo
      </button>
    </main>
  );
}
