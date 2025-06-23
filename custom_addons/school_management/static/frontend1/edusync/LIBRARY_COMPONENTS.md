# Composants de la Bibliothèque EduSync

## 📋 Vue d'ensemble

Ce document liste tous les composants développés pour le système de gestion de bibliothèque EduSync, leurs fonctionnalités et leurs interconnexions.

## 🏗️ Architecture des Composants

### Composant Principal
- **`LibraryMain.jsx`** - Composant racine qui orchestre toute l'application bibliothèque

### Composants de Navigation
- **`LibraryNavigation.jsx`** - Navigation latérale avec actions rapides et raccourcis clavier

### Composants d'Affichage
- **`LibraryDashboard.jsx`** - Tableau de bord avec statistiques et actions rapides
- **`BooksList.jsx`** - Liste des livres avec recherche, filtres et pagination
- **`BookDetails.jsx`** - Affichage détaillé d'un livre avec historique des emprunts
- **`BorrowingsList.jsx`** - Liste des emprunts avec gestion des retours

### Composants de Formulaire
- **`AddBookForm.jsx`** - Formulaire d'ajout de nouveau livre
- **`EditBookForm.jsx`** - Formulaire de modification de livre existant
- **`AddAuthorForm.jsx`** - Formulaire d'ajout d'auteur
- **`AddCategoryForm.jsx`** - Formulaire d'ajout de catégorie
- **`BorrowBookForm.jsx`** - Formulaire d'enregistrement d'emprunt

### Hook Personnalisé
- **`useLibrary.jsx`** - Hook pour les appels API et gestion d'état

## 📁 Structure des Fichiers

```
src/components/library/
├── LibraryMain.jsx              # Composant principal
├── LibraryNavigation.jsx        # Navigation
├── LibraryDashboard.jsx         # Tableau de bord
├── BooksList.jsx                # Liste des livres
├── BookDetails.jsx              # Détails d'un livre
├── BorrowingsList.jsx           # Liste des emprunts
├── AddBookForm.jsx              # Formulaire ajout livre
├── EditBookForm.jsx             # Formulaire modification livre
├── AddAuthorForm.jsx            # Formulaire ajout auteur
├── AddCategoryForm.jsx          # Formulaire ajout catégorie
└── BorrowBookForm.jsx           # Formulaire emprunt

src/hooks/
└── useLibrary.jsx               # Hook pour API bibliothèque
```

## 🔧 Détails des Composants

### LibraryMain.jsx
**Responsabilités:**
- Orchestration de l'application
- Gestion des vues et modaux
- Raccourcis clavier globaux
- Communication entre composants

**État géré:**
- Vue active (dashboard, books, borrowings, etc.)
- Modaux ouverts
- Livre sélectionné

**Raccourcis clavier:**
- `Ctrl + K` : Vue livres
- `Ctrl + N` : Nouveau livre
- `Ctrl + B` : Vue emprunts
- `Ctrl + H` : Tableau de bord

### LibraryNavigation.jsx
**Fonctionnalités:**
- Navigation entre sections
- Actions rapides avec icônes colorées
- Aide raccourcis clavier

**Sections disponibles:**
- Tableau de bord
- Livres
- Auteurs
- Catégories
- Emprunts

### LibraryDashboard.jsx
**Métriques affichées:**
- Total des livres
- Emprunts actifs
- Livres en retard
- Nombre d'auteurs
- Nombre de catégories

**Actions rapides:**
- Gestion des livres
- Emprunts & retours
- Gestion des auteurs
- Catégories
- Recherche avancée
- Rapports

### BooksList.jsx
**Fonctionnalités:**
- Recherche textuelle (titre, auteur, ISBN)
- Filtres par catégorie et auteur
- Filtres par état (disponible, emprunté)
- Pagination
- Actions par livre (voir, modifier, emprunter, supprimer)

**État géré:**
- Paramètres de recherche
- Liste des livres
- Pagination
- Auteurs et catégories pour filtres

### BookDetails.jsx
**Informations affichées:**
- Détails complets du livre
- Statut et disponibilité
- Liste des auteurs et catégories
- Historique des emprunts
- Unités disponibles

**Actions disponibles:**
- Modifier le livre
- Emprunter
- Retour à la liste

### BorrowingsList.jsx
**Fonctionnalités:**
- Liste de tous les emprunts
- Recherche par étudiant ou livre
- Filtres par état
- Gestion des retours
- Détection des retards
- Pagination

**États des emprunts:**
- En cours
- Retourné
- En retard

### AddBookForm.jsx
**Champs du formulaire:**
- Titre (requis)
- ISBN (requis)
- Édition
- Code interne
- Nombre d'exemplaires (requis)
- Description
- Sélection d'auteurs (multiple, requis)
- Sélection de catégories (multiple, requis)

**Validation:**
- Champs obligatoires
- Nombre d'exemplaires > 0
- Au moins un auteur
- Au moins une catégorie

### EditBookForm.jsx
**Fonctionnalités:**
- Pré-remplissage avec données existantes
- Mêmes validations que l'ajout
- Chargement asynchrone des données
- Mise à jour sans rechargement

### AddAuthorForm.jsx
**Champs:**
- Nom de l'auteur (requis)
- Biographie (optionnel)

**Interface:**
- Modal simple
- Validation en temps réel

### AddCategoryForm.jsx
**Champs:**
- Nom de la catégorie (requis)

**Interface:**
- Modal minimaliste
- Validation instantanée

### BorrowBookForm.jsx
**Fonctionnalités:**
- Sélection de livre (ou pré-sélectionné)
- Saisie du nom d'étudiant
- Date de retour avec défaut (+14 jours)
- Validation des dates
- Affichage des détails du livre sélectionné

## 🔗 Hook useLibrary.jsx

### Méthodes API disponibles:
```javascript
// Statistiques
getStatistics()

// Livres
getBooks(params)
getBookById(id)
createBook(data)
updateBook(id, data)
deleteBook(id)

// Auteurs
getAuthors()
createAuthor(data)

// Catégories
getCategories()
createCategory(data)

// Emprunts
getBorrowings(params)
borrowBook(data)
returnBook(id)
```

### État géré:
- `loading` : État de chargement global
- `error` : Erreurs d'API

## 🎨 Design System

### Couleurs utilisées:
- **Bleu** : Actions principales (livres)
- **Vert** : Actions de succès (emprunts, auteurs)
- **Rouge** : Alertes et suppressions
- **Orange** : Actions secondaires (catégories)
- **Violet** : Actions spécialisées

### Icônes (Lucide React):
- `BookOpen` : Livres et bibliothèque
- `User/Users` : Auteurs et étudiants
- `Tag` : Catégories
- `Calendar` : Dates
- `Clock` : Emprunts actifs
- `AlertTriangle` : Retards et erreurs
- `Search` : Recherche
- `Plus/PlusCircle` : Ajouts

### Layout:
- **Responsive** : Adaptation mobile/desktop
- **Grid System** : CSS Grid et Flexbox
- **Modals** : Overlays avec fond sombre
- **Cards** : Interface par cartes
- **Navigation** : Sidebar fixe sur desktop

## 🔄 Flux de Données

### Ajout de livre:
1. Utilisateur ouvre le formulaire
2. Chargement des auteurs/catégories
3. Saisie et validation
4. Appel API createBook()
5. Mise à jour de la liste
6. Fermeture du modal

### Emprunt de livre:
1. Sélection du livre (depuis liste ou détails)
2. Ouverture du formulaire d'emprunt
3. Saisie étudiant et date
4. Appel API borrowBook()
5. Mise à jour des statistiques
6. Notification de succès

### Retour de livre:
1. Localisation de l'emprunt
2. Clic sur "Retourner"
3. Appel API returnBook()
4. Mise à jour de la liste des emprunts
5. Mise à jour des statistiques

## 🧪 Fonctionnalités Testées

### Navigation:
✅ Changement de vues
✅ Raccourcis clavier
✅ Actions rapides

### Gestion des livres:
✅ Ajout avec validation
✅ Recherche et filtres
✅ Modification
✅ Suppression
✅ Affichage des détails

### Gestion des emprunts:
✅ Création d'emprunt
✅ Retour de livre
✅ Détection des retards
✅ Filtres par état

### Interface:
✅ Responsive design
✅ Messages d'erreur
✅ États de chargement
✅ Modals et overlays

## 🚀 Améliorations Futures

### Fonctionnalités à développer:
- Gestion complète des auteurs (liste, modification, suppression)
- Gestion complète des catégories (liste, modification, suppression)
- Système de réservations
- Notifications de rappel
- Historique détaillé des actions
- Export de données (PDF, Excel)
- Codes-barres et QR codes
- Système de notes et avis
- Gestion multi-bibliothèques

### Optimisations techniques:
- Mise en cache des données
- Pagination infinie
- Recherche en temps réel
- Offline support
- PWA (Progressive Web App)
- Tests automatisés

---

*Documentation maintenue à jour avec chaque nouvelle fonctionnalité.* 