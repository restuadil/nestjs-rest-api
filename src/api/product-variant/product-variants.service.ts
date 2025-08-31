import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";

import { Connection, Model, Types } from "mongoose";
import { FilterQuery } from "mongoose";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

import { generateMeta } from "src/common/helpers/generate-meta";
import { Meta, PaginationResponse } from "src/types/web.type";

import { CreateProductVariantDto } from "./dto/create-product-variant.dto";
import { QueryProductVariantDto } from "./dto/query-product-variant.dto";
import { ProductVariant } from "./entities/product-variant.entity";
import { Product } from "../products/entities/product.entity";

@Injectable()
export class ProductVariantService {
  constructor(
    @InjectModel(ProductVariant.name) private readonly productVariantModel: Model<ProductVariant>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async findAll(
    queryProductVariantDto: QueryProductVariantDto,
  ): Promise<PaginationResponse<ProductVariant>> {
    this.logger.info(`Get All Variants...`);

    const { limit, order, page, search, sort } = queryProductVariantDto;
    const queryObject: FilterQuery<ProductVariant> = {};

    if (search && search.length > 0) {
      queryObject.$or = [
        { color: { $regex: search, $options: "i" } },
        { size: { $regex: search, $options: "i" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.productVariantModel
        .find(queryObject)
        .sort({ [sort]: order })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean()
        .exec(),
      this.productVariantModel.countDocuments(queryObject).exec(),
    ]);

    const meta: Meta = generateMeta(page, limit, Number(total));

    return { data, meta };
  }

  async createMany(createProductVariantDto: CreateProductVariantDto[]): Promise<ProductVariant[]> {
    this.logger.info(`Create Many Variants...`);
    const productVariants = await this.productVariantModel.insertMany(createProductVariantDto);
    if (!productVariants)
      throw new InternalServerErrorException("Failed to create product variants");
    return productVariants;
  }

  async createOneAndInsertToProduct(
    createProductVariantDto: CreateProductVariantDto,
    productId: Types.ObjectId,
  ): Promise<ProductVariant> {
    this.logger.info(`Create One Variant...`);
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      this.logger.info(`Create One Variant...`);
      const { color, size } = createProductVariantDto;

      const productById = await this.productModel
        .findById(productId)
        .populate<{
          variantIds: ProductVariant[];
        }>("variantIds")
        .select("color size")
        .session(session)
        .exec(); // !! terpaksa pakai model (circular dependency)
      if (!productById) throw new NotFoundException("Product not found");

      this.logger.info(`ProductById... ${JSON.stringify(productById)}`);

      const checkColorAndSize = productById.variantIds.some((variant) => {
        return variant.color === color && variant.size === size;
      });
      if (checkColorAndSize) throw new ConflictException("Variant already exists");

      const newProductVariant = await this.productModel.updateOne(
        { _id: productId },
        { $push: { variantIds: createProductVariantDto } },
      );
      if (!newProductVariant)
        throw new InternalServerErrorException("Failed to create product variant");

      await session.commitTransaction();
      void session.endSession();

      return productById as unknown as ProductVariant;
    } catch (err) {
      await session.abortTransaction();
      void session.endSession();
      throw err;
    }
  }

  async findOne(id: Types.ObjectId): Promise<ProductVariant> {
    this.logger.info(`Get One Variant...`);
    const variant = await this.productVariantModel.findById(id).exec();
    if (!variant) throw new NotFoundException("Variant not found");
    return variant;
  }

  async remove(id: Types.ObjectId): Promise<ProductVariant> {
    this.logger.info(`Delete One Variant...`);
    const deletedVariant = await this.productVariantModel.findByIdAndDelete(id);
    if (!deletedVariant) throw new NotFoundException("Variant not found");
    return deletedVariant;
  }
}
