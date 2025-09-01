import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { Job } from "bullmq";
import { Model, Types } from "mongoose";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

import { Category } from "./entities/category.entity";
import { Product } from "../products/entities/product.entity";

@Processor(Category.name)
export class CategoryProcessor extends WorkerHost {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {
    super();
  }
  async process(job: Job<{ category: Category }>): Promise<void> {
    switch (job.name) {
      case "categoryDeleted":
        return this.categoryDeleted(job);
      default:
        return Promise.resolve();
    }
  }

  private async categoryDeleted(job: Job<{ category: Category }>): Promise<void> {
    this.logger.info(`Processing job ${job.id} of type ${job.name}`);
    const { category } = job.data;

    const categoryId = new Types.ObjectId(category._id as string);

    const updatedProducts = await this.productModel.updateMany(
      { categoryIds: categoryId },
      { $pull: { categoryIds: categoryId } },
    );

    this.logger.info(
      `✅ Removed categoryId ${categoryId.toHexString()} from ${updatedProducts.modifiedCount} products`,
    );
  }
}
