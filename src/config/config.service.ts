import { Injectable } from "@nestjs/common";
import { ConfigService as Config } from "@nestjs/config";

import { Env } from "./env";
@Injectable()
export class ConfigService extends Config<Env> {}
