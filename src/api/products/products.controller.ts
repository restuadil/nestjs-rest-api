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

import { CreateProductDto, createProductSchema } from "./dto/create-product.dto";
import { QueryProductDto, queryProductSchema } from "./dto/query-product.dto";
import { Product } from "./entities/product.entity";
import { ProductsService } from "./products.service";

@Controller("products")
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  @Post()
  @Roles(Role.ADMIN)
  async create(
    @Body(new ZodPipe(createProductSchema)) createProductDto: CreateProductDto,
  ): Promise<ControllerResponse<Product>> {
    this.logger.info(`Products Controller - create`);

    const result = await this.productsService.create(createProductDto);

    return { message: "Product created successfully", data: result };
  }

  @Get()
  @Public()
  async findAll(
    @Query(new ZodPipe(queryProductSchema)) queryProductDto: QueryProductDto,
  ): Promise<ControllerResponse<Product[]>> {
    this.logger.info(`Products Controller - findAll`);

    const { data, meta } = await this.productsService.findAll(queryProductDto);

    return { message: "Products fetched successfully", data, meta };
  }

  @Get(":id")
  @Public()
  async findOne(
    @Param(new ZodPipe(idParamSchema)) id: Types.ObjectId,
  ): Promise<ControllerResponse<Product>> {
    this.logger.info(`Products Controller - findOne`);

    const result = await this.productsService.findOne(new Types.ObjectId(id));

    return { message: "Product fetched successfully", data: result };
  }
}
