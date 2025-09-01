import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";

import { FilterQuery, Model, Types } from "mongoose";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

import { generateMeta } from "src/common/helpers/generate-meta";
import { RedisService } from "src/common/redis/redis.service";
import { Meta, PaginationResponse } from "src/types/web.type";

import { QueryUserDto } from "./dto/query-user.dto";
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

  async findAll(queryUserDto: QueryUserDto): Promise<PaginationResponse<User>> {
    this.logger.info(`Get All Users...`);
    const userCache = await this.redisService.get<PaginationResponse<User>>(
      `user:${JSON.stringify(queryUserDto)}`,
    );
    if (userCache) return userCache;

    const { limit, order, page, search, sort, roles, isActive } = queryUserDto;
    const queryObject: FilterQuery<User> = {};

    if (search && search.length > 0) {
      queryObject.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (roles && roles.length > 0) {
      queryObject.roles = { $in: roles };
    }

    if (isActive !== undefined) {
      queryObject.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.userModel
        .find(queryObject)
        .sort({ [sort]: order })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean()
        .exec(),
      this.userModel.countDocuments(queryObject).exec(),
    ]);

    const meta: Meta = generateMeta(page, limit, Number(total));

    await this.redisService.set(`user:${JSON.stringify(queryUserDto)}`, { data, meta });

    return { data, meta };
  }

  async findAllRaws(): Promise<User[]> {
    return this.userModel.find().lean().exec();
  }
}
