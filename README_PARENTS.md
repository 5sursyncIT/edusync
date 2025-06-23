# 👨‍👩‍👧‍👦 Gestion des Parents - Documentation Complète

## 📋 Vue d'ensemble

Ce module étend le système de gestion scolaire avec une gestion complète des parents, incluant :
- **Formulaires étudiants améliorés** avec informations parents
- **APIs REST complètes** pour la gestion des parents
- **Interface React moderne** pour l'administration
- **Intégration avec le système de frais** scolaires
- **Portail parent** pour l'accès des familles

## 🏗️ Architecture

### Backend (Odoo)
```
custom_addons/school_management/
├── models/
│   └── op_student.py          # Extension du modèle étudiant
├── controllers/
│   ├── parents_api.py         # APIs pour les parents
│   └── main.py               # APIs étudiants étendues
└── views/
    └── op_student_view.xml    # Vues formulaires étendues
```

### Frontend (React)
```
static/frontend1/edusync/src/
├── services/
│   └── parentsApi.jsx         # Service API parents
└── components/
    └── parents/
        └── ParentsManagement.jsx  # Interface de gestion
```

## 🔧 Installation et Configuration

### 1. Mise à jour du module
```bash
cd /opt/odoo/odoo-source
python3 odoo-bin -c ../odoo.conf -d odoo_ecole -u school_management --stop-after-init
```

### 2. Vérification des dépendances
Le module `openeducat_parent` doit être installé et activé.

### 3. Configuration des permissions
Les utilisateurs doivent avoir les droits d'accès aux modèles `op.parent` et `op.student`.

## 📊 Modèles de Données

### Extension du modèle `op.student`

#### Nouveaux champs calculés :
- `primary_parent_id` : Parent principal (père ou mère prioritaire)
- `parent_names` : Noms de tous les parents (séparés par virgules)
- `parent_phones` : Téléphones des parents
- `parent_emails` : Emails des parents
- `has_parents` : Booléen indiquant si l'étudiant a des parents

#### Nouvelles méthodes :
```python
def get_parent_for_fees(self):
    """Retourne le parent principal pour les frais"""
    
def get_all_parents_info(self):
    """Retourne toutes les informations des parents"""
    
def _compute_primary_parent(self):
    """Calcule le parent principal"""
```

## 🌐 APIs REST

### Endpoints Parents

#### `GET /api/parents`
Récupère la liste des parents avec pagination et recherche.

**Paramètres :**
- `page` : Numéro de page (défaut: 1)
- `limit` : Nombre d'éléments par page (défaut: 20)
- `search` : Terme de recherche

**Réponse :**
```json
{
  "status": "success",
  "data": {
    "parents": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "mobile": "0123456789",
        "relationship": "Father",
        "students": [{"id": 1, "name": "Jane Doe"}],
        "has_portal_access": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    }
  }
}
```

#### `POST /api/parents`
Crée un nouveau parent.

**Données requises :**
```json
{
  "name": "Nom du parent",
  "email": "email@example.com",
  "mobile": "0123456789",
  "relationship": "Father|Mother|Guardian",
  "student_ids": [1, 2]
}
```

#### `GET /api/parents/{id}`
Récupère un parent spécifique.

#### `PUT /api/parents/{id}`
Met à jour un parent.

#### `DELETE /api/parents/{id}`
Supprime un parent.

#### `POST /api/parents/{id}/create-portal-user`
Crée un compte portal pour un parent.

#### `GET /api/parents/statistics`
Récupère les statistiques des parents.

**Réponse :**
```json
{
  "status": "success",
  "data": {
    "parents": {
      "total": 150,
      "with_portal": 45,
      "without_portal": 105
    },
    "students": {
      "with_parents": 120,
      "without_parents": 30,
      "total": 150
    }
  }
}
```

#### `GET /api/parents/relationships`
Récupère les types de relations disponibles.

### Endpoints Étudiants

#### `GET /api/students`
Récupère la liste des étudiants avec option d'inclure les parents.

**Paramètres :**
- `include_parents` : true/false pour inclure les informations parents
- `page`, `limit`, `search` : Pagination et recherche

**Réponse avec parents :**
```json
{
  "status": "success",
  "data": {
    "students": [
      {
        "id": 1,
        "name": "Jane Doe",
        "gr_no": "STU001",
        "email": "jane@example.com",
        "has_parents": true,
        "parents": [
          {
            "id": 1,
            "name": "John Doe",
            "relationship": "Father",
            "mobile": "0123456789",
            "email": "john@example.com"
          }
        ],
        "primary_parent": {
          "id": 1,
          "name": "John Doe",
          "relationship": "Father"
        },
        "parent_names": "John Doe",
        "parent_phones": "0123456789",
        "parent_emails": "john@example.com"
      }
    ]
  }
}
```

## ⚛️ Interface React

### Composant `ParentsManagement`

Interface complète avec :
- **Cartes de statistiques** : Totaux, accès portal, etc.
- **Système d'onglets** : Parents / Étudiants & Parents
- **Tableaux interactifs** avec pagination
- **Recherche en temps réel**
- **Actions CRUD** avec confirmations
- **Gestion des erreurs** et messages de succès

### Fonctionnalités principales :

1. **Vue Parents :**
   - Liste des parents avec relations
   - Statut d'accès portal
   - Actions : Voir, Modifier, Supprimer
   - Création de comptes portal

2. **Vue Étudiants & Parents :**
   - Liste des étudiants avec leurs parents
   - Statut de complétude des informations parents
   - Contacts des parents

### Service API (`parentsApi.jsx`)

Service unifié avec :
- **Gestion des erreurs** automatique
- **Intercepteurs** pour logging
- **Fonctions utilitaires** pour formatage
- **Configuration centralisée**

## 🔗 Intégration avec les Frais

### Utilisation dans le système de frais

Les APIs de frais utilisent maintenant les vraies relations parent-étudiant :

```javascript
// Dans fees_api.py
parent_data = detail.student_id.get_parent_for_fees()
parent_info = {
    'id': parent_data.get('id'),
    'name': parent_data.get('name', ''),
    'mobile': parent_data.get('mobile', ''),
    'email': parent_data.get('email', ''),
    'relationship': parent_data.get('relationship', '')
}
```

### Avantages :
- **Cohérence des données** entre modules
- **Accès aux vraies informations** de contact
- **Traçabilité** des paiements par parent
- **Notifications** automatiques aux parents

## 🏠 Portail Parent

### Création de comptes portal

1. **Automatique :** Via l'interface ou API
2. **Prérequis :** Email valide obligatoire
3. **Permissions :** Accès limité aux données de leurs enfants

### Fonctionnalités du portal :
- Consultation des frais
- Historique des paiements
- Informations scolaires des enfants
- Communication avec l'école

## 🧪 Tests et Validation

### Script de test
```bash
python3 test_parents_api.py
```

### Tests inclus :
1. Statistiques des parents
2. Liste et pagination
3. Recherche
4. Relations parent-étudiant
5. CRUD complet
6. Création de comptes portal

### Validation des données :
- **Email** : Format valide requis pour portal
- **Téléphone** : Format optionnel mais recommandé
- **Relations** : Validation contre les types disponibles
- **Étudiants** : Vérification d'existence

## 🔧 Maintenance et Dépannage

### Logs importants
```bash
# Logs Odoo
tail -f /opt/odoo/odoo.log

# Rechercher erreurs parents
grep -i "parent" /opt/odoo/odoo.log
```

### Problèmes courants

1. **Parents non visibles :**
   - Vérifier module `openeducat_parent` installé
   - Contrôler les permissions utilisateur

2. **Erreurs API :**
   - Vérifier CORS configuré
   - Contrôler les données envoyées

3. **Portal non créé :**
   - Email requis et valide
   - Permissions portal activées

### Commandes utiles
```bash
# Réinstaller le module
python3 odoo-bin -c odoo.conf -d odoo_ecole -i school_management --stop-after-init

# Mettre à jour seulement
python3 odoo-bin -c odoo.conf -d odoo_ecole -u school_management --stop-after-init

# Vérifier les parents existants
python3 debug_parent.py
```

## 📈 Évolutions Futures

### Fonctionnalités prévues :
1. **Notifications SMS** aux parents
2. **Interface mobile** dédiée
3. **Intégration calendrier** scolaire
4. **Système de messagerie** école-parent
5. **Rapports avancés** par parent

### Extensions possibles :
1. **Multi-langues** pour le portal
2. **Paiements en ligne** intégrés
3. **Géolocalisation** pour ramassage scolaire
4. **Système de rendez-vous** avec professeurs

## 📞 Support

Pour toute question ou problème :
1. Consulter les logs Odoo
2. Tester avec le script `test_parents_api.py`
3. Vérifier la documentation OpenEduCat
4. Contrôler les permissions et dépendances

---

**✅ Système Parents opérationnel et prêt pour l'utilisation en production !** 