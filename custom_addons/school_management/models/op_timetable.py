# -*- coding: utf-8 -*-

from odoo import models, fields, api, exceptions, _
from datetime import datetime, timedelta
import logging

_logger = logging.getLogger(__name__)

class OpTimetable(models.Model):
    _name = 'op.timetable'
    _description = 'Emploi du temps'
    _rec_name = 'display_name'
    _order = 'academic_year_id desc, semester_id, start_date desc'

    # Informations de base
    name = fields.Char('Nom de l\'emploi du temps', required=True)
    display_name = fields.Char('Nom d\'affichage', compute='_compute_display_name', store=True)
    
    # Période
    academic_year_id = fields.Many2one('op.academic.year', 'Année académique', required=False)
    semester_id = fields.Many2one('op.academic.term', 'Semestre')
    start_date = fields.Date('Date de début', required=True)
    end_date = fields.Date('Date de fin', required=True)
    
    # Relations
    batch_id = fields.Many2one('op.batch', 'Classe', required=True)
    faculty_id = fields.Many2one('op.faculty', 'Enseignant responsable')
    
    # Créneaux
    slot_ids = fields.One2many('op.timetable.slot', 'timetable_id', 'Créneaux')
    
    # États
    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('active', 'Actif'),
        ('archived', 'Archivé')
    ], string='État', default='draft', tracking=True)
    
    # Métadonnées
    notes = fields.Text('Notes')
    created_date = fields.Datetime('Date de création', default=fields.Datetime.now, readonly=True)
    
    @api.depends('name', 'batch_id', 'academic_year_id')
    def _compute_display_name(self):
        for timetable in self:
            try:
                if timetable.batch_id and timetable.academic_year_id:
                    batch_name = timetable.batch_id.name or 'Classe inconnue'
                    year_name = timetable.academic_year_id.name or 'Année inconnue'
                    timetable.display_name = f"{timetable.name} - {batch_name} ({year_name})"
                elif timetable.batch_id:
                    batch_name = timetable.batch_id.name or 'Classe inconnue'
                    timetable.display_name = f"{timetable.name} - {batch_name}"
                else:
                    timetable.display_name = timetable.name or 'Nouvel emploi du temps'
            except Exception:
                # En cas d'erreur, utiliser un nom par défaut
                timetable.display_name = timetable.name or 'Emploi du temps'
    
    @api.constrains('start_date', 'end_date')
    def _check_dates(self):
        for timetable in self:
            if timetable.start_date and timetable.end_date:
                if timetable.start_date >= timetable.end_date:
                    raise exceptions.ValidationError(_("La date de fin doit être postérieure à la date de début."))
    
    def action_activate(self):
        """Activer l'emploi du temps"""
        self.ensure_one()
        if self.state != 'draft':
            raise exceptions.UserError(_("Seuls les emplois du temps en brouillon peuvent être activés."))
        
        # Désactiver les autres emplois du temps de la même classe
        other_timetables = self.search([
            ('batch_id', '=', self.batch_id.id),
            ('state', '=', 'active'),
            ('id', '!=', self.id)
        ])
        other_timetables.write({'state': 'archived'})
        
        self.state = 'active'
        return True
    
    def action_archive(self):
        """Archiver l'emploi du temps"""
        self.ensure_one()
        self.state = 'archived'
        return True
    
    def action_generate_sessions(self):
        """Générer les sessions à partir de l'emploi du temps"""
        self.ensure_one()
        
        if not self.slot_ids:
            raise exceptions.UserError(_("Aucun créneau défini dans cet emploi du temps."))
        
        session_count = 0
        current_date = self.start_date
        
        while current_date <= self.end_date:
            weekday = current_date.weekday()  # 0=Lundi, 6=Dimanche
            
            # Trouver les créneaux pour ce jour
            day_slots = self.slot_ids.filtered(lambda s: s.day_of_week == str(weekday))
            
            for slot in day_slots:
                # Vérifier si une session existe déjà
                existing_session = self.env['op.session'].search([
                    ('subject_id', '=', slot.subject_id.id),
                    ('batch_id', '=', self.batch_id.id),
                    ('date', '=', current_date),
                    ('start_time', '=', slot.start_time),
                ])
                
                if not existing_session:
                    # Créer la session
                    session_vals = {
                        'name': f"{slot.subject_id.name} - {self.batch_id.name}",
                        'subject_id': slot.subject_id.id,
                        'batch_id': self.batch_id.id,
                        'faculty_id': slot.faculty_id.id,
                        'classroom_id': slot.classroom_id.id,
                        'date': current_date,
                        'start_time': slot.start_time,
                        'end_time': slot.end_time,
                        'topic': slot.topic,
                    }
                    
                    self.env['op.session'].create(session_vals)
                    session_count += 1
            
            current_date += timedelta(days=1)
        
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': _('Sessions générées'),
                'message': f'{session_count} sessions ont été créées à partir de l\'emploi du temps.',
                'type': 'success',
            }
        }


class OpTimetableSlot(models.Model):
    _name = 'op.timetable.slot'
    _description = 'Créneau d\'emploi du temps'
    _rec_name = 'display_name'
    _order = 'day_of_week, start_time'

    display_name = fields.Char('Nom d\'affichage', compute='_compute_display_name', store=True)
    
    # Relation parent
    timetable_id = fields.Many2one('op.timetable', 'Emploi du temps', required=True, ondelete='cascade')
    
    # Jour et heure
    day_of_week = fields.Selection([
        ('0', 'Lundi'),
        ('1', 'Mardi'),
        ('2', 'Mercredi'),
        ('3', 'Jeudi'),
        ('4', 'Vendredi'),
        ('5', 'Samedi'),
        ('6', 'Dimanche'),
    ], string='Jour de la semaine', required=True)
    
    start_time = fields.Float('Heure de début', required=True, help="Format 24h (ex: 8.5 pour 8h30)")
    end_time = fields.Float('Heure de fin', required=True, help="Format 24h (ex: 9.5 pour 9h30)")
    duration = fields.Float('Durée (heures)', compute='_compute_duration', store=True)
    
    # Cours
    subject_id = fields.Many2one('op.subject', 'Matière', required=False)
    faculty_id = fields.Many2one('op.faculty', 'Enseignant', required=False)
    classroom_id = fields.Many2one('op.classroom', 'Salle de classe')
    
    # Contenu
    topic = fields.Char('Sujet')
    notes = fields.Text('Notes')
    
    # Type de cours
    session_type = fields.Selection([
        ('lecture', 'Cours magistral'),
        ('practical', 'Travaux pratiques'),
        ('tutorial', 'Travaux dirigés'),
        ('exam', 'Examen'),
        ('other', 'Autre')
    ], string='Type de cours', default='lecture')
    
    @api.depends('day_of_week', 'start_time', 'end_time', 'subject_id')
    def _compute_display_name(self):
        for slot in self:
            if slot.subject_id and slot.day_of_week:
                day_name = dict(slot._fields['day_of_week'].selection)[slot.day_of_week]
                start_h = int(slot.start_time)
                start_m = int((slot.start_time - start_h) * 60)
                end_h = int(slot.end_time)
                end_m = int((slot.end_time - end_h) * 60)
                slot.display_name = f"{day_name} {start_h:02d}h{start_m:02d}-{end_h:02d}h{end_m:02d} - {slot.subject_id.name}"
            else:
                slot.display_name = 'Nouveau créneau'
    
    @api.depends('start_time', 'end_time')
    def _compute_duration(self):
        for slot in self:
            if slot.start_time and slot.end_time:
                slot.duration = slot.end_time - slot.start_time
            else:
                slot.duration = 0.0
    
    @api.constrains('start_time', 'end_time')
    def _check_times(self):
        for slot in self:
            if slot.start_time >= slot.end_time:
                raise exceptions.ValidationError(_("L'heure de fin doit être postérieure à l'heure de début."))
            
            if slot.start_time < 0 or slot.end_time > 24:
                raise exceptions.ValidationError(_("Les heures doivent être entre 0 et 24."))
    
    @api.constrains('timetable_id', 'day_of_week', 'start_time', 'end_time', 'classroom_id')
    def _check_conflicts(self):
        """Vérifier les conflits de créneaux"""
        for slot in self:
            if not slot.classroom_id:
                continue
                
            # Vérifier les conflits dans le même emploi du temps
            conflicting_slots = self.search([
                ('timetable_id', '=', slot.timetable_id.id),
                ('day_of_week', '=', slot.day_of_week),
                ('classroom_id', '=', slot.classroom_id.id),
                ('id', '!=', slot.id),
                '|',
                '&', ('start_time', '<=', slot.start_time), ('end_time', '>', slot.start_time),
                '&', ('start_time', '<', slot.end_time), ('end_time', '>=', slot.end_time),
            ])
            
            if conflicting_slots:
                raise exceptions.ValidationError(
                    _("Conflit détecté : la salle %s est déjà occupée à cette heure le %s.") % 
                    (slot.classroom_id.name, dict(slot._fields['day_of_week'].selection)[slot.day_of_week])
                )


class OpTimetableTemplate(models.Model):
    _name = 'op.timetable.template'
    _description = 'Modèle d\'emploi du temps'
    _rec_name = 'name'

    name = fields.Char('Nom du modèle', required=True)
    description = fields.Text('Description')
    
    # Type d'emploi du temps
    template_type = fields.Selection([
        ('weekly', 'Hebdomadaire'),
        ('semester', 'Semestriel'),
        ('yearly', 'Annuel')
    ], string='Type de modèle', default='weekly', required=True)
    
    # Créneaux types
    template_slot_ids = fields.One2many('op.timetable.template.slot', 'template_id', 'Créneaux types')
    
    # Métadonnées
    is_active = fields.Boolean('Actif', default=True)
    created_date = fields.Datetime('Date de création', default=fields.Datetime.now, readonly=True)
    
    def action_apply_to_timetable(self):
        """Appliquer le modèle à un emploi du temps"""
        self.ensure_one()
        
        return {
            'type': 'ir.actions.act_window',
            'name': 'Appliquer le modèle',
            'res_model': 'op.timetable.apply.wizard',
            'view_mode': 'form',
            'target': 'new',
            'context': {'default_template_id': self.id},
        }


class OpTimetableTemplateSlot(models.Model):
    _name = 'op.timetable.template.slot'
    _description = 'Créneau type d\'emploi du temps'
    _rec_name = 'display_name'
    _order = 'day_of_week, start_time'

    display_name = fields.Char('Nom d\'affichage', compute='_compute_display_name', store=True)
    
    # Relation parent
    template_id = fields.Many2one('op.timetable.template', 'Modèle', required=True, ondelete='cascade')
    
    # Jour et heure
    day_of_week = fields.Selection([
        ('0', 'Lundi'),
        ('1', 'Mardi'),
        ('2', 'Mercredi'),
        ('3', 'Jeudi'),
        ('4', 'Vendredi'),
        ('5', 'Samedi'),
        ('6', 'Dimanche'),
    ], string='Jour de la semaine', required=True)
    
    start_time = fields.Float('Heure de début', required=True)
    end_time = fields.Float('Heure de fin', required=True)
    duration = fields.Float('Durée (heures)', compute='_compute_duration', store=True)
    
    # Type de cours
    session_type = fields.Selection([
        ('lecture', 'Cours magistral'),
        ('practical', 'Travaux pratiques'),
        ('tutorial', 'Travaux dirigés'),
        ('exam', 'Examen'),
        ('other', 'Autre')
    ], string='Type de cours', default='lecture')
    
    # Matière (optionnelle dans le modèle)
    subject_id = fields.Many2one('op.subject', 'Matière suggérée')
    
    # Description
    name = fields.Char('Nom du créneau', required=True)
    description = fields.Text('Description')
    
    @api.depends('day_of_week', 'start_time', 'end_time', 'name')
    def _compute_display_name(self):
        for slot in self:
            if slot.day_of_week:
                day_name = dict(slot._fields['day_of_week'].selection)[slot.day_of_week]
                start_h = int(slot.start_time)
                start_m = int((slot.start_time - start_h) * 60)
                end_h = int(slot.end_time)
                end_m = int((slot.end_time - end_h) * 60)
                slot.display_name = f"{day_name} {start_h:02d}h{start_m:02d}-{end_h:02d}h{end_m:02d} - {slot.name}"
            else:
                slot.display_name = slot.name or 'Nouveau créneau'
    
    @api.depends('start_time', 'end_time')
    def _compute_duration(self):
        for slot in self:
            if slot.start_time and slot.end_time:
                slot.duration = slot.end_time - slot.start_time
            else:
                slot.duration = 0.0 