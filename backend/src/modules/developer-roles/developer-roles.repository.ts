import "server-only";
import { prisma } from "@/db/prisma";

export const developerRolesRepository = {
  listActive() {
    return prisma.developerRole.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      select: { code: true, label: true },
    });
  },

  findActiveByCode(code: string) {
    return prisma.developerRole.findFirst({ where: { code, isActive: true }, select: { code: true } });
  },
};
