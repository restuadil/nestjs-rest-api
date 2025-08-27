import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import { Document, Types } from "mongoose";

import { Brand } from "src/api/brands/entities/brand.entity";
import { Category } from "src/api/categories/entities/category.entity";

import { ProductVariant } from "./product-variant.entity";

@Schema({
  timestamps: true,
  collection: "products",
  versionKey: false,
  toJSON: {
    transform(doc, ret: Record<string, unknown>) {
      delete ret.__v;
      return ret;
    },
  },
})
export class Product extends Document {
  [x: string]: any;
  @Prop({ unique: true, required: true, type: String })
  name: string;

  @Prop({ unique: true, required: true, type: String })
  slug: string;

  @Prop({ required: true, type: String })
  description: string;

  @Prop({ required: true, type: [Types.ObjectId], ref: ProductVariant.name })
  variantIds: Types.ObjectId[];

  @Prop({ type: String, required: true })
  image: string;

  @Prop({ required: true, type: [Types.ObjectId], ref: Category.name })
  categoryIds: Types.ObjectId[];

  @Prop({ required: true, type: Types.ObjectId, ref: Brand.name })
  brandId: Types.ObjectId;

  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
