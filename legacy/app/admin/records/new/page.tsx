import Link from "next/link";
import NewServiceForm from "@/components/new-service-form";
export default function NewRecord(){return <main className="mx-auto max-w-3xl px-6 py-12"><div className="flex items-center justify-between"><div><p className="muted">PANEL DE TALLER</p><h1 className="mt-2 text-4xl font-bold">Crear servicio</h1></div><Link href="/admin" className="text-sky-300">← Panel</Link></div><NewServiceForm/></main>}
