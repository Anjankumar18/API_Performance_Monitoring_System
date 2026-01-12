import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { PerformanceMiddleware } from './middleware/performance.middleware';
import { DatabaseModule } from './database/database.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { HealthModule } from './modules/health/health.module';
import { SampleApiModule } from './modules/sample-api/sample.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(), // 👈 ADD THIS
    DatabaseModule,
    MetricsModule,
    HealthModule,
    SampleApiModule,
  ],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(PerformanceMiddleware).forRoutes('*');
  }
}
