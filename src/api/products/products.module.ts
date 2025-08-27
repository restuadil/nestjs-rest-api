import { Module } from "@nestjs/common";

import { QueueModule } from "src/common/queue/queue.module";
import { DatabaseModule } from "src/config/database.module";

import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { ProductProcessor } from "./products.worker";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [DatabaseModule, QueueModule, UsersModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductProcessor],
})
export class ProductsModule {}
