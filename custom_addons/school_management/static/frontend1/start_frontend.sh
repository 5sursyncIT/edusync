#!/bin/bash

# Script pour démarrer le frontend React EduSync
# Ce script configure les variables d'environnement et démarre l'application

echo "========================================"
echo "Démarrage du Frontend EduSync"
echo "========================================"

# Aller dans le répertoire de l'application React
cd "$(dirname "$0")/edusync"

echo "Répertoire actuel : $(pwd)"

# Vérifier que package.json existe
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: package.json non trouvé dans $(pwd)"
    echo "Assurez-vous d'être dans le bon répertoire"
    exit 1
fi

# Vérifier que node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Erreur lors de l'installation des dépendances"
        exit 1
    fi
else
    echo "✅ Dépendances déjà installées"
fi

# Configurer les variables d'environnement
export REACT_APP_API_BASE_URL="http://172.16.209.128:8069"
export REACT_APP_ODOO_DATABASE="odoo_ecole"
export NODE_ENV="development"
export BROWSER="none"  # Empêche l'ouverture automatique du navigateur

echo ""
echo "Configuration:"
echo "- API URL: $REACT_APP_API_BASE_URL"
echo "- Base de données: $REACT_APP_ODOO_DATABASE"
echo "- Mode: $NODE_ENV"
echo ""

# Créer un fichier .env temporaire si il n'existe pas
if [ ! -f ".env" ]; then
    echo "📝 Création du fichier .env..."
    cat > .env << EOF
REACT_APP_API_BASE_URL=http://172.16.209.128:8069
REACT_APP_ODOO_DATABASE=odoo_ecole
NODE_ENV=development
BROWSER=none
EOF
    echo "✅ Fichier .env créé"
fi

echo "🚀 Démarrage de l'application React..."
echo "L'application sera disponible sur: http://localhost:3000"
echo ""
echo "Pour arrêter l'application, appuyez sur Ctrl+C"
echo ""

# Démarrer l'application React
npm start

echo ""
echo "👋 Application arrêtée" 