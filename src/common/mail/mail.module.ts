import { Module } from "@nestjs/common";

import * as nodemailer from "nodemailer";

import { ConfigService } from "src/config/config.service";

import { MailService } from "./mail.service";

@Module({
  providers: [
    {
      provide: "MAIL_TRANSPORTER",
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const isProd = configService.get<string>("NODE_ENV") === "production";

        if (!isProd) {
          const testAccount = await nodemailer.createTestAccount();

          return nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass,
            },
          });
        }

        return nodemailer.createTransport({
          host: configService.get<string>("EMAIL_SMTP_HOST"),
          port: configService.get<number>("EMAIL_SMTP_PORT"),
          secure: configService.get<boolean>("EMAIL_SMTP_SECURE"),
          auth: {
            user: configService.get<string>("EMAIL_SMTP_USER"),
            pass: configService.get<string>("EMAIL_SMTP_PASS"),
          },
        });
      },
    },
    MailService,
  ],
  exports: ["MAIL_TRANSPORTER", MailService],
})
export class MailModule {}
