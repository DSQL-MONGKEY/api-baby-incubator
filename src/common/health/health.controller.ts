import { Controller, Get } from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import pkg from '../../../package.json';

@Controller('health')
export class HealthController {
   constructor(private readonly prisma: PrismaService) {}

   @Get()
   async ping() {
      try {
         await this.prisma.$queryRaw`SELECT 1`;
         return { ok: true, version: (pkg as any).version, time: new Date().toISOString() };
      } catch {
         return { ok: false, version: (pkg as any).version, time: new Date().toISOString() };
      }
   }
}