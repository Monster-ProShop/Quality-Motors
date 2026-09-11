import Link from "next/link";
import { notFound } from "next/navigation";
import { currentStaff } from "@/lib/staff";
import { getPublicRecord } from "@/lib/service-record";
import { progress } from "@/lib/progress";
import TaskEditor from "@/components/task-editor";
export default async function Record({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  const [record,user]=await Promise.all([getPublicRecord(id),currentStaff()]);
  if(!record)notFound();
  const p=progress(record.tasks),total=record.tasks.reduce((s,t)=>s+Number(t.price),0);
  return <main className="mx-auto max-w-5xl p-6"><Link href="/admin">← Panel del taller</Link>
    <h1 className="mt-6 text-3xl font-bold">{record.vehicle.make} {record.vehicle.model} · {record.publicId}</h1>
    <p className="muted mt-2">{record.customer.name} · {record.vehicle.licensePlate}</p>
    <p className="mt-3">Motivo de ingreso: {record.notes||"Sin notas"}</p>
    <div className="card my-6"><p>{p.completed} de {p.total} tareas completadas · {p.percent}%</p><progress className="mt-2 w-full accent-rose-700" value={p.percent} max="100"/><p className="mt-2">Cotización: {total.toLocaleString("es-MX",{style:"currency",currency:"MXN"})}</p><Link className="text-rose-300" href={`/portal/${id}`}>Ver como cliente →</Link></div>
    <TaskEditor recordId={id} admin={user?.role==="ADMIN"} tasks={record.tasks.map(t=>({...t,price:t.price.toString(),images:t.images.map(i=>({id:i.id,url:i.url,kind:i.kind}))}))}/>
  </main>;
}
