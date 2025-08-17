import { Body, Controller, Get, Inject, Param, Post, Put, Query, UsePipes } from "@nestjs/common";

import { Types } from "mongoose";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

import { Public } from "src/common/decortators/public.decorator";
import { Roles } from "src/common/decortators/roles.decorator";
import { idParamSchema } from "src/common/helpers/idparam.dto";
import { ZodPipe } from "src/common/pipe/zod.pipe";
import { Role } from "src/types/role.type";
import { ControllerResponse } from "src/types/web.type";

import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { QueryCategoryDto, queryCategorySchema } from "./dto/query-category.dto";
import { UpdateCategoryDto, updateCategorySchema } from "./dto/update-category.dto";
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
  @Public()
  @UsePipes(new ZodPipe(queryCategorySchema))
  async findAll(
    @Query() queryCategoryDto: QueryCategoryDto,
  ): Promise<ControllerResponse<Category[]>> {
    this.logger.info(`Categories Controller - findAll`);

    const { data, meta } = await this.categoriesService.findAll(queryCategoryDto);

    return { message: "Categories fetched successfully", data: data, meta: meta };
  }

  @Get(":id")
  @UsePipes(new ZodPipe(idParamSchema))
  async findOne(@Param("id") id: Types.ObjectId): Promise<ControllerResponse<Category>> {
    this.logger.info(`Categories Controller - findOne`);

    const result = await this.categoriesService.findOne(new Types.ObjectId(id));

    return { message: "Category fetched successfully", data: result };
  }

  @Put(":id")
  async update(
    @Param(new ZodPipe(idParamSchema)) id: Types.ObjectId,
    @Body(new ZodPipe(updateCategorySchema)) updateCategoryDto: UpdateCategoryDto,
  ): Promise<ControllerResponse<Category>> {
    this.logger.info(`Categories Controller - update`);

    const result = await this.categoriesService.update(new Types.ObjectId(id), updateCategoryDto);

    return { message: "Category updated successfully", data: result };
  }
}
