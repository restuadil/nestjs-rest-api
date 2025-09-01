import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject } from "@nestjs/common";

import { Job } from "bullmq";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

import { MailService } from "src/common/mail/mail.service";

import { Product } from "./entities/product.entity";
import { UsersService } from "../users/users.service";

@Processor(Product.name, {
  limiter: { max: 5, duration: 1000 },
})
export class ProductProcessor extends WorkerHost {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly userService: UsersService,
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
    this.logger.info(`📦 Processing job ${job.id} of type ${job.name}`);
    const users = await this.userService.findAllRaws();
    const { product } = job.data;

    let sent = 0;
    for (const user of users) {
      try {
        await this.mailService.sendMail({
          to: user.email,
          subject: "Produk Baru Tersedia!",
          html: `<h1>Produk Baru Tersedia! : ${product.name}</h1>`,
          text: `Produk Baru Tersedia!`,
        });

        sent++;
        await job.updateProgress(Math.round((sent / users.length) * 100));

        this.logger.info(`✅ Email sent to ${user.email}`);
      } catch (error) {
        this.logger.error(`❌ Failed to send email to ${user.email}: ${error}`);
      }
    }
    this.logger.info(`📨 Job ${job.id} selesai. Total terkirim: ${sent}/${users.length}`);
  }

  // Worker Events
  @OnWorkerEvent("active")
  onActive(job: Job) {
    this.logger.info(`🚀 Job ${job.id} started`);
  }

  @OnWorkerEvent("progress")
  onProgress(job: Job) {
    this.logger.info(`📊 Job ${job.id} progress: ${JSON.stringify(job.progress)}% completed.`);
  }

  @OnWorkerEvent("completed")
  onCompleted(job: Job) {
    this.logger.info(`🎉 Job ${job.id} COMPLETED!`);
  }

  @OnWorkerEvent("failed")
  onFailed(job: Job, err: Error) {
    this.logger.error(
      `💥 Job ${job.id} FAILED! Attempt ${job.attemptsMade}. Reason: ${err.message}`,
    );
  }
}
