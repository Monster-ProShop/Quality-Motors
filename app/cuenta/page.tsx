import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/server';
import { Account } from '@/components/account';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const { data } = await auth.getSession();
  const user = data?.user;
  if (!user) redirect('/login');
  return <Account email={user.email} />;
}
