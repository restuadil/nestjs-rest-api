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
import { Model } from "mongoose";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

import { MailService } from "src/common/mail/mail.service";
import { RedisService } from "src/common/redis/redis.service";
import { ConfigService } from "src/config/config.service";
import { JwtPayload } from "src/types/jwt.type";

import { ActivateDto } from "./dto/auth-activate.dto";
import { LoginDto } from "./dto/auth-login.dto";
import { RegisterDto } from "./dto/auth-register.dto";
import { User } from "../users/entities/user.entitiy";

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  private async existingUsernameOrEmail(username: string, email: string): Promise<User | null> {
    const existingUsernameOrEmail = await this.userModel.find({
      $or: [{ username }, { email }],
    });
    return existingUsernameOrEmail.length ? existingUsernameOrEmail[0] : null;
  }

  private async generateTokens(payload: JwtPayload) {
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<number>("JWT_ACCESS_EXPIRATION_TIME"),
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
      expiresIn: this.configService.get<number>("JWT_REFRESH_EXPIRATION_TIME"),
    });
    await this.redisService.set(
      `refreshToken:${payload.id}`,
      refreshToken,
      this.configService.get<number>("JWT_REFRESH_EXPIRATION_TIME"),
    );
    return { accessToken, refreshToken };
  }

  async register(registerDto: RegisterDto): Promise<User> {
    this.logger.info(`Registering user...`);

    const { email, password, username, roles } = registerDto;

    const existingUsernameOrEmail = await this.existingUsernameOrEmail(username, email);
    if (existingUsernameOrEmail) throw new ConflictException("User already exists");

    const hashedPassword = await bcrypt.hash(password, 10);
    const isActive = false;
    const activationCode = await bcrypt.hash(username + email, 10);

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

    const user = await this.existingUsernameOrEmail(identifier, identifier);
    if (!user) throw new NotFoundException("User not found");
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new NotFoundException("User not found");
    if (user && !user.isActive) throw new ForbiddenException("Please activate your account");
    const payload: JwtPayload = {
      id: user._id as string,
      username: user.username,
      email: user.email,
      roles: user.roles,
    };
    const { accessToken, refreshToken } = await this.generateTokens(payload);

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

  async me(me: JwtPayload): Promise<User> {
    this.logger.info(`Get Me...`);

    const user = await this.userModel.findById(me.id);
    if (!user) throw new NotFoundException("User not found");

    return user;
  }

  async refresh(oldRefreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    this.logger.info(`Refreshing token...`);

    const { id, username, email, roles }: JwtPayload = this.jwtService.verify(oldRefreshToken, {
      secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
    });

    const savedToken: string | null = await this.redisService.get(`refreshToken:${id}`);
    if (!savedToken || savedToken !== oldRefreshToken)
      throw new NotFoundException("Token not found");

    const payload: JwtPayload = {
      id,
      username,
      email,
      roles,
    };

    const { accessToken, refreshToken } = await this.generateTokens(payload);
    return { accessToken, refreshToken };
  }

  async logout(refreshToken: string): Promise<void> {
    this.logger.info(`Logging out user...`);
    this.logger.debug(`refreshToken: ${refreshToken}`);
    const { id }: JwtPayload = this.jwtService.verify(refreshToken, {
      secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
    });

    await this.redisService.delete(`refreshToken:${id}`);
  }
}
