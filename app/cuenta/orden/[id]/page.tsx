import { OrderView } from '@/components/order-view';
import { Setup } from '@/components/ui';
import { configured } from '@/lib/supabase/client';
import { serverDb } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (!configured()) return <Setup />;
  const db = await serverDb();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect('/login');
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  return <OrderView id={id} />;
}
