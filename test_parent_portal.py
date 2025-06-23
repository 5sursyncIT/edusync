#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json
import sys

class ParentPortalTester:
    def __init__(self, base_url="http://localhost:8069"):
        self.base_url = base_url
        self.session = requests.Session()
        self.parent_info = None
        
    def login(self, email, password):
        """Connexion parent"""
        print(f"🔐 Connexion parent avec {email}...")
        
        url = f"{self.base_url}/api/parent/login"
        data = {
            "email": email,
            "password": password
        }
        
        response = self.session.post(url, json=data)
        result = response.json()
        
        if result.get('status') == 'success':
            self.parent_info = result.get('parent')
            print(f"✅ Connexion réussie pour {self.parent_info['name']}")
            print(f"   ID Parent: {self.parent_info['id']}")
            print(f"   Email: {self.parent_info['email']}")
            print(f"   Relation: {self.parent_info['relationship']}")
            return True
        else:
            print(f"❌ Échec de connexion: {result.get('message')}")
            return False
    
    def get_children(self):
        """Récupérer la liste des enfants"""
        try:
            response = self.session.get(f"{self.base_url}/api/parent/children")
            
            if response.status_code == 200:
                data = response.json()
                if data['status'] == 'success':
                    children = data['data']['children']
                    print(f"✅ {len(children)} enfant(s) trouvé(s):")
                    for child in children:
                        print(f"   - {child['name']} (ID: {child['id']})")
                        print(f"     Email: {child['email']}")
                        print(f"     Téléphone: {child.get('phone', 'N/A')}")
                        
                        # Afficher les cours (nouveau format)
                        if child.get('courses') and len(child['courses']) > 0:
                            courses_names = [course['name'] for course in child['courses']]
                            print(f"     Cours: {', '.join(courses_names)}")
                        else:
                            print(f"     Cours: N/A")
                        
                        print(f"     Niveau: {child.get('school_level', 'N/A')}")
                        print(f"     Actif: {'Oui' if child['active'] else 'Non'}")
                    return children
                else:
                    print(f"❌ Erreur: {data['message']}")
                    return []
            else:
                print(f"❌ Erreur HTTP {response.status_code}: {response.text}")
                return []
                
        except Exception as e:
            print(f"❌ Erreur: {e}")
            return []
    
    def get_student_dashboard(self, student_id):
        """Récupérer le dashboard d'un étudiant"""
        try:
            response = self.session.get(f"{self.base_url}/api/parent/student/{student_id}/dashboard")
            
            if response.status_code == 200:
                data = response.json()
                if data['status'] == 'success':
                    dashboard = data['data']
                    print(f"✅ Dashboard récupéré:")
                    print(f"   Étudiant: {dashboard['student_info']['name']}")
                    print(f"   Numéro: {dashboard['student_info'].get('gr_no', 'N/A')}")
                    # Utiliser courses au lieu de course
                    if dashboard['student_info'].get('courses'):
                        courses_str = ', '.join(dashboard['student_info']['courses'])
                        print(f"   Cours: {courses_str}")
                    else:
                        print(f"   Cours: N/A")
                    print(f"   Niveau: {dashboard['student_info'].get('school_level', 'N/A')}")
                    
                    # Statistiques de présence
                    attendance = dashboard['attendance']
                    print(f"   Présences (30 derniers jours):")
                    print(f"     - Total: {attendance['total_days']} jours")
                    print(f"     - Présent: {attendance['present_days']} jours")
                    print(f"     - Absent: {attendance['absent_days']} jours")
                    print(f"     - Taux: {attendance['attendance_rate']}%")
                    
                    # Sessions à venir
                    sessions = dashboard['upcoming_sessions']
                    print(f"   Prochaines sessions: {len(sessions)}")
                    for session in sessions[:3]:  # Afficher les 3 premières
                        print(f"     - {session['name']}: {session.get('subject', 'N/A')}")
                    
                    return dashboard
                else:
                    print(f"❌ Erreur: {data['message']}")
                    return None
            else:
                print(f"❌ Erreur HTTP {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Erreur: {e}")
            return None
    
    def get_student_info(self, student_id):
        """Récupérer les informations détaillées d'un étudiant"""
        try:
            response = self.session.get(f"{self.base_url}/api/parent/student/{student_id}/info")
            
            if response.status_code == 200:
                data = response.json()
                if data['status'] == 'success':
                    student = data['data']
                    print(f"✅ Informations détaillées:")
                    print(f"   Nom complet: {student.get('first_name', '')} {student.get('last_name', '')}")
                    print(f"   Email: {student['email']}")
                    print(f"   Téléphone: {student.get('phone', 'N/A')}")
                    print(f"   Mobile: {student.get('mobile', 'N/A')}")
                    print(f"   Date de naissance: {student.get('birth_date', 'N/A')}")
                    print(f"   Genre: {student.get('gender', 'N/A')}")
                    print(f"   Nationalité: {student.get('nationality', 'N/A')}")
                    print(f"   Niveau scolaire: {student.get('school_level', 'N/A')}")
                    
                    # Cours
                    if student.get('courses') and len(student['courses']) > 0:
                        print(f"   Cours inscrits:")
                        for course in student['courses']:
                            print(f"     - {course['name']} ({course.get('code', 'N/A')})")
                    else:
                        print(f"   Cours: Aucun cours inscrit")
                    
                    return student
                else:
                    print(f"❌ Erreur: {data['message']}")
                    return None
            else:
                print(f"❌ Erreur HTTP {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Erreur: {e}")
            return None
    
    def get_student_attendance(self, student_id):
        """Récupérer les présences d'un étudiant"""
        try:
            response = self.session.get(f"{self.base_url}/api/parent/student/{student_id}/attendance?limit=10")
            
            if response.status_code == 200:
                data = response.json()
                if data['status'] == 'success':
                    attendances = data['data']['attendances']
                    stats = data['data']['statistics']
                    
                    print(f"✅ Présences récupérées:")
                    print(f"   Total enregistrements: {stats['total_records']}")
                    print(f"   Présent: {stats['present_count']}")
                    print(f"   Absent: {stats['absent_count']}")
                    print(f"   Taux de présence: {stats['attendance_rate']}%")
                    
                    print(f"   Dernières présences:")
                    for attendance in attendances[:5]:  # 5 dernières
                        status = "✅ Présent" if attendance['present'] else "❌ Absent"
                        print(f"     - {attendance['date']}: {status}")
                        if attendance.get('session_name'):
                            print(f"       Session: {attendance['session_name']}")
                        if attendance.get('subject'):
                            print(f"       Matière: {attendance['subject']}")
                    
                    return attendances
                else:
                    print(f"❌ Erreur: {data['message']}")
                    return []
            else:
                print(f"❌ Erreur HTTP {response.status_code}: {response.text}")
                return []
                
        except Exception as e:
            print(f"❌ Erreur: {e}")
            return []
    
    def get_student_timetable(self, student_id):
        """Récupérer l'emploi du temps d'un étudiant"""
        try:
            response = self.session.get(f"{self.base_url}/api/parent/student/{student_id}/timetable")
            
            if response.status_code == 200:
                data = response.json()
                if data['status'] == 'success':
                    timetable = data['data']['timetable']
                    student_info = data['data']['student_info']
                    
                    print(f"✅ Emploi du temps récupéré:")
                    print(f"   Étudiant: {student_info['name']}")
                    print(f"   Niveau: {student_info.get('school_level', 'N/A')}")
                    print(f"   Sessions trouvées: {len(timetable)}")
                    
                    for session in timetable[:5]:  # 5 premières sessions
                        print(f"     - {session['name']}")
                        print(f"       Matière: {session.get('subject', 'N/A')}")
                        print(f"       Enseignant: {session.get('teacher', 'N/A')}")
                        if session.get('start_datetime'):
                            print(f"       Début: {session['start_datetime']}")
                        print(f"       État: {session.get('state', 'N/A')}")
                    
                    return timetable
                else:
                    print(f"❌ Erreur: {data['message']}")
                    return []
            else:
                print(f"❌ Erreur HTTP {response.status_code}: {response.text}")
                return []
                
        except Exception as e:
            print(f"❌ Erreur: {e}")
            return []
    
    def logout(self):
        """Déconnexion"""
        print("\n🚪 Déconnexion...")
        
        url = f"{self.base_url}/api/parent/logout"
        response = self.session.post(url)
        result = response.json()
        
        if result.get('status') == 'success':
            print("✅ Déconnexion réussie")
            return True
        else:
            print(f"❌ Erreur de déconnexion: {result.get('message')}")
            return False
    
    def run_full_test(self):
        """Exécuter tous les tests du portail parent"""
        try:
            # 1. Connexion
            print("🔐 Connexion parent avec marie.dupont@parent.test...")
            if not self.login("marie.dupont@parent.test", "parent123"):
                print("❌ Échec de la connexion")
                return False
            
            # 2. Récupérer les enfants
            print("\n👶 Récupération de la liste des enfants...")
            children = self.get_children()
            if not children:
                print("Aucun enfant trouvé, arrêt des tests")
                return False
            
            # 3. Tests pour le premier enfant
            student_id = children[0]['id']
            
            # Dashboard
            print(f"\n📊 Dashboard pour l'étudiant ID {student_id}...")
            dashboard = self.get_student_dashboard(student_id)
            if not dashboard:
                print("❌ Échec récupération dashboard")
                return False
            
            # Informations détaillées
            print(f"\n📋 Informations détaillées pour l'étudiant ID {student_id}...")
            info = self.get_student_info(student_id)
            if not info:
                print("❌ Échec récupération informations")
                return False
            
            # Présences
            print(f"\n📅 Présences pour l'étudiant ID {student_id}...")
            attendance = self.get_student_attendance(student_id)
            if attendance is None:
                print("❌ Échec récupération présences")
                return False
            
            # Emploi du temps
            print(f"\n🗓️ Emploi du temps pour l'étudiant ID {student_id}...")
            timetable = self.get_student_timetable(student_id)
            if timetable is None:
                print("❌ Échec récupération emploi du temps")
                return False
            
            # 4. Déconnexion
            print("\n🚪 Déconnexion...")
            if not self.logout():
                print("❌ Échec de la déconnexion")
                return False
            
            print("\n✅ Tous les tests ont réussi!")
            return True
            
        except Exception as e:
            print(f"\n❌ Erreur pendant les tests: {e}")
            return False

def main():
    tester = ParentPortalTester()
    success = tester.run_full_test()
    
    if success:
        print("\n✅ Tous les tests du portail parent ont réussi!")
        sys.exit(0)
    else:
        print("\n❌ Certains tests ont échoué")
        sys.exit(1)

if __name__ == '__main__':
    main() 