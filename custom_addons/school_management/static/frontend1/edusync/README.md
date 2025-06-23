# EduSync Frontend - Interface React pour Odoo School Management

## 🚀 Démarrage rapide

### Prérequis
- Node.js 16+ installé
- npm ou yarn
- Odoo 16+ avec le module `school_management` installé

### Installation

1. **Naviguez vers le dossier frontend :**
```bash
cd /opt/odoo/custom_addons/school_management/static/frontend1/edusync
```

2. **Installez les dépendances :**
```bash
npm install
```

3. **Démarrez le serveur de développement :**
```bash
npm start
# ou
npm run dev
```

4. **Ouvrez votre navigateur :**
```
http://localhost:5173
```

## 📁 Structure du projet

```
src/
├── components/
│   ├── sessions/           # Gestion des sessions de cours
│   │   ├── SessionManager.jsx
│   │   ├── SessionList.jsx
│   │   ├── SessionCreate.jsx
│   │   └── SessionAttendance.jsx
│   ├── timetable/          # Emplois du temps
│   │   ├── TimetableManager.jsx
│   │   ├── TimetableWeekView.jsx
│   │   └── TimetableCreate.jsx
│   ├── bulletins/          # Bulletins scolaires
│   │   ├── BulletinManager.jsx
│   │   ├── BulletinCreate.jsx
│   │   └── BulletinDetail.jsx
│   ├── students/           # Gestion des étudiants
│   ├── faculty/            # Gestion des enseignants
│   └── navigation/         # Navigation et layout
├── services/
│   └── odooApi.js          # Service API pour Odoo
├── contexts/               # Contextes React
├── utils/                  # Utilitaires
└── App.jsx                 # Composant principal
```

## 🔧 Fonctionnalités principales

### 📅 Sessions & Cours
- **Planification de sessions** avec matière, classe, enseignant, salle
- **Gestion des présences** avec états détaillés
- **Workflow complet** : brouillon → planifiée → en cours → terminée
- **Statistiques** de présence et performance

### 🕐 Emplois du Temps
- **Création d'emplois du temps** par classe et période
- **Vue hebdomadaire** interactive avec glisser-déposer
- **Détection automatique** des conflits de salles
- **Génération de sessions** à partir de l'emploi du temps

### 📊 Bulletins Scolaires
- **Création de bulletins** par trimestre
- **Calcul automatique** des moyennes pondérées
- **Classement** dans la classe et par matière
- **Génération PDF** avec template personnalisable
- **Workflow de validation** : brouillon → calculé → validé → publié

### 👥 Gestion des Utilisateurs
- **Étudiants** : profils, inscriptions, présences
- **Enseignants** : plannings, matières, évaluations
- **Interface responsive** et moderne

## 🎨 Design & UX

- **Material-UI** pour les composants
- **Lucide React** pour les icônes
- **Design responsive** adaptatif
- **Thème personnalisé** aux couleurs de l'école
- **Animations fluides** et micro-interactions

## 🔗 Intégration Odoo

### Configuration API
```javascript
// services/odooApi.js
const api = axios.create({
  baseURL: 'http://localhost:8069',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Endpoints disponibles
- `/school_management/api/sessions` - Sessions de cours
- `/school_management/api/timetables` - Emplois du temps
- `/school_management/api/bulletins` - Bulletins scolaires
- `/school_management/api/students` - Étudiants
- `/school_management/api/faculty` - Enseignants
- `/school_management/api/subjects` - Matières

## 🚦 États et Workflows

### Sessions
```
Brouillon → Planifiée → En cours → Terminée
                    ↘️ Annulée
```

### Bulletins
```
Brouillon → Calculé → Validé → Publié → Archivé
```

### Emplois du temps
```
Brouillon → Actif → Archivé
```

## 📱 Navigation

### Menu principal
- 🏠 **Tableau de Bord** - Vue d'ensemble et statistiques
- 📅 **Sessions & Cours** - Planning et présences
- 🕐 **Emplois du Temps** - Organisation hebdomadaire
- 📊 **Bulletins & Notes** - Évaluations et résultats
- 👥 **Étudiants** - Gestion des profils
- 👨‍🏫 **Enseignants** - Gestion du personnel
- 📚 **Matières** - Configuration pédagogique

## 🛠️ Développement

### Scripts disponibles
```bash
npm run dev       # Serveur de développement
npm run build     # Build de production
npm run preview   # Prévisualisation du build
npm start         # Alias pour dev
```

### Variables d'environnement
```env
VITE_ODOO_URL=http://localhost:8069
VITE_API_TIMEOUT=30000
```

## 🔍 Fonctionnalités avancées

### Filtres et recherche
- **Recherche en temps réel** dans toutes les listes
- **Filtres multiples** par état, date, classe
- **Pagination** pour les grandes listes
- **Tri personnalisable**

### Notifications
- **Alertes système** pour les actions importantes
- **Confirmations** pour les suppressions
- **Messages de succès** pour les opérations

### Performance
- **Chargement paresseux** des composants
- **Cache intelligent** des données
- **Optimisation** des requêtes API

## 🎯 Prochaines étapes

1. **Authentification SSO** avec Odoo
2. **Notifications push** en temps réel
3. **Mode hors ligne** avec synchronisation
4. **Export Excel/PDF** avancé
5. **Dashboard analytics** interactif

## 🆘 Support

Pour toute question ou problème :
1. Vérifiez que Odoo fonctionne sur le port 8069
2. Vérifiez la configuration CORS d'Odoo
3. Consultez les logs du navigateur (F12)
4. Vérifiez les logs Odoo pour les erreurs API

---

**Développé avec ❤️ pour l'éducation moderne**
