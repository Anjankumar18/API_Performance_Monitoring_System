import { Controller, Get, Query } from "@nestjs/common";
import { MetricsService } from "./metrics.service";

@Controller("metrics")
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get("summary")
  getSummary() {
    return this.metricsService.getSummary();
  }

  @Get("slow")
  getSlowApis(@Query("limit") limit = "5") {
    return this.metricsService.getSlowApis(Number(limit));
  }

  @Get("errors")
  getErrorApis() {
    return this.metricsService.getErrorApis();
  }

  // 🔥 THIS MUST EXIST
  @Get("p95")
  getP95Latency(@Query("from") from?: string) {
    const minutes = from ? parseInt(from.replace("m", "")) : undefined;
    return this.metricsService.getP95Latency(minutes);
  }

  @Get("recent")
  getRecentMetrics(@Query("limit") limit = "20") {
    return this.metricsService.getRecentMetrics(Number(limit));
  }

  @Get("slow/recent")
  getRecentSlowApis(
    @Query("limit") limit = "20",
    @Query("threshold") threshold = "500"
  ) {
    return this.metricsService.getRecentSlowApis(
      Number(limit),
      Number(threshold)
    );
  }
}
