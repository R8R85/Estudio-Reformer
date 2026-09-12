import { PrismaClient } from '@prisma/client';

// Single shared Prisma client for the process (the usual Node/Prisma pattern —
// avoids exhausting SQLite connections under tsx's watch-mode reloads).
export const prisma = new PrismaClient();
