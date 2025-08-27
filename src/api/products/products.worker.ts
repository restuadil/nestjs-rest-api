import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject } from "@nestjs/common";

import { Job } from "bullmq";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

import { MailService } from "src/common/mail/mail.service";

import { Product } from "./entities/product.entity";
import { UsersService } from "../users/users.service";

@Processor(Product.name)
export class ProductProcessor extends WorkerHost {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly userSesrvice: UsersService,
    private readonly mailService: MailService,
  ) {
    super();
  }
  async process(job: Job<{ product: Product }>): Promise<void> {
    switch (job.name) {
      case "productCreated":
        return this.productCreated(job);
      default:
        return Promise.resolve();
    }
  }

  private async productCreated(job: Job<{ product: Product }>): Promise<void> {
    this.logger.info(`Processing job ${job.id} of type ${job.name}`);
    const users = await this.userSesrvice.findAllRaws();
    const { product } = job.data;
    for (const user of users) {
      await this.mailService.sendMail({
        to: user.email,
        subject: "Produk Baru Tersedia!",
        html: `<h1>Produk Baru Tersedia! : ${product.name}</h1>`,
        text: `Produk Baru Tersedia!`,
      });
    }
  }
}
