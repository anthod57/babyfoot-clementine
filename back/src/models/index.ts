import { Role } from "./roleModel";
import { User } from "./userModel";
import { UserRole } from "./userRoleModel";
import { Tournament } from "./tournamentModel";
import { Team } from "./teamModel";
import { TeamTournamentParticipation } from "./teamTournamentParticipationModel";
import { TeamHasUser } from "./teamHasUserModel";

User.belongsToMany(Role, { through: UserRole, foreignKey: "userId" });
Role.belongsToMany(User, { through: UserRole, foreignKey: "roleId" });

User.belongsToMany(Team, { through: TeamHasUser, foreignKey: "userId" });
Team.belongsToMany(User, { through: TeamHasUser, foreignKey: "teamId" });

Team.belongsToMany(Tournament, {
    through: TeamTournamentParticipation,
    foreignKey: "teamId",
});
Tournament.belongsToMany(Team, {
    through: TeamTournamentParticipation,
    foreignKey: "tournamentId",
});

export { User, Role, UserRole, Tournament, Team, TeamTournamentParticipation, TeamHasUser };
