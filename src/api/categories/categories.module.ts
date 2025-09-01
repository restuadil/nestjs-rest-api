import { Module } from "@nestjs/common";

import { JobModule } from "src/common/job/job.module";
import { DatabaseModule } from "src/config/database.module";

import { CategoriesController } from "./categories.controller";
import { CategoriesService } from "./categories.service";
import { CategoryProcessor } from "./category.worker";

@Module({
  imports: [DatabaseModule, JobModule],
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoryProcessor],
  exports: [CategoriesService],
})
export class CategoriesModule {}
