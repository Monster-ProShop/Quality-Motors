import { OrderView } from '@/components/order-view';
import { Setup } from '@/components/ui';
import { configured } from '@/lib/supabase/client';
export const metadata = {
  title: 'Tu cotización | Quality Motors',
  robots: { index: false, follow: false },
};
export default function Page() {
  return configured() ? <OrderView publicLink /> : <Setup />;
}
