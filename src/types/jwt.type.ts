import { Role } from "./role.type";

export interface UserPayload {
  id: string;
  username: string;
  email: string;
  roles: Role[];
}
