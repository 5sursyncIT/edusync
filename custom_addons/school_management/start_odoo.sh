#!/bin/bash
# Script de démarrage d'Odoo pour le développement

# Chemins et configurations
ODOO_PATH="/opt/odoo/odoo-source/odoo-bin"
CONFIG_PATH="/opt/odoo/odoo.conf"
LOG_PATH="/opt/odoo/odoo.log"
DB_FILTER="odoo_ecole"
HTTP_PORT=8069

# Vérifier si le port est déjà utilisé
netstat -tuln | grep :$HTTP_PORT > /dev/null
if [ $? -eq 0 ]; then
  echo "ERREUR: Le port $HTTP_PORT est déjà utilisé!"
  echo "Utilisez un autre port ou arrêtez le processus qui utilise ce port."
  exit 1
fi

# Afficher la configuration
echo "╔════════════════════════════════════════════════════════════╗"
echo "║ Démarrage d'Odoo en mode développement                     ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║ Chemin Odoo    : $ODOO_PATH"
echo "║ Configuration  : $CONFIG_PATH"
echo "║ Logs           : $LOG_PATH"
echo "║ Filtre DB      : $DB_FILTER"
echo "║ Port HTTP      : $HTTP_PORT"
echo "╚════════════════════════════════════════════════════════════╝"

# Démarrer Odoo avec les paramètres personnalisés
echo "Démarrage d'Odoo..."
$ODOO_PATH -c $CONFIG_PATH --dev=all --http-port=$HTTP_PORT --xmlrpc-port=$HTTP_PORT --longpolling-port=$((HTTP_PORT + 1)) --db-filter=$DB_FILTER --log-level=debug 