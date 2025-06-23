# 🔧 Guide de Résolution des Problèmes - EduSync Bibliothèque

## 🚨 Erreurs Courantes et Solutions

### 1. "Erreur lors de la récupération des emprunts"

#### Symptômes
- Message d'erreur lors du chargement de la page des emprunts
- Interface affiche "Erreur lors du chargement des emprunts"

#### Causes Possibles
- **Session Odoo expirée** (le plus fréquent)
- Problème de connectivité réseau
- Service Odoo arrêté
- Erreur dans l'API backend

#### Solutions

##### ✅ Solution 1 : Renouveler la session Odoo
1. **Cliquer sur "Ouvrir Odoo"** dans le message d'erreur
2. **Se connecter** avec vos identifiants Odoo :
   - URL : `http://172.16.209.128:8069/web/login`
   - Utiliser vos identifiants habituels
3. **Revenir** à l'application bibliothèque
4. **Cliquer sur "Réessayer"**

##### ✅ Solution 2 : Diagnostic automatique
1. Utiliser le bouton **"Vérifier la session"** dans l'interface
2. Suivre les instructions affichées
3. Si la session est invalide, suivre la Solution 1

##### ✅ Solution 3 : Nettoyage manuel
```javascript
// Dans la console du navigateur (F12)
localStorage.removeItem('session_id');
location.reload();
```

---

### 2. "Session non valide ou expirée"

#### Symptômes
- Message d'erreur direct de l'API
- Impossible d'accéder aux données

#### Solution Rapide
```bash
# Vérifier si Odoo fonctionne
curl -I http://172.16.209.128:8069

# Si Odoo répond, suivre la Solution 1 ci-dessus
```

---

### 3. Problèmes de Compilation

#### Symptômes
- Erreurs lors de `npm run build`
- Composants qui ne s'affichent pas

#### Solutions
```bash
# Dans le répertoire edusync
cd custom_addons/school_management/static/frontend1/edusync

# Nettoyer et reinstaller
rm -rf node_modules package-lock.json
npm install

# Recompiler
npm run build
```

---

### 4. Service Odoo Arrêté

#### Symptômes
- Erreur de connexion réseau
- Impossible d'accéder à l'URL Odoo

#### Diagnostic
```bash
# Vérifier le statut du service
sudo systemctl status odoo

# Vérifier les logs
sudo journalctl -u odoo -f --lines=50
```

#### Solutions
```bash
# Redémarrer Odoo
sudo systemctl restart odoo

# Vérifier que le service démarre
sudo systemctl status odoo
```

---

### 5. Problèmes de Navigation

#### Symptômes
- Composants ne s'affichent pas
- Erreurs JavaScript dans la console

#### Solutions
1. **Vérifier la console** (F12) pour des erreurs
2. **Recharger la page** (Ctrl+F5)
3. **Vider le cache** du navigateur

---

## 🔍 Outils de Diagnostic

### Interface Utilisateur
- **SessionHelper** : Diagnostic automatique des sessions
- **Bouton "Réessayer"** : Tentative de reconnexion
- **Console développeur** : Erreurs détaillées

### Ligne de Commande
```bash
# Test de connectivité API
curl -X GET "http://172.16.209.128:8069/api/library/statistics" | jq

# Test de session
curl -X GET "http://172.16.209.128:8069/web/session/get_session_info"

# Vérification des logs Odoo
sudo journalctl -u odoo --since "1 hour ago"
```

---

## 📞 Procédure de Support

### Étape 1 : Collecte d'informations
```bash
# Informations système
systemctl status odoo
curl -I http://172.16.209.128:8069
```

### Étape 2 : Vérification des logs
```bash
# Logs récents
sudo journalctl -u odoo --since "30 minutes ago" > odoo_logs.txt
```

### Étape 3 : Test de l'API
```bash
# Test simple
curl -X GET "http://172.16.209.128:8069/api/library/statistics"
```

---

## ⚡ Solutions Rapides

| Problème | Solution Rapide |
|----------|----------------|
| Session expirée | Ouvrir http://172.16.209.128:8069/web/login → Se connecter → Recharger |
| API inaccessible | `sudo systemctl restart odoo` |
| Interface cassée | Ctrl+F5 pour recharger |
| Données manquantes | Cliquer "Réessayer" dans l'interface |

---

## 🔧 Maintenance Préventive

### Quotidienne
- Vérifier que le service Odoo fonctionne
- Tester l'accès à l'API bibliothèque

### Hebdomadaire
```bash
# Nettoyage des logs
sudo journalctl --vacuum-time=7d

# Vérification de l'espace disque
df -h
```

### En cas de problème persistant
1. **Redémarrer Odoo** : `sudo systemctl restart odoo`
2. **Vérifier les permissions** des fichiers
3. **Recompiler l'application** : `npm run build`
4. **Vider le cache** navigateur

---

## 📋 Checklist de Diagnostic

- [ ] Service Odoo actif : `systemctl status odoo`
- [ ] URL accessible : `curl -I http://172.16.209.128:8069`
- [ ] API répond : `curl http://172.16.209.128:8069/api/library/statistics`
- [ ] Session valide : Tester connexion web
- [ ] Application compilée : `npm run build` sans erreur
- [ ] Cache navigateur vidé

---

**Support technique** : Consulter les logs Odoo et l'interface SessionHelper pour un diagnostic précis. 