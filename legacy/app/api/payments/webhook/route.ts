import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function POST(req: Request) { const body = await req.json(); const paymentId = body?.data?.id ?? body?.id; if (paymentId && body.type === "payment") await prisma.payment.updateMany({ where: { mercadoPagoId: String(paymentId) }, data: { status: "PAID", paidAt: new Date() } }); return NextResponse.json({ received: true }); }
