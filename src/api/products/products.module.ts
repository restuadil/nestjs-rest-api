import { forwardRef, Module } from "@nestjs/common";

import { QueueModule } from "src/common/queue/queue.module";
import { DatabaseModule } from "src/config/database.module";

import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { ProductProcessor } from "./products.worker";
import { ProductVariantModule } from "../product-variant/product-variants.module";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [DatabaseModule, QueueModule, UsersModule, forwardRef(() => ProductVariantModule)],
  controllers: [ProductsController],
  providers: [ProductsService, ProductProcessor],
  exports: [ProductsService],
})
export class ProductsModule {}
