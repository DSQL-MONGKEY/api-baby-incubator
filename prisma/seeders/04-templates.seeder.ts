/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import type { Seeder } from './types';

export const templatesSeeder: Seeder = {
   name: 'templates',
   async run(prisma, ctx) {
      const incId = ctx.get<string>('inc.id')
         ?? (await prisma.incubator.findUniqueOrThrow({ where: { code: 'INC-A-001' } })).id;

      await prisma.templates.upsert({
         where: { incubator_id_name: { incubator_id: incId, name: 'Circulate' } },
         update: { isArchived: false, updated_at: new Date() },
         create: {
         incubator_id: incId,
         name: 'Circulate',
         description: 'All fans ON, lamps ON',
         fan: [1,1,1,1,1,1],
         lamp: [1,1],
         created_by: 'seed',
         },
      });
   },
};
