"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
export default function ServiceSettings({id,notes,vehicle}:{id:string;notes:string|null;vehicle:{make:string;model:string;year:number;licensePlate:string}}){
  const [busy,setBusy]=useState(false),[error,setError]=useState("");const router=useRouter();
  async function submit(method:string,body:object){
    setBusy(true);setError("");
    try{const r=await fetch("/api/admin/service-records/"+encodeURIComponent(id),{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw new Error(data.error);if(method==="DELETE")router.push("/admin");router.refresh();}
    catch(e){setError(e instanceof Error?e.message:"Error de conexión");}finally{setBusy(false);}
  }
  return <details className="card mb-6"><summary className="cursor-pointer font-bold">Modificar o eliminar servicio</summary>
    <form className="mt-4 space-y-3" onSubmit={e=>{e.preventDefault();void submit("PATCH",Object.fromEntries(new FormData(e.currentTarget)));}}>
      {Object.entries(vehicle).map(([key,value])=><label className="block" key={key}>{({make:"Marca",model:"Modelo",year:"Año",licensePlate:"Placas"} as Record<string,string>)[key]}<input className="w-full bg-slate-900 p-3" name={key} defaultValue={value} required type={key==="year"?"number":"text"}/></label>)}
      <label className="block">Motivo de ingreso<textarea className="w-full bg-slate-900 p-3" name="notes" defaultValue={notes||""}/></label>
      <button className="btn" disabled={busy}>Guardar servicio</button>
    </form><p className="mt-4 text-rose-300" role="alert">{error}</p>
    <button className="mt-4 text-rose-300" disabled={busy} onClick={()=>{if(window.confirm("¿Eliminar este servicio del panel y del portal del cliente?"))void submit("DELETE",{confirm:id});}}>Eliminar servicio</button>
  </details>;
}
