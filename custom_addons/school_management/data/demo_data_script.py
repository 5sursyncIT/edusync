#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import odoorpc
import logging

# Configuration de la connexion
odoo = odoorpc.ODOO('localhost', port=8069)
odoo.login('odoo_ecole', 'admin', 'admin')

def create_demo_data():
    """Créer des données de démonstration"""
    
    print("=== Création des types d'évaluation ===")
    
    # Types d'évaluation
    evaluation_types_data = [
        {'name': 'Composition Français', 'code': 'COMP_FR', 'niveau_scolaire': 'middle', 'type_evaluation': 'composition', 'coefficient': 3.0},
        {'name': 'Devoir Français', 'code': 'DEV_FR', 'niveau_scolaire': 'middle', 'type_evaluation': 'devoir', 'coefficient': 1.0},
        {'name': 'Composition Mathématiques', 'code': 'COMP_MATH', 'niveau_scolaire': 'middle', 'type_evaluation': 'composition', 'coefficient': 3.0},
        {'name': 'Devoir Mathématiques', 'code': 'DEV_MATH', 'niveau_scolaire': 'middle', 'type_evaluation': 'devoir', 'coefficient': 1.0},
        {'name': 'Composition Sciences', 'code': 'COMP_SCI', 'niveau_scolaire': 'middle', 'type_evaluation': 'composition', 'coefficient': 2.0},
        {'name': 'Composition Histoire-Géo', 'code': 'COMP_HIST', 'niveau_scolaire': 'middle', 'type_evaluation': 'composition', 'coefficient': 2.0},
        {'name': 'Devoir Histoire-Géo', 'code': 'DEV_HIST', 'niveau_scolaire': 'middle', 'type_evaluation': 'devoir', 'coefficient': 1.0},
        {'name': 'Composition Philosophie', 'code': 'COMP_PHILO', 'niveau_scolaire': 'high', 'type_evaluation': 'composition', 'coefficient': 4.0},
        {'name': 'Devoir Philosophie', 'code': 'DEV_PHILO', 'niveau_scolaire': 'high', 'type_evaluation': 'devoir', 'coefficient': 2.0},
        {'name': 'Composition Physique', 'code': 'COMP_PHYS', 'niveau_scolaire': 'high', 'type_evaluation': 'composition', 'coefficient': 3.0},
    ]
    
    evaluation_type_ids = []
    for eval_type_data in evaluation_types_data:
        # Vérifier si le type existe déjà
        existing = odoo.env['op.evaluation.type'].search([('code', '=', eval_type_data['code'])])
        if not existing:
            eval_type_id = odoo.env['op.evaluation.type'].create(eval_type_data)
            evaluation_type_ids.append(eval_type_id)
            print(f"✅ Type d'évaluation créé: {eval_type_data['name']}")
        else:
            print(f"⚠️  Type d'évaluation existe déjà: {eval_type_data['name']}")
            evaluation_type_ids.append(existing[0])
    
    print(f"\n=== {len(evaluation_type_ids)} types d'évaluation traités ===")
    
    # Matières
    print("\n=== Création des matières ===")
    
    subjects_data = [
        {'name': 'Français', 'code': 'FR', 'type': 'theory', 'subject_type': 'compulsory', 'grade_weightage': 20.0},
        {'name': 'Mathématiques', 'code': 'MATH', 'type': 'theory', 'subject_type': 'compulsory', 'grade_weightage': 20.0},
        {'name': 'Sciences Physiques', 'code': 'PHYS', 'type': 'both', 'subject_type': 'compulsory', 'grade_weightage': 15.0},
        {'name': 'Sciences de la Vie et de la Terre', 'code': 'SVT', 'type': 'both', 'subject_type': 'compulsory', 'grade_weightage': 15.0},
        {'name': 'Histoire-Géographie', 'code': 'HIST-GEO', 'type': 'theory', 'subject_type': 'compulsory', 'grade_weightage': 15.0},
        {'name': 'Anglais', 'code': 'ANG', 'type': 'theory', 'subject_type': 'compulsory', 'grade_weightage': 10.0},
        {'name': 'Éducation Physique et Sportive', 'code': 'EPS', 'type': 'practical', 'subject_type': 'elective', 'grade_weightage': 5.0},
        {'name': 'Arts Plastiques', 'code': 'ART', 'type': 'practical', 'subject_type': 'elective', 'grade_weightage': 5.0},
        {'name': 'Musique', 'code': 'MUS', 'type': 'practical', 'subject_type': 'elective', 'grade_weightage': 3.0},
        {'name': 'Philosophie', 'code': 'PHILO', 'type': 'theory', 'subject_type': 'compulsory', 'grade_weightage': 25.0},
    ]
    
    subject_ids = []
    for subject_data in subjects_data:
        # Vérifier si la matière existe déjà
        existing = odoo.env['op.subject'].search([('code', '=', subject_data['code'])])
        if not existing:
            subject_id = odoo.env['op.subject'].create(subject_data)
            subject_ids.append(subject_id)
            print(f"✅ Matière créée: {subject_data['name']}")
        else:
            print(f"⚠️  Matière existe déjà: {subject_data['name']}")
            subject_ids.append(existing[0])
    
    print(f"\n=== {len(subject_ids)} matières traitées ===")
    
    # Vérifier s'il y a des cours existants
    print("\n=== Vérification des cours ===")
    courses = odoo.env['op.course'].search([])
    if courses:
        print(f"✅ {len(courses)} cours existants trouvés")
        course_ids = courses
    else:
        print("❌ Aucun cours trouvé, création de cours de démonstration")
        # Créer quelques cours de base
        courses_data = [
            {'name': 'Sixième', 'code': '6EME', 'education_level': 'middle'},
            {'name': 'Cinquième', 'code': '5EME', 'education_level': 'middle'},
            {'name': 'Quatrième', 'code': '4EME', 'education_level': 'middle'},
            {'name': 'Troisième', 'code': '3EME', 'education_level': 'middle'},
            {'name': 'Seconde', 'code': '2NDE', 'education_level': 'high'},
            {'name': 'Première', 'code': '1ERE', 'education_level': 'high'},
            {'name': 'Terminale', 'code': 'TERM', 'education_level': 'high'},
        ]
        
        course_ids = []
        for course_data in courses_data:
            course_id = odoo.env['op.course'].create(course_data)
            course_ids.append(course_id)
            print(f"✅ Cours créé: {course_data['name']}")
    
    # Créer des batches/promotions
    print("\n=== Création des batches/promotions ===")
    
    # Adapter le nombre de batches au nombre de cours disponibles
    batches_data = []
    if len(course_ids) >= 1:
        batches_data.extend([
            {'name': '6ème A - 2024', 'code': '6A-2024', 'course_id': course_ids[0], 'school_cycle': 'college', 'start_date': '2024-09-02', 'end_date': '2025-06-30'},
            {'name': '6ème B - 2024', 'code': '6B-2024', 'course_id': course_ids[0], 'school_cycle': 'college', 'start_date': '2024-09-02', 'end_date': '2025-06-30'},
        ])
    if len(course_ids) >= 2:
        batches_data.extend([
            {'name': '5ème A - 2024', 'code': '5A-2024', 'course_id': course_ids[1], 'school_cycle': 'college', 'start_date': '2024-09-02', 'end_date': '2025-06-30'},
            {'name': '5ème B - 2024', 'code': '5B-2024', 'course_id': course_ids[1], 'school_cycle': 'college', 'start_date': '2024-09-02', 'end_date': '2025-06-30'},
        ])
    if len(course_ids) >= 3:
        batches_data.append({'name': '4ème A - 2024', 'code': '4A-2024', 'course_id': course_ids[2], 'school_cycle': 'college', 'start_date': '2024-09-02', 'end_date': '2025-06-30'})
    if len(course_ids) >= 4:
        batches_data.append({'name': '3ème A - 2024', 'code': '3A-2024', 'course_id': course_ids[3], 'school_cycle': 'college', 'start_date': '2024-09-02', 'end_date': '2025-06-30'})
    if len(course_ids) >= 5:
        batches_data.append({'name': '2nde A - 2024', 'code': '2A-2024', 'course_id': course_ids[4], 'school_cycle': 'lycee', 'start_date': '2024-09-02', 'end_date': '2025-06-30'})
    
    print(f"Création de {len(batches_data)} batches pour {len(course_ids)} cours disponibles")
    
    batch_ids = []
    for batch_data in batches_data:
        # Vérifier si le batch existe déjà
        existing = odoo.env['op.batch'].search([('code', '=', batch_data['code'])])
        if not existing:
            # Convertir les dates string en objets date
            if isinstance(batch_data['start_date'], str):
                batch_data['start_date'] = batch_data['start_date']
            if isinstance(batch_data['end_date'], str):
                batch_data['end_date'] = batch_data['end_date']
                
            batch_id = odoo.env['op.batch'].create(batch_data)
            batch_ids.append(batch_id)
            print(f"✅ Batch créé: {batch_data['name']}")
        else:
            print(f"⚠️  Batch existe déjà: {batch_data['name']}")
            batch_ids.append(existing[0])
    
    print(f"\n🎉 === CRÉATION TERMINÉE ===")
    print(f"📊 Types d'évaluation: {len(evaluation_type_ids)}")
    print(f"📚 Matières: {len(subject_ids)}")
    print(f"🎓 Cours: {len(course_ids)}")
    print(f"👥 Batches: {len(batch_ids)}")
    
    return {
        'evaluation_types': evaluation_type_ids,
        'subjects': subject_ids,
        'courses': course_ids,
        'batches': batch_ids
    }

if __name__ == "__main__":
    try:
        result = create_demo_data()
        print(f"\n✅ Script terminé avec succès!")
        print(f"   Types d'évaluation: {len(result['evaluation_types'])}")
        print(f"   Matières: {len(result['subjects'])}")
        print(f"   Cours: {len(result['courses'])}")
        print(f"   Batches: {len(result['batches'])}")
    except Exception as e:
        print(f"\n❌ Erreur lors de l'exécution: {str(e)}")
        import traceback
        traceback.print_exc() 