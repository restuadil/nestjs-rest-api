import { Schema } from "mongoose";

export function getSchemaKeys<T>(schema: Schema<T>): (keyof T)[] {
  return Object.keys(schema.paths) as (keyof T)[];
}
