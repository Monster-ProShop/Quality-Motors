import { readFile } from "node:fs/promises";
import path from "node:path";
import { getPublicRecord } from "@/lib/service-record";
import { createReport, ReportData } from "@/lib/report";
export const runtime="nodejs";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const record=await getPublicRecord(id);
  if(!record)return Response.json({error:"Servicio no encontrado"},{status:404});
  const data:ReportData={id:record.publicId,customer:record.customer.name,vehicle:`${record.vehicle.make} ${record.vehicle.model} ${record.vehicle.year} | ${record.vehicle.licensePlate}`,entry:record.entryDate.toLocaleDateString("es-MX",{timeZone:"America/Mexico_City"}),notes:record.notes||"",paid:record.payments.filter(p=>p.status==="PAID").reduce((s,p)=>s+Number(p.amount),0),tasks:[]};
  for(const task of record.tasks) {
    const photos=[];
    for(const image of task.images) {
      let bytes:Uint8Array|undefined;
      try {
        const url=new URL(image.url);
        if(url.protocol!=="https:" || url.hostname!=="res.cloudinary.com" || !process.env.CLOUDINARY_CLOUD_NAME || !url.pathname.startsWith("/"+process.env.CLOUDINARY_CLOUD_NAME+"/"))throw new Error("Untrusted image host");
        const response=await fetch(url,{redirect:"error",signal:AbortSignal.timeout(10000)});
        if(!response.ok)throw new Error("Image unavailable");
        const buffer=new Uint8Array(await response.arrayBuffer());
        if(buffer.length<=10*1024*1024)bytes=buffer;
      } catch {}
      photos.push({kind:image.kind,bytes});
    }
    data.tasks.push({concept:task.concept,description:task.description||"",price:Number(task.price),priced:task.priced,status:task.status,photos});
  }
  const pdf=await createReport(data,await readFile(path.join(process.cwd(),"public/quality-motors-logo.png")));
  return new Response(Buffer.from(pdf),{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="${record.publicId.replace(/[^a-zA-Z0-9-]/g,"")}.pdf"`,"Cache-Control":"private, no-store"}});
}
