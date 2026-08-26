import { Controller, Get } from '@nestjs/common';

import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../database/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Probed by the container orchestrator. It touches the database on purpose:
   * a process that is running but cannot reach Postgres is not healthy, and
   * reporting it as such only delays the restart.
   */
  @Public()
  @Get()
  async check(): Promise<{ status: 'ok'; database: 'up' | 'down'; timestamp: string }> {
    let database: 'up' | 'down' = 'down';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'up';
    } catch {
      database = 'down';
    }

    return { status: 'ok', database, timestamp: new Date().toISOString() };
  }
}
