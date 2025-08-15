import { Role } from "./role.type";

export interface JwtPayload {
  id: string;
  username: string;
  email: string;
  roles: Role[];
}
