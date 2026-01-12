import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';

const SLOW_THRESHOLD_MS = 500;

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /* ============================
     WRITE PATH (NO CACHE)
     ============================ */
  async saveMetric(data: {
    method: string;
    path: string;
    statusCode: number;
    durationMs: number;
  }) {
    try {
      await this.prisma.apiMetric.create({
        data: {
          method: data.method,
          path: data.path,
          statusCode: data.statusCode,
          durationMs: data.durationMs,
          isError: data.statusCode >= 400,
        },
      });
    } catch (error) {
      this.logger.error('Failed to save metric', error);
    }
  }

  /* ============================
     SUMMARY (CACHED)
     ============================ */
  async getSummary() {
    const cacheKey = 'metrics:summary';
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    const totalRequests = await this.prisma.apiMetric.count();
    const errorRequests = await this.prisma.apiMetric.count({
      where: { isError: true },
    });
    const avgLatency = await this.prisma.apiMetric.aggregate({
      _avg: { durationMs: true },
    });

    const result = {
      totalRequests,
      errorRequests,
      avgLatencyMs: Math.round(avgLatency._avg.durationMs || 0),
      errorRate:
        totalRequests === 0
          ? '0%'
          : ((errorRequests / totalRequests) * 100).toFixed(2) + '%',
    };

    await this.redis.set(cacheKey, result, 30);
    return result;
  }

  /* ============================
     SLOW APIS (CACHED)
     ============================ */
  async getSlowApis(limit: number) {
    const cacheKey = `metrics:slow:${limit}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    const result = await this.prisma.apiMetric.groupBy({
      by: ['path', 'method'],
      _avg: { durationMs: true },
      _count: { _all: true },
      orderBy: {
        _avg: { durationMs: 'desc' },
      },
      take: limit,
    });

    const mapped = result.map(r => ({
      path: r.path,
      method: r.method,
      avgDurationMs: Math.round(r._avg.durationMs ?? 0),
      requestCount: r._count._all,
    }));

    await this.redis.set(cacheKey, mapped, 30);
    return mapped;
  }

  /* ============================
     ERROR APIS (CACHED)
     ============================ */
  async getErrorApis() {
    const cacheKey = 'metrics:errors';
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    const result = await this.prisma.$queryRaw<
      Array<{ path: string; method: string; count: number }>
    >`
      SELECT 
        "path",
        "method",
        COUNT(*)::int AS "count"
      FROM "ApiMetric"
      WHERE "isError" = true
      GROUP BY "path", "method"
      ORDER BY "count" DESC
    `;

    await this.redis.set(cacheKey, result, 60);
    return result;
  }

  /* ============================
     P95 LATENCY (CACHED)
     ============================ */
  async getP95Latency(fromMinutes?: number) {
    const cacheKey = `metrics:p95:${fromMinutes ?? 'all'}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    const result = fromMinutes
      ? await this.prisma.$queryRaw<
          Array<{ path: string; method: string; p95LatencyMs: number }>
        >`
          SELECT
            "path",
            "method",
            PERCENTILE_CONT(0.95)
              WITHIN GROUP (ORDER BY "durationMs") AS "p95LatencyMs"
          FROM "ApiMetric"
          WHERE "createdAt" >= NOW() - INTERVAL '${fromMinutes} minutes'
          GROUP BY "path", "method"
          ORDER BY "p95LatencyMs" DESC
        `
      : await this.prisma.$queryRaw<
          Array<{ path: string; method: string; p95LatencyMs: number }>
        >`
          SELECT
            "path",
            "method",
            PERCENTILE_CONT(0.95)
              WITHIN GROUP (ORDER BY "durationMs") AS "p95LatencyMs"
          FROM "ApiMetric"
          GROUP BY "path", "method"
          ORDER BY "p95LatencyMs" DESC
        `;

    await this.redis.set(cacheKey, result, 30);
    return result;
  }

  /* ============================
     RECENT (NO CACHE)
     ============================ */
  async getRecentMetrics(limit = 20) {
    return this.prisma.$queryRaw<
      Array<{
        path: string;
        method: string;
        statusCode: number;
        durationMs: number;
        createdAt: Date;
      }>
    >`
      SELECT
        "path",
        "method",
        "statusCode",
        "durationMs",
        "createdAt"
      FROM "ApiMetric"
      WHERE "isError" = true
         OR "durationMs" > ${SLOW_THRESHOLD_MS}
      ORDER BY "createdAt" DESC
      LIMIT ${limit}
    `;
  }

  async getRecentSlowApis(limit = 20, thresholdMs = SLOW_THRESHOLD_MS) {
    return this.prisma.$queryRaw<
      Array<{
        path: string;
        method: string;
        durationMs: number;
        createdAt: Date;
      }>
    >`
      SELECT
        "path",
        "method",
        "durationMs",
        "createdAt"
      FROM "ApiMetric"
      WHERE "durationMs" > ${thresholdMs}
      ORDER BY "createdAt" DESC
      LIMIT ${limit}
    `;
  }
}
