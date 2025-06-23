# 👨‍👩‍👧‍👦 Gestion des Étudiants et Parents - EduSync

## 📋 Vue d'ensemble

Ce module étend le système EduSync pour inclure une gestion complète des relations entre étudiants et parents, avec une interface React moderne et des APIs robustes.

## 🚀 Nouvelles Fonctionnalités

### 1. **Extension du Modèle Étudiant**
- Ajout de champs calculés pour les relations parents
- Méthodes pour récupérer les informations des parents
- Intégration avec le module `openeducat_parent`

### 2. **Interface React "Étudiants et Parents"**
- Composant `StudentsWithParents.jsx` avec interface Material-UI
- Affichage des étudiants avec leurs informations parents
- Statistiques en temps réel
- Recherche et pagination

### 3. **APIs Étendues**
- Extension de l'API `/api/students` avec paramètre `include_parents`
- API complète `/api/parents` pour la gestion des parents
- Endpoints pour les relations parent-étudiant

## 🛠️ Architecture Technique

### Backend (Python/Odoo)

#### Modèles Étendus

**`op_student.py`** - Extension du modèle étudiant :
```python
# Champs calculés
primary_parent_id = fields.Many2one('op.parent', compute='_compute_primary_parent')
parent_names = fields.Char(compute='_compute_parent_info')
parent_phones = fields.Char(compute='_compute_parent_info')
parent_emails = fields.Char(compute='_compute_parent_info')
has_parents = fields.Boolean(compute='_compute_parent_info')

# Méthodes utilitaires
def get_parent_for_fees(self)
def get_all_parents_info(self)
```

#### Contrôleurs API

**`main.py`** - API étudiants étendue :
```python
@http.route('/api/students', methods=['GET'])
def get_students(self, include_parents='false', **kwargs):
    # Retourne les étudiants avec ou sans informations parents
```

**`parents_api.py`** - API dédiée aux parents :
```python
# Endpoints disponibles
GET    /api/parents                    # Liste des parents
POST   /api/parents                    # Créer un parent
GET    /api/parents/<id>               # Détails d'un parent
PUT    /api/parents/<id>               # Modifier un parent
DELETE /api/parents/<id>               # Supprimer un parent
GET    /api/parents/statistics         # Statistiques
GET    /api/parents/relationships      # Relations parent-étudiant
POST   /api/parents/<id>/create-portal-user  # Créer compte portal
```

### Frontend (React)

#### Composants Principaux

**`StudentsWithParents.jsx`** :
- Interface complète pour visualiser étudiants et parents
- Cartes de statistiques dynamiques
- Tableau avec informations détaillées des parents
- Pagination et recherche

**`ParentInfo.jsx`** (sous-composant) :
- Affichage compact des informations d'un parent
- Badges pour le statut portal
- Informations de contact

#### Services API

**`odooApi.jsx`** - Extension du service :
```javascript
// Nouvelle méthode
async getStudentsWithParents(page = 1, limit = 50, search = '') {
    // Récupère les étudiants avec leurs parents
}
```

**`parentsApi.jsx`** - Service dédié aux parents :
```javascript
// Services organisés
const parentsService = {
    getParents,
    createParent,
    updateParent,
    deleteParent,
    getStatistics,
    getRelationships
}
```

## 📱 Interface Utilisateur

### Page "Étudiants et Parents"

#### Accès
- Menu : **Gestion Écoles** → **Étudiants et Parents**
- URL : `/students-parents`

#### Fonctionnalités
1. **Cartes de statistiques** :
   - Total des étudiants
   - Étudiants avec parents
   - Étudiants sans parents

2. **Tableau principal** :
   - Informations étudiant (nom, contact)
   - Liste des parents avec détails
   - Statut des relations parent-étudiant

3. **Recherche et filtrage** :
   - Recherche par nom d'étudiant ou parent
   - Pagination configurable

## 🔧 Installation et Configuration

### 1. Mise à jour du Module
```bash
# Redémarrer Odoo avec mise à jour
./odoo-bin -u school_management -d odoo_ecole
```

### 2. Vérification des Dépendances
- Module `openeducat_parent` requis
- Relations parent-étudiant configurées

### 3. Configuration Frontend
```bash
# Installer les dépendances React (si nécessaire)
cd static/frontend1/edusync
npm install
```

## 📊 Utilisation

### Côté Administration

1. **Accéder à la page** :
   - Connexion à EduSync
   - Menu "Gestion Écoles" → "Étudiants et Parents"

2. **Visualiser les données** :
   - Statistiques en temps réel
   - Liste complète des relations
   - Recherche par nom

3. **Gérer les parents** :
   - Bouton "Gérer Parents" pour accéder à l'interface complète
   - Création de comptes portal depuis l'API

### Côté Développement

#### Test des APIs
```bash
# Exécuter le script de test
python3 test_students_with_parents.py
```

#### Structure des données retournées
```json
{
  "status": "success",
  "data": {
    "students": [
      {
        "id": 1,
        "name": "Jean Dupont",
        "email": "jean@example.com",
        "has_parents": true,
        "parents": [
          {
            "id": 1,
            "name": "Marie Dupont",
            "relationship": "Mère",
            "mobile": "0123456789",
            "email": "marie@example.com",
            "has_portal_access": true
          }
        ],
        "primary_parent": {
          "id": 1,
          "name": "Marie Dupont"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

## 🔍 Dépannage

### Problèmes Courants

1. **Étudiants sans parents affichés** :
   - Vérifier les relations dans le module `openeducat_parent`
   - S'assurer que les données sont bien synchronisées

2. **Erreur de chargement** :
   - Vérifier les logs Odoo
   - Tester l'API avec le script de test

3. **Interface ne s'affiche pas** :
   - Vérifier la route dans `App.jsx`
   - S'assurer que le composant est bien exporté

### Logs et Débogage

```python
# Activer les logs détaillés
import logging
_logger = logging.getLogger(__name__)
_logger.info("Chargement des étudiants avec parents...")
```

## 📈 Évolutions Futures

### Fonctionnalités Prévues
1. **Portail parent amélioré** :
   - Interface dédiée aux parents
   - Suivi des frais et notes

2. **Notifications** :
   - Alertes SMS/Email aux parents
   - Notifications de présence

3. **Rapports avancés** :
   - Statistiques détaillées
   - Export des données

### Améliorations Techniques
1. **Performance** :
   - Cache des relations parent-étudiant
   - Optimisation des requêtes

2. **Sécurité** :
   - Contrôle d'accès granulaire
   - Audit des modifications

## 👥 Contribution

### Structure du Code
```
custom_addons/school_management/
├── models/
│   └── op_student.py                 # Extension modèle étudiant
├── controllers/
│   ├── main.py                       # API étudiants étendue
│   └── parents_api.py               # API parents complète
├── views/
│   └── op_student_view.xml          # Vues étendues
└── static/frontend1/edusync/src/
    ├── components/students/
    │   └── StudentsWithParents.jsx   # Interface principale
    └── services/
        ├── odooApi.jsx              # Service étendu
        └── parentsApi.jsx           # Service parents
```

### Tests
- `test_students_with_parents.py` : Tests API complets
- `test_parents_api.py` : Tests spécifiques aux parents

## 📞 Support

Pour toute question ou problème :
1. Vérifier cette documentation
2. Consulter les logs Odoo
3. Exécuter les scripts de test
4. Contacter l'équipe de développement

---

**Version** : 1.0.0  
**Dernière mise à jour** : Décembre 2024  
**Compatibilité** : Odoo 17, React 18, Material-UI 5 