import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { staffSession, verifyPassword } from "@/lib/staff";
import { localTesting, localUsers } from "@/lib/local-test-users";
export default async function Login({searchParams}:{searchParams:Promise<{error?:string}>}) {
  const query = await searchParams;
  async function login(form:FormData) {
    "use server";
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");
    if (password.length > 200) redirect("/login?error=1");
    if(localTesting()) {
      const local=localUsers.find(u=>u.email.toLowerCase()===email && u.password===password);
      if(!local)redirect("/login?error=1");
      await staffSession(local.id);
      redirect("/admin");
    }
    const user = await prisma.adminUser.findUnique({where:{email}});
    if (!user?.active || (user.lockedUntil && user.lockedUntil > new Date())) redirect("/login?error=1");
    if (!verifyPassword(password,user.passwordHash)) {
      const failures=user.lockedUntil && user.lockedUntil <= new Date()?1:user.loginFailures+1;
      await prisma.adminUser.update({where:{id:user.id},data:{loginFailures:failures,lockedUntil:failures>=5?new Date(Date.now()+15*60000):null}});
      redirect("/login?error=1");
    }
    await prisma.adminUser.update({where:{id:user.id},data:{loginFailures:0,lockedUntil:null}});
    await staffSession(user.id);
    redirect("/admin");
  }
  return <main className="mx-auto max-w-lg p-8"><h1 className="text-3xl font-bold">Acceso del equipo</h1><form action={login} className="card mt-6 space-y-4">
    <label className="block">Usuario o correo<input className="w-full bg-slate-900 p-3" name="email" type="text" required /></label>
    <label className="block">Contraseña<input className="w-full bg-slate-900 p-3" name="password" type="password" required /></label>
    {query.error && <p role="alert">Credenciales incorrectas.</p>}<button className="btn">Entrar</button>
  </form></main>;
}
