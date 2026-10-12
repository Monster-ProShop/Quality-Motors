import { Invitation } from '@/components/invitation';
import { Setup } from '@/components/ui';
import { configured } from '@/lib/supabase/client';
export default function Page() {
  return configured() ? <Invitation /> : <Setup />;
}
