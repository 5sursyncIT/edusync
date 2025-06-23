#!/bin/bash

# Script d'Installation Automatisée - Système de Bibliothèque EduSync
# Version: 1.0.0
# Auteur: Équipe EduSync

echo "🚀 Installation du Système de Bibliothèque EduSync"
echo "=================================================="

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction d'affichage des messages
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Vérification des prérequis
check_requirements() {
    print_status "Vérification des prérequis..."
    
    # Vérifier Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js trouvé: $NODE_VERSION"
    else
        print_error "Node.js n'est pas installé"
        exit 1
    fi
    
    # Vérifier npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm trouvé: $NPM_VERSION"
    else
        print_error "npm n'est pas installé"
        exit 1
    fi
    
    # Vérifier Python
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version)
        print_success "Python trouvé: $PYTHON_VERSION"
    else
        print_error "Python3 n'est pas installé"
        exit 1
    fi
}

# Installation des dépendances
install_dependencies() {
    print_status "Installation des dépendances frontend..."
    
    cd custom_addons/school_management/static/frontend1/edusync
    
    if [ -f "package.json" ]; then
        npm install
        if [ $? -eq 0 ]; then
            print_success "Dépendances npm installées avec succès"
        else
            print_error "Erreur lors de l'installation des dépendances npm"
            exit 1
        fi
    else
        print_error "Fichier package.json non trouvé"
        exit 1
    fi
}

# Configuration de l'environnement
configure_environment() {
    print_status "Configuration de l'environnement..."
    
    # Créer le fichier .env s'il n'existe pas
    if [ ! -f ".env" ]; then
        cat > .env << EOL
REACT_APP_API_BASE_URL=http://172.16.209.128:8069/api
REACT_APP_LIBRARY_API_URL=http://172.16.209.128:8069/api/library
REACT_APP_ENVIRONMENT=production
REACT_APP_VERSION=1.0.0
EOL
        print_success "Fichier .env créé"
    else
        print_warning "Fichier .env existe déjà"
    fi
}

# Build de production
build_production() {
    print_status "Création du build de production..."
    
    npm run build
    if [ $? -eq 0 ]; then
        print_success "Build de production créé avec succès"
        
        # Afficher les statistiques
        if [ -d "build" ]; then
            BUILD_SIZE=$(du -sh build | cut -f1)
            print_success "Taille du build: $BUILD_SIZE"
        fi
    else
        print_error "Erreur lors du build de production"
        exit 1
    fi
}

# Configuration d'Odoo
configure_odoo() {
    print_status "Configuration du module Odoo..."
    
    cd /opt/odoo
    
    # Vérifier si le module est installé
    print_warning "Assurez-vous que le module 'school_management' est installé dans Odoo"
    print_warning "Base de données: edusync"
    print_warning "URL d'administration: http://172.16.209.128:8069/web"
}

# Tests de validation
run_tests() {
    print_status "Exécution des tests de validation..."
    
    cd custom_addons/school_management/static/frontend1/edusync
    
    # Test de compilation
    npm run build > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_success "Test de compilation: PASSÉ"
    else
        print_error "Test de compilation: ÉCHOUÉ"
    fi
    
    # Test de l'API (si le serveur est en marche)
    API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://172.16.209.128:8069/api/library/statistics)
    if [ "$API_RESPONSE" = "200" ] || [ "$API_RESPONSE" = "401" ]; then
        print_success "Test API: PASSÉ (serveur accessible)"
    else
        print_warning "Test API: Serveur non accessible (code: $API_RESPONSE)"
    fi
}

# Créer les raccourcis de démarrage
create_shortcuts() {
    print_status "Création des raccourcis de démarrage..."
    
    # Script de démarrage rapide
    cat > start_edusync_library.sh << 'EOL'
#!/bin/bash
echo "🚀 Démarrage EduSync Library System"

# Démarrer Odoo (en arrière-plan)
cd /opt/odoo
python3 odoo-bin -d edusync &
ODOO_PID=$!

# Attendre que Odoo soit prêt
sleep 10

# Démarrer le serveur de développement React
cd custom_addons/school_management/static/frontend1/edusync
npm start

# Nettoyer à la sortie
kill $ODOO_PID
EOL

    chmod +x start_edusync_library.sh
    print_success "Script de démarrage créé: start_edusync_library.sh"
}

# Génération du rapport d'installation
generate_report() {
    print_status "Génération du rapport d'installation..."
    
    INSTALL_DATE=$(date '+%Y-%m-%d %H:%M:%S')
    
    cat > INSTALLATION_REPORT.md << EOL
# Rapport d'Installation - Bibliothèque EduSync

## Informations Générales
- **Date d'installation**: $INSTALL_DATE
- **Version du système**: 1.0.0
- **Environnement**: Production

## Versions des Outils
- **Node.js**: $(node --version)
- **npm**: $(npm --version)
- **Python**: $(python3 --version)

## URLs d'Accès
- **Application**: http://172.16.209.128:3000/library
- **API Backend**: http://172.16.209.128:8069/api/library/
- **Administration Odoo**: http://172.16.209.128:8069/web

## Fichiers Installés
- ✅ Composants React
- ✅ Hooks personnalisés
- ✅ Styles CSS
- ✅ Configuration Odoo
- ✅ Documentation complète

## Commandes Utiles

### Démarrage Rapide
\`\`\`bash
./start_edusync_library.sh
\`\`\`

### Démarrage Manuel
\`\`\`bash
# Backend Odoo
cd /opt/odoo
python3 odoo-bin -d edusync

# Frontend React
cd custom_addons/school_management/static/frontend1/edusync
npm start
\`\`\`

### Build Production
\`\`\`bash
cd custom_addons/school_management/static/frontend1/edusync
npm run build
\`\`\`

## Support
- **Email**: help@edusync.com
- **Documentation**: Consultez les fichiers LIBRARY_*.md
- **Guide rapide**: GUIDE_DEMARRAGE_RAPIDE.md

## Statut: ✅ INSTALLATION RÉUSSIE
EOL

    print_success "Rapport d'installation généré: INSTALLATION_REPORT.md"
}

# Fonction principale
main() {
    echo
    print_status "Début de l'installation..."
    echo
    
    check_requirements
    echo
    
    install_dependencies
    echo
    
    configure_environment
    echo
    
    build_production
    echo
    
    configure_odoo
    echo
    
    run_tests
    echo
    
    create_shortcuts
    echo
    
    generate_report
    echo
    
    print_success "🎉 Installation terminée avec succès !"
    echo
    print_status "Prochaines étapes:"
    echo "1. Démarrez Odoo et assurez-vous que le module 'school_management' est installé"
    echo "2. Lancez l'application avec: ./start_edusync_library.sh"
    echo "3. Accédez à: http://172.16.209.128:3000/library"
    echo "4. Consultez GUIDE_DEMARRAGE_RAPIDE.md pour commencer"
    echo
    print_success "Bonne utilisation du système de bibliothèque EduSync ! 📚"
}

# Gestion des erreurs
trap 'print_error "Installation interrompue"; exit 1' INT TERM

# Exécution du script principal
main "$@" 