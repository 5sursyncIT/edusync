# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
import logging

_logger = logging.getLogger(__name__)

class SchoolApi(models.Model):
    _name = 'school.api'
    _description = 'API pour l\'école'

    name = fields.Char('Nom', default='API')
    
    @api.model
    def dashboard(self):
        """Retourne les données du tableau de bord pour l'API JSON-RPC"""
        try:
            user = self.env.user
            
            # Préparer les données à retourner
            data = {
                'user': {
                    'id': user.id,
                    'name': user.name,
                    'email': user.email or '',
                },
                'stats': {
                    'students': self.env['school.student'].search_count([]),
                    'teachers': self.env['school.teacher'].search_count([]),
                    'courses': self.env['school.course'].search_count([]),
                }
            }
            
            # Ajouter des données de démo pour les enseignants
            data['recent_faculty'] = self._get_demo_faculties()
            
            return data
            
        except Exception as e:
            _logger.error(f"Erreur lors de la récupération des données du tableau de bord: {str(e)}")
            return {'error': str(e)}

    def _get_demo_faculties(self):
        """Retourne des données de démonstration pour les enseignants"""
        return [
            {
                'id': 1,
                'name': 'Sarah Johnson',
                'first_name': 'Sarah',
                'last_name': 'Johnson',
                'email': 'sarah.johnson@ecole.com',
                'phone': '123-456-7890',
                'speciality': 'Mathématiques',
                'subjects': [{'id': 1, 'name': 'Algèbre'}, {'id': 2, 'name': 'Géométrie'}],
                'classes': [1, 2]
            },
            {
                'id': 2,
                'name': 'Michael Brown',
                'first_name': 'Michael',
                'last_name': 'Brown',
                'email': 'michael.brown@ecole.com',
                'phone': '234-567-8901',
                'speciality': 'Français',
                'subjects': [{'id': 3, 'name': 'Grammaire'}, {'id': 4, 'name': 'Littérature'}],
                'classes': [3, 4]
            },
            {
                'id': 3,
                'name': 'Emma Wilson',
                'first_name': 'Emma',
                'last_name': 'Wilson',
                'email': 'emma.wilson@ecole.com',
                'phone': '345-678-9012',
                'speciality': 'Sciences',
                'subjects': [{'id': 5, 'name': 'Physique'}, {'id': 6, 'name': 'Chimie'}],
                'classes': [5, 6]
            }
        ] 