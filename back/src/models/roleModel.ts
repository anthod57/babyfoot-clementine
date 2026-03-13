import {
    Model,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from "sequelize";
import { sequelize } from "../config/database";

export class Role extends Model<
    InferAttributes<Role>,
    InferCreationAttributes<Role>
> {
    declare id: CreationOptional<number>;
    declare roleName: string;
    declare readonly createdAt: CreationOptional<Date>;
    declare readonly updatedAt: CreationOptional<Date>;
}

Role.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        roleName: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            field: "role_name",
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
        modelName: "Role",
        tableName: "roles",
        underscored: true,
        timestamps: true,
    },
);
