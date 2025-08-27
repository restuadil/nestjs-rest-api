import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { Product } from "src/api/products/entities/product.entity";
import { ConfigService } from "src/config/config.service";

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>("REDIS_HOST"),
          port: configService.get<number>("REDIS_PORT"),
          password: configService.get<string>("REDIS_PASSWORD"),
        },
      }),
    }),
    BullModule.registerQueue({
      name: Product.name,
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
