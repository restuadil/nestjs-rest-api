import { Body, Controller, Get, Inject, Post, Query, UsePipes } from "@nestjs/common";

import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

import { Roles } from "src/common/decortators/roles.decorator";
import { ZodPipe } from "src/common/pipe/zod.pipe";
import { Role } from "src/types/role.type";
import { ControllerResponse } from "src/types/web.type";

import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { QueryCategoryDto, queryCategorySchema } from "./dto/query-category.dto";
import { Category } from "./entities/category.entity";

@Controller("categories")
export class CategoriesController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly categoriesService: CategoriesService,
  ) {}

  @Roles(Role.ADMIN)
  @Post()
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<ControllerResponse<Category>> {
    this.logger.info(`Categories Controller - create`);

    const result = await this.categoriesService.create(createCategoryDto);

    return { message: "Category created successfully", data: result };
  }

  @Get()
  @UsePipes(new ZodPipe(queryCategorySchema))
  async findAll(
    @Query() queryCategoryDto: QueryCategoryDto,
  ): Promise<ControllerResponse<Category[]>> {
    this.logger.info(`Categories Controller - findAll`);

    const { data, meta } = await this.categoriesService.findAll(queryCategoryDto);

    return { message: "Categories fetched successfully", data: data, meta: meta };
  }
}
