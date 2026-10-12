'use client';
import Link from 'next/link';
import { useState } from 'react';
import { browserDb } from '@/lib/supabase/client';
import { Notice } from './ui';
export function Invitation() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  return (
    <main className="mx-auto max-w-lg px-5 py-20">
      <div className="card space-y-5">
        <h1 className="text-2xl font-bold">Te invitaron a Quality Motors</h1>
        <p className="text-slate-500">
          Inicia sesión con el correo que recibió la invitación y confírmalo. Después vuelve a este
          enlace para aceptar el acceso.
        </p>
        <Link href="/login" className="btn-secondary">
          Iniciar sesión o registrarme
        </Link>
        {error && <Notice error>{error}</Notice>}
        <button
          disabled={busy}
          className="btn w-full"
          onClick={async () => {
            setBusy(true);
            setError('');
            try {
              const token = new URLSearchParams(location.hash.slice(1)).get('token');
              if (!token) throw new Error('Enlace incompleto.');
              const { data, error } = await browserDb().rpc('app_mutate', {
                action: 'accept_invite',
                payload: { token },
              });
              if (error) throw error;
              location.replace(data.role === 'client' ? '/cuenta' : '/taller');
            } catch {
              setError(
                'No se pudo aceptar. Revisa que hayas iniciado sesión con el correo invitado y que la invitación no haya vencido.',
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? 'Validando…' : 'Aceptar invitación'}
        </button>
      </div>
    </main>
  );
}
