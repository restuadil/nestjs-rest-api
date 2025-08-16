import { createParamDecorator, ExecutionContext } from "@nestjs/common";

import { AuthRequest } from "src/types/web.type";

export const Cookie = createParamDecorator((key: "refreshToken" | "exp", ctx: ExecutionContext) => {
  const request: AuthRequest = ctx.switchToHttp().getRequest();
  return key ? request.cookies?.[key] : request.cookies;
});
