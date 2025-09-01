import { Module } from "@nestjs/common";

import { JobModule } from "src/common/job/job.module";
import { DatabaseModule } from "src/config/database.module";

import { BrandProcessor } from "./brand.worker";
import { BrandsController } from "./brands.controller";
import { BrandsService } from "./brands.service";

@Module({
  imports: [DatabaseModule, JobModule],
  controllers: [BrandsController],
  providers: [BrandsService, BrandProcessor],
})
export class BrandsModule {}
