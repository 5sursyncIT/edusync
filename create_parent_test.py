#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys

# Ajouter le chemin d'Odoo
sys.path.append('/opt/odoo/odoo-source')

import odoo
from odoo import api, SUPERUSER_ID

def create_parent_test():
    """Créer un parent de test"""
    
    # Configuration de la base de données
    odoo.tools.config.parse_config(['--config=/opt/odoo/odoo.conf'])
    db_name = 'odoo_ecole'
    
    # Se connecter à la base de données
    registry = odoo.registry(db_name)
    
    with registry.cursor() as cr:
        env = api.Environment(cr, SUPERUSER_ID, {})
        
        try:
            # 1. Créer un contact/partenaire pour le parent
            partner_vals = {
                'name': 'Marie Dupont',
                'email': 'marie.dupont@parent.test',
                'phone': '+33123456789',
                'mobile': '+33654321987',
                'is_company': False,
                'supplier_rank': 0,
                'customer_rank': 1,
            }
            
            partner = env['res.partner'].create(partner_vals)
            print(f"✅ Partenaire créé: {partner.name} (ID: {partner.id})")
            
            # 2. Créer un utilisateur pour le parent
            user_vals = {
                'name': 'Marie Dupont',
                'login': 'marie.dupont@parent.test',
                'email': 'marie.dupont@parent.test',
                'partner_id': partner.id,
                'is_parent': True,
                'groups_id': [(6, 0, [env.ref('base.group_portal').id])],
                'active': True,
            }
            
            user = env['res.users'].create(user_vals)
            print(f"✅ Utilisateur parent créé: {user.name} (ID: {user.id})")
            
            # 3. Vérifier/créer une relation parent
            parent_relationship = env['op.parent.relationship'].search([('name', '=', 'Mère')], limit=1)
            if not parent_relationship:
                parent_relationship = env['op.parent.relationship'].create({
                    'name': 'Mère'
                })
                print(f"✅ Relation parent créée: {parent_relationship.name}")
            
            # 4. Récupérer un étudiant existant pour l'associer
            student = env['op.student'].search([('active', '=', True)], limit=1)
            if not student:
                print("❌ Aucun étudiant trouvé. Création d'un étudiant de test...")
                
                # Créer un cours si nécessaire
                course = env['op.course'].search([('active', '=', True)], limit=1)
                if not course:
                    course = env['op.course'].create({
                        'name': 'Cours Test',
                        'code': 'TEST',
                        'active': True
                    })
                
                # Créer une classe si nécessaire
                batch = env['op.batch'].search([('active', '=', True)], limit=1)
                if not batch:
                    batch = env['op.batch'].create({
                        'name': 'Classe Test',
                        'code': 'TEST-001',
                        'course_id': course.id,
                        'active': True
                    })
                
                # Créer un étudiant de test
                student_partner = env['res.partner'].create({
                    'name': 'Jean Dupont',
                    'email': 'jean.dupont@student.test',
                    'is_company': False,
                })
                
                student = env['op.student'].create({
                    'name': 'Jean Dupont',
                    'first_name': 'Jean',
                    'last_name': 'Dupont',
                    'email': 'jean.dupont@student.test',
                    'course_id': course.id,
                    'batch_id': batch.id,
                    'gender': 'm',
                    'active': True,
                    'partner_id': student_partner.id
                })
                print(f"✅ Étudiant de test créé: {student.name} (ID: {student.id})")
            
            # 5. Créer le parent OpenEduCat
            parent_vals = {
                'name': partner.id,
                'user_id': user.id,
                'student_ids': [(6, 0, [student.id])],
                'relationship_id': parent_relationship.id,
                'active': True,
            }
            
            parent = env['op.parent'].create(parent_vals)
            print(f"✅ Parent OpenEduCat créé: {parent.name.name} (ID: {parent.id})")
            
            # 6. Mettre à jour l'étudiant avec le parent
            student.write({
                'parent_ids': [(6, 0, [parent.id])]
            })
            print(f"✅ Étudiant {student.name} associé au parent")
            
            # 7. Valider les changements
            env.cr.commit()
            
            print("\n🎉 PARENT DE TEST CRÉÉ AVEC SUCCÈS!")
            print(f"📧 Email: marie.dupont@parent.test")
            print(f"🔑 Mot de passe: admin (par défaut)")
            print(f"👶 Enfant associé: {student.name}")
            print(f"🆔 ID Parent: {parent.id}")
            
            return {
                'parent_id': parent.id,
                'user_id': user.id,
                'email': 'marie.dupont@parent.test',
                'student_id': student.id,
                'student_name': student.name
            }
            
        except Exception as e:
            env.cr.rollback()
            print(f"❌ Erreur lors de la création du parent: {e}")
            import traceback
            traceback.print_exc()
            return None

if __name__ == '__main__':
    result = create_parent_test()
    if result:
        print(f"\n✅ Test de connexion parent possible avec:")
        print(f"curl -X POST http://localhost:8069/api/parent/login \\")
        print(f"  -H 'Content-Type: application/json' \\")
        print(f"  -d '{{\"email\": \"{result['email']}\", \"password\": \"admin\"}}'") 