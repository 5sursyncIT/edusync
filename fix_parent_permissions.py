#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys

# Ajouter le chemin d'Odoo
sys.path.append('/opt/odoo/odoo-source')

import odoo
from odoo import api, SUPERUSER_ID

def fix_parent_permissions():
    """Corriger les permissions du parent de test"""
    
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
            
            print(f"👤 Utilisateur trouvé: {user.name} (ID: {user.id})")
            
            # Récupérer les groupes nécessaires
            groups_to_add = []
            
            # Groupe Parent
            parent_group = env.ref('openeducat_parent.group_op_parent', raise_if_not_found=False)
            if parent_group:
                groups_to_add.append(parent_group.id)
                print(f"✅ Groupe Parent trouvé: {parent_group.name}")
            else:
                print("⚠️ Groupe Parent non trouvé")
            
            # Groupe Portal (déjà présent normalement)
            portal_group = env.ref('base.group_portal', raise_if_not_found=False)
            if portal_group:
                groups_to_add.append(portal_group.id)
                print(f"✅ Groupe Portal trouvé: {portal_group.name}")
            
            # Essayer de trouver d'autres groupes liés aux parents
            try:
                # Chercher tous les groupes contenant "parent" dans le nom
                parent_groups = env['res.groups'].search([
                    '|', ('name', 'ilike', 'parent'), ('category_id.name', 'ilike', 'parent')
                ])
                
                print(f"\\n📋 Groupes trouvés contenant 'parent':")
                for group in parent_groups:
                    print(f"   - {group.name} (ID: {group.id}) - Catégorie: {group.category_id.name if group.category_id else 'N/A'}")
                    if group.id not in groups_to_add:
                        groups_to_add.append(group.id)
                
            except Exception as e:
                print(f"⚠️ Erreur lors de la recherche des groupes: {e}")
            
            # Mettre à jour les groupes de l'utilisateur
            if groups_to_add:
                # Conserver les groupes existants et ajouter les nouveaux
                current_groups = [g.id for g in user.groups_id]
                all_groups = list(set(current_groups + groups_to_add))
                
                user.write({
                    'groups_id': [(6, 0, all_groups)]
                })
                
                print(f"\\n✅ Groupes mis à jour pour {user.name}")
                print(f"   Groupes avant: {len(current_groups)}")
                print(f"   Groupes après: {len(all_groups)}")
                
                # Afficher tous les groupes de l'utilisateur
                print("\\n👥 Groupes de l'utilisateur:")
                for group in user.groups_id:
                    print(f"   - {group.name} (ID: {group.id})")
            
            # Vérifier le parent OpenEduCat
            parent = env['op.parent'].search([('user_id', '=', user.id)], limit=1)
            if parent:
                print(f"\\n✅ Parent OpenEduCat: {parent.name.name} (ID: {parent.id})")
                print(f"   Enfants: {len(parent.student_ids)}")
                for student in parent.student_ids:
                    print(f"     - {student.name} (ID: {student.id})")
            
            # Valider les changements
            env.cr.commit()
            
            print("\\n🎉 PERMISSIONS CORRIGÉES AVEC SUCCÈS!")
            return True
            
        except Exception as e:
            env.cr.rollback()
            print(f"❌ Erreur: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == '__main__':
    success = fix_parent_permissions()
    if success:
        print("\\n✅ Relancez le test du portail parent maintenant!")
    else:
        print("\\n❌ Échec de la correction des permissions") 