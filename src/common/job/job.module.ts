import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { Brand } from "src/api/brands/entities/brand.entity";
import { Category } from "src/api/categories/entities/category.entity";
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
        defaultJobOptions: {
          attempts: 3,
          delay: 10000,
          removeOnComplete: true,
          removeOnFail: false,
          backoff: {
            type: "exponential",
            delay: 10000,
          },
        },
      }),
    }),
    BullModule.registerQueue(
      {
        name: Product.name,
      },
      {
        name: Category.name,
      },
      {
        name: Brand.name,
      },
    ),
  ],
  exports: [BullModule],
})
export class JobModule {}
