import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { WinstonModule } from "nest-winston";
import * as winston from "winston";

import { AuthModule } from "./api/auth/auth.module";
import { BrandsModule } from "./api/brands/brands.module";
import { CategoriesModule } from "./api/categories/categories.module";
import { UsersModule } from "./api/users/users.module";
import { CommonModule } from "./common/common.mocule";
import { ConfigService } from "./config/config.service";
import { validateEnv } from "./config/env";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, ".env"],
      validate: validateEnv,
    }),
    CommonModule,
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        level: configService.get<string>("NODE_ENV") === "development" ? "debug" : "info",
        transports: [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize({
                level: true,
                colors: {
                  error: "red",
                  warn: "yellow",
                  info: "green",
                  http: "magenta",
                  verbose: "cyan",
                  debug: "blue",
                  silly: "white",
                },
              }),
              winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
              winston.format.printf(
                ({
                  level,
                  message,
                  timestamp,
                }: {
                  level: string;
                  message: string;
                  timestamp: string;
                }) => {
                  return `${timestamp} ${level}: ${message}`;
                },
              ),
            ),
          }),
        ],
      }),
    }),
    AuthModule,
    UsersModule,
    CategoriesModule,
    BrandsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
