import { ConflictException, Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { Model } from "mongoose";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

import { generateSlug } from "src/common/helpers/generate-slug";
import { RedisService } from "src/common/redis/redis.service";

import { CreateCategoryDto } from "./dto/create-category.dto";
import { Category } from "./entities/category.entity";

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly redisService: RedisService,
  ) {}
  private async getCategoryByNameOrSlugAndThrow(
    name: string,
    slug: string,
  ): Promise<Category | null> {
    const category = await this.categoryModel.findOne({ $or: [{ name }, { slug: slug }] });
    if (category) throw new ConflictException("Category already exists");
    return category;
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    this.logger.info(`Creating category...`);

    const { name } = createCategoryDto;
    const slug = generateSlug(name);

    const existingCategoryNameOrSlug = await this.getCategoryByNameOrSlugAndThrow(name, slug);
    if (existingCategoryNameOrSlug) throw new ConflictException("Category already exists");

    await this.redisService.deleteByPattern("category:*");

    return await this.categoryModel.create({
      name,
      slug,
    });
  }
}
