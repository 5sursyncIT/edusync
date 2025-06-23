# -*- coding: utf-8 -*-

# Avant d'importer les contrôleurs, importer les utilitaires qui n'ont pas de dépendances

# from . import global_cors  # Import du middleware CORS global - désactivé pour résoudre les erreurs 500

# Ensuite, importer les contrôleurs principaux
from . import main

from . import bulletin_controller  
from . import library_api  
from . import fees_api   
from . import parents_api   