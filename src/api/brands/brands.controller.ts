import { Body, Controller, Inject, Post } from "@nestjs/common";

import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

import { Roles } from "src/common/decortators/roles.decorator";
import { ZodPipe } from "src/common/pipe/zod.pipe";
import { Role } from "src/types/role.type";
import { ControllerResponse } from "src/types/web.type";

import { BrandsService } from "./brands.service";
import { CreateBrandDto, createBrandSchema } from "./dto/create-brand.dto";
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
}
