import { Schema, SchemaDefinitionType, Document } from "mongoose";

type StringKey<T> = Extract<keyof T, string>;
type CleanKeys<T> = Exclude<StringKey<T>, keyof Document | `$$${string}` | `$${string}` | "__v">;

export function getSchemaKeys<T>(schema: Schema<T>): CleanKeys<SchemaDefinitionType<T>>[] {
  const raw = Object.keys(schema.paths);
  const filtered = raw.filter((k) => k !== "__v" && !k.startsWith("$"));
  return filtered as CleanKeys<SchemaDefinitionType<T>>[];
}
