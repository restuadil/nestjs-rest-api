import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import { Document } from "mongoose";

@Schema({
  timestamps: true,
  versionKey: false,
  toJSON: {
    transform(doc, ret: Record<string, unknown>) {
      delete ret.__v;
      return ret;
    },
  },
})
export class Brand extends Document {
  @Prop({ unique: true, required: true, type: String })
  name: string;

  @Prop({ unique: true, required: true, type: String })
  slug: string;

  @Prop({ type: String })
  image?: string;

  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}
export const BrandSchema = SchemaFactory.createForClass(Brand);
