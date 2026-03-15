import {
    Model,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
} from "sequelize";
import { sequelize } from "../config/database";

/**
 * Match result enum
 * 0 = Pending, 1 = Home team win, 2 = Away team win, 3 = Draw, 4 = In progress
 */
export enum MatchResult {
    PENDING = 0,
    HOME_TEAM_WIN = 1,
    AWAY_TEAM_WIN = 2,
    DRAW = 3,
    IN_PROGRESS = 4,
}

export class Match extends Model<
    InferAttributes<Match>,
    InferCreationAttributes<Match>
> {
    declare id: CreationOptional<number>;
    declare tournamentId: number;
    declare date: Date;
    declare homeTeamId: number;
    declare awayTeamId: number;
    declare homeScore: number;
    declare awayScore: number;
    /** 0 = Pending, 1 = Home team win, 2 = Away team win, 3 = Draw, 4 = In progress */
    declare result: MatchResult;
    declare readonly createdAt: CreationOptional<Date>;
    declare readonly updatedAt: CreationOptional<Date>;
}

Match.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        tournamentId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            field: "tournament_id",
            references: { model: "tournaments", key: "id" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        homeTeamId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            field: "home_team_id",
            references: { model: "teams", key: "id" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        awayTeamId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            field: "away_team_id",
            references: { model: "teams", key: "id" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        homeScore: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
            field: "home_score",
        },
        awayScore: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
            field: "away_score",
        },
        result: {
            type: DataTypes.TINYINT.UNSIGNED,
            allowNull: false,
            defaultValue: MatchResult.PENDING,
            validate: { min: 0, max: 4 },
            comment:
                "0=Pending, 1=HomeTeamWin, 2=AwayTeamWin, 3=Draw, 4=In progress",
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
        modelName: "Match",
        tableName: "matches",
        underscored: true,
        timestamps: true,
    }
);
