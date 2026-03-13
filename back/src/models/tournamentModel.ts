import {
    Model,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from "sequelize";
import { sequelize } from "../config/database";

export class Tournament extends Model<
    InferAttributes<Tournament>,
    InferCreationAttributes<Tournament>
> {
    declare id: CreationOptional<number>;
    declare name: string;
    declare description: string | null;
    declare startDate: Date;
    declare endDate: Date;
    declare readonly createdAt: CreationOptional<Date>;
    declare readonly updatedAt: CreationOptional<Date>;
}

Tournament.init(
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
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        startDate: {
            type: DataTypes.DATE,
            allowNull: false,
            field: "start_date",
        },
        endDate: {
            type: DataTypes.DATE,
            allowNull: false,
            field: "end_date",
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
        modelName: "Tournament",
        tableName: "tournaments",
        underscored: true,
        timestamps: true,
    },
);
