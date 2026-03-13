import {
    Model,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from "sequelize";
import { sequelize } from "../config/database";
import { Role } from "./roleModel";

export class User extends Model<
    InferAttributes<User>,
    InferCreationAttributes<User>
> {
    declare id: CreationOptional<number>;
    declare username: string;
    declare name: string;
    declare surname: string;
    declare email: string;
    declare password: string;
    declare readonly createdAt: CreationOptional<Date>;
    declare readonly updatedAt: CreationOptional<Date>;

    declare getRoles: () => Promise<Role[]>;

    toJSON(): Record<string, unknown> {
        const data = this.get() as Record<string, unknown>;
        const { password: _, Roles, roles, ...rest } = data;

        // Only returns the roles as strings (roleName)
        const roleArray = (Roles ?? roles) as
            | { roleName?: string }[]
            | undefined;
        const roleNames = Array.isArray(roleArray)
            ? roleArray.map(r => r.roleName ?? "").filter(Boolean)
            : undefined;

        return roleNames ? { ...rest, roles: roleNames } : rest;
    }
}

User.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        username: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        surname: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            field: "created_at",
        },
        updatedAt: {
            type: DataTypes.DATE,
            field: "updated_at",
        },
    },
    {
        sequelize,
        modelName: "User",
        tableName: "users",
        underscored: true,
        timestamps: true,
    }
);
