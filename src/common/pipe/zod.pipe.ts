import { PipeTransform } from "@nestjs/common";

import { ZodSchema } from "zod";

export class ZodPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    return this.schema.parse(value);
  }
}
