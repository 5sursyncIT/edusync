#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json
import time

# Configuration
BASE_URL = "http://localhost:8069"
session_id = "9b1d5716d7aada6db8629bc8f26e39b53e7fd570"

def debug_parent_structure():
    """Debug de la structure des parents"""
    
    headers = {
        'Content-Type': 'application/json',
        'Cookie': f'session_id={session_id}'
    }
    
    try:
        print("🔍 Debug de la structure des parents...")
        
        # Récupérer les étudiants
        response = requests.get(
            f"{BASE_URL}/api/students?page=1&limit=5",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('status') == 'success':
                students = result['data']['students']
                
                for student in students:
                    print(f"\n👤 Étudiant: {student.get('name', 'N/A')}")
                    print(f"   ID: {student.get('id')}")
                    
                    # Récupérer les détails du parent via une autre API si possible
                    if 'parent_ids' in student:
                        print(f"   Parent IDs: {student['parent_ids']}")
                    
                    if 'father_name' in student:
                        print(f"   Père: {student.get('father_name', 'N/A')}")
                    
                    if 'mother_name' in student:
                        print(f"   Mère: {student.get('mother_name', 'N/A')}")
                        
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
    print("🚀 Debug de la structure des parents dans OpenEduCat\n")
    
    time.sleep(2)
    debug_parent_structure() 