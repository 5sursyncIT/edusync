#!/usr/bin/env python3
"""
Script de test pour l'API des étudiants avec parents
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8069"
API_URL = f"{BASE_URL}/api"

def test_login():
    """Test de connexion"""
    print("🔐 Test de connexion...")
    
    login_data = {
        "login": "admin",
        "password": "admin"
    }
    
    response = requests.post(f"{API_URL}/auth/login", json=login_data)
    
    if response.status_code == 200:
        data = response.json()
        if data.get('status') == 'success':
            print("✅ Connexion réussie")
            return response.cookies
        else:
            print(f"❌ Échec de connexion: {data.get('message')}")
            return None
    else:
        print(f"❌ Erreur HTTP {response.status_code}: {response.text}")
        return None

def test_students_with_parents(cookies):
    """Test de récupération des étudiants avec parents"""
    print("\n👨‍👩‍👧‍👦 Test des étudiants avec parents...")
    
    # Test avec include_parents=true
    params = {
        'page': 1,
        'limit': 10,
        'include_parents': 'true'
    }
    
    response = requests.get(f"{API_URL}/students", params=params, cookies=cookies)
    
    if response.status_code == 200:
        data = response.json()
        if data.get('status') == 'success':
            students = data.get('data', {}).get('students', [])
            print(f"✅ {len(students)} étudiants récupérés")
            
            # Analyser les données des parents
            students_with_parents = 0
            students_without_parents = 0
            
            for student in students:
                print(f"\n📚 Étudiant: {student.get('name', 'N/A')} (ID: {student.get('id')})")
                
                # Vérifier les champs parents
                has_parents = student.get('has_parents', False)
                parents = student.get('parents', [])
                primary_parent = student.get('primary_parent')
                
                print(f"   - A des parents: {has_parents}")
                print(f"   - Nombre de parents: {len(parents)}")
                
                if parents:
                    students_with_parents += 1
                    for i, parent in enumerate(parents):
                        print(f"   - Parent {i+1}:")
                        print(f"     * Nom: {parent.get('name', 'N/A')}")
                        print(f"     * Relation: {parent.get('relationship', 'N/A')}")
                        print(f"     * Mobile: {parent.get('mobile', 'N/A')}")
                        print(f"     * Email: {parent.get('email', 'N/A')}")
                        print(f"     * Accès portal: {parent.get('has_portal_access', False)}")
                else:
                    students_without_parents += 1
                    print("   - Aucun parent enregistré")
                
                if primary_parent:
                    print(f"   - Parent principal: {primary_parent.get('name', 'N/A')}")
            
            print(f"\n📊 Statistiques:")
            print(f"   - Étudiants avec parents: {students_with_parents}")
            print(f"   - Étudiants sans parents: {students_without_parents}")
            
            return True
        else:
            print(f"❌ Erreur API: {data.get('message')}")
            return False
    else:
        print(f"❌ Erreur HTTP {response.status_code}: {response.text}")
        return False

def test_parents_api(cookies):
    """Test de l'API des parents"""
    print("\n👨‍👩‍👧‍👦 Test de l'API des parents...")
    
    response = requests.get(f"{API_URL}/parents", cookies=cookies)
    
    if response.status_code == 200:
        data = response.json()
        if data.get('status') == 'success':
            parents = data.get('data', {}).get('parents', [])
            print(f"✅ {len(parents)} parents récupérés")
            
            for parent in parents[:3]:  # Afficher les 3 premiers
                print(f"\n👤 Parent: {parent.get('name', 'N/A')} (ID: {parent.get('id')})")
                print(f"   - Mobile: {parent.get('mobile', 'N/A')}")
                print(f"   - Email: {parent.get('email', 'N/A')}")
                print(f"   - Étudiants: {len(parent.get('students', []))}")
            
            return True
        else:
            print(f"❌ Erreur API: {data.get('message')}")
            return False
    else:
        print(f"❌ Erreur HTTP {response.status_code}: {response.text}")
        return False

def test_parent_relationships(cookies):
    """Test des relations parent-étudiant"""
    print("\n🔗 Test des relations parent-étudiant...")
    
    response = requests.get(f"{API_URL}/parents/relationships", cookies=cookies)
    
    if response.status_code == 200:
        data = response.json()
        if data.get('status') == 'success':
            relationships = data.get('data', {}).get('relationships', [])
            print(f"✅ {len(relationships)} relations récupérées")
            
            for rel in relationships[:5]:  # Afficher les 5 premières
                print(f"\n🔗 Relation:")
                print(f"   - Parent: {rel.get('parent_name', 'N/A')}")
                print(f"   - Étudiant: {rel.get('student_name', 'N/A')}")
                print(f"   - Relation: {rel.get('relationship', 'N/A')}")
            
            return True
        else:
            print(f"❌ Erreur API: {data.get('message')}")
            return False
    else:
        print(f"❌ Erreur HTTP {response.status_code}: {response.text}")
        return False

def main():
    """Fonction principale"""
    print("🚀 Démarrage des tests API - Étudiants avec Parents")
    print("=" * 60)
    
    # Test de connexion
    cookies = test_login()
    if not cookies:
        print("❌ Impossible de se connecter. Arrêt des tests.")
        return
    
    # Tests des APIs
    success_count = 0
    total_tests = 4
    
    if test_students_with_parents(cookies):
        success_count += 1
    
    if test_parents_api(cookies):
        success_count += 1
    
    if test_parent_relationships(cookies):
        success_count += 1
    
    # Test de déconnexion
    print("\n🔐 Test de déconnexion...")
    response = requests.post(f"{API_URL}/auth/logout", cookies=cookies)
    if response.status_code == 200:
        print("✅ Déconnexion réussie")
        success_count += 1
    else:
        print(f"❌ Erreur de déconnexion: {response.status_code}")
    
    # Résumé
    print("\n" + "=" * 60)
    print(f"📊 Résumé des tests: {success_count}/{total_tests} réussis")
    
    if success_count == total_tests:
        print("🎉 Tous les tests sont passés avec succès!")
    else:
        print(f"⚠️  {total_tests - success_count} test(s) ont échoué")

if __name__ == "__main__":
    main() 