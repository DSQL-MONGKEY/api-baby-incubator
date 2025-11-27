/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import type { Seeder } from './types';
import { Prisma } from '../../generated/prisma/client';

export const stateSeeder: Seeder = {
   name: 'state',
   async run(prisma, ctx) {
      const incId = ctx.get<string>('inc.id')
         ?? (await prisma.incubator.findUniqueOrThrow({ where: { code: 'INC-A-001' } })).id;

      const sessionId = ctx.get<string>('session.id') ?? null;

      await prisma.state.upsert({
         where: { incubator_id: incId },
         update: {
            mode: 'AUTO',
            current_temp_c: new Prisma.Decimal('36.5'),
            current_rh_percent: new Prisma.Decimal('55.0'),
            fan: [0,0,0,0,0,0],
            lamp: [1,1],
            rev: BigInt(1),
            fwVersion: 'byin-esp32@0.1.0',
            gpsFix: false, gpsSat: 0, gpsLat: -6.2, gpsLon: 106.816666,
            active_session_id: sessionId ?? undefined,
            updated_at: new Date(),
         },
         create: {
            incubator_id: incId,
            mode: 'AUTO',
            current_temp_c: new Prisma.Decimal('36.5'),
            current_rh_percent: new Prisma.Decimal('55.0'),
            fan: [0,0,0,0,0,0],
            lamp: [1,1],
            rev: BigInt(1),
            fwVersion: 'byin-esp32@0.1.0',
            gpsFix: false, gpsSat: 0, gpsLat: -6.2, gpsLon: 106.816666,
            active_session_id: sessionId ?? undefined,
         },
      });
   },
};
