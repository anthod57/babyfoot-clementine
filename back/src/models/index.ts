import { Role } from "./roleModel";
import { User } from "./userModel";
import { UserRole } from "./userRoleModel";

User.belongsToMany(Role, { through: UserRole, foreignKey: "userId" });
Role.belongsToMany(User, { through: UserRole, foreignKey: "roleId" });

export { User, Role, UserRole };
