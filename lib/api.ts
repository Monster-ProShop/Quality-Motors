import { apiPost } from './http';
export async function mutate(action: string, payload: Record<string, unknown>) {
  return apiPost<Record<string, any>>('/api/app', { action, payload });
}
export function errorText(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'No se pudo completar la operación. Intenta de nuevo.';
}
