#!/usr/bin/env python3
"""
Script de test pour l'API de gestion des parents - Création de comptes portal
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8069"
HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

def test_parents_portal_api():
    """Tester les endpoints de gestion des comptes portal"""
    
    print("🧪 Test de l'API Parents - Comptes Portal")
    print("=" * 50)
    
    # 1. Récupérer la liste des parents
    print("\n1. 📋 Récupération de la liste des parents...")
    try:
        response = requests.get(f"{BASE_URL}/api/parents", headers=HEADERS)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            parents = data.get('data', {}).get('parents', [])
            print(f"   ✅ {len(parents)} parents trouvés")
            
            # Chercher un parent sans compte portal
            parent_without_portal = None
            for parent in parents:
                if not parent.get('has_portal_access', False):
                    parent_without_portal = parent
                    break
            
            if parent_without_portal:
                print(f"   🎯 Parent sélectionné pour test: {parent_without_portal['name']} (ID: {parent_without_portal['id']})")
                
                # 2. Tester la création du compte portal
                print(f"\n2. 🔐 Création du compte portal pour le parent {parent_without_portal['id']}...")
                
                portal_response = requests.post(
                    f"{BASE_URL}/api/parents/{parent_without_portal['id']}/create-portal-user",
                    headers=HEADERS
                )
                
                print(f"   Status: {portal_response.status_code}")
                
                if portal_response.status_code == 200:
                    portal_data = portal_response.json()
                    print(f"   ✅ {portal_data.get('message', 'Compte créé')}")
                    
                    if portal_data.get('status') == 'success':
                        user_data = portal_data.get('data', {})
                        print(f"   👤 User ID: {user_data.get('user_id')}")
                        print(f"   📧 Login: {user_data.get('login')}")
                        
                        # 3. Vérifier que le parent a maintenant un compte
                        print(f"\n3. ✅ Vérification du compte créé...")
                        check_response = requests.get(f"{BASE_URL}/api/parents/{parent_without_portal['id']}", headers=HEADERS)
                        
                        if check_response.status_code == 200:
                            check_data = check_response.json()
                            parent_data = check_data.get('data', {})
                            
                            if parent_data.get('has_portal_access'):
                                print(f"   ✅ Le parent a maintenant accès au portal!")
                                print(f"   👤 User ID: {parent_data.get('user_id')}")
                            else:
                                print(f"   ❌ Le parent n'a toujours pas accès au portal")
                        else:
                            print(f"   ❌ Erreur lors de la vérification: {check_response.status_code}")
                    else:
                        print(f"   ❌ Erreur: {portal_data.get('message')}")
                else:
                    print(f"   ❌ Erreur HTTP: {portal_response.status_code}")
                    try:
                        error_data = portal_response.json()
                        print(f"   💥 Message: {error_data.get('message', 'Erreur inconnue')}")
                    except:
                        print(f"   💥 Réponse brute: {portal_response.text}")
            else:
                print("   ℹ️  Tous les parents ont déjà un compte portal")
        else:
            print(f"   ❌ Erreur: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"   💥 Erreur de connexion: {e}")
    
    # 4. Tester les statistiques
    print(f"\n4. 📊 Récupération des statistiques...")
    try:
        stats_response = requests.get(f"{BASE_URL}/api/parents/statistics", headers=HEADERS)
        print(f"   Status: {stats_response.status_code}")
        
        if stats_response.status_code == 200:
            stats_data = stats_response.json()
            stats = stats_data.get('data', {})
            
            parents_stats = stats.get('parents', {})
            print(f"   👨‍👩‍👧‍👦 Parents total: {parents_stats.get('total', 0)}")
            print(f"   🔐 Avec portal: {parents_stats.get('with_portal', 0)}")
            print(f"   🚫 Sans portal: {parents_stats.get('without_portal', 0)}")
            
            students_stats = stats.get('students', {})
            print(f"   🎓 Étudiants avec parents: {students_stats.get('with_parents', 0)}")
            print(f"   📈 Taux de couverture: {students_stats.get('coverage_rate', 0)}%")
        else:
            print(f"   ❌ Erreur: {stats_response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"   💥 Erreur de connexion: {e}")

if __name__ == "__main__":
    test_parents_portal_api() 