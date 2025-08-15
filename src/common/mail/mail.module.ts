import { Module } from "@nestjs/common";

import * as nodemailer from "nodemailer";

import { ConfigService } from "src/config/config.service";

import { MailService } from "./mail.service";
@Module({
  providers: [
    {
      provide: "MAIL_TRANSPORTER",
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
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
