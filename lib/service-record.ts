import { prisma } from "./prisma";

export const publicRecordInclude = {
  vehicle: true,
  customer: true,
  tasks: {
    include: {
      images: true,
    },
    orderBy: {
      updatedAt: "desc" as const,
    },
  },
  payments: {
    orderBy: {
      createdAt: "desc" as const,
    },
  },
};

export async function getPublicRecord(publicId: string) {
  return prisma.serviceRecord.findUnique({
    where: {
      publicId,
    },
    include: publicRecordInclude,
  });
}
