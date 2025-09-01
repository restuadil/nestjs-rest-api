import {
  ExecutionContext,
  Injectable,
  ForbiddenException,
  HttpException,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";

import { UserPayload } from "src/types/jwt.type";
import { Role } from "src/types/role.type";

import { IS_PUBLIC_KEY } from "../decortators/public.decorator";
import { ROLES_KEY } from "../decortators/roles.decorator";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    return super.canActivate(context);
  }

  handleRequest<TUser = UserPayload>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      throw err instanceof HttpException ? err : new UnauthorizedException();
    }

    const requiredRoles =
      this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) || [];

    if (requiredRoles.length > 0) {
      const hasRole = requiredRoles.some((role) =>
        (user as UserPayload).roles?.includes(role as Role),
      );
      if (!hasRole) {
        throw new ForbiddenException("You do not have permission for this resource");
      }
    }

    return user as TUser;
  }
}
