# -*- coding: utf-8 -*-
from odoo import http, fields
from odoo.http import request, Response
import json
import logging
from datetime import datetime
from .main import cors_wrapper

_logger = logging.getLogger(__name__)

class ParentsManagementController(http.Controller):
    """Contrôleur pour la gestion des parents"""

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

    def _has_portal_access(self, parent):
        """Vérifie si un parent a un accès portal"""
        try:
            if not parent.user_id:
                return False
            
            # Chercher le groupe portal de la même manière que dans create_portal_user
            portal_group = request.env['res.groups'].sudo().search([('category_id.name', '=', 'User types'), ('name', '=', 'Portal')], limit=1)
            if not portal_group:
                portal_group = request.env['res.groups'].sudo().search([('name', 'ilike', 'portal')], limit=1)
            
            if portal_group:
                return portal_group.id in parent.user_id.groups_id.ids
            
            # Fallback: utiliser la méthode standard
            return parent.user_id.has_group('base.group_portal')
        except Exception as e:
            _logger.error("Erreur _has_portal_access: %s", str(e))
            return False

    # ================= GESTION DES PARENTS =================
    
    @http.route('/api/parents', auth='none', type='http', csrf=False, methods=['GET', 'POST', 'OPTIONS'])
    @cors_wrapper
    def handle_parents(self, **kwargs):
        """Gérer les parents - GET pour lister, POST pour créer"""
        method = request.httprequest.method
        
        if method == 'GET':
            return self.get_parents_list(**kwargs)
        elif method == 'POST':
            return self.create_parent(**kwargs)

    def get_parents_list(self, **kwargs):
        """Récupérer la liste des parents"""
        try:
            page = int(kwargs.get('page', 1))
            limit = int(kwargs.get('limit', 20))
            offset = (page - 1) * limit
            search = kwargs.get('search', '').strip()
            student_id = kwargs.get('student_id')
            
            # Construire le domaine de recherche
            domain = []
            if search:
                domain = [
                    '|', '|',
                    ('name.name', 'ilike', search),
                    ('mobile', 'ilike', search),
                    ('relationship_id.name', 'ilike', search)
                ]
            
            if student_id:
                domain.append(('student_ids', 'in', [int(student_id)]))
            
            parents = request.env['op.parent'].sudo().search(
                domain, limit=limit, offset=offset, order='name'
            )
            total_count = request.env['op.parent'].sudo().search_count(domain)
            
            parents_data = []
            for parent in parents:
                # Récupérer les étudiants associés
                students_info = []
                for student in parent.student_ids:
                    student_name = ''
                    if student.first_name:
                        student_name = student.first_name
                    if student.last_name:
                        student_name += f' {student.last_name}' if student_name else student.last_name
                    
                    students_info.append({
                        'id': student.id,
                        'name': student_name,
                        'gr_no': student.gr_no or ''
                    })
                
                parents_data.append({
                    'id': parent.id,
                    'name': parent.name.name if parent.name else '',
                    'mobile': parent.mobile or '',
                    'email': parent.name.email if parent.name else '',
                    'relationship': parent.relationship_id.name if parent.relationship_id else '',
                    'relationship_id': parent.relationship_id.id if parent.relationship_id else None,
                    'user_id': parent.user_id.id if parent.user_id else None,
                    'has_portal_access': self._has_portal_access(parent),
                    'students': students_info,
                    'active': parent.active
                })
            
            return {
                'status': 'success',
                'data': {
                    'parents': parents_data,
                    'pagination': {
                        'page': page,
                        'limit': limit,
                        'total': total_count,
                        'pages': (total_count + limit - 1) // limit
                    }
                }
            }
        except Exception as e:
            _logger.error("Erreur get_parents_list: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    def create_parent(self, **kwargs):
        """Créer un nouveau parent"""
        try:
            data = json.loads(request.httprequest.get_data())
            
            required_fields = ['name', 'relationship_id']
            for field in required_fields:
                if field not in data or not data[field]:
                    return {'status': 'error', 'message': f'Le champ {field} est obligatoire'}
            
            # Validation des étudiants - vérifier qu'ils ne sont pas déjà assignés
            if data.get('student_ids'):
                student_ids = data['student_ids']
                for student_id in student_ids:
                    existing_parents = request.env['op.parent'].sudo().search([
                        ('student_ids', 'in', [student_id]),
                        ('active', '=', True)
                    ])
                    if existing_parents:
                        student = request.env['op.student'].sudo().browse(student_id)
                        student_name = f"{student.first_name or ''} {student.last_name or ''}".strip()
                        parent_names = [p.name.name for p in existing_parents if p.name]
                        return {
                            'status': 'error', 
                            'message': f'L\'étudiant "{student_name}" est déjà assigné au(x) parent(s): {", ".join(parent_names)}'
                        }
            
            # Créer d'abord le partner
            partner_vals = {
                'name': data['name'],
                'mobile': data.get('mobile', ''),
                'email': data.get('email', ''),
                'is_company': False,
                'is_parent': True,
            }
            partner = request.env['res.partner'].sudo().create(partner_vals)
            
            # Créer le parent
            parent_vals = {
                'name': partner.id,
                'relationship_id': int(data['relationship_id']),
                'student_ids': [(6, 0, data.get('student_ids', []))] if data.get('student_ids') else []
            }
            
            new_parent = request.env['op.parent'].sudo().create(parent_vals)
            
            return {
                'status': 'success',
                'message': 'Parent créé avec succès',
                'data': {
                    'id': new_parent.id,
                    'name': new_parent.name.name if new_parent.name else ''
                }
            }
        except Exception as e:
            _logger.error("Erreur create_parent: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/parents/<int:parent_id>', auth='none', type='http', csrf=False, methods=['GET', 'PUT', 'DELETE', 'OPTIONS'])
    @cors_wrapper
    def handle_parent_by_id(self, parent_id, **kwargs):
        """Gérer un parent par ID"""
        method = request.httprequest.method
        
        if method == 'GET':
            return self.get_parent_by_id(parent_id)
        elif method == 'PUT':
            return self.update_parent_by_id(parent_id, **kwargs)
        elif method == 'DELETE':
            return self.delete_parent_by_id(parent_id)

    def get_parent_by_id(self, parent_id):
        """Récupérer un parent par ID"""
        try:
            parent = request.env['op.parent'].sudo().browse(parent_id)
            if not parent.exists():
                return {'status': 'error', 'message': 'Parent non trouvé'}
            
            # Informations des étudiants
            students_info = []
            for student in parent.student_ids:
                student_name = ''
                if student.first_name:
                    student_name = student.first_name
                if student.last_name:
                    student_name += f' {student.last_name}' if student_name else student.last_name
                
                students_info.append({
                    'id': student.id,
                    'name': student_name,
                    'gr_no': student.gr_no or '',
                    'course': student.course_detail_ids[0].course_id.name if student.course_detail_ids else ''
                })
            
            return {
                'status': 'success',
                'data': {
                    'id': parent.id,
                    'name': parent.name.name if parent.name else '',
                    'mobile': parent.mobile or '',
                    'email': parent.name.email if parent.name else '',
                    'relationship': parent.relationship_id.name if parent.relationship_id else '',
                    'relationship_id': parent.relationship_id.id if parent.relationship_id else None,
                    'user_id': parent.user_id.id if parent.user_id else None,
                    'has_portal_access': self._has_portal_access(parent),
                    'students': students_info,
                    'active': parent.active
                }
            }
        except Exception as e:
            _logger.error("Erreur get_parent_by_id: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    def update_parent_by_id(self, parent_id, **kwargs):
        """Mettre à jour un parent"""
        try:
            data = json.loads(request.httprequest.get_data())
            parent = request.env['op.parent'].sudo().browse(parent_id)
            
            if not parent.exists():
                return {'status': 'error', 'message': 'Parent non trouvé'}
            
            # Validation des étudiants - vérifier qu'ils ne sont pas déjà assignés à d'autres parents
            if 'student_ids' in data:
                student_ids = data['student_ids']
                for student_id in student_ids:
                    existing_parents = request.env['op.parent'].sudo().search([
                        ('student_ids', 'in', [student_id]),
                        ('active', '=', True),
                        ('id', '!=', parent_id)  # Exclure le parent actuel
                    ])
                    if existing_parents:
                        student = request.env['op.student'].sudo().browse(student_id)
                        student_name = f"{student.first_name or ''} {student.last_name or ''}".strip()
                        parent_names = [p.name.name for p in existing_parents if p.name]
                        return {
                            'status': 'error', 
                            'message': f'L\'étudiant "{student_name}" est déjà assigné au(x) parent(s): {", ".join(parent_names)}'
                        }
            
            # Mettre à jour le partner
            partner_update = {}
            if 'name' in data:
                partner_update['name'] = data['name']
            if 'mobile' in data:
                partner_update['mobile'] = data['mobile']
            if 'email' in data:
                partner_update['email'] = data['email']
            
            if partner_update and parent.name:
                parent.name.write(partner_update)
            
            # Mettre à jour le parent
            parent_update = {}
            if 'relationship_id' in data:
                parent_update['relationship_id'] = int(data['relationship_id'])
            if 'student_ids' in data:
                parent_update['student_ids'] = [(6, 0, data['student_ids'])]
            
            if parent_update:
                parent.write(parent_update)
            
            return {
                'status': 'success',
                'message': 'Parent mis à jour avec succès'
            }
        except Exception as e:
            _logger.error("Erreur update_parent_by_id: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    def delete_parent_by_id(self, parent_id):
        """Supprimer un parent"""
        try:
            parent = request.env['op.parent'].sudo().browse(parent_id)
            if not parent.exists():
                return {'status': 'error', 'message': 'Parent non trouvé'}
            
            parent_name = parent.name.name if parent.name else f'Parent {parent_id}'
            parent.unlink()
            
            return {
                'status': 'success',
                'message': f'Parent "{parent_name}" supprimé avec succès'
            }
        except Exception as e:
            _logger.error("Erreur delete_parent_by_id: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/parents/<int:parent_id>/create-portal-user', auth='none', type='http', csrf=False, methods=['POST', 'OPTIONS'])
    @cors_wrapper
    def create_portal_user(self, parent_id, **kwargs):
        """Créer un compte portal pour un parent"""
        try:
            _logger.info(f"🔐 Début création compte portal pour parent {parent_id}")
            
            # Vérifier l'authentification
            if not self._check_session():
                _logger.error("❌ Session non valide pour création compte portal")
                return {'status': 'error', 'code': 401, 'message': 'Authentification requise'}
            
            parent = request.env['op.parent'].sudo().browse(parent_id)
            if not parent.exists():
                _logger.error(f"❌ Parent {parent_id} non trouvé")
                return {'status': 'error', 'message': 'Parent non trouvé'}
            
            _logger.info(f"✅ Parent trouvé: {parent.name.name if parent.name else 'Sans nom'}")
            
            if parent.user_id:
                _logger.info(f"⚠️ Parent {parent_id} a déjà un compte utilisateur: {parent.user_id.id}")
                
                # Vérifier si l'utilisateur a déjà accès portal
                if self._has_portal_access(parent):
                    return {
                        'status': 'success', 
                        'message': 'Ce parent a déjà un compte portal actif',
                        'data': {
                            'user_id': parent.user_id.id,
                            'login': parent.user_id.login,
                            'parent': self._get_parent_data(parent)
                        }
                    }
                else:
                    # Convertir l'utilisateur existant vers le groupe portal
                    _logger.info(f"🔄 Conversion de l'utilisateur existant vers le groupe portal...")
                    portal_group = self._get_portal_group()
                    if not portal_group:
                        _logger.error("❌ Groupe portal non trouvé")
                        return {'status': 'error', 'message': 'Groupe portal non trouvé dans le système'}
                    
                    # Ajouter le groupe portal à l'utilisateur existant
                    current_groups = parent.user_id.groups_id.ids
                    if portal_group.id not in current_groups:
                        parent.user_id.sudo().write({
                            'groups_id': [(4, portal_group.id)]  # Ajouter le groupe portal
                        })
                        _logger.info(f"✅ Groupe portal ajouté à l'utilisateur existant")
                    
                    return {
                        'status': 'success',
                        'message': 'Compte converti vers portal avec succès',
                        'data': {
                            'user_id': parent.user_id.id,
                            'login': parent.user_id.login,
                            'parent': self._get_parent_data(parent)
                        }
                    }
            
            if not parent.name or not parent.name.email:
                _logger.error(f"❌ Parent {parent_id} n'a pas d'email")
                return {'status': 'error', 'message': 'Une adresse email est requise pour créer un compte portal'}
            
            _logger.info(f"📧 Email du parent: {parent.name.email}")
            
            # Vérifier si un utilisateur avec ce login existe déjà
            _logger.info("🔍 Recherche d'utilisateur existant...")
            existing_user = request.env['res.users'].sudo().search([('login', '=', parent.name.email)], limit=1)
            if existing_user:
                _logger.info(f"👤 Utilisateur existant trouvé: {existing_user.id}")
                
                # Vérifier si l'utilisateur est déjà un utilisateur portal
                portal_group = self._get_portal_group()
                if portal_group and portal_group.id in existing_user.groups_id.ids:
                    _logger.info("✅ L'utilisateur est déjà un utilisateur portal")
                    parent.sudo().write({'user_id': existing_user.id})
                    return {
                        'status': 'success',
                        'message': 'Compte portal déjà existant et associé',
                        'data': {
                            'user_id': existing_user.id,
                            'login': existing_user.login,
                            'parent': self._get_parent_data(parent)
                        }
                    }
                else:
                    _logger.warning("⚠️ Utilisateur existant avec type différent, création d'un nouveau login")
                    # Créer un login unique pour éviter les conflits
                    base_email = parent.name.email
                    email_parts = base_email.split('@')
                    new_login = f"{email_parts[0]}.parent@{email_parts[1]}"
                    
                    # Vérifier que ce nouveau login n'existe pas
                    counter = 1
                    while request.env['res.users'].sudo().search([('login', '=', new_login)], limit=1):
                        new_login = f"{email_parts[0]}.parent{counter}@{email_parts[1]}"
                        counter += 1
                    
                    _logger.info(f"📧 Nouveau login créé: {new_login}")
                    parent_email = new_login
            else:
                parent_email = parent.name.email
            
            _logger.info("👤 Création d'un nouveau compte utilisateur...")
            
            # Utiliser une company par défaut (première company disponible)
            _logger.info("🏢 Recherche de company par défaut...")
            company = request.env['res.company'].sudo().search([], limit=1)
            company_id = company.id if company else 1
            _logger.info(f"🏢 Company ID utilisé: {company_id}")
            
            # Récupérer le groupe portal
            portal_group = self._get_portal_group()
            if not portal_group:
                _logger.error("❌ Groupe portal non trouvé")
                return {'status': 'error', 'message': 'Groupe portal non trouvé dans le système'}
            
            _logger.info(f"✅ Groupe portal trouvé: {portal_group.id} - {portal_group.name}")
            
            # Créer l'utilisateur directement avec le groupe portal
            user_vals = {
                'name': parent.name.name,
                'login': parent_email,
                'email': parent_email,
                'partner_id': parent.name.id,
                'company_id': company_id,
                'company_ids': [(6, 0, [company_id])],
                'groups_id': [(6, 0, [portal_group.id])],
                'active': True,
            }
            
            _logger.info(f"👤 Création utilisateur avec vals: {user_vals}")
            
            # Créer l'utilisateur
            _logger.info("🚀 Appel de create() pour l'utilisateur...")
            user = request.env['res.users'].sudo().create(user_vals)
            _logger.info(f"✅ Utilisateur créé avec ID: {user.id}")
            
            # Associer l'utilisateur au parent
            _logger.info("🔗 Association utilisateur au parent...")
            parent.sudo().write({'user_id': user.id})
            _logger.info(f"✅ Utilisateur associé au parent")
            
            # Forcer le commit de la transaction
            _logger.info("💾 Commit de la transaction...")
            request.env.cr.commit()
            _logger.info(f"✅ Transaction committée")
            
            # Retourner les données du parent mis à jour
            return {
                'status': 'success',
                'message': 'Compte portal créé avec succès',
                'data': {
                    'user_id': user.id,
                    'login': user.login,
                    'parent': self._get_parent_data(parent)
                }
            }
        except Exception as e:
            _logger.error("❌ Erreur create_portal_user: %s", str(e))
            _logger.exception("📋 Stack trace complète:")
            # Rollback en cas d'erreur
            try:
                request.env.cr.rollback()
                _logger.info("🔙 Rollback effectué")
            except:
                _logger.error("❌ Erreur lors du rollback")
            return {'status': 'error', 'code': 500, 'message': str(e)}

    def _get_portal_group(self):
        """Récupérer le groupe portal"""
        try:
            # Essayer d'abord avec le nom XML ID standard
            portal_group = request.env.ref('base.group_portal', raise_if_not_found=False)
            if portal_group:
                return portal_group
            
            # Chercher par catégorie et nom
            portal_group = request.env['res.groups'].sudo().search([
                ('category_id.name', '=', 'User types'), 
                ('name', '=', 'Portal')
            ], limit=1)
            if portal_group:
                return portal_group
            
            # Fallback: chercher par nom seulement
            portal_group = request.env['res.groups'].sudo().search([
                ('name', 'ilike', 'portal')
            ], limit=1)
            if portal_group:
                return portal_group
            
            return None
        except Exception as e:
            _logger.error("Erreur _get_portal_group: %s", str(e))
            return None

    def _get_parent_data(self, parent):
        """Récupérer les données formatées d'un parent"""
        try:
            # Informations des étudiants
            students_info = []
            for student in parent.student_ids:
                student_name = ''
                if student.first_name:
                    student_name = student.first_name
                if student.last_name:
                    student_name += f' {student.last_name}' if student_name else student.last_name
                
                students_info.append({
                    'id': student.id,
                    'name': student_name,
                    'gr_no': student.gr_no or ''
                })
            
            return {
                'id': parent.id,
                'name': parent.name.name if parent.name else '',
                'mobile': parent.mobile or '',
                'email': parent.name.email if parent.name else '',
                'relationship': parent.relationship_id.name if parent.relationship_id else '',
                'relationship_id': parent.relationship_id.id if parent.relationship_id else None,
                'user_id': parent.user_id.id if parent.user_id else None,
                'has_portal_access': self._has_portal_access(parent),
                'students': students_info,
                'active': parent.active
            }
        except Exception as e:
            _logger.error("Erreur _get_parent_data: %s", str(e))
            return {}

    @http.route('/api/parents/relationships', auth='none', type='http', csrf=False, methods=['GET', 'OPTIONS'])
    @cors_wrapper
    def get_parent_relationships(self, **kwargs):
        """Récupérer les types de relations parent-étudiant"""
        try:
            relationships = request.env['op.parent.relationship'].sudo().search([])
            
            relationships_data = []
            for rel in relationships:
                relationships_data.append({
                    'id': rel.id,
                    'name': rel.name
                })
            
            return {
                'status': 'success',
                'data': {
                    'relationships': relationships_data
                }
            }
        except Exception as e:
            _logger.error("Erreur get_parent_relationships: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/students/<int:student_id>/parents', auth='none', type='http', csrf=False, methods=['GET', 'OPTIONS'])
    @cors_wrapper
    def get_student_parents(self, student_id, **kwargs):
        """Récupérer les parents d'un étudiant spécifique"""
        try:
            student = request.env['op.student'].sudo().browse(student_id)
            if not student.exists():
                return {'status': 'error', 'message': 'Étudiant non trouvé'}
            
            parents_info = student.get_all_parents_info()
            primary_parent = student.get_parent_for_fees()
            
            return {
                'status': 'success',
                'data': {
                    'student': {
                        'id': student.id,
                        'name': f"{student.first_name or ''} {student.last_name or ''}".strip(),
                        'gr_no': student.gr_no or ''
                    },
                    'parents': parents_info,
                    'primary_parent': primary_parent,
                    'has_parents': len(parents_info) > 0
                }
            }
        except Exception as e:
            _logger.error("Erreur get_student_parents: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/parents/statistics', auth='none', type='http', csrf=False, methods=['GET', 'OPTIONS'])
    @cors_wrapper
    def get_parents_statistics(self, **kwargs):
        """Récupérer les statistiques des parents"""
        try:
            # Statistiques générales
            total_parents = request.env['op.parent'].sudo().search_count([])
            active_parents = request.env['op.parent'].sudo().search_count([('active', '=', True)])
            
            # Compter les parents avec accès portal (vérification plus précise)
            parents_with_portal = 0
            parents_with_email = 0
            parents_with_mobile = 0
            
            all_parents = request.env['op.parent'].sudo().search([])
            for parent in all_parents:
                if self._has_portal_access(parent):
                    parents_with_portal += 1
                
                # Compter les parents avec email
                if parent.name and parent.name.email:
                    parents_with_email += 1
                
                # Compter les parents avec téléphone
                if parent.mobile:
                    parents_with_mobile += 1
            
            # Statistiques par type de relation
            relationships_stats = {}
            relationships = request.env['op.parent.relationship'].sudo().search([])
            for rel in relationships:
                count = request.env['op.parent'].sudo().search_count([('relationship_id', '=', rel.id)])
                relationships_stats[rel.name] = count
            
            # Étudiants avec/sans parents (utilisation correcte du domaine)
            students_with_parents = request.env['op.student'].sudo().search_count([('parent_ids', '!=', False)])
            total_students = request.env['op.student'].sudo().search_count([])
            students_without_parents = total_students - students_with_parents
            
            # Vérification des doublons d'étudiants
            student_parent_duplicates = 0
            all_students = request.env['op.student'].sudo().search([])
            for student in all_students:
                if len(student.parent_ids) > 1:
                    student_parent_duplicates += 1
            
            return {
                'status': 'success',
                'data': {
                    # Format compatible avec le frontend
                    'total_parents': total_parents,
                    'parents_with_email': parents_with_email,
                    'parents_with_mobile': parents_with_mobile,
                    'parents_with_portal': parents_with_portal,
                    
                    # Format détaillé pour l'API
                    'parents': {
                        'total': total_parents,
                        'active': active_parents,
                        'inactive': total_parents - active_parents,
                        'with_portal': parents_with_portal,
                        'without_portal': total_parents - parents_with_portal,
                        'with_email': parents_with_email,
                        'with_mobile': parents_with_mobile
                    },
                    'relationships': relationships_stats,
                    'students': {
                        'total': total_students,
                        'with_parents': students_with_parents,
                        'without_parents': students_without_parents,
                        'with_multiple_parents': student_parent_duplicates,
                        'coverage_rate': round((students_with_parents / total_students * 100) if total_students > 0 else 0, 2)
                    }
                }
            }
        except Exception as e:
            _logger.error("Erreur get_parents_statistics: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/parents/test-user-creation', auth='public', type='http', csrf=False, methods=['POST', 'OPTIONS'])
    @cors_wrapper
    def test_user_creation(self, **kwargs):
        """Test de création d'utilisateur pour diagnostiquer le problème"""
        try:
            _logger.info("🧪 Test de création d'utilisateur")
            
            # Test 1: Accès à l'environnement
            _logger.info("🔍 Test 1: Accès à l'environnement")
            env = request.env
            _logger.info(f"✅ Environnement accessible: {env}")
            
            # Test 2: Accès aux companies
            _logger.info("🔍 Test 2: Recherche de company")
            companies = env['res.company'].sudo().search([], limit=1)
            _logger.info(f"✅ Company trouvée: {companies.id if companies else 'Aucune'}")
            
            # Test 3: Accès aux groupes
            _logger.info("🔍 Test 3: Recherche de groupes")
            groups = env['res.groups'].sudo().search([('name', 'ilike', 'portal')], limit=1)
            _logger.info(f"✅ Groupe trouvé: {groups.id if groups else 'Aucun'}")
            
            # Test 4: Création d'un partner simple
            _logger.info("🔍 Test 4: Création d'un partner test")
            partner = env['res.partner'].sudo().create({
                'name': 'Test User Portal',
                'email': 'test.portal@example.com',
                'is_company': False
            })
            _logger.info(f"✅ Partner créé: {partner.id}")
            
            # Test 5: Tentative de création d'utilisateur basique
            _logger.info("🔍 Test 5: Création d'utilisateur basique")
            user = env['res.users'].sudo().create({
                'name': 'Test User Portal',
                'login': 'test.portal@example.com',
                'email': 'test.portal@example.com',
                'partner_id': partner.id,
                'active': True,
            })
            _logger.info(f"✅ Utilisateur créé: {user.id}")
            
            # Nettoyage
            user.sudo().unlink()
            partner.sudo().unlink()
            _logger.info("🧹 Nettoyage effectué")
            
            return {
                'status': 'success',
                'message': 'Test de création d\'utilisateur réussi'
            }
            
        except Exception as e:
            _logger.error("❌ Erreur test_user_creation: %s", str(e))
            _logger.exception("📋 Stack trace complète:")
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/parents/debug-user', auth='public', type='http', csrf=False, methods=['POST', 'OPTIONS'])
    @cors_wrapper
    def debug_user(self, **kwargs):
        """Debug des utilisateurs existants"""
        try:
            data = json.loads(request.httprequest.get_data())
            email = data.get('email', 'ndeye.fatou@gmail.com')
            
            _logger.info(f"🔍 Debug pour email: {email}")
            
            # Chercher tous les utilisateurs avec cet email
            users_by_login = request.env['res.users'].sudo().search([('login', '=', email)])
            users_by_email = request.env['res.users'].sudo().search([('email', '=', email)])
            
            # Chercher les partners avec cet email
            partners = request.env['res.partner'].sudo().search([('email', '=', email)])
            
            result = {
                'email': email,
                'users_by_login': [],
                'users_by_email': [],
                'partners': []
            }
            
            for user in users_by_login:
                result['users_by_login'].append({
                    'id': user.id,
                    'name': user.name,
                    'login': user.login,
                    'email': user.email,
                    'active': user.active,
                    'groups': [g.name for g in user.groups_id]
                })
            
            for user in users_by_email:
                result['users_by_email'].append({
                    'id': user.id,
                    'name': user.name,
                    'login': user.login,
                    'email': user.email,
                    'active': user.active,
                    'groups': [g.name for g in user.groups_id]
                })
            
            for partner in partners:
                result['partners'].append({
                    'id': partner.id,
                    'name': partner.name,
                    'email': partner.email,
                    'is_company': partner.is_company,
                    'user_ids': [u.id for u in partner.user_ids]
                })
            
            return {
                'status': 'success',
                'data': result
            }
            
        except Exception as e:
            _logger.error("❌ Erreur debug_user: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/parents/<int:parent_id>/refresh', auth='none', type='http', csrf=False, methods=['GET', 'OPTIONS'])
    @cors_wrapper
    def refresh_parent_data(self, parent_id, **kwargs):
        """Rafraîchir les données d'un parent (utile après modification)"""
        try:
            parent = request.env['op.parent'].sudo().browse(parent_id)
            if not parent.exists():
                return {'status': 'error', 'message': 'Parent non trouvé'}
            
            # Recharger les données depuis la base
            parent = request.env['op.parent'].sudo().browse(parent_id)
            
            # Informations des étudiants
            students_info = []
            for student in parent.student_ids:
                student_name = ''
                if student.first_name:
                    student_name = student.first_name
                if student.last_name:
                    student_name += f' {student.last_name}' if student_name else student.last_name
                
                students_info.append({
                    'id': student.id,
                    'name': student_name,
                    'gr_no': student.gr_no or '',
                    'course': student.course_detail_ids[0].course_id.name if student.course_detail_ids else ''
                })
            
            return {
                'status': 'success',
                'data': {
                    'id': parent.id,
                    'name': parent.name.name if parent.name else '',
                    'mobile': parent.mobile or '',
                    'email': parent.name.email if parent.name else '',
                    'relationship': parent.relationship_id.name if parent.relationship_id else '',
                    'relationship_id': parent.relationship_id.id if parent.relationship_id else None,
                    'user_id': parent.user_id.id if parent.user_id else None,
                    'has_portal_access': self._has_portal_access(parent),
                    'students': students_info,
                    'active': parent.active
                }
            }
        except Exception as e:
            _logger.error("Erreur refresh_parent_data: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/parents/cleanup-duplicates', auth='none', type='http', csrf=False, methods=['POST', 'OPTIONS'])
    @cors_wrapper
    def cleanup_student_duplicates(self, **kwargs):
        """Nettoyer les doublons d'assignation d'étudiants"""
        try:
            # Vérifier l'authentification
            if not self._check_session():
                return {'status': 'error', 'code': 401, 'message': 'Authentification requise'}
            
            duplicates_found = []
            duplicates_cleaned = []
            
            # Trouver tous les étudiants avec plusieurs parents
            all_students = request.env['op.student'].sudo().search([])
            for student in all_students:
                if len(student.parent_ids) > 1:
                    student_name = f"{student.first_name or ''} {student.last_name or ''}".strip()
                    parent_names = [p.name.name for p in student.parent_ids if p.name]
                    
                    duplicates_found.append({
                        'student_id': student.id,
                        'student_name': student_name,
                        'parents': parent_names,
                        'parent_count': len(student.parent_ids)
                    })
                    
                    # Garder seulement le premier parent (par ordre de création)
                    first_parent = student.parent_ids[0]
                    other_parents = student.parent_ids[1:]
                    
                    # Retirer l'étudiant des autres parents
                    for parent in other_parents:
                        parent.write({
                            'student_ids': [(3, student.id)]  # Unlink student
                        })
                    
                    duplicates_cleaned.append({
                        'student_name': student_name,
                        'kept_parent': first_parent.name.name if first_parent.name else f'Parent {first_parent.id}',
                        'removed_from': [p.name.name for p in other_parents if p.name]
                    })
            
            return {
                'status': 'success',
                'message': f'{len(duplicates_cleaned)} doublons nettoyés avec succès',
                'data': {
                    'duplicates_found': duplicates_found,
                    'duplicates_cleaned': duplicates_cleaned,
                    'total_cleaned': len(duplicates_cleaned)
                }
            }
        except Exception as e:
            _logger.error("Erreur cleanup_student_duplicates: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)} 