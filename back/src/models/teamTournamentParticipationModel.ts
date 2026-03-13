import {
    Model,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from "sequelize";
import { sequelize } from "../config/database";

export class TeamTournamentParticipation extends Model<
    InferAttributes<TeamTournamentParticipation>,
    InferCreationAttributes<TeamTournamentParticipation>
> {
    declare teamId: number;
    declare tournamentId: number;
    declare readonly createdAt: CreationOptional<Date>;
}

TeamTournamentParticipation.init(
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
        tournamentId: {
            type: DataTypes.INTEGER.UNSIGNED,
            primaryKey: true,
            allowNull: false,
            field: "tournament_id",
            references: { model: "tournaments", key: "id" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        createdAt: {
            type: DataTypes.DATE,
            field: "created_at",
        },
    },
    {
        sequelize,
        modelName: "TeamTournamentParticipation",
        tableName: "team_tournament_participations",
        underscored: true,
        timestamps: true,
        updatedAt: false,
    },
);
