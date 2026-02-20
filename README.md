# 🌍 Afrik-AI - Plateforme d'Agents IA pour l'Afrique

## 🎯 Présentation
Afrik-AI est une plateforme d'agents intelligents conçue spécifiquement pour répondre aux besoins du marché africain. Elle intègre des agents spécialisés en commerce et finance, avec une compréhension des langues locales et des moyens de paiement africains.

## ✨ Fonctionnalités

### 🤖 Agents IA
- **KAYADE Pro** : Agent commercial pour la gestion des ventes, stocks et commandes
- **AFRIK-Finance** : Agent financier pour la gestion de comptes, budgets et épargnes

### 🌍 Adapté à l'Afrique
- Support des langues locales (Wolof, Peul, Haoussa, Yoruba, Igbo)
- Intégration des moyens de paiement mobile (Orange Money, MTN, Airtel)
- Gestion des devises locales (FCFA, Franc congolais, Franc guinéen)
- Adaptation aux réalités du marché (tontines, coopératives)

### 💻 Interface
- Application de bureau moderne (Electron)
- Interface intuitive et responsive
- Tableaux de bord en temps réel
- Chat interactif avec les agents
- Export de données (CSV, PDF)

## 🚀 Installation

### Prérequis
- Node.js 18+
- SQLite 3
- Git

### Étapes
```bash
# Cloner le projet
git clone https://github.com/votre-repo/afrik-ai.git
cd afrik-ai

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos clés API

# Initialiser la base de données
npm run db:migrate
npm run db:seed

# Lancer l'application
npm run dev