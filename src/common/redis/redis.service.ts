import { Inject, Injectable } from "@nestjs/common";

import Redis from "ioredis";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

@Injectable()
export class RedisService {
  constructor(
    @Inject("REDIS_CLIENT") private readonly redis: Redis,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async set(key: string, value: any, ttl?: number): Promise<void> {
    this.logger.debug(`set ${key} to redis`);
    const data = JSON.stringify(value);
    if (ttl) {
      await this.redis.set(key, data, "EX", ttl);
    } else {
      await this.redis.set(key, data);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    if (!data) {
      return null;
    }
    this.logger.debug(`get ${key} from redis`);
    return JSON.parse(data) as T;
  }

  async delete(key: string): Promise<number> {
    this.logger.debug(`delete ${key} from redis`);
    return await this.redis.del(key);
  }

  async deleteByPattern(pattern: string): Promise<number> {
    this.logger.debug(`delete ${pattern} from redis`);
    const keys = await this.redis.keys(pattern);
    if (keys.length) {
      return await this.redis.del(keys);
    }
    return 0;
  }

  async flush(): Promise<"OK"> {
    return await this.redis.flushall();
  }
}
