# Portail Parent - EduSync

## Vue d'ensemble

Le portail parent d'EduSync est une interface complète permettant aux parents de suivre la scolarité de leurs enfants en temps réel. Il a été développé avec React et Material-UI pour une expérience utilisateur moderne et intuitive.

## Fonctionnalités Principales

### 🔐 Authentification
- **Connexion sécurisée** avec email et mot de passe
- **Gestion de session** automatique
- **Interface de connexion moderne** avec gradient de fond subtil
- **Mot de passe par défaut** : `parent123` (modifiable dans les paramètres)

### 📊 Tableau de Bord
- **Vue d'ensemble** des performances de l'enfant
- **Cartes statistiques** : Notes récentes, taux de présence, frais restants, cours du jour
- **Activités récentes** avec timeline
- **Cours d'aujourd'hui** avec détails enseignant
- **Sélecteur d'enfant** pour les parents ayant plusieurs enfants

### 📝 Notes et Évaluations
- **Affichage détaillé des notes** par matière et période
- **Graphiques de progression** avec tendances
- **Filtrage par période** et matière
- **Moyennes par trimestre** avec comparaison classe
- **Détails des évaluations** (contrôles, examens, devoirs)
- **Commentaires des enseignants**

### 📅 Suivi des Présences
- **Calendrier de présence** avec visualisation mensuelle
- **Statistiques détaillées** : présent, absent, retard, justifié
- **Graphiques de tendance** sur l'assiduité
- **Détail par jour** avec horaires et motifs
- **Alertes d'absence** non justifiées

### 🕐 Emploi du Temps
- **Vue hebdomadaire** complète
- **Filtrage par jour** de la semaine
- **Informations détaillées** : matière, enseignant, salle, horaires
- **Codes couleur** par matière
- **Navigation fluide** entre les semaines

### 💰 Frais Scolaires
- **Suivi des paiements** en temps réel
- **Historique des transactions** détaillé
- **Frais en attente** avec dates d'échéance
- **Statuts de paiement** : payé, en attente, en retard
- **Détails par type** : scolarité, cantine, transport, etc.
- **Alertes de paiement** automatiques

### 💬 Messagerie
- **Communication directe** avec les enseignants
- **Boîte de réception** et messages envoyés
- **Composition de messages** avec niveaux de priorité
- **Gestion des pièces jointes**
- **Filtrage par enseignant** et recherche
- **Notifications** de nouveaux messages
- **Système de favoris** et marquage lu/non lu

### 📋 Rapports et Bulletins
- **Bulletins scolaires** par trimestre
- **Rapports disciplinaires** détaillés
- **Rapports d'évaluation** personnalisés
- **Téléchargement PDF** des documents
- **Visualisation complète** avec détails par matière
- **Commentaires du conseil de classe**
- **Historique complet** des rapports

### ⚙️ Paramètres
- **Gestion du profil parent**
- **Changement de mot de passe**
- **Préférences de notification**
- **Informations de contact**

## Architecture Technique

### Composants Principaux

1. **ParentPortal.jsx** - Composant racine avec gestion d'authentification
2. **ParentLogin.jsx** - Interface de connexion moderne
3. **ParentDashboard.jsx** - Tableau de bord principal avec navigation
4. **StudentGrades.jsx** - Gestion des notes et évaluations
5. **StudentAttendance.jsx** - Suivi des présences
6. **StudentTimetable.jsx** - Emploi du temps
7. **StudentFees.jsx** - Gestion des frais scolaires
8. **StudentMessages.jsx** - Système de messagerie
9. **StudentReports.jsx** - Rapports et bulletins
10. **ParentSettings.jsx** - Paramètres utilisateur

### API et Services

**ParentAPI.js** - Service API complet avec méthodes pour :
- Authentification et gestion de session
- Récupération des données enfants
- Gestion des notes, présences, emploi du temps
- Système de messagerie
- Téléchargement de rapports
- Gestion des frais et paiements

### Technologies Utilisées

- **React 18** - Framework JavaScript
- **Material-UI (MUI)** - Bibliothèque de composants UI
- **Material Icons** - Icônes cohérentes
- **Fetch API** - Communication avec le backend
- **CSS-in-JS** - Styling avec MUI System
- **Responsive Design** - Compatible mobile et desktop

## Installation et Configuration

### Prérequis
- Node.js 16+
- NPM ou Yarn
- Serveur Odoo configuré

### Installation
```bash
cd custom_addons/school_management/static/frontend1/edusync
npm install
npm run build
```

### Configuration API
Modifier l'URL de base dans `ParentAPI.js` :
```javascript
const API_BASE_URL = 'http://votre-serveur:8069';
```

## Utilisation

### Connexion Parent
1. Accéder à l'URL du portail parent
2. Saisir email et mot de passe (défaut: `parent123`)
3. Cliquer sur "Se connecter"

### Navigation
- **Onglets principaux** en haut de l'interface
- **Sélecteur d'enfant** dans l'en-tête (si plusieurs enfants)
- **Menu utilisateur** avec déconnexion
- **Notifications** avec badge de compteur

### Fonctionnalités Avancées
- **Recherche globale** dans les messages
- **Filtres dynamiques** pour toutes les données
- **Export PDF** des rapports
- **Mode responsive** pour mobile
- **Thème cohérent** avec couleurs de l'école

## Sécurité

- **Sessions sécurisées** avec cookies HTTP
- **Validation côté client** et serveur
- **Gestion d'erreurs** robuste
- **Déconnexion automatique** en cas d'inactivité
- **Protection CSRF** intégrée

## Personnalisation

### Couleurs
Le thème principal utilise :
- **Bleu foncé** : `#00008B` (couleur principale)
- **Arrière-plan** : Gradient bleu très clair vers blanc
- **Couleurs d'état** : Vert (succès), Orange (attention), Rouge (erreur)

### Responsive Design
- **Desktop** : Layout complet avec sidebar
- **Tablet** : Navigation adaptée
- **Mobile** : Interface optimisée avec menu hamburger

## Support et Maintenance

### Logs et Débogage
- Console JavaScript pour les erreurs frontend
- Logs API détaillés côté serveur
- Messages d'erreur utilisateur conviviaux

### Performance
- **Lazy loading** des composants
- **Pagination** des listes longues
- **Cache intelligent** des données
- **Optimisation des requêtes** API

## Évolutions Futures

### Fonctionnalités Prévues
- **Notifications push** en temps réel
- **Chat en direct** avec les enseignants
- **Calendrier interactif** avec événements
- **Photos et vidéos** de la vie scolaire
- **Application mobile** native
- **Mode hors ligne** basique

### Intégrations
- **Systèmes de paiement** en ligne
- **Services de transport** scolaire
- **Plateformes d'apprentissage** en ligne
- **Réseaux sociaux** éducatifs

---

*Développé avec ❤️ pour EduSync - Système de Gestion Scolaire* 