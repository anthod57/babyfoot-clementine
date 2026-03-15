# Babyfoot Clémentine

Application de gestion de tournois de baby-foot dans le cadre du test technique. Réalisé avec nodejs/express, vue3/tailwind et mysql en db.

## Lancement en une commande (Docker)

Lancer cette commande à la racine pour faire tourner l'application (front + back + base de données) :

```bash
docker compose up --build
```

Au premier lancement, la base est initialisée automatiquement avec des données de tests (le seeding peut prendre 1-2 minutes).

- **Application** : http://localhost:3000
- **Admin** : admin@babyfoot.local / Password123!

# Tests

Des tests automatiques ont été réalisés dans le back, ils peuvent être lancer avec un 

```npm test
```
