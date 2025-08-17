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

import { CreateProductDto } from "./dto/create-product.dto";
import { Product, ProductVariant } from "./entities/product.entities";

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(ProductVariant.name) private readonly productVariantModel: Model<ProductVariant>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  private async getProductByNameOrSlug(name: string, slug: string): Promise<Product | null> {
    return await this.productModel.findOne({ $or: [{ name }, { slug: slug }] });
  }
  async create(createProductDto: CreateProductDto): Promise<Product> {
    this.logger.info(`Creaing Producct....`);

    const { name, ...rest } = createProductDto;
    const slug = generateSlug(name);

    const existingProductNameOrSlug = await this.getProductByNameOrSlug(name, slug);
    if (existingProductNameOrSlug) throw new ConflictException("Product already exists");

    const product = await this.productModel.create({
      name,
      slug,
      ...rest,
    });
    if (!product) throw new InternalServerErrorException("Failed to create product");

    await this.redisService.deleteByPattern("product:*");

    return product;
  }
}
