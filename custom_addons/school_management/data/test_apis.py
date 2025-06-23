#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json

BASE_URL = "http://localhost:8069"

def test_api(endpoint, description):
    """Tester une API et afficher le résultat"""
    print(f"\n=== {description} ===")
    try:
        response = requests.get(f"{BASE_URL}{endpoint}", headers={"Content-Type": "application/json"})
        if response.status_code == 200:
            data = response.json()
            if data.get('status') == 'success':
                if 'data' in data:
                    if isinstance(data['data'], list):
                        print(f"✅ {len(data['data'])} éléments trouvés")
                        if data['data']:
                            print(f"   Premier élément: {data['data'][0]}")
                    elif isinstance(data['data'], dict):
                        if 'subjects' in data['data']:
                            print(f"✅ {len(data['data']['subjects'])} matières trouvées")
                        elif 'courses' in data['data']:
                            print(f"✅ {len(data['data']['courses'])} cours trouvés")
                        elif 'teachers' in data['data']:
                            print(f"✅ {len(data['data']['teachers'])} enseignants trouvés")
                        else:
                            print(f"✅ Données reçues: {list(data['data'].keys())}")
                else:
                    print("✅ Succès mais pas de données")
            else:
                print(f"❌ Erreur API: {data.get('message', 'Erreur inconnue')}")
        else:
            print(f"❌ Erreur HTTP {response.status_code}: {response.text[:200]}")
    except Exception as e:
        print(f"❌ Erreur de connexion: {e}")

def main():
    """Tester toutes les APIs nécessaires pour le formulaire d'examen"""
    print("🔍 Test des APIs pour le formulaire d'examen")
    
    # APIs nécessaires pour le formulaire d'examen
    apis_to_test = [
        ("/api/evaluation-types", "Types d'évaluation"),
        ("/api/subjects", "Matières"),
        ("/api/courses", "Cours"),
        ("/api/teachers", "Enseignants"),
        ("/api/batches", "Promotions/Batches"),
    ]
    
    for endpoint, description in apis_to_test:
        test_api(endpoint, description)
    
    print("\n" + "="*50)
    print("🎯 Résumé: Toutes les APIs nécessaires ont été testées")
    print("   Si toutes sont ✅, le formulaire d'examen devrait fonctionner!")

if __name__ == "__main__":
    main() 