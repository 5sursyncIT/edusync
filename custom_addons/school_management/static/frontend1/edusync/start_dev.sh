#!/bin/bash

echo "🚀 Démarrage de l'application EduSync Library Management"
echo "=================================================="

# Vérifier si node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

echo "🔄 Démarrage du serveur de développement..."
npm start 