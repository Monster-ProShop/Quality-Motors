import { auth } from '@/lib/auth/server';
import { asUser, mutate, rows } from '@/lib/db';
import { signPhotos } from '@/lib/storage';
import type { OrderDetail } from '@/types/domain';

export const runtime = 'nodejs';

function failure(error: unknown) {
  const message =
    error instanceof Error && !/password|secret|database|connection/i.test(error.message)
      ? error.message
      : 'No se pudo completar la operación.';
  return Response.json({ error: message }, { status: 400 });
}

async function currentUser() {
  const { data } = await auth.getSession();
  return data?.user ?? null;
}

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: 'Inicia sesión.' }, { status: 401 });
  const url = new URL(request.url);
  const resource = url.searchParams.get('resource');
  try {
    if (resource === 'account') {
      return Response.json(
        await asUser(user.id, async (client) => ({
          orders: await rows(
            client,
            `select t.* from public.order_totals t
             where exists(select 1 from public.client_accounts a
              where a.client_id=t.client_id and a.user_id=private.current_user())
              order by t.created_at desc`,
          ),
        })),
      );
    }
    if (resource === 'order') {
      const id = url.searchParams.get('id');
      const editor = url.searchParams.get('editor') === '1';
      if (!id) throw new Error('Falta la orden.');
      const data = await asUser(user.id, async (client) => {
        const result = await client.query<{ data: OrderDetail }>(
          'select public.get_order($1::uuid) data',
          [id],
        );
        const detail = result.rows[0]?.data;
        if (!detail) throw new Error('Orden no encontrada.');
        if (!editor) return { detail, products: [], contact: null };
        const [products, contacts] = await Promise.all([
          rows(client, 'select * from public.inventory where workshop_id=$1 order by name', [
            detail.order.workshop_id,
          ]),
          rows(client, 'select * from public.clients where id=$1', [detail.order.client_id]),
        ]);
        return { detail, products, contact: contacts[0] ?? null };
      });
      data.detail.photos = await signPhotos(data.detail.photos);
      return Response.json(data);
    }
    const workshopId = url.searchParams.get('workshop_id');
    return Response.json(
      await asUser(user.id, async (client) => {
        const workshops = await rows(
          client,
          `select w.id,w.name,m.role from public.workshop_members m
           join public.workshops w on w.id=m.workshop_id
           where m.user_id=private.current_user() order by w.name`,
        );
        if (!workshopId) return { workshops };
        const [clients, vehicles, products, orders, invitations] = await Promise.all([
          rows(client, 'select * from public.clients where workshop_id=$1 order by name', [
            workshopId,
          ]),
          rows(client, 'select * from public.vehicles where workshop_id=$1', [workshopId]),
          rows(client, 'select * from public.inventory where workshop_id=$1 order by name', [
            workshopId,
          ]),
          rows(
            client,
            'select * from public.order_totals where workshop_id=$1 order by created_at desc',
            [workshopId],
          ),
          rows(
            client,
            `select id,email,role,expires_at,used_at from public.invitations
             where workshop_id=$1 order by expires_at desc`,
            [workshopId],
          ),
        ]);
        return { workshops, clients, vehicles, products, orders, invitations };
      }),
    );
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: 'Inicia sesión.' }, { status: 401 });
  try {
    const { action, payload } = (await request.json()) as {
      action: string;
      payload: Record<string, unknown>;
    };
    if (action === 'decide') {
      await asUser(user.id, (client) =>
        client.query('select public.decide_order($1::uuid,$2,null)', [
          payload.order_id,
          payload.decision,
        ]),
      );
      return Response.json({});
    }
    return Response.json(await mutate(user.id, action, payload));
  } catch (error) {
    return failure(error);
  }
}
