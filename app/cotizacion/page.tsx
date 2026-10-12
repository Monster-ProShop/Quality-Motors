import { OrderView } from '@/components/order-view';
export const metadata = {
  title: 'Tu cotización | Quality Motors',
  robots: { index: false, follow: false },
};
export default function Page() {
  return <OrderView publicLink />;
}
