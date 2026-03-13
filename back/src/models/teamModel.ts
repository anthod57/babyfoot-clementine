import {
    Model,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from "sequelize";
import { sequelize } from "../config/database";

export class Team extends Model<
    InferAttributes<Team>,
    InferCreationAttributes<Team>
> {
    declare id: CreationOptional<number>;
    declare name: string;
    declare readonly createdAt: CreationOptional<Date>;
    declare readonly updatedAt: CreationOptional<Date>;
}

Team.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
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
        modelName: "Team",
        tableName: "teams",
        underscored: true,
        timestamps: true,
    },
);
