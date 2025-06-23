# -*- coding: utf-8 -*-

from odoo import models, fields, api, exceptions, _
from datetime import datetime, timedelta
import logging

_logger = logging.getLogger(__name__)

class OpSession(models.Model):
    _inherit = 'op.session'
    _description = 'Session de Cours - Extension'

    # Champs supplémentaires pour notre extension
    notes = fields.Text('Notes internes')
    is_makeup = fields.Boolean('Cours de rattrapage', default=False)
    original_session_id = fields.Many2one('op.session', 'Session originale', help="Si c'est un rattrapage")
    
    # Champs pour la compatibilité avec le frontend
    code = fields.Char('Code', compute='_compute_code', store=True)
    date = fields.Date('Date', compute='_compute_date_time_fields', store=True)
    start_time = fields.Float('Heure de début', compute='_compute_date_time_fields', store=True)
    end_time = fields.Float('Heure de fin', compute='_compute_date_time_fields', store=True)
    duration = fields.Float('Durée (heures)', compute='_compute_duration', store=True)
    
    # Contenu pédagogique
    topic = fields.Char('Sujet du cours')
    objectives = fields.Text('Objectifs pédagogiques')
    content = fields.Text('Contenu détaillé')
    homework = fields.Text('Devoirs donnés')
    
    # Présences - utiliser le système existant d'OpenEduCat
    attendance_count = fields.Integer('Nb présents', compute='_compute_attendance_stats')
    absent_count = fields.Integer('Nb absents', compute='_compute_attendance_stats')
    attendance_rate = fields.Float('Taux de présence (%)', compute='_compute_attendance_stats')
    attendance_ids = fields.One2many('op.attendance', 'session_id', 'Présences')
    
    # Dates système
    updated_date = fields.Datetime('Dernière modification', default=fields.Datetime.now, readonly=True)
    
    @api.depends('name', 'subject_id')
    def _compute_code(self):
        """Générer un code pour la session"""
        for session in self:
            if session.subject_id and session.name:
                session.code = f"{session.subject_id.code or 'SES'}-{session.id or 'NEW'}"
            else:
                session.code = f"SES-{session.id or 'NEW'}"
    
    @api.depends('start_datetime', 'end_datetime')
    def _compute_date_time_fields(self):
        """Calculer les champs date, start_time, end_time à partir des datetime"""
        for session in self:
            if session.start_datetime:
                # Convertir datetime en date et heure (format float)
                start_dt = fields.Datetime.from_string(session.start_datetime)
                session.date = start_dt.date()
                session.start_time = start_dt.hour + start_dt.minute / 60.0
            else:
                session.date = False
                session.start_time = 0.0
                
            if session.end_datetime:
                end_dt = fields.Datetime.from_string(session.end_datetime)
                session.end_time = end_dt.hour + end_dt.minute / 60.0
            else:
                session.end_time = 0.0
    
    @api.depends('start_datetime', 'end_datetime')
    def _compute_duration(self):
        """Calculer la durée en heures"""
        for session in self:
            if session.start_datetime and session.end_datetime:
                start = fields.Datetime.from_string(session.start_datetime)
                end = fields.Datetime.from_string(session.end_datetime)
                duration_timedelta = end - start
                session.duration = duration_timedelta.total_seconds() / 3600.0  # Convertir en heures
            else:
                session.duration = 0.0
    
    @api.depends('batch_id', 'attendance_ids')
    def _compute_attendance_stats(self):
        """Calculer les statistiques de présence"""
        for session in self:
            # Utiliser le système de présence d'OpenEduCat si disponible
            total_students = len(session.batch_id.student_ids) if session.batch_id else 0
            
            # Compter les présences dans notre système
            present_count = len(session.attendance_ids.filtered(lambda a: a.state == 'present'))
            
            # Si pas de présences dans notre système, chercher dans OpenEduCat
            if not session.attendance_ids:
                attendance_lines = self.env['op.attendance.line'].search([
                    ('attendance_id.session_id', '=', session.id)
                ])
                present_count = len(attendance_lines.filtered(lambda a: a.present))
            
            absent_count = total_students - present_count
            
            session.attendance_count = present_count
            session.absent_count = absent_count
            session.attendance_rate = (present_count / total_students * 100) if total_students > 0 else 0.0

    def action_create_makeup(self):
        """Créer une session de rattrapage"""
        self.ensure_one()
        
        makeup_session = self.copy({
            'name': f"Rattrapage - {self.name}",
            'is_makeup': True,
            'original_session_id': self.id,
            'state': 'draft',
            'start_datetime': fields.Datetime.now() + timedelta(days=7),
            'end_datetime': fields.Datetime.now() + timedelta(days=7, hours=1),
        })
        
        return {
            'type': 'ir.actions.act_window',
            'name': 'Session de rattrapage',
            'res_model': 'op.session',
            'res_id': makeup_session.id,
            'view_mode': 'form',
            'target': 'current',
        }

    @api.model
    def get_today_sessions(self):
        """Retourner les sessions du jour"""
        return self.search([
            ('start_datetime', '>=', fields.Datetime.now().replace(hour=0, minute=0, second=0)),
            ('start_datetime', '<', fields.Datetime.now().replace(hour=23, minute=59, second=59)),
            ('state', 'in', ['draft', 'confirm'])
        ])
    
    @api.model
    def get_upcoming_sessions(self, days=7):
        """Retourner les sessions à venir dans les N prochains jours"""
        end_date = fields.Datetime.now() + timedelta(days=days)
        return self.search([
            ('start_datetime', '>=', fields.Datetime.now()),
            ('start_datetime', '<=', end_date),
            ('state', 'in', ['draft', 'confirm'])
        ])


class OpClassroom(models.Model):
    _name = 'op.classroom'
    _description = 'Salle de classe'
    _rec_name = 'name'

    name = fields.Char('Nom de la salle', required=True)
    code = fields.Char('Code salle', required=True)
    capacity = fields.Integer('Capacité', required=True, default=30)
    floor = fields.Char('Étage')
    building = fields.Char('Bâtiment')
    equipment_ids = fields.One2many('op.classroom.equipment', 'classroom_id', 'Équipements')
    is_active = fields.Boolean('Active', default=True)
    notes = fields.Text('Notes')


class OpClassroomEquipment(models.Model):
    _name = 'op.classroom.equipment'
    _description = 'Équipement de salle de classe'

    name = fields.Char('Nom équipement', required=True)
    equipment_type = fields.Selection([
        ('projector', 'Vidéoprojecteur'),
        ('computer', 'Ordinateur'),
        ('whiteboard', 'Tableau blanc'),
        ('sound_system', 'Système audio'),
        ('other', 'Autre')
    ], string='Type', required=True)
    quantity = fields.Integer('Quantité', default=1)
    is_working = fields.Boolean('Fonctionnel', default=True)
    classroom_id = fields.Many2one('op.classroom', 'Salle de classe', required=True)


class OpAttendance(models.Model):
    _name = 'op.attendance'
    _description = 'Présence étudiant'
    _rec_name = 'display_name'

    display_name = fields.Char('Nom d\'affichage', compute='_compute_display_name', store=True)
    
    # Relations
    session_id = fields.Many2one('op.session', 'Session', required=True, ondelete='cascade')
    student_id = fields.Many2one('op.student', 'Étudiant', required=True)
    
    # Informations de présence
    date = fields.Date('Date', required=True)
    state = fields.Selection([
        ('present', 'Présent'),
        ('absent', 'Absent'),
        ('late', 'Retard'),
        ('excused', 'Excusé')
    ], string='État', default='absent', required=True)
    
    arrival_time = fields.Float('Heure d\'arrivée', help="Format 24h")
    departure_time = fields.Float('Heure de départ', help="Format 24h")
    notes = fields.Text('Notes')
    
    # Métadonnées
    marked_by = fields.Many2one('res.users', 'Marqué par', default=lambda self: self.env.user)
    marked_date = fields.Datetime('Date de marquage', default=fields.Datetime.now)
    
    @api.depends('student_id', 'session_id', 'state')
    def _compute_display_name(self):
        for attendance in self:
            if attendance.student_id and attendance.session_id:
                attendance.display_name = f"{attendance.student_id.name} - {attendance.session_id.display_name} ({attendance.state})"
            else:
                attendance.display_name = 'Nouvelle présence'
    
    @api.constrains('arrival_time', 'departure_time')
    def _check_times(self):
        for attendance in self:
            if attendance.arrival_time and attendance.departure_time:
                if attendance.arrival_time >= attendance.departure_time:
                    raise exceptions.ValidationError(_("L'heure de départ doit être postérieure à l'heure d'arrivée.")) 