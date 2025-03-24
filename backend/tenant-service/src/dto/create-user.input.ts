import { UserRole } from "../entity/user.entity";

export class CreateUserInput {
  name: string;
  email: string;
  password?: string;
  role?: UserRole;
  tenantId: number;
}
