import { NextResponse } from "next/server";
import { getPublicRecord } from "@/lib/service-record";
export async function GET(req: Request) { const id = new URL(req.url).searchParams.get("id"); if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 }); const record = await getPublicRecord(id); return record ? NextResponse.json(record) : NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 }); }
