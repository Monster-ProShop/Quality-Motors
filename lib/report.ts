import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { progress, statuses } from "./progress";
type Photo = {kind:string;bytes?:Uint8Array};
export type ReportData = {id:string;customer:string;vehicle:string;entry:string;notes:string;paid:number;tasks:{concept:string;description:string;price:number;status:string;photos:Photo[]}[]};
export async function createReport(data:ReportData,logo:Uint8Array) {
  const doc=await PDFDocument.create();
  const normal=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold),brand=await doc.embedPng(logo);
  const navy=rgb(.03,.07,.12),wine=rgb(.55,.1,.16),gray=rgb(.35,.4,.45);
  let page=doc.addPage([595,842]),y=710;
  function clean(t:string){return t.replace(/[^\x20-\x7e\u00a0-\u00ff]/g," ").trim();}
  function header() {
    page.drawRectangle({x:0,y:740,width:595,height:102,color:navy});
    page.drawImage(brand,{x:38,y:762,width:91,height:60});
    page.drawText("QUALITY MOTORS",{x:146,y:791,size:20,font:bold,color:rgb(1,1,1)});
    page.drawText("REPORTE DE SERVICIO",{x:146,y:769,size:10,font:normal,color:rgb(.8,.82,.85)});
    page.drawRectangle({x:0,y:734,width:595,height:6,color:wine});
  }
  header();
  function next(){page=doc.addPage([595,842]);y=710;header();}
  function text(value:string,size=11,strong=false) {
    const font=strong?bold:normal;
    let line="";
    const words=clean(value).split(/\s+/).flatMap(word=>font.widthOfTextAtSize(word,size)>515?word.match(/.{1,50}/g)||[]:[word]);
    for(const word of words) {
      if(line && font.widthOfTextAtSize(line+" "+word,size)>515) {
        if(y<65)next();page.drawText(line,{x:40,y,size,font,color:gray});y-=size+6;line="";
      }
      line+=(line?" ":"")+word;
    }
    if(y<65)next();
    page.drawText(line,{x:40,y,size,font,color:strong?navy:gray});y-=size+10;
  }
  const money=(n:number)=>n.toLocaleString("es-MX",{style:"currency",currency:"MXN"});
  text(data.id,19,true);text(data.customer,13,true);text(data.vehicle);text("Ingreso: "+data.entry);
  text("Motivo de ingreso: "+data.notes);
  const p=progress(data.tasks);
  text(`Avance: ${p.percent}% - ${p.completed} de ${p.total} tareas completadas`,13,true);
  const total=data.tasks.reduce((s,t)=>s+t.price,0);
  text("Cotización: "+money(total),16,true);
  text("Pagado: "+money(data.paid)+" | Saldo: "+money(Math.max(0,total-data.paid)));
  text("Evidencia fotográfica disponible durante 6 meses desde su carga.");
  text("Este reporte refleja el estado al momento de descargarlo. No es una factura.");
  if(!data.tasks.length)text("Pendiente de evaluación. No hay tareas cotizadas.");
  for(let index=0;index<data.tasks.length;index++) {
    const task=data.tasks[index];next();
    text(`Tarea ${index+1}: ${task.concept}`,17,true);
    text((statuses[task.status]||task.status)+" | "+money(task.price),12,true);
    text(task.description||"Sin observaciones adicionales.");
    for(const photo of task.photos) {
      if(y<330)next();
      text(photo.kind==="BEFORE"?"ANTES":"DESPUÉS",12,true);
      if(!photo.bytes){text("Imagen no disponible.");continue;}
      try {
        const image=photo.bytes[0]===137?await doc.embedPng(photo.bytes):await doc.embedJpg(photo.bytes);
        const scale=Math.min(515/image.width,230/image.height);
        page.drawImage(image,{x:40,y:y-image.height*scale,width:image.width*scale,height:image.height*scale});
        y-=image.height*scale+25;
      } catch { text("Imagen no disponible."); }
    }
    if(!task.photos.length)text("Sin fotografías disponibles.");
  }
  doc.getPages().forEach((p,i)=>{p.drawText(`QUALITY MOTORS | ${data.id} | ${i+1}/${doc.getPageCount()}`,{x:40,y:28,size:8,font:normal,color:gray});});
  return doc.save();
}
