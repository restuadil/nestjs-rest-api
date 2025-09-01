import { Module } from "@nestjs/common";

import { DatabaseModule } from "src/config/database.module";

import { ProductVariantController } from "./product-variants.controller";
import { ProductVariantService } from "./product-variants.service";

@Module({
  imports: [DatabaseModule],
  controllers: [ProductVariantController],
  providers: [ProductVariantService],
  exports: [ProductVariantService],
})
export class ProductVariantModule {}
