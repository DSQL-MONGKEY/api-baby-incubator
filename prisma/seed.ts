/* eslint-disable prettier/prettier */

import { prisma } from 'src/lib/prisma';
import { seeders } from './seeders';
import type { SeedContext } from './seeders/types';


class MapContext implements SeedContext {
   private store = new Map<string, any>();
   get<T>(k: string) { return this.store.get(k) as T | undefined; }
   set<T>(k: string, v: T) { this.store.set(k, v); }
}

async function main() {
   const ctx = new MapContext();
   const only = (process.env.SEED_ONLY ?? '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

   const list = only.length
      ? seeders.filter(s => only.includes(s.name))
      : seeders;

   console.log(`Running seeders: ${list.map(s => s.name).join(', ') || '(none)'}`);

   for (const s of list) {
      const t0 = Date.now();
      process.stdout.write(`→ ${s.name} ... `);
      await s.run(prisma, ctx);
      console.log(`done (${Date.now() - t0} ms)`);
   }
   console.log('✅ All seeders completed.');
}

main()
   .catch((e) => {
      console.error('❌ Seed error:', e);
      process.exit(1);
   })
   .finally(async () => {
      await prisma.$disconnect();
   });
