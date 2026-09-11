import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const required = ["customerName", "make", "model", "year", "licensePlate", "concept", "price"];
    if (required.some((field) => !body[field])) return NextResponse.json({ error: "Completa todos los campos requeridos." }, { status: 400 });

    const publicId = `SR-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const record = await prisma.serviceRecord.create({
      data: {
        publicId,
        customer: { create: { name: body.customerName, email: body.email || null, phone: body.phone || null } },
        vehicle: { create: { make: body.make, model: body.model, year: Number(body.year), vin: body.vin || null, licensePlate: body.licensePlate } },
        tasks: { create: { concept: body.concept, price: Number(body.price), description: body.description || null } },
      },
    });
    return NextResponse.json({ publicId: record.publicId }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo crear el servicio." }, { status: 500 });
  }
}
