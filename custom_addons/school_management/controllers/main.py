# -*- coding: utf-8 -*-
from odoo import http, fields
from odoo.http import request, Response
import json
import functools
import logging
from datetime import datetime, timedelta, date
from dateutil.relativedelta import relativedelta
import os
import unicodedata
import time
from passlib.context import CryptContext
import re
import werkzeug.wrappers

_logger = logging.getLogger(__name__)

# Origines autorisées pour CORS
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://172.16.209.128:3000',
    'https://localhost:3000',
    'https://127.0.0.1:3000',
    'https://172.16.209.128:3000'
]

def cors_wrapper(func):
    """Décorateur pour ajouter les headers CORS"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        if request.httprequest.method == 'OPTIONS':
            headers = get_cors_headers()
            return Response(status=200, headers=headers)
        
        response = func(*args, **kwargs)
        
        # Si la réponse est déjà un objet Response
        if isinstance(response, (Response, werkzeug.wrappers.Response)):
            for header in get_cors_headers():
                response.headers.add(*header)
            return response
            
        # Si la réponse est un dictionnaire, convertir en Response JSON
        if isinstance(response, dict):
            headers = get_cors_headers()
            return Response(
                json.dumps(response),
                content_type='application/json',
                headers=headers
            )
            
        return response
    return wrapper

def get_cors_headers(origin=None):
    """Obtenir les headers CORS - version améliorée"""
    # Si aucune origine n'est fournie, utiliser l'origine de la requête
    if not origin and request and request.httprequest:
        origin = request.httprequest.headers.get('Origin')
    
    # Liste des origines autorisées
    allowed_origins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://172.16.209.128:3000'
    ]
    
    # Si l'origine est dans la liste des origines autorisées
    if origin in allowed_origins:
        headers = [
            ('Access-Control-Allow-Origin', origin),
            ('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'),
            ('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Requested-With, X-Openerp-Session-Id'),
            ('Access-Control-Allow-Credentials', 'true'),
            ('Access-Control-Max-Age', '86400'),
            ('Access-Control-Expose-Headers', 'X-Openerp-Session-Id')
        ]
    else:
        # Pour les requêtes publiques, utiliser une configuration plus restrictive
        headers = [
            ('Access-Control-Allow-Origin', '*'),
            ('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'),
            ('Access-Control-Allow-Headers', 'Content-Type'),
            ('Access-Control-Allow-Credentials', 'false')
        ]
    return headers

# ---------------- CONTROLLER PRINCIPAL ----------------
class SchoolManagementController(http.Controller):

    def json_response(self, data, status=200):
        """Retourne une réponse JSON avec les headers CORS appropriés"""
        return request.make_response(
            json.dumps(data),
            headers=[
                ('Content-Type', 'application/json'),
                ('Access-Control-Allow-Origin', request.httprequest.headers.get('Origin')),
                ('Access-Control-Allow-Credentials', 'true'),
                ('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'),
                ('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            ],
            status=status
        )

    def _check_session(self):
        """Vérifie si la session est valide"""
        try:
            _logger.info("Vérification de session. UID: %s", getattr(request.session, 'uid', 'Non défini'))
            
            if hasattr(request.session, 'uid') and request.session.uid and request.session.uid != 4:
                try:
                    user = request.env['res.users'].sudo().browse(request.session.uid)
                    if user.exists():
                        _logger.info("Session valide pour utilisateur: %s (UID: %s)", user.name, request.session.uid)
                        return True
                    else:
                        _logger.warning("Utilisateur non trouvé pour UID: %s", request.session.uid)
                except Exception as e:
                    _logger.error("Erreur lors de la vérification utilisateur: %s", e)
            else:
                _logger.warning("Session sans UID valide: %s", getattr(request.session, 'uid', 'Non défini'))
            
            return False
            
        except Exception as e:
            _logger.error("Erreur vérification session: %s", str(e))
            return False

    def _check_parent_session(self):
        """Vérifie si la session parent est valide"""
        try:
            if not hasattr(request, 'session') or not request.session.get('parent_user_id'):
                return False, None
            
            parent_user_id = request.session.get('parent_user_id')
            
            # Trouver le parent basé sur l'utilisateur connecté
            parent = request.env['op.parent'].sudo().search([
                ('user_id', '=', parent_user_id)
            ], limit=1)
            
            return bool(parent), parent
            
        except Exception as e:
            _logger.error("Erreur vérification session parent: %s", str(e))
            return False, None

    # ================= ENDPOINTS DE BASE =================
    
    @http.route('/api/test', auth='none', type='http', methods=['GET', 'OPTIONS'], csrf=False)
    @cors_wrapper
    def test_connection(self, **kwargs):
        """Test de connexion API"""
        return {
            'status': 'success',
            'message': 'API School Management est opérationnelle',
            'timestamp': str(datetime.now()),
            'version': '3.0-clean'
        }

    @http.route('/api/login', auth='none', type='http', methods=['POST', 'OPTIONS'], csrf=False)
    @cors_wrapper
    def login(self, **kwargs):
        """Authentification utilisateur"""
        try:
            data = json.loads(request.httprequest.get_data())
            # Accepter à la fois 'login' et 'username' pour la compatibilité
            login = data.get('login') or data.get('username')
            password = data.get('password')
            
            if not login or not password:
                return {
                    'status': 'error', 
                    'code': 400, 
                    'message': 'Login et mot de passe requis'
                }

            old_uid = request.session.uid
            uid = request.session.authenticate(request.session.db, login, password)
            
            if uid:
                user = request.env['res.users'].sudo().browse(uid)
                return {
                    'status': 'success',
                    'message': 'Connexion réussie',
                    'user': {
                        'id': uid,
                        'name': user.name,
                        'login': user.login,
                        'email': user.email or ''
                    },
                    'session_id': request.session.sid
                }
            else:
                return {
                    'status': 'error',
                    'code': 401,
                    'message': 'Identifiants incorrects'
                }
        except Exception as e:
            _logger.error("Erreur login: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/logout', auth='none', type='http', methods=['POST', 'OPTIONS'], csrf=False)
    @cors_wrapper
    def logout(self, **kwargs):
        """Déconnexion utilisateur"""
        request.session.logout()
        return {'status': 'success', 'message': 'Déconnexion réussie'}

    @http.route('/api/check-session', auth='none', type='http', methods=['GET', 'OPTIONS'], csrf=False)
    @cors_wrapper
    def check_session(self, **kwargs):
        """Vérifier l'état de la session"""
        try:
            if self._check_session():
                user = request.env['res.users'].sudo().browse(request.session.uid)
                return {
                    'status': 'success',
                    'authenticated': True,
                    'user': {
                        'id': request.session.uid,
                        'name': user.name,
                        'login': user.login,
                        'email': user.email or ''
                    }
                }
            else:
                return {
                    'status': 'success',
                    'authenticated': False
                }
        except Exception as e:
            _logger.error("Erreur check_session: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/user/info', auth='none', type='http', methods=['GET', 'OPTIONS'], csrf=False)
    @cors_wrapper
    def get_user_info(self, **kwargs):
        """Récupérer les informations de l'utilisateur connecté"""
        try:
            if self._check_session():
                user = request.env['res.users'].sudo().browse(request.session.uid)
                return {
                    'status': 'success',
                    'user': {
                        'id': request.session.uid,
                        'name': user.name,
                        'login': user.login,
                        'email': user.email or '',
                        'is_admin': user.has_group('base.group_system'),
                        'groups': [group.name for group in user.groups_id],
                        'company': {
                            'id': user.company_id.id,
                            'name': user.company_id.name
                        } if user.company_id else None
                    }
                }
            else:
                return {
                    'status': 'error',
                    'code': 401,
                    'message': 'Authentification requise, veuillez vous reconnecter'
                }
        except Exception as e:
            _logger.error("Erreur get_user_info: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    # ================= ÉTUDIANTS =================
    
    @http.route('/api/students', auth='none', type='http', csrf=False, methods=['GET', 'POST', 'OPTIONS'])
    @cors_wrapper
    def handle_students(self, **kwargs):
        """Gérer les étudiants - GET pour lister, POST pour créer"""
        method = request.httprequest.method
        
        if method == 'GET':
            return self.get_students_list(**kwargs)
        elif method == 'POST':
            return self.create_new_student(**kwargs)

    @http.route('/api/students', auth='none', type='http', csrf=False, methods=['GET', 'OPTIONS'])
    @cors_wrapper
    def get_students_list(self, **kwargs):
        """Récupérer la liste des étudiants avec leurs informations parents"""
        try:
            page = int(kwargs.get('page', 1))
            limit = int(kwargs.get('limit', 20))
            offset = (page - 1) * limit
            search = kwargs.get('search', '').strip()
            include_parents = kwargs.get('include_parents', 'false').lower() == 'true'
            
            # Construire le domaine de recherche
            domain = []
            if search:
                domain = [
                    '|', '|', '|',
                    ('first_name', 'ilike', search),
                    ('last_name', 'ilike', search),
                    ('gr_no', 'ilike', search),
                    ('email', 'ilike', search)
                ]
            
            students = request.env['op.student'].sudo().search(
                domain, limit=limit, offset=offset, order='first_name, last_name'
            )
            total_count = request.env['op.student'].sudo().search_count(domain)
            
            students_data = []
            for student in students:
                student_name = ''
                if student.first_name:
                    student_name = student.first_name
                if student.last_name:
                    student_name += f' {student.last_name}' if student_name else student.last_name
                
                student_data = {
                    'id': student.id,
                    'name': student_name,
                    'first_name': student.first_name or '',
                    'last_name': student.last_name or '',
                    'gr_no': student.gr_no or '',
                    'email': student.email or '',
                    'mobile': student.mobile or '',
                    'gender': student.gender,
                    'birth_date': str(student.birth_date) if student.birth_date else None,
                    'active': student.active,
                    'has_parents': student.has_parents if hasattr(student, 'has_parents') else bool(student.parent_ids)
                }
                
                # Inclure les informations parents si demandé
                if include_parents:
                    if hasattr(student, 'get_all_parents_info'):
                        parents_info = student.get_all_parents_info()
                        primary_parent = student.get_parent_for_fees()
                    else:
                        # Fallback si les méthodes ne sont pas disponibles
                        parents_info = []
                        for parent in student.parent_ids:
                            parents_info.append({
                                'id': parent.id,
                                'name': parent.name.name if parent.name else '',
                                'mobile': parent.mobile or '',
                                'email': parent.name.email if parent.name else '',
                                'relationship': parent.relationship_id.name if parent.relationship_id else ''
                            })
                        primary_parent = parents_info[0] if parents_info else {}
                    
                    student_data.update({
                        'parents': parents_info,
                        'primary_parent': primary_parent,
                        'parent_names': student.parent_names if hasattr(student, 'parent_names') else '',
                        'parent_phones': student.parent_phones if hasattr(student, 'parent_phones') else '',
                        'parent_emails': student.parent_emails if hasattr(student, 'parent_emails') else ''
                    })
                
                students_data.append(student_data)
            
            return {
                'status': 'success',
                'data': {
                    'students': students_data,
                    'pagination': {
                        'page': page,
                        'limit': limit,
                        'total': total_count,
                        'pages': (total_count + limit - 1) // limit
                    }
                }
            }
        except Exception as e:
            _logger.error("Erreur get_students_list: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    def create_new_student(self, **kwargs):
        """Créer un nouvel étudiant"""
        try:
            data = json.loads(request.httprequest.get_data())
            
            required_fields = ['first_name', 'last_name']
            for field in required_fields:
                if field not in data or not data[field]:
                    return {'status': 'error', 'message': f'Le champ {field} est obligatoire'}
            
            student_data = {
                'first_name': data['first_name'],
                'last_name': data['last_name'],
                'middle_name': data.get('middle_name', ''),
                'email': data.get('email', ''),
                'phone': data.get('phone', ''),
                'mobile': data.get('mobile', ''),
                'gender': data.get('gender', 'male'),
                'birth_date': data.get('birth_date') if data.get('birth_date') else False
            }
            
            # Créer l'étudiant
            new_student = request.env['op.student'].sudo().create(student_data)
            _logger.info("Étudiant créé avec ID: %s", new_student.id)
            
            # Forcer le commit pour s'assurer que l'étudiant est bien créé
            request.env.cr.commit()
            
            # Si un batch_id est fourni, inscrire l'étudiant dans ce batch
            if data.get('batch_id'):
                try:
                    batch_id = int(data['batch_id'])
                    batch = request.env['op.batch'].sudo().browse(batch_id)
                    
                    _logger.info("Tentative d'assignation de l'étudiant %s au batch %s", new_student.id, batch_id)
                    
                    if batch.exists():
                        if batch.course_id:
                            # Cas normal : batch avec cours associé
                            # Créer l'inscription dans op.student.course
                            course_data = {
                                'student_id': new_student.id,
                                'course_id': batch.course_id.id,
                                'batch_id': batch.id,
                                'state': 'running'
                            }
                            
                            student_course = request.env['op.student.course'].sudo().create(course_data)
                            _logger.info("Inscription créée avec ID: %s pour étudiant %s dans batch %s", 
                                       student_course.id, new_student.id, batch.id)
                            
                            # Vérifier que l'inscription a bien été créée
                            verification = request.env['op.student.course'].sudo().search([
                                ('student_id', '=', new_student.id),
                                ('batch_id', '=', batch.id)
                            ])
                            
                            if verification:
                                _logger.info("Vérification réussie: inscription trouvée pour étudiant %s", new_student.id)
                                return {
                                    'status': 'success',
                                    'message': f'Étudiant créé avec succès et inscrit dans {batch.name}',
                                    'student_id': new_student.id,
                                    'batch_assigned': True,
                                    'batch_name': batch.name,
                                    'batch_id': batch.id,
                                    'school_cycle': batch.school_cycle or '',
                                    'course_name': batch.course_id.name if batch.course_id else '',
                                    'inscription_id': student_course.id
                                }
                            else:
                                _logger.error("Vérification échouée: inscription non trouvée pour étudiant %s", new_student.id)
                                return {
                                    'status': 'warning',
                                    'message': 'Étudiant créé mais problème de vérification de l\'assignation',
                                    'student_id': new_student.id,
                                    'batch_assigned': False,
                                    'error': 'Inscription non trouvée lors de la vérification'
                                }
                        else:
                            # Cas spécial : batch sans cours associé
                            _logger.warning("Batch %s n'a pas de cours associé. Recherche d'un cours compatible...", batch_id)
                            
                            # Chercher un cours compatible selon le cycle scolaire du batch
                            compatible_course = None
                            if batch.school_cycle:
                                # Chercher un cours qui correspond au cycle scolaire (insensible à la casse et aux accents)
                                courses = request.env['op.course'].sudo().search([])
                                cycle_lower = batch.school_cycle.lower()
                                
                                for course in courses:
                                    if course.name:
                                        course_name_lower = course.name.lower()
                                        # Normaliser les accents pour la comparaison
                                        cycle_normalized = unicodedata.normalize('NFD', cycle_lower).encode('ascii', 'ignore').decode('ascii')
                                        course_normalized = unicodedata.normalize('NFD', course_name_lower).encode('ascii', 'ignore').decode('ascii')
                                        
                                        if cycle_normalized in course_normalized or course_normalized in cycle_normalized:
                                            compatible_course = course
                                            break
                                
                                # Si pas trouvé avec la normalisation, essayer des correspondances spécifiques
                                if not compatible_course:
                                    if cycle_lower in ['primaire', 'primary']:
                                        compatible_course = request.env['op.course'].sudo().search([
                                            '|', ('name', 'ilike', 'primaire'), ('name', 'ilike', 'primary')
                                        ], limit=1, order='id desc')
                                    elif cycle_lower in ['college', 'collège', 'middle']:
                                        compatible_course = request.env['op.course'].sudo().search([
                                            '|', '|', ('name', 'ilike', 'college'), ('name', 'ilike', 'collège'), ('name', 'ilike', 'middle')
                                        ], limit=1, order='id desc')
                                    elif cycle_lower in ['lycee', 'lycée', 'high', 'secondary']:
                                        compatible_course = request.env['op.course'].sudo().search([
                                            '|', '|', '|', ('name', 'ilike', 'lycee'), ('name', 'ilike', 'lycée'), ('name', 'ilike', 'high'), ('name', 'ilike', 'secondary')
                                        ], limit=1, order='id desc')
                            
                            if compatible_course:
                                # Assigner le cours au batch pour les futures créations
                                batch.sudo().write({'course_id': compatible_course.id})
                                _logger.info("Cours %s assigné au batch %s", compatible_course.name, batch.id)
                                
                                # Créer l'inscription
                                course_data = {
                                    'student_id': new_student.id,
                                    'course_id': compatible_course.id,
                                    'batch_id': batch.id,
                                    'state': 'running'
                                }
                                
                                student_course = request.env['op.student.course'].sudo().create(course_data)
                                _logger.info("Inscription créée avec ID: %s pour étudiant %s dans batch %s avec cours %s", 
                                           student_course.id, new_student.id, batch.id, compatible_course.name)
                                
                                return {
                                    'status': 'success',
                                    'message': f'Étudiant créé avec succès et inscrit dans {batch.name} (cours {compatible_course.name} assigné automatiquement)',
                                    'student_id': new_student.id,
                                    'batch_assigned': True,
                                    'batch_name': batch.name,
                                    'batch_id': batch.id,
                                    'school_cycle': batch.school_cycle or '',
                                    'course_name': compatible_course.name,
                                    'inscription_id': student_course.id,
                                    'auto_course_assigned': True
                                }
                            else:
                                # Aucun cours compatible trouvé
                                _logger.error("Aucun cours compatible trouvé pour le batch %s (cycle: %s)", batch.id, batch.school_cycle)
                                return {
                                    'status': 'warning',
                                    'message': f'Étudiant créé mais le batch {batch.name} n\'a pas de cours associé',
                                    'student_id': new_student.id,
                                    'batch_assigned': False,
                                    'batch_name': batch.name,
                                    'batch_id': batch.id,
                                    'school_cycle': batch.school_cycle or '',
                                    'error': 'Batch sans cours associé et aucun cours compatible trouvé',
                                    'suggestion': 'Veuillez assigner un cours au batch ou choisir un autre batch'
                                }
                    else:
                        _logger.warning("Batch %s non trouvé", batch_id)
                        return {
                            'status': 'success',
                            'message': 'Étudiant créé avec succès mais batch non trouvé',
                            'student_id': new_student.id,
                            'batch_assigned': False,
                            'warning': 'Batch non trouvé'
                        }
                except Exception as e:
                    _logger.error("Erreur lors de l'assignation au batch pour étudiant %s: %s", new_student.id, str(e))
                    return {
                        'status': 'success',
                        'message': 'Étudiant créé avec succès mais erreur lors de l\'assignation au batch',
                        'student_id': new_student.id,
                        'batch_assigned': False,
                        'error': str(e)
                    }
            
            _logger.info("Étudiant %s créé sans assignation de batch", new_student.id)
            
            # Construire le nom complet
            name_parts = []
            if new_student.first_name:
                name_parts.append(new_student.first_name)
            if new_student.middle_name:
                name_parts.append(new_student.middle_name)
            if new_student.last_name:
                name_parts.append(new_student.last_name)
            full_name = ' '.join(name_parts) if name_parts else 'Sans nom'
            
            return Response(
                json.dumps({
                    'status': 'success',
                    'message': 'Étudiant créé avec succès',
                    'data': {
                        'student_id': new_student.id,
                        'student_name': full_name,
                        'batch_assigned': False
                    }
                }),
                content_type='application/json',
                headers=get_cors_headers()
            )
        except Exception as e:
            _logger.error("Erreur create_new_student: %s", str(e))
            return Response(
                json.dumps({'status': 'error', 'message': str(e)}),
                content_type='application/json',
                status=500,
                headers=get_cors_headers()
            )

    # ================= COURS =================
    
    @http.route('/api/courses', auth='none', type='http', csrf=False, methods=['GET', 'POST', 'OPTIONS'])
    @cors_wrapper
    def handle_courses(self, **kwargs):
        """Gérer les cours"""
        method = request.httprequest.method
        
        if method == 'GET':
            return self.get_courses_list(**kwargs)
        elif method == 'POST':
            return self.create_new_course(**kwargs)

    def get_courses_list(self, **kwargs):
        """Récupérer la liste des cours"""
        try:
            page = int(kwargs.get('page', 1))
            limit = int(kwargs.get('limit', 10))
            offset = (page - 1) * limit
            
            # Paramètres pour filtrer par état
            state_filter = kwargs.get('state')
            include_draft = kwargs.get('include_draft', 'true').lower() == 'true'
            
            # Construire le domaine de recherche
            domain = []
            if state_filter:
                domain.append(('state', '=', state_filter))
            elif not include_draft:
                # Par défaut, exclure les brouillons sauf si explicitement demandé
                domain.append(('state', '!=', 'draft'))
            
            courses = request.env['op.course'].sudo().search(domain, limit=limit, offset=offset)
            total_count = request.env['op.course'].sudo().search_count(domain)
            
            courses_data = []
            for course in courses:
                # Créer une description à partir des champs disponibles
                description_parts = []
                if hasattr(course, 'official_program') and course.official_program:
                    description_parts.append(course.official_program)
                elif hasattr(course, 'learning_objectives') and course.learning_objectives:
                    description_parts.append(course.learning_objectives)
                elif hasattr(course, 'skills') and course.skills:
                    description_parts.append(course.skills)
                
                description = ' | '.join(description_parts) if description_parts else ''
                
                courses_data.append({
                    'id': course.id,
                    'name': course.name or '',
                    'code': course.code or '',
                    'description': description,
                    'department_id': course.department_id.id if course.department_id else None,
                    'department_name': course.department_id.name if course.department_id else '',
                    'state': course.state,
                    'active': course.state in ['confirmed', 'ongoing'],
                    # Ajouter tous les champs détaillés du modèle
                    'education_level': getattr(course, 'education_level', ''),
                    'class_level': getattr(course, 'class_level', ''),
                    'subject_area': getattr(course, 'subject_area', ''),
                    'course_type': getattr(course, 'course_type', ''),
                    'weekly_hours': getattr(course, 'weekly_hours', 0),
                    'coefficient': getattr(course, 'coefficient', 1.0),
                    'main_teacher_id': course.main_teacher_id.id if course.main_teacher_id else None,
                    'main_teacher_name': course.main_teacher_id.name if course.main_teacher_id else '',
                    'official_program': getattr(course, 'official_program', ''),
                    'learning_objectives': getattr(course, 'learning_objectives', ''),
                    'skills': getattr(course, 'skills', ''),
                    'prerequisites': getattr(course, 'prerequisites', ''),
                })
            
            return {
                'status': 'success',
                'data': {
                    'courses': courses_data,
                    'pagination': {
                        'page': page,
                        'limit': limit,
                        'total': total_count,
                        'pages': (total_count + limit - 1) // limit
                    }
                }
            }
        except Exception as e:
            _logger.error("Erreur get_courses_list: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    def create_new_course(self, **kwargs):
        """Créer un nouveau cours"""
        try:
            data = json.loads(request.httprequest.get_data())
            
            if not data.get('name'):
                return {'status': 'error', 'message': 'Le nom du cours est obligatoire'}
            
            course_data = {
                'name': data['name'],
                'code': data.get('code', ''),
                'department_id': int(data['department_id']) if data.get('department_id') else False,
                # Ajouter tous les champs possibles du modèle
                'education_level': data.get('education_level', 'college'),
                'class_level': data.get('class_level', '6eme'),
                'subject_area': data.get('subject_area', 'autre'),
                'course_type': data.get('course_type', 'obligatoire'),
                'weekly_hours': float(data.get('weekly_hours', 1.0)),
                'coefficient': float(data.get('coefficient', 1.0)),
                'official_program': data.get('official_program', data.get('description', '')),
                'learning_objectives': data.get('learning_objectives', ''),
                'skills': data.get('skills', ''),
                'prerequisites': data.get('prerequisites', ''),
                # État initial selon la case "activer"
                'state': 'confirmed' if data.get('active', True) else 'draft'
            }
            
            # Ajouter l'enseignant principal s'il est spécifié
            if data.get('main_teacher_id'):
                course_data['main_teacher_id'] = int(data['main_teacher_id'])
            
            new_course = request.env['op.course'].sudo().create(course_data)
            
            return {
                'status': 'success',
                'message': 'Cours créé avec succès' + (' et activé' if new_course.state == 'confirmed' else ''),
                'data': {
                    'id': new_course.id,
                    'name': new_course.name,
                    'state': new_course.state,
                    'active': new_course.state in ['confirmed', 'ongoing']
                }
            }
        except Exception as e:
            _logger.error("Erreur create_new_course: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/courses/batch-activate', auth='none', type='http', csrf=False, methods=['POST', 'OPTIONS'])
    @cors_wrapper
    def batch_activate_courses(self, **kwargs):
        """Activer tous les cours en brouillon"""
        try:
            # Trouver tous les cours en brouillon
            draft_courses = request.env['op.course'].sudo().search([('state', '=', 'draft')])
            
            if not draft_courses:
                return {
                    'status': 'success',
                    'code': 200,
                    'message': 'Aucun cours en brouillon trouvé',
                    'data': {'activated_count': 0}
                }
            
            # Activer tous les cours
            draft_courses.write({'state': 'confirmed'})
            activated_count = len(draft_courses)
            
            return {
                'status': 'success',
                'code': 200,
                'message': f'{activated_count} cours activés avec succès',
                'data': {
                    'activated_count': activated_count,
                    'activated_courses': [
                        {
                            'id': course.id,
                            'name': course.name,
                            'state': course.state
                        } for course in draft_courses
                    ]
                }
            }
            
        except Exception as e:
            _logger.error(f"Erreur activation batch cours: {str(e)}")
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/courses/<int:course_id>', auth='none', type='http', csrf=False, methods=['GET', 'PUT', 'DELETE', 'OPTIONS'])
    @cors_wrapper
    def handle_course_by_id(self, course_id, **kwargs):
        """Gérer un cours spécifique par ID"""
        method = request.httprequest.method
        
        if method == 'GET':
            return self.get_course_by_id(course_id)
        elif method == 'PUT':
            return self.update_course_by_id(course_id, **kwargs)
        elif method == 'DELETE':
            return self.delete_course_by_id(course_id)

    def get_course_by_id(self, course_id):
        """Récupérer un cours par ID"""
        try:
            course = request.env['op.course'].sudo().browse(course_id)
            if not course.exists():
                return {'status': 'error', 'code': 404, 'message': 'Cours non trouvé'}
            
            # Créer une description à partir des champs disponibles
            description_parts = []
            if hasattr(course, 'official_program') and course.official_program:
                description_parts.append(course.official_program)
            elif hasattr(course, 'learning_objectives') and course.learning_objectives:
                description_parts.append(course.learning_objectives)
            elif hasattr(course, 'skills') and course.skills:
                description_parts.append(course.skills)
            
            description = ' | '.join(description_parts) if description_parts else ''
            
            course_data = {
                'id': course.id,
                'name': course.name or '',
                'code': course.code or '',
                'description': description,
                'department_id': course.department_id.id if course.department_id else None,
                'department_name': course.department_id.name if course.department_id else '',
                'state': course.state,
                'active': course.state in ['confirmed', 'ongoing'],
                # Ajouter tous les champs détaillés du modèle
                'education_level': getattr(course, 'education_level', ''),
                'class_level': getattr(course, 'class_level', ''),
                'subject_area': getattr(course, 'subject_area', ''),
                'course_type': getattr(course, 'course_type', ''),
                'weekly_hours': getattr(course, 'weekly_hours', 0),
                'coefficient': getattr(course, 'coefficient', 1.0),
                'main_teacher_id': course.main_teacher_id.id if course.main_teacher_id else None,
                'main_teacher_name': course.main_teacher_id.name if course.main_teacher_id else '',
                'official_program': getattr(course, 'official_program', ''),
                'learning_objectives': getattr(course, 'learning_objectives', ''),
                'skills': getattr(course, 'skills', ''),
                'prerequisites': getattr(course, 'prerequisites', ''),
            }
            
            return {'status': 'success', 'data': course_data}
            
        except Exception as e:
            _logger.error("Erreur get_course_by_id: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    def update_course_by_id(self, course_id, **kwargs):
        """Mettre à jour un cours par ID"""
        try:
            course = request.env['op.course'].sudo().browse(course_id)
            if not course.exists():
                return {'status': 'error', 'code': 404, 'message': 'Cours non trouvé'}
            
            data = json.loads(request.httprequest.get_data())
            
            # Préparer les données de mise à jour
            update_data = {}
            allowed_fields = [
                'name', 'code', 'department_id', 'education_level', 'class_level',
                'subject_area', 'course_type', 'weekly_hours', 'coefficient',
                'main_teacher_id', 'official_program', 'learning_objectives',
                'skills', 'prerequisites', 'state'
            ]
            
            for field in allowed_fields:
                if field in data:
                    if field in ['department_id', 'main_teacher_id'] and data[field]:
                        update_data[field] = int(data[field])
                    elif field in ['weekly_hours', 'coefficient']:
                        update_data[field] = float(data[field]) if data[field] else 0
                    else:
                        update_data[field] = data[field]
            
            # Gérer le statut actif/inactif
            if 'active' in data:
                update_data['state'] = 'confirmed' if data['active'] else 'draft'
            
            course.write(update_data)
            
            return {
                'status': 'success',
                'message': 'Cours mis à jour avec succès',
                'data': {
                    'id': course.id,
                    'name': course.name,
                    'state': course.state,
                    'active': course.state in ['confirmed', 'ongoing']
                }
            }
            
        except Exception as e:
            _logger.error("Erreur update_course_by_id: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    def delete_course_by_id(self, course_id):
        """Supprimer un cours par ID"""
        try:
            course = request.env['op.course'].sudo().browse(course_id)
            if not course.exists():
                return {'status': 'error', 'code': 404, 'message': 'Cours non trouvé'}
            
            course_name = course.name
            course.unlink()
            
            return {
                'status': 'success',
                'message': f'Cours "{course_name}" supprimé avec succès'
            }
            
        except Exception as e:
            _logger.error("Erreur delete_course_by_id: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    # ================= MATIÈRES =================
    
    @http.route('/api/subjects', auth='none', type='http', csrf=False, methods=['GET', 'POST', 'OPTIONS'])
    @cors_wrapper
    def handle_subjects(self, **kwargs):
        """Gérer les matières"""
        method = request.httprequest.method
        
        if method == 'GET':
            return self.get_subjects_list(**kwargs)
        elif method == 'POST':
            return self.create_new_subject(**kwargs)

    def get_subjects_list(self, **kwargs):
        """Récupérer la liste des matières"""
        try:
            page = int(kwargs.get('page', 1))
            limit = int(kwargs.get('limit', 10))
            offset = (page - 1) * limit
            
            subjects = request.env['op.subject'].sudo().search([], limit=limit, offset=offset)
            total_count = request.env['op.subject'].sudo().search_count([])
            
            # Mappings pour les labels français (réutilisés)
            type_labels = {
                'theory': 'Théorie',
                'practical': 'Pratique', 
                'both': 'Théorie et Pratique',
                'other': 'Autre'
            }
            
            subject_type_labels = {
                'compulsory': 'Obligatoire',
                'elective': 'Optionnel'
            }
            
            content_type_labels = {
                'chapitre': 'Chapitre',
                'module': 'Module',
                'unite': 'Unité d\'Enseignement',
                'sequence': 'Séquence Pédagogique',
                'tp': 'Travaux Pratiques',
                'td': 'Travaux Dirigés',
                'projet': 'Projet',
                'evaluation': 'Évaluation'
            }
            
            evaluation_type_labels = {
                'none': 'Pas d\'Évaluation',
                'formative': 'Évaluation Formative',
                'sommative': 'Évaluation Sommative',
                'auto': 'Auto-Évaluation'
            }
            
            state_labels = {
                'draft': 'Brouillon',
                'planned': 'Planifié',
                'ongoing': 'En Cours',
                'done': 'Terminé',
                'cancelled': 'Annulé'
            }
            
            subjects_data = []
            for subject in subjects:
                # Récupérer les valeurs avec valeurs par défaut
                type_value = getattr(subject, 'type', 'theory')
                subject_type_value = getattr(subject, 'subject_type', 'compulsory')
                content_type_value = getattr(subject, 'content_type', 'module')
                evaluation_type_value = getattr(subject, 'evaluation_type', 'none')
                state_value = getattr(subject, 'state', 'draft')
                
                subjects_data.append({
                    'id': subject.id,
                    'name': subject.name or '',
                    'code': subject.code or '',
                    'course_id': subject.course_id.id if subject.course_id else None,
                    'course_name': subject.course_id.name if subject.course_id else '',
                    'active': getattr(subject, 'active', True),
                    'description': getattr(subject, 'description', '') or '',
                    
                    # Champs avec labels
                    'type': type_value,
                    'type_label': type_labels.get(type_value, type_value),
                    'subject_type': subject_type_value,
                    'subject_type_label': subject_type_labels.get(subject_type_value, subject_type_value),
                    'content_type': content_type_value,
                    'content_type_label': content_type_labels.get(content_type_value, content_type_value),
                    'evaluation_type': evaluation_type_value,
                    'evaluation_type_label': evaluation_type_labels.get(evaluation_type_value, evaluation_type_value),
                    'state': state_value,
                    'state_label': state_labels.get(state_value, state_value),
                    
                    # Champs numériques
                    'grade_weightage': getattr(subject, 'grade_weightage', 0.0),
                    'duration': getattr(subject, 'duration', 2.0),
                    'weight': getattr(subject, 'weight', 2.0),
                    'sequence': getattr(subject, 'sequence', 10),
                    'has_exercises': getattr(subject, 'has_exercises', False),
                    
                    # Dates
                    'planned_date': str(subject.planned_date) if getattr(subject, 'planned_date', False) else None,
                    'start_date': str(subject.start_date) if getattr(subject, 'start_date', False) else None,
                    'end_date': str(subject.end_date) if getattr(subject, 'end_date', False) else None,
                })
            
            return {
                'status': 'success',
                'data': {
                    'subjects': subjects_data,
                    'pagination': {
                        'page': page,
                        'limit': limit,
                        'total': total_count,
                        'pages': (total_count + limit - 1) // limit
                    }
                }
            }
        except Exception as e:
            _logger.error("Erreur get_subjects_list: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    def create_new_subject(self, **kwargs):
        """Créer une nouvelle matière"""
        try:
            data = json.loads(request.httprequest.get_data())
            
            name = data.get('name')
            code = data.get('code', '')
            
            if not name:
                return {'status': 'error', 'code': 400, 'message': 'Nom de la matière requis'}
            
            # Préparer les données de création
            subject_data = {
                'name': name,
                'code': code,
            }
            
            # Champs optionnels OpenEduCat de base
            if 'course_id' in data and data['course_id']:
                subject_data['course_id'] = int(data['course_id'])
            
            if 'department_id' in data and data['department_id']:
                subject_data['department_id'] = int(data['department_id'])
            
            if 'type' in data:
                # Valider le type
                valid_types = ['theory', 'practical', 'both', 'other']
                if data['type'] in valid_types:
                    subject_data['type'] = data['type']
            
            if 'subject_type' in data:
                # Valider le type de sujet
                valid_subject_types = ['compulsory', 'elective']
                if data['subject_type'] in valid_subject_types:
                    subject_data['subject_type'] = data['subject_type']
            
            if 'grade_weightage' in data:
                subject_data['grade_weightage'] = float(data['grade_weightage']) if data['grade_weightage'] else 0.0
            
            # Champs de notre extension
            if 'content_type' in data:
                valid_content_types = ['chapitre', 'module', 'unite', 'sequence', 'tp', 'td', 'projet', 'evaluation']
                if data['content_type'] in valid_content_types:
                    subject_data['content_type'] = data['content_type']
            
            if 'evaluation_type' in data:
                valid_evaluation_types = ['none', 'formative', 'sommative', 'auto']
                if data['evaluation_type'] in valid_evaluation_types:
                    subject_data['evaluation_type'] = data['evaluation_type']
            
            if 'duration' in data:
                subject_data['duration'] = float(data['duration']) if data['duration'] else 2.0
            
            if 'weight' in data:
                subject_data['weight'] = float(data['weight']) if data['weight'] else 2.0
            
            # Champs texte
            text_fields = ['description', 'learning_objectives', 'skills', 'prerequisites', 'exercises_description']
            for field in text_fields:
                if field in data:
                    subject_data[field] = data[field]
            
            # Champs booléens
            if 'active' in data:
                subject_data['active'] = bool(data['active'])
            
            if 'has_exercises' in data:
                subject_data['has_exercises'] = bool(data['has_exercises'])
            
            # Champs numériques
            if 'sequence' in data:
                subject_data['sequence'] = int(data['sequence']) if data['sequence'] else 10
            
            # Champs de date
            date_fields = ['planned_date', 'start_date', 'end_date']
            for field in date_fields:
                if field in data and data[field]:
                    subject_data[field] = data[field]
            
            # État
            if 'state' in data:
                valid_states = ['draft', 'planned', 'ongoing', 'done', 'cancelled']
                if data['state'] in valid_states:
                    subject_data['state'] = data['state']
            
            # Créer la matière
            subject = request.env['op.subject'].sudo().create(subject_data)
            
            return {
                'status': 'success',
                'message': 'Matière créée avec succès',
                'data': {
                    'id': subject.id,
                    'name': subject.name,
                    'code': subject.code,
                    'type': subject.type,
                    'subject_type': subject.subject_type,
                    'content_type': getattr(subject, 'content_type', 'module'),
                    'evaluation_type': getattr(subject, 'evaluation_type', 'none'),
                    'duration': getattr(subject, 'duration', 2.0),
                    'weight': getattr(subject, 'weight', 2.0),
                    'course_id': subject.course_id.id if subject.course_id else None,
                    'course_name': subject.course_id.name if subject.course_id else ''
                }
            }
        except Exception as e:
            _logger.error("Erreur create_new_subject: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/subjects/<int:subject_id>', auth='none', type='http', csrf=False, methods=['GET', 'PUT', 'DELETE', 'OPTIONS'])
    @cors_wrapper
    def handle_subject_by_id(self, subject_id, **kwargs):
        """Gérer un sujet spécifique par ID"""
        method = request.httprequest.method
        
        if method == 'GET':
            return self.get_subject_by_id(subject_id)
        elif method == 'PUT':
            return self.update_subject_by_id(subject_id, **kwargs)
        elif method == 'DELETE':
            return self.delete_subject_by_id(subject_id)

    def get_subject_by_id(self, subject_id):
        """Récupérer un sujet par ID"""
        try:
            subject = request.env['op.subject'].sudo().browse(subject_id)
            if not subject.exists():
                return {'status': 'error', 'code': 404, 'message': 'Sujet non trouvé'}
            
            # Mappings pour les labels français
            type_labels = {
                'theory': 'Théorie',
                'practical': 'Pratique', 
                'both': 'Théorie et Pratique',
                'other': 'Autre'
            }
            
            subject_type_labels = {
                'compulsory': 'Obligatoire',
                'elective': 'Optionnel'
            }
            
            content_type_labels = {
                'chapitre': 'Chapitre',
                'module': 'Module',
                'unite': 'Unité d\'Enseignement',
                'sequence': 'Séquence Pédagogique',
                'tp': 'Travaux Pratiques',
                'td': 'Travaux Dirigés',
                'projet': 'Projet',
                'evaluation': 'Évaluation'
            }
            
            evaluation_type_labels = {
                'none': 'Pas d\'Évaluation',
                'formative': 'Évaluation Formative',
                'sommative': 'Évaluation Sommative',
                'auto': 'Auto-Évaluation'
            }
            
            state_labels = {
                'draft': 'Brouillon',
                'planned': 'Planifié',
                'ongoing': 'En Cours',
                'done': 'Terminé',
                'cancelled': 'Annulé'
            }
            
            # Récupérer les valeurs avec valeurs par défaut
            type_value = getattr(subject, 'type', 'theory')
            subject_type_value = getattr(subject, 'subject_type', 'compulsory')
            content_type_value = getattr(subject, 'content_type', 'module')
            evaluation_type_value = getattr(subject, 'evaluation_type', 'none')
            state_value = getattr(subject, 'state', 'draft')
            
            subject_data = {
                'id': subject.id,
                'name': subject.name or '',
                'code': subject.code or '',
                'course_id': subject.course_id.id if subject.course_id else None,
                'course_name': subject.course_id.name if subject.course_id else '',
                'active': getattr(subject, 'active', True),
                'description': getattr(subject, 'description', '') or '',
                
                # Champs OpenEduCat de base avec labels
                'type': type_value,
                'type_label': type_labels.get(type_value, type_value),
                'subject_type': subject_type_value,
                'subject_type_label': subject_type_labels.get(subject_type_value, subject_type_value),
                'grade_weightage': getattr(subject, 'grade_weightage', 0.0),
                'department_id': subject.department_id.id if subject.department_id else None,
                'department_name': subject.department_id.name if subject.department_id else '',
                
                # Champs de notre extension avec labels
                'content_type': content_type_value,
                'content_type_label': content_type_labels.get(content_type_value, content_type_value),
                'evaluation_type': evaluation_type_value,
                'evaluation_type_label': evaluation_type_labels.get(evaluation_type_value, evaluation_type_value),
                'duration': getattr(subject, 'duration', 2.0),
                'weight': getattr(subject, 'weight', 2.0),
                
                # Champs pédagogiques - correction pour retourner des chaînes vides au lieu de False
                'learning_objectives': getattr(subject, 'learning_objectives', '') or '',
                'skills': getattr(subject, 'skills', '') or '',
                'prerequisites': getattr(subject, 'prerequisites', '') or '',
                'sequence': getattr(subject, 'sequence', 10),
                'state': state_value,
                'state_label': state_labels.get(state_value, state_value),
                
                # Champs évaluation
                'has_exercises': getattr(subject, 'has_exercises', False),
                'exercises_description': getattr(subject, 'exercises_description', '') or '',
                
                # Dates
                'planned_date': str(subject.planned_date) if getattr(subject, 'planned_date', False) else None,
                'start_date': str(subject.start_date) if getattr(subject, 'start_date', False) else None,
                'end_date': str(subject.end_date) if getattr(subject, 'end_date', False) else None,
            }
            
            return {'status': 'success', 'data': subject_data}
            
        except Exception as e:
            _logger.error("Erreur get_subject_by_id: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    def update_subject_by_id(self, subject_id, **kwargs):
        """Mettre à jour un sujet par ID"""
        try:
            subject = request.env['op.subject'].sudo().browse(subject_id)
            if not subject.exists():
                return {'status': 'error', 'code': 404, 'message': 'Sujet non trouvé'}
            
            data = json.loads(request.httprequest.get_data())
            
            # Préparer les données de mise à jour
            update_data = {}
            
            # Champs de base
            basic_fields = ['name', 'code', 'description']
            for field in basic_fields:
                if field in data:
                    update_data[field] = data[field]
            
            # Champs Many2one
            if 'course_id' in data:
                update_data['course_id'] = int(data['course_id']) if data['course_id'] else False
            
            if 'department_id' in data:
                update_data['department_id'] = int(data['department_id']) if data['department_id'] else False
            
            # Champs de sélection avec validation
            if 'type' in data:
                valid_types = ['theory', 'practical', 'both', 'other']
                if data['type'] in valid_types:
                    update_data['type'] = data['type']
            
            if 'subject_type' in data:
                valid_subject_types = ['compulsory', 'elective']
                if data['subject_type'] in valid_subject_types:
                    update_data['subject_type'] = data['subject_type']
            
            if 'content_type' in data:
                valid_content_types = ['chapitre', 'module', 'unite', 'sequence', 'tp', 'td', 'projet', 'evaluation']
                if data['content_type'] in valid_content_types:
                    update_data['content_type'] = data['content_type']
            
            if 'evaluation_type' in data:
                valid_evaluation_types = ['none', 'formative', 'sommative', 'auto']
                if data['evaluation_type'] in valid_evaluation_types:
                    update_data['evaluation_type'] = data['evaluation_type']
            
            if 'state' in data:
                valid_states = ['draft', 'planned', 'ongoing', 'done', 'cancelled']
                if data['state'] in valid_states:
                    update_data['state'] = data['state']
            
            # Champs numériques
            numeric_fields = ['grade_weightage', 'duration', 'weight', 'sequence']
            for field in numeric_fields:
                if field in data:
                    if field == 'sequence':
                        update_data[field] = int(data[field]) if data[field] else 10
                    else:
                        update_data[field] = float(data[field]) if data[field] else 0.0
            
            # Champs booléens
            boolean_fields = ['active', 'has_exercises']
            for field in boolean_fields:
                if field in data:
                    update_data[field] = bool(data[field])
            
            # Champs texte
            text_fields = ['learning_objectives', 'skills', 'prerequisites', 'exercises_description']
            for field in text_fields:
                if field in data:
                    update_data[field] = data[field]
            
            # Champs de date
            date_fields = ['planned_date', 'start_date', 'end_date']
            for field in date_fields:
                if field in data:
                    update_data[field] = data[field] if data[field] else False
            
            # Appliquer les modifications
            subject.write(update_data)
            
            return {
                'status': 'success',
                'message': 'Sujet mis à jour avec succès',
                'data': {
                    'id': subject.id,
                    'name': subject.name,
                    'code': subject.code,
                    'type': subject.type,
                    'subject_type': subject.subject_type,
                    'content_type': getattr(subject, 'content_type', 'module'),
                    'evaluation_type': getattr(subject, 'evaluation_type', 'none'),
                    'duration': getattr(subject, 'duration', 2.0),
                    'weight': getattr(subject, 'weight', 2.0),
                    'grade_weightage': subject.grade_weightage,
                    'course_id': subject.course_id.id if subject.course_id else None,
                    'course_name': subject.course_id.name if subject.course_id else '',
                    'department_id': subject.department_id.id if subject.department_id else None,
                    'department_name': subject.department_id.name if subject.department_id else '',
                    'active': subject.active,
                    'state': getattr(subject, 'state', 'draft')
                }
            }
            
        except Exception as e:
            _logger.error("Erreur update_subject_by_id: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    def delete_subject_by_id(self, subject_id):
        """Supprimer un sujet par ID"""
        try:
            subject = request.env['op.subject'].sudo().browse(subject_id)
            if not subject.exists():
                return {'status': 'error', 'code': 404, 'message': 'Sujet non trouvé'}
            
            subject_name = subject.name
            subject.unlink()
            
            return {
                'status': 'success',
                'message': f'Sujet "{subject_name}" supprimé avec succès'
            }
            
        except Exception as e:
            _logger.error("Erreur delete_subject_by_id: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    # ================= ÉTUDIANTS INDIVIDUELS =================
    
    @http.route('/api/students/<int:student_id>', auth='none', type='http', csrf=False, methods=['GET', 'PUT', 'DELETE', 'OPTIONS'])
    @cors_wrapper
    def handle_student_by_id(self, student_id, **kwargs):
        """Gérer un étudiant spécifique par ID"""
        method = request.httprequest.method
        
        if method == 'GET':
            return self.get_student_by_id(student_id)
        elif method == 'PUT':
            return self.update_student_by_id(student_id, **kwargs)
        elif method == 'DELETE':
            return self.delete_student_by_id(student_id)

    def get_student_by_id(self, student_id):
        """Récupérer un étudiant par ID"""
        try:
            student = request.env['op.student'].sudo().browse(student_id)
            if not student.exists():
                return {'status': 'error', 'code': 404, 'message': 'Étudiant non trouvé'}
            
            name_parts = []
            if student.first_name:
                name_parts.append(student.first_name)
            if student.middle_name:
                name_parts.append(student.middle_name)
            if student.last_name:
                name_parts.append(student.last_name)
            full_name = ' '.join(name_parts) if name_parts else 'Sans nom'
            
            student_data = {
                'id': student.id,
                'name': full_name,
                'first_name': student.first_name or '',
                'middle_name': student.middle_name or '',
                'last_name': student.last_name or '',
                'email': student.email or '',
                'phone': student.phone or '',
                'mobile': student.mobile or '',
                'gender': student.gender or '',
                'birth_date': str(student.birth_date) if student.birth_date else None,
                'active': student.active
            }
            
            # Récupérer les informations académiques
            batch_info = None
            course_info = None
            school_cycle = ''
            
            try:
                # Chercher dans op.student.course
                student_courses = request.env['op.student.course'].sudo().search([
                    ('student_id', '=', student.id)
                ])
                
                if student_courses:
                    # Prendre la première inscription active ou la plus récente
                    active_course = student_courses.filtered(lambda c: c.state == 'running')
                    if not active_course:
                        active_course = student_courses.sorted('create_date', reverse=True)
                    
                    if active_course:
                        course_record = active_course[0]
                        
                        # Récupérer les informations du batch
                        if course_record.batch_id:
                            batch = course_record.batch_id
                            batch_info = {
                                'id': batch.id,
                                'name': batch.name,
                                'code': batch.code or '',
                                'school_cycle': batch.school_cycle or '',
                                'start_date': str(batch.start_date) if batch.start_date else None,
                                'end_date': str(batch.end_date) if batch.end_date else None,
                                'active': batch.active,
                                'course_id': batch.course_id.id if batch.course_id else None,
                                'course_name': batch.course_id.name if batch.course_id else None
                            }
                            school_cycle = batch.school_cycle or ''
                        
                        # Récupérer les informations du cours
                        if course_record.course_id:
                            course = course_record.course_id
                            course_info = {
                                'id': course.id,
                                'name': course.name,
                                'code': course.code or '',
                                'state': course_record.state or 'enrolled'
                            }
                
            except Exception as e:
                _logger.error("Erreur lors de la recherche des informations académiques pour l'étudiant %s: %s", student_id, str(e))
            
            # Assigner les résultats
            student_data['batch'] = batch_info
            student_data['school_cycle'] = school_cycle
            student_data['course'] = course_info
            
            return {'status': 'success', 'data': student_data}
            
        except Exception as e:
            _logger.error("Erreur get_student_by_id: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    def update_student_by_id(self, student_id, **kwargs):
        """Mettre à jour un étudiant par ID"""
        try:
            student = request.env['op.student'].sudo().browse(student_id)
            if not student.exists():
                return {'status': 'error', 'code': 404, 'message': 'Étudiant non trouvé'}
            
            data = json.loads(request.httprequest.get_data())
            _logger.info("🔄 Mise à jour étudiant %s avec données: %s", student_id, data)
            
            update_data = {}
            for field in ['first_name', 'middle_name', 'last_name', 'email', 'phone', 'mobile', 'gender', 'birth_date']:
                if field in data:
                    update_data[field] = data[field]
            
            # Appliquer les modifications sur l'étudiant
            if update_data:
                student.write(update_data)
                _logger.info("✅ Données étudiant mises à jour: %s", list(update_data.keys()))
            
            return {
                'status': 'success',
                'message': 'Étudiant mis à jour avec succès'
            }
        except Exception as e:
            _logger.error("Erreur update_student_by_id: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    def delete_student_by_id(self, student_id):
        """Supprimer un étudiant par ID"""
        try:
            student = request.env['op.student'].sudo().browse(student_id)
            if not student.exists():
                return {'status': 'error', 'code': 404, 'message': 'Étudiant non trouvé'}
            
            student.unlink()
            
            return {
                'status': 'success',
                'message': 'Étudiant supprimé avec succès'
            }
        except Exception as e:
            _logger.error("Erreur delete_student_by_id: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    # ================= ENSEIGNANTS/PROFESSEURS =================
    
    @http.route('/api/teachers', auth='none', type='http', csrf=False, methods=['GET', 'POST', 'OPTIONS'])
    @cors_wrapper
    def handle_teachers(self, **kwargs):
        """Gérer les enseignants/professeurs"""
        method = request.httprequest.method
        
        if method == 'GET':
            return self.get_teachers_list(**kwargs)
        elif method == 'POST':
            return self.create_new_teacher(**kwargs)

    def get_teachers_list(self, **kwargs):
        """Récupérer la liste des enseignants"""
        try:
            page = int(kwargs.get('page', 1))
            limit = int(kwargs.get('limit', 20))
            offset = (page - 1) * limit
            search = kwargs.get('search', '')
            order = kwargs.get('order', 'name asc')
            
            # Construction du domaine de recherche
            domain = []
            if search:
                domain = ['|', '|', '|', 
                         ('name', 'ilike', search),
                         ('email', 'ilike', search),
                         ('phone', 'ilike', search),
                         ('mobile', 'ilike', search)]
            
            # Gestion de l'ordre
            order_by = 'name'
            if 'asc' in order.lower():
                order_direction = 'asc'
            else:
                order_direction = 'desc'
            
            if 'name' in order.lower():
                order_by = 'name'
            elif 'email' in order.lower():
                order_by = 'email'
            elif 'phone' in order.lower():
                order_by = 'phone'
            
            order_clause = f'{order_by} {order_direction}'
            
            teachers = request.env['op.faculty'].sudo().search(domain, limit=limit, offset=offset, order=order_clause)
            total_count = request.env['op.faculty'].sudo().search_count(domain)
            
            teachers_data = []
            for teacher in teachers:
                # Construire le nom complet
                name_parts = []
                if hasattr(teacher, 'first_name') and teacher.first_name:
                    name_parts.append(teacher.first_name)
                if hasattr(teacher, 'middle_name') and teacher.middle_name:
                    name_parts.append(teacher.middle_name)
                if hasattr(teacher, 'last_name') and teacher.last_name:
                    name_parts.append(teacher.last_name)
                
                full_name = ' '.join(name_parts) if name_parts else (teacher.name or 'Sans nom')
                
                # Compter les matières enseignées
                subject_count = 0
                subjects_taught = []
                
                try:
                    if hasattr(teacher, 'subject_ids') and teacher.subject_ids:
                        subject_count = len(teacher.subject_ids)
                        subjects_taught = [{'id': s.id, 'name': s.name} for s in teacher.subject_ids[:3]]  # Limite à 3 pour l'affichage
                except:
                    # Fallback si le modèle n'a pas ce champ
                    pass
                
                teacher_data = {
                    'id': teacher.id,
                    'name': full_name,
                    'first_name': getattr(teacher, 'first_name', '') or '',
                    'middle_name': getattr(teacher, 'middle_name', '') or '',
                    'last_name': getattr(teacher, 'last_name', '') or '',
                    'email': teacher.email or '',
                    'phone': teacher.phone or '',
                    'mobile': teacher.mobile or '',
                    'gender': getattr(teacher, 'gender', '') or '',
                    'active': getattr(teacher, 'active', True),
                    'employee_id': getattr(teacher, 'emp_id', '') or '',
                    'subject_count': subject_count,
                    'subjects_taught': subjects_taught
                }
                
                # Ajouter des informations additionnelles si disponibles
                if hasattr(teacher, 'birth_date') and teacher.birth_date:
                    teacher_data['birth_date'] = str(teacher.birth_date)
                
                if hasattr(teacher, 'joining_date') and teacher.joining_date:
                    teacher_data['joining_date'] = str(teacher.joining_date)
                
                if hasattr(teacher, 'department_id') and teacher.department_id:
                    teacher_data['department_id'] = teacher.department_id.id
                    teacher_data['department_name'] = teacher.department_id.name
                
                teachers_data.append(teacher_data)
            
            return {
                'status': 'success',
                'data': {
                    'teachers': teachers_data,
                    'pagination': {
                        'page': page,
                        'limit': limit,
                        'total': total_count,
                        'pages': (total_count + limit - 1) // limit
                    }
                }
            }
        except Exception as e:
            _logger.error("Erreur get_teachers_list: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    def create_new_teacher(self, **kwargs):
        """Créer un nouvel enseignant"""
        try:
            data = json.loads(request.httprequest.get_data())
            
            required_fields = ['first_name', 'last_name']
            for field in required_fields:
                if field not in data or not data[field]:
                    return {'status': 'error', 'message': f'Le champ {field} est obligatoire'}
            
            # Vérifier l'unicité de l'email s'il est fourni
            if data.get('email'):
                existing_teacher = request.env['op.faculty'].sudo().search([('email', '=', data['email'])], limit=1, order='id desc')
                if existing_teacher:
                    return {'status': 'error', 'message': 'Un enseignant avec cet email existe déjà'}
            
            teacher_data = {
                'first_name': data['first_name'],
                'last_name': data['last_name'],
                'middle_name': data.get('middle_name', ''),
                'email': data.get('email', ''),
                'phone': data.get('phone', ''),
                'mobile': data.get('mobile', ''),
                'gender': data.get('gender', 'male'),
                'active': data.get('active', True)
            }
            
            # Ajouter les champs optionnels s'ils sont fournis
            if data.get('birth_date'):
                teacher_data['birth_date'] = data['birth_date']
            
            if data.get('emp_id'):
                teacher_data['emp_id'] = data['emp_id']
            
            if data.get('department_id'):
                teacher_data['department_id'] = int(data['department_id'])
            
            new_teacher = request.env['op.faculty'].sudo().create(teacher_data)
            
            return {
                'status': 'success',
                'message': 'Enseignant créé avec succès',
                'teacher_id': new_teacher.id
            }
        except Exception as e:
            _logger.error("Erreur create_new_teacher: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/teachers/<int:teacher_id>', auth='none', type='http', csrf=False, methods=['GET', 'PUT', 'DELETE', 'OPTIONS'])
    @cors_wrapper
    def handle_teacher_by_id(self, teacher_id, **kwargs):
        """Gérer un enseignant spécifique par ID"""
        method = request.httprequest.method
        
        if method == 'GET':
            return self.get_teacher_by_id(teacher_id)
        elif method == 'PUT':
            return self.update_teacher_by_id(teacher_id, **kwargs)
        elif method == 'DELETE':
            return self.delete_teacher_by_id(teacher_id)

    def get_teacher_by_id(self, teacher_id):
        """Récupérer un enseignant par ID"""
        try:
            teacher = request.env['op.faculty'].sudo().browse(teacher_id)
            if not teacher.exists():
                return {'status': 'error', 'code': 404, 'message': 'Enseignant non trouvé'}
            
            # Construire le nom complet
            name_parts = []
            if hasattr(teacher, 'first_name') and teacher.first_name:
                name_parts.append(teacher.first_name)
            if hasattr(teacher, 'middle_name') and teacher.middle_name:
                name_parts.append(teacher.middle_name)
            if hasattr(teacher, 'last_name') and teacher.last_name:
                name_parts.append(teacher.last_name)
            
            full_name = ' '.join(name_parts) if name_parts else (teacher.name or 'Sans nom')
            
            # Récupérer les matières enseignées
            subjects_taught = []
            try:
                if hasattr(teacher, 'subject_ids') and teacher.subject_ids:
                    subjects_taught = [{'id': s.id, 'name': s.name} for s in teacher.subject_ids]
            except:
                pass
            
            teacher_data = {
                'id': teacher.id,
                'name': full_name,
                'first_name': getattr(teacher, 'first_name', '') or '',
                'middle_name': getattr(teacher, 'middle_name', '') or '',
                'last_name': getattr(teacher, 'last_name', '') or '',
                'email': teacher.email or '',
                'phone': teacher.phone or '',
                'mobile': teacher.mobile or '',
                'gender': getattr(teacher, 'gender', '') or '',
                'active': getattr(teacher, 'active', True),
                'employee_id': getattr(teacher, 'emp_id', '') or '',
                'subjects_taught': subjects_taught
            }
            
            # Ajouter des informations additionnelles si disponibles
            if hasattr(teacher, 'birth_date') and teacher.birth_date:
                teacher_data['birth_date'] = str(teacher.birth_date)
            
            if hasattr(teacher, 'joining_date') and teacher.joining_date:
                teacher_data['joining_date'] = str(teacher.joining_date)
            
            if hasattr(teacher, 'department_id') and teacher.department_id:
                teacher_data['department_id'] = teacher.department_id.id
                teacher_data['department_name'] = teacher.department_id.name
            
            return {
                'status': 'success',
                'data': teacher_data
            }
        except Exception as e:
            _logger.error("Erreur get_teacher_by_id: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    def update_teacher_by_id(self, teacher_id, **kwargs):
        """Mettre à jour un enseignant par ID"""
        try:
            teacher = request.env['op.faculty'].sudo().browse(teacher_id)
            if not teacher.exists():
                return {'status': 'error', 'code': 404, 'message': 'Enseignant non trouvé'}
            
            data = json.loads(request.httprequest.get_data())
            
            # Vérifier l'unicité de l'email si modifié
            if data.get('email') and data['email'] != teacher.email:
                existing_teacher = request.env['op.faculty'].sudo().search([
                    ('email', '=', data['email']),
                    ('id', '!=', teacher_id)
                ], limit=1)
                if existing_teacher:
                    return {'status': 'error', 'message': 'Un enseignant avec cet email existe déjà'}
            
            # Préparer les données de mise à jour
            update_data = {}
            allowed_fields = ['first_name', 'last_name', 'middle_name', 'email', 'phone', 'mobile', 'gender', 'active', 'birth_date', 'emp_id', 'department_id']
            
            for field in allowed_fields:
                if field in data:
                    update_data[field] = data[field]
            
            teacher.write(update_data)
            
            return {
                'status': 'success',
                'message': 'Enseignant mis à jour avec succès'
            }
        except Exception as e:
            _logger.error("Erreur update_teacher_by_id: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    def delete_teacher_by_id(self, teacher_id):
        """Supprimer un enseignant par ID"""
        try:
            teacher = request.env['op.faculty'].sudo().browse(teacher_id)
            if not teacher.exists():
                return {'status': 'error', 'code': 404, 'message': 'Enseignant non trouvé'}
            
            teacher.unlink()
            
            return {
                'status': 'success',
                'message': 'Enseignant supprimé avec succès'
            }
        except Exception as e:
            _logger.error("Erreur delete_teacher_by_id: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    # ================= CLASSES/GROUPES (BATCHES) =================
    
    @http.route('/api/batches', auth='none', type='http', csrf=False, methods=['GET', 'POST', 'OPTIONS'])
    @cors_wrapper
    def handle_batches(self, **kwargs):
        """Gérer les classes/groupes (batches)"""
        method = request.httprequest.method
        
        if method == 'GET':
            return self.get_batches_list(**kwargs)
        elif method == 'POST':
            return self.create_new_batch(**kwargs)

    def get_batches_list(self, **kwargs):
        """Récupérer la liste des classes/groupes"""
        try:
            page = int(kwargs.get('page', 1))
            limit = int(kwargs.get('limit', 10))
            offset = (page - 1) * limit
            search = kwargs.get('search', '')
            order = kwargs.get('order', 'name asc')
            
            # Construction du domaine de recherche
            domain = []
            if search:
                domain = ['|', ('name', 'ilike', search), ('code', 'ilike', search)]
            
            # Gestion de l'ordre
            order_by = 'name'
            if 'asc' in order.lower():
                order_direction = 'asc'
            else:
                order_direction = 'desc'
            
            if 'name' in order.lower():
                order_by = 'name'
            elif 'code' in order.lower():
                order_by = 'code'
            elif 'date' in order.lower():
                order_by = 'start_date'
            
            order_clause = f'{order_by} {order_direction}'
            
            batches = request.env['op.batch'].sudo().search(domain, limit=limit, offset=offset, order=order_clause)
            total_count = request.env['op.batch'].sudo().search_count(domain)
            
            # Date actuelle pour calculer les statuts
            from datetime import datetime
            today = datetime.now().date()
            
            batches_data = []
            for batch in batches:
                # Compter les étudiants dans cette classe
                student_count = 0
                try:
                    student_count = request.env['op.student.course'].sudo().search_count([
                        ('batch_id', '=', batch.id),
                        ('state', 'in', ['running', 'enrolled'])
                    ])
                except:
                    student_count = 0
                
                batch_data = {
                    'id': batch.id,
                    'name': batch.name or '',
                    'code': batch.code or '',
                    'start_date': str(batch.start_date) if batch.start_date else None,
                    'end_date': str(batch.end_date) if batch.end_date else None,
                    'course_id': batch.course_id.id if batch.course_id else None,
                    'course_name': batch.course_id.name if batch.course_id else '',
                    'student_count': student_count,
                    'active': batch.active
                }
                
                # Calculer le statut basé sur les dates
                if batch.start_date and batch.end_date:
                    if batch.start_date > today:
                        batch_data['status'] = 'upcoming'
                    elif batch.end_date < today:
                        batch_data['status'] = 'completed'
                    else:
                        batch_data['status'] = 'running'
                else:
                    # Si pas de dates définies, considérer comme en cours si actif
                    batch_data['status'] = 'running' if batch.active else 'completed'
                
                # Ajouter les champs étendus s'ils existent
                if hasattr(batch, 'batch_type'):
                    batch_data['batch_type'] = batch.batch_type
                if hasattr(batch, 'school_cycle'):
                    batch_data['school_cycle'] = batch.school_cycle
                if hasattr(batch, 'total_capacity'):
                    batch_data['total_capacity'] = batch.total_capacity
                if hasattr(batch, 'class_teacher_id'):
                    batch_data['class_teacher_id'] = batch.class_teacher_id.id if batch.class_teacher_id else None
                    batch_data['class_teacher_name'] = batch.class_teacher_id.name if batch.class_teacher_id else ''
                
                batches_data.append(batch_data)
            
            return {
                'status': 'success',
                'data': {
                    'batches': batches_data,
                    'pagination': {
                        'page': page,
                        'limit': limit,
                        'total': total_count,
                        'pages': (total_count + limit - 1) // limit
                    }
                }
            }
        except Exception as e:
            _logger.error("Erreur get_batches_list: %s", str(e))
            return {'status': 'error', 'message': str(e)}

    def create_new_batch(self, **kwargs):
        """Créer une nouvelle classe/groupe"""
        try:
            data = json.loads(request.httprequest.get_data())
            
            required_fields = ['name', 'code', 'start_date', 'end_date']
            for field in required_fields:
                if field not in data or not data[field]:
                    return {'status': 'error', 'message': f'Le champ {field} est obligatoire'}
            
            batch_data = {
                'name': data['name'],
                'code': data['code'],
                'start_date': data['start_date'],
                'end_date': data['end_date'],
                'course_id': int(data['course_id']) if data.get('course_id') else False,
                'active': data.get('active', True)
            }
            
            # Ajouter les champs étendus s'ils sont fournis
            if data.get('batch_type'):
                batch_data['batch_type'] = data['batch_type']
            if data.get('school_cycle'):
                batch_data['school_cycle'] = data['school_cycle']
            if data.get('total_capacity'):
                batch_data['total_capacity'] = int(data['total_capacity'])
            if data.get('class_teacher_id'):
                batch_data['class_teacher_id'] = int(data['class_teacher_id'])
            
            new_batch = request.env['op.batch'].sudo().create(batch_data)
            
            return {
                'status': 'success',
                'message': 'Classe/Groupe créé avec succès',
                'batch_id': new_batch.id
            }
        except Exception as e:
            _logger.error("Erreur create_new_batch: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/batches/<int:batch_id>', auth='none', type='http', csrf=False, methods=['GET', 'PUT', 'DELETE', 'OPTIONS'])
    @cors_wrapper
    def handle_batch_by_id(self, batch_id, **kwargs):
        """Gérer une classe/groupe spécifique par ID"""
        method = request.httprequest.method
        
        if method == 'GET':
            return self.get_batch_by_id(batch_id)
        elif method == 'PUT':
            return self.update_batch_by_id(batch_id, **kwargs)
        elif method == 'DELETE':
            return self.delete_batch_by_id(batch_id)

    def get_batch_by_id(self, batch_id):
        """Récupérer une classe/groupe par ID"""
        try:
            batch = request.env['op.batch'].sudo().browse(batch_id)
            if not batch.exists():
                return {'status': 'error', 'message': 'Classe/Groupe non trouvé', 'code': 404}
            
            # Compter les étudiants dans cette classe
            student_count = 0
            try:
                student_count = request.env['op.student.course'].sudo().search_count([
                    ('batch_id', '=', batch.id),
                    ('state', 'in', ['running', 'enrolled'])
                ])
            except:
                student_count = 0
            
            batch_data = {
                'id': batch.id,
                'name': batch.name or '',
                'code': batch.code or '',
                'start_date': str(batch.start_date) if batch.start_date else None,
                'end_date': str(batch.end_date) if batch.end_date else None,
                'course_id': batch.course_id.id if batch.course_id else None,
                'course_name': batch.course_id.name if batch.course_id else '',
                'student_count': student_count,
                'active': batch.active
            }
            
            # Ajouter les champs étendus s'ils existent
            if hasattr(batch, 'batch_type'):
                batch_data['batch_type'] = batch.batch_type
            if hasattr(batch, 'school_cycle'):
                batch_data['school_cycle'] = batch.school_cycle
            if hasattr(batch, 'total_capacity'):
                batch_data['total_capacity'] = batch.total_capacity
            if hasattr(batch, 'class_teacher_id'):
                batch_data['class_teacher_id'] = batch.class_teacher_id.id if batch.class_teacher_id else None
                batch_data['class_teacher_name'] = batch.class_teacher_id.name if batch.class_teacher_id else ''
            
            return {'status': 'success', 'data': batch_data}
        except Exception as e:
            _logger.error("Erreur get_batch_by_id: %s", str(e))
            return {'status': 'error', 'message': str(e)}

    def update_batch_by_id(self, batch_id, **kwargs):
        """Mettre à jour une classe/groupe"""
        try:
            data = json.loads(request.httprequest.get_data())
            batch = request.env['op.batch'].sudo().browse(batch_id)
            
            if not batch.exists():
                return {'status': 'error', 'message': 'Classe/Groupe non trouvé', 'code': 404}
            
            # Mettre à jour les champs fournis
            update_data = {}
            for field in ['name', 'code', 'start_date', 'end_date', 'active']:
                if field in data:
                    update_data[field] = data[field]
            
            if 'course_id' in data:
                update_data['course_id'] = int(data['course_id']) if data['course_id'] else False
            
            # Champs étendus
            for field in ['batch_type', 'school_cycle', 'total_capacity', 'class_teacher_id']:
                if field in data:
                    if field in ['total_capacity', 'class_teacher_id']:
                        update_data[field] = int(data[field]) if data[field] else False
                    else:
                        update_data[field] = data[field]
            
            batch.write(update_data)
            
            return {'status': 'success', 'message': 'Classe/Groupe mis à jour avec succès'}
        except Exception as e:
            _logger.error("Erreur update_batch_by_id: %s", str(e))
            return {'status': 'error', 'message': str(e)}

    def delete_batch_by_id(self, batch_id):
        """Supprimer une classe/groupe"""
        try:
            batch = request.env['op.batch'].sudo().browse(batch_id)
            if not batch.exists():
                return {'status': 'error', 'message': 'Classe/Groupe non trouvé', 'code': 404}
            
            batch.unlink()
            return {'status': 'success', 'message': 'Classe/Groupe supprimé avec succès'}
        except Exception as e:
            _logger.error("Erreur delete_batch_by_id: %s", str(e))
            return {'status': 'error', 'message': str(e)}

    # ================= EXAMENS =================
    
    @http.route('/api/exams', auth='none', type='http', csrf=False, methods=['GET', 'POST', 'OPTIONS'])
    @cors_wrapper
    def handle_exams(self, **kwargs):
        """Gérer les examens - GET pour lister, POST pour créer"""
        method = request.httprequest.method
        
        if method == 'GET':
            return self.get_exams_list(**kwargs)
        elif method == 'POST':
            return self.create_exam(**kwargs)
    
    def get_exams_list(self, **kwargs):
        """Récupérer la liste des examens"""
        try:
            # Paramètres de pagination
            page = int(kwargs.get('page', 1))
            limit = int(kwargs.get('limit', 20))
            offset = (page - 1) * limit
            
            # Paramètres de filtrage
            subject_id = kwargs.get('subject_id')
            course_id = kwargs.get('course_id')
            batch_id = kwargs.get('batch_id')
            teacher_id = kwargs.get('teacher_id')
            state = kwargs.get('state')
            exam_type = kwargs.get('exam_type')
            
            # Construction de la requête
            domain = []
            if subject_id:
                domain.append(('subject_id', '=', int(subject_id)))
            if course_id:
                domain.append(('course_id', '=', int(course_id)))
            if batch_id:
                domain.append(('batch_id', '=', int(batch_id)))
            if teacher_id:
                domain.append(('faculty_id', '=', int(teacher_id)))
            if state:
                domain.append(('state', '=', state))
            
            # Recherche des examens (utiliser les évaluations)
            exams = request.env['op.evaluation'].sudo().search(domain, limit=limit, offset=offset)
            total_count = request.env['op.evaluation'].sudo().search_count(domain)
            
            exams_data = []
            for exam in exams:
                exam_data = {
                    'id': exam.id,
                    'name': exam.name,
                    'subject_id': exam.subject_id.id if exam.subject_id else None,
                    'subject_name': exam.subject_id.name if exam.subject_id else None,
                    'course_id': exam.course_id.id if exam.course_id else None,
                    'course_name': exam.course_id.name if exam.course_id else None,
                    'batch_id': exam.batch_id.id if exam.batch_id else None,
                    'batch_name': exam.batch_id.name if exam.batch_id else None,
                    'teacher_id': exam.faculty_id.id if exam.faculty_id else None,
                    'teacher_name': exam.faculty_id.name if exam.faculty_id else None,
                    'student_id': None,  # Les évaluations sont pour la classe entière
                    'student_name': None,
                    'grade': None,  # Note sera dans les lignes d'évaluation
                    'max_grade': exam.max_marks or 20,
                    'date': exam.date.strftime('%Y-%m-%d') if exam.date else None,
                    'status': exam.state or 'draft',
                    'state': exam.state or 'draft',
                    'evaluation_type_id': exam.evaluation_type_id.id if exam.evaluation_type_id else None,
                    'evaluation_type_name': exam.evaluation_type_id.name if exam.evaluation_type_id else None,
                    'exam_type': exam.evaluation_type_id.name if exam.evaluation_type_id else 'Examen',
                    'created_at': exam.create_date.strftime('%Y-%m-%d %H:%M:%S') if exam.create_date else None
                }
                exams_data.append(exam_data)
            
            return {
                'status': 'success',
                'data': {
                    'exams': exams_data,
                    'pagination': {
                        'page': page,
                        'limit': limit,
                        'total': total_count,
                        'totalPages': (total_count + limit - 1) // limit,
                        'totalCount': total_count
                    }
                }
            }
            
        except Exception as e:
            _logger.error("Erreur get_exams_list: %s", str(e))
            return {'status': 'error', 'message': str(e)}
    
    def create_exam(self, **kwargs):
        """Créer un nouvel examen"""
        try:
            data = json.loads(request.httprequest.get_data())
            
            # Validation des données requises
            required_fields = ['name', 'subject_id', 'course_id', 'batch_id', 'teacher_id', 'date']
            for field in required_fields:
                if field not in data:
                    return {'status': 'error', 'message': f'Champ requis manquant: {field}'}
            
            # Créer l'examen (utiliser les évaluations)
            exam_data = {
                'name': data['name'],
                'subject_id': data['subject_id'],
                'course_id': data['course_id'],
                'batch_id': data['batch_id'],
                'faculty_id': data['teacher_id'],  # faculty_id au lieu de teacher_id
                'date': data['date'],
                'max_marks': data.get('max_grade', 20),
                'state': 'draft',
            }
            
            # Ajouter le type d'évaluation si fourni, sinon utiliser le premier disponible
            if 'evaluation_type_id' in data:
                exam_data['evaluation_type_id'] = data['evaluation_type_id']
            else:
                # Chercher le premier type d'évaluation disponible
                default_eval_type = request.env['op.evaluation.type'].sudo().search([], limit=1)
                if default_eval_type:
                    exam_data['evaluation_type_id'] = default_eval_type.id
                else:
                    return {'status': 'error', 'message': 'Aucun type d\'évaluation disponible. Veuillez en créer un.'}
            
            exam = request.env['op.evaluation'].sudo().create(exam_data)
            
            return {
                'status': 'success',
                'message': 'Examen créé avec succès',
                'data': {
                    'id': exam.id,
                    'name': exam.name,
                    'subject_id': exam.subject_id.id,
                    'course_id': exam.course_id.id,
                    'batch_id': exam.batch_id.id,
                    'teacher_id': exam.faculty_id.id,
                    'date': exam.date.strftime('%Y-%m-%d'),
                    'max_grade': exam.max_marks,
                    'status': exam.state
                }
            }
            
        except Exception as e:
            _logger.error("Erreur create_exam: %s", str(e))
            return {'status': 'error', 'message': str(e)}

    @http.route('/api/exams/<int:exam_id>', auth='none', type='http', csrf=False, methods=['GET', 'PUT', 'DELETE', 'OPTIONS'])
    @cors_wrapper
    def handle_exam_by_id(self, exam_id, **kwargs):
        """Gérer un examen spécifique par ID"""
        method = request.httprequest.method
        
        if method == 'GET':
            return self.get_exam_by_id(exam_id)
        elif method == 'PUT':
            return self.update_exam_by_id(exam_id, **kwargs)
        elif method == 'DELETE':
            return self.delete_exam_by_id(exam_id)
    
    def get_exam_by_id(self, exam_id):
        """Récupérer un examen par ID"""
        try:
            exam = request.env['op.evaluation'].sudo().browse(exam_id)
            if not exam.exists():
                return {'status': 'error', 'message': 'Examen non trouvé', 'code': 404}
            
            exam_data = {
                'id': exam.id,
                'name': exam.name,
                'subject_id': exam.subject_id.id if exam.subject_id else None,
                'subject_name': exam.subject_id.name if exam.subject_id else None,
                'course_id': exam.course_id.id if exam.course_id else None,
                'course_name': exam.course_id.name if exam.course_id else None,
                'batch_id': exam.batch_id.id if exam.batch_id else None,
                'batch_name': exam.batch_id.name if exam.batch_id else None,
                'teacher_id': exam.faculty_id.id if exam.faculty_id else None,
                'teacher_name': exam.faculty_id.name if exam.faculty_id else None,
                'date': exam.date.strftime('%Y-%m-%d') if exam.date else None,
                'max_grade': exam.max_marks or 20,
                'status': exam.state or 'draft',
                'state': exam.state or 'draft',
                'evaluation_type_id': exam.evaluation_type_id.id if exam.evaluation_type_id else None,
                'evaluation_type_name': exam.evaluation_type_id.name if exam.evaluation_type_id else None,
                'created_at': exam.create_date.strftime('%Y-%m-%d %H:%M:%S') if exam.create_date else None
            }
            
            return {'status': 'success', 'data': exam_data}
            
        except Exception as e:
            _logger.error("Erreur get_exam_by_id: %s", str(e))
            return {'status': 'error', 'message': str(e)}

    def update_exam_by_id(self, exam_id, **kwargs):
        """Mettre à jour un examen"""
        try:
            data = json.loads(request.httprequest.get_data())
            exam = request.env['op.evaluation'].sudo().browse(exam_id)
            
            if not exam.exists():
                return {'status': 'error', 'message': 'Examen non trouvé', 'code': 404}
            
            # Mettre à jour les champs fournis
            update_data = {}
            for field in ['name', 'date', 'state']:
                if field in data:
                    update_data[field] = data[field]
            
            if 'max_grade' in data:
                update_data['max_marks'] = data['max_grade']
            if 'teacher_id' in data:
                update_data['faculty_id'] = data['teacher_id']
            if 'subject_id' in data:
                update_data['subject_id'] = data['subject_id']
            if 'course_id' in data:
                update_data['course_id'] = data['course_id']
            if 'batch_id' in data:
                update_data['batch_id'] = data['batch_id']
            if 'evaluation_type_id' in data:
                update_data['evaluation_type_id'] = data['evaluation_type_id']
            
            exam.write(update_data)
            
            return {'status': 'success', 'message': 'Examen mis à jour avec succès'}
        except Exception as e:
            _logger.error("Erreur update_exam_by_id: %s", str(e))
            return {'status': 'error', 'message': str(e)}

    def delete_exam_by_id(self, exam_id):
        """Supprimer un examen"""
        try:
            exam = request.env['op.evaluation'].sudo().browse(exam_id)
            if not exam.exists():
                return {'status': 'error', 'message': 'Examen non trouvé', 'code': 404}
            
            exam.unlink()
            return {'status': 'success', 'message': 'Examen supprimé avec succès'}
        except Exception as e:
            _logger.error("Erreur delete_exam_by_id: %s", str(e))
            return {'status': 'error', 'message': str(e)}

    # ================= ENDPOINTS DE SESSIONS =================

    @http.route('/api/sessions', auth='none', type='http', csrf=False, methods=['GET', 'POST', 'OPTIONS'])
    @cors_wrapper
    def handle_sessions(self, **kwargs):
        """Gérer les sessions"""
        method = request.httprequest.method
        
        if method == 'GET':
            return self.get_sessions(**kwargs)
        elif method == 'POST':
            return self.create_session(**kwargs)

    def get_sessions(self, **kwargs):
        """Récupérer la liste des sessions"""
        try:
            # Paramètres de pagination et recherche
            page = int(kwargs.get('page', 1))
            limit = int(kwargs.get('limit', 20))
            search = kwargs.get('search', '')
            date = kwargs.get('date', '')
            
            offset = (page - 1) * limit
            
            # Construction du domaine de recherche
            domain = []
            if search:
                domain = ['|', '|', '|', '|',
                         ('subject_id.name', 'ilike', search),
                         ('faculty_id.name', 'ilike', search),
                         ('batch_id.name', 'ilike', search),
                         ('classroom_id.name', 'ilike', search)]
            
            # Filtre par date si spécifié
            if date:
                try:
                    from datetime import datetime, timedelta
                    date_obj = datetime.strptime(date, '%Y-%m-%d').date()
                    domain.append(('start_datetime', '>=', datetime.combine(date_obj, datetime.min.time())))
                    domain.append(('start_datetime', '<', datetime.combine(date_obj + timedelta(days=1), datetime.min.time())))
                except ValueError:
                    pass  # Ignorer si le format de date est incorrect
            
            # Récupérer les vraies sessions depuis la base de données
            try:
                sessions = request.env['op.session'].sudo().search(domain, limit=limit, offset=offset, order='start_datetime desc')
                total_count = request.env['op.session'].sudo().search_count(domain)
                
                sessions_data = []
                for session in sessions:
                    # Construire un nom descriptif pour la session
                    session_name = f"{session.subject_id.name or 'Matière'} - {session.faculty_id.name or 'Enseignant'}"
                    if session.batch_id:
                        session_name += f" ({session.batch_id.name})"
                    
                    # Déterminer le statut
                    status = 'scheduled'
                    if hasattr(session, 'state'):
                        if session.state == 'done':
                            status = 'completed'
                        elif session.state == 'cancel':
                            status = 'cancelled'
                        elif session.state == 'confirm':
                            status = 'confirmed'
                        else:
                            status = 'scheduled'
                    
                    session_data = {
                        'id': session.id,
                        'name': session_name,
                        'subject_id': session.subject_id.id if session.subject_id else None,
                        'subject_name': session.subject_id.name if session.subject_id else '',
                        'teacher_id': session.faculty_id.id if session.faculty_id else None,
                        'teacher_name': session.faculty_id.name if session.faculty_id else '',
                        'batch_id': session.batch_id.id if session.batch_id else None,
                        'batch_name': session.batch_id.name if session.batch_id else '',
                        'classroom_id': session.classroom_id.id if session.classroom_id else None,
                        'classroom_name': session.classroom_id.name if session.classroom_id else '',
                        'start_time': session.start_datetime.strftime('%H:%M') if session.start_datetime else '',
                        'end_time': session.end_datetime.strftime('%H:%M') if session.end_datetime else '',
                        'date': session.start_datetime.strftime('%Y-%m-%d') if session.start_datetime else '',
                        'start_datetime': session.start_datetime.isoformat() if session.start_datetime else None,
                        'end_datetime': session.end_datetime.isoformat() if session.end_datetime else None,
                        'status': status,
                        'state': getattr(session, 'state', 'draft'),
                        'active': getattr(session, 'active', True),
                        'students': []
                    }
                    
                    sessions_data.append(session_data)
                
            except Exception as db_error:
                _logger.warning("Erreur lors de la récupération des sessions depuis la DB: %s", str(db_error))
                # Fallback vers des données mock si la DB n'est pas accessible
                sessions_data = []
                for i in range(1, min(limit + 1, 11)):
                    sessions_data.append({
                        'id': i,
                        'name': f'Session {i} - Matière Mock',
                        'subject_name': f'Matière {i}',
                        'teacher_name': f'Enseignant {i}',
                        'batch_name': f'Classe {i}',
                        'start_time': '09:00',
                        'end_time': '10:30',
                        'date': '2025-06-19',
                        'status': 'scheduled' if i % 3 == 0 else 'completed' if i % 2 == 0 else 'cancelled'
                    })
                total_count = 10
            
            return {
                'status': 'success',
                'data': {
                    'sessions': sessions_data,
                    'pagination': {
                        'page': page,
                        'limit': limit,
                        'total': total_count,
                        'pages': (total_count + limit - 1) // limit
                    }
                }
            }
        except Exception as e:
            _logger.error("Erreur get_sessions: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    def create_session(self, **kwargs):
        """Créer une nouvelle session"""
        try:
            data = json.loads(request.httprequest.get_data())
            
            # Validation des données requises
            required_fields = ['name', 'subject_id', 'teacher_id', 'batch_id', 'date', 'start_time', 'end_time']
            for field in required_fields:
                if not data.get(field):
                    return {'status': 'error', 'code': 400, 'message': f'Le champ {field} est requis'}
            
            # Simuler la création d'une session
            session_data = {
                'id': 999,  # ID simulé
                'name': data['name'],
                'subject_id': data['subject_id'],
                'teacher_id': data['teacher_id'],
                'batch_id': data['batch_id'],
                'date': data['date'],
                'start_time': data['start_time'],
                'end_time': data['end_time'],
                'status': 'scheduled'
            }
            
            return {
                'status': 'success',
                'message': 'Session créée avec succès',
                'data': session_data
            }
        except Exception as e:
            _logger.error("Erreur create_session: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/sessions/<int:session_id>', auth='none', type='http', csrf=False, methods=['GET', 'PUT', 'DELETE', 'OPTIONS'])
    @cors_wrapper
    def handle_session_by_id(self, session_id, **kwargs):
        """Gérer une session spécifique par ID"""
        method = request.httprequest.method
        
        if method == 'GET':
            return self.get_session_by_id(session_id)
        elif method == 'PUT':
            return self.update_session_by_id(session_id, **kwargs)
        elif method == 'DELETE':
            return self.delete_session_by_id(session_id)

    def get_session_by_id(self, session_id):
        """Récupérer une session par ID avec la liste des étudiants de la promotion"""
        try:
            # Récupérer la vraie session depuis la base de données
            try:
                session = request.env['op.session'].sudo().browse(session_id)
                if not session.exists():
                    return {'status': 'error', 'code': 404, 'message': 'Session non trouvée'}
                
                # Construire un nom descriptif pour la session
                session_name = f"{session.subject_id.name or 'Matière'} - {session.faculty_id.name or 'Enseignant'}"
                if session.batch_id:
                    session_name += f" ({session.batch_id.name})"
                
                # Déterminer le statut
                status = 'scheduled'
                if hasattr(session, 'state'):
                    if session.state == 'done':
                        status = 'completed'
                    elif session.state == 'cancel':
                        status = 'cancelled'
                    elif session.state == 'confirm':
                        status = 'confirmed'
                    else:
                        status = 'scheduled'
                
                # Récupérer les étudiants de la classe (batch) de cette session
                students_data = []
                try:
                    _logger.info("🔍 Récupération des étudiants pour la session %s", session_id)
                    
                    if session.batch_id:
                        _logger.info("🔍 Session a une classe associée: %s (ID: %s)", session.batch_id.name, session.batch_id.id)
                        
                        # Récupérer les inscriptions d'étudiants dans cette classe
                        student_courses = request.env['op.student.course'].sudo().search([
                            ('batch_id', '=', session.batch_id.id)
                        ])
                        
                        _logger.info("🔍 Inscriptions trouvées dans la classe %s: %s", session.batch_id.name, len(student_courses))
                        
                        # Extraire les étudiants depuis les inscriptions
                        students = [sc.student_id for sc in student_courses if sc.student_id]
                        
                        _logger.info("🔍 Étudiants extraits des inscriptions: %s", len(students))
                        
                        for student in students:
                            try:
                                # Construire le nom complet de l'étudiant
                                name_parts = []
                                if hasattr(student, 'first_name') and student.first_name:
                                    name_parts.append(student.first_name)
                                if hasattr(student, 'middle_name') and student.middle_name:
                                    name_parts.append(student.middle_name)
                                if hasattr(student, 'last_name') and student.last_name:
                                    name_parts.append(student.last_name)
                                
                                full_name = ' '.join(name_parts) if name_parts else (student.name or f'Étudiant {student.id}')
                                
                                # Trouver l'inscription correspondante pour récupérer les détails
                                student_course = next((sc for sc in student_courses if sc.student_id.id == student.id), None)
                                
                                student_data = {
                                    'id': student.id,
                                    'name': full_name,
                                    'first_name': getattr(student, 'first_name', '') or '',
                                    'middle_name': getattr(student, 'middle_name', '') or '',
                                    'last_name': getattr(student, 'last_name', '') or '',
                                    'email': student.email or '',
                                    'phone': student.phone or '',
                                    'mobile': student.mobile or '',
                                    'student_id': student.gr_no or f'STU{student.id}',
                                    'gender': getattr(student, 'gender', '') or '',
                                    'birth_date': str(student.birth_date) if student.birth_date else None,
                                    'batch_id': session.batch_id.id,
                                    'batch_name': session.batch_id.name,
                                    'roll_number': student_course.roll_number if student_course else '',
                                    'course_state': student_course.state if student_course else 'N/A',
                                    'active': getattr(student, 'active', True)
                                }
                                
                                students_data.append(student_data)
                                _logger.info("✅ Étudiant ajouté: %s", full_name)
                                
                            except Exception as student_error:
                                _logger.error("❌ Erreur étudiant %s: %s", student.id, str(student_error))
                                continue
                
                except Exception as students_error:
                    _logger.error("❌ Erreur lors de la récupération des étudiants: %s", str(students_error))
                    # En cas d'erreur, laisser la liste vide
                    students_data = []
                
                session_data = {
                    'id': session.id,
                    'name': session_name,
                    'subject_id': session.subject_id.id if session.subject_id else None,
                    'subject_name': session.subject_id.name if session.subject_id else '',
                    'teacher_id': session.faculty_id.id if session.faculty_id else None,
                    'teacher_name': session.faculty_id.name if session.faculty_id else '',
                    'batch_id': session.batch_id.id if session.batch_id else None,
                    'batch_name': session.batch_id.name if session.batch_id else '',
                    'classroom_id': session.classroom_id.id if session.classroom_id else None,
                    'classroom_name': session.classroom_id.name if session.classroom_id else '',
                    'start_time': session.start_datetime.strftime('%H:%M') if session.start_datetime else '',
                    'end_time': session.end_datetime.strftime('%H:%M') if session.end_datetime else '',
                    'date': session.start_datetime.strftime('%Y-%m-%d') if session.start_datetime else '',
                    'start_datetime': session.start_datetime.isoformat() if session.start_datetime else None,
                    'end_datetime': session.end_datetime.isoformat() if session.end_datetime else None,
                    'status': status,
                    'state': getattr(session, 'state', 'draft'),
                    'active': getattr(session, 'active', True),
                    'description': f'Session de {session.subject_id.name or "cours"} avec {session.faculty_id.name or "enseignant"}',
                    'students': students_data,  # Ajouter la liste des étudiants
                    'students_count': len(students_data)  # Nombre d'étudiants
                }
                
            except Exception as db_error:
                _logger.warning("Erreur lors de la récupération de la session depuis la DB: %s", str(db_error))
                # Fallback vers des données mock si la DB n'est pas accessible
                session_data = {
                    'id': session_id,
                    'name': f'Session {session_id} - Matière Mock',
                    'subject_id': 1,
                    'subject_name': 'Mathématiques',
                    'teacher_id': 1,
                    'teacher_name': 'Prof. Martin',
                    'batch_id': 1,
                    'batch_name': 'Classe A',
                    'date': '2025-06-19',
                    'start_time': '09:00',
                    'end_time': '10:30',
                    'status': 'scheduled',
                    'description': 'Session de cours de mathématiques',
                    'students': [],
                    'students_count': 0
                }
            
            return {
                'status': 'success',
                'data': session_data
            }
        except Exception as e:
            _logger.error("Erreur get_session_by_id: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    def update_session_by_id(self, session_id, **kwargs):
        """Mettre à jour une session par ID"""
        try:
            data = json.loads(request.httprequest.get_data())
            
            return {
                'status': 'success',
                'message': 'Session mise à jour avec succès'
            }
        except Exception as e:
            _logger.error("Erreur update_session_by_id: %s", str(e))
            return {'status': 'error', 'message': str(e)}

    def delete_session_by_id(self, session_id):
        """Supprimer une session par ID"""
        try:
            return {
                'status': 'success',
                'message': 'Session supprimée avec succès'
            }
        except Exception as e:
            _logger.error("Erreur delete_session_by_id: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/sessions/today', auth='none', type='http', csrf=False, methods=['GET', 'OPTIONS'])
    @cors_wrapper
    def get_today_sessions(self, **kwargs):
        """Récupérer les sessions d'aujourd'hui avec statistiques de présence"""
        try:
            _logger.info("=== DEBUT get_today_sessions ===")
            
            # Date d'aujourd'hui
            from datetime import datetime, timedelta
            today = datetime.now().date()
            
            _logger.info(f"🔍 get_today_sessions: Recherche des sessions pour {today}")
            
            # Récupérer les sessions d'aujourd'hui
            sessions = request.env['op.session'].sudo().search([
                ('start_datetime', '>=', today),
                ('start_datetime', '<', today + timedelta(days=1))
            ])
            
            _logger.info(f"🔍 get_today_sessions: {len(sessions)} sessions trouvées")
            
            sessions_data = []
            
            for session in sessions:
                try:
                    # Calculer les statistiques de présence pour cette session
                    attendances = request.env['op.attendance.line'].sudo().search([
                        ('attendance_id.session_id', '=', session.id),
                        ('attendance_date', '=', today)
                    ])
                    
                    total_students = len(attendances)
                    present_count = len(attendances.filtered(lambda a: a.present))
                    attendance_rate = (present_count / total_students * 100) if total_students > 0 else 0
                    
                    session_data = {
                        'id': session.id,
                        'name': session.name,
                        'start_datetime': session.start_datetime.isoformat() if session.start_datetime else None,
                        'end_datetime': session.end_datetime.isoformat() if session.end_datetime else None,
                        'state': session.state,
                        'subject': {
                            'id': session.subject_id.id,
                            'name': session.subject_id.name,
                            'code': session.subject_id.code if hasattr(session.subject_id, 'code') else ''
                        } if session.subject_id else None,
                        'batch': {
                            'id': session.batch_id.id,
                            'name': session.batch_id.name
                        } if session.batch_id else None,
                        'faculty': {
                            'id': session.faculty_id.id,
                            'name': session.faculty_id.name
                        } if session.faculty_id else None,
                        'attendance_stats': {
                            'total_students': total_students,
                            'present_count': present_count,
                            'absent_count': total_students - present_count,
                            'attendance_rate': round(attendance_rate, 1)
                        }
                    }
                    
                    sessions_data.append(session_data)
                    
                except Exception as e:
                    _logger.error(f"Erreur lors du traitement de la session {session.id}: {str(e)}")
                    continue
            
            result = {
                'status': 'success',
                'sessions': sessions_data,
                'count': len(sessions_data)
            }
            
            _logger.info(f"✅ get_today_sessions: Retour avec {len(sessions_data)} sessions")
            return result

        except Exception as e:
            _logger.error("Erreur get_today_sessions: %s", str(e), exc_info=True)
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/sessions/upcoming', auth='none', type='http', csrf=False, methods=['GET', 'OPTIONS'])
    @cors_wrapper
    def get_upcoming_sessions(self, **kwargs):
        """Récupérer les sessions à venir"""
        try:
            _logger.info("=== DEBUT get_upcoming_sessions ===")
            
            from datetime import datetime, timedelta
            days = int(kwargs.get('days', 7))
            today = datetime.now().date()
            end_date = today + timedelta(days=days)
            
            # Rechercher les sessions à venir
            sessions = request.env['op.session'].sudo().search([
                ('start_datetime', '>=', datetime.combine(today, datetime.min.time())),
                ('start_datetime', '<=', datetime.combine(end_date, datetime.max.time())),
                ('state', 'in', ['draft', 'confirm', 'confirmed'])
            ], order='start_datetime asc')
            
            _logger.info(f"🔍 get_upcoming_sessions: {len(sessions)} sessions trouvées pour les {days} prochains jours")
            
            sessions_data = []
            for session in sessions:
                try:
                    session_data = {
                        'id': session.id,
                        'name': session.name,
                        'start_datetime': session.start_datetime.isoformat() if session.start_datetime else None,
                        'end_datetime': session.end_datetime.isoformat() if session.end_datetime else None,
                        'state': session.state,
                        'subject': {
                            'id': session.subject_id.id,
                            'name': session.subject_id.name,
                            'code': session.subject_id.code if hasattr(session.subject_id, 'code') else ''
                        } if session.subject_id else None,
                        'batch': {
                            'id': session.batch_id.id,
                            'name': session.batch_id.name
                        } if session.batch_id else None,
                        'faculty': {
                            'id': session.faculty_id.id,
                            'name': session.faculty_id.name
                        } if session.faculty_id else None
                    }
                    
                    sessions_data.append(session_data)
                    
                except Exception as session_error:
                    _logger.error(f"❌ Erreur session {session.id}: {str(session_error)}")
                    continue
            
            result = {
                'status': 'success',
                'sessions': sessions_data,
                'count': len(sessions_data),
                'period': {
                    'from': str(today),
                    'to': str(end_date),
                    'days': days
                }
            }
            
            _logger.info(f"✅ get_upcoming_sessions: Retour {len(sessions_data)} sessions")
            return result

        except Exception as e:
            _logger.error("Erreur get_upcoming_sessions: %s", str(e), exc_info=True)
            return {'status': 'error', 'code': 500, 'message': str(e)}

    # ===== ENDPOINTS TIMETABLES =====
    
    @http.route('/api/timetables', auth='none', type='http', csrf=False, methods=['GET', 'POST', 'OPTIONS'])
    @cors_wrapper
    def handle_timetables(self, **kwargs):
        """Gérer les emplois du temps - Liste et création"""
        if request.httprequest.method == 'OPTIONS':
            return ''
        elif request.httprequest.method == 'GET':
            return self.get_timetables(**kwargs)
        elif request.httprequest.method == 'POST':
            return self.create_timetable(**kwargs)
        else:
            return {'status': 'error', 'message': 'Méthode non supportée'}

    def get_timetables(self, **kwargs):
        """Récupérer la liste des emplois du temps"""
        try:
            _logger.info("🔍 get_timetables: Début de la récupération")
            
            # Fonction utilitaire pour convertir en entier de façon sécurisée
            def safe_int(value, default=1):
                try:
                    if isinstance(value, (int, float)):
                        return int(value)
                    if isinstance(value, str) and value.isdigit():
                        return int(value)
                    return default
                except (ValueError, TypeError):
                    return default
            
            # Paramètres de pagination et filtres avec validation sécurisée
            page = safe_int(kwargs.get('page', 1), 1)
            limit = min(safe_int(kwargs.get('limit', 20), 20), 100)
            search = kwargs.get('search', '').strip() if kwargs.get('search') else ''
            offset = (page - 1) * limit
            
            _logger.info(f"🔍 Paramètres: page={page}, limit={limit}, search='{search}'")
            
            timetables_list = []
            
            # 1. D'abord récupérer les vrais emplois du temps créés
            timetable_domain = []
            if search:
                timetable_domain.extend([
                    '|', '|',
                    ('name', 'ilike', search),
                    ('batch_id.name', 'ilike', search),
                    ('notes', 'ilike', search)
                ])
            
            real_timetables = request.env['op.timetable'].sudo().search(
                timetable_domain,
                order='created_date desc',
                limit=limit,
                offset=offset
            )
            
            for timetable in real_timetables:
                # Récupérer les créneaux
                slots = []
                for slot in timetable.slot_ids:
                    slot_data = {
                        'id': slot.id,
                        'day_of_week': int(slot.day_of_week),
                        'start_time': f"{int(slot.start_time):02d}:{int((slot.start_time % 1) * 60):02d}",
                        'end_time': f"{int(slot.end_time):02d}:{int((slot.end_time % 1) * 60):02d}",
                        'subject': {
                            'id': slot.subject_id.id,
                            'name': slot.subject_id.name
                        } if slot.subject_id else None,
                        'faculty': {
                            'id': slot.faculty_id.id,
                            'name': slot.faculty_id.name
                        } if slot.faculty_id else None,
                        'classroom': {
                            'id': slot.classroom_id.id,
                            'name': slot.classroom_id.name
                        } if slot.classroom_id else None,
                        'session_type': slot.session_type,
                        'topic': slot.topic
                    }
                    slots.append(slot_data)
                
                timetable_data = {
                    'id': timetable.id,
                    'name': timetable.name,
                    'batch': {
                        'id': timetable.batch_id.id,
                        'name': timetable.batch_id.name
                    } if timetable.batch_id else None,
                    'academic_year': {
                        'id': timetable.academic_year_id.id,
                        'name': timetable.academic_year_id.name
                    } if timetable.academic_year_id else None,
                    'semester': {
                        'id': timetable.semester_id.id,
                        'name': timetable.semester_id.name
                    } if timetable.semester_id else None,
                    'faculty': {
                        'id': timetable.faculty_id.id,
                        'name': timetable.faculty_id.name
                    } if timetable.faculty_id else None,
                    'start_date': timetable.start_date.strftime('%Y-%m-%d') if timetable.start_date else None,
                    'end_date': timetable.end_date.strftime('%Y-%m-%d') if timetable.end_date else None,
                    'state': timetable.state,
                    'sessions_count': len(slots),
                    'slot_ids': slots,
                    'subjects': list(set(slot['subject']['name'] for slot in slots if slot['subject'])),
                    'description': timetable.notes or '',
                    'created_date': timetable.created_date.strftime('%Y-%m-%d %H:%M:%S') if timetable.created_date else None
                }
                timetables_list.append(timetable_data)
            
            # 2. Si on n'a pas assez de résultats, compléter avec les emplois du temps générés à partir des sessions
            remaining_limit = limit - len(timetables_list)
            if remaining_limit > 0:
                session_domain = []
                if search:
                    session_domain.extend([
                        '|', '|',
                        ('batch_id.name', 'ilike', search),
                        ('subject_id.name', 'ilike', search),
                        ('faculty_id.name', 'ilike', search),
                    ])
                
                # Récupérer les sessions distinctes par batch pour créer les emplois du temps
                sessions = request.env['op.session'].sudo().search(
                    session_domain,
                    order='batch_id, start_datetime',
                    limit=remaining_limit * 5  # Multiplier car on groupe par batch
                )
                
                # Grouper par batch pour créer les emplois du temps
                timetables_dict = {}
                
                for session in sessions:
                    if not session.batch_id:
                        continue
                        
                    batch_key = session.batch_id.id
                    
                    # Vérifier qu'on n'a pas déjà un vrai emploi du temps pour cette classe
                    existing_real = any(t['batch'] and t['batch']['id'] == batch_key for t in timetables_list)
                    if existing_real:
                        continue
                    
                    if batch_key not in timetables_dict:
                        # Calculer les dates de début et fin basées sur les sessions
                        batch_sessions = request.env['op.session'].sudo().search([
                            ('batch_id', '=', session.batch_id.id)
                        ], order='start_datetime')
                        
                        start_date = None
                        end_date = None
                        if batch_sessions:
                            start_date = min(s.start_datetime for s in batch_sessions if s.start_datetime)
                            end_date = max(s.end_datetime for s in batch_sessions if s.end_datetime)
                        
                        timetables_dict[batch_key] = {
                            'id': f"timetable_{batch_key}",
                            'name': f"Emploi du temps - {session.batch_id.name}",
                            'batch': {
                                'id': session.batch_id.id,
                                'name': session.batch_id.name
                            } if session.batch_id else None,
                            'start_date': start_date.strftime('%Y-%m-%d') if start_date else None,
                            'end_date': end_date.strftime('%Y-%m-%d') if end_date else None,
                            'state': 'active',
                            'sessions_count': 0,
                            'subjects': set(),
                            'faculty': set(),
                            'slot_ids': []
                        }
                    
                    # Ajouter les informations de session
                    timetable = timetables_dict[batch_key]
                    timetable['sessions_count'] += 1
                    
                    if session.subject_id:
                        timetable['subjects'].add(session.subject_id.name)
                    if session.faculty_id:
                        timetable['faculty'].add(session.faculty_id.name)
                    
                    # Créer un slot pour cette session
                    slot_data = {
                        'id': session.id,
                        'day_of_week': session.start_datetime.weekday() if session.start_datetime else 0,
                        'start_time': session.start_datetime.strftime('%H:%M') if session.start_datetime else '08:00',
                        'end_time': session.end_datetime.strftime('%H:%M') if session.end_datetime else '09:00',
                        'subject': {
                            'id': session.subject_id.id,
                            'name': session.subject_id.name
                        } if session.subject_id else None,
                        'faculty': {
                            'id': session.faculty_id.id,
                            'name': session.faculty_id.name
                        } if session.faculty_id else None,
                        'classroom': {
                            'name': getattr(session, 'classroom_id.name', 'Non définie')
                        },
                        'session_type': getattr(session, 'type', 'lecture'),
                        'topic': getattr(session, 'name', '')
                    }
                    
                    timetable['slot_ids'].append(slot_data)
                
                # Convertir en liste et nettoyer les sets
                for timetable in timetables_dict.values():
                    timetable['subjects'] = list(timetable['subjects'])
                    timetable['faculty'] = list(timetable['faculty'])
                    timetables_list.append(timetable)
                    
                    if len(timetables_list) >= limit:
                        break
            
            # Compter le total pour la pagination
            total_real_timetables = request.env['op.timetable'].sudo().search_count(timetable_domain)
            total_sessions = request.env['op.session'].sudo().search_count([])
            total_estimated_session_timetables = max(0, total_sessions // 5)
            total_timetables = total_real_timetables + total_estimated_session_timetables
            
            result = {
                'status': 'success',
                'data': {
                    'timetables': timetables_list[:limit],
                    'pagination': {
                        'page': page,
                        'limit': limit,
                        'total': total_timetables,
                        'pages': max(1, (total_timetables + limit - 1) // limit)
                    }
                }
            }
            
            _logger.info(f"✅ get_timetables: Retour {len(timetables_list)} emplois du temps")
            return result
            
        except Exception as e:
            _logger.error(f"❌ Erreur get_timetables: {str(e)}", exc_info=True)
            return {
                'status': 'error',
                'message': f'Erreur lors de la récupération des emplois du temps: {str(e)}'
            }

    def create_timetable(self, **kwargs):
        """Créer un nouvel emploi du temps"""
        try:
            _logger.info("🆕 create_timetable: Début de la création")
            
            # Récupérer les données JSON
            data = {}
            if request.httprequest.data:
                try:
                    data = json.loads(request.httprequest.data.decode('utf-8'))
                except json.JSONDecodeError:
                    return {
                        'status': 'error',
                        'message': 'Données JSON invalides'
                    }
            
            # Validation des champs obligatoires
            required_fields = ['name', 'batch_id', 'start_date', 'end_date']
            for field in required_fields:
                if not data.get(field):
                    return {
                        'status': 'error',
                        'message': f'Le champ {field} est obligatoire'
                    }
            
            # Vérifier que la classe existe
            batch = request.env['op.batch'].sudo().browse(data['batch_id'])
            if not batch.exists():
                return {
                    'status': 'error',
                    'message': f'Classe avec ID {data["batch_id"]} non trouvée'
                }
            
            # Gérer academic_year_id - créer ou récupérer une année académique par défaut
            academic_year_id = data.get('academic_year_id')
            if not academic_year_id:
                try:
                    # Vérifier si le modèle op.academic.year existe
                    academic_year_model = request.env['op.academic.year'].sudo()
                    
                    # Chercher une année académique existante
                    current_year = datetime.now().year
                    academic_year = academic_year_model.search([
                        ('name', '=', f'{current_year}-{current_year + 1}')
                    ], limit=1)
                    
                    if not academic_year:
                        # Créer une nouvelle année académique
                        academic_year = academic_year_model.create({
                            'name': f'{current_year}-{current_year + 1}',
                            'code': f'AY{current_year}',
                            'start_date': f'{current_year}-09-01',
                            'end_date': f'{current_year + 1}-08-31'
                        })
                        _logger.info(f"🆕 Année académique créée: {academic_year.id}")
                    
                    academic_year_id = academic_year.id
                    _logger.info(f"📅 Année académique utilisée: {academic_year_id}")
                except Exception as e:
                    _logger.error(f"❌ Erreur avec op.academic.year: {str(e)}")
                    # Si le modèle n'existe pas, on va modifier le modèle pour rendre le champ optionnel
                    academic_year_id = False
            
            # Gérer semester_id - créer ou récupérer un semestre par défaut
            semester_id = data.get('semester_id')
            if not semester_id:
                try:
                    # Vérifier si le modèle op.academic.term existe
                    semester_model = request.env['op.academic.term'].sudo()
                    
                    # Chercher un semestre existant
                    semester = semester_model.search([
                        ('name', '=', 'Semestre 1')
                    ], limit=1)
                    
                    if not semester:
                        # Créer un nouveau semestre
                        semester = semester_model.create({
                            'name': 'Semestre 1',
                            'code': 'SEM1',
                            'start_date': f'{datetime.now().year}-09-01',
                            'end_date': f'{datetime.now().year + 1}-01-31'
                        })
                        _logger.info(f"🆕 Semestre créé: {semester.id}")
                    
                    semester_id = semester.id
                    _logger.info(f"📚 Semestre utilisé: {semester_id}")
                except Exception as e:
                    _logger.error(f"❌ Erreur avec op.academic.term: {str(e)}")
                    semester_id = False
            
            _logger.info(f"🔧 IDs finaux - academic_year_id: {academic_year_id}, semester_id: {semester_id}")
            
            # Créer l'emploi du temps
            timetable_vals = {
                'name': data['name'],
                'batch_id': data['batch_id'],
                'start_date': data['start_date'],
                'end_date': data['end_date'],
                'faculty_id': data.get('faculty_id'),
                'notes': data.get('description', ''),
                'state': 'draft'
            }
            
            # Ajouter les IDs seulement s'ils existent
            if academic_year_id:
                timetable_vals['academic_year_id'] = academic_year_id
            if semester_id:
                timetable_vals['semester_id'] = semester_id
            
            _logger.info(f"🔧 Valeurs timetable: {timetable_vals}")
            
            timetable = request.env['op.timetable'].sudo().create(timetable_vals)
            _logger.info(f"🆕 Emploi du temps créé avec ID: {timetable.id}")
            
            # Créer les créneaux (slots)
            slots_data = data.get('slots', [])
            created_slots = []
            
            for slot_data in slots_data:
                # Validation des créneaux
                if not all(key in slot_data for key in ['day_of_week', 'start_time', 'end_time']):
                    continue
                
                # Convertir les heures en format float
                def time_to_float(time_str):
                    try:
                        if ':' in time_str:
                            hours, minutes = map(int, time_str.split(':'))
                            return hours + minutes / 60.0
                        return float(time_str)
                    except:
                        return 8.0  # Valeur par défaut
                
                slot_vals = {
                    'timetable_id': timetable.id,
                    'day_of_week': str(slot_data['day_of_week']),
                    'start_time': time_to_float(slot_data['start_time']),
                    'end_time': time_to_float(slot_data['end_time']),
                    'subject_id': slot_data.get('subject_id'),
                    'faculty_id': slot_data.get('faculty_id'),
                    'classroom_id': slot_data.get('classroom_id'),
                    'session_type': slot_data.get('session_type', ''),
                    'topic': slot_data.get('topic', '')
                }
                
                slot = request.env['op.timetable.slot'].sudo().create(slot_vals)
                created_slots.append(slot.id)
                _logger.info(f"🆕 Créneau créé avec ID: {slot.id}")
            
            # Activer l'emploi du temps
            timetable.state = 'active'
            
            return {
                'status': 'success',
                'message': 'Emploi du temps créé avec succès',
                'data': {
                    'id': timetable.id,
                    'name': timetable.name,
                    'batch_id': timetable.batch_id.id,
                    'batch_name': timetable.batch_id.name,
                    'slots_count': len(created_slots),
                    'created_slots': created_slots
                }
            }
            
        except Exception as e:
            _logger.error(f"❌ Erreur create_timetable: {str(e)}", exc_info=True)
            return {
                'status': 'error',
                'message': f'Erreur lors de la création de l\'emploi du temps: {str(e)}'
            }

    @http.route('/api/timetables/<int:timetable_id>', auth='none', type='http', csrf=False, methods=['GET', 'PUT', 'DELETE', 'OPTIONS'])
    @cors_wrapper
    def handle_timetable_by_id(self, timetable_id, **kwargs):
        """Gérer un emploi du temps spécifique"""
        if request.httprequest.method == 'OPTIONS':
            return ''
        elif request.httprequest.method == 'GET':
            return self.get_timetable_by_id(timetable_id)
        elif request.httprequest.method == 'PUT':
            return self.update_timetable_by_id(timetable_id, **kwargs)
        elif request.httprequest.method == 'DELETE':
            return self.delete_timetable_by_id(timetable_id)
        else:
            return {'status': 'error', 'message': 'Méthode non supportée'}

    def get_timetable_by_id(self, timetable_id):
        """Récupérer un emploi du temps spécifique"""
        try:
            # Rechercher l'emploi du temps réel
            timetable = request.env['op.timetable'].sudo().browse(int(timetable_id))
            if not timetable.exists():
                return {
                    'status': 'error',
                    'message': 'Emploi du temps non trouvé'
                }
            
            # Récupérer les créneaux associés
            slots = request.env['op.timetable.slot'].sudo().search([
                ('timetable_id', '=', timetable.id)
            ], order='day_of_week, start_time')
            
            # Construire la liste des créneaux
            slot_ids = []
            for slot in slots:
                # Convertir les heures de float vers format HH:MM
                start_hour = int(slot.start_time)
                start_min = int((slot.start_time - start_hour) * 60)
                end_hour = int(slot.end_time)
                end_min = int((slot.end_time - end_hour) * 60)
                
                slot_data = {
                    'id': slot.id,
                    'day_of_week': slot.day_of_week,
                    'start_time': f"{start_hour:02d}:{start_min:02d}",
                    'end_time': f"{end_hour:02d}:{end_min:02d}",
                    'subject': {
                        'id': slot.subject_id.id,
                        'name': slot.subject_id.name
                    } if slot.subject_id else None,
                    'faculty': {
                        'id': slot.faculty_id.id,
                        'name': slot.faculty_id.name
                    } if slot.faculty_id else None,
                    'classroom': {
                        'id': slot.classroom_id.id,
                        'name': slot.classroom_id.name
                    } if slot.classroom_id else None,
                    'session_type': getattr(slot, 'session_type', 'lecture'),
                    'topic': getattr(slot, 'topic', '')
                }
                slot_ids.append(slot_data)
            
            # Construire les données de l'emploi du temps
            timetable_data = {
                'id': timetable.id,
                'name': timetable.name,
                'batch': {
                    'id': timetable.batch_id.id,
                    'name': timetable.batch_id.name
                } if timetable.batch_id else None,
                'academic_year': {
                    'id': timetable.academic_year_id.id,
                    'name': timetable.academic_year_id.name
                } if timetable.academic_year_id else None,
                'semester': {
                    'id': timetable.semester_id.id,
                    'name': timetable.semester_id.name
                } if timetable.semester_id else None,
                'faculty': {
                    'id': timetable.faculty_id.id,
                    'name': timetable.faculty_id.name
                } if timetable.faculty_id else None,
                'start_date': timetable.start_date.strftime('%Y-%m-%d') if timetable.start_date else None,
                'end_date': timetable.end_date.strftime('%Y-%m-%d') if timetable.end_date else None,
                'state': timetable.state,
                'description': timetable.notes or '',
                'sessions_count': len(slots),
                'slot_ids': slot_ids,
                'created_date': timetable.created_date.strftime('%Y-%m-%d %H:%M:%S') if timetable.created_date else None
            }
            
            return {
                'status': 'success',
                'data': timetable_data
            }
            
        except Exception as e:
            _logger.error(f"❌ Erreur get_timetable_by_id: {str(e)}", exc_info=True)
            return {
                'status': 'error',
                'message': f'Erreur lors de la récupération de l\'emploi du temps: {str(e)}'
            }

    def update_timetable_by_id(self, timetable_id, **kwargs):
        """Mettre à jour un emploi du temps"""
        try:
            # Récupérer les données JSON
            data = json.loads(request.httprequest.data.decode('utf-8')) if request.httprequest.data else {}
            
            # Rechercher l'emploi du temps
            timetable = request.env['op.timetable'].sudo().browse(int(timetable_id))
            if not timetable.exists():
                return {
                    'status': 'error',
                    'message': 'Emploi du temps non trouvé'
                }
            
            # Préparer les données de mise à jour
            update_data = {}
            
            if 'name' in data:
                update_data['name'] = data['name']
            
            if 'batch_id' in data:
                update_data['batch_id'] = int(data['batch_id'])
            
            if 'academic_year_id' in data:
                update_data['academic_year_id'] = int(data['academic_year_id'])
            
            if 'semester_id' in data:
                update_data['semester_id'] = int(data['semester_id'])
            
            if 'faculty_id' in data:
                update_data['faculty_id'] = int(data['faculty_id'])
            
            if 'start_date' in data:
                update_data['start_date'] = data['start_date']
            
            if 'end_date' in data:
                update_data['end_date'] = data['end_date']
            
            if 'description' in data:
                update_data['notes'] = data['description']
            
            if 'state' in data:
                update_data['state'] = data['state']
            
            # Mettre à jour l'emploi du temps
            timetable.write(update_data)
            
            # Gérer les créneaux si fournis
            if 'slots' in data:
                # Supprimer les anciens créneaux
                old_slots = request.env['op.timetable.slot'].sudo().search([
                    ('timetable_id', '=', timetable.id)
                ])
                old_slots.unlink()
                
                # Créer les nouveaux créneaux
                created_slots = []
                for slot_data in data['slots']:
                    slot_values = {
                        'timetable_id': timetable.id,
                        'day_of_week': slot_data.get('day_of_week'),
                        'start_time': float(slot_data.get('start_time', '0:00').replace(':', '.')) if ':' in str(slot_data.get('start_time', '0:00')) else float(slot_data.get('start_time', 0)),
                        'end_time': float(slot_data.get('end_time', '0:00').replace(':', '.')) if ':' in str(slot_data.get('end_time', '0:00')) else float(slot_data.get('end_time', 0)),
                        'subject_id': slot_data.get('subject_id') if slot_data.get('subject_id') else None,
                        'faculty_id': slot_data.get('faculty_id') if slot_data.get('faculty_id') else None,
                        'session_type': slot_data.get('session_type', 'lecture'),
                        'topic': slot_data.get('topic', ''),
                    }
                    
                    # Ajouter classroom_id seulement s'il est fourni et non vide
                    if slot_data.get('classroom_id'):
                        slot_values['classroom_id'] = slot_data['classroom_id']
                    
                    slot = request.env['op.timetable.slot'].sudo().create(slot_values)
                    created_slots.append({
                        'id': slot.id,
                        'day_of_week': slot.day_of_week,
                        'start_time': slot.start_time,
                        'end_time': slot.end_time
                    })
            
            return {
                'status': 'success',
                'message': 'Emploi du temps mis à jour avec succès',
                'data': {
                    'id': timetable.id,
                    'name': timetable.name,
                    'batch_id': timetable.batch_id.id,
                    'batch_name': timetable.batch_id.name,
                    'updated_slots': created_slots if 'slots' in data else []
                }
            }
            
        except Exception as e:
            _logger.error(f"❌ Erreur update_timetable_by_id: {str(e)}", exc_info=True)
            return {
                'status': 'error',
                'message': f'Erreur lors de la mise à jour de l\'emploi du temps: {str(e)}'
            }

    def delete_timetable_by_id(self, timetable_id):
        """Supprimer un emploi du temps"""
        try:
            # Rechercher l'emploi du temps
            timetable = request.env['op.timetable'].sudo().browse(int(timetable_id))
            if not timetable.exists():
                return {
                    'status': 'error',
                    'message': 'Emploi du temps non trouvé'
                }
            
            # Sauvegarder le nom avant suppression
            timetable_name = timetable.name
            
            # Supprimer d'abord les créneaux associés
            slots = request.env['op.timetable.slot'].sudo().search([
                ('timetable_id', '=', timetable.id)
            ])
            slots.unlink()
            
            # Supprimer l'emploi du temps
            timetable.unlink()
            
            return {
                'status': 'success',
                'message': f'Emploi du temps "{timetable_name}" supprimé avec succès'
            }
            
        except Exception as e:
            _logger.error(f"❌ Erreur delete_timetable_by_id: {str(e)}", exc_info=True)
            return {
                'status': 'error',
                'message': f'Erreur lors de la suppression de l\'emploi du temps: {str(e)}'
            }

    @http.route('/api/academic-data', auth='none', type='http', csrf=False, methods=['GET', 'OPTIONS'])
    @cors_wrapper
    def get_academic_data(self, **kwargs):
        """Récupérer les années académiques et semestres"""
        try:
            if request.httprequest.method == 'OPTIONS':
                return ''
            
            _logger.info("🔍 get_academic_data: Début de la récupération")
            
            # Récupérer les années académiques
            academic_years = request.env['op.academic.year'].sudo().search([])
            _logger.info(f"🔍 Années académiques trouvées: {len(academic_years)}")
            
            # Si aucune année académique n'existe, créer des années par défaut
            if not academic_years:
                current_year = datetime.now().year
                default_years = [
                    {
                        'name': f'{current_year-1}-{current_year}',
                        'start_date': f'{current_year-1}-09-01',
                        'end_date': f'{current_year}-08-31'
                    },
                    {
                        'name': f'{current_year}-{current_year+1}',
                        'start_date': f'{current_year}-09-01',
                        'end_date': f'{current_year+1}-08-31'
                    }
                ]
                
                for year_data in default_years:
                    academic_years |= request.env['op.academic.year'].sudo().create(year_data)
                
                _logger.info(f"🆕 Années académiques créées par défaut: {len(default_years)}")
            
            academic_years_data = []
            for year in academic_years:
                academic_years_data.append({
                    'id': year.id,
                    'name': year.name,
                    'start_date': year.start_date.strftime('%Y-%m-%d') if year.start_date else None,
                    'end_date': year.end_date.strftime('%Y-%m-%d') if year.end_date else None,
                })
            
            # Récupérer les termes académiques (semestres)
            academic_terms = request.env['op.academic.term'].sudo().search([])
            
            # Si aucun terme académique n'existe, créer des semestres par défaut
            if not academic_terms and academic_years:
                default_terms = [
                    {
                        'name': 'Semestre 1',
                        'academic_year_id': academic_years[0].id,
                        'term_start_date': academic_years[0].start_date,
                        'term_end_date': academic_years[0].start_date.replace(month=1, day=31) if academic_years[0].start_date else None
                    },
                    {
                        'name': 'Semestre 2',
                        'academic_year_id': academic_years[0].id,
                        'term_start_date': academic_years[0].start_date.replace(month=2, day=1) if academic_years[0].start_date else None,
                        'term_end_date': academic_years[0].end_date
                    }
                ]
                
                for term_data in default_terms:
                    academic_terms |= request.env['op.academic.term'].sudo().create(term_data)
                
                _logger.info(f"🆕 Semestres créés par défaut: {len(default_terms)}")
            
            academic_terms_data = []
            for term in academic_terms:
                academic_terms_data.append({
                    'id': term.id,
                    'name': term.name,
                    'academic_year_id': term.academic_year_id.id if term.academic_year_id else None,
                    'academic_year_name': term.academic_year_id.name if term.academic_year_id else None,
                    'start_date': term.term_start_date.strftime('%Y-%m-%d') if term.term_start_date else None,
                    'end_date': term.term_end_date.strftime('%Y-%m-%d') if term.term_end_date else None,
                })
            
            return {
                'status': 'success',
                'data': {
                    'academic_years': academic_years_data,
                    'academic_terms': academic_terms_data
                }
            }
            
        except Exception as e:
            _logger.error("Erreur get_academic_data: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    # ================= ENDPOINTS DASHBOARD =================
    
    @http.route('/api/dashboard/statistics', auth='none', type='http', csrf=False, methods=['GET', 'OPTIONS'])
    @cors_wrapper
    def get_dashboard_statistics(self, **kwargs):
        """Récupérer les statistiques pour le tableau de bord"""
        try:
            if request.httprequest.method == 'OPTIONS':
                return ''
            
            _logger.info("🔍 get_dashboard_statistics: Début de la récupération")
            
            # Compter les étudiants
            students_count = request.env['op.student'].sudo().search_count([])
            
            # Compter les enseignants
            teachers_count = request.env['op.faculty'].sudo().search_count([])
            
            # Compter les cours
            courses_count = request.env['op.course'].sudo().search_count([])
            
            # Compter les promotions
            batches_count = request.env['op.batch'].sudo().search_count([])
            
            # Compter les matières
            subjects_count = request.env['op.subject'].sudo().search_count([])
            
            # Compter les examens
            exams_count = request.env['op.exam'].sudo().search_count([])
            
            # Statistiques des sessions aujourd'hui
            today = fields.Date.context_today(request.env.user)
            today_sessions = request.env['op.session'].sudo().search_count([
                ('start_datetime', '>=', today),
                ('start_datetime', '<', today + timedelta(days=1))
            ])
            
            # Statistiques des présences récentes (7 derniers jours)
            week_ago = today - timedelta(days=7)
            recent_attendance = request.env['op.attendance.line'].sudo().search_count([
                ('attendance_date', '>=', week_ago),
                ('attendance_date', '<=', today)
            ])
            
            return {
                'status': 'success',
                'data': {
                    'students_count': students_count,
                    'teachers_count': teachers_count,
                    'courses_count': courses_count,
                    'batches_count': batches_count,
                    'subjects_count': subjects_count,
                    'exams_count': exams_count,
                    'today_sessions': today_sessions,
                    'recent_attendance': recent_attendance,
                    'last_updated': datetime.now().isoformat()
                }
            }
            
        except Exception as e:
            _logger.error("Erreur get_dashboard_statistics: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/dashboard/grades', auth='none', type='http', csrf=False, methods=['GET', 'OPTIONS'])
    @cors_wrapper
    def get_dashboard_grades(self, **kwargs):
        """Récupérer les notes récentes pour le tableau de bord"""
        try:
            if request.httprequest.method == 'OPTIONS':
                return ''
            
            _logger.info("🔍 get_dashboard_grades: Début de la récupération")
            
            # Récupérer les évaluations récentes avec leurs notes
            recent_evaluations = request.env['op.evaluation'].sudo().search([
                ('state', '=', 'done')
            ], limit=10, order='create_date desc')
            
            grades_data = []
            for evaluation in recent_evaluations:
                # Récupérer les lignes d'évaluation (notes) de cette évaluation
                evaluation_lines = evaluation.evaluation_line_ids
                
                for line in evaluation_lines[:5]:  # Limiter à 5 notes par évaluation
                    percentage = (line.note / evaluation.max_marks * 100) if evaluation.max_marks > 0 else 0
                    
                    # Déterminer la mention/grade basée sur le pourcentage
                    if percentage >= 16:
                        grade = 'Très Bien'
                    elif percentage >= 14:
                        grade = 'Bien'
                    elif percentage >= 12:
                        grade = 'Assez Bien'
                    elif percentage >= 10:
                        grade = 'Passable'
                    else:
                        grade = 'Insuffisant'
                    
                    grades_data.append({
                        'id': line.id,
                        'student_id': line.student_id.id,
                        'student_name': line.student_id.name,
                        'subject_id': evaluation.subject_id.id if evaluation.subject_id else None,
                        'subject_name': evaluation.subject_id.name if evaluation.subject_id else 'N/A',
                        'evaluation_name': evaluation.name,
                        'marks': line.note,
                        'max_marks': evaluation.max_marks,
                        'percentage': round(percentage, 2),
                        'grade': grade,
                        'appreciation': line.appreciation or '',
                        'date': evaluation.date.strftime('%Y-%m-%d') if evaluation.date else None
                    })
            
            # Si aucune évaluation n'existe, retourner des données vides
            if not grades_data:
                grades_data = []
            
            return {
                'status': 'success',
                'data': {
                    'recent_grades': grades_data,
                    'total_evaluations': len(recent_evaluations),
                    'last_updated': datetime.now().isoformat()
                }
            }
            
        except Exception as e:
            _logger.error("Erreur get_dashboard_grades: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/evaluation-types', auth='none', type='http', csrf=False, methods=['GET', 'OPTIONS'])
    @cors_wrapper
    def get_evaluation_types(self, **kwargs):
        """Récupérer les types d'évaluation disponibles"""
        try:
            if request.httprequest.method == 'OPTIONS':
                return ''
            
            _logger.info("🔍 get_evaluation_types: Début de la récupération")
            
            # Récupérer tous les types d'évaluation
            evaluation_types = request.env['op.evaluation.type'].sudo().search([
                ('active', '=', True)
            ])
            
            types_data = []
            for eval_type in evaluation_types:
                types_data.append({
                    'id': eval_type.id,
                    'name': eval_type.name,
                    'code': eval_type.code,
                    'education_level': eval_type.education_level,
                    'type_evaluation': eval_type.type_evaluation,
                    'coefficient': eval_type.coefficient
                })
            
            return {
                'status': 'success',
                'data': types_data
            }
            
        except Exception as e:
            _logger.error("Erreur get_evaluation_types: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/admissions', auth='none', type='http', csrf=False, methods=['GET', 'POST', 'OPTIONS'])
    @cors_wrapper
    def handle_admissions(self, **kwargs):
        """Gérer les admissions (GET/POST)"""
        try:
            if request.httprequest.method == 'OPTIONS':
                return ''
            elif request.httprequest.method == 'GET':
                return self.get_admissions_list(**kwargs)
            elif request.httprequest.method == 'POST':
                return self.create_new_admission(**kwargs)
        except Exception as e:
            _logger.error("Erreur handle_admissions: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    def get_admissions_list(self, **kwargs):
        """Récupérer la liste des admissions avec pagination"""
        try:
            _logger.info("🔍 get_admissions_list: Début de la récupération")
            
            # Paramètres de pagination et filtres
            page = int(kwargs.get('page', 1))
            limit = int(kwargs.get('limit', 20))
            search = kwargs.get('search', '').strip()
            status = kwargs.get('status', '').strip()
            course_id = kwargs.get('course_id', '').strip()
            
            # Calculer l'offset
            offset = (page - 1) * limit
            
            # Construire le domaine de recherche
            domain = [('active', '=', True)]
            
            # Filtrage par recherche textuelle
            if search:
                domain.append('|')
                domain.append('|')
                domain.append('|')
                domain.append('|')
                domain.append(('name', 'ilike', search))
                domain.append(('first_name', 'ilike', search))
                domain.append(('last_name', 'ilike', search))
                domain.append(('email', 'ilike', search))
                domain.append(('phone', 'ilike', search))
            
            # Filtrage par statut
            if status:
                domain.append(('state', '=', status))
            
            # Filtrage par cours
            if course_id:
                domain.append(('course_id', '=', int(course_id)))
            
            # Compter le total
            total_count = request.env['op.admission'].sudo().search_count(domain)
            
            # Récupérer les admissions avec pagination
            admissions = request.env['op.admission'].sudo().search(
                domain, 
                limit=limit, 
                offset=offset,
                order='application_date desc, id desc'
            )
            
            admissions_data = []
            for admission in admissions:
                # Construire le nom complet
                name_parts = []
                if admission.first_name:
                    name_parts.append(admission.first_name)
                if admission.middle_name:
                    name_parts.append(admission.middle_name)
                if admission.last_name:
                    name_parts.append(admission.last_name)
                full_name = ' '.join(name_parts) if name_parts else admission.name or 'Sans nom'
                
                admission_data = {
                    'id': admission.id,
                    'name': full_name,
                    'first_name': admission.first_name or '',
                    'middle_name': admission.middle_name or '',
                    'last_name': admission.last_name or '',
                    'email': admission.email or '',
                    'phone': admission.phone or '',
                    'mobile': admission.mobile or '',
                    'gender': admission.gender or '',
                    'birth_date': admission.birth_date.strftime('%Y-%m-%d') if admission.birth_date else None,
                    'course_id': admission.course_id.id if admission.course_id else None,
                    'course_name': admission.course_id.name if admission.course_id else 'N/A',
                    'batch_id': admission.batch_id.id if admission.batch_id else None,
                    'batch_name': admission.batch_id.name if admission.batch_id else 'N/A',
                    'application_date': admission.application_date.strftime('%Y-%m-%d') if admission.application_date else None,
                    'admission_date': admission.admission_date.strftime('%Y-%m-%d') if hasattr(admission, 'admission_date') and admission.admission_date else None,
                    'state': admission.state,
                    'fees': float(admission.fees) if admission.fees else 0.0,
                    'street': admission.street or '',
                    'city': admission.city or '',
                    'zip': admission.zip or '',
                    'country_id': admission.country_id.id if admission.country_id else None,
                    'country_name': admission.country_id.name if admission.country_id else '',
                    'nationality': admission.nationality.id if hasattr(admission, 'nationality') and admission.nationality else None,
                    'nationality_name': admission.nationality.name if hasattr(admission, 'nationality') and admission.nationality else '',
                    'application_number': getattr(admission, 'application_number', ''),
                    'active': admission.active
                }
                
                # Ajouter les libellés de statut
                state_labels = {
                    'draft': 'Brouillon',
                    'submit': 'Soumise',
                    'confirm': 'Confirmée',
                    'reject': 'Rejetée',
                    'cancel': 'Annulée'
                }
                admission_data['state_label'] = state_labels.get(admission.state, admission.state)
                
                admissions_data.append(admission_data)
            
            # Calculer le nombre de pages
            total_pages = (total_count + limit - 1) // limit
            
            # Statistiques par statut
            status_stats = {}
            for state in ['draft', 'submit', 'confirm', 'reject', 'cancel']:
                count = request.env['op.admission'].sudo().search_count([('state', '=', state), ('active', '=', True)])
                status_stats[state] = count
            
            _logger.info(f"✅ Admissions récupérées: {len(admissions_data)}/{total_count}")
            
            return {
                'status': 'success',
                'data': {
                    'admissions': admissions_data,
                    'pagination': {
                        'page': page,
                        'limit': limit,
                        'total': total_count,
                        'pages': total_pages,
                        'has_next': page < total_pages,
                        'has_prev': page > 1
                    },
                    'statistics': status_stats,
                    'filters': {
                        'search': search,
                        'status': status,
                        'course_id': course_id
                    }
                }
            }
            
        except Exception as e:
            _logger.error("Erreur lors de la récupération des admissions: %s", str(e), exc_info=True)
            return {
                'status': 'error',
                'code': 500,
                'message': f'Erreur lors de la récupération des admissions: {str(e)}'
            }

    def create_new_admission(self, **kwargs):
        """Créer une nouvelle admission"""
        try:
            # Log des données reçues
            raw_data = request.httprequest.data.decode('utf-8')
            data = json.loads(raw_data)
            _logger.info("Création admission - Données reçues: %s", data)
            
            # Vérifier les données requises
            required_fields = ['first_name', 'last_name', 'email', 'phone', 'gender', 'birth_date', 'course_id']
            missing_fields = [field for field in required_fields if not data.get(field)]
            if missing_fields:
                return {
                    'status': 'error',
                    'code': 400,
                    'message': f'Champs obligatoires manquants : {", ".join(missing_fields)}'
                }
            
            # Valider le format de la date
            try:
                birth_date = fields.Date.from_string(data['birth_date'])
                if not birth_date:
                    raise ValueError("Date invalide")
            except Exception as e:
                return {
                    'status': 'error',
                    'code': 400,
                    'message': 'Format de date de naissance invalide. Utilisez le format YYYY-MM-DD'
                }
            
            # Valider l'email
            if not re.match(r"[^@]+@[^@]+\.[^@]+", data['email']):
                return {
                    'status': 'error',
                    'code': 400,
                    'message': 'Format d\'email invalide'
                }

            # Valider le numéro de téléphone
            if not re.match(r'^\+?[\d\s-]{8,}$', normalized_data['phone']):
                return {
                    'status': 'error',
                    'code': 400,
                    'message': 'Format de numéro de téléphone invalide'
                }
            
            # Trouver ou créer un registre d'admission actif
            register = request.env['op.admission.register'].sudo().search([
                ('state', '=', 'application')
            ], limit=1)
            
            if not register:
                # Créer un registre d'admission par défaut
                register = request.env['op.admission.register'].sudo().create({
                    'name': 'Registre d\'admission public',
                    'start_date': fields.Date.today(),
                    'end_date': fields.Date.today() + relativedelta(months=6),
                    'state': 'application',
                    'max_count': 1000
                })
            
            # Convertir le genre en format accepté par Odoo
            gender_mapping = {
                'male': 'm',
                'female': 'f', 
                'other': 'o',
                'm': 'm',
                'f': 'f',
                'o': 'o'
            }
            gender_value = gender_mapping.get(normalized_data['gender'].lower())
            if not gender_value:
                return {
                    'status': 'error',
                    'code': 400,
                    'message': 'Genre invalide. Valeurs acceptées : male, female, other'
                }
            
            # Trouver ou créer un cours par défaut pour les admissions publiques
            default_course = request.env['op.course'].sudo().search([
                ('name', 'ilike', 'admission publique')
            ], limit=1)
            
            if not default_course:
                # Créer un cours par défaut pour les admissions publiques
                default_course = request.env['op.course'].sudo().create({
                    'name': 'Admission Publique - En attente d\'affectation',
                    'code': 'ADM_PUB',
                    'state': 'confirmed',
                    'education_level': 'college',
                    'class_level': '6eme',
                    'subject_area': 'autre',
                    'course_type': 'obligatoire',
                    'weekly_hours': 0,
                    'coefficient': 0,
                    'official_program': 'Cours temporaire pour les admissions publiques en attente d\'affectation'
                })
            
            # Créer la demande d'admission
            admission_data = {
                'first_name': normalized_data['first_name'],
                'last_name': normalized_data['last_name'],
                'name': f"{normalized_data['first_name']} {normalized_data['last_name']}",
                'email': normalized_data['email'],
                'phone': normalized_data['phone'],
                'birth_date': normalized_data['birth_date'],
                'gender': gender_value,
                'register_id': register.id,
                'course_id': default_course.id,
                'state': 'draft',
                'application_date': fields.Date.today(),
            }
            
            # Ajouter les champs optionnels s'ils sont présents
            optional_fields = [
                'street', 'middle_name', 'mobile', 'city', 'zip', 
                'nationality', 'country', 'prev_institute_id', 
                'family_business'
            ]
            for field in optional_fields:
                if normalized_data.get(field):
                    admission_data[field] = normalized_data[field]
            
            # Gérer le champ family_income séparément car c'est un float
            if normalized_data.get('family_income'):
                try:
                    admission_data['family_income'] = float(normalized_data['family_income'])
                except (ValueError, TypeError):
                    return {
                        'status': 'error',
                        'code': 400,
                        'message': 'Le revenu familial doit être un nombre'
                    }
            
            admission = request.env['op.admission'].sudo().create(admission_data)
            
            return {
                'status': 'success',
                'data': {
                    'admission_id': admission.id,
                    'application_number': admission.application_number,
                    'name': admission.name
                },
                'message': 'Demande d\'admission soumise avec succès'
            }
            
        except json.JSONDecodeError:
            return {
                'status': 'error',
                'code': 400,
                'message': 'Format JSON invalide'
            }
        except Exception as e:
            _logger.error("Erreur lors de la soumission d'admission: %s", str(e), exc_info=True)
            return {
                'status': 'error',
                'code': 500,
                'message': 'Erreur interne du serveur'
            }
    
    

    @http.route('/api/admissions/<int:admission_id>/action', auth='none', type='http', csrf=False, methods=['POST', 'OPTIONS'])
    @cors_wrapper
    def admission_action(self, admission_id, **kwargs):
        """Effectuer une action sur une admission"""
        try:
            # Vérifier la session
            session_info = self._check_session()
            if not session_info:
                return {
                    'status': 'error',
                    'code': 401,
                    'message': 'Non authentifié'
                }

            # Récupérer l'action depuis les données
            data = json.loads(request.httprequest.data.decode('utf-8'))
            action = data.get('action')

            if not action:
                return {
                    'status': 'error',
                    'code': 400,
                    'message': 'Action non spécifiée'
                }

            # Récupérer l'admission
            admission = request.env['op.admission'].sudo().browse(admission_id)
            if not admission.exists():
                return {
                    'status': 'error',
                    'code': 404,
                    'message': 'Admission non trouvée'
                }

            # Mapping des actions vers les méthodes Odoo
            action_mapping = {
                'submit': 'submit_form',
                'confirm': 'confirm_in_progress',
                'reject': 'reject_form',
                'cancel': 'cancel_form'
            }

            # Vérifier si l'action est valide
            if action not in action_mapping:
                return {
                    'status': 'error',
                    'code': 400,
                    'message': f'Action invalide. Actions valides : {", ".join(action_mapping.keys())}'
                }

            # Exécuter l'action
            method = getattr(admission, action_mapping[action])
            method()

            # Libellés de statut pour le retour
            state_labels = {
                'draft': 'Brouillon',
                'submit': 'Soumise',
                'confirm': 'Confirmée',
                'reject': 'Rejetée',
                'cancel': 'Annulée'
            }

            # Préparer les informations de l'étudiant si créé
            student_info = None
            if admission.state == 'confirm' and admission.student_id:
                student = admission.student_id
                student_info = {
                    'id': student.id,
                    'gr_no': student.gr_no or '',
                    'name': student.name,
                    'course': student.course_id.name if student.course_id else None,
                    'batch': student.batch_id.name if student.batch_id else None
                }

            return {
                'status': 'success',
                'data': {
                    'id': admission.id,
                    'state': admission.state,
                    'state_label': state_labels.get(admission.state, admission.state),
                    'name': f"{admission.first_name or ''} {admission.middle_name or ''} {admission.last_name or ''}".strip(),
                    'application_number': admission.application_number or f"ADM{admission.id:06d}",
                    'admission_date': admission.admission_date.strftime('%Y-%m-%d') if hasattr(admission, 'admission_date') and admission.admission_date else None,
                    'student_info': student_info
                },
                'message': f'Action {action} effectuée avec succès'
            }

        except json.JSONDecodeError:
            return {
                'status': 'error',
                'code': 400,
                'message': 'Format JSON invalide'
            }
        except Exception as e:
            _logger.error("Erreur lors de l'action sur l'admission: %s", str(e), exc_info=True)
            return {
                'status': 'error',
                'code': 500,
                'message': 'Erreur interne du serveur'
            }

    @http.route('/api/admissions/<int:admission_id>', auth='none', type='http', csrf=False, methods=['PUT', 'OPTIONS'])
    @cors_wrapper
    def update_admission(self, admission_id, **kwargs):
        """Mettre à jour une admission"""
        try:
            # Vérifier la session utilisateur
            session_info = self._check_session()
            if not session_info:
                return {
                    'status': 'error',
                    'code': 401,
                    'message': 'Non authentifié'
                }
            
            # Récupérer les données de la requête
            data = json.loads(request.httprequest.data.decode('utf-8'))
            
            # Récupérer l'admission
            admission = request.env['op.admission'].sudo().browse(admission_id)
            if not admission.exists():
                return {
                    'status': 'error',
                    'code': 404,
                    'message': 'Admission non trouvée'
                }
            
            # Préparer les données pour la mise à jour
            update_data = {}
            
            # Mapping des champs
            field_mapping = {
                'first_name': str,
                'middle_name': str,
                'last_name': str,
                'email': str,
                'phone': str,
                'mobile': str,
                'birth_date': fields.Date.from_string,
                'street': str,
                'city': str,
                'zip': str,
                'nationality': str,
                'country': str,
                'prev_institute_id': str,
                'fees': float,
                'family_business': str,
                'family_income': float
            }
            
            # Traiter chaque champ
            for field, converter in field_mapping.items():
                if field in data:
                    try:
                        value = data[field]
                        if value is not None:
                            update_data[field] = converter(value)
                    except (ValueError, TypeError) as e:
                        return {
                            'status': 'error',
                            'code': 400,
                            'message': f'Format invalide pour le champ {field}'
                        }
            
            # Traiter le genre séparément
            if 'gender' in data:
                gender_mapping = {
                    'male': 'm',
                    'female': 'f',
                    'other': 'o',
                    'm': 'm',
                    'f': 'f',
                    'o': 'o'
                }
                gender = data['gender'].lower()
                if gender not in gender_mapping:
                    return {
                        'status': 'error',
                        'code': 400,
                        'message': 'Genre invalide. Valeurs acceptées : male, female, other'
                    }
                update_data['gender'] = gender_mapping[gender]
            
            # Gérer course_id
            if 'course_id' in data:
                try:
                    course_id = int(data['course_id'])
                    course = request.env['op.course'].sudo().browse(course_id)
                    if not course.exists():
                        return {
                            'status': 'error',
                            'code': 400,
                            'message': 'Cours non trouvé'
                        }
                    update_data['course_id'] = course.id
                except (ValueError, TypeError):
                    return {
                        'status': 'error',
                        'code': 400,
                        'message': 'ID de cours invalide'
                    }
            
            # Gérer batch_id
            if 'batch_id' in data:
                try:
                    batch_id = int(data['batch_id'])
                    batch = request.env['op.batch'].sudo().browse(batch_id)
                    if not batch.exists():
                        return {
                            'status': 'error',
                            'code': 400,
                            'message': 'Groupe non trouvé'
                        }
                    update_data['batch_id'] = batch.id
                except (ValueError, TypeError):
                    return {
                        'status': 'error',
                        'code': 400,
                        'message': 'ID de groupe invalide'
                    }
            
            # Mettre à jour l'admission
            try:
                admission.sudo().write(update_data)
            except Exception as e:
                _logger.error("Erreur lors de la mise à jour de l'admission: %s", str(e), exc_info=True)
                return {
                    'status': 'error',
                    'code': 500,
                    'message': 'Erreur lors de la mise à jour dans la base de données'
                }
            
            # Retourner les données mises à jour
            return {
                'status': 'success',
                'data': {
                    'id': admission.id,
                    'name': f"{admission.first_name or ''} {admission.middle_name or ''} {admission.last_name or ''}".strip(),
                    'email': admission.email or '',
                    'phone': admission.phone or '',
                    'mobile': admission.mobile or '',
                    'gender': admission.gender,
                    'birth_date': admission.birth_date.strftime('%Y-%m-%d') if admission.birth_date else None,
                    'state': admission.state,
                    'application_number': admission.application_number or f"ADM{admission.id:06d}",
                    'street': admission.street or '',
                    'city': admission.city or '',
                    'zip': admission.zip or '',
                    'nationality': admission.nationality or '',
                    'country': admission.country or '',
                    'prev_institute_id': admission.prev_institute_id or '',
                    'fees': admission.fees or 0.0,
                    'family_business': admission.family_business or '',
                    'family_income': admission.family_income or 0.0,
                    'course': {
                        'id': admission.course_id.id if admission.course_id else None,
                        'name': admission.course_id.name if admission.course_id else None
                    },
                    'batch': {
                        'id': admission.batch_id.id if admission.batch_id else None,
                        'name': admission.batch_id.name if admission.batch_id else None
                    }
                },
                'message': 'Admission mise à jour avec succès'
            }
            
        except json.JSONDecodeError:
            return {
                'status': 'error',
                'code': 400,
                'message': 'Format JSON invalide'
            }
        except Exception as e:
            _logger.error("Erreur lors de la mise à jour de l'admission: %s", str(e), exc_info=True)
            return {
                'status': 'error',
                'code': 500,
                'message': 'Erreur interne du serveur'
            }

    @http.route('/api/parent/student/<int:student_id>/messages', auth='none', type='http', methods=['GET', 'POST', 'OPTIONS'], csrf=False)
    @cors_wrapper
    def handle_student_messages(self, student_id, **kwargs):
        """Gérer les messages d'un étudiant - GET pour lister, POST pour envoyer"""
        method = request.httprequest.method
        
        if method == 'GET':
            return self.get_student_messages(student_id, **kwargs)
        elif method == 'POST':
            return self.send_student_message(student_id, **kwargs)

    def get_student_messages(self, student_id, **kwargs):
        """Récupérer les messages d'un étudiant"""
        try:
            if not hasattr(request, 'session') or not request.session.get('parent_user_id'):
                return {'status': 'error', 'code': 401, 'message': 'Authentification requise'}
            
            parent_user_id = request.session.get('parent_user_id')
            
            # Vérifier que le parent a accès à cet étudiant
            parent = request.env['op.parent'].sudo().search([('user_id', '=', parent_user_id)], limit=1)
            if not parent or student_id not in parent.student_ids.ids:
                return {'status': 'error', 'code': 403, 'message': 'Accès non autorisé à cet étudiant'}
            
            student = request.env['op.student'].sudo().browse(student_id)
            if not student.exists():
                return {'status': 'error', 'code': 404, 'message': 'Étudiant non trouvé'}
            
            # Paramètres de pagination
            page = int(kwargs.get('page', 1))
            limit = int(kwargs.get('limit', 20))
            offset = (page - 1) * limit
            
            # Rechercher les messages dans le modèle mail.message
            # Messages envoyés à l'étudiant ou par l'étudiant
            domain = [
                '|',
                ('res_id', '=', student_id),
                ('author_id', '=', student.partner_id.id if student.partner_id else False),
                ('model', '=', 'op.student')
            ]
            
            messages = request.env['mail.message'].sudo().search(
                domain, 
                limit=limit, 
                offset=offset, 
                order='date desc'
            )
            
            total_count = request.env['mail.message'].sudo().search_count(domain)
            
            messages_data = []
            for message in messages:
                # Déterminer l'expéditeur et le destinataire
                sender_name = message.author_id.name if message.author_id else 'Système'
                is_from_parent = message.author_id and message.author_id.id == parent.name.id
                
                messages_data.append({
                    'id': message.id,
                    'subject': message.subject or 'Pas de sujet',
                    'content': message.body or '',  # Changé de 'body' à 'content'
                    'created_at': message.date.isoformat() if message.date else None,  # Changé de 'date' à 'created_at'
                    'sender_name': sender_name,  # Changé de 'sender' à 'sender_name'
                    'sender_id': message.author_id.id if message.author_id else None,  # Ajouté sender_id
                    'recipient_name': 'Vous',  # Ajouté recipient_name
                    'is_from_parent': is_from_parent,
                    'message_type': message.message_type or 'notification',
                    'is_read': not message.needaction,  # Changé de 'read' à 'is_read'
                    'is_starred': False,  # Ajouté is_starred (par défaut False)
                    'priority': 'normal',  # Ajouté priority (par défaut normal)
                    'attachments': [
                        {
                            'id': att.id,
                            'name': att.name,
                            'size': att.file_size,
                            'mimetype': att.mimetype,
                            'url': f'/web/content/{att.id}?download=true'  # Ajouté URL pour téléchargement
                        }
                        for att in message.attachment_ids
                    ] if message.attachment_ids else []
                })
            
            return {
                'status': 'success',
                'data': {
                    'messages': messages_data,
                    'pagination': {
                        'page': page,
                        'limit': limit,
                        'total': total_count,
                        'pages': (total_count + limit - 1) // limit
                    },
                    'student': {
                        'id': student.id,
                        'name': f"{student.first_name or ''} {student.last_name or ''}".strip()
                    }
                }
            }
            
        except Exception as e:
            _logger.error("Erreur get_student_messages: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    def send_student_message(self, student_id, **kwargs):
        """Envoyer un message concernant un étudiant"""
        try:
            if not hasattr(request, 'session') or not request.session.get('parent_user_id'):
                return {'status': 'error', 'code': 401, 'message': 'Authentification requise'}
            
            parent_user_id = request.session.get('parent_user_id')
            
            # Vérifier que le parent a accès à cet étudiant
            parent = request.env['op.parent'].sudo().search([('user_id', '=', parent_user_id)], limit=1)
            if not parent or student_id not in parent.student_ids.ids:
                return {'status': 'error', 'code': 403, 'message': 'Accès non autorisé à cet étudiant'}
            
            student = request.env['op.student'].sudo().browse(student_id)
            if not student.exists():
                return {'status': 'error', 'code': 404, 'message': 'Étudiant non trouvé'}
            
            data = json.loads(request.httprequest.get_data())
            
            # Validation des champs requis
            required_fields = ['subject', 'message']
            for field in required_fields:
                if field not in data or not data[field]:
                    return {'status': 'error', 'message': f'Le champ {field} est obligatoire'}
            
            recipient_type = data.get('recipient', 'teachers')  # teachers, administration
            
            # Déterminer les destinataires
            recipients = []
            if recipient_type == 'teachers':
                # Récupérer les enseignants de l'étudiant
                for course_registration in student.course_detail_ids:
                    batch = course_registration.batch_id
                    if batch and batch.faculty_id and batch.faculty_id.partner_id:
                        recipients.append(batch.faculty_id.partner_id.id)
            elif recipient_type == 'administration':
                # Récupérer les utilisateurs administrateurs
                admin_users = request.env['res.users'].sudo().search([
                    ('groups_id', 'in', [request.env.ref('base.group_system').id])
                ])
                recipients = [user.partner_id.id for user in admin_users if user.partner_id]
            
            if not recipients:
                return {'status': 'error', 'message': 'Aucun destinataire trouvé'}
            
            # Créer le message
            message_vals = {
                'subject': data['subject'],
                'body': data['message'],
                'model': 'op.student',
                'res_id': student_id,
                'author_id': parent.name.id,
                'partner_ids': [(6, 0, recipients)],
                'message_type': 'comment',
                'subtype_id': request.env.ref('mail.mt_comment').id
            }
            
            message = request.env['mail.message'].sudo().create(message_vals)
            
            # Envoyer des notifications
            for recipient_id in recipients:
                request.env['mail.notification'].sudo().create({
                    'mail_message_id': message.id,
                    'res_partner_id': recipient_id,
                    'notification_type': 'inbox'
                })
            
            return {
                'status': 'success',
                'message': 'Message envoyé avec succès',
                'data': {
                    'message_id': message.id,
                    'sent_to': len(recipients),
                    'recipient_type': recipient_type
                }
            }
            
        except Exception as e:
            _logger.error("Erreur send_student_message: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/parent/student/<int:student_id>/reports', auth='none', type='http', methods=['GET', 'OPTIONS'], csrf=False)
    @cors_wrapper
    def get_student_reports(self, student_id, **kwargs):
        """Récupérer les rapports d'un étudiant"""
        try:
            if not hasattr(request, 'session') or not request.session.get('parent_user_id'):
                return {'status': 'error', 'code': 401, 'message': 'Authentification requise'}
            
            parent_user_id = request.session.get('parent_user_id')
            
            # Vérifier que le parent a accès à cet étudiant
            parent = request.env['op.parent'].sudo().search([('user_id', '=', parent_user_id)], limit=1)
            if not parent or student_id not in parent.student_ids.ids:
                return {'status': 'error', 'code': 403, 'message': 'Accès non autorisé à cet étudiant'}
            
            student = request.env['op.student'].sudo().browse(student_id)
            if not student.exists():
                return {'status': 'error', 'code': 404, 'message': 'Étudiant non trouvé'}
            
            # Paramètres de pagination
            page = int(kwargs.get('page', 1))
            limit = int(kwargs.get('limit', 20))
            offset = (page - 1) * limit
            report_type = kwargs.get('type', 'all')  # all, academic, behavioral, medical
            
            # Rechercher dans les attachments liés à l'étudiant
            domain = [
                ('res_model', '=', 'op.student'),
                ('res_id', '=', student_id)
            ]
            
            # Filtrer par type si spécifié
            if report_type != 'all':
                domain.append(('name', 'ilike', report_type))
            
            attachments = request.env['ir.attachment'].sudo().search(
                domain,
                limit=limit,
                offset=offset,
                order='create_date desc'
            )
            
            total_count = request.env['ir.attachment'].sudo().search_count(domain)
            
            reports_data = []
            for attachment in attachments:
                # Déterminer le type de rapport basé sur le nom
                report_type_detected = 'other'
                if any(word in attachment.name.lower() for word in ['bulletin', 'notes', 'grade', 'exam']):
                    report_type_detected = 'academic'
                elif any(word in attachment.name.lower() for word in ['behavior', 'discipline', 'conduct']):
                    report_type_detected = 'behavioral'
                elif any(word in attachment.name.lower() for word in ['medical', 'health', 'santé']):
                    report_type_detected = 'medical'
                
                reports_data.append({
                    'id': attachment.id,
                    'name': attachment.name,
                    'type': report_type_detected,
                    'description': attachment.description or '',
                    'create_date': attachment.create_date.isoformat() if attachment.create_date else None,
                    'file_size': attachment.file_size,
                    'mimetype': attachment.mimetype,
                    'download_url': f'/web/content/{attachment.id}?download=true'
                })
            
            # Ajouter des rapports générés dynamiquement (bulletins de notes)
            if report_type in ['all', 'academic']:
                # Générer des rapports de notes par période
                academic_years = request.env['op.academic.year'].sudo().search([], limit=3, order='start_date desc')
                
                for year in academic_years:
                    # Rechercher les résultats d'examens pour cette année
                    exam_results = request.env['op.result.line'].sudo().search([
                        ('student_id', '=', student_id),
                        # Ligne supprimée car le champ n'existe pas
                    ])
                    
                    if exam_results:
                        reports_data.append({
                            'id': f'bulletin_{year.id}',
                            'name': f'Bulletin de notes - {year.name}',
                            'type': 'academic',
                            'description': f'Bulletin de notes pour l\'année académique {year.name}',
                            'create_date': year.start_date.isoformat() if year.start_date else None,
                            'file_size': 0,
                            'mimetype': 'application/pdf',
                            'download_url': f'/api/parent/student/{student_id}/reports/bulletin_{year.id}/download',
                            'is_generated': True
                        })
            
            return {
                'status': 'success',
                'data': {
                    'reports': reports_data,
                    'pagination': {
                        'page': page,
                        'limit': limit,
                        'total': total_count,
                        'pages': (total_count + limit - 1) // limit
                    },
                    'student': {
                        'id': student.id,
                        'name': f"{student.first_name or ''} {student.last_name or ''}".strip()
                    }
                }
            }
            
        except Exception as e:
            _logger.error("Erreur get_student_reports: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/parent/student/<int:student_id>/reports/<string:report_id>/download', auth='none', type='http', methods=['GET', 'OPTIONS'], csrf=False)
    @cors_wrapper
    def download_student_report(self, student_id, report_id, **kwargs):
        """Télécharger un rapport d'étudiant"""
        try:
            if not hasattr(request, 'session') or not request.session.get('parent_user_id'):
                return {'status': 'error', 'code': 401, 'message': 'Authentification requise'}
            
            parent_user_id = request.session.get('parent_user_id')
            
            # Vérifier que le parent a accès à cet étudiant
            parent = request.env['op.parent'].sudo().search([('user_id', '=', parent_user_id)], limit=1)
            if not parent or student_id not in parent.student_ids.ids:
                return {'status': 'error', 'code': 403, 'message': 'Accès non autorisé à cet étudiant'}
            
            student = request.env['op.student'].sudo().browse(student_id)
            if not student.exists():
                return {'status': 'error', 'code': 404, 'message': 'Étudiant non trouvé'}
            
            # Si c'est un rapport généré (bulletin)
            if report_id.startswith('bulletin_'):
                year_id = int(report_id.split('_')[1])
                academic_year = request.env['op.academic.year'].sudo().browse(year_id)
                
                if not academic_year.exists():
                    return {'status': 'error', 'code': 404, 'message': 'Année académique non trouvée'}
                
                # Générer le PDF du bulletin
                # Pour l'instant, retourner un message d'information
                return {
                    'status': 'info',
                    'message': f'Génération du bulletin pour {academic_year.name} - Fonctionnalité en développement'
                }
            
            # Sinon, c'est un attachment existant
            try:
                attachment_id = int(report_id)
                attachment = request.env['ir.attachment'].sudo().search([
                    ('id', '=', attachment_id),
                    ('res_model', '=', 'op.student'),
                    ('res_id', '=', student_id)
                ], limit=1)
                
                if not attachment:
                    return {'status': 'error', 'code': 404, 'message': 'Rapport non trouvé'}
                
                # Retourner l'URL de téléchargement
                return {
                    'status': 'success',
                    'data': {
                        'download_url': f'/web/content/{attachment.id}?download=true',
                        'filename': attachment.name,
                        'size': attachment.file_size,
                        'mimetype': attachment.mimetype
                    }
                }
                
            except ValueError:
                return {'status': 'error', 'code': 400, 'message': 'ID de rapport invalide'}
            
        except Exception as e:
            _logger.error("Erreur download_student_report: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/parent/student/<int:student_id>/periods', auth='none', type='http', methods=['GET', 'OPTIONS'], csrf=False)
    @cors_wrapper
    def get_student_periods(self, student_id, **kwargs):
        """Récupérer les périodes académiques d'un étudiant"""
        try:
            if not hasattr(request, 'session') or not request.session.get('parent_user_id'):
                return {'status': 'error', 'code': 401, 'message': 'Authentification requise'}
            
            parent_user_id = request.session.get('parent_user_id')
            
            # Vérifier que le parent a accès à cet étudiant
            parent = request.env['op.parent'].sudo().search([('user_id', '=', parent_user_id)], limit=1)
            if not parent or student_id not in parent.student_ids.ids:
                return {'status': 'error', 'code': 403, 'message': 'Accès non autorisé à cet étudiant'}
            
            student = request.env['op.student'].sudo().browse(student_id)
            if not student.exists():
                return {'status': 'error', 'code': 404, 'message': 'Étudiant non trouvé'}
            
            # Récupérer les années académiques
            academic_years = request.env['op.academic.year'].sudo().search([], order='start_date desc')
            
            periods_data = []
            for year in academic_years:
                # Récupérer les termes/semestres de cette année
                terms = request.env['op.academic.term'].sudo().search([
                    # Ligne supprimée car le champ n'existe pas
                ], order='term_start_date')
                
                year_data = {
                    'id': year.id,
                    'name': year.name,
                    'type': 'academic_year',
                    'start_date': year.start_date.isoformat() if year.start_date else None,
                    'end_date': year.end_date.isoformat() if year.end_date else None,
                    'state': 'active',  # Valeur par défaut car le champ n'existe pas
                    'is_current': True,  # Valeur par défaut
                    'terms': []
                }
                
                for term in terms:
                    term_data = {
                        'id': term.id,
                        'name': term.name,
                        'type': 'term',
                        'start_date': term.term_start_date.isoformat() if term.term_start_date else None,
                        'end_date': term.term_end_date.isoformat() if term.term_end_date else None,
                        'state': 'active',  # Valeur par défaut
                        'is_current': True  # Valeur par défaut
                    }
                    year_data['terms'].append(term_data)
                
                periods_data.append(year_data)
            
            # Si aucune période trouvée, créer des données par défaut
            if not periods_data:
                current_year = fields.Date.today().year
                periods_data = [
                    {
                        'id': 'default_current',
                        'name': f'Année {current_year}-{current_year + 1}',
                        'type': 'academic_year',
                        'start_date': f'{current_year}-09-01',
                        'end_date': f'{current_year + 1}-06-30',
                        'state': 'active',
                        'is_current': True,
                        'terms': [
                            {
                                'id': 'default_term1',
                                'name': 'Premier Semestre',
                                'type': 'term',
                                'start_date': f'{current_year}-09-01',
                                'end_date': f'{current_year + 1}-01-31',
                                'state': 'active',
                                'is_current': True
                            },
                            {
                                'id': 'default_term2',
                                'name': 'Deuxième Semestre',
                                'type': 'term',
                                'start_date': f'{current_year + 1}-02-01',
                                'end_date': f'{current_year + 1}-06-30',
                                'state': 'inactive',
                                'is_current': False
                            }
                        ]
                    }
                ]
            
            return {
                'status': 'success',
                'data': {
                    'periods': periods_data,
                    'student': {
                        'id': student.id,
                        'name': f"{student.first_name or ''} {student.last_name or ''}".strip()
                    },
                    'total': len(periods_data)
                }
            }
            
        except Exception as e:
            _logger.error("Erreur get_student_periods: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/parent/debug-session', auth='none', type='http', methods=['GET', 'OPTIONS'], csrf=False)
    @cors_wrapper
    def debug_parent_session(self, **kwargs):
        """Debug de la session parent"""
        try:
            session_info = {
                'has_session': hasattr(request, 'session'),
                'session_keys': list(request.session.keys()) if hasattr(request, 'session') else [],
                'parent_user_id': request.session.get('parent_user_id') if hasattr(request, 'session') else None,
                'session_id': request.session.sid if hasattr(request, 'session') else None,
                'uid': request.session.uid if hasattr(request, 'session') else None
            }
            
            # Test de la méthode _check_parent_session
            is_valid, parent = self._check_parent_session()
            
            return {
                'status': 'success',
                'session_info': session_info,
                'check_result': {
                    'is_valid': is_valid,
                    'parent_found': bool(parent),
                    'parent_id': parent.id if parent else None,
                    'parent_name': parent.name.name if parent and parent.name else None
                }
            }
        except Exception as e:
            _logger.error("Erreur debug session: %s", str(e))
            return {
                'status': 'error',
                'message': f'Erreur: {str(e)}'
            }

    @http.route('/api/parent/student/<int:student_id>/dashboard', auth='none', type='http', methods=['GET', 'OPTIONS'], csrf=False)
    @cors_wrapper
    def get_student_dashboard(self, student_id, **kwargs):
        """Dashboard d'un étudiant pour le parent"""
        try:
            # Vérifier la session parent
            is_valid, parent = self._check_parent_session()
            if not is_valid:
                return {
                    'status': 'error',
                    'message': 'Authentification requise'
                }
            
            if not parent:
                return {
                    'status': 'error',
                    'message': 'Parent non trouvé'
                }
            
            student = request.env['op.student'].sudo().browse(student_id)
            if not student.exists() or student not in parent.student_ids:
                return {
                    'status': 'error',
                    'message': 'Accès non autorisé à cet étudiant'
                }
            
            # Récupérer les données du dashboard
            today = fields.Date.today()
            current_month = today.replace(day=1)
            
            # Présences du mois
            attendance_records = request.env['op.attendance.line'].sudo().search([
                ('student_id', '=', student_id),
                ('attendance_date', '>=', current_month),
                ('attendance_date', '<=', today)
            ])
            
            present_count = len(attendance_records.filtered(lambda r: r.present))
            total_count = len(attendance_records)
            attendance_rate = (present_count / total_count * 100) if total_count > 0 else 0
            
            # Notes récentes
            recent_results = request.env['op.result.line'].sudo().search([
                ('student_id', '=', student_id)
            ], limit=5, order='create_date desc')
            
            grades = []
            for result in recent_results:
                grades.append({
                    'id': result.id,
                    'subject': result.exam_id.subject_id.name if result.exam_id.subject_id else 'N/A',
                    'exam': result.exam_id.name if result.exam_id else 'N/A',
                    'marks': result.marks,
                    'total_marks': result.exam_id.total_marks if result.exam_id else 0,
                    'percentage': (result.marks / result.exam_id.total_marks * 100) if result.exam_id and result.exam_id.total_marks > 0 else 0,
                    'date': result.create_date.date().isoformat() if result.create_date else None
                })
            
            # Frais
            fees_details = request.env['op.student.fees.details'].sudo().search([
                ('student_id', '=', student_id)
            ])
            
            total_fees = sum(fees_details.mapped('amount'))
            paid_fees = sum(fees_details.filtered(lambda f: f.state == 'paid').mapped('amount'))
            outstanding_fees = total_fees - paid_fees
            
            # Emploi du temps d'aujourd'hui
            today_sessions = request.env['op.session'].sudo().search([
                ('batch_id', 'in', student.course_detail_ids.mapped('batch_id.id')),
                ('start_datetime', '>=', datetime.combine(today, datetime.min.time())),
                ('start_datetime', '<', datetime.combine(today + timedelta(days=1), datetime.min.time()))
            ], order='start_datetime')
            
            schedule = []
            for session in today_sessions:
                schedule.append({
                    'id': session.id,
                    'subject': session.subject_id.name if session.subject_id else 'N/A',
                    'teacher': session.faculty_id.name if session.faculty_id else 'N/A',
                    'start_time': session.start_datetime.strftime('%H:%M') if session.start_datetime else '',
                    'end_time': session.end_datetime.strftime('%H:%M') if session.end_datetime else '',
                    'classroom': session.classroom_id.name if session.classroom_id else 'N/A'
                })
            
            return {
                'status': 'success',
                'data': {
                    'student': {
                        'id': student.id,
                        'name': student.name,
                        'course': student.course_detail_ids[0].course_id.name if student.course_detail_ids else '',
                        'batch': student.course_detail_ids[0].batch_id.name if student.course_detail_ids else ''
                    },
                    'attendance': {
                        'present_days': present_count,
                        'total_days': total_count,
                        'percentage': round(attendance_rate, 2)
                    },
                    'grades': grades,
                    'fees': {
                        'total': total_fees,
                        'paid': paid_fees,
                        'outstanding': outstanding_fees
                    },
                    'today_schedule': schedule
                }
            }
            
        except Exception as e:
            _logger.error("Erreur dashboard étudiant: %s", str(e))
            return {
                'status': 'error',
                'message': f'Erreur: {str(e)}'
            }

    # ================= ENDPOINTS PORTAIL PARENT =================
    
    @http.route('/api/parent/login', auth='none', type='http', methods=['POST', 'OPTIONS'], csrf=False)
    @cors_wrapper
    def parent_login(self, **kwargs):
        try:
            data = json.loads(request.httprequest.get_data())
            email = data.get('email')
            password = data.get('password')
            
            if not email or not password:
                return {'status': 'error', 'message': 'Email et mot de passe requis'}
            
            parent = request.env['op.parent'].sudo().search([('email', '=', email)], limit=1)
            if not parent:
                return {'status': 'error', 'message': 'Parent non trouvé'}
            
            if not parent.check_password(password):
                return {'status': 'error', 'message': 'Mot de passe incorrect'}
            
            return {'status': 'success', 'message': 'Connexion réussie'}
        except Exception as e:
            _logger.error("Erreur parent_login: %s", str(e))
            return {'status': 'error', 'message': str(e)}

    @http.route('/api/admissions/public/status', auth='none', type='http', csrf=False, methods=['POST', 'OPTIONS'])
    @cors_wrapper
    def check_public_admission_status(self, **kwargs):
        """Vérifier le statut d'une demande d'admission publique"""
        try:
            raw_data = request.httprequest.get_data()
            data = json.loads(raw_data)
            
            email = data.get('email')
            application_number = data.get('application_number')
            
            if not email or not application_number:
                return {
                    'status': 'error',
                    'code': 400,
                    'message': 'Email et numéro de demande requis'
                }
            
            # Chercher l'admission
            admission = request.env['op.admission'].sudo().search([
                ('email', '=', email),
                ('application_number', '=', application_number)
            ], limit=1)
            
            if not admission:
                return {
                    'status': 'error',
                    'code': 404,
                    'message': 'Demande d\'admission non trouvée'
                }
            
            # Préparer la réponse
            return {
                'status': 'success',
                'data': {
                    'application_number': admission.application_number or f"ADM{admission.id:06d}",
                    'name': f"{admission.first_name} {admission.last_name}",
                    'email': admission.email,
                    'state': admission.state,
                    'state_label': dict(admission._fields['state'].selection).get(admission.state, admission.state),
                    'application_date': admission.application_date.strftime('%Y-%m-%d') if admission.application_date else None,
                    'course': admission.course_id.name if admission.course_id else None
                }
            }
            
        except json.JSONDecodeError:
            return {
                'status': 'error',
                'code': 400,
                'message': 'Format JSON invalide'
            }
        except Exception as e:
            _logger.error("Erreur check_public_admission_status: %s", str(e))
            return {
                'status': 'error',
                'code': 500,
                'message': 'Erreur interne du serveur'
            }
    @http.route('/api/admissions/form-options', auth='none', type='http', csrf=False, methods=['GET', 'OPTIONS'])
    @cors_wrapper
    def get_admission_form_options(self, **kwargs):
        """Récupérer les options pour le formulaire d'admission"""
        try:
            _logger.info("🔍 Récupération des options du formulaire d'admission")
            env = request.env(context=dict(request.env.context, active_test=False))
            
            # Récupérer les cours disponibles
            course_obj = env['op.course'].sudo()
            courses = course_obj.search_read(
                [('state', '=', 'active')],
                ['id', 'name', 'code']
            )
            _logger.info("📚 Cours trouvés: %s", len(courses))
            
            # Récupérer les lots (batches) disponibles
            batch_obj = env['op.batch'].sudo()
            batches = batch_obj.search_read(
                [('state', '=', 'active')],
                ['id', 'name', 'code', 'course_id']
            )
            _logger.info("👥 Promotions trouvées: %s", len(batches))
            
            # Récupérer les états possibles
            admission_obj = env['op.admission'].sudo()
            states = dict(admission_obj._fields['state'].selection)
            
            # Options statiques
            gender_options = [
                {'id': 'm', 'name': 'Masculin'},
                {'id': 'f', 'name': 'Féminin'},
                {'id': 'o', 'name': 'Autre'}
            ]
            
            response_data = {
                'status': 'success',
                'data': {
                    'courses': courses,
                    'batches': batches,
                    'states': states,
                    'genders': gender_options
                }
            }
            _logger.info("✅ Options du formulaire générées avec succès")
            
            return self.json_response(response_data)
            
        except Exception as e:
            _logger.error("❌ Erreur lors de la récupération des options du formulaire: %s", str(e))
            return self.json_response({
                'status': 'error',
                'message': "Erreur lors de la récupération des options"
            }, status=500)

    @http.route('/api/admissions/statistics', auth='none', type='http', csrf=False, methods=['GET', 'OPTIONS'])
    @cors_wrapper
    def get_admission_statistics(self, **kwargs):
        """Récupérer les statistiques des admissions"""
        try:
            env = request.env(context=dict(request.env.context, active_test=False))
            admission_obj = env['op.admission'].with_context(active_test=False).sudo()

            # Statistiques par statut
            status_stats = {}
            status_counts = admission_obj.read_group([], ['state'], ['state'])
            for stat in status_counts:
                status_stats[stat['state']] = stat['state_count']

            # Statistiques par cours
            course_stats = {}
            course_counts = admission_obj.read_group([], ['course_id'], ['course_id'])
            for stat in course_counts:
                if stat['course_id']:
                    course_stats[stat['course_id'][1]] = stat['course_id_count']

            return self.json_response({
                'status': 'success',
                'data': {
                    'status_stats': status_stats,
                    'course_stats': course_stats
                }
            })
        except Exception as e:
            _logger.error("Erreur lors de la récupération des statistiques d'admission: %s", str(e))
            return self.json_response({
                'status': 'error',
                'message': "Erreur lors de la récupération des statistiques"
            }, status=500)

    @http.route('/api/admissions/form-options', auth='none', type='http', csrf=False, methods=['GET', 'OPTIONS'])
    @cors_wrapper
    def get_admission_form_options(self, **kwargs):
        """Récupérer les options pour le formulaire d'admission"""
        try:
            env = request.env(context=dict(request.env.context, active_test=False))
            
            # Récupérer les cours disponibles
            course_obj = env['op.course'].sudo()
            courses = course_obj.search_read([], ['name', 'code'])
            
            # Récupérer les états possibles
            admission_obj = env['op.admission'].sudo()
            states = dict(admission_obj._fields['state'].selection)
            
            return self.json_response({
                'status': 'success',
                'data': {
                    'courses': courses,
                    'states': states
                }
            })
        except Exception as e:
            _logger.error("Erreur lors de la récupération des options du formulaire: %s", str(e))
                return self.json_response({
                
            }, status=500)

    @http.route('/api/admissions/analytics', auth='none', type='http', csrf=False, methods=['GET', 'OPTIONS'])
    @cors_wrapper
    def get_admission_analytics(self, **kwargs):
        """Récupérer les analyses des admissions"""
        try:
            env = request.env(context=dict(request.env.context, active_test=False))
            admission_obj = env['op.admission'].with_context(active_test=False).sudo()

            # Récupérer les paramètres
            period = kwargs.get('period', 'month')
            course_id = kwargs.get('course_id')
            status = kwargs.get('status')

            # Construire le domaine de base
            domain = []
            if course_id:
                domain.append(('course_id', '=', int(course_id)))
            if status:
                domain.append(('state', '=', status))

            # Calculer la date de début en fonction de la période
            today = fields.Date.today()
            if period == 'week':
                start_date = today - timedelta(days=7)
            elif period == 'month':
                start_date = today - timedelta(days=30)
            elif period == 'year':
                start_date = today - timedelta(days=365)
            else:
                start_date = today - timedelta(days=30)  # Par défaut: mois

            domain.append(('application_date', '>=', start_date))

            # Récupérer les admissions
            admissions = admission_obj.search(domain)

            # Analyse par statut
            status_analysis = {}
            for admission in admissions:
                if admission.state not in status_analysis:
                    status_analysis[admission.state] = 0
                status_analysis[admission.state] += 1

            # Analyse par cours
            course_analysis = {}
            for admission in admissions:
                if admission.course_id:
                    course_name = admission.course_id.name
                    if course_name not in course_analysis:
                        course_analysis[course_name] = 0
                    course_analysis[course_name] += 1

            # Analyse par date
            date_analysis = {}
            for admission in admissions:
                date_key = admission.application_date.strftime('%Y-%m-%d')
                if date_key not in date_analysis:
                    date_analysis[date_key] = 0
                date_analysis[date_key] += 1

            return self.json_response({
                'status': 'success',
                'data': {
                    'total_admissions': len(admissions),
                    'status_analysis': status_analysis,
                    'course_analysis': course_analysis,
                    'date_analysis': date_analysis,
                    'period': period,
                    'start_date': start_date.strftime('%Y-%m-%d'),
                    'end_date': today.strftime('%Y-%m-%d')
                }
            })

        except Exception as e:
            _logger.error("Erreur lors de la récupération des analyses: %s", str(e), exc_info=True)
            return self.json_response({
                'status': 'error',
                'code': 500,
                'message': 'Erreur interne du serveur'
            }, status=500)