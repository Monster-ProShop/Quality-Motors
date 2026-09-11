"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { statuses } from "@/lib/progress";
type Task = {id:string;concept:string;description:string|null;price:string;status:string;images:{id:string;url:string;kind:string}[]};
export default function TaskEditor({recordId,admin,tasks}:{recordId:string;admin:boolean;tasks:Task[]}) {
  const router=useRouter();
  const [busy,setBusy]=useState(false),[error,setError]=useState("");
  async function send(url:string,method:string,data:object|FormData) {
    setBusy(true);setError("");
    try {
      const response=await fetch(url,{method,headers:data instanceof FormData?undefined:{"Content-Type":"application/json"},body:data instanceof FormData?data:JSON.stringify(data)});
      const result=await response.json();
      if(!response.ok) throw new Error(result.error||"No se pudo guardar");
      router.refresh(); return true;
    } catch(e) {setError(e instanceof Error?e.message:"Error de conexión");return false;}
    finally{setBusy(false);}
  }
  return <div className="space-y-6">
    {error&&<p className="text-rose-300" role="alert">{error}</p>}
    {admin&&<form className="card space-y-4" onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;const data=Object.fromEntries(new FormData(form));if(await send("/api/tasks","POST",{...data,recordId}))form.reset();}}>
      <h2 className="text-xl font-bold">Agregar trabajo después de la evaluación</h2>
      <label className="block">Concepto<input className="w-full bg-slate-900 p-3" name="concept" maxLength={500} required /></label>
      <label className="block">Detalle<textarea className="w-full bg-slate-900 p-3" name="description" maxLength={5000} /></label>
      <label className="block">Precio (MXN)<input className="w-full bg-slate-900 p-3" name="price" type="number" min="0" max="99999999" step="0.01" required /></label>
      <button className="btn" disabled={busy}>Agregar tarea</button>
    </form>}
    {tasks.length===0&&<p className="muted">Evaluación pendiente. Administración agregará las tareas y la cotización.</p>}
    {tasks.map(task=><section className="card" key={task.id}>
      <form className="space-y-3" onSubmit={e=>{e.preventDefault();void send("/api/tasks","PATCH",{...Object.fromEntries(new FormData(e.currentTarget)),id:task.id});}}>
        {admin?<><label className="block">Concepto<input key={task.concept} name="concept" defaultValue={task.concept} required className="w-full bg-slate-900 p-3"/></label><label className="block">Detalle<textarea key={task.description} name="description" defaultValue={task.description||""} className="w-full bg-slate-900 p-3"/></label><label className="block">Precio MXN<input key={task.price} name="price" type="number" min="0" step="0.01" defaultValue={task.price} required className="w-full bg-slate-900 p-3"/></label></>:<><h2 className="text-xl font-bold">{task.concept}</h2><p>{task.description}</p></>}
        <label className="block">Estado<select key={task.status} name="status" defaultValue={task.status} className="w-full bg-slate-900 p-3">{Object.entries(statuses).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
        <button disabled={busy} className="btn">Guardar cambios</button>
      </form>
      <div className="mt-6 grid gap-5 md:grid-cols-2">{["BEFORE","AFTER"].map(kind=><div key={kind}><h3 className="font-bold">{kind==="BEFORE"?"Antes":"Después"}</h3>
        <div className="my-3 grid grid-cols-2 gap-2">{task.images.filter(i=>i.kind===kind).map(i=><a href={i.url} target="_blank" rel="noreferrer" key={i.id}><img src={i.url} alt={kind==="BEFORE"?"Antes del trabajo":"Después del trabajo"} className="h-32 w-full rounded object-cover"/></a>)}</div>
        <form onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;const data=new FormData(form);data.set("taskId",task.id);data.set("kind",kind);if(await send("/api/tasks/photos","POST",data))form.reset();}}>
          <input aria-label={"Foto "+kind} type="file" name="file" accept="image/jpeg,image/png,image/webp" required className="w-full text-sm"/>
          <button className="btn mt-3" disabled={busy}>Subir foto</button>
        </form>
      </div>)}</div>
      <p className="muted mt-4 text-sm">JPG, PNG o WebP · máximo 5 MB · conservación de 6 meses.</p>
    </section>)}
  </div>;
}
