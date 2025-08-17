import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { FilterQuery, Model, Types } from "mongoose";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

import { generateMeta } from "src/common/helpers/generate-meta";
import { generateSlug } from "src/common/helpers/generate-slug";
import { RedisService } from "src/common/redis/redis.service";
import { ConfigService } from "src/config/config.service";
import { Meta, PaginationResponse } from "src/types/web.type";

import { CreateCategoryDto } from "./dto/create-category.dto";
import { QueryCategoryDto } from "./dto/query-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { Category } from "./entities/category.entity";

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}
  private async getCategoryByNameOrSlug(name: string, slug: string): Promise<Category | null> {
    const category = await this.categoryModel.findOne({ $or: [{ name }, { slug: slug }] });
    return category;
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    this.logger.info(`Creating category...`);

    const { name } = createCategoryDto;
    const slug = generateSlug(name);

    const existingCategoryNameOrSlug = await this.getCategoryByNameOrSlug(name, slug);
    if (existingCategoryNameOrSlug) throw new ConflictException("Category already exists");

    await this.redisService.deleteByPattern("category:*");

    return await this.categoryModel.create({
      name,
      slug,
    });
  }

  async findAll(queryCategoryDto: QueryCategoryDto): Promise<PaginationResponse<Category>> {
    this.logger.info(`Get all categories...`);

    const categoriesCache = await this.redisService.get<PaginationResponse<Category>>(
      `category:${JSON.stringify(queryCategoryDto)}`,
    );
    if (categoriesCache) return categoriesCache;

    const { limit, order, page, search, sort } = queryCategoryDto;
    const queryObject: FilterQuery<Category> = {};

    if (search && search.length > 0) {
      queryObject.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.categoryModel
        .find(queryObject)
        .sort({ [sort]: order })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean()
        .exec(),
      this.categoryModel.countDocuments(queryObject).exec(),
    ]);

    const meta: Meta = generateMeta(page, limit, Number(total));

    await this.redisService.set(
      `category:${JSON.stringify(queryCategoryDto)}`,
      { data, meta },
      this.configService.get<number>("REDIS_TTL"),
    );

    return {
      data,
      meta,
    };
  }

  async findOne(id: Types.ObjectId): Promise<Category> {
    this.logger.info(`Get category by id...`);

    const category = await this.categoryModel.findById(id).lean().exec();
    if (!category) throw new NotFoundException("Category not found");

    return category;
  }

  async update(id: Types.ObjectId, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    this.logger.info(`Updating category...`);

    await this.findOne(id);
    const { name } = updateCategoryDto;
    const slug = generateSlug(name);

    const existingCategoryNameOrSlug = await this.getCategoryByNameOrSlug(name, slug);
    if (
      existingCategoryNameOrSlug &&
      (existingCategoryNameOrSlug._id as Types.ObjectId).toString() !== id.toString()
    )
      throw new ConflictException("Category already exists");

    const updatedCategory = await this.categoryModel.findByIdAndUpdate(
      id,
      { name, slug },
      { new: true },
    );
    if (!updatedCategory) throw new InternalServerErrorException("Failed to update category");

    await this.redisService.deleteByPattern("category:*");

    return updatedCategory;
  }
}
