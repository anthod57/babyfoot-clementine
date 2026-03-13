import {
    Model,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from "sequelize";
import { sequelize } from "../config/database";

export class TeamHasUser extends Model<
    InferAttributes<TeamHasUser>,
    InferCreationAttributes<TeamHasUser>
> {
    declare teamId: number;
    declare userId: number;
    declare readonly createdAt: CreationOptional<Date>;
    declare readonly updatedAt: CreationOptional<Date>;
}

TeamHasUser.init(
    {
        teamId: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            allowNull: false,
            field: "team_id",
            references: { model: "teams", key: "id" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        userId: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            allowNull: false,
            field: "user_id",
            references: { model: "users", key: "id" },
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
        modelName: "TeamHasUser",
        tableName: "team_has_user",
        underscored: true,
        timestamps: true,
    },
);
