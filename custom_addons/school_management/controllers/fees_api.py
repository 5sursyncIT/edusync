# -*- coding: utf-8 -*-
from odoo import http, fields
from odoo.http import request, Response
import json
import logging
from datetime import datetime, timedelta, date
from .main import cors_wrapper

_logger = logging.getLogger(__name__)

class FeesManagementController(http.Controller):
    """Contrôleur pour la gestion des frais scolaires"""

    # ================= GESTION DES FRAIS SCOLAIRES =================
    
    @http.route('/api/fees/terms', auth='none', type='http', csrf=False, methods=['GET', 'POST', 'OPTIONS'])
    @cors_wrapper
    def handle_fees_terms(self, **kwargs):
        """Gérer les termes de frais - GET pour lister, POST pour créer"""
        method = request.httprequest.method
        
        if method == 'GET':
            return self.get_fees_terms_list(**kwargs)
        elif method == 'POST':
            return self.create_fees_term(**kwargs)

    def get_fees_terms_list(self, **kwargs):
        """Récupérer la liste des termes de frais"""
        try:
            page = int(kwargs.get('page', 1))
            limit = int(kwargs.get('limit', 20))
            offset = (page - 1) * limit
            search = kwargs.get('search', '').strip()
            
            # Construire le domaine de recherche
            domain = []
            if search:
                domain = [
                    '|', '|',
                    ('name', 'ilike', search),
                    ('school_year_id.name', 'ilike', search),
                    ('payment_method', 'ilike', search)
                ]
            
            fees_terms = request.env['op.fees.terms'].sudo().search(
                domain, limit=limit, offset=offset, order='create_date desc'
            )
            total_count = request.env['op.fees.terms'].sudo().search_count(domain)
            
            terms_data = []
            for term in fees_terms:
                terms_data.append({
                    'id': term.id,
                    'name': term.name or '',
                    'school_year': {
                        'id': term.school_year_id.id if term.school_year_id else None,
                        'name': term.school_year_id.name if term.school_year_id else ''
                    },
                    'is_mandatory': term.is_mandatory,
                    'payment_method': term.payment_method or '',
                    'late_fee_amount': term.late_fee_amount,
                    'create_date': str(term.create_date) if term.create_date else None,
                    'line_count': len(term.line_ids) if hasattr(term, 'line_ids') else 0
                })
            
            return {
                'status': 'success',
                'data': {
                    'fees_terms': terms_data,
                    'pagination': {
                        'page': page,
                        'limit': limit,
                        'total': total_count,
                        'pages': (total_count + limit - 1) // limit
                    }
                }
            }
        except Exception as e:
            _logger.error("Erreur get_fees_terms_list: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    def create_fees_term(self, **kwargs):
        """Créer un nouveau terme de frais"""
        try:
            data = json.loads(request.httprequest.get_data())
            
            if not data.get('name'):
                return {'status': 'error', 'message': 'Le nom du terme de frais est obligatoire'}
            
            # Récupérer la compagnie par défaut
            company_id = request.env.user.company_id.id if request.env.user.company_id else 1
            
            term_data = {
                'name': data['name'],
                'company_id': company_id,  # Ajouter company_id obligatoire
                'school_year_id': int(data['school_year_id']) if data.get('school_year_id') else None,
                'is_mandatory': data.get('is_mandatory', True),
                'payment_method': data.get('payment_method', 'cash'),
                'late_fee_amount': float(data.get('late_fee_amount', 0.0))
            }
            
            new_term = request.env['op.fees.terms'].sudo().create(term_data)
            
            return {
                'status': 'success',
                'message': 'Terme de frais créé avec succès',
                'data': {
                    'id': new_term.id,
                    'name': new_term.name
                }
            }
        except Exception as e:
            _logger.error("Erreur create_fees_term: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/fees/terms/<int:term_id>', auth='none', type='http', csrf=False, methods=['GET', 'PUT', 'DELETE', 'OPTIONS'])
    @cors_wrapper
    def handle_fees_term_by_id(self, term_id, **kwargs):
        """Gérer un terme de frais par ID"""
        method = request.httprequest.method
        
        if method == 'GET':
            return self.get_fees_term_by_id(term_id)
        elif method == 'PUT':
            return self.update_fees_term_by_id(term_id, **kwargs)
        elif method == 'DELETE':
            return self.delete_fees_term_by_id(term_id)

    def get_fees_term_by_id(self, term_id):
        """Récupérer un terme de frais par ID"""
        try:
            term = request.env['op.fees.terms'].sudo().browse(term_id)
            if not term.exists():
                return {'status': 'error', 'message': 'Terme de frais non trouvé'}
            
            return {
                'status': 'success',
                'data': {
                    'id': term.id,
                    'name': term.name or '',
                    'school_year_id': term.school_year_id.id if term.school_year_id else None,
                    'school_year_name': term.school_year_id.name if term.school_year_id else '',
                    'is_mandatory': term.is_mandatory,
                    'payment_method': term.payment_method or '',
                    'late_fee_amount': term.late_fee_amount,
                    'create_date': str(term.create_date) if term.create_date else None
                }
            }
        except Exception as e:
            _logger.error("Erreur get_fees_term_by_id: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    def update_fees_term_by_id(self, term_id, **kwargs):
        """Mettre à jour un terme de frais"""
        try:
            data = json.loads(request.httprequest.get_data())
            term = request.env['op.fees.terms'].sudo().browse(term_id)
            
            if not term.exists():
                return {'status': 'error', 'message': 'Terme de frais non trouvé'}
            
            update_data = {}
            if 'name' in data:
                update_data['name'] = data['name']
            if 'school_year_id' in data:
                update_data['school_year_id'] = int(data['school_year_id']) if data['school_year_id'] else None
            if 'is_mandatory' in data:
                update_data['is_mandatory'] = data['is_mandatory']
            if 'payment_method' in data:
                update_data['payment_method'] = data['payment_method']
            if 'late_fee_amount' in data:
                update_data['late_fee_amount'] = float(data['late_fee_amount'])
            
            # S'assurer que company_id est présent si nécessaire
            if not term.company_id:
                company_id = request.env.user.company_id.id if request.env.user.company_id else 1
                update_data['company_id'] = company_id
            
            term.write(update_data)
            
            return {
                'status': 'success',
                'message': 'Terme de frais mis à jour avec succès'
            }
        except Exception as e:
            _logger.error("Erreur update_fees_term_by_id: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    def delete_fees_term_by_id(self, term_id):
        """Supprimer un terme de frais"""
        try:
            term = request.env['op.fees.terms'].sudo().browse(term_id)
            if not term.exists():
                return {'status': 'error', 'message': 'Terme de frais non trouvé'}
            
            term_name = term.name
            term.unlink()
            
            return {
                'status': 'success',
                'message': f'Terme de frais "{term_name}" supprimé avec succès'
            }
        except Exception as e:
            _logger.error("Erreur delete_fees_term_by_id: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/fees/details', auth='none', type='http', csrf=False, methods=['GET', 'POST', 'OPTIONS'])
    @cors_wrapper
    def handle_fees_details(self, **kwargs):
        """Gérer les détails de frais des étudiants"""
        method = request.httprequest.method
        
        if method == 'GET':
            return self.get_fees_details_list(**kwargs)
        elif method == 'POST':
            return self.create_fees_detail(**kwargs)

    @http.route('/api/fees/details/<int:detail_id>', auth='none', type='http', csrf=False, methods=['GET', 'PUT', 'DELETE', 'OPTIONS'])
    @cors_wrapper
    def handle_fees_detail_by_id(self, detail_id, **kwargs):
        """Gérer un détail de frais spécifique par ID"""
        method = request.httprequest.method
        
        if method == 'GET':
            return self.get_fees_detail_by_id(detail_id)
        elif method == 'PUT':
            return self.update_fees_detail_by_id(detail_id, **kwargs)
        elif method == 'DELETE':
            return self.delete_fees_detail_by_id(detail_id)

    def get_fees_details_list(self, **kwargs):
        """Récupérer la liste des détails de frais"""
        try:
            page = int(kwargs.get('page', 1))
            limit = int(kwargs.get('limit', 20))
            offset = (page - 1) * limit
            search = kwargs.get('search', '').strip()
            state_filter = kwargs.get('state')
            student_id = kwargs.get('student_id')
            
            # Construire le domaine de recherche
            domain = []
            if search:
                domain = [
                    '|', '|',
                    ('student_id.first_name', 'ilike', search),
                    ('student_id.last_name', 'ilike', search),
                    ('payment_reference', 'ilike', search)
                ]
            
            if state_filter:
                domain.append(('state', '=', state_filter))
            
            if student_id:
                domain.append(('student_id', '=', int(student_id)))
            
            fees_details = request.env['op.student.fees.details'].sudo().search(
                domain, limit=limit, offset=offset, order='create_date desc'
            )
            total_count = request.env['op.student.fees.details'].sudo().search_count(domain)
            
            details_data = []
            for detail in fees_details:
                student_name = ''
                if detail.student_id:
                    name_parts = []
                    if detail.student_id.first_name:
                        name_parts.append(detail.student_id.first_name)
                    if detail.student_id.last_name:
                        name_parts.append(detail.student_id.last_name)
                    student_name = ' '.join(name_parts)
                
                # Utiliser les vraies relations parent-étudiant d'OpenEduCat
                parent_info = {'id': None, 'name': ''}
                if detail.student_id:
                    parent_data = detail.student_id.get_parent_for_fees()
                    parent_info = {
                        'id': parent_data.get('id'),
                        'name': parent_data.get('name', ''),
                        'mobile': parent_data.get('mobile', ''),
                        'email': parent_data.get('email', ''),
                        'relationship': parent_data.get('relationship', '')
                    }

                details_data.append({
                    'id': detail.id,
                    'student': {
                        'id': detail.student_id.id if detail.student_id else None,
                        'name': student_name
                    },
                    'amount': detail.amount,
                    'payment_method': detail.payment_method or '',
                    'payment_reference': detail.payment_reference or '',
                    'is_late': detail.is_late,
                    'late_fee_applied': detail.late_fee_applied,
                    'payment_deadline': str(detail.payment_deadline) if detail.payment_deadline else None,
                    'date': str(detail.date) if detail.date else None,
                    'state': detail.state if detail.state else 'draft',
                    'parent': parent_info
                })
            
            return {
                'status': 'success',
                'data': {
                    'fees_details': details_data,
                    'pagination': {
                        'page': page,
                        'limit': limit,
                        'total': total_count,
                        'pages': (total_count + limit - 1) // limit
                    }
                }
            }
        except Exception as e:
            _logger.error("Erreur get_fees_details_list: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    def create_fees_detail(self, **kwargs):
        """Créer un nouveau détail de frais"""
        try:
            data = json.loads(request.httprequest.get_data())
            
            required_fields = ['student_id', 'amount']
            for field in required_fields:
                if field not in data or not data[field]:
                    return {'status': 'error', 'message': f'Le champ {field} est obligatoire'}
            
            detail_data = {
                'student_id': int(data['student_id']),
                'amount': float(data['amount']),
                'payment_method': data.get('payment_method', 'cash'),
                'payment_reference': data.get('payment_reference', ''),
                'date': data.get('date', fields.Date.today())
            }
            
            # Ajouter la date limite de paiement si fournie
            if 'payment_deadline' in data and data['payment_deadline']:
                detail_data['payment_deadline'] = data['payment_deadline']
            
            new_detail = request.env['op.student.fees.details'].sudo().create(detail_data)
            
            return {
                'status': 'success',
                'message': 'Détail de frais créé avec succès',
                'data': {
                    'id': new_detail.id,
                    'amount': new_detail.amount,
                    'payment_deadline': str(new_detail.payment_deadline) if new_detail.payment_deadline else None
                }
            }
        except Exception as e:
            _logger.error("Erreur create_fees_detail: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    def get_fees_detail_by_id(self, detail_id):
        """Récupérer un détail de frais par ID"""
        try:
            detail = request.env['op.student.fees.details'].sudo().browse(detail_id)
            if not detail.exists():
                return {'status': 'error', 'message': 'Détail de frais non trouvé'}
            
            student_name = ''
            if detail.student_id:
                name_parts = []
                if detail.student_id.first_name:
                    name_parts.append(detail.student_id.first_name)
                if detail.student_id.last_name:
                    name_parts.append(detail.student_id.last_name)
                student_name = ' '.join(name_parts)
            
            return {
                'status': 'success',
                'data': {
                    'id': detail.id,
                    'student': {
                        'id': detail.student_id.id if detail.student_id else None,
                        'name': student_name
                    },
                    'amount': detail.amount,
                    'payment_method': detail.payment_method or '',
                    'payment_reference': detail.payment_reference or '',
                    'is_late': detail.is_late,
                    'late_fee_applied': detail.late_fee_applied,
                    'payment_deadline': str(detail.payment_deadline) if detail.payment_deadline else None,
                    'date': str(detail.date) if detail.date else None,
                    'state': detail.state
                }
            }
        except Exception as e:
            _logger.error("Erreur get_fees_detail_by_id: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    def update_fees_detail_by_id(self, detail_id, **kwargs):
        """Mettre à jour un détail de frais"""
        try:
            detail = request.env['op.student.fees.details'].sudo().browse(detail_id)
            if not detail.exists():
                return {'status': 'error', 'message': 'Détail de frais non trouvé'}
            
            data = json.loads(request.httprequest.get_data())
            
            # Préparer les données à mettre à jour
            update_data = {}
            
            if 'amount' in data:
                update_data['amount'] = float(data['amount'])
            
            if 'payment_method' in data:
                update_data['payment_method'] = data['payment_method']
            
            if 'payment_reference' in data:
                update_data['payment_reference'] = data['payment_reference']
            
            if 'payment_deadline' in data and data['payment_deadline']:
                update_data['payment_deadline'] = data['payment_deadline']
            
            if 'date' in data and data['date']:
                update_data['date'] = data['date']
            
            detail.write(update_data)
            
            return {
                'status': 'success',
                'message': 'Détail de frais mis à jour avec succès',
                'data': {
                    'id': detail.id,
                    'amount': detail.amount
                }
            }
        except Exception as e:
            _logger.error("Erreur update_fees_detail_by_id: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    def delete_fees_detail_by_id(self, detail_id):
        """Supprimer un détail de frais"""
        try:
            detail = request.env['op.student.fees.details'].sudo().browse(detail_id)
            if not detail.exists():
                return {'status': 'error', 'message': 'Détail de frais non trouvé'}
            
            # Vérifier si le détail peut être supprimé (pas payé)
            if detail.state == 'invoice':
                return {'status': 'error', 'message': 'Impossible de supprimer un frais déjà payé'}
            
            student_name = ''
            if detail.student_id:
                name_parts = []
                if detail.student_id.first_name:
                    name_parts.append(detail.student_id.first_name)
                if detail.student_id.last_name:
                    name_parts.append(detail.student_id.last_name)
                student_name = ' '.join(name_parts)
            
            amount = detail.amount
            detail.unlink()
            
            return {
                'status': 'success',
                'message': f'Détail de frais de {amount}€ pour {student_name} supprimé avec succès'
            }
        except Exception as e:
            _logger.error("Erreur delete_fees_detail_by_id: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/fees/statistics', auth='none', type='http', csrf=False, methods=['GET', 'OPTIONS'])
    @cors_wrapper
    def get_fees_statistics(self, **kwargs):
        """Récupérer les statistiques des frais"""
        try:
            # Statistiques des termes de frais
            total_terms = request.env['op.fees.terms'].sudo().search_count([])
            mandatory_terms = request.env['op.fees.terms'].sudo().search_count([('is_mandatory', '=', True)])
            
            # Statistiques des détails de frais
            total_details = request.env['op.student.fees.details'].sudo().search_count([])
            paid_details = request.env['op.student.fees.details'].sudo().search_count([('state', '=', 'invoice')])
            late_details = request.env['op.student.fees.details'].sudo().search_count([('is_late', '=', True)])
            
            # Calculs des montants
            all_details = request.env['op.student.fees.details'].sudo().search([])
            total_amount = sum(detail.amount for detail in all_details)
            paid_amount = sum(detail.amount for detail in all_details if detail.state == 'invoice')
            late_fees_amount = sum(detail.late_fee_applied for detail in all_details)
            
            # Statistiques par étudiant
            students_with_fees = request.env['op.student'].sudo().search([
                ('total_fees_amount', '>', 0)
            ])
            
            fees_status_stats = {}
            for student in students_with_fees:
                status = student.fees_status
                if status in fees_status_stats:
                    fees_status_stats[status] += 1
                else:
                    fees_status_stats[status] = 1
            
            return {
                'status': 'success',
                'data': {
                    'terms': {
                        'total': total_terms,
                        'mandatory': mandatory_terms,
                        'optional': total_terms - mandatory_terms
                    },
                    'details': {
                        'total': total_details,
                        'paid': paid_details,
                        'unpaid': total_details - paid_details,
                        'late': late_details
                    },
                    'amounts': {
                        'total_amount': total_amount,
                        'paid_amount': paid_amount,
                        'outstanding_amount': total_amount - paid_amount,
                        'late_fees_amount': late_fees_amount,
                        'payment_rate': round((paid_amount / total_amount * 100) if total_amount > 0 else 0, 2)
                    },
                    'students': {
                        'with_fees': len(students_with_fees),
                        'status_breakdown': fees_status_stats
                    }
                }
            }
        except Exception as e:
            _logger.error("Erreur get_fees_statistics: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/fees/unpaid', auth='none', type='http', csrf=False, methods=['GET', 'OPTIONS'])
    @cors_wrapper
    def get_unpaid_fees(self, **kwargs):
        """Récupérer les frais impayés"""
        try:
            page = int(kwargs.get('page', 1))
            limit = int(kwargs.get('limit', 20))
            offset = (page - 1) * limit
            
            unpaid_fees = request.env['op.student.fees.details'].sudo().search([
                ('state', '=', 'draft')
            ], limit=limit, offset=offset, order='payment_deadline asc')
            
            total_count = request.env['op.student.fees.details'].sudo().search_count([
                ('state', '=', 'draft')
            ])
            
            fees_data = []
            for fee in unpaid_fees:
                student_name = ''
                if fee.student_id:
                    name_parts = []
                    if fee.student_id.first_name:
                        name_parts.append(fee.student_id.first_name)
                    if fee.student_id.last_name:
                        name_parts.append(fee.student_id.last_name)
                    student_name = ' '.join(name_parts)
                
                fees_data.append({
                    'id': fee.id,
                    'student': {
                        'id': fee.student_id.id if fee.student_id else None,
                        'name': student_name
                    },
                    'amount': fee.amount,
                    'payment_deadline': str(fee.payment_deadline) if fee.payment_deadline else None,
                    'is_late': fee.is_late,
                    'days_overdue': (datetime.now().date() - fee.payment_deadline).days if fee.payment_deadline and fee.payment_deadline < datetime.now().date() else 0
                })
            
            return {
                'status': 'success',
                'data': {
                    'unpaid_fees': fees_data,
                    'pagination': {
                        'page': page,
                        'limit': limit,
                        'total': total_count,
                        'pages': (total_count + limit - 1) // limit
                    }
                }
            }
        except Exception as e:
            _logger.error("Erreur get_unpaid_fees: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/fees/overdue', auth='none', type='http', csrf=False, methods=['GET', 'OPTIONS'])
    @cors_wrapper
    def get_overdue_fees(self, **kwargs):
        """Récupérer les frais en retard"""
        try:
            page = int(kwargs.get('page', 1))
            limit = int(kwargs.get('limit', 20))
            offset = (page - 1) * limit
            
            overdue_fees = request.env['op.student.fees.details'].sudo().search([
                ('is_late', '=', True)
            ], limit=limit, offset=offset, order='payment_deadline asc')
            
            total_count = request.env['op.student.fees.details'].sudo().search_count([
                ('is_late', '=', True)
            ])
            
            fees_data = []
            for fee in overdue_fees:
                student_name = ''
                if fee.student_id:
                    name_parts = []
                    if fee.student_id.first_name:
                        name_parts.append(fee.student_id.first_name)
                    if fee.student_id.last_name:
                        name_parts.append(fee.student_id.last_name)
                    student_name = ' '.join(name_parts)
                
                fees_data.append({
                    'id': fee.id,
                    'student': {
                        'id': fee.student_id.id if fee.student_id else None,
                        'name': student_name
                    },
                    'amount': fee.amount,
                    'late_fee_applied': fee.late_fee_applied,
                    'payment_deadline': str(fee.payment_deadline) if fee.payment_deadline else None,
                    'days_overdue': (datetime.now().date() - fee.payment_deadline).days if fee.payment_deadline and fee.payment_deadline < datetime.now().date() else 0
                })
            
            return {
                'status': 'success',
                'data': {
                    'overdue_fees': fees_data,
                    'pagination': {
                        'page': page,
                        'limit': limit,
                        'total': total_count,
                        'pages': (total_count + limit - 1) // limit
                    }
                }
            }
        except Exception as e:
            _logger.error("Erreur get_overdue_fees: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/fees/generate/<int:student_id>', auth='none', type='http', csrf=False, methods=['POST', 'OPTIONS'])
    @cors_wrapper
    def generate_student_fees(self, student_id, **kwargs):
        """Générer les frais pour un étudiant"""
        try:
            student = request.env['op.student'].sudo().browse(student_id)
            if not student.exists():
                return {'status': 'error', 'message': 'Étudiant non trouvé'}
            
            # Utiliser la méthode du modèle étendu
            student.generate_fees_for_student()
            
            return {
                'status': 'success',
                'message': f'Frais générés avec succès pour {student.first_name} {student.last_name}'
            }
        except Exception as e:
            _logger.error("Erreur generate_student_fees: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/fees/apply-late-fee/<int:detail_id>', auth='none', type='http', csrf=False, methods=['POST', 'OPTIONS'])
    @cors_wrapper
    def apply_late_fee(self, detail_id, **kwargs):
        """Appliquer des frais de retard"""
        try:
            detail = request.env['op.student.fees.details'].sudo().browse(detail_id)
            if not detail.exists():
                return {'status': 'error', 'message': 'Détail de frais non trouvé'}
            
            # Utiliser la méthode du modèle étendu
            detail.apply_late_fee()
            
            return {
                'status': 'success',
                'message': 'Frais de retard appliqués avec succès',
                'data': {
                    'late_fee_applied': detail.late_fee_applied,
                    'new_amount': detail.amount
                }
            }
        except Exception as e:
            _logger.error("Erreur apply_late_fee: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/students/simple', auth='none', type='http', csrf=False, methods=['GET', 'OPTIONS'])
    @cors_wrapper
    def get_students_simple_list(self, **kwargs):
        """Récupérer la liste simple des étudiants pour les listes déroulantes"""
        try:
            limit = int(kwargs.get('limit', 100))
            search = kwargs.get('search', '').strip()
            
            # Construire le domaine de recherche
            domain = []
            if search:
                domain = [
                    '|', '|',
                    ('first_name', 'ilike', search),
                    ('last_name', 'ilike', search),
                    ('gr_no', 'ilike', search)
                ]
            
            students = request.env['op.student'].sudo().search(
                domain, limit=limit, order='first_name, last_name'
            )
            
            students_data = []
            for student in students:
                student_name = ''
                if student.first_name:
                    student_name = student.first_name
                if student.last_name:
                    student_name += f' {student.last_name}' if student_name else student.last_name
                
                students_data.append({
                    'id': student.id,
                    'name': student_name,
                    'gr_no': student.gr_no or '',
                    'email': student.email or '',
                    'full_display': f"{student_name} ({student.gr_no or f'ID: {student.id}'})"
                })
            
            return {
                'status': 'success',
                'data': {
                    'students': students_data,
                    'count': len(students_data)
                }
            }
        except Exception as e:
            _logger.error("Erreur get_students_simple_list: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)} 