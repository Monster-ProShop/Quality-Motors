import { browserDb } from './supabase/client';
export async function mutate(action: string, payload: Record<string, unknown>) {
  const { data, error } = await browserDb().rpc('app_mutate', { action, payload });
  if (error)
    throw new Error(
      error.code === 'P0001'
        ? error.message
        : 'No se pudo guardar. Revisa los campos e intenta de nuevo.',
    );
  return data;
}
export function errorText(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'No se pudo completar la operación. Intenta de nuevo.';
}
