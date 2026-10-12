import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/server';
import { Dashboard } from '@/components/dashboard';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const { data } = await auth.getSession();
  const user = data?.user;
  if (!user) redirect('/login');
  return <Dashboard email={user.email} />;
}
