import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";
const prisma=new PrismaClient();
async function main() {
  const email=process.env.STAFF_EMAIL?.trim().toLowerCase(),password=process.env.STAFF_PASSWORD,role=process.env.STAFF_ROLE;
  if(!email || !password || password.length<12 || !["ADMIN","WORKER"].includes(role||""))throw new Error("Set STAFF_EMAIL, STAFF_PASSWORD (12+ chars), STAFF_ROLE (ADMIN or WORKER)");
  const salt=randomBytes(16).toString("hex");
  await prisma.adminUser.create({data:{email,role:role!,passwordHash:salt+":"+scryptSync(password,salt,64).toString("hex")}});
  console.log("Staff account created");
}
main().catch(()=>{console.error("Account creation failed; verify configuration or existing email.");process.exitCode=1;}).finally(()=>prisma.$disconnect());
