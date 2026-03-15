export interface NavLink {
    label: string;
    to: string;
}

export const navLinks: NavLink[] = [
    { label: "Accueil", to: "/" },
    { label: "Matchs", to: "/matchs" },
    { label: "Classement", to: "/ranking" },
    { label: "Équipes", to: "/teams" },
];
