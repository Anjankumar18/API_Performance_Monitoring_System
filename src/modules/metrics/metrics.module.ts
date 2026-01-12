import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { AlertService } from './alert.service';
import { EmailService } from '../../common/email.service';

@Module({
  controllers: [MetricsController], // ✅ REQUIRED
  providers: [MetricsService,AlertService,EmailService],
  exports: [MetricsService],
})
export class MetricsModule {}
