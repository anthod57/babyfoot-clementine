import {
    Model,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from "sequelize";
import { sequelize } from "../config/database";

export class UserRole extends Model<
    InferAttributes<UserRole>,
    InferCreationAttributes<UserRole>
> {
    declare userId: number;
    declare roleId: number;
    declare readonly createdAt: CreationOptional<Date>;
    declare readonly updatedAt: CreationOptional<Date>;
}

UserRole.init(
    {
        userId: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            allowNull: false,
            field: "user_id",
            references: { model: "users", key: "id" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        roleId: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            allowNull: false,
            field: "role_id",
            references: { model: "roles", key: "id" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
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
        modelName: "UserRole",
        tableName: "user_has_role",
        underscored: true,
        timestamps: true,
    }
);
