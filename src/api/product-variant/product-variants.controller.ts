import { Body, Controller, Delete, Get, Inject, Param, Post, Query } from "@nestjs/common";

import { Types } from "mongoose";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

import { Public } from "src/common/decortators/public.decorator";
import { Roles } from "src/common/decortators/roles.decorator";
import { idParamSchema } from "src/common/helpers/idparam.dto";
import { ZodPipe } from "src/common/pipe/zod.pipe";
import { Role } from "src/types/role.type";
import { ControllerResponse } from "src/types/web.type";

import {
  CreateProductVariantDto,
  createProductVariantSchema,
} from "./dto/create-product-variant.dto";
import { QueryProductVariantDto, queryProductVariantSchema } from "./dto/query-product-variant.dto";
import { ProductVariant } from "./entities/product-variant.entity";
import { ProductVariantService } from "./product-variants.service";

@Controller("product-variants")
export class ProductVariantController {
  constructor(
    private readonly productVariantService: ProductVariantService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}
  @Post(":id")
  @Roles(Role.ADMIN)
  async create(
    @Body(new ZodPipe(createProductVariantSchema)) createProductVariantDto: CreateProductVariantDto,
    @Param(new ZodPipe(idParamSchema)) id: Types.ObjectId,
  ): Promise<ControllerResponse<ProductVariant>> {
    this.logger.info(`Create Product Variant...`);

    const result = await this.productVariantService.createOneAndInsertToProduct(
      createProductVariantDto,
      new Types.ObjectId(id),
    );

    return { message: "Product variant created successfully", data: result };
  }

  @Get(":id")
  @Public()
  async findOne(
    @Param(new ZodPipe(idParamSchema)) id: Types.ObjectId,
  ): Promise<ControllerResponse<ProductVariant>> {
    this.logger.info(`Get One Product Variant...`);
    const result = await this.productVariantService.findOne(new Types.ObjectId(id));
    return { message: "Product variant found successfully", data: result };
  }
  @Get()
  @Public()
  async findAll(
    @Query(new ZodPipe(queryProductVariantSchema)) queryProductVariantDto: QueryProductVariantDto,
  ): Promise<ControllerResponse<ProductVariant[]>> {
    this.logger.info(`Get All Product Variants...`);
    const { data, meta } = await this.productVariantService.findAll(queryProductVariantDto);
    return { message: "Product variants found successfully", data, meta };
  }

  @Delete(":id")
  @Roles(Role.ADMIN)
  async remove(
    @Param(new ZodPipe(idParamSchema)) id: Types.ObjectId,
  ): Promise<ControllerResponse<ProductVariant>> {
    this.logger.info(`Delete One Product Variant...`);
    const result = await this.productVariantService.remove(new Types.ObjectId(id));
    return { message: "Product variant deleted successfully", data: result };
  }
}
