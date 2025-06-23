# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import ValidationError, UserError

class BulletinWizard(models.TransientModel):
    _name = 'bulletin.wizard'
    _description = 'Assistant de Génération de Bulletins'

    # Paramètres de sélection
    batch_id = fields.Many2one('op.batch', string='Classe', required=True)
    trimestre_id = fields.Many2one('op.trimestre', string='Trimestre', required=True)
    course_id = fields.Many2one('op.course', string='Cours', related='batch_id.course_id', readonly=True)
    
    # Options de génération
    regenerate_existing = fields.Boolean('Régénérer les bulletins existants', default=False)
    auto_calculate = fields.Boolean('Calculer automatiquement', default=True)
    auto_validate = fields.Boolean('Valider automatiquement après calcul', default=False)
    
    # Statistiques
    total_students = fields.Integer('Total Étudiants', compute='_compute_statistics', readonly=True)
    existing_bulletins = fields.Integer('Bulletins Existants', compute='_compute_statistics', readonly=True)
    bulletins_to_create = fields.Integer('Bulletins à Créer', compute='_compute_statistics', readonly=True)
    
    # Résultats après génération
    created_bulletins = fields.Integer('Bulletins Créés', readonly=True)
    updated_bulletins = fields.Integer('Bulletins Mis à Jour', readonly=True)
    error_count = fields.Integer('Erreurs', readonly=True)
    generation_log = fields.Text('Log de Génération', readonly=True)

    @api.depends('batch_id', 'trimestre_id', 'regenerate_existing')
    def _compute_statistics(self):
        for record in self:
            if record.batch_id and record.trimestre_id:
                # Récupérer tous les étudiants de la classe
                student_courses = self.env['op.student.course'].search([
                    ('batch_id', '=', record.batch_id.id),
                    ('state', '=', 'running')
                ])
                record.total_students = len(student_courses)
                
                # Vérifier les bulletins existants
                existing = self.env['op.bulletin'].search([
                    ('batch_id', '=', record.batch_id.id),
                    ('trimestre_id', '=', record.trimestre_id.id)
                ])
                record.existing_bulletins = len(existing)
                
                # Calculer les bulletins à créer
                if record.regenerate_existing:
                    record.bulletins_to_create = record.total_students
                else:
                    existing_student_ids = existing.mapped('student_id.id')
                    remaining_students = student_courses.filtered(lambda sc: sc.student_id.id not in existing_student_ids)
                    record.bulletins_to_create = len(remaining_students)
            else:
                record.total_students = 0
                record.existing_bulletins = 0
                record.bulletins_to_create = 0

    def action_generate_bulletins(self):
        """Générer les bulletins pour la classe et le trimestre sélectionnés"""
        self.ensure_one()
        
        if not self.batch_id or not self.trimestre_id:
            raise UserError(_('Veuillez sélectionner une classe et un trimestre.'))
        
        # Initialiser les compteurs
        created_count = 0
        updated_count = 0
        error_count = 0
        log_messages = []
        
        try:
            # Récupérer tous les étudiants de la classe
            student_courses = self.env['op.student.course'].search([
                ('batch_id', '=', self.batch_id.id),
                ('state', '=', 'running')
            ])
            
            if not student_courses:
                raise UserError(_('Aucun étudiant trouvé dans cette classe.'))
            
            log_messages.append(_('Début de génération pour %d étudiants') % len(student_courses))
            
            for student_course in student_courses:
                try:
                    # Vérifier si un bulletin existe déjà
                    existing_bulletin = self.env['op.bulletin'].search([
                        ('student_id', '=', student_course.student_id.id),
                        ('batch_id', '=', self.batch_id.id),
                        ('trimestre_id', '=', self.trimestre_id.id)
                    ], limit=1)
                    
                    if existing_bulletin:
                        if self.regenerate_existing:
                            # Supprimer l'ancien bulletin et en créer un nouveau
                            bulletin_number = existing_bulletin.numero_bulletin
                            existing_bulletin.unlink()
                            log_messages.append(_('Bulletin existant supprimé pour %s') % student_course.student_id.name)
                            
                            # Créer le nouveau bulletin
                            bulletin = self._create_bulletin(student_course)
                            updated_count += 1
                            log_messages.append(_('Bulletin régénéré pour %s: %s') % (student_course.student_id.name, bulletin.numero_bulletin))
                        else:
                            log_messages.append(_('Bulletin déjà existant pour %s - ignoré') % student_course.student_id.name)
                            continue
                    else:
                        # Créer un nouveau bulletin
                        bulletin = self._create_bulletin(student_course)
                        created_count += 1
                        log_messages.append(_('Bulletin créé pour %s: %s') % (student_course.student_id.name, bulletin.numero_bulletin))
                    
                    # Calculer automatiquement si demandé
                    if self.auto_calculate:
                        bulletin.action_calculate()
                        log_messages.append(_('Bulletin calculé pour %s') % student_course.student_id.name)
                        
                        # Valider automatiquement si demandé
                        if self.auto_validate and bulletin.state == 'calculated':
                            bulletin.action_validate()
                            log_messages.append(_('Bulletin validé pour %s') % student_course.student_id.name)
                            
                except Exception as e:
                    error_count += 1
                    log_messages.append(_('Erreur pour %s: %s') % (student_course.student_id.name, str(e)))
                    continue
            
            # Mettre à jour les statistiques
            self.created_bulletins = created_count
            self.updated_bulletins = updated_count
            self.error_count = error_count
            self.generation_log = '\n'.join(log_messages)
            
            # Message de succès
            success_message = _('Génération terminée:\n- %d bulletins créés\n- %d bulletins mis à jour\n- %d erreurs') % (
                created_count, updated_count, error_count
            )
            
            if error_count == 0:
                return {
                    'type': 'ir.actions.client',
                    'tag': 'display_notification',
                    'params': {
                        'title': _('Génération Réussie'),
                        'message': success_message,
                        'type': 'success',
                        'sticky': False,
                    }
                }
            else:
                return {
                    'type': 'ir.actions.client',
                    'tag': 'display_notification',
                    'params': {
                        'title': _('Génération Terminée avec Erreurs'),
                        'message': success_message,
                        'type': 'warning',
                        'sticky': True,
                    }
                }
                
        except Exception as e:
            self.generation_log = _('Erreur lors de la génération: %s') % str(e)
            raise UserError(_('Erreur lors de la génération des bulletins: %s') % str(e))

    def _create_bulletin(self, student_course):
        """Créer un bulletin pour un étudiant donné"""
        bulletin_vals = {
            'student_id': student_course.student_id.id,
            'course_id': student_course.course_id.id,
            'batch_id': self.batch_id.id,
            'trimestre_id': self.trimestre_id.id,
        }
        return self.env['op.bulletin'].create(bulletin_vals)

    def action_view_generated_bulletins(self):
        """Voir les bulletins générés"""
        self.ensure_one()
        
        domain = [
            ('batch_id', '=', self.batch_id.id),
            ('trimestre_id', '=', self.trimestre_id.id)
        ]
        
        return {
            'name': _('Bulletins Générés'),
            'type': 'ir.actions.act_window',
            'res_model': 'op.bulletin',
            'view_mode': 'tree,form',
            'domain': domain,
            'context': {'default_batch_id': self.batch_id.id, 'default_trimestre_id': self.trimestre_id.id}
        }

class BulletinCalculationWizard(models.TransientModel):
    _name = 'bulletin.calculation.wizard'
    _description = 'Assistant de Calcul de Bulletins'

    bulletin_ids = fields.Many2many('op.bulletin', string='Bulletins à Calculer')
    recalculate_existing = fields.Boolean('Recalculer les notes existantes', default=True)
    auto_validate = fields.Boolean('Valider après calcul', default=False)
    
    # Résultats
    calculated_count = fields.Integer('Bulletins Calculés', readonly=True)
    validated_count = fields.Integer('Bulletins Validés', readonly=True)
    error_count = fields.Integer('Erreurs', readonly=True)
    calculation_log = fields.Text('Log de Calcul', readonly=True)

    @api.model
    def default_get(self, fields):
        res = super(BulletinCalculationWizard, self).default_get(fields)
        
        # Récupérer les bulletins sélectionnés depuis le contexte
        active_ids = self.env.context.get('active_ids', [])
        if active_ids:
            res['bulletin_ids'] = [(6, 0, active_ids)]
        
        return res

    def action_calculate_bulletins(self):
        """Calculer les bulletins sélectionnés"""
        self.ensure_one()
        
        if not self.bulletin_ids:
            raise UserError(_('Aucun bulletin sélectionné.'))
        
        calculated_count = 0
        validated_count = 0
        error_count = 0
        log_messages = []
        
        for bulletin in self.bulletin_ids:
            try:
                # Calculer le bulletin
                if bulletin.state == 'draft' or self.recalculate_existing:
                    bulletin.action_calculate()
                    calculated_count += 1
                    log_messages.append(_('Bulletin calculé: %s (%s)') % (bulletin.numero_bulletin, bulletin.student_id.name))
                    
                    # Valider si demandé
                    if self.auto_validate and bulletin.state == 'calculated':
                        bulletin.action_validate()
                        validated_count += 1
                        log_messages.append(_('Bulletin validé: %s') % bulletin.numero_bulletin)
                else:
                    log_messages.append(_('Bulletin %s déjà calculé - ignoré') % bulletin.numero_bulletin)
                    
            except Exception as e:
                error_count += 1
                log_messages.append(_('Erreur pour bulletin %s: %s') % (bulletin.numero_bulletin, str(e)))
                continue
        
        # Mettre à jour les résultats
        self.calculated_count = calculated_count
        self.validated_count = validated_count
        self.error_count = error_count
        self.calculation_log = '\n'.join(log_messages)
        
        # Message de retour
        message = _('Calcul terminé:\n- %d bulletins calculés\n- %d bulletins validés\n- %d erreurs') % (
            calculated_count, validated_count, error_count
        )
        
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': _('Calcul Terminé'),
                'message': message,
                'type': 'success' if error_count == 0 else 'warning',
                'sticky': error_count > 0,
            }
        } 