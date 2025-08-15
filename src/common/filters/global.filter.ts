import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import { NotFoundException } from "@nestjs/common";
import { JsonWebTokenError, TokenExpiredError } from "@nestjs/jwt";

import { Request, Response } from "express";
import { MongooseError } from "mongoose";
import { ZodError } from "zod";

@Catch(HttpException, ZodError, MongooseError, TokenExpiredError)
export class GlobalFilter implements ExceptionFilter {
  catch(
    exception: HttpException | ZodError | MongooseError | TokenExpiredError,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const timestamp = new Date().toISOString();
    const path = request.url;

    if (exception instanceof ZodError) {
      return response.status(400).json({
        statusCode: 400,
        status: false,
        data: null,
        error: "Validation Error",
        message: Array.isArray(exception.issues)
          ? exception.issues.map((err) => err.message).join(", ")
          : exception.message,
        timestamp,
        path,
      });
    }

    if (exception instanceof TokenExpiredError) {
      return response.status(401).json({
        statusCode: 401,
        status: false,
        data: null,
        error: "Token Expired",
        message: exception.message,
        timestamp,
        path,
      });
    }

    if (exception instanceof JsonWebTokenError) {
      return response.status(401).json({
        statusCode: 401,
        status: false,
        data: null,
        error: "Unauthorized",
        message: exception.message,
        timestamp,
        path,
      });
    }

    if (exception instanceof MongooseError) {
      return response.status(500).json({
        statusCode: 500,
        status: false,
        data: null,
        error: "Database Error",
        message: exception.message,
        timestamp,
        path,
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const responseData = exception.getResponse();

      let message: string;

      if (typeof responseData === "string") {
        message = responseData;
      } else if (typeof responseData === "object" && responseData !== null) {
        const responseObj = responseData as Record<string, unknown>;
        message = typeof responseObj.message === "string" ? responseObj.message : exception.message;
      } else {
        message = exception.message;
      }

      if (exception instanceof NotFoundException) {
        if (message === `Cannot ${request.method} ${request.url}` || message === undefined) {
          message = "Route not found";
        }
      }

      return response.status(status).json({
        statusCode: status,
        status: false,
        data: null,
        error: exception.name,
        message,
        timestamp,
        path,
      });
    }

    return response.status(500).json({
      statusCode: 500,
      status: false,
      data: null,
      error: "Internal Server Error",
      message: "Internal Server Error",
      timestamp,
      path,
    });
  }
}
