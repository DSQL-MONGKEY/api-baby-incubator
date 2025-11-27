/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { Seeder } from './types';

export const babySessionSeeder: Seeder = {
   name: 'baby-session',
   async run(prisma, ctx) {
      const incId = ctx.get<string>('inc.id')
         ?? (await prisma.incubator.findUniqueOrThrow({ where: { code: 'INC-A-001' } })).id;

      const baby = await prisma.baby_users.create({
         data: { name: 'Baby Alpha', dob: new Date('2025-11-01'), medical_id: 'MED-001' },
      });

      const sess = await prisma.incubator_session.create({
         data: {
         incubator_id: incId,
         baby_id: baby.id,
         started_at: new Date(),
         notes: 'Initial admission',
         },
      });

      await prisma.incubator.update({
         where: { id: incId },
         data: { last_session_id: sess.id },
      });

      ctx.set('session.id', sess.id);
   },
};
