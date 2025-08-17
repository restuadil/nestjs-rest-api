import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { Model } from "mongoose";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

import { generateSlug } from "src/common/helpers/generate-slug";
import { RedisService } from "src/common/redis/redis.service";
import { ConfigService } from "src/config/config.service";

import { CreateBrandDto } from "./dto/create-brand.dto";
import { Brand } from "./entities/brand.entity";

@Injectable()
export class BrandsService {
  constructor(
    @InjectModel(Brand.name) private readonly brandModel: Model<Brand>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}
  private async getBrandByNameOrSlug(name: string, slug: string): Promise<Brand | null> {
    return await this.brandModel.findOne({ $or: [{ name }, { slug: slug }] });
  }

  async create(createBrandDto: CreateBrandDto): Promise<Brand> {
    this.logger.info(`Creating brand...`);

    const { name } = createBrandDto;
    const slug = generateSlug(name);

    const existingBrandNameOrSlug = await this.getBrandByNameOrSlug(name, slug);
    if (existingBrandNameOrSlug) throw new ConflictException("Brand already exists");

    const newBrand = await this.brandModel.create({
      name,
      slug,
    });
    if (!newBrand) throw new InternalServerErrorException("Failed to create brand");

    await this.redisService.deleteByPattern("brand:*");

    return newBrand;
  }
}
