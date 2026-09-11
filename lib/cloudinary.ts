import { createHash } from "node:crypto";
export function expiryDate(now = new Date()) {
  const result = new Date(now);
  const day = result.getUTCDate();
  result.setUTCDate(1); result.setUTCMonth(result.getUTCMonth()+6);
  const last = new Date(Date.UTC(result.getUTCFullYear(),result.getUTCMonth()+1,0)).getUTCDate();
  result.setUTCDate(Math.min(day,last)); return result;
}
export async function cloudinary(action:string, params:Record<string,string>, file?:Blob) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) throw new Error("Cloudinary no configurado");
  params.timestamp = String(Math.floor(Date.now()/1000));
  const signature = createHash("sha1").update(Object.keys(params).sort().map(k=>k+"="+params[k]).join("&")+secret).digest("hex");
  const form = new FormData();
  for(const [k,v] of Object.entries(params)) form.set(k,v);
  form.set("api_key",key); form.set("signature",signature);
  if(file) form.set("file",file);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/${action}`,{method:"POST",body:form,signal:AbortSignal.timeout(30000)});
  if(!response.ok) throw new Error("Error de almacenamiento");
  return response.json();
}
