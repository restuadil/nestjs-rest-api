import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import { Document } from "mongoose";

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
export class ProductVariant extends Document {
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

export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);
