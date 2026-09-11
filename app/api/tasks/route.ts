import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/staff";
import { revalidatePath } from "next/cache";
export async function POST(request: Request) {
  try {
    await requireStaff(request, true);
    const b = await request.json();
    if (typeof b.concept !== "string" || !b.concept.trim() || b.concept.length > 500 || typeof b.description !== "string" || b.description.length > 5000 || !Number.isFinite(Number(b.price)) || Number(b.price) < 0 || Number(b.price) > 99999999 || b.price === "") return NextResponse.json({error:"Revisa concepto y precio."},{status:400});
    const record = await prisma.serviceRecord.findUnique({where:{publicId:b.recordId}});
    if (!record) return NextResponse.json({error:"Servicio no encontrado"},{status:404});
    const task = await prisma.serviceTask.create({data:{serviceRecordId:record.id,concept:b.concept.trim(),description:b.description,price:Number(b.price)}});
    revalidatePath("/admin");
    return NextResponse.json({id:task.id});
  } catch(e) { return NextResponse.json({error:e instanceof Error && e.message === "FORBIDDEN" ? "Acceso denegado" : "No se pudo guardar"},{status:e instanceof Error && e.message === "FORBIDDEN"?403:500}); }
}
export async function PATCH(request: Request) {
  try {
    const user = await requireStaff(request);
    const b = await request.json();
    if (!["PENDING","IN_PROGRESS","WAITING_PARTS","COMPLETED"].includes(b.status)) return NextResponse.json({error:"Estado inválido"},{status:400});
    if (user.role !== "ADMIN" && ("price" in b || "concept" in b || "description" in b)) return NextResponse.json({error:"Solo administración puede modificar conceptos y precios"},{status:403});
    const data: {status:any;concept?:string;description?:string;price?:number} = {status:b.status};
    if (user.role === "ADMIN" && "price" in b) {
      if (!Number.isFinite(Number(b.price)) || Number(b.price)<0 || Number(b.price)>99999999 || b.price === "" || typeof b.concept !== "string" || !b.concept.trim() || b.concept.length>500 || typeof b.description !== "string" || b.description.length>5000) return NextResponse.json({error:"Datos inválidos"},{status:400});
      Object.assign(data,{price:Number(b.price),concept:b.concept.trim(),description:b.description});
    }
    await prisma.serviceTask.update({where:{id:b.id},data});
    revalidatePath("/admin");
    return NextResponse.json({ok:true});
  } catch(e) { return NextResponse.json({error:"No se pudo actualizar"},{status:e instanceof Error && e.message==="FORBIDDEN"?403:500}); }
}
