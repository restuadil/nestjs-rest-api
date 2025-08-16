import { Controller, Get, Inject, Param } from "@nestjs/common";

import { Types } from "mongoose";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

import { ControllerResponse } from "src/types/web.type";

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
}
