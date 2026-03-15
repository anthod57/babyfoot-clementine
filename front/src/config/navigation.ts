/** Header nav item. */
export interface NavLink {
    label: string;
    to: string;
}

export const navLinks: NavLink[] = [
    { label: "Accueil", to: "/" },
    { label: "Tournois", to: "/tournaments" },
];
