import { Body, Controller, Get, Inject, Post, Query, Res } from "@nestjs/common";

import { Response } from "express";
import { Types } from "mongoose";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

import { Cookie } from "src/common/decortators/cookie.decorator";
import { Me } from "src/common/decortators/me.decorator";
import { Public } from "src/common/decortators/public.decorator";
import { ZodPipe } from "src/common/pipe/zod.pipe";
import { UserPayload } from "src/types/jwt.type";
import { ControllerResponse } from "src/types/web.type";

import { AuthService } from "./auth.service";
import { ActivateDto, activateSchema } from "./dto/auth-activate.dto";
import { LoginDto, loginSchema } from "./dto/auth-login.dto";
import { RegisterDto, registerSchema } from "./dto/auth-register.dto";
import { ChangePasswordDto, changePasswordSchema } from "./dto/change-password.dto";
import { User } from "../users/entities/user.entitiy";

@Controller("auth")
export class AuthController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly authService: AuthService,
  ) {}

  @Post("register")
  @Public()
  async register(
    @Body(new ZodPipe(registerSchema)) registerDto: RegisterDto,
  ): Promise<ControllerResponse<User>> {
    this.logger.info(`Auth Controller - register`);

    const result = await this.authService.register(registerDto);

    return { message: "User registered successfully", data: result };
  }

  @Post("login")
  @Public()
  async login(
    @Body(new ZodPipe(loginSchema)) loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ControllerResponse<{ accessToken: string }>> {
    this.logger.info(`Auth Controller - login`);

    const { accessToken, refreshToken } = await this.authService.login(loginDto);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    return { message: "User logged in successfully", data: { accessToken } };
  }

  @Get("activation")
  @Public()
  async activate(
    @Query(new ZodPipe(activateSchema)) activateDto: ActivateDto,
  ): Promise<ControllerResponse<User>> {
    this.logger.info(`Auth Controller - activate`);

    const result = await this.authService.activate(activateDto);

    return { message: "User activated successfully", data: result };
  }

  @Get("me")
  async me(@Me() me: UserPayload): Promise<ControllerResponse<User>> {
    this.logger.info(`Auth Controller - me`);

    const result = await this.authService.me(me);

    return { message: "User fetched successfully", data: result };
  }

  @Get("refresh")
  @Public()
  async refresh(
    @Cookie("refreshToken") refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ControllerResponse<{ accessToken: string }>> {
    this.logger.info(`Auth Controller - refresh`);

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refresh(refreshToken);

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    return {
      message: "Token refreshed successfully",
      data: {
        accessToken,
      },
    };
  }

  @Post("logout")
  @Public()
  async logout(
    @Cookie("refreshToken") refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ControllerResponse<void>> {
    this.logger.info(`Auth Controller - logout`);

    await this.authService.logout(refreshToken);

    res.clearCookie("refreshToken");
    return { message: "User logged out successfully", data: null };
  }

  @Post("change-password")
  async changePassword(
    @Body(new ZodPipe(changePasswordSchema)) changePassword: ChangePasswordDto,
    @Me() me: UserPayload,
  ): Promise<ControllerResponse<User>> {
    this.logger.info(`Auth Controller - changePassword`);

    const result = await this.authService.changePassword(new Types.ObjectId(me.id), changePassword);

    return { message: "Password changed successfully", data: result };
  }
}
