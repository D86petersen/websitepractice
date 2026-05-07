import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './common/services/prisma.service';

/**
 * Health Check Controller
 * Provides endpoints for Docker health checks and orchestrator probes
 */
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  /**
   * Liveness probe - is the service running?
   */
  @Get()
  async liveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  /**
   * Readiness probe - is the service ready to accept traffic?
   * Tests database connectivity
   */
  @Get('ready')
  async readiness() {
    try {
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`;
      
      return {
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'not_ready',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Deep health check with all dependencies
   */
  @Get('deep')
  async deepHealth() {
    const checks = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks: {
        database: 'checking',
      },
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.checks.database = 'ok';
    } catch {
      checks.checks.database = 'failed';
    }

    return checks;
  }
}
