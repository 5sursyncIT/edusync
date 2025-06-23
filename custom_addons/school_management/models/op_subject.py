# -*- coding: utf-8 -*-
# Fichier: /opt/odoo/custom_addons/school_management/models/op_subject.py

from odoo import models, fields, api, _
from odoo.exceptions import ValidationError

class OpSubject(models.Model):
    """
    Modèle pour les chapitres/modules/unités d'enseignement
    Représente les subdivisions d'un cours
    """
    _inherit = 'op.subject'
    _description = 'Chapitre/Module de Cours'
    _order = 'course_id, sequence, name'

    # ==================== IDENTIFICATION ====================
    
    # Lien avec le cours parent (ajout du champ manquant)
    course_id = fields.Many2one('op.course', string='Cours', required=True, 
                                ondelete='cascade',
                                help='Le cours auquel appartient ce chapitre')
    
    # Séquence pour l'ordre des chapitres
    sequence = fields.Integer('Ordre', default=10,
                             help='Ordre d\'affichage dans le cours')
    
    # Type de contenu
    content_type = fields.Selection([
        ('chapitre', 'Chapitre'),
        ('module', 'Module'),
        ('unite', 'Unité d\'Enseignement'),
        ('sequence', 'Séquence Pédagogique'),
        ('tp', 'Travaux Pratiques'),
        ('td', 'Travaux Dirigés'),
        ('projet', 'Projet'),
        ('evaluation', 'Évaluation')
    ], string='Type', default='chapitre', required=True)
    
    # ==================== CONTENU PÉDAGOGIQUE ====================
    
    # Description détaillée
    description = fields.Text('Description')
    
    # Objectifs pédagogiques
    learning_objectives = fields.Text('Objectifs Pédagogiques',
                                     help='Ce que l\'élève doit savoir faire à la fin')
    
    # Compétences visées
    skills = fields.Text('Compétences Visées')
    
    # Prérequis
    prerequisites = fields.Text('Prérequis',
                               help='Ce que l\'élève doit maîtriser avant')
    
    # Durée estimée
    duration = fields.Float('Durée (heures)', default=2.0,
                           help='Durée estimée en heures')
    
    # ==================== PLANIFICATION ====================
    
    # Période prévue
    planned_date = fields.Date('Date Prévue')
    start_date = fields.Date('Date de Début')
    end_date = fields.Date('Date de Fin')
    
    # État d'avancement
    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('planned', 'Planifié'),
        ('ongoing', 'En Cours'),
        ('done', 'Terminé'),
        ('cancelled', 'Annulé')
    ], string='État', default='draft', tracking=True)
    
    # Progression
    completion_rate = fields.Float('Taux de Completion (%)', 
                                  compute='_compute_completion_rate')
    
    # ==================== RESSOURCES ====================
    
    # Documents et supports
    document_ids = fields.Many2many('ir.attachment', 
                                   'subject_document_rel',
                                   'subject_id', 'attachment_id',
                                   string='Documents',
                                   help='Supports de cours, exercices, etc.')
    
    # Ressources en ligne
    online_resources = fields.Text('Ressources en Ligne',
                                  help='Liens vers des ressources externes')
    
    # Exercices
    has_exercises = fields.Boolean('Contient des Exercices')
    exercises_description = fields.Text('Description des Exercices')
    
    # ==================== ÉVALUATION ====================
    
    # Type d'évaluation
    evaluation_type = fields.Selection([
        ('none', 'Pas d\'Évaluation'),
        ('formative', 'Évaluation Formative'),
        ('sommative', 'Évaluation Sommative'),
        ('auto', 'Auto-Évaluation')
    ], string='Type d\'Évaluation', default='none')
    
    # Coefficient pour ce chapitre
    weight = fields.Float('Poids/Coefficient', default=1.0,
                         help='Poids dans la note finale du cours')
    
    # Note maximale
    max_grade = fields.Float('Note Maximale', default=20.0)
    
    # ==================== RELATIONS ====================
    
    # Note: Les relations vers d'autres modèles sont commentées
    # pour éviter les erreurs si ces modèles n'existent pas
    
    # Sessions liées à ce chapitre
    # session_ids = fields.One2many('op.session', 'subject_id', string='Sessions')
    session_count = fields.Integer('Nombre de Sessions',
                                  compute='_compute_session_count')
    
    # Devoirs/Assignments - COMMENTÉ pour éviter l'erreur
    # assignment_ids = fields.One2many('op.assignment', 'subject_id', string='Devoirs')
    assignment_count = fields.Integer('Nombre de Devoirs', default=0)
    
    # Résultats/Notes - COMMENTÉ pour éviter l'erreur
    # result_ids = fields.One2many('op.result', 'subject_id', string='Résultats')
    
    # ==================== INFORMATIONS CALCULÉES ====================
    
    # Informations du cours parent
    course_name = fields.Char('Nom du Cours', related='course_id.name', 
                             readonly=True, store=True)
    course_level = fields.Selection(related='course_id.education_level',
                                   string='Niveau', readonly=True)
    course_year = fields.Selection(related='course_id.school_year',
                                  string='Classe', readonly=True)
    
    # Enseignant principal
    main_teacher_id = fields.Many2one(related='course_id.main_teacher_id',
                                     string='Enseignant Principal',
                                     readonly=True, store=True)
    
    # ==================== COMPUTED FIELDS ====================
    
    def _compute_session_count(self):
        """Compte le nombre de sessions"""
        for subject in self:
            # Vérifier si le modèle op.session existe et a le champ subject_id
            if 'op.session' in self.env:
                try:
                    sessions = self.env['op.session'].search([('subject_id', '=', subject.id)])
                    subject.session_count = len(sessions)
                except:
                    subject.session_count = 0
            else:
                subject.session_count = 0
    
    @api.depends('duration')
    def _compute_completion_rate(self):
        """Calcule le taux de completion basé sur les sessions"""
        for subject in self:
            # Calcul simplifié sans dépendre des sessions
            if subject.state == 'done':
                subject.completion_rate = 100.0
            elif subject.state == 'ongoing':
                subject.completion_rate = 50.0
            else:
                subject.completion_rate = 0.0
    
    # ==================== CONTRAINTES ====================
    
    @api.constrains('start_date', 'end_date')
    def _check_dates(self):
        """Vérifie la cohérence des dates"""
        for subject in self:
            if subject.start_date and subject.end_date:
                if subject.start_date > subject.end_date:
                    raise ValidationError(
                        _('La date de fin doit être après la date de début')
                    )
    
    @api.constrains('weight')
    def _check_weight(self):
        """Vérifie que le poids est positif"""
        for subject in self:
            if subject.weight < 0:
                raise ValidationError(
                    _('Le coefficient doit être positif')
                )
    
    # ==================== MÉTHODES ====================
    
    @api.model_create_multi
    def create(self, vals_list):
        """Création avec génération automatique du code"""
        for vals in vals_list:
            if not vals.get('code') and vals.get('name') and vals.get('course_id'):
                # Récupérer le cours
                course = self.env['op.course'].browse(vals['course_id'])
                
                # Générer le code: CODE_COURS_SEQUENCE
                sequence = vals.get('sequence', 10)
                vals['code'] = f"{course.code}_CH{sequence:02d}"
        
        return super().create(vals_list)
    
    def name_get(self):
        """Formatage du nom d'affichage"""
        result = []
        for subject in self:
            if subject.course_id:
                name = f"{subject.course_id.name} - {subject.name}"
            else:
                name = subject.name or _('Sans nom')
            
            # Ajouter le type si ce n'est pas un chapitre
            if subject.content_type and subject.content_type != 'chapitre':
                type_name = dict(self._fields['content_type'].selection).get(
                    subject.content_type, subject.content_type
                )
                name += f" ({type_name})"
            
            result.append((subject.id, name))
        
        return result
    
    # ==================== ACTIONS ====================
    
    def action_plan(self):
        """Planifier le chapitre"""
        self.ensure_one()
        if self.state != 'draft':
            raise ValidationError(
                _('Seul un chapitre en brouillon peut être planifié')
            )
        
        if not self.planned_date:
            raise ValidationError(
                _('Veuillez définir une date prévue')
            )
        
        self.state = 'planned'
    
    def action_start(self):
        """Démarrer le chapitre"""
        self.ensure_one()
        if self.state not in ['draft', 'planned']:
            raise ValidationError(
                _('Ce chapitre ne peut pas être démarré')
            )
        
        self.write({
            'state': 'ongoing',
            'start_date': fields.Date.today() if not self.start_date else self.start_date
        })
    
    def action_done(self):
        """Terminer le chapitre"""
        self.ensure_one()
        if self.state != 'ongoing':
            raise ValidationError(
                _('Seul un chapitre en cours peut être terminé')
            )
        
        self.write({
            'state': 'done',
            'end_date': fields.Date.today() if not self.end_date else self.end_date
        })
    
    def action_cancel(self):
        """Annuler le chapitre"""
        self.ensure_one()
        if self.state == 'done':
            raise ValidationError(
                _('Un chapitre terminé ne peut pas être annulé')
            )
        
        self.state = 'cancelled'
    
    def action_view_sessions(self):
        """Voir les sessions du chapitre"""
        self.ensure_one()
        
        # Vérifier si le modèle op.session existe
        if 'op.session' not in self.env:
            raise ValidationError(_('Le module de gestion des sessions n\'est pas installé'))
        
        return {
            'name': _('Sessions - %s') % self.name,
            'type': 'ir.actions.act_window',
            'res_model': 'op.session',
            'view_mode': 'tree,form,calendar',
            'domain': [('subject_id', '=', self.id)],
            'context': {
                'default_subject_id': self.id,
                'default_course_id': self.course_id.id,
                'default_batch_id': self.course_id.batch_ids[0].id if self.course_id.batch_ids else False,
                'default_faculty_id': self.course_id.main_teacher_id.id
            }
        }
    
    def action_create_session(self):
        """Créer une session pour ce chapitre"""
        self.ensure_one()
        
        # Vérifier si le modèle op.session existe
        if 'op.session' not in self.env:
            raise ValidationError(_('Le module de gestion des sessions n\'est pas installé'))
        
        # Préparer les valeurs par défaut
        default_values = {
            'subject_id': self.id,
            'course_id': self.course_id.id,
            'faculty_id': self.course_id.main_teacher_id.id,
            'type': 'lecture',
            'duration': self.duration,
            'name': f"Session - {self.name}"
        }
        
        # Si des batches sont définis sur le cours
        if self.course_id.batch_ids:
            default_values['batch_id'] = self.course_id.batch_ids[0].id
        
        return {
            'name': _('Nouvelle Session'),
            'type': 'ir.actions.act_window',
            'res_model': 'op.session',
            'view_mode': 'form',
            'target': 'new',
            'context': default_values
        }
    
    # ==================== MÉTHODES UTILITAIRES ====================
    
    @api.onchange('content_type')
    def _onchange_content_type(self):
        """Adapter les valeurs par défaut selon le type"""
        if self.content_type:
            defaults = {
                'chapitre': {'duration': 4.0, 'evaluation_type': 'formative'},
                'module': {'duration': 8.0, 'evaluation_type': 'sommative'},
                'tp': {'duration': 2.0, 'evaluation_type': 'formative'},
                'td': {'duration': 2.0, 'evaluation_type': 'none'},
                'projet': {'duration': 16.0, 'evaluation_type': 'sommative'},
                'evaluation': {'duration': 2.0, 'evaluation_type': 'sommative'}
            }
            
            if self.content_type in defaults:
                for field, value in defaults[self.content_type].items():
                    setattr(self, field, value)
    
    def copy_data(self, default=None):
        """Surcharge pour la duplication"""
        self.ensure_one()
        if default is None:
            default = {}
        
        # Ajouter (Copie) au nom
        if 'name' not in default:
            default['name'] = _("%s (Copie)") % self.name
        
        # Réinitialiser certains champs
        default.update({
            'state': 'draft',
            'start_date': False,
            'end_date': False,
            'completion_rate': 0.0
        })
        
        return super().copy_data(default)