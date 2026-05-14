import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

// Prevent multiple PrismaClient instances during Next.js hot-reload in development.
// In production (Vercel serverless), each container module cache gives us one instance.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const adapter = new PrismaNeonHttp(process.env.DATABASE_URL, {});
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
}

export const db: PrismaClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
