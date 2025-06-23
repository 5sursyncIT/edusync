#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de test pour les APIs Parents
"""
import requests
import json
import sys

# Configuration
BASE_URL = "http://localhost:8069"
HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

def test_api_endpoint(method, endpoint, data=None, expected_status=200):
    """Test un endpoint API"""
    url = f"{BASE_URL}{endpoint}"
    
    print(f"\n🔍 Test {method} {endpoint}")
    print(f"URL: {url}")
    
    try:
        if method == 'GET':
            response = requests.get(url, headers=HEADERS, timeout=10)
        elif method == 'POST':
            response = requests.post(url, headers=HEADERS, json=data, timeout=10)
        elif method == 'PUT':
            response = requests.put(url, headers=HEADERS, json=data, timeout=10)
        elif method == 'DELETE':
            response = requests.delete(url, headers=HEADERS, timeout=10)
        else:
            print(f"❌ Méthode {method} non supportée")
            return False
            
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == expected_status:
            print("✅ Status code correct")
        else:
            print(f"❌ Status code incorrect (attendu: {expected_status})")
            
        # Afficher la réponse
        if response.headers.get('content-type', '').startswith('application/json'):
            try:
                json_response = response.json()
                print("Réponse JSON:")
                print(json.dumps(json_response, indent=2, ensure_ascii=False))
                return json_response
            except json.JSONDecodeError:
                print("❌ Réponse JSON invalide")
                print(f"Contenu brut: {response.text[:500]}")
        else:
            print(f"Réponse (texte): {response.text[:500]}")
            
        return response.status_code == expected_status
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Erreur de requête: {e}")
        return False

def main():
    """Fonction principale de test"""
    print("=" * 60)
    print("🧪 TEST DES APIs PARENTS")
    print("=" * 60)
    
    # Test 1: Statistiques des parents
    print("\n" + "="*50)
    print("📊 TEST 1: Statistiques des parents")
    print("="*50)
    test_api_endpoint('GET', '/api/parents/statistics')
    
    # Test 2: Liste des parents
    print("\n" + "="*50)
    print("👥 TEST 2: Liste des parents")
    print("="*50)
    parents_response = test_api_endpoint('GET', '/api/parents')
    
    # Test 3: Liste des parents avec pagination
    print("\n" + "="*50)
    print("📄 TEST 3: Parents avec pagination")
    print("="*50)
    test_api_endpoint('GET', '/api/parents?page=1&limit=5')
    
    # Test 4: Recherche de parents
    print("\n" + "="*50)
    print("🔍 TEST 4: Recherche de parents")
    print("="*50)
    test_api_endpoint('GET', '/api/parents?search=parent')
    
    # Test 5: Relations parent-étudiant
    print("\n" + "="*50)
    print("🔗 TEST 5: Relations parent-étudiant")
    print("="*50)
    test_api_endpoint('GET', '/api/parents/relationships')
    
    # Test 6: Liste des étudiants
    print("\n" + "="*50)
    print("🎓 TEST 6: Liste des étudiants")
    print("="*50)
    students_response = test_api_endpoint('GET', '/api/students')
    
    # Test 7: Étudiants avec parents
    print("\n" + "="*50)
    print("👨‍👩‍👧‍👦 TEST 7: Étudiants avec parents")
    print("="*50)
    test_api_endpoint('GET', '/api/students?include_parents=true')
    
    # Test 8: Création d'un parent (si pas de parent existant)
    print("\n" + "="*50)
    print("➕ TEST 8: Création d'un parent")
    print("="*50)
    
    # Récupérer d'abord la liste des étudiants pour en associer un
    students_resp = test_api_endpoint('GET', '/api/students?limit=1')
    
    if isinstance(students_resp, dict) and students_resp.get('status') == 'success':
        students = students_resp.get('data', {}).get('students', [])
        if students:
            student_id = students[0]['id']
            
            new_parent_data = {
                'name': 'Parent Test API',
                'email': 'parent.test@example.com',
                'mobile': '0123456789',
                'relationship': 'Father',
                'student_ids': [student_id]
            }
            
            creation_result = test_api_endpoint('POST', '/api/parents', new_parent_data, 201)
            
            # Si création réussie, tester la récupération et suppression
            if isinstance(creation_result, dict) and creation_result.get('status') == 'success':
                parent_id = creation_result.get('data', {}).get('parent', {}).get('id')
                
                if parent_id:
                    # Test 9: Récupération du parent créé
                    print("\n" + "="*50)
                    print("🔍 TEST 9: Récupération du parent créé")
                    print("="*50)
                    test_api_endpoint('GET', f'/api/parents/{parent_id}')
                    
                    # Test 10: Modification du parent
                    print("\n" + "="*50)
                    print("✏️ TEST 10: Modification du parent")
                    print("="*50)
                    update_data = {
                        'name': 'Parent Test API Modifié',
                        'mobile': '0987654321'
                    }
                    test_api_endpoint('PUT', f'/api/parents/{parent_id}', update_data)
                    
                    # Test 11: Suppression du parent
                    print("\n" + "="*50)
                    print("🗑️ TEST 11: Suppression du parent")
                    print("="*50)
                    test_api_endpoint('DELETE', f'/api/parents/{parent_id}', expected_status=200)
    
    print("\n" + "="*60)
    print("✅ TESTS TERMINÉS")
    print("="*60)

if __name__ == "__main__":
    main() 