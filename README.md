# 🎯 Quarto Frontend

Un client web moderne pour le jeu de stratégie **Quarto**, développé avec React, TypeScript et Vite. Cette application offre une expérience de jeu complète avec modes solo et multijoueur en temps réel.

![React](https://img.shields.io/badge/React-19.1.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)
![Vite](https://img.shields.io/badge/Vite-5.4.0-646CFF.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

## 📖 À propos du projet

Quarto est un jeu de stratégie où deux joueurs s'affrontent pour aligner 4 pièces partageant au moins une caractéristique commune (couleur, forme, taille ou remplissage). Cette application web moderne propose :

- **Mode Solo** : Affrontez une IA intelligente avec différents niveaux de difficulté
- **Mode Multijoueur** : Défiez d'autres joueurs en temps réel
- **Interface Intuitive** : Design moderne et responsive
- **Historique des parties** : Suivi complet des mouvements avec notation algébrique
- **Authentification** : Système de comptes utilisateurs sécurisé

## ✨ Fonctionnalités

### 🎮 Modes de jeu

- **Solo vs IA** : Intelligence artificielle avec profondeur de recherche configurable (1-16 niveaux)
- **Multijoueur en ligne** : Parties en temps réel avec WebSocket
- **Défis** : Système de défis entre joueurs

### 🔧 Fonctionnalités techniques

- **Interface moderne** : Conçue avec React 19 et TypeScript
- **Temps réel** : Communication WebSocket pour le multijoueur
- **Notation algébrique** : Historique des parties au format standard
- **API REST** : Intégration complète avec le backend
- **Responsive Design** : Optimisé pour tous les appareils

### 🛡️ Sécurité et authentification

- Système d'authentification JWT
- Protection des routes sensibles
- Gestion sécurisée des sessions

## 🚀 Démarrage rapide

### Prérequis

- Node.js (version 18+)
- npm ou yarn
- Backend Quarto en cours d'exécution (voir [quarto-backend](https://github.com/Affell/quarto-backend))

### Installation

1. **Cloner le repository**

   ```bash
   git clone https://github.com/Affell/quarto-frontend.git
   cd quarto-frontend
   ```

2. **Installer les dépendances**

   ```bash
   npm install
   ```

3. **Configurer l'environnement**

   ```bash
   cp .env.example .env
   ```

   Modifiez le fichier `.env` avec l'URL de votre backend :

   ```
   VITE_API_BASE_URL=http://localhost:5000
   ```

4. **Lancer l'application**
   ```bash
   npm run dev
   ```

L'application sera accessible sur `http://localhost:5173`

## 🐳 Déploiement avec Docker

### Construction de l'image

```bash
docker build -t quarto-frontend .
```

### Exécution du conteneur

```bash
docker run -p 80:80 quarto-frontend
```

### Avec Docker Compose

```yaml
version: "3.8"
services:
  frontend:
    build: .
    ports:
      - "80:80"
    environment:
      - VITE_API_BASE_URL=http://backend:5000
```

## 🏗️ Architecture

### Structure du projet

```
src/
├── components/          # Composants React
│   ├── Auth.tsx        # Authentification
│   ├── Dashboard.tsx   # Tableau de bord
│   ├── Game.tsx        # Interface de jeu multijoueur
│   ├── QuartoGame.tsx  # Interface de jeu solo
│   └── ...
├── contexts/           # Contextes React
│   └── AuthContext.tsx # Gestion de l'authentification
├── hooks/              # Hooks personnalisés
│   └── useWebSocket.ts # Hook WebSocket
├── services/           # Services API
│   └── backendAPI.ts   # Client API REST
├── types/              # Définitions TypeScript
│   ├── api.ts         # Types API
│   └── quarto.ts      # Types du jeu
└── utils/              # Utilitaires
    ├── gameLogic.ts   # Logique de jeu
    ├── notation.ts    # Notation algébrique
    └── api.ts         # Utilitaires API
```

### Technologies utilisées

- **Frontend** : React 19, TypeScript, React Router
- **Build Tool** : Vite
- **Styling** : CSS modules
- **Communication** : REST API + WebSocket
- **Deployment** : Docker + Nginx

## 🎯 Règles du Quarto

Le Quarto est un jeu de stratégie pour 2 joueurs :

1. **Plateau** : Grille 4x4
2. **Pièces** : 16 pièces uniques avec 4 caractéristiques :

   - Couleur : Blanc/Noir
   - Forme : Carré/Rond
   - Taille : Grand/Petit
   - Remplissage : Plein/Troué

3. **Objectif** : Aligner 4 pièces partageant au moins une caractéristique
4. **Particularité** : C'est l'adversaire qui choisit la pièce à placer !

## 📚 Scripts disponibles

- `npm run dev` : Lance le serveur de développement
- `npm run build` : Compile l'application pour la production
- `npm run preview` : Prévisualise la version de production
- `npm run lint` : Analyse le code avec ESLint

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créez votre branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Committez vos changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrez une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🔗 Liens utiles

- [Backend Quarto](https://github.com/Affell/quarto-backend) - API REST et WebSocket
- [Règles du Quarto](<https://fr.wikipedia.org/wiki/Quarto_(jeu)>) - Règles officielles
- [React Documentation](https://react.dev/) - Documentation React
- [TypeScript](https://www.typescriptlang.org/) - Documentation TypeScript

---

**Développé avec ❤️ par [Affell](https://github.com/Affell)**
