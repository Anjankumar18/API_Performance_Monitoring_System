import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MetricsService } from './metrics.service';
import { RedisService } from '../../database/redis.service';
import { EmailService } from '../../common/email.service';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  // Thresholds (env first, fallback defaults)
  private readonly ERROR_RATE_THRESHOLD =
    Number(process.env.ERROR_RATE_THRESHOLD) || 5; // %

  private readonly P95_THRESHOLD_MS =
    Number(process.env.P95_THRESHOLD_MS) || 500; // ms

  // Alert cooldown (avoid spam)
  private readonly ALERT_TTL_SECONDS = 300; // 5 minutes

  constructor(
    private readonly metricsService: MetricsService,
    private readonly redis: RedisService,
    private readonly emailService: EmailService,
  ) {}

  /* ============================
     CRON ENTRY POINT
     ============================ */
  @Cron('*/1 * * * *') // every minute
  async checkAlerts() {
    this.logger.log('Checking alerts...');
    await this.checkErrorRate();
    await this.checkP95Latency();
  }

  /* ============================
     ERROR RATE ALERT
     ============================ */
  private async checkErrorRate() {
    const summary = await this.metricsService.getSummary();

    const errorRate = parseFloat(summary.errorRate.replace('%', ''));

    if (errorRate <= this.ERROR_RATE_THRESHOLD) return;

    const cacheKey = 'alert:error-rate';

    // Prevent duplicate alerts
    const alreadyAlerted = await this.redis.get(cacheKey);
    if (alreadyAlerted) return;

    const message = `🚨 High error rate detected: ${errorRate}% (threshold ${this.ERROR_RATE_THRESHOLD}%)`;

    this.logger.error(message);

    await this.emailService.sendAlert(
      '🚨 API Error Rate Alert',
      message,
    );

    // Set cooldown
    await this.redis.set(cacheKey, true, this.ALERT_TTL_SECONDS);
  }

  /* ============================
     P95 LATENCY ALERT
     ============================ */
  private async checkP95Latency() {
    const p95Results = await this.metricsService.getP95Latency(5); // last 5 min

    for (const api of p95Results) {
      if (api.p95LatencyMs <= this.P95_THRESHOLD_MS) continue;

      const cacheKey = `alert:p95:${api.method}:${api.path}`;

      const alreadyAlerted = await this.redis.get(cacheKey);
      if (alreadyAlerted) continue;

      const message =
        `🐢 High latency detected\n` +
        `API: ${api.method} ${api.path}\n` +
        `p95 latency: ${api.p95LatencyMs}ms\n` +
        `threshold: ${this.P95_THRESHOLD_MS}ms`;

      this.logger.warn(message);

      await this.emailService.sendAlert(
        '🐢 API High Latency Alert',
        message,
      );

      // Cooldown per endpoint
      await this.redis.set(cacheKey, true, this.ALERT_TTL_SECONDS);
    }
  }
}
