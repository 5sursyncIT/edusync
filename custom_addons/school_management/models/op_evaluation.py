# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import ValidationError

class OpEvaluationType(models.Model):
    _name = 'op.evaluation.type'
    _description = 'Type d\'évaluation'

    name = fields.Char('Nom', required=True)
    code = fields.Char('Code', required=True)
    education_level = fields.Selection([
        ('maternelle', 'Maternelle'),
        ('primaire', 'Primaire'),
        ('college', 'Collège'),
        ('lycee', 'Lycée')
    ], string='Niveau d\'Éducation', required=True)
    type_evaluation = fields.Selection([
        ('composition', 'Composition'),
        ('devoir', 'Devoir'),
        ('controle', 'Contrôle'),
        ('examen', 'Examen'),
        ('oral', 'Interrogation Orale'),
        ('tp', 'Travaux Pratiques'),
        ('projet', 'Projet')
    ], string='Type d\'Évaluation', required=True)
    coefficient = fields.Float('Coefficient', default=1.0)
    active = fields.Boolean('Actif', default=True)

    @api.constrains('type_evaluation', 'education_level')
    def _check_evaluation_type(self):
        for record in self:
            if record.education_level == 'primaire' and record.type_evaluation not in ['composition', 'controle']:
                raise ValidationError(_('Pour le niveau primaire, seules les compositions et contrôles sont autorisés.'))

class OpEvaluationLine(models.Model):
    _name = 'op.evaluation.line'
    _description = 'Ligne d\'évaluation'
    _rec_name = 'student_id'

    evaluation_id = fields.Many2one('op.evaluation', string='Évaluation', required=True, ondelete='cascade')
    student_id = fields.Many2one('op.student', string='Étudiant', required=True)
    note = fields.Float('Note', required=True)
    appreciation = fields.Text('Appréciation')
    
    @api.constrains('note')
    def _check_note(self):
        for record in self:
            if record.note < 0 or record.note > record.evaluation_id.max_marks:
                raise ValidationError(_('La note doit être comprise entre 0 et la note maximale.'))

class OpEvaluation(models.Model):
    _name = 'op.evaluation'
    _description = 'Évaluation'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    name = fields.Char('Nom', required=True, tracking=True)
    evaluation_type_id = fields.Many2one('op.evaluation.type', string='Type d\'évaluation', required=True, tracking=True)
    date = fields.Date('Date', required=True, tracking=True)
    start_time = fields.Float('Heure de début', help="Heure de début de l'examen (format 24h en heures décimales)")
    end_time = fields.Float('Heure de fin', help="Heure de fin de l'examen (format 24h en heures décimales)")
    description = fields.Text('Description', help="Description ou informations complémentaires sur l'examen")
    subject_id = fields.Many2one('op.subject', string='Matière', required=True, tracking=True)
    course_id = fields.Many2one('op.course', string='Cours', required=True, tracking=True)
    batch_id = fields.Many2one('op.batch', string='Classe', required=True, tracking=True)
    faculty_id = fields.Many2one('op.faculty', string='Enseignant', required=True, tracking=True)
    max_marks = fields.Float('Note maximale', default=20.0, required=True)
    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('ongoing', 'En cours'),
        ('done', 'Terminé'),
        ('cancelled', 'Annulé')
    ], string='État', default='draft', tracking=True)
    evaluation_line_ids = fields.One2many('op.evaluation.line', 'evaluation_id', string='Notes')

    @api.onchange('course_id')
    def _onchange_course_id(self):
        if self.course_id:
            education_level = self.course_id.education_level
            return {'domain': {'evaluation_type_id': [('education_level', '=', education_level)]}}

    @api.constrains('start_time', 'end_time')
    def _check_times(self):
        """Vérifier que l'heure de fin est après l'heure de début"""
        for record in self:
            if record.start_time and record.end_time and record.start_time >= record.end_time:
                raise ValidationError(_("L'heure de fin doit être postérieure à l'heure de début."))

    def action_start(self):
        self.ensure_one()
        # Créer automatiquement les lignes d'évaluation pour tous les étudiants de la classe
        student_courses = self.env['op.student.course'].search([
            ('course_id', '=', self.course_id.id),
            ('batch_id', '=', self.batch_id.id),
            ('state', '=', 'running')
        ])
        
        for student_course in student_courses:
            self.env['op.evaluation.line'].create({
                'evaluation_id': self.id,
                'student_id': student_course.student_id.id,
                'note': 0.0
            })
        
        self.write({'state': 'ongoing'})

    def action_done(self):
        self.write({'state': 'done'})

    def action_cancel(self):
        self.write({'state': 'cancelled'})

    def action_draft(self):
        self.write({'state': 'draft'}) 