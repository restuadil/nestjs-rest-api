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

import { CreateProductDto } from "./dto/create-product.dto";
import { QueryProductDto, QueryResponseProduct } from "./dto/query-product.dto";
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

  async findAll(
    queryProductDto: QueryProductDto,
  ): Promise<PaginationResponse<QueryResponseProduct>> {
    this.logger.info(`Getting all products...`);

    const productsCache = await this.redisService.get<PaginationResponse<QueryResponseProduct>>(
      `product:${JSON.stringify(queryProductDto)}`,
    );
    if (productsCache) return productsCache;

    const { limit, order, page, search, sort, brandId, categoryId } = queryProductDto;
    const queryObject: FilterQuery<Product> = {};

    if (search) {
      queryObject.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
      ];
    }

    if (brandId) queryObject.brandId = brandId;
    if (categoryId) queryObject.categoryIds = categoryId;

    const [data, total] = await Promise.all([
      this.productModel
        .aggregate<QueryResponseProduct>([
          { $match: queryObject },
          {
            $lookup: {
              from: "product_variants",
              localField: "variantIds",
              foreignField: "_id",
              as: "variants",
            },
          },
          {
            $addFields: {
              totalQuantity: { $sum: "$variants.quantity" },
              minPrice: { $min: "$variants.price" },
              maxPrice: { $max: "$variants.price" },
            },
          },
          {
            $project: {
              variants: 0,
            },
          },
          {
            $sort: { [sort]: order === "asc" ? 1 : -1 },
          },
          {
            $skip: (page - 1) * limit,
          },
          {
            $limit: limit,
          },
        ])
        .exec(),
      this.productModel.countDocuments(queryObject).exec(),
    ]);

    const meta: Meta = generateMeta(page, limit, Number(total));

    await this.redisService.set(
      `product:${JSON.stringify(queryProductDto)}`,
      { data, meta },
      this.configService.get("REDIS_TTL"),
    );

    return {
      data,
      meta,
    };
  }

  async findOne(id: Types.ObjectId): Promise<Product> {
    this.logger.info(`Getting product...`);

    const product = await this.productModel
      .findById(id)
      .populate([
        {
          path: "categoryIds",
          select: "name",
        },
        {
          path: "brandId",
          select: "name",
        },
        {
          path: "variantIds",
          select: "-createdAt -updatedAt",
        },
      ])
      .exec();
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }

  // TODO implement update
  async update() {}

  async remove(id: Types.ObjectId): Promise<Product> {
    this.logger.info(`Deleting product...`);

    const deletedProduct = await this.productModel.findByIdAndDelete(id);
    if (!deletedProduct) throw new NotFoundException("Product not found");

    await this.redisService.deleteByPattern("product:*");

    return deletedProduct;
  }
}
