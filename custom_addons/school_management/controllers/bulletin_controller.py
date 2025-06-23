# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
import json
import logging
from datetime import datetime
from .main import cors_wrapper  # Import du décorateur CORS depuis main.py

_logger = logging.getLogger(__name__)

class BulletinController(http.Controller):

    def _check_session(self):
        """Vérifie si la session est valide (version simplifiée temporaire pour le debug)"""
        try:
            _logger.info("Vérification de session désactivée temporairement pour le debug")
            # Temporairement désactiver la vérification stricte pour permettre le debug
            # TODO: Réactiver quand la session sera correctement gérée
            return True
            
        except Exception as e:
            _logger.error("Erreur vérification session: %s", str(e))
            return True  # Retourner True temporairement pour le debug

    # ================= ENDPOINTS TRIMESTRES =================
    
    @http.route('/api/trimestres', auth='none', type='http', csrf=False, methods=['GET', 'POST', 'OPTIONS'])
    @cors_wrapper
    def handle_trimestres(self, **kwargs):
        """Gérer les trimestres (GET/POST)"""
        if request.httprequest.method == 'GET':
            return self.get_trimestres_list(**kwargs)
        elif request.httprequest.method == 'POST':
            return self.create_trimestre(**kwargs)

    def get_trimestres_list(self, **kwargs):
        """Récupérer la liste des trimestres"""
        try:
            if not self._check_session():
                return {'status': 'error', 'code': 401, 'message': 'Session invalide ou expirée'}

            trimestres = request.env['op.trimestre'].sudo().search([])
            
            trimestre_data = []
            for trimestre in trimestres:
                trimestre_data.append({
                    'id': trimestre.id,
                    'name': trimestre.name,
                    'code': trimestre.code,
                    'date_debut': trimestre.date_debut.isoformat() if trimestre.date_debut else None,
                    'date_fin': trimestre.date_fin.isoformat() if trimestre.date_fin else None,
                    'education_level': trimestre.education_level,
                    'active': trimestre.active,
                    'annee_scolaire': trimestre.annee_scolaire
                })

            return {
                'status': 'success',
                'data': trimestre_data,
                'count': len(trimestre_data)
            }

        except Exception as e:
            _logger.error("Erreur récupération trimestres: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    def create_trimestre(self, **kwargs):
        """Créer un nouveau trimestre"""
        try:
            if not self._check_session():
                return {'status': 'error', 'code': 401, 'message': 'Session invalide ou expirée'}

            data = json.loads(request.httprequest.get_data())
            
            # Validation des données requises
            required_fields = ['name', 'code', 'date_debut', 'date_fin', 'education_level']
            for field in required_fields:
                if field not in data:
                    return {'status': 'error', 'code': 400, 'message': f'Champ requis manquant: {field}'}

            trimestre_data = {
                'name': data['name'],
                'code': data['code'],
                'date_debut': data['date_debut'],
                'date_fin': data['date_fin'],
                'education_level': data['education_level'],
                'annee_scolaire': data.get('annee_scolaire', '2024-2025'),
                'active': data.get('active', True)
            }

            trimestre = request.env['op.trimestre'].sudo().create(trimestre_data)

            return {
                'status': 'success',
                'message': 'Trimestre créé avec succès',
                'data': {
                    'id': trimestre.id,
                    'name': trimestre.name,
                    'code': trimestre.code
                }
            }

        except Exception as e:
            _logger.error("Erreur création trimestre: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    # ================= ENDPOINTS BULLETINS =================
    
    @http.route('/api/bulletins', auth='none', type='http', csrf=False, methods=['GET', 'POST', 'OPTIONS'])
    @cors_wrapper
    def handle_bulletins(self, **kwargs):
        """Gérer les bulletins (GET/POST)"""
        if request.httprequest.method == 'GET':
            return self.get_bulletins_list(**kwargs)
        elif request.httprequest.method == 'POST':
            return self.create_bulletin(**kwargs)

    def get_bulletins_list(self, **kwargs):
        """Récupérer la liste des bulletins"""
        try:
            if not self._check_session():
                return {'status': 'error', 'code': 401, 'message': 'Session invalide ou expirée'}

            # Paramètres de filtrage optionnels
            student_id = kwargs.get('student_id')
            trimestre_id = kwargs.get('trimestre_id')
            state = kwargs.get('state')

            domain = []
            if student_id:
                domain.append(('student_id', '=', int(student_id)))
            if trimestre_id:
                domain.append(('trimestre_id', '=', int(trimestre_id)))
            if state:
                domain.append(('state', '=', state))

            bulletins = request.env['op.bulletin'].sudo().search(domain)
            
            bulletin_data = []
            for bulletin in bulletins:
                bulletin_data.append({
                    'id': bulletin.id,
                    'numero': bulletin.numero_bulletin,
                    'student_id': bulletin.student_id.id,
                    'student_name': bulletin.student_id.name,
                    'trimestre_id': bulletin.trimestre_id.id,
                    'trimestre_name': bulletin.trimestre_id.name,
                    'batch_id': bulletin.batch_id.id if bulletin.batch_id else None,
                    'batch_name': bulletin.batch_id.name if bulletin.batch_id else '',
                    'date_creation': bulletin.date_creation.isoformat() if bulletin.date_creation else None,
                    'date_edition': bulletin.date_edition.isoformat() if bulletin.date_edition else None,
                    'moyenne_generale': float(bulletin.moyenne_generale) if bulletin.moyenne_generale else 0.0,
                    'rang_classe': bulletin.rang_classe,
                    'total_eleves_classe': bulletin.total_eleves_classe,
                    'appreciation_generale': bulletin.appreciation_generale,
                    'state': bulletin.state,
                    'absence_non_justifiees': bulletin.absence_non_justifiees,
                    'absence_justifiees': bulletin.absence_justifiees,
                    'retards': bulletin.retards
                })

            return {
                'status': 'success',
                'data': bulletin_data,
                'count': len(bulletin_data)
            }

        except Exception as e:
            _logger.error("Erreur récupération bulletins: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    def create_bulletin(self, **kwargs):
        """Créer un nouveau bulletin"""
        try:
            if not self._check_session():
                return {'status': 'error', 'code': 401, 'message': 'Session invalide ou expirée'}

            data = json.loads(request.httprequest.get_data())
            
            # Validation des données requises
            required_fields = ['student_id', 'trimestre_id', 'course_id', 'batch_id']
            for field in required_fields:
                if field not in data:
                    return {'status': 'error', 'code': 400, 'message': f'Champ requis manquant: {field}'}

            bulletin_data = {
                'student_id': data['student_id'],
                'course_id': data['course_id'],
                'batch_id': data['batch_id'],
                'trimestre_id': data['trimestre_id'],
                'appreciation_generale': data.get('appreciation_generale', ''),
                'absence_non_justifiees': data.get('absence_non_justifiees', 0),
                'absence_justifiees': data.get('absence_justifiees', 0),
                'retards': data.get('retards', 0)
            }

            bulletin = request.env['op.bulletin'].sudo().create(bulletin_data)

            # Créer les lignes de notes par matière si fournies
            if 'note_lines' in data and data['note_lines']:
                for line_data in data['note_lines']:
                    note_line_data = {
                        'bulletin_id': bulletin.id,
                        'subject_id': line_data.get('subject_id'),
                        'note_devoir': float(line_data.get('note_devoir', 0)),
                        'note_composition': float(line_data.get('note_composition', 0)),
                        'moyenne_matiere': float(line_data.get('moyenne_matiere', 0)),
                        'coefficient': float(line_data.get('coefficient', 1)),
                        'appreciation': line_data.get('appreciation', '')
                    }
                    
                    # Créer la ligne de note
                    request.env['op.bulletin.line'].sudo().create(note_line_data)

            return {
                'status': 'success',
                'message': 'Bulletin créé avec succès',
                'data': {
                    'id': bulletin.id,
                    'numero': bulletin.numero_bulletin,
                    'student_name': bulletin.student_id.name,
                    'trimestre_name': bulletin.trimestre_id.name
                }
            }

        except Exception as e:
            _logger.error("Erreur création bulletin: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/bulletins/<int:bulletin_id>', auth='none', type='http', csrf=False, methods=['GET', 'PUT', 'DELETE', 'OPTIONS'])
    @cors_wrapper
    def handle_bulletin_by_id(self, bulletin_id, **kwargs):
        """Gérer un bulletin spécifique (GET/PUT/DELETE)"""
        if request.httprequest.method == 'GET':
            return self.get_bulletin_by_id(bulletin_id)
        elif request.httprequest.method == 'PUT':
            return self.update_bulletin_by_id(bulletin_id, **kwargs)
        elif request.httprequest.method == 'DELETE':
            return self.delete_bulletin_by_id(bulletin_id)

    def get_bulletin_by_id(self, bulletin_id):
        """Récupérer un bulletin spécifique avec ses détails"""
        try:
            if not self._check_session():
                return {'status': 'error', 'code': 401, 'message': 'Session invalide ou expirée'}

            bulletin = request.env['op.bulletin'].sudo().browse(bulletin_id)
            if not bulletin.exists():
                return {'status': 'error', 'code': 404, 'message': 'Bulletin non trouvé'}

            # Récupération des notes détaillées
            lines_data = []
            for line in bulletin.note_lines:
                lines_data.append({
                    'id': line.id,
                    'subject_id': line.subject_id.id,
                    'subject_name': line.subject_id.name,
                    'note_controle': float(line.note_controle) if line.note_controle else 0.0,
                    'note_composition': float(line.note_composition) if line.note_composition else 0.0,
                    'note_devoir': float(line.note_devoir) if line.note_devoir else 0.0,
                    'note_oral': float(line.note_oral) if line.note_oral else 0.0,
                    'note_tp': float(line.note_tp) if line.note_tp else 0.0,
                    'moyenne_matiere': float(line.moyenne_matiere) if line.moyenne_matiere else 0.0,
                    'coefficient': float(line.coefficient) if line.coefficient else 1.0,
                    'moyenne_classe_matiere': float(line.moyenne_classe_matiere) if line.moyenne_classe_matiere else 0.0,
                    'rang_matiere': line.rang_matiere,
                    'appreciation': line.appreciation
                })

            bulletin_data = {
                'id': bulletin.id,
                'numero': bulletin.numero_bulletin,
                'student_id': bulletin.student_id.id,
                'student_name': bulletin.student_id.name,
                'trimestre_id': bulletin.trimestre_id.id,
                'trimestre_name': bulletin.trimestre_id.name,
                'batch_id': bulletin.batch_id.id if bulletin.batch_id else None,
                'batch_name': bulletin.batch_id.name if bulletin.batch_id else '',
                'date_creation': bulletin.date_creation.isoformat() if bulletin.date_creation else None,
                'date_edition': bulletin.date_edition.isoformat() if bulletin.date_edition else None,
                'moyenne_generale': float(bulletin.moyenne_generale) if bulletin.moyenne_generale else 0.0,
                'rang_classe': bulletin.rang_classe,
                'total_eleves_classe': bulletin.total_eleves_classe,
                'appreciation_generale': bulletin.appreciation_generale,
                'state': bulletin.state,
                'absence_non_justifiees': bulletin.absence_non_justifiees,
                'absence_justifiees': bulletin.absence_justifiees,
                'retards': bulletin.retards,
                'bulletin_lines': lines_data
            }

            return {
                'status': 'success',
                'data': bulletin_data
            }

        except Exception as e:
            _logger.error("Erreur récupération bulletin %s: %s", bulletin_id, str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    def update_bulletin_by_id(self, bulletin_id, **kwargs):
        """Mettre à jour un bulletin"""
        try:
            if not self._check_session():
                return {'status': 'error', 'code': 401, 'message': 'Session invalide ou expirée'}

            data = json.loads(request.httprequest.get_data())
            
            bulletin = request.env['op.bulletin'].sudo().browse(bulletin_id)
            if not bulletin.exists():
                return {'status': 'error', 'code': 404, 'message': 'Bulletin non trouvé'}

            # Vérifier si c'est une sauvegarde manuelle
            is_manual_save = data.get('manual_save', False)
            preserve_manual_notes = data.get('preserve_manual_notes', False)
            
            _logger.info(f"Update bulletin by ID {bulletin_id}: manual_save={is_manual_save}, preserve_manual_notes={preserve_manual_notes}")

            # Mise à jour des champs autorisés
            update_data = {}
            allowed_fields = ['appreciation_generale', 'absence_non_justifiees', 'absence_justifiees', 'retards']
            
            for field in allowed_fields:
                if field in data:
                    update_data[field] = data[field]
                    
            # Si c'est une sauvegarde manuelle, ajouter les champs supplémentaires
            if is_manual_save:
                if 'moyenne_generale' in data:
                    update_data['moyenne_generale'] = data['moyenne_generale']
                _logger.info(f"Bulletin {bulletin_id}: Sauvegarde manuelle détectée")

            if update_data:
                bulletin.write(update_data)
                
            # Mettre à jour les lignes de notes si c'est une sauvegarde manuelle
            if is_manual_save and 'bulletin_lines' in data:
                _logger.info(f"Bulletin {bulletin_id}: Mise à jour des lignes de notes manuelles")
                
                # Supprimer les anciennes lignes
                bulletin.note_lines.unlink()
                
                # Créer les nouvelles lignes
                for line_data in data['bulletin_lines']:
                    if line_data.get('subject_id'):
                        line_vals = {
                            'bulletin_id': bulletin.id,
                            'subject_id': line_data['subject_id'],
                            'note_controle': line_data.get('note_controle', 0),
                            'note_composition': line_data.get('note_composition', 0),
                            'note_devoir': line_data.get('note_devoir', 0),
                            'note_oral': line_data.get('note_oral', 0),
                            'note_tp': line_data.get('note_tp', 0),
                            'moyenne_matiere': line_data.get('moyenne_matiere', 0),
                            'coefficient': line_data.get('coefficient', 1),
                            'appreciation': line_data.get('appreciation', ''),
                        }
                        request.env['op.bulletin.line'].sudo().create(line_vals)
                
                _logger.info(f"Bulletin {bulletin_id}: {len(data['bulletin_lines'])} lignes sauvegardées manuellement")

            # IMPORTANT: Ne pas déclencher de recalcul automatique si c'est une sauvegarde manuelle
            if not is_manual_save:
                # Seulement si ce n'est PAS une sauvegarde manuelle, on peut faire du recalcul automatique
                pass  # Ici on pourrait ajouter la logique de recalcul automatique si nécessaire

            return {
                'status': 'success',
                'message': 'Bulletin mis à jour avec succès' + (' (sauvegarde manuelle)' if is_manual_save else ''),
                'data': {
                    'id': bulletin.id,
                    'numero': bulletin.numero_bulletin
                }
            }

        except Exception as e:
            _logger.error(f"Erreur update_bulletin: {str(e)}")
            return {'status': 'error', 'code': 500, 'message': str(e)}

    def delete_bulletin_by_id(self, bulletin_id):
        """Supprimer un bulletin"""
        try:
            if not self._check_session():
                return {'status': 'error', 'code': 401, 'message': 'Session invalide ou expirée'}

            bulletin = request.env['op.bulletin'].sudo().browse(bulletin_id)
            if not bulletin.exists():
                return {'status': 'error', 'code': 404, 'message': 'Bulletin non trouvé'}

            if bulletin.state in ('valide', 'publie', 'archive'):
                return {'status': 'error', 'code': 400, 'message': 'Impossible de supprimer un bulletin validé'}

            bulletin.unlink()

            return {
                'status': 'success',
                'message': 'Bulletin supprimé avec succès'
            }

        except Exception as e:
            _logger.error("Erreur suppression bulletin %s: %s", bulletin_id, str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    # ================= ACTIONS SPÉCIALES =================
    
    @http.route('/api/bulletins/<int:bulletin_id>/calculate', auth='public', type='http', csrf=False, methods=['POST', 'OPTIONS'])
    @cors_wrapper
    def calculate_bulletin(self, bulletin_id, **kwargs):
        """Calculer automatiquement les notes d'un bulletin"""
        try:
            bulletin = request.env['op.bulletin'].sudo().browse(bulletin_id)
            if not bulletin.exists():
                return {'status': 'error', 'code': 404, 'message': 'Bulletin non trouvé'}

            # Appel de la méthode de calcul automatique avec sudo()
            bulletin.action_calculate()

            return {
                'status': 'success',
                'code': 200,
                'message': 'Bulletin calculé avec succès',
                'data': {
                    'id': bulletin.id,
                    'state': bulletin.state,
                    'moyenne_generale': bulletin.moyenne_generale,
                    'rang_classe': bulletin.rang_classe
                }
            }
        except Exception as e:
            _logger.error(f"Erreur lors du calcul du bulletin {bulletin_id}: {str(e)}")
            return {'status': 'error', 'code': 500, 'message': f'Erreur lors du calcul: {str(e)}'}

    @http.route('/api/bulletins/<int:bulletin_id>/validate', auth='public', type='http', csrf=False, methods=['POST', 'OPTIONS'])
    @cors_wrapper
    def validate_bulletin(self, bulletin_id, **kwargs):
        """Valider un bulletin"""
        try:
            bulletin = request.env['op.bulletin'].sudo().browse(bulletin_id)
            if not bulletin.exists():
                return {'status': 'error', 'code': 404, 'message': 'Bulletin non trouvé'}

            # Appel de la méthode de validation avec sudo()
            bulletin.action_validate()

            return {
                'status': 'success',
                'code': 200,
                'message': 'Bulletin validé avec succès',
                'data': {
                    'id': bulletin.id,
                    'state': bulletin.state,
                    'date_edition': bulletin.date_edition.strftime('%Y-%m-%d') if bulletin.date_edition else None
                }
            }
        except Exception as e:
            _logger.error(f"Erreur lors de la validation du bulletin {bulletin_id}: {str(e)}")
            return {'status': 'error', 'code': 500, 'message': f'Erreur lors de la validation: {str(e)}'}

    @http.route('/api/bulletins/<int:bulletin_id>/publish', auth='public', type='http', csrf=False, methods=['POST', 'OPTIONS'])
    @cors_wrapper
    def publish_bulletin(self, bulletin_id, **kwargs):
        """Publier un bulletin"""
        try:
            bulletin = request.env['op.bulletin'].sudo().browse(bulletin_id)
            if not bulletin.exists():
                return {'status': 'error', 'code': 404, 'message': 'Bulletin non trouvé'}

            # Appel de la méthode de publication avec sudo()
            bulletin.action_publish()

            return {
                'status': 'success',
                'code': 200,
                'message': 'Bulletin publié avec succès',
                'data': {
                    'id': bulletin.id,
                    'state': bulletin.state
                }
            }
        except Exception as e:
            _logger.error(f"Erreur lors de la publication du bulletin {bulletin_id}: {str(e)}")
            return {'status': 'error', 'code': 500, 'message': f'Erreur lors de la publication: {str(e)}'}

    @http.route('/api/bulletins/<int:bulletin_id>/archive', auth='public', type='http', csrf=False, methods=['POST', 'OPTIONS'])
    @cors_wrapper
    def archive_bulletin(self, bulletin_id, **kwargs):
        """Archiver un bulletin"""
        try:
            bulletin = request.env['op.bulletin'].sudo().browse(bulletin_id)
            if not bulletin.exists():
                return {'status': 'error', 'code': 404, 'message': 'Bulletin non trouvé'}

            # Appel de la méthode d'archivage avec sudo()
            bulletin.action_archive()

            return {
                'status': 'success',
                'code': 200,
                'message': 'Bulletin archivé avec succès',
                'data': {
                    'id': bulletin.id,
                    'state': bulletin.state
                }
            }
        except Exception as e:
            _logger.error(f"Erreur lors de l'archivage du bulletin {bulletin_id}: {str(e)}")
            return {'status': 'error', 'code': 500, 'message': f'Erreur lors de l\'archivage: {str(e)}'}

    @http.route('/api/bulletins/<int:bulletin_id>/delete', auth='public', type='http', csrf=False, methods=['DELETE', 'OPTIONS'])
    @cors_wrapper
    def delete_bulletin(self, bulletin_id, **kwargs):
        """Supprimer un bulletin"""
        try:
            bulletin = request.env['op.bulletin'].sudo().browse(bulletin_id)
            if not bulletin.exists():
                return {'status': 'error', 'code': 404, 'message': 'Bulletin non trouvé'}

            # Vérifier que le bulletin peut être supprimé (seulement en brouillon)
            if bulletin.state != 'draft':
                return {'status': 'error', 'code': 400, 'message': 'Seuls les bulletins en brouillon peuvent être supprimés'}

            bulletin.unlink()

            return {
                'status': 'success',
                'code': 200,
                'message': 'Bulletin supprimé avec succès'
            }
        except Exception as e:
            _logger.error(f"Erreur lors de la suppression du bulletin {bulletin_id}: {str(e)}")
            return {'status': 'error', 'code': 500, 'message': f'Erreur lors de la suppression: {str(e)}'}

    @http.route('/api/bulletins/generate-batch', auth='public', type='http', csrf=False, methods=['POST', 'OPTIONS'])
    @cors_wrapper
    def generate_bulletins_batch(self, **kwargs):
        """Générer des bulletins en lot pour une classe et un trimestre"""
        try:
            data = json.loads(request.httprequest.get_data())
            
            batch_id = data.get('batch_id')
            trimestre_id = data.get('trimestre_id')
            regenerate_existing = data.get('regenerate_existing', False)
            auto_calculate = data.get('auto_calculate', True)
            auto_validate = data.get('auto_validate', False)
            
            if not batch_id or not trimestre_id:
                return {'status': 'error', 'code': 400, 'message': 'batch_id et trimestre_id requis'}

            batch = request.env['op.batch'].sudo().browse(batch_id)
            trimestre = request.env['op.trimestre'].sudo().browse(trimestre_id)
            
            if not batch.exists() or not trimestre.exists():
                return {'status': 'error', 'code': 404, 'message': 'Classe ou trimestre non trouvé'}

            # Récupérer tous les étudiants de la classe
            student_courses = request.env['op.student.course'].sudo().search([
                ('batch_id', '=', batch_id),
                ('state', '=', 'running')
            ])
            
            if not student_courses:
                return {'status': 'error', 'code': 404, 'message': 'Aucun étudiant trouvé dans cette classe'}

            created_bulletins = []
            updated_bulletins = []
            error_count = 0
            
            _logger.info(f"Début génération bulletins pour classe {batch.name}, trimestre {trimestre.name}")
            _logger.info(f"Options: regenerate={regenerate_existing}, auto_calculate={auto_calculate}, auto_validate={auto_validate}")
            
            # Traiter chaque étudiant
            for student_course in student_courses:
                try:
                    student = student_course.student_id
                    
                    # Vérifier si un bulletin existe déjà
                    existing = request.env['op.bulletin'].sudo().search([
                        ('student_id', '=', student.id),
                        ('trimestre_id', '=', trimestre_id),
                        ('batch_id', '=', batch_id)
                    ])
                    
                    if existing:
                        if regenerate_existing:
                            # Supprimer l'ancien bulletin et en créer un nouveau
                            existing.unlink()
                            _logger.info(f"Bulletin existant supprimé pour {student.name}")
                            
                            # Créer le nouveau bulletin
                            bulletin = request.env['op.bulletin'].sudo().create({
                                'student_id': student.id,
                                'trimestre_id': trimestre_id,
                                'batch_id': batch_id,
                                'course_id': student_course.course_id.id
                            })
                            
                            updated_bulletins.append({
                                'id': bulletin.id,
                                'numero': bulletin.numero_bulletin,
                                'student_name': bulletin.student_id.name,
                                'state': bulletin.state
                            })
                            
                            _logger.info(f"Bulletin régénéré pour {student.name}: {bulletin.numero_bulletin}")
                        else:
                            # Ignorer cet étudiant car il a déjà un bulletin
                            _logger.info(f"Bulletin déjà existant pour {student.name} - ignoré")
                            continue
                    else:
                        # Créer un nouveau bulletin
                        bulletin = request.env['op.bulletin'].sudo().create({
                            'student_id': student.id,
                            'trimestre_id': trimestre_id,
                            'batch_id': batch_id,
                            'course_id': student_course.course_id.id
                        })
                        
                        created_bulletins.append({
                            'id': bulletin.id,
                            'numero': bulletin.numero_bulletin,
                            'student_name': bulletin.student_id.name,
                            'state': bulletin.state
                        })
                        
                        _logger.info(f"Bulletin créé pour {student.name}: {bulletin.numero_bulletin}")
                    
                    # Calculer automatiquement si demandé
                    if auto_calculate:
                        bulletin.action_calculate()
                        _logger.info(f"Bulletin calculé pour {student.name}")
                        
                        # Valider automatiquement si demandé
                        if auto_validate and bulletin.state == 'calculated':
                            bulletin.action_validate()
                            _logger.info(f"Bulletin validé pour {student.name}")
                            
                except Exception as e:
                    error_count += 1
                    _logger.error(f"Erreur pour {student.name}: {str(e)}")
                    continue

            # Préparer la réponse
            total_processed = len(created_bulletins) + len(updated_bulletins)
            all_bulletins = created_bulletins + updated_bulletins
            
            message = f"Génération terminée: {len(created_bulletins)} créés, {len(updated_bulletins)} mis à jour"
            if error_count > 0:
                message += f", {error_count} erreurs"

            return {
                'status': 'success',
                'code': 200,
                'message': message,
                'data': {
                    'created_count': len(created_bulletins),
                    'updated_count': len(updated_bulletins),
                    'error_count': error_count,
                    'total_processed': total_processed,
                    'bulletins': all_bulletins
                }
            }

        except Exception as e:
            _logger.error(f"Erreur génération bulletins en lot: {str(e)}")
            return {'status': 'error', 'code': 500, 'message': f'Erreur lors de la génération: {str(e)}'}

    @http.route('/api/batches/<int:batch_id>/students', auth='public', type='http', csrf=False, methods=['GET', 'OPTIONS'])
    @cors_wrapper
    def get_batch_students(self, batch_id, **kwargs):
        """Récupérer les étudiants d'une classe"""
        try:
            # Vérifier que la classe existe
            batch = request.env['op.batch'].sudo().browse(batch_id)
            if not batch.exists():
                return {'status': 'error', 'code': 404, 'message': 'Classe non trouvée'}

            # Récupérer les étudiants via op.student.course
            student_courses = request.env['op.student.course'].sudo().search([
                ('batch_id', '=', batch_id),
                ('state', '=', 'running')
            ])
            
            students_data = []
            for student_course in student_courses:
                student = student_course.student_id
                students_data.append({
                    'id': student.id,
                    'name': student.name,
                    'email': student.email or '',
                    'phone': student.phone or '',
                    'course_id': student_course.course_id.id,
                    'course_name': student_course.course_id.name
                })

            return {
                'status': 'success',
                'code': 200,
                'data': students_data,
                'count': len(students_data)
            }

        except Exception as e:
            _logger.error(f"Erreur récupération étudiants classe {batch_id}: {str(e)}")
            return {'status': 'error', 'code': 500, 'message': f'Erreur: {str(e)}'}

    # ================= ENDPOINTS STATISTIQUES =================
    
    @http.route('/api/bulletins/stats', auth='none', type='http', csrf=False, methods=['GET', 'OPTIONS'])
    @cors_wrapper
    def get_bulletin_stats(self, **kwargs):
        """Récupérer les statistiques des bulletins"""
        try:
            if not self._check_session():
                return {'status': 'error', 'code': 401, 'message': 'Session invalide ou expirée'}

            # Paramètres de filtrage optionnels
            trimestre_id = kwargs.get('trimestre_id')
            batch_id = kwargs.get('batch_id')
            state = kwargs.get('state')

            domain = []
            if trimestre_id:
                domain.append(('trimestre_id', '=', int(trimestre_id)))
            if batch_id:
                domain.append(('batch_id', '=', int(batch_id)))
            if state:
                domain.append(('state', '=', state))

            bulletins = request.env['op.bulletin'].sudo().search(domain)
            
            # Calcul des statistiques
            total_bulletins = len(bulletins)
            bulletins_by_state = {}
            total_moyenne = 0
            bulletins_with_moyenne = 0
            
            # Statistiques par état et moyennes
            for bulletin in bulletins:
                state = bulletin.state or 'brouillon'
                bulletins_by_state[state] = bulletins_by_state.get(state, 0) + 1
                
                if bulletin.moyenne_generale and bulletin.moyenne_generale > 0:
                    total_moyenne += bulletin.moyenne_generale
                    bulletins_with_moyenne += 1
            
            # Moyenne générale
            average_generale = total_moyenne / bulletins_with_moyenne if bulletins_with_moyenne > 0 else 0
            
            # Top étudiants (moyenne >= 16)
            top_students = []
            bulletins_with_good_moyenne = bulletins.filtered(lambda b: b.moyenne_generale >= 16)
            sorted_top = sorted(bulletins_with_good_moyenne, key=lambda b: b.moyenne_generale, reverse=True)[:5]
            for bulletin in sorted_top:
                top_students.append({
                    'name': bulletin.student_id.name,
                    'moyenne': float(bulletin.moyenne_generale),
                    'batch': bulletin.batch_id.name if bulletin.batch_id else 'Non définie',
                    'trimestre': bulletin.trimestre_id.name
                })
            
            # Étudiants en difficulté (moyenne < 10)
            low_performers = []
            bulletins_with_low_moyenne = bulletins.filtered(lambda b: b.moyenne_generale and b.moyenne_generale < 10)
            sorted_low = sorted(bulletins_with_low_moyenne, key=lambda b: b.moyenne_generale)[:5]
            for bulletin in sorted_low:
                low_performers.append({
                    'name': bulletin.student_id.name,
                    'moyenne': float(bulletin.moyenne_generale),
                    'batch': bulletin.batch_id.name if bulletin.batch_id else 'Non définie',
                    'trimestre': bulletin.trimestre_id.name
                })
            
            # Moyennes par matière (basées sur les lignes de bulletin)
            subject_averages = []
            bulletin_lines = request.env['op.bulletin.line'].sudo().search([
                ('bulletin_id', 'in', bulletins.ids)
            ])
            
            subjects_data = {}
            for line in bulletin_lines:
                subject_name = line.subject_id.name if line.subject_id else 'Matière inconnue'
                if subject_name not in subjects_data:
                    subjects_data[subject_name] = {
                        'total': 0,
                        'count': 0,
                        'notes': []
                    }
                
                if line.moyenne_matiere and line.moyenne_matiere > 0:
                    subjects_data[subject_name]['total'] += line.moyenne_matiere
                    subjects_data[subject_name]['count'] += 1
                    subjects_data[subject_name]['notes'].append(line.moyenne_matiere)
            
            for subject_name, data in subjects_data.items():
                if data['count'] > 0:
                    moyenne = data['total'] / data['count']
                    subject_averages.append({
                        'subject': subject_name,
                        'moyenne': round(moyenne, 2),
                        'count': data['count'],
                        'min_note': min(data['notes']) if data['notes'] else 0,
                        'max_note': max(data['notes']) if data['notes'] else 0
                    })
            
            # Statistiques supplémentaires
            published_count = bulletins_by_state.get('publie', 0) + bulletins_by_state.get('published', 0)
            pending_count = (bulletins_by_state.get('brouillon', 0) + 
                           bulletins_by_state.get('draft', 0) +
                           bulletins_by_state.get('calcule', 0) + 
                           bulletins_by_state.get('calculated', 0))

            stats_data = {
                'total_bulletins': total_bulletins,
                'bulletins_by_state': bulletins_by_state,
                'average_generale': round(average_generale, 2),
                'published': published_count,
                'pending': pending_count,
                'avg_general': round(average_generale, 2),  # Alias pour compatibilité
                'top_students': top_students,
                'low_performers': low_performers,
                'subject_averages': subject_averages,
                'bulletins_with_moyenne': bulletins_with_moyenne
            }

            return {
                'status': 'success',
                'data': stats_data
            }

        except Exception as e:
            _logger.error("Erreur récupération statistiques bulletins: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/bulletins/subject-averages', auth='none', type='http', csrf=False, methods=['GET', 'OPTIONS'])
    @cors_wrapper
    def get_bulletin_subject_averages(self, **kwargs):
        """Récupérer les moyennes par matière depuis les bulletins"""
        try:
            if not self._check_session():
                return {'status': 'error', 'code': 401, 'message': 'Session invalide ou expirée'}

            # Paramètres de filtrage optionnels
            trimestre_id = kwargs.get('trimestre_id')
            batch_id = kwargs.get('batch_id')

            domain = []
            if trimestre_id:
                domain.append(('bulletin_id.trimestre_id', '=', int(trimestre_id)))
            if batch_id:
                domain.append(('bulletin_id.batch_id', '=', int(batch_id)))

            bulletin_lines = request.env['op.bulletin.line'].sudo().search(domain)
            
            # Calculer les moyennes par matière
            subjects_data = {}
            for line in bulletin_lines:
                subject_name = line.subject_id.name if line.subject_id else 'Matière inconnue'
                if subject_name not in subjects_data:
                    subjects_data[subject_name] = {
                        'total': 0,
                        'count': 0,
                        'notes': []
                    }
                
                if line.moyenne_matiere and line.moyenne_matiere > 0:
                    subjects_data[subject_name]['total'] += line.moyenne_matiere
                    subjects_data[subject_name]['count'] += 1
                    subjects_data[subject_name]['notes'].append(line.moyenne_matiere)
            
            subject_averages = []
            for subject_name, data in subjects_data.items():
                if data['count'] > 0:
                    moyenne = data['total'] / data['count']
                    subject_averages.append({
                        'subject': subject_name,
                        'moyenne': round(moyenne, 2),
                        'count': data['count'],
                        'min_note': min(data['notes']) if data['notes'] else 0,
                        'max_note': max(data['notes']) if data['notes'] else 0
                    })

            return {
                'status': 'success',
                'data': subject_averages
            }

        except Exception as e:
            _logger.error("Erreur récupération moyennes matières: %s", str(e))
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/subjects', auth='public', type='http', csrf=False, methods=['GET', 'OPTIONS'])
    @cors_wrapper
    def get_subjects(self, **kwargs):
        """Récupérer la liste des matières"""
        try:
            subjects = request.env['op.subject'].sudo().search([])
            
            subjects_data = []
            for subject in subjects:
                subjects_data.append({
                    'id': subject.id,
                    'name': subject.name,
                    'code': subject.code or '',
                    'type': subject.type or '',
                    'department': subject.department_id.name if subject.department_id else '',
                })

            return {
                'status': 'success',
                'code': 200,
                'data': subjects_data
            }

        except Exception as e:
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/students', auth='public', type='http', csrf=False, methods=['GET', 'OPTIONS'])
    @cors_wrapper
    def get_students(self, **kwargs):
        """Récupérer la liste des étudiants"""
        try:
            students = request.env['op.student'].sudo().search([])
            
            students_data = []
            for student in students:
                students_data.append({
                    'id': student.id,
                    'name': student.name,
                    'roll_number': student.roll_number,
                    'email': student.email,
                    'phone': student.phone,
                    'batch_ids': [batch.id for batch in student.course_detail_ids.mapped('batch_id')],
                })

            return {
                'status': 'success',
                'code': 200,
                'data': students_data
            }

        except Exception as e:
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/courses', auth='public', type='http', csrf=False, methods=['GET', 'OPTIONS'])
    @cors_wrapper
    def get_courses(self, **kwargs):
        """Récupérer la liste des cours"""
        try:
            # Paramètre optionnel pour filtrer par état
            state_filter = kwargs.get('state')
            include_draft = kwargs.get('include_draft', 'true').lower() == 'true'
            
            # Construire le domaine de recherche
            domain = []
            if state_filter:
                domain.append(('state', '=', state_filter))
            elif not include_draft:
                # Par défaut, exclure les brouillons sauf si explicitement demandé
                domain.append(('state', '!=', 'draft'))
            
            courses = request.env['op.course'].sudo().search(domain)
            
            courses_data = []
            for course in courses:
                courses_data.append({
                    'id': course.id,
                    'name': course.name,
                    'code': course.code or '',
                    'department': course.department_id.name if course.department_id else '',
                    'state': course.state,
                    'education_level': getattr(course, 'education_level', ''),
                    'class_level': getattr(course, 'class_level', ''),
                    'subject_area': getattr(course, 'subject_area', ''),
                    'course_type': getattr(course, 'course_type', ''),
                    'weekly_hours': getattr(course, 'weekly_hours', 0),
                    'coefficient': getattr(course, 'coefficient', 1.0),
                    'main_teacher_id': course.main_teacher_id.id if course.main_teacher_id else None,
                    'main_teacher_name': course.main_teacher_id.name if course.main_teacher_id else '',
                    'active': True if course.state in ['confirmed', 'ongoing'] else False,
                })

            return {
                'status': 'success',
                'code': 200,
                'data': courses_data,
                'count': len(courses_data)
            }

        except Exception as e:
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/courses/<int:course_id>/state', auth='public', type='http', csrf=False, methods=['PUT', 'OPTIONS'])
    @cors_wrapper
    def update_course_state(self, course_id, **kwargs):
        """Mettre à jour l'état d'un cours"""
        try:
            data = json.loads(request.httprequest.get_data())
            new_state = data.get('state')
            
            if not new_state:
                return {'status': 'error', 'code': 400, 'message': 'Paramètre state requis'}
            
            valid_states = ['draft', 'confirmed', 'ongoing', 'done', 'cancelled']
            if new_state not in valid_states:
                return {'status': 'error', 'code': 400, 'message': f'État invalide. États valides: {valid_states}'}
            
            course = request.env['op.course'].sudo().browse(course_id)
            if not course.exists():
                return {'status': 'error', 'code': 404, 'message': 'Cours non trouvé'}
            
            # Mettre à jour l'état
            course.write({'state': new_state})
            
            return {
                'status': 'success',
                'code': 200,
                'message': f'État du cours mis à jour vers {new_state}',
                'data': {
                    'id': course.id,
                    'name': course.name,
                    'state': course.state,
                    'active': course.state in ['confirmed', 'ongoing']
                }
            }
            
        except Exception as e:
            _logger.error(f"Erreur mise à jour état cours {course_id}: {str(e)}")
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/courses/<int:course_id>/activate', auth='public', type='http', csrf=False, methods=['POST', 'OPTIONS'])
    @cors_wrapper
    def activate_course(self, course_id, **kwargs):
        """Activer un cours (passer de draft à confirmed)"""
        try:
            course = request.env['op.course'].sudo().browse(course_id)
            if not course.exists():
                return {'status': 'error', 'code': 404, 'message': 'Cours non trouvé'}
            
            if course.state != 'draft':
                return {'status': 'error', 'code': 400, 'message': f'Seuls les cours en brouillon peuvent être activés. État actuel: {course.state}'}
            
            # Activer le cours
            course.write({'state': 'confirmed'})
            
            return {
                'status': 'success',
                'code': 200,
                'message': 'Cours activé avec succès',
                'data': {
                    'id': course.id,
                    'name': course.name,
                    'state': course.state,
                    'active': True
                }
            }
            
        except Exception as e:
            _logger.error(f"Erreur activation cours {course_id}: {str(e)}")
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/courses/batch-activate', auth='public', type='http', csrf=False, methods=['POST', 'OPTIONS'])
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

    @http.route('/api/batches', auth='public', type='http', csrf=False, methods=['GET', 'OPTIONS'])
    @cors_wrapper
    def get_batches(self, **kwargs):
        """Récupérer la liste des classes/promotions"""
        try:
            batches = request.env['op.batch'].sudo().search([])
            
            batches_data = []
            for batch in batches:
                batches_data.append({
                    'id': batch.id,
                    'name': batch.name,
                    'code': batch.code or '',
                    'course_id': batch.course_id.id if batch.course_id else None,
                    'course_name': batch.course_id.name if batch.course_id else '',
                    'start_date': batch.start_date.strftime('%Y-%m-%d') if batch.start_date else None,
                    'end_date': batch.end_date.strftime('%Y-%m-%d') if batch.end_date else None,
                })

            return {
                'status': 'success',
                'code': 200,
                'data': batches_data
            }

        except Exception as e:
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/trimestres', auth='public', type='http', csrf=False, methods=['GET', 'OPTIONS'])
    @cors_wrapper
    def get_trimestres(self, **kwargs):
        """Récupérer la liste des trimestres"""
        try:
            trimestres = request.env['op.trimestre'].sudo().search([])
            
            trimestres_data = []
            for trimestre in trimestres:
                trimestres_data.append({
                    'id': trimestre.id,
                    'name': trimestre.name,
                    'date_debut': trimestre.date_debut.strftime('%Y-%m-%d') if trimestre.date_debut else None,
                    'date_fin': trimestre.date_fin.strftime('%Y-%m-%d') if trimestre.date_fin else None,
                    'annee_scolaire': trimestre.annee_scolaire or '',
                    'active': trimestre.active or False,
                })

            return {
                'status': 'success',
                'code': 200,
                'data': trimestres_data
            }

        except Exception as e:
            return {'status': 'error', 'code': 500, 'message': str(e)}

    @http.route('/api/bulletins/<int:bulletin_id>/pdf', auth='public', type='http', csrf=False, methods=['GET', 'OPTIONS'])
    @cors_wrapper
    def get_bulletin_pdf(self, bulletin_id, **kwargs):
        """Générer et télécharger le PDF d'un bulletin"""
        try:
            # Vérifier que le bulletin existe
            bulletin = request.env['op.bulletin'].sudo().browse(bulletin_id)
            if not bulletin.exists():
                return {'status': 'error', 'code': 404, 'message': 'Bulletin non trouvé'}

            # Vérifier que le bulletin peut être imprimé (publié ou validé)
            if bulletin.state not in ['validated', 'valide', 'published', 'publie']:
                return {'status': 'error', 'code': 400, 'message': 'Le bulletin doit être validé ou publié pour être imprimé'}

            # Nom du fichier
            filename = f"Bulletin_{bulletin.student_id.name}_{bulletin.trimestre_id.name}.pdf"
            filename = filename.replace(' ', '_').replace('/', '_')  # Nettoyer le nom de fichier
            
            try:
                # Essayer d'abord avec le nouveau template
                report = request.env.ref('school_management.report_bulletin_scolaire')
                if report:
                    # Générer le PDF
                    pdf_content, pdf_format = report.sudo()._render_qweb_pdf([bulletin_id])
                    
                    if pdf_content:
                        # Retourner le PDF directement
                        response = request.make_response(
                            pdf_content,
                            headers=[
                                ('Content-Type', 'application/pdf'),
                                ('Content-Length', len(pdf_content)),
                                ('Content-Disposition', f'attachment; filename="{filename}"'),
                                ('Cache-Control', 'no-cache, no-store, must-revalidate'),
                                ('Pragma', 'no-cache'),
                                ('Expires', '0')
                            ]
                        )
                        return response
            except Exception as pdf_error:
                _logger.error(f"Erreur génération PDF bulletin {bulletin_id}: {str(pdf_error)}")
            
            # Fallback: créer un PDF simple avec les données du bulletin
            try:
                from reportlab.lib import colors
                from reportlab.lib.pagesizes import letter, A4
                from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
                from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
                from reportlab.lib.units import inch
                import io
                
                # Créer un buffer pour le PDF
                buffer = io.BytesIO()
                
                # Créer le document PDF
                doc = SimpleDocTemplate(buffer, pagesize=A4)
                elements = []
                styles = getSampleStyleSheet()
                
                # Titre
                title_style = ParagraphStyle(
                    'CustomTitle',
                    parent=styles['Heading1'],
                    fontSize=18,
                    spaceAfter=30,
                    alignment=1,  # Centré
                )
                elements.append(Paragraph("BULLETIN SCOLAIRE", title_style))
                elements.append(Paragraph(f"{bulletin.trimestre_id.name}", styles['Heading2']))
                elements.append(Spacer(1, 20))
                
                # Informations étudiant
                info_data = [
                    ['Élève:', bulletin.student_id.name],
                    ['Classe:', bulletin.batch_id.name],
                    ['N° Bulletin:', bulletin.numero_bulletin or 'N/A'],
                    ['Moyenne Générale:', f"{bulletin.moyenne_generale:.2f}/20"],
                    ['Rang:', f"{bulletin.rang_classe}/{bulletin.total_eleves_classe}"],
                ]
                
                info_table = Table(info_data, colWidths=[2*inch, 3*inch])
                info_table.setStyle(TableStyle([
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 12),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ]))
                elements.append(info_table)
                elements.append(Spacer(1, 20))
                
                # Tableau des notes
                notes_data = [['Matières', 'Coeff.', 'Moyenne', 'Appréciation']]
                
                for line in bulletin.note_lines:
                    notes_data.append([
                        line.subject_id.name,
                        str(line.coefficient),
                        f"{line.moyenne_matiere:.2f}",
                        line.appreciation or ''
                    ])
                
                # Ligne de moyenne générale
                notes_data.append([
                    'MOYENNE GÉNÉRALE',
                    '',
                    f"{bulletin.moyenne_generale:.2f}",
                    ''
                ])
                
                notes_table = Table(notes_data, colWidths=[3*inch, 0.8*inch, 1*inch, 2*inch])
                notes_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                    ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
                    ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ]))
                elements.append(notes_table)
                
                # Appréciation générale
                if bulletin.appreciation_generale:
                    elements.append(Spacer(1, 20))
                    elements.append(Paragraph("Appréciation Générale:", styles['Heading3']))
                    elements.append(Paragraph(bulletin.appreciation_generale, styles['Normal']))
                
                # Générer le PDF
                doc.build(elements)
                
                # Récupérer le contenu du buffer
                pdf_content = buffer.getvalue()
                buffer.close()
                
                # Retourner le PDF
                response = request.make_response(
                    pdf_content,
                    headers=[
                        ('Content-Type', 'application/pdf'),
                        ('Content-Length', len(pdf_content)),
                        ('Content-Disposition', f'attachment; filename="{filename}"'),
                        ('Cache-Control', 'no-cache, no-store, must-revalidate'),
                        ('Pragma', 'no-cache'),
                        ('Expires', '0')
                    ]
                )
                return response
                
            except ImportError:
                # Si reportlab n'est pas disponible, fallback vers URL
                _logger.warning("reportlab non disponible, utilisation du fallback URL")
                pdf_url = f"/web/report/pdf/school_management.report_bulletin_scolaire/{bulletin_id}"
                return {
                    'status': 'success',
                    'data': {
                        'download_url': pdf_url,
                        'filename': filename
                    },
                    'message': 'URL de téléchargement PDF générée (reportlab non disponible)'
                }
            except Exception as fallback_error:
                _logger.error(f"Erreur génération PDF fallback bulletin {bulletin_id}: {str(fallback_error)}")
                # Dernier fallback: retourner une URL simple
                pdf_url = f"/web/report/pdf/school_management.report_bulletin_scolaire/{bulletin_id}"
                return {
                    'status': 'success',
                    'data': {
                        'download_url': pdf_url,
                        'filename': filename
                    },
                    'message': 'URL de téléchargement PDF générée (fallback)'
                }

        except Exception as e:
            _logger.error(f"Erreur endpoint PDF bulletin {bulletin_id}: {str(e)}")
            return {'status': 'error', 'code': 500, 'message': f'Erreur lors de la génération du PDF: {str(e)}'} 