# Guide d'Utilisation - Système de Gestion de Bibliothèque EduSync

## 📚 Vue d'ensemble

Le système de gestion de bibliothèque EduSync est une solution complète pour gérer les livres, auteurs, catégories et emprunts dans un environnement scolaire.

## 🚀 Démarrage Rapide

### Accès au Système
1. Connectez-vous à EduSync avec vos identifiants
2. Naviguez vers la section "Bibliothèque" depuis le menu principal
3. Le tableau de bord vous donnera un aperçu des statistiques principales

### Interface Principale
- **Navigation latérale** : Accès rapide aux différentes sections
- **Actions rapides** : Boutons pour les tâches fréquentes
- **Raccourcis clavier** : Navigation efficace avec le clavier

## 📖 Fonctionnalités Principales

### 1. Gestion des Livres

#### Ajouter un Nouveau Livre
1. Cliquez sur "Ajouter un livre" ou utilisez `Ctrl + N`
2. Remplissez les informations obligatoires :
   - Titre du livre
   - ISBN
   - Nombre d'exemplaires
3. Sélectionnez les auteurs et catégories
4. Ajoutez une description (optionnel)
5. Cliquez sur "Ajouter le livre"

#### Rechercher des Livres
- Utilisez la barre de recherche pour chercher par titre, auteur ou ISBN
- Filtrez par catégorie, auteur ou état
- Utilisez la pagination pour naviguer dans les résultats

#### Modifier un Livre
1. Dans la liste des livres, cliquez sur l'icône "Modifier"
2. Modifiez les informations nécessaires
3. Sauvegardez les changements

#### Voir les Détails d'un Livre
- Cliquez sur l'icône "Voir" pour afficher tous les détails
- Consultez l'historique des emprunts
- Vérifiez la disponibilité des exemplaires

### 2. Gestion des Emprunts

#### Enregistrer un Nouvel Emprunt
1. Sélectionnez "Nouvel emprunt" ou cliquez sur "Emprunter" depuis un livre
2. Choisissez le livre (si pas déjà sélectionné)
3. Entrez le nom de l'étudiant
4. Définissez la date de retour prévue
5. Confirmez l'emprunt

#### Retour de Livre
1. Dans la liste des emprunts, trouvez l'emprunt actif
2. Cliquez sur "Retourner"
3. Confirmez le retour

#### Suivre les Retards
- Les emprunts en retard sont automatiquement signalés
- Utilisez les filtres pour voir uniquement les livres en retard
- Statistiques des retards disponibles sur le tableau de bord

### 3. Gestion des Auteurs et Catégories

#### Ajouter un Auteur
1. Cliquez sur "Ajouter un auteur"
2. Entrez le nom de l'auteur
3. Ajoutez une biographie (optionnel)
4. Sauvegardez

#### Ajouter une Catégorie
1. Cliquez sur "Ajouter une catégorie"
2. Entrez le nom de la catégorie
3. Sauvegardez

## ⌨️ Raccourcis Clavier

| Raccourci | Action |
|-----------|---------|
| `Ctrl + K` | Aller à la recherche de livres |
| `Ctrl + N` | Nouveau livre |
| `Ctrl + B` | Aller aux emprunts |
| `Ctrl + H` | Retour au tableau de bord |

## 📊 Tableau de Bord

### Statistiques Disponibles
- **Total des livres** : Nombre total de livres dans la bibliothèque
- **Emprunts actifs** : Nombre de livres actuellement empruntés
- **Livres en retard** : Nombre d'emprunts dépassant la date de retour
- **Total des auteurs** : Nombre d'auteurs enregistrés
- **Total des catégories** : Nombre de catégories disponibles

### Actions Rapides
- Gérer les livres
- Emprunts & retours
- Gérer les auteurs
- Catégories
- Recherche avancée
- Rapports

## 🔍 Recherche et Filtres

### Recherche de Livres
- **Recherche textuelle** : Par titre, auteur, ISBN
- **Filtres par catégorie** : Sélection multiple possible
- **Filtres par auteur** : Sélection multiple possible
- **État des livres** : Disponible, emprunté, tous

### Recherche d'Emprunts
- **Par nom d'étudiant** : Recherche textuelle
- **Par titre de livre** : Recherche textuelle
- **Par état** : En cours, retournés, en retard

## 📱 Interface Responsive

Le système s'adapte automatiquement à différentes tailles d'écran :
- **Desktop** : Interface complète avec navigation latérale
- **Tablet** : Navigation adaptée
- **Mobile** : Interface optimisée pour les écrans tactiles

## 🔧 Fonctionnalités Avancées

### Pagination
- Navigation par pages pour les grandes listes
- Nombre d'éléments par page configurable
- Indicateurs de position dans les résultats

### Validation des Données
- Vérification automatique des champs requis
- Validation des formats (ISBN, dates)
- Messages d'erreur informatifs

### Gestion d'État
- Mise à jour automatique des listes après modifications
- Synchronisation en temps réel avec la base de données
- Gestion des erreurs de connexion

## 🚨 Gestion des Erreurs

### Erreurs Communes
1. **Connexion perdue** : Vérifiez votre connexion réseau
2. **Session expirée** : Reconnectez-vous à EduSync
3. **Livre non trouvé** : Le livre a peut-être été supprimé
4. **Emprunt impossible** : Vérifiez la disponibilité du livre

### Solutions
- Actualisez la page si les données ne se chargent pas
- Vérifiez les logs de la console pour les erreurs techniques
- Contactez l'administrateur en cas de problème persistant

## 📋 Bonnes Pratiques

### Saisie des Données
- Utilisez des ISBN valides pour faciliter l'identification
- Renseignez toujours les auteurs et catégories
- Ajoutez des descriptions détaillées pour les livres

### Gestion des Emprunts
- Définissez des dates de retour réalistes (recommandé : 14 jours)
- Suivez régulièrement les emprunts en retard
- Mettez à jour rapidement les retours

### Maintenance
- Vérifiez régulièrement les statistiques du tableau de bord
- Nettoyez les données obsolètes
- Sauvegardez régulièrement la base de données

## 🔒 Sécurité et Permissions

### Authentification
- Connexion requise via le système EduSync
- Session sécurisée avec timeout automatique
- Validation des permissions pour chaque action

### Audit
- Toutes les actions sont enregistrées
- Historique complet des emprunts
- Traçabilité des modifications

## 🆘 Support et Aide

### En Cas de Problème
1. Consultez d'abord ce guide
2. Vérifiez le fichier TROUBLESHOOTING.md
3. Contactez l'administrateur système
4. Signalez les bugs avec des détails précis

### Informations Techniques
- **Version** : EduSync Library Management v1.0
- **Technologie** : React + Odoo Backend
- **Compatibilité** : Navigateurs modernes
- **Support** : Chrome, Firefox, Safari, Edge

---

*Ce guide est mis à jour régulièrement. Consultez la version la plus récente sur le système.* 