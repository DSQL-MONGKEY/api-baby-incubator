/* eslint-disable prettier/prettier */
import type { Seeder } from './types';
import { incubatorSeeder } from './01-incubator.seeder';
import { sensorParamsSeeder } from './02-sensor-params.seeder';
import { babySessionSeeder } from './03-baby-session.seeder';
import { templatesSeeder } from './04-templates.seeder';
import { stateSeeder } from './05-state.seeder';
import { telemetrySeeder } from './06-telemetry.seeder';
import { commandsSeeder } from './07-commands.seeder';

export const seeders: Seeder[] = [
   incubatorSeeder,
   sensorParamsSeeder,
   babySessionSeeder,
   templatesSeeder,
   stateSeeder,
   telemetrySeeder,
   commandsSeeder,
];
