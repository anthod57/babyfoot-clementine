import { Role } from "./roleModel";
import { User } from "./userModel";
import { UserRole } from "./userRoleModel";
import { Tournament } from "./tournamentModel";
import { Team } from "./teamModel";
import { TeamTournamentParticipation } from "./teamTournamentParticipationModel";
import { TeamHasUser } from "./teamHasUserModel";
import { Match } from "./matchModel";

User.belongsToMany(Role, { through: UserRole, foreignKey: "userId" });
Role.belongsToMany(User, { through: UserRole, foreignKey: "roleId" });

User.belongsToMany(Team, { through: TeamHasUser, foreignKey: "userId" });
Team.belongsToMany(User, { through: TeamHasUser, foreignKey: "teamId", as: "users" });

Team.belongsToMany(Tournament, {
    through: TeamTournamentParticipation,
    foreignKey: "teamId",
    as: "tournaments",
});
Tournament.belongsToMany(Team, {
    through: TeamTournamentParticipation,
    foreignKey: "tournamentId",
    as: "teams",
});

Match.belongsTo(Tournament, { foreignKey: "tournamentId" });
Match.belongsTo(Team, { foreignKey: "homeTeamId", as: "homeTeam" });
Match.belongsTo(Team, { foreignKey: "awayTeamId", as: "awayTeam" });
Tournament.hasMany(Match, { foreignKey: "tournamentId" });
Team.hasMany(Match, { foreignKey: "homeTeamId" });
Team.hasMany(Match, { foreignKey: "awayTeamId" });

export { User, Role, UserRole, Tournament, Team, TeamTournamentParticipation, TeamHasUser, Match };
