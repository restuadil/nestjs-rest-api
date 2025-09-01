import { UserPayload } from "./jwt.type";

export interface ControllerResponse<T> {
  message: string;
  data: T | null;
  meta?: Meta | null;
}

export interface BaseResponse<T> extends ControllerResponse<T> {
  statusCode: number;
  status: boolean;
  error: string | null;
  timestamp: string;
  path: string;
}

export interface PaginationResponse<T> {
  data: T[];
  meta: Meta;
}

export interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextPage?: number;
  prevPage?: number;
}

export interface AuthRequest {
  cookies: Record<string, string>;
  user: UserPayload;
}
