# Babyfoot Clémentine

Application de gestion de tournois de baby-foot — test technique réalisé avec **Node.js / Express**, **Vue 3 / Tailwind CSS** et **MySQL / Sequelize**.

## Lancement en une commande (Docker)

À la racine du projet :

```bash
docker compose up --build
```

Au premier lancement, la base est initialisée automatiquement avec des données de tests (le seeding peut prendre 1-2 minutes).

- **Application** : http://localhost:3000
- **Compte admin** : `admin@babyfoot.local` / `Password123!`

## Fonctionnalités implémentées

| Exigence | Implémentation |
|----------|-----------------|
| 1. Création de tournois | Les admins créent des tournois (nom, dates, description) |
| 2. Inscription aux tournois | Gestion des équipes : ajout/retrait par tournoi |
| 3. Gestion des matchs | Bouton « Générer les matchs » : planification round-robin |
| 4. Suivi des résultats | Saisie des scores, classement et matrice des matchs en temps réel |
| 5. Interface | Vue 3, Tailwind, routing protégé (accès admin) |
| 6. Backend | API REST Node.js/Express, MySQL, auth JWT |

## Tests

```bash
cd back && npm test
```
