import { redirect } from "next/navigation";
import { currentStaff } from "@/lib/staff";
import { cookies } from "next/headers";
import Link from "next/link";
export default async function StaffLayout({children}:{children:React.ReactNode}) {
  const user=await currentStaff();
  if (!user) redirect("/login");
  async function logout() { "use server"; (await cookies()).delete("qm_staff");redirect("/login"); }
  return <><div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 px-6 pt-4 text-sm"><span>{user.email} · {user.role==="ADMIN"?"Administración":"Equipo técnico"}</span>{user.role==="ADMIN"&&<Link href="/admin/team">Administrar equipo</Link>}<form action={logout}><button>Cerrar sesión</button></form></div>{children}</>;
}
