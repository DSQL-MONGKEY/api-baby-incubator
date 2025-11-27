/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import type { Seeder } from './types';

export const commandsSeeder: Seeder = {
   name: 'commands',
   async run(prisma, ctx) {
      const incId = ctx.get<string>('inc.id')
         ?? (await prisma.incubator.findUniqueOrThrow({ where: { code: 'INC-A-001' } })).id;

      await prisma.command.create({
         data: {
            incubator_id: incId,
            ts: new Date(),
            cmd_type: 'control-mode',
            payload: { mode: 'MANUAL' },
            qos: 1,
            published_by: 'seed',
            correlation_id: 'corr-seed-001',
            ack_ok: true, ack_msg: 'applied', ack_at: new Date(),
         },
      });
   },
};
