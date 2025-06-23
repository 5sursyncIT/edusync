#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys

# Ajouter le chemin d'Odoo
sys.path.append('/opt/odoo/odoo-source')

import odoo
from odoo import api, SUPERUSER_ID

def set_parent_password():
    """Définir le mot de passe du parent de test"""
    
    # Configuration de la base de données
    odoo.tools.config.parse_config(['--config=/opt/odoo/odoo.conf'])
    db_name = 'odoo_ecole'
    
    # Se connecter à la base de données
    registry = odoo.registry(db_name)
    
    with registry.cursor() as cr:
        env = api.Environment(cr, SUPERUSER_ID, {})
        
        try:
            # Trouver l'utilisateur parent
            user = env['res.users'].search([('login', '=', 'marie.dupont@parent.test')], limit=1)
            
            if not user:
                print("❌ Utilisateur parent non trouvé")
                return False
            
            # Définir le mot de passe
            user.write({
                'password': 'parent123',
                'active': True
            })
            
            # Vérifier que l'utilisateur est bien marqué comme parent
            if not hasattr(user, 'is_parent') or not user.is_parent:
                user.write({'is_parent': True})
            
            # Valider les changements
            env.cr.commit()
            
            print(f"✅ Mot de passe défini pour {user.name}")
            print(f"📧 Email: {user.login}")
            print(f"🔑 Mot de passe: parent123")
            print(f"🆔 ID Utilisateur: {user.id}")
            print(f"👨‍👩‍👧‍👦 Est parent: {user.is_parent}")
            
            # Vérifier le parent OpenEduCat associé
            parent = env['op.parent'].search([('user_id', '=', user.id)], limit=1)
            if parent:
                print(f"✅ Parent OpenEduCat trouvé: {parent.name.name} (ID: {parent.id})")
                print(f"👶 Enfants: {len(parent.student_ids)} étudiant(s)")
                for student in parent.student_ids:
                    print(f"  - {student.name} (ID: {student.id})")
            else:
                print("❌ Aucun parent OpenEduCat associé")
            
            return True
            
        except Exception as e:
            env.cr.rollback()
            print(f"❌ Erreur: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == '__main__':
    success = set_parent_password()
    if success:
        print(f"\n✅ Test de connexion parent:")
        print(f"curl -X POST http://localhost:8069/api/parent/login \\")
        print(f"  -H 'Content-Type: application/json' \\")
        print(f"  -d '{{\"email\": \"marie.dupont@parent.test\", \"password\": \"parent123\"}}'") 