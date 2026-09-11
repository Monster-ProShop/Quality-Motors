import { MercadoPagoConfig, Preference } from "mercadopago";

type PaymentPreferenceInput = {
  recordId: string;
  paymentId: string;
  title: string;
  amount: number;
};

export async function createPaymentPreference(
  input: PaymentPreferenceInput
) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN is not configured");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured");
  }

  const client = new MercadoPagoConfig({
    accessToken,
  });

  const preference = new Preference(client);

  return preference.create({
    body: {
      items: [
        {
          id: input.paymentId,
          title: input.title,
          quantity: 1,
          unit_price: input.amount,
          currency_id: "MXN",
        },
      ],
      external_reference: input.recordId,
      back_urls: {
        success: `${appUrl}/portal/${input.recordId}?payment=success`,
        failure: `${appUrl}/portal/${input.recordId}?payment=failure`,
        pending: `${appUrl}/portal/${input.recordId}?payment=pending`,
      },
      auto_return: "approved",
      notification_url: `${appUrl}/api/payments/webhook`,
    },
  });
}
