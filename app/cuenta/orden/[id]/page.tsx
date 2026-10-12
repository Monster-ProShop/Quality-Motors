import { OrderView } from '@/components/order-view';
import { auth } from '@/lib/auth/server';
import { redirect, notFound } from 'next/navigation';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { data } = await auth.getSession();
  const user = data?.user;
  if (!user) redirect('/login');
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  return <OrderView id={id} />;
}
