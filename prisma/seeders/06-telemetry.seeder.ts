/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import type { Seeder } from './types';

export const telemetrySeeder: Seeder = {
   name: 'telemetry',
   async run(prisma, ctx) {
      const incId = ctx.get<string>('inc.id')
         ?? (await prisma.incubator.findUniqueOrThrow({ where: { code: 'INC-A-001' } })).id;

      await prisma.telemetry.createMany({
         data: [
         {
            incubator_id: incId,
            ts: new Date(Date.now() - 3000),
            temp_ds: 36.48, temp_dht: 36.40, temp_main: 36.45, room_humid: 55.2,
            mode: 'AUTO', fan: [0,0,0,0,0,0], lamp: [1,1],
            gpsFix: false, gpsSat: 0, gpsLat: -6.2, gpsLon: 106.8167,
            rev: BigInt(1), fwVersion: 'byin-esp32@0.1.0',
         },
         {
            incubator_id: incId,
            ts: new Date(Date.now() - 1000),
            temp_ds: 36.51, temp_dht: 36.43, temp_main: 36.48, room_humid: 55.0,
            mode: 'AUTO', fan: [0,0,0,0,0,0], lamp: [1,1],
            gpsFix: false, gpsSat: 0, gpsLat: -6.2, gpsLon: 106.8167,
            rev: BigInt(2), fwVersion: 'byin-esp32@0.1.0',
         },
         ],
      });
   },
};
