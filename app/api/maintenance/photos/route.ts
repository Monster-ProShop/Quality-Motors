import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { cloudinary } from "@/lib/cloudinary";
export async function POST(request:Request) {
  const secret = process.env.CLEANUP_SECRET;
  const supplied = Buffer.from(request.headers.get("authorization") || "");
  const expected = Buffer.from("Bearer "+secret);
  if(!secret || supplied.length!==expected.length || !timingSafeEqual(supplied,expected)) return NextResponse.json({error:"Forbidden"},{status:403});
  const expired = await prisma.serviceImage.findMany({where:{expiresAt:{lte:new Date()},storageId:{not:null}},take:100});
  let deleted=0,failed=0;
  for(const image of expired) {
    try {
      const result=await cloudinary("destroy",{public_id:image.storageId!,invalidate:"true"});
      if(!["ok","not found"].includes(result.result)) throw new Error("Delete failed");
      await prisma.serviceImage.delete({where:{id:image.id}}); deleted++;
    } catch { failed++; }
  }
  return NextResponse.json({deleted,failed,more:expired.length===100},{status:failed?503:200});
}
