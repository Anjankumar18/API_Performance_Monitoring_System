import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    for (let i = 1; i <= 5; i++) {
      try {
        await this.$connect();
        this.logger.log('Prisma connected to database');
        return;
      } catch (err) {
        this.logger.error(`DB connection attempt ${i} failed`);
        await new Promise(res => setTimeout(res, 3000));
      }
    }
    throw new Error('Database connection failed after retries');
  }
}
