import { Types } from "mongoose";
import z from "zod";

export const idParamSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: "Invalid ObjectId",
});
