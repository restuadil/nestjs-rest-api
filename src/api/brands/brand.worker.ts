import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { Job } from "bullmq";
import { Model, Types } from "mongoose";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

import { Brand } from "./entities/brand.entity";
import { Product } from "../products/entities/product.entity";

@Processor(Brand.name)
export class BrandProcessor extends WorkerHost {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {
    super();
  }
  async process(job: Job<{ brand: Brand }>): Promise<void> {
    switch (job.name) {
      case "brandDeleted":
        return this.BrandDeleted(job);
      default:
        return Promise.resolve();
    }
  }

  private async BrandDeleted(job: Job<{ brand: Brand }>): Promise<void> {
    this.logger.info(`Processing job ${job.id} of type ${job.name}`);
    const { brand } = job.data;

    const BrandId = new Types.ObjectId(brand._id as string);

    const updatedProducts = await this.productModel.updateMany(
      { brandId: BrandId },
      { $set: { brandId: null } },
    );

    this.logger.info(
      `✅ Removed BrandId ${BrandId.toHexString()} from ${updatedProducts.modifiedCount} products`,
    );
  }
}
