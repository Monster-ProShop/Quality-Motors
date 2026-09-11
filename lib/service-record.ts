import { prisma } from "./prisma";
import { expiryDate } from "./cloudinary";

export const publicRecordInclude = {
  vehicle: true,
  customer: true,
  tasks: { include: { images: true }, orderBy: { updatedAt: "desc" as const } },
  payments: { orderBy: { createdAt: "desc" as const } },
};

export async function getPublicRecord(publicId: string) {
  const record = await prisma.serviceRecord.findUnique({ where: { publicId }, include: publicRecordInclude });
  if (record) record.tasks.forEach(task => { task.images = task.images.filter(image => (image.expiresAt || expiryDate(image.createdAt)) > new Date()); });
  return record;
}
