import { MercadoPagoConfig, Preference } from "mercadopago";

export async function createPaymentPreference(input: { recordId: string; paymentId: string; title: string; amount: number }) {
  const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! });
  const preference = new Preference(client);
  return preference.create({ body: { items: [{ id: input.paymentId, title: input.title, quantity: 1, unit_price: input.amount, currency_id: "MXN" }], external_reference: input.recordId, back_urls: { success: `${process.env.NEXT_PUBLIC_APP_URL}/portal/${input.recordId}?payment=success`, failure: `${process.env.NEXT_PUBLIC_APP_URL}/portal/${input.recordId}?payment=failure`, pending: `${process.env.NEXT_PUBLIC_APP_URL}/portal/${input.recordId}?payment=pending` }, auto_return: "approved", notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook` } });
}
