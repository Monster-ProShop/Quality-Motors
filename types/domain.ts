export type Status =
  | 'borrador'
  | 'pendiente'
  | 'aprobada'
  | 'rechazada'
  | 'en_proceso'
  | 'lista'
  | 'entregada'
  | 'cancelada';
export type ItemKind = 'mano_obra' | 'stock' | 'por_pedir';
export interface Workshop {
  id: string;
  name: string;
  role?: 'admin' | 'worker';
}
export interface Client {
  id: string;
  workshop_id: string;
  name: string;
  email: string;
  phone: string;
}
export interface Vehicle {
  id: string;
  client_id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  plates: string;
}
export interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  price: number;
}
export interface Item {
  id: string;
  description: string;
  kind: ItemKind;
  quantity: number;
  unit_price: number;
  amount: number;
  supplier: string | null;
  tracking: string | null;
}
export interface Photo {
  id: string;
  path: string;
  caption: string;
  url?: string;
}
export interface Order {
  id: string;
  workshop_id: string;
  client_id: string;
  vehicle_id: string;
  folio: number;
  title: string;
  notes: string;
  status: Status;
  tax_rate: number;
  subtotal: number;
  tax: number;
  total: number;
  created_at: string;
  client_name?: string;
  vehicle_label?: string;
}
export interface OrderDetail {
  order: Order;
  items: Item[];
  photos: Photo[];
  workshop: string;
  client: string;
  vehicle: string;
}
