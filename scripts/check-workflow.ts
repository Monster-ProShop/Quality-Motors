import assert from "node:assert/strict";
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {progress} from "../lib/progress";
import {expiryDate} from "../lib/cloudinary";
import {createReport} from "../lib/report";
async function main() {
  assert.equal(progress([{status:"COMPLETED"},{status:"IN_PROGRESS"},{status:"PENDING"},{status:"PENDING"}]).percent,25);
  assert.equal(progress([]).percent,0);
  assert.equal(progress([{status:"IN_PROGRESS"}]).percent,0);
  assert.equal(expiryDate(new Date("2026-08-31T12:00:00Z")).toISOString(),"2027-02-28T12:00:00.000Z");
  const logo=await readFile("public/quality-motors-logo.png");
  const pdf=await createReport({id:"QM-20260911-0001",customer:"Cliente de demostración",vehicle:"Nissan 350Z 2008 | DEMO123",entry:"11/09/2026",notes:"Evaluación de interiores y revisión de componentes.",paid:1000,tasks:[
    {concept:"Restauración de interiores",description:"Desmontaje, limpieza y restauración de superficies. Fotografías de prueba para revisar el formato del reporte.",price:2400,status:"COMPLETED",photos:[{kind:"BEFORE",bytes:logo},{kind:"AFTER",bytes:logo}]},
    {concept:"Revisión de componentes",description:"Evaluación en proceso. Las tareas en curso no incrementan el porcentaje de avance.",price:800,status:"IN_PROGRESS",photos:[]},
    {concept:"Acabados",description:"Pendiente.",price:500,status:"PENDING",photos:[]},
    {concept:"Control de calidad",description:"Pendiente.",price:300,status:"PENDING",photos:[]},
  ]},logo);
  await mkdir("work/qa",{recursive:true});await writeFile("work/qa/report.pdf",pdf);
  console.log("Progress and six-month expiry tests passed; PDF generated.");
}
main().catch(e=>{console.error(e);process.exitCode=1;});
