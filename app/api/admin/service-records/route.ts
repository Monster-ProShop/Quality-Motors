import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  const fields = ["customerName", "make", "model", "licensePlate", "concept"];
  if (!body || fields.some(key => typeof body[key] !== "string" || !body[key].trim() || body[key].length > 1000)
      || !Number.isInteger(Number(body.year)) || Number(body.year) < 1886 || Number(body.year) > new Date().getFullYear() + 2
      || body.price === "" || body.price == null || !Number.isFinite(Number(body.price)) || Number(body.price) < 0) {
    return NextResponse.json({ error: "Revisa los campos obligatorios, el año y el precio." }, { status: 400 });
  }
  try {
    const record = await prisma.$transaction(async tx => {
      const customer = await tx.customer.create({ data: {
        name: body.customerName.trim(),
        email: typeof body.email === "string" ? body.email.trim() || null : null,
        phone: typeof body.phone === "string" ? body.phone.trim() || null : null,
      } });
      const vehicle = await tx.vehicle.create({ data: {
        customerId: customer.id, make: body.make.trim(), model: body.model.trim(),
        year: Number(body.year), licensePlate: body.licensePlate.trim(),
        vin: typeof body.vin === "string" ? body.vin.trim() || null : null,
      } });
      return tx.serviceRecord.create({ data: {
        publicId: `SR-${new Date().getFullYear()}-${randomUUID()}`,
        customerId: customer.id, vehicleId: vehicle.id,
        tasks: { create: { concept: body.concept.trim(), price: Number(body.price) } },
      } });
    });
    return NextResponse.json({ publicId: record.publicId }, { status: 201 });
  } catch (error) {
    console.error("Service creation failed", error);
    return NextResponse.json({ error: "No se pudo guardar. Verifica la conexión y las tablas de la base de datos." }, { status: 500 });
  }
}
