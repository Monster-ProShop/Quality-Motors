import { redirect } from 'next/navigation';
import { configured } from '@/lib/supabase/client';
import { serverDb } from '@/lib/supabase/server';
import { Setup } from '@/components/ui';
import { Account } from '@/components/account';
export default async function Page() {
  if (!configured()) return <Setup />;
  const db = await serverDb();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect('/login');
  return <Account email={user.email || ''} />;
}
