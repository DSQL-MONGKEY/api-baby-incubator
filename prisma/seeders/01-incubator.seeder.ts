/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import type { Seeder } from './types';

export const incubatorSeeder: Seeder = {
   name: 'incubator',
   async run(prisma, ctx) {
      const inc = await prisma.incubator.upsert({
         where: { code: 'INC-A-001' },
         update: { status: 'ONLINE', mode: 'AUTO', last_seen_at: new Date() },
         create: {
         code: 'INC-A-001',
         name: 'Incubator A',
         status: 'ONLINE',
         mode: 'AUTO',
         fwVersion: 'byin-esp32@0.1.0',
         location_label: 'NICU Room 1',
         last_seen_at: new Date(),
         },
      });

      // simpan ID untuk dipakai seeder lain
      ctx.set('inc.id', inc.id);
   },
};
