import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentStaff, passwordHash } from "@/lib/staff";
import { prisma } from "@/lib/prisma";
export default async function Team({searchParams}:{searchParams:Promise<{error?:string}>}) {
  if((await currentStaff())?.role!=="ADMIN")redirect("/admin");
  const query=await searchParams;
  const users=await prisma.adminUser.findMany({select:{id:true,email:true,role:true,active:true},orderBy:{createdAt:"asc"}});
  async function create(form:FormData) {
    "use server";
    if((await currentStaff())?.role!=="ADMIN")throw new Error("Forbidden");
    const email=String(form.get("email")||"").trim().toLowerCase(),password=String(form.get("password")||"");
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<12||password.length>200)redirect("/admin/team?error=1");
    try{await prisma.adminUser.create({data:{email,passwordHash:passwordHash(password),role:"WORKER"}});}
    catch{redirect("/admin/team?error=1");}
    revalidatePath("/admin/team");
  }
  async function toggle(form:FormData) {
    "use server";
    if((await currentStaff())?.role!=="ADMIN")throw new Error("Forbidden");
    await prisma.adminUser.updateMany({where:{id:String(form.get("id")),role:"WORKER"},data:{active:form.get("active")==="true"}});
    revalidatePath("/admin/team");
  }
  return <main className="mx-auto max-w-3xl p-6"><Link href="/admin">← Panel</Link><h1 className="mt-5 text-3xl font-bold">Equipo del taller</h1>
    <form action={create} className="card my-6 space-y-4"><h2 className="text-xl">Crear perfil de trabajador</h2>
      <label className="block">Correo<input name="email" type="email" required className="w-full bg-slate-900 p-3"/></label>
      <label className="block">Contraseña (mínimo 12 caracteres)<input name="password" type="password" minLength={12} maxLength={200} required autoComplete="new-password" className="w-full bg-slate-900 p-3"/></label>
      {query.error&&<p role="alert">Revisa los datos. El correo puede estar registrado.</p>}<button className="btn">Crear trabajador</button>
    </form>
    {users.map(u=><div className="card mb-3 flex flex-wrap justify-between gap-3" key={u.id}><span>{u.email} · {u.role} · {u.active?"Activo":"Inactivo"}</span>{u.role==="WORKER"&&<form action={toggle}><input type="hidden" name="id" value={u.id}/><input type="hidden" name="active" value={String(!u.active)}/><button>{u.active?"Desactivar":"Activar"}</button></form>}</div>)}
  </main>;
}
