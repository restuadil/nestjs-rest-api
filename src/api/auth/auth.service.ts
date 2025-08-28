import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";

import * as bcrypt from "bcrypt";
import { Model, Types } from "mongoose";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

import { MailService } from "src/common/mail/mail.service";
import { RedisService } from "src/common/redis/redis.service";
import { ConfigService } from "src/config/config.service";
import { UserPayload } from "src/types/jwt.type";

import { ActivateDto } from "./dto/auth-activate.dto";
import { LoginDto } from "./dto/auth-login.dto";
import { RegisterDto } from "./dto/auth-register.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { User } from "../users/entities/user.entitiy";
import { UsersService } from "../users/users.service";

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly userService: UsersService,
  ) {}

  private async findUserByUsernameOrEmail(username: string, email: string): Promise<User | null> {
    const findUserByUsernameOrEmail = await this.userModel.find({
      $or: [{ username }, { email }],
    });
    return findUserByUsernameOrEmail.length ? findUserByUsernameOrEmail[0] : null;
  }

  private generateTokens(payload: UserPayload) {
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<number>("JWT_ACCESS_EXPIRATION_TIME"),
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
      expiresIn: this.configService.get<number>("JWT_REFRESH_EXPIRATION_TIME"),
    });

    return { accessToken, refreshToken };
  }

  private hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.configService.get<number>("SALT") || 10);
  }

  private compare(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async register(registerDto: RegisterDto): Promise<User> {
    this.logger.info(`Registering user...`);

    const { email, password, username, roles } = registerDto;

    const findUserByUsernameOrEmail = await this.findUserByUsernameOrEmail(username, email);
    if (findUserByUsernameOrEmail) throw new ConflictException("User already exists");

    const hashedPassword = await this.hash(password);
    const isActive = false;
    const activationCode = await this.hash(username + email);

    const user = await this.userModel.create({
      username,
      email,
      password: hashedPassword,
      roles,
      isActive,
      activationCode,
    });

    if (!user) throw new InternalServerErrorException("Failed to create user");

    await this.mailService.sendMail({
      to: email,
      subject: "Activate your account",
      html: `Click <a href=${this.configService.get<string>("CLIENT_HOST")}/auth/activation?activationCode=${activationCode}>here</a> to activate your account`,
    });
    return user;
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    this.logger.info(`Logging  user...`);

    const { identifier, password } = loginDto;

    const user = await this.findUserByUsernameOrEmail(identifier, identifier);
    if (!user) throw new NotFoundException("User not found");
    const isPasswordValid = await this.compare(password, user.password);
    if (!isPasswordValid) throw new NotFoundException("User not found");
    if (user && !user.isActive) throw new ForbiddenException("Please activate your account");
    const payload: UserPayload = {
      id: user._id as string,
      username: user.username,
      email: user.email,
      roles: user.roles,
    };
    const { accessToken, refreshToken } = this.generateTokens(payload);

    return { accessToken, refreshToken };
  }

  async activate(activateDto: ActivateDto): Promise<User> {
    this.logger.info(`Activating user...`);

    const { activationCode } = activateDto;

    const user = await this.userModel.findOne({ activationCode });
    if (!user) throw new NotFoundException("User not found");
    user.isActive = true;
    await user.save();

    return user;
  }

  async me(me: UserPayload): Promise<User> {
    this.logger.info(`Get Me...`);

    const user = await this.userService.findOne(new Types.ObjectId(me.id));

    return user;
  }

  async refresh(oldRefreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    this.logger.info(`Refreshing token...`);

    const { id, username, email, roles }: UserPayload = this.jwtService.verify(oldRefreshToken, {
      secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
    });

    const savedToken: string | null = await this.redisService.get(`refreshToken:${id}`);
    if (!savedToken || savedToken !== oldRefreshToken)
      throw new NotFoundException("Token not found");

    const payload: UserPayload = {
      id,
      username,
      email,
      roles,
    };

    const { accessToken, refreshToken } = this.generateTokens(payload);

    await this.redisService.set(
      `refreshToken:${payload.id}`,
      refreshToken,
      this.configService.get<number>("JWT_REFRESH_EXPIRATION_TIME"),
    );
    return { accessToken, refreshToken };
  }

  async logout(refreshToken: string): Promise<void> {
    this.logger.info(`Logging out user...`);
    const { id }: UserPayload = this.jwtService.verify(refreshToken, {
      secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
    });

    await this.redisService.delete(`refreshToken:${id}`);
  }

  async changePassword(id: Types.ObjectId, changePassword: ChangePasswordDto): Promise<User> {
    this.logger.info(`Resetting password...`);

    const { password, newPassword } = changePassword;

    const user = await this.userService.findOne(id);

    const isPasswordValid = await this.compare(password, user.password);
    if (!isPasswordValid) throw new NotFoundException("User not found");

    const hashedPassword = await this.hash(newPassword);
    user.password = hashedPassword;
    await user.save();

    return user;
  }
}
