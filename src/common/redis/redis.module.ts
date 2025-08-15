import { Module } from "@nestjs/common";

import Redis from "ioredis";

import { ConfigService } from "src/config/config.service";

import { RedisService } from "./redis.service";

@Module({
  providers: [
    {
      provide: "REDIS_CLIENT",
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new Redis({
          host: configService.get<string>("REDIS_HOST"),
          port: configService.get<number>("REDIS_PORT"),
          password: configService.get<string>("REDIS_PASSWORD"),
        });
      },
    },
    RedisService,
  ],
  exports: ["REDIS_CLIENT", RedisService],
})
export class RedisModule {}
