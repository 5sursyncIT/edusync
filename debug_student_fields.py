#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys

# Ajouter le chemin d'Odoo
sys.path.append('/opt/odoo/odoo-source')

import odoo
from odoo import api, SUPERUSER_ID

def debug_student_fields():
    """Examiner les champs disponibles sur le modèle op.student"""
    
    # Configuration de la base de données
    odoo.tools.config.parse_config(['--config=/opt/odoo/odoo.conf'])
    db_name = 'odoo_ecole'
    
    # Se connecter à la base de données
    registry = odoo.registry(db_name)
    
    with registry.cursor() as cr:
        env = api.Environment(cr, SUPERUSER_ID, {})
        
        try:
            # Récupérer un étudiant
            student = env['op.student'].search([], limit=1)
            
            if not student:
                print("❌ Aucun étudiant trouvé")
                return
            
            print(f"🎓 Étudiant trouvé: {student.name} (ID: {student.id})")
            print("\\n📋 Champs disponibles sur le modèle op.student:")
            
            # Lister tous les champs
            fields_list = []
            for field_name, field in student._fields.items():
                field_type = type(field).__name__
                fields_list.append((field_name, field_type, str(field)))
            
            # Trier par nom de champ
            fields_list.sort()
            
            # Afficher les champs pertinents
            relevant_fields = ['course', 'batch', 'program', 'class', 'level']
            
            print("\\n🔍 Champs contenant 'course', 'batch', 'program', 'class', 'level':")
            for field_name, field_type, field_desc in fields_list:
                if any(keyword in field_name.lower() for keyword in relevant_fields):
                    print(f"   - {field_name}: {field_type}")
                    try:
                        value = getattr(student, field_name)
                        if hasattr(value, 'name'):
                            print(f"     Valeur: {value.name}")
                        elif hasattr(value, 'id'):
                            print(f"     ID: {value.id}")
                        else:
                            print(f"     Valeur: {value}")
                    except Exception as e:
                        print(f"     Erreur lecture: {e}")
                    print()
            
            print("\\n📝 Tous les champs Many2one:")
            for field_name, field_type, field_desc in fields_list:
                if 'Many2one' in field_type:
                    print(f"   - {field_name}: {field_type}")
                    try:
                        value = getattr(student, field_name)
                        if value and hasattr(value, 'name'):
                            print(f"     → {value.name}")
                    except:
                        pass
            
            # Tester l'accès spécifique
            print("\\n🧪 Tests d'accès aux champs:")
            test_fields = ['course_id', 'batch_id', 'program_id', 'class_id']
            
            for field in test_fields:
                try:
                    if hasattr(student, field):
                        value = getattr(student, field)
                        print(f"✅ {field}: {value.name if value and hasattr(value, 'name') else value}")
                    else:
                        print(f"❌ {field}: Champ non trouvé")
                except Exception as e:
                    print(f"⚠️ {field}: Erreur - {e}")
            
        except Exception as e:
            print(f"❌ Erreur: {e}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    debug_student_fields() 