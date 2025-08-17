import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import { Document } from "mongoose";

@Schema({
  timestamps: true,
  versionKey: false,
  collection: "categories",
  toJSON: {
    transform(doc, ret: Record<string, unknown>) {
      delete ret.__v;
      return ret;
    },
  },
})
export class Category extends Document {
  @Prop({ unique: true, required: true, type: String })
  name: string;

  @Prop({ unique: true, required: true, type: String })
  slug: string;

  // for queryschema
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
