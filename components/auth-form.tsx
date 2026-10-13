'use client';
import { useState, type FormEvent } from 'react';
import { authClient } from '@/lib/auth/client';
import { Field, Notice } from './ui';
export function AuthForm({ initialSignup = false }: { initialSignup?: boolean }) {
  const [signup, setSignup] = useState(initialSignup),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    const data = new FormData(e.currentTarget);
    const email = String(data.get('email'));
    const password = String(data.get('password'));
    try {
      const result = signup
        ? await authClient.signUp.email({
            email,
            password,
            name: String(data.get('name')),
          })
        : await authClient.signIn.email({ email, password });
      if (result.error) throw result.error;
      if (signup)
        setMessage(
          'Revisa tu correo y confirma tu cuenta. Después inicia sesión. Si tienes una invitación, vuelve a abrirla.',
        );
      else window.location.assign('/cuenta');
    } catch {
      setError(
        signup
          ? 'No pudimos crear la cuenta. Revisa tus datos e intenta de nuevo.'
          : 'No pudimos iniciar sesión. Verifica tu correo, contraseña y confirmación de correo.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="card mx-auto max-w-md">
      <h1 className="text-2xl font-bold">{signup ? 'Crea tu cuenta' : 'Qué gusto verte'}</h1>
      <p className="mb-6 mt-2 text-sm text-slate-500">Acceso seguro para talleres y clientes.</p>
      <form onSubmit={submit} className="space-y-4">
        {signup && (
          <Field label="Nombre completo">
            <input
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={120}
              className="field"
            />
          </Field>
        )}
        <Field label="Correo electrónico">
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            className="field"
          />
        </Field>
        <Field label="Contraseña">
          <input
            name="password"
            type="password"
            autoComplete={signup ? 'new-password' : 'current-password'}
            minLength={10}
            maxLength={128}
            required
            className="field"
          />
        </Field>
        {signup && (
          <p className="text-xs text-slate-500">
            Usa al menos 10 caracteres. Confirmaremos tu correo antes de darte acceso.
          </p>
        )}
        {error && <Notice error>{error}</Notice>}
        {message && <Notice>{message}</Notice>}
        <button disabled={busy} className="btn w-full">
          {busy ? 'Un momento…' : signup ? 'Crear cuenta' : 'Iniciar sesión'}
        </button>
      </form>
      <button
        className="mt-5 text-sm font-semibold text-red-700"
        onClick={() => {
          setSignup(!signup);
          setError('');
          setMessage('');
        }}
      >
        {signup ? 'Ya tengo cuenta' : 'Quiero crear una cuenta'}
      </button>
    </div>
  );
}
