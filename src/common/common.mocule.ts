import { Global, Module } from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";

import { ConfigService } from "src/config/config.service";

import { GlobalFilter } from "./filters/global.filter";
import { LoggerInterceptor } from "./interceptors/logger.interceptor";
import { MailModule } from "./mail/mail.module";
import { MailService } from "./mail/mail.service";
import { RedisModule } from "./redis/redis.module";
import { RedisService } from "./redis/redis.service";

@Global()
@Module({
  imports: [RedisModule, MailModule],
  providers: [
    ConfigService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalFilter,
    },
    RedisService,
    MailService,
  ],
  exports: [ConfigService, RedisService, MailService],
})
export class CommonModule {}
