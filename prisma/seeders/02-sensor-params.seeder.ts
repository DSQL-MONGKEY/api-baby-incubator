/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
import type { Seeder } from './types';

export const sensorParamsSeeder: Seeder = {
   name: 'sensor-params',
   async run(prisma, ctx) {
      const incId = ctx.get<string>('inc.id')
         ?? (await prisma.incubator.findUniqueOrThrow({ where: { code: 'INC-A-001' } })).id;

      await prisma.sensor_parameters.upsert({
         where: { incubator_id: incId },
         update: {
         temp_on_c: 36.7, temp_off_c: 36.3,
         rh_on_percent: 60.0, rh_off_percent: 50.0,
         ema_alpha: 0.2, anti_chatter: true, updated_at: new Date(),
         },
         create: {
         incubator_id: incId,
         temp_on_c: 36.7, temp_off_c: 36.3,
         rh_on_percent: 60.0, rh_off_percent: 50.0,
         ema_alpha: 0.2, anti_chatter: true,
         },
      });
   },
};
