import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  onModuleInit() {
    try {
      this.client = new Redis({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: Number(process.env.REDIS_PORT) || 6379,
        lazyConnect: true,
      });

      this.client.on('error', err => {
        this.logger.error('Redis connection error', err);
      });

      this.client.connect()
        .then(() => this.logger.log('Redis connected'))
        .catch(err => this.logger.error('Redis connect failed', err));

    } catch (err) {
      this.logger.error('Redis init failed', err);
      this.client = null;
    }
  }

  onModuleDestroy() {
    this.client?.disconnect();
  }

  async get(key: string) {
    if (!this.client) return null;
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds = 60) {
    if (!this.client) return;
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {}
  }
}
