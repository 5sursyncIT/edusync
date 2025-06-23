#!/bin/bash

# Arrêter toutes les instances d'Odoo
echo "Arrêt des instances Odoo en cours..."
pkill -f odoo-bin

# Supprimer la base de données
echo "Suppression de la base de données odoo_ecole..."
PGPASSWORD=ubuntu dropdb -U odoo -h localhost odoo_ecole

# Créer une nouvelle base de données
echo "Création d'une nouvelle base de données odoo_ecole..."
PGPASSWORD=ubuntu createdb -U odoo -h localhost odoo_ecole

# Initialiser la base de données avec Odoo
echo "Initialisation de la base de données avec Odoo..."
cd /opt/odoo
python3 ./odoo-source/odoo-bin -c ./odoo.conf -d odoo_ecole --init=base,web,school_management --without-demo=all --stop-after-init

# Démarrer Odoo normalement
echo "Démarrage d'Odoo..."
cd /opt/odoo
nohup python3 ./odoo-source/odoo-bin -c ./odoo.conf -d odoo_ecole --dev=all > /dev/null 2>&1 &

echo "Terminé ! Odoo devrait être accessible sur http://localhost:8069" 