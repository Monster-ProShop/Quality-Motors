import { requireStaff } from "@/lib/staff";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}) {
  try {
    await requireStaff(request,true);
    const {id}=await params,b=await request.json();
    if(typeof b.notes!=="string" || b.notes.length>5000 || ["make","model","licensePlate"].some(k=>typeof b[k]!=="string"||!b[k].trim()||b[k].length>100) || !Number.isInteger(Number(b.year)) || Number(b.year)<1886 || Number(b.year)>new Date().getFullYear()+2)return Response.json({error:"Revisa los datos del vehículo."},{status:400});
    const record=await prisma.serviceRecord.findFirst({where:{publicId:id,deletedAt:null}});
    if(!record)return Response.json({error:"Servicio no encontrado"},{status:404});
    await prisma.serviceRecord.update({where:{id:record.id},data:{notes:b.notes,vehicle:{update:{make:b.make.trim(),model:b.model.trim(),licensePlate:b.licensePlate.trim(),year:Number(b.year)}}}});
    revalidatePath("/admin");revalidatePath("/portal/"+id);
    return Response.json({ok:true});
  } catch(e){return Response.json({error:"No se pudo modificar"},{status:e instanceof Error&&e.message==="FORBIDDEN"?403:500});}
}
export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}) {
  try {
    await requireStaff(request,true);
    const {id}=await params,b=await request.json();
    if(b.confirm!==id)return Response.json({error:"Confirma el ID del servicio."},{status:400});
    await prisma.serviceRecord.update({where:{publicId:id},data:{deletedAt:new Date()}});
    revalidatePath("/admin");revalidatePath("/portal/"+id);
    return Response.json({ok:true});
  } catch(e){return Response.json({error:"No se pudo eliminar"},{status:e instanceof Error&&e.message==="FORBIDDEN"?403:500});}
}
