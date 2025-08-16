import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { Model, Types } from "mongoose";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

import { RedisService } from "src/common/redis/redis.service";

import { User } from "./entities/user.entitiy";

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly redisService: RedisService,
  ) {}
  async findOne(id: Types.ObjectId): Promise<User> {
    this.logger.info(`Get User...`);
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException("User not found");

    return user;
  }
}
