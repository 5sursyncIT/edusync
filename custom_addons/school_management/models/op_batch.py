# -*- coding: utf-8 -*-
# Fichier: /opt/odoo/custom_addons/school_management/models/op_batch_extended.py

from odoo import models, fields, api, _
from odoo.exceptions import ValidationError

class OpBatchExtended(models.Model):
    """
    Extension du modèle op.batch pour gérer les promotions/classes
    """
    _inherit = 'op.batch'
    _description = 'Promotion/Classe Scolaire'
    
    # ==================== IDENTIFICATION ====================
    
    # Type de classe
    batch_type = fields.Selection([
        ('regular', 'Classe Régulière'),
        ('special', 'Classe Spécialisée'),
        ('sport_study', 'Sport-Études'),
        ('art_study', 'Art-Études'),
        ('international', 'Section Internationale'),
        ('bilingual', 'Section Bilingue'),
        ('adapted', 'Classe Adaptée (SEGPA/ULIS)')
    ], string='Type de Classe', default='regular')
    
    # Cycle scolaire (synchronisé avec le cours si défini)
    school_cycle = fields.Selection([
        ('maternelle', 'Maternelle'),
        ('primaire', 'Primaire'),
        ('college', 'Collège'),
        ('lycee', 'Lycée')
    ], string='Cycle Scolaire', required=True)
    
    # ==================== ORGANISATION ====================
    
    # Capacité
    total_capacity = fields.Integer('Capacité Totale', default=30,
                                   help='Nombre maximum d\'élèves')
    available_seats = fields.Integer('Places Disponibles',
                                    compute='_compute_available_seats',
                                    store=True)
    
    # Salle de classe principale
    main_classroom_id = fields.Many2one('op.classroom', 
                                       string='Salle de Classe Principale')
    
    # Professeur principal
    class_teacher_id = fields.Many2one('op.faculty',
                                      string='Professeur Principal')
    
    # Professeur adjoint/suppléant
    deputy_teacher_id = fields.Many2one('op.faculty',
                                       string='Professeur Adjoint')
    
    # Délégués de classe
    student_delegate_id = fields.Many2one('op.student',
                                         string='Délégué de Classe')
    deputy_delegate_id = fields.Many2one('op.student',
                                        string='Délégué Adjoint')
    
    # ==================== PLANNING ====================
    
    # Emploi du temps
    timetable_id = fields.Many2one('op.timetable',
                                  string='Emploi du Temps')
    
    # Heures de vie de classe
    class_life_schedule = fields.Text('Planning Vie de Classe',
                                     help='Horaires des heures de vie de classe')
    
    # ==================== ÉTUDIANTS ====================
    
    # Nombre d'étudiants (calculé)
    student_count = fields.Integer('Nombre d\'Élèves',
                                  compute='_compute_student_count',
                                  store=True)
    
    # Répartition par genre
    male_count = fields.Integer('Nombre de Garçons',
                               compute='_compute_gender_distribution',
                               store=True)
    female_count = fields.Integer('Nombre de Filles',
                                 compute='_compute_gender_distribution',
                                 store=True)
    
    # ==================== PERFORMANCES ====================
    
    # Moyenne générale de la classe
    class_average = fields.Float('Moyenne Générale',
                                compute='_compute_class_average',
                                store=True)
    
    # Taux de réussite
    success_rate = fields.Float('Taux de Réussite (%)',
                               compute='_compute_success_rate',
                               store=True)
    
    # Taux d'absentéisme
    absence_rate = fields.Float('Taux d\'Absentéisme (%)',
                               compute='_compute_absence_rate')
    
    # ==================== COMMUNICATION ====================
    
    # Email de la classe
    class_email = fields.Char('Email de Classe',
                             help='Email pour les communications de groupe')
    
    # Groupe WhatsApp/Telegram
    communication_group = fields.Char('Groupe de Communication',
                                     help='Lien vers le groupe WhatsApp/Telegram')
    
    # Notes/Observations
    notes = fields.Text('Notes et Observations')
    
    # ==================== COMPUTED FIELDS ====================
    
    @api.depends('total_capacity', 'student_count')
    def _compute_available_seats(self):
        """Calcule les places disponibles"""
        for batch in self:
            batch.available_seats = batch.total_capacity - batch.student_count
    
    @api.depends('course_id')
    def _compute_student_count(self):
        """Compte le nombre d'étudiants actifs"""
        for batch in self:
            students = self.env['op.student.course'].search([
                ('batch_id', '=', batch.id),
                ('state', '=', 'running')
            ])
            batch.student_count = len(students)
    
    @api.depends('course_id')
    def _compute_gender_distribution(self):
        """Calcule la répartition par genre"""
        for batch in self:
            students = self.env['op.student.course'].search([
                ('batch_id', '=', batch.id),
                ('state', '=', 'running')
            ])
            
            male_count = 0
            female_count = 0
            
            for student_course in students:
                if student_course.student_id.gender == 'm':
                    male_count += 1
                elif student_course.student_id.gender == 'f':
                    female_count += 1
            
            batch.male_count = male_count
            batch.female_count = female_count
    
    @api.depends('course_id')
    def _compute_class_average(self):
        """Calcule la moyenne générale de la classe"""
        for batch in self:
            # TODO: Implémenter le calcul réel basé sur les notes
            batch.class_average = 0.0
    
    @api.depends('course_id')
    def _compute_success_rate(self):
        """Calcule le taux de réussite"""
        for batch in self:
            # TODO: Implémenter le calcul réel
            batch.success_rate = 0.0
    
    @api.depends('course_id')
    def _compute_absence_rate(self):
        """Calcule le taux d'absentéisme"""
        for batch in self:
            # TODO: Implémenter le calcul réel basé sur les présences
            batch.absence_rate = 0.0
    
    # ==================== CONTRAINTES ====================
    
    @api.constrains('total_capacity')
    def _check_capacity(self):
        """Vérifie que la capacité est positive"""
        for batch in self:
            if batch.total_capacity < 0:
                raise ValidationError(
                    _('La capacité doit être positive')
                )
    
    @api.constrains('student_delegate_id', 'deputy_delegate_id')
    def _check_delegates(self):
        """Vérifie que les délégués sont différents"""
        for batch in self:
            if (batch.student_delegate_id and 
                batch.deputy_delegate_id and 
                batch.student_delegate_id == batch.deputy_delegate_id):
                raise ValidationError(
                    _('Le délégué et son adjoint doivent être différents')
                )
    
    # ==================== MÉTHODES ====================
    
    @api.model_create_multi
    def create(self, vals_list):
        """Création avec génération automatique du code"""
        for vals in vals_list:
            if not vals.get('code') and vals.get('name'):
                # Générer un code basé sur le nom et l'année
                year = fields.Date.today().year
                name_parts = vals['name'].upper().split()
                code_parts = [part[:3] for part in name_parts[:2]]
                vals['code'] = f"{''.join(code_parts)}_{year}"
        
        return super().create(vals_list)
    
    @api.onchange('course_id')
    def _onchange_course_id(self):
        """Synchronise le cycle scolaire avec le cours"""
        if self.course_id and hasattr(self.course_id, 'education_level'):
            # Mapping education_level vers school_cycle
            level_to_cycle = {
                'prescolaire': 'maternelle',
                'primary': 'primaire',
                'middle': 'college',
                'high': 'lycee'
            }
            
            education_level = self.course_id.education_level
            if education_level in level_to_cycle:
                self.school_cycle = level_to_cycle[education_level]
    
    # ==================== ACTIONS ====================
    
    def action_view_students(self):
        """Voir les élèves de la classe"""
        self.ensure_one()
        
        # Récupérer les étudiants via op.student.course
        student_courses = self.env['op.student.course'].search([
            ('batch_id', '=', self.id),
            ('state', '=', 'running')
        ])
        
        student_ids = student_courses.mapped('student_id').ids
        
        return {
            'name': _('Élèves - %s') % self.name,
            'type': 'ir.actions.act_window',
            'res_model': 'op.student',
            'view_mode': 'tree,form,kanban',
            'domain': [('id', 'in', student_ids)],
            'context': {
                'default_batch_id': self.id,
                'search_default_active': True
            }
        }
    
    def action_view_timetable(self):
        """Voir l'emploi du temps"""
        self.ensure_one()
        
        return {
            'name': _('Emploi du Temps - %s') % self.name,
            'type': 'ir.actions.act_window',
            'res_model': 'op.timetable',
            'view_mode': 'form',
            'res_id': self.timetable_id.id if self.timetable_id else False,
            'context': {
                'default_batch_id': self.id,
                'default_name': f"EDT {self.name}"
            }
        }
    
    def action_class_report(self):
        """Générer le bulletin de la classe"""
        self.ensure_one()
        
        # TODO: Implémenter la génération du rapport
        return {
            'type': 'ir.actions.report',
            'report_name': 'school_management.report_class_bulletin',
            'report_type': 'qweb-pdf',
            'data': None,
            'context': self.env.context,
            'res_ids': [self.id]
        }
    
    def action_send_message(self):
        """Envoyer un message à tous les parents"""
        self.ensure_one()
        
        # Récupérer tous les parents des élèves
        student_courses = self.env['op.student.course'].search([
            ('batch_id', '=', self.id),
            ('state', '=', 'running')
        ])
        
        parent_partners = []
        for sc in student_courses:
            if hasattr(sc.student_id, 'parent_ids'):
                parent_partners.extend(sc.student_id.parent_ids.mapped('partner_id'))
        
        return {
            'name': _('Message aux Parents - %s') % self.name,
            'type': 'ir.actions.act_window',
            'res_model': 'mail.compose.message',
            'view_mode': 'form',
            'target': 'new',
            'context': {
                'default_partner_ids': [(6, 0, [p.id for p in parent_partners])],
                'default_subject': f"[{self.name}] ",
                'default_composition_mode': 'mass_mail'
            }
        }