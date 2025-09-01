import { InjectQueue } from "@nestjs/bullmq";
import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { Queue } from "bullmq";
import { FilterQuery, Model, Types } from "mongoose";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

import { generateMeta } from "src/common/helpers/generate-meta";
import { generateSlug } from "src/common/helpers/generate-slug";
import { RedisService } from "src/common/redis/redis.service";
import { ConfigService } from "src/config/config.service";
import { Meta, PaginationResponse } from "src/types/web.type";

import { CreateBrandDto } from "./dto/create-brand.dto";
import { QueryBrandDto } from "./dto/query-brand.dto";
import { Brand } from "./entities/brand.entity";

@Injectable()
export class BrandsService {
  constructor(
    @InjectModel(Brand.name) private readonly brandModel: Model<Brand>,
    @InjectQueue(Brand.name) private readonly brandQueue: Queue,
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

  async findOne(id: Types.ObjectId): Promise<Brand> {
    this.logger.info(`Get brand by id...`);

    const brand = await this.brandModel.findById(id).lean().exec();
    if (!brand) throw new NotFoundException("Brand not found");

    return brand;
  }

  async findAll(queryBrandDto: QueryBrandDto): Promise<PaginationResponse<Brand>> {
    this.logger.info(`Get all brands...`);

    const brandsCache = await this.redisService.get<PaginationResponse<Brand>>(
      `brand:${JSON.stringify(queryBrandDto)}`,
    );
    if (brandsCache) return brandsCache;

    const { limit, order, page, search, sort } = queryBrandDto;
    const queryObject: FilterQuery<Brand> = {};

    if (search && search.length > 0) {
      queryObject.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.brandModel
        .find(queryObject)
        .sort({ [sort]: order })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean()
        .exec(),
      this.brandModel.countDocuments(queryObject).exec(),
    ]);

    const meta: Meta = generateMeta(page, limit, Number(total));

    await this.redisService.set(
      `brand:${JSON.stringify(queryBrandDto)}`,
      { data, meta },
      this.configService.get("REDIS_TTL"),
    );

    return { data, meta };
  }

  async update(id: Types.ObjectId, updateBrandDto: CreateBrandDto): Promise<Brand> {
    this.logger.info(`Updating brand...`);

    await this.findOne(id);
    const { name } = updateBrandDto;
    const slug = generateSlug(name);

    const existingBrandNameOrSlug = await this.getBrandByNameOrSlug(name, slug);
    if (
      existingBrandNameOrSlug &&
      (existingBrandNameOrSlug._id as Types.ObjectId).toString() !== id.toString()
    )
      throw new ConflictException("Brand already exists");

    const updatedBrand = await this.brandModel.findByIdAndUpdate(id, { name, slug }, { new: true });
    if (!updatedBrand) throw new InternalServerErrorException("Failed to update brand");

    await this.redisService.deleteByPattern("brand:*");

    return updatedBrand;
  }

  async remove(id: Types.ObjectId): Promise<Brand> {
    this.logger.info(`Deleting brand...`);

    const deletedBrand = await this.brandModel.findByIdAndDelete(id);
    if (!deletedBrand) throw new NotFoundException("Brand not found");

    await this.redisService.deleteByPattern("brand:*");
    await this.redisService.deleteByPattern("product:*");
    await this.brandQueue.add("brandDeleted", { brand: deletedBrand });

    return deletedBrand;
  }
}
