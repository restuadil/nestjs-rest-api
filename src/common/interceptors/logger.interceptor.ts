import { CallHandler, ExecutionContext, Inject, NestInterceptor } from "@nestjs/common";

import { Request } from "express";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Observable, tap } from "rxjs";
import { Logger } from "winston";

export class LoggerInterceptor implements NestInterceptor {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const now = Date.now();
    this.logger.info(`Request received`);
    return next.handle().pipe(
      tap(() => {
        this.logger.info(`Request finished: ${(Date.now() - now) / 1000} seconds`);
      }),
    );
  }
}
