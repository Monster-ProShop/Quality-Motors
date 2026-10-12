import { auth } from '@/lib/auth/server';
import { asUser, mutate } from '@/lib/db';
import { deletePhoto, uploadPhoto } from '@/lib/storage';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const { data } = await auth.getSession();
  if (!data?.user) return Response.json({ error: 'Inicia sesión.' }, { status: 401 });
  let path = '';
  try {
    const form = await request.formData();
    const file = form.get('file');
    const workshopId = String(form.get('workshop_id') || '');
    const orderId = String(form.get('order_id') || '');
    const caption = String(form.get('caption') || '').slice(0, 250);
    if (!(file instanceof File)) throw new Error('Selecciona una foto.');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8_388_608)
      throw new Error('Usa una imagen JPG, PNG o WebP de hasta 8 MB.');
    await asUser(data.user.id, async (client) => {
      const check = await client.query(
        'select 1 from public.orders where id=$1::uuid and workshop_id=$2::uuid',
        [orderId, workshopId],
      );
      if (!check.rowCount) throw new Error('No tienes acceso a esta orden.');
    });
    const extension =
      file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
    path = workshopId + '/' + orderId + '/' + crypto.randomUUID() + '.' + extension;
    await uploadPhoto(path, file);
    try {
      await mutate(data.user.id, 'add_photo', {
        workshop_id: workshopId,
        order_id: orderId,
        path,
        caption,
      });
    } catch (error) {
      await deletePhoto(path);
      throw error;
    }
    return Response.json({});
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'No pudimos subir la foto.' },
      { status: 400 },
    );
  }
}
