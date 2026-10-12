import { AuthForm } from '@/components/auth-form';
import { Setup } from '@/components/ui';
import { configured } from '@/lib/supabase/client';
import Link from 'next/link';
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ registro?: string }>;
}) {
  if (!configured()) return <Setup />;
  const { registro } = await searchParams;
  return (
    <main className="px-5 py-16">
      <Link href="/" className="mb-8 block text-center text-lg font-bold">
        Quality Motors
      </Link>
      <AuthForm initialSignup={registro === '1'} />
    </main>
  );
}
