import { currentStaff } from "@/lib/staff";
import { progress } from "@/lib/progress";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { shopDate } from "@/lib/shop-date";

export const dynamic = "force-dynamic";
const money = (value: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);

export default async function Admin() {
  const user = await currentStaff();
  const records = await prisma.serviceRecord.findMany({
    where: { deletedAt: null },
    orderBy: [{ entryDate: "desc" }, { id: "desc" }],
    include: { customer: true, vehicle: true, tasks: true, payments: true },
  });
  const rows = records.map(record => {
    const total = record.tasks.reduce((sum, task) => sum + Number(task.price), 0);
    const paid = record.payments.filter(p => p.status === "PAID").reduce((sum, p) => sum + Number(p.amount), 0);
    const complete = record.tasks.length > 0 && record.tasks.every(t => t.status === "COMPLETED");
    const status = record.exitDate ? "Entregado" : complete ? "Listo para entrega" :
      record.tasks.some(t => t.status === "WAITING_PARTS") ? "Esperando refacciones" :
      record.tasks.some(t => t.status === "IN_PROGRESS") ? "En proceso" : "Pendiente";
    return { record, total, balance: Math.max(0, total - paid), complete, status };
  });
  const stats = [
    ["Servicios abiertos", rows.filter(r => !r.record.exitDate).length],
    ["Pendientes de pago", rows.filter(r => r.balance > 0).length],
    ["Entregados hoy", rows.filter(r => r.record.exitDate && shopDate(r.record.exitDate) === shopDate()).length],
  ];
  return <main className="mx-auto max-w-6xl px-6 py-12">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><p className="muted">PANEL DE TALLER</p><h1 className="text-4xl font-bold">Operación y servicios</h1></div>
      {user?.role === "ADMIN" && <Link href="/admin/records/new" className="btn">Nuevo servicio</Link>}
    </div>
    <div className="mt-10 grid gap-4 md:grid-cols-3">
      {stats.map(([label, count]) => <div className="card" key={label}><p className="muted">{label}</p><p className="mt-2 text-3xl font-bold">{count}</p></div>)}
    </div>
    <section className="card mt-8">
      <h2 className="text-xl font-bold">Servicios registrados ({rows.length})</h2>
      {!rows.length ? <p className="muted mt-4">Todavía no hay servicios. Crea el primero con “Nuevo servicio”.</p> :
        <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm">
          <thead className="muted"><tr>{["Servicio / ingreso", "Cliente", "Vehículo", "Estado", "Cotización", "Saldo", ""].map((label, i) => <th className="p-3" key={i}>{label}</th>)}</tr></thead>
          <tbody>{rows.map(({ record, total, balance, status }) => <tr key={record.id} className="border-t border-slate-700">
            <td className="p-3"><Link className="text-rose-300" href={`/admin/records/${encodeURIComponent(record.publicId)}`}>{record.publicId}</Link><p className="muted mt-1">{record.entryDate.toLocaleDateString("es-MX", { timeZone: "America/Mexico_City" })}</p></td>
            <td className="p-3">{record.customer.name}</td>
            <td className="p-3">{record.vehicle.make} {record.vehicle.model} {record.vehicle.year}<p className="muted">{record.vehicle.licensePlate}</p></td>
            <td className="p-3">{status}<p className="muted">{progress(record.tasks).percent}% completado</p></td><td className="p-3 whitespace-nowrap">{money(total)}</td><td className="p-3 whitespace-nowrap">{money(balance)}</td>
            <td className="p-3"><Link className="text-rose-300 whitespace-nowrap" href={`/admin/records/${encodeURIComponent(record.publicId)}`}>Ver servicio →</Link></td>
          </tr>)}</tbody>
        </table></div>}
    </section>
  </main>;
}
