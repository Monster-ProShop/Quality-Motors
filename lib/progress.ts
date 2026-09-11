export function progress(tasks: {status: string}[]) {
  const completed = tasks.filter(t => t.status === "COMPLETED").length;
  return { completed, total: tasks.length, percent: tasks.length ? Math.round(completed / tasks.length * 100) : 0 };
}
export const statuses: Record<string, string> = { PENDING: "Pendiente", IN_PROGRESS: "En proceso", WAITING_PARTS: "Esperando refacciones", COMPLETED: "Completado" };
