import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { Brand, BrandSchema } from "src/api/brands/entities/brand.entity";
import { Category, CategorySchema } from "src/api/categories/entities/category.entity";
import {
  ProductVariant,
  ProductVariantSchema,
} from "src/api/product-variant/entities/product-variant.entity";
import { Product, ProductSchema } from "src/api/products/entities/product.entity";
import { User, UserSchema } from "src/api/users/entities/user.entitiy";

import { ConfigService } from "./config.service";

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>("DATABASE_URL"),
        dbName: configService.get<string>("DATABASE_NAME"),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Brand.name, schema: BrandSchema },
      { name: ProductVariant.name, schema: ProductVariantSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
