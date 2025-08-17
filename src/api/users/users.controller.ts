import { Controller, Get, Inject, Param, Query, UsePipes } from "@nestjs/common";

import { Types } from "mongoose";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

import { ZodPipe } from "src/common/pipe/zod.pipe";
import { ControllerResponse } from "src/types/web.type";

import { QueryUserDto, queryUserSchema } from "./dto/query-user.dto";
import { User } from "./entities/user.entitiy";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly usersService: UsersService,
  ) {}
  @Get(":id")
  async findOne(@Param("id") id: Types.ObjectId): Promise<ControllerResponse<User>> {
    this.logger.info(`Users Controller - findOne`);
    const result = await this.usersService.findOne(new Types.ObjectId(id));

    return { message: "User fetched successfully", data: result };
  }

  @Get()
  @UsePipes(new ZodPipe(queryUserSchema))
  async findAll(@Query() queryUserDto: QueryUserDto): Promise<ControllerResponse<User[]>> {
    this.logger.info(`Users Controller - findAll`);

    const { data, meta } = await this.usersService.findAll(queryUserDto);

    return { message: "Users fetched successfully", data, meta };
  }
}
