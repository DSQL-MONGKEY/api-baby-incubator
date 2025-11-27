import type { PrismaClient } from '../../generated/prisma/client';

export interface SeedContext {
  get<T = any>(key: string): T | undefined;
  set<T = any>(key: string, val: T): void;
}

export interface Seeder {
  /** nama unik seeder untuk logging / filter */
  name: string;
  /** jalankan seeder */
  run(prisma: PrismaClient, ctx: SeedContext): Promise<void>;
}
