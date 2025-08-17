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
import { ProductVariant } from "./entities/product-variant.entity";
import { Product } from "./entities/product.entity";

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
    this.logger.info(`Creating product...`);

    const { name, brand, category, description, image, variants } = createProductDto;
    const slug = generateSlug(name);

    const existingProductNameOrSlug = await this.getProductByNameOrSlug(name, slug);
    if (existingProductNameOrSlug) throw new ConflictException("Product already exists");

    const variantsProduct = await Promise.all(
      variants.map((variant) => this.productVariantModel.create(variant)),
    );
    if (!variantsProduct)
      throw new InternalServerErrorException("Failed to create product variant");

    const variantProductIds = variantsProduct.map((variant) => variant._id);
    const Product = await this.productModel.create({
      name,
      slug,
      description,
      image,
      brandId: brand,
      categoryIds: category,
      variantIds: variantProductIds,
    });
    if (!Product) throw new InternalServerErrorException("Failed to create product");

    await this.redisService.deleteByPattern("product:*");

    return Product;
  }
}
