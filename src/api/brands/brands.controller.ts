import { Body, Controller, Get, Inject, Param, Post, Query } from "@nestjs/common";

import { Types } from "mongoose";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

import { Public } from "src/common/decortators/public.decorator";
import { Roles } from "src/common/decortators/roles.decorator";
import { idParamSchema } from "src/common/helpers/idparam.dto";
import { ZodPipe } from "src/common/pipe/zod.pipe";
import { Role } from "src/types/role.type";
import { ControllerResponse } from "src/types/web.type";

import { BrandsService } from "./brands.service";
import { CreateBrandDto, createBrandSchema } from "./dto/create-brand.dto";
import { QueryBrandDto, queryBrandSchema } from "./dto/query-brand.dto";
import { Brand } from "./entities/brand.entity";

@Controller("brands")
export class BrandsController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly brandsService: BrandsService,
  ) {}

  @Post()
  @Roles(Role.ADMIN)
  async create(
    @Body(new ZodPipe(createBrandSchema))
    createBrandDto: CreateBrandDto,
  ): Promise<ControllerResponse<Brand>> {
    this.logger.info(`Brands Controller - create`);

    const result = await this.brandsService.create(createBrandDto);

    return { message: "Brand created successfully", data: result };
  }

  @Get(":id")
  async findOne(
    @Param(new ZodPipe(idParamSchema)) id: Types.ObjectId,
  ): Promise<ControllerResponse<Brand>> {
    this.logger.info(`Brands Controller - findOne`);

    const result = await this.brandsService.findOne(new Types.ObjectId(id));

    return { message: "Brand fetched successfully", data: result };
  }

  @Get()
  @Public()
  async findAll(
    @Query(new ZodPipe(queryBrandSchema)) queryBrandDto: QueryBrandDto,
  ): Promise<ControllerResponse<Brand[]>> {
    this.logger.info(`Brands Controller - findAll`);

    const { data, meta } = await this.brandsService.findAll(queryBrandDto);

    return { message: "Brands fetched successfully", data: data, meta: meta };
  }
}
