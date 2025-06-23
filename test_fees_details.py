#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json
import time

# Configuration
BASE_URL = "http://localhost:8069"
session_id = "9b1d5716d7aada6db8629bc8f26e39b53e7fd570"  # Session ID du frontend

def test_fees_details():
    """Test de récupération des détails de frais"""
    
    headers = {
        'Content-Type': 'application/json',
        'Cookie': f'session_id={session_id}'
    }
    
    try:
        print("🧪 Test de récupération des détails de frais...")
        
        response = requests.get(
            f"{BASE_URL}/api/fees/details",
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get('status') == 'success':
                details = result['data']['fees_details']
                print(f"✅ Test réussi ! {len(details)} détails de frais récupérés.")
                
                if details:
                    print("📋 Premier détail:")
                    first_detail = details[0]
                    print(f"   - ID: {first_detail['id']}")
                    print(f"   - Étudiant: {first_detail['student']['name']}")
                    print(f"   - Montant: {first_detail['amount']}")
                    print(f"   - Parent: {first_detail['parent']['name']}")
                
                return True
            else:
                print(f"❌ Erreur dans la réponse: {result.get('message')}")
                return False
        else:
            print(f"❌ Erreur HTTP: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False

def test_fees_statistics():
    """Test des statistiques"""
    
    headers = {
        'Content-Type': 'application/json',
        'Cookie': f'session_id={session_id}'
    }
    
    try:
        print("\n📊 Test des statistiques des frais...")
        
        response = requests.get(
            f"{BASE_URL}/api/fees/statistics",
            headers=headers,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get('status') == 'success':
                stats = result['data']
                print(f"✅ Statistiques récupérées:")
                print(f"   - Termes de frais: {stats['terms']['total']}")
                print(f"   - Détails de frais: {stats['details']['total']}")
                print(f"   - Montant total: {stats['amounts']['total_amount']}")
                return True
            else:
                print(f"❌ Erreur: {result.get('message')}")
                return False
        else:
            print(f"❌ Erreur HTTP: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Test des APIs de frais après correction parent_id\n")
    
    # Attendre que le serveur démarre
    print("⏳ Attente du démarrage du serveur...")
    time.sleep(5)
    
    success_count = 0
    total_tests = 2
    
    if test_fees_details():
        success_count += 1
        
    if test_fees_statistics():
        success_count += 1
    
    print(f"\n📝 Résultats: {success_count}/{total_tests} tests réussis")
    
    if success_count == total_tests:
        print("🎉 Tous les tests sont passés ! Le problème parent_id est résolu.")
    else:
        print("⚠️  Certains tests ont échoué. Vérifiez les logs.") 