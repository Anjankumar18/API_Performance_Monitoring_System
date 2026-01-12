import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '../modules/metrics/metrics.service';

@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;

      // 🔥 Fire-and-forget (non-blocking)
      this.metricsService.saveMetric({
        method: req.method,
        path: req.route?.path || req.originalUrl,
        statusCode: res.statusCode,
        durationMs: duration,
      });
    });

    next();
  }
}
