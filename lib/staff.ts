import { createHmac, timingSafeEqual, scryptSync, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { localTesting, localUsers } from "./local-test-users";

export function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(password, salt, 64).toString("hex");
}
export function verifyPassword(password: string, hash: string) {
  const [salt, digest] = hash.split(":");
  if (!salt || !digest) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(digest, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
function sign(value: string) {
  const secret = process.env.NEXTAUTH_SECRET || (localTesting() ? "quality-motors-local-development-only-secret" : undefined);
  if (!secret || secret.length < 32) throw new Error("Configure NEXTAUTH_SECRET (32+ characters)");
  return createHmac("sha256", secret).update(value).digest("hex");
}
export async function staffSession(id: string) {
  const payload = Buffer.from(JSON.stringify({ id, expires: Date.now() + 8 * 3600000 })).toString("base64url");
  (await cookies()).set("qm_staff", payload + "." + sign(payload), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 8 * 3600 });
}
export async function currentStaff() {
  const value = (await cookies()).get("qm_staff")?.value;
  if (!value) return null;
  try {
    const [payload, signature] = value.split(".");
    const expected = Buffer.from(sign(payload));
    const supplied = Buffer.from(signature || "");
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (data.expires < Date.now()) return null;
    if(localTesting()) {
      const local=localUsers.find(u=>u.id===data.id);
      if(local)return {id:local.id,email:local.email,role:local.role};
    }
    return await prisma.adminUser.findFirst({ where: { id: data.id, active: true }, select: { id: true, email: true, role: true } });
  } catch { return null; }
}
export async function requireStaff(request: Request, adminOnly = false) {
  const origin = request.headers.get("origin");
  if (origin !== new URL(request.url).origin && origin !== process.env.NEXT_PUBLIC_APP_URL) throw new Error("FORBIDDEN");
  const user = await currentStaff();
  if (!user || (adminOnly && user.role !== "ADMIN")) throw new Error("FORBIDDEN");
  return user;
}
