import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { Brand, BrandSchema } from "src/api/brands/entities/brand.entity";
import { Category, CategorySchema } from "src/api/categories/entities/category.entity";
import {
  Product,
  ProductSchema,
  ProductVariant,
  ProductVariantSchema,
} from "src/api/products/entities/product.entities";
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
      { name: Product.name, schema: ProductSchema },
      { name: ProductVariant.name, schema: ProductVariantSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
