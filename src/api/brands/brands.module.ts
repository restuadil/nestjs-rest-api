import { Module } from "@nestjs/common";

import { DatabaseModule } from "src/config/database.module";

import { BrandsController } from "./brands.controller";
import { BrandsService } from "./brands.service";

@Module({
  imports: [DatabaseModule],
  controllers: [BrandsController],
  providers: [BrandsService],
})
export class BrandsModule {}
