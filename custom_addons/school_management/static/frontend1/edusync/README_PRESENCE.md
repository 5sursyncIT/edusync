# Système de Gestion des Présences - EDUSYNC

## Vue d'ensemble

Le système de gestion des présences d'EDUSYNC permet aux enseignants et administrateurs d'enregistrer et de suivre la présence des étudiants de manière efficace et moderne.

## Fonctionnalités principales

### 1. Registre de Présence (`AttendanceRegister`)

**Accès :** Menu → Présences → Registre de présence  
**URL :** `/attendance/register`

#### Fonctionnalités :
- **Sélection de session** : Choisir la date et la session de cours
- **Liste des étudiants** : Affichage de tous les étudiants inscrits à la session
- **Marquage présence/absence** : Interface simple avec switch on/off
- **Remarques** : Ajout de commentaires pour chaque étudiant
- **Actions en masse** :
  - Marquer tous présents
  - Marquer tous absents
  - Actualiser les données
- **Sauvegarde** :
  - Sauvegarde rapide individuelle
  - Sauvegarde en masse
- **Statistiques en temps réel** :
  - Nombre total d'étudiants
  - Nombre de présents/absents
  - Taux de présence avec barre de progression

#### Comment utiliser :
1. Sélectionner la date du cours
2. Choisir la session dans la liste déroulante
3. Marquer la présence/absence pour chaque étudiant
4. Ajouter des remarques si nécessaire
5. Sauvegarder individuellement ou en masse

### 2. Rapports de Présence (`AttendanceReports`)

**Accès :** Menu → Présences → Rapports de présence  
**URL :** `/attendance/reports`

#### Types de rapports :
1. **Synthèse** : Vue d'ensemble des statistiques
2. **Par Étudiant** : Détail des présences par étudiant
3. **Par Matière** : Analyse par matière/cours
4. **Détaillé** : Liste complète des enregistrements

#### Filtres disponibles :
- **Période** : Date de début et fin
- **Promotion** : Filtrer par classe/promotion
- **Matière** : Filtrer par matière spécifique

#### Export de données :
- **Format CSV** : Pour tableur (Excel, LibreOffice)
- **Format Excel** : Fichier .xlsx natif

## Architecture technique

### Hooks utilisés

Le système utilise plusieurs hooks React personnalisés :

#### `useAttendances(filters, page, limit)`
- Récupération des présences avec pagination
- Filtres et tri
- Gestion d'état loading/error

#### `useAttendanceReports(reportType, filters)`
- Génération de rapports
- Types : 'summary', 'by_student', 'by_subject', 'detailed'

#### `useSessionAttendances(sessionId, date)`
- Présences d'une session spécifique
- Données temps réel

#### `useAttendanceActions()`
- Actions CRUD sur les présences
- Sauvegarde en masse
- Marquage rapide

#### `useAttendanceExport()`
- Export de données
- Formats multiples

### Composants

#### `AttendanceRegister`
- Interface de saisie
- Gestion d'état local
- Validations
- Feedback utilisateur

#### `AttendanceReports`
- Interface de rapports
- Onglets multiples
- Graphiques et tableaux
- Export de données

## Intégration dans l'application

### Routes configurées :
```
/attendance                    → AttendanceRegister
/attendance/register          → AttendanceRegister
/attendance/reports           → AttendanceReports
/dashboard/attendance/*       → Versions protégées
```

### Navigation :
```
Menu Sidebar → Présences
  ├── Registre de présence
  └── Rapports de présence
```

## API Backend requise

Le système nécessite que les endpoints suivants soient disponibles dans l'API Odoo :

```
GET /api/sessions                    # Liste des sessions
GET /api/attendances                 # Liste des présences
GET /api/attendance-reports          # Rapports
POST /api/attendances/bulk          # Sauvegarde en masse
PUT /api/attendances/:id            # Modification
DELETE /api/attendances/:id         # Suppression
GET /api/batches                    # Promotions
GET /api/subjects                   # Matières
```

## Utilisation quotidienne

### Pour un enseignant :
1. Se connecter à EDUSYNC
2. Aller dans "Présences" → "Registre de présence"
3. Sélectionner la date du jour
4. Choisir sa session de cours
5. Marquer les présences
6. Sauvegarder

### Pour un administrateur :
1. Consulter les rapports dans "Présences" → "Rapports"
2. Filtrer par période, promotion ou matière
3. Exporter les données si nécessaire
4. Analyser les taux de présence

## Support et maintenance

### Logs et débogage :
- Les actions sont loggées dans la console
- Messages d'erreur explicites
- États de chargement visuels

### Performance :
- Pagination automatique
- Mise en cache des données
- Chargement différé

### Accessibilité :
- Interface Material-UI
- Support clavier
- Responsive design
- Mode sombre compatible

## Améliorations futures

- Notifications automatiques d'absence
- Intégration avec messagerie SMS/Email
- Reconnaissance faciale (optionnel)
- Statistiques avancées et graphiques
- Export PDF des rapports
- Intégration calendrier 