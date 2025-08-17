import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import { Document, Types } from "mongoose";

import { Brand } from "src/api/brands/entities/brand.entity";
import { Category } from "src/api/categories/entities/category.entity";

@Schema({
  timestamps: true,
  collection: "product_variants",
  versionKey: false,
  toJSON: {
    transform(doc, ret: Record<string, unknown>) {
      delete ret.__v;
      return ret;
    },
  },
})
export class ProductVariant {
  @Prop({ type: String })
  color?: string;
  @Prop({ required: true, type: Number })
  price: number;
  @Prop({ required: true, type: Number })
  quantity: number;
  @Prop({ type: String })
  image?: string;
  @Prop({ type: String })
  size?: string;

  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

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
  @Prop({ unique: true, required: true, type: String })
  name: string;

  @Prop({ unique: true, required: true, type: String })
  slug: string;

  @Prop({ required: true, type: String })
  description: string;

  @Prop({ required: true, type: [ProductVariant], default: [] })
  variants: ProductVariant[];

  @Prop({ type: String })
  image?: string;

  @Prop({ required: true, type: [Types.ObjectId], ref: Category.name })
  category: Types.ObjectId[];

  @Prop({ required: true, type: Types.ObjectId, ref: Brand.name })
  brand: Types.ObjectId;

  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);
export const ProductSchema = SchemaFactory.createForClass(Product);
