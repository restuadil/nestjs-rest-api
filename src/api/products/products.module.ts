import { Module } from "@nestjs/common";

import { JobModule } from "src/common/job/job.module";
import { DatabaseModule } from "src/config/database.module";

import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { ProductProcessor } from "./products.worker";
import { BrandsModule } from "../brands/brands.module";
import { CategoriesModule } from "../categories/categories.module";
import { ProductVariantModule } from "../product-variant/product-variants.module";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    DatabaseModule,
    JobModule,
    UsersModule,
    ProductVariantModule,
    BrandsModule,
    CategoriesModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductProcessor],
  exports: [ProductsService],
})
export class ProductsModule {}
