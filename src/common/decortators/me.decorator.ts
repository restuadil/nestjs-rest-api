import { createParamDecorator, ExecutionContext } from "@nestjs/common";

import { AuthRequest } from "src/types/web.type";

export const Me = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request: AuthRequest = ctx.switchToHttp().getRequest();
  return request.user;
});
