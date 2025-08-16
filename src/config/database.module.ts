import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { Category, CategorySchema } from "src/api/categories/entities/category.entity";
import { User, UserSchema } from "src/api/users/entities/user.entitiy";

import { ConfigService } from "./config.service";

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>("DATABASE_URL"),
        dbName: configService.get<string>("DATABASE_NAME"),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
