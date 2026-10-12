import { auth } from '@/lib/auth/server';
import { asUser, pool } from '@/lib/db';
import { signPhotos } from '@/lib/storage';
import type { OrderDetail } from '@/types/domain';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { action, token, orderId, decision } = (await request.json()) as {
      action: 'read' | 'decide';
      token: string;
      orderId?: string;
      decision?: 'aprobada' | 'rechazada';
    };
    if (!token || token.length !== 64) throw new Error('El enlace está incompleto.');
    const { data } = await auth.getSession();
    if (action === 'decide') {
      if (!orderId || !decision) throw new Error('Respuesta incompleta.');
      if (data?.user) {
        await asUser(data.user.id, (client) =>
          client.query('select public.decide_order($1::uuid,$2,$3)', [orderId, decision, token]),
        );
      } else {
        await pool.query('select private.decide_order($1::uuid,$2,$3)', [orderId, decision, token]);
      }
      return Response.json({});
    }
    const result = await pool.query<{ data: OrderDetail }>('select private.public_order($1) data', [
      token,
    ]);
    const detail = result.rows[0]?.data;
    if (!detail) throw new Error('La orden no está disponible.');
    detail.photos = await signPhotos(detail.photos);
    return Response.json({ detail });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'No se pudo abrir la orden.' },
      { status: 400 },
    );
  }
}
