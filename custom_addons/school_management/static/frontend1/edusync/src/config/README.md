# Configuration API - EduSync

Ce répertoire contient les fichiers de configuration pour l'API du système de gestion scolaire EduSync.

## Fichiers de configuration

### `apiConfig.js`
Fichier principal de configuration contenant :
- URLs de base et endpoints
- Configuration des timeouts et headers
- Messages d'erreur standardisés
- Configuration CORS
- Utilitaires pour la gestion des erreurs et logging

## Variables d'environnement

Créez un fichier `.env` à la racine du projet React avec les variables suivantes :

```bash
# Configuration pour Vite (variables doivent commencer par VITE_)

# URL de base de l'API Odoo
VITE_API_URL=http://172.16.209.128:8069

# Configuration de l'école
VITE_SCHOOL_NAME="EduSync - Système de Gestion Scolaire"
VITE_SCHOOL_LOGO_URL="/static/img/logo.png"

# Configuration de debug
VITE_DEBUG=true

# Port du serveur de développement (optionnel)
PORT=3000
```

**Note importante** : Avec Vite, les variables d'environnement doivent commencer par `VITE_` pour être accessibles côté client, contrairement à Create React App qui utilise `REACT_APP_`.

## Utilisation

### Import de la configuration
```javascript
import API_CONFIG, { buildUrl, handleHttpError } from '../config/apiConfig';
```

### Utilisation des endpoints
```javascript
// Utilisation directe
const url = API_CONFIG.FEES_ENDPOINTS.TERMS;

// Avec paramètres
const url = buildUrl(API_CONFIG.FEES_ENDPOINTS.TERMS, { page: 1, limit: 20 });
```

### Gestion des erreurs
```javascript
try {
  const response = await api.get('/endpoint');
} catch (error) {
  const userMessage = handleHttpError(error);
  console.error(userMessage);
}
```

## Configuration des services

Les services API utilisent automatiquement cette configuration :
- `feesApi.jsx` - Service pour la gestion des frais
- Futurs services pour étudiants, bibliothèque, etc.

## Debug et logging

En mode développement, les requêtes et réponses sont automatiquement loggées dans la console avec :
- 🔄 pour les requêtes sortantes
- ✅ pour les réponses réussies
- ❌ pour les erreurs

## Différences avec Create React App

Cette application utilise **Vite** au lieu de Create React App :

### Variables d'environnement
- **Vite** : `import.meta.env.MODE === 'development'`
- **CRA** : `process.env.NODE_ENV === 'development'`

### Accès aux variables
- **Vite** : `import.meta.env.VITE_API_URL`
- **CRA** : `process.env.REACT_APP_API_URL`

## Personnalisation

Modifiez `apiConfig.js` pour :
- Ajouter de nouveaux endpoints
- Modifier les timeouts
- Personnaliser les messages d'erreur
- Configurer de nouveaux services

## Démarrage du serveur de développement

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement Vite
npm run dev

# Build pour la production
npm run build
``` 