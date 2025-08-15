import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import { Document, Types } from "mongoose";

import { Role } from "src/types/role.type";

@Schema({
  timestamps: true,
  collection: "users",
  versionKey: false,
  toJSON: {
    transform: (doc, ret: Record<string, unknown>) => {
      delete ret.password;
      return ret;
    },
  },
})
export class User extends Document {
  @Prop({ unique: true, required: true, type: String })
  username: string;

  @Prop({ unique: true, required: true, type: String })
  email: string;

  @Prop({ required: true, type: String, minlength: 6 })
  password: string;

  @Prop({ required: true, type: [String], enum: Object.values(Role), default: [Role.USER] })
  roles: Role[];

  @Prop({ required: true, type: Boolean, default: false })
  isActive: boolean;

  @Prop({ required: true, type: String })
  activationCode: string;

  @Prop({ type: Types.ObjectId, required: false, ref: "Profile" })
  profile?: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);
