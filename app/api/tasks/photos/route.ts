import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireStaff } from "@/lib/staff";
import { prisma } from "@/lib/prisma";
import { cloudinary, expiryDate } from "@/lib/cloudinary";
export async function POST(request:Request) {
  try {
    const user = await requireStaff(request);
    if(Number(request.headers.get("content-length"))>6*1024*1024) return NextResponse.json({error:"Máximo 5 MB por imagen"},{status:413});
    const form = await request.formData();
    const file = form.get("file");
    const kind = String(form.get("kind"));
    if(user.role!=="ADMIN" && kind!=="BEFORE") return NextResponse.json({error:"El trabajador solo puede subir fotografías de antes."},{status:403});
    const taskId = String(form.get("taskId"));
    if(!(file instanceof File) || file.size>5*1024*1024 || !["image/jpeg","image/png","image/webp"].includes(file.type) || !["BEFORE","AFTER"].includes(kind)) return NextResponse.json({error:"Usa JPG, PNG o WebP de máximo 5 MB."},{status:400});
    if(!await prisma.serviceTask.findFirst({where:{id:taskId,serviceRecord:{deletedAt:null}}})) return NextResponse.json({error:"Tarea no encontrada"},{status:404});
    const storageId = "quality-motors/"+randomUUID();
    const result = await cloudinary("upload",{public_id:storageId,overwrite:"false",format:"png"},file);
    try {
      await prisma.serviceImage.create({data:{taskId,kind,url:result.secure_url,storageId,expiresAt:expiryDate(),alt:kind==="BEFORE"?"Antes":"Después"}});
    } catch(error) {
      await cloudinary("destroy",{public_id:storageId,invalidate:"true"});
      throw error;
    }
    return NextResponse.json({ok:true});
  } catch(e) { return NextResponse.json({error:"No se pudo subir. Revisa la configuración de Cloudinary."},{status:e instanceof Error && e.message==="FORBIDDEN"?403:500}); }
}
