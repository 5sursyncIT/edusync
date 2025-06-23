# -*- coding: utf-8 -*-
# Fichier: /opt/odoo/custom_addons/school_management/models/op_course.py

from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
import logging

_logger = logging.getLogger(__name__)

class OpCourse(models.Model):
    """
    Modèle COURS complet pour la gestion scolaire du primaire au lycée
    Hérite du modèle op.course d'OpenEduCat
    """
    _inherit = 'op.course'
    _description = 'Cours Scolaire - Primaire au Lycée'
    _order = 'education_level, school_year, subject_area'

    # ==================== NIVEAU SCOLAIRE ET STRUCTURE ====================
    
    education_level = fields.Selection([
        ('maternelle', 'Maternelle'),
        ('primaire', 'Primaire'),
        ('college', 'Collège'),
        ('lycee', 'Lycée')
    ], string='Niveau d\'Enseignement', required=False, default='college', tracking=True)
    
    # Année scolaire (ex: 2024-2025)
    academic_year = fields.Char('Année Scolaire', default='2024-2025', 
                               help='Année scolaire (ex: 2024-2025)')
    
    # Classe/Niveau détaillé
    class_level = fields.Selection([
        # Maternelle
        ('ps', 'Petite Section (PS)'),
        ('ms', 'Moyenne Section (MS)'),
        ('gs', 'Grande Section (GS)'),
        # Primaire
        ('cp', 'CP - Cours Préparatoire'),
        ('ce1', 'CE1 - Cours Élémentaire 1'),
        ('ce2', 'CE2 - Cours Élémentaire 2'),
        ('cm1', 'CM1 - Cours Moyen 1'),
        ('cm2', 'CM2 - Cours Moyen 2'),
        # Collège
        ('6eme', '6ème - Sixième'),
        ('5eme', '5ème - Cinquième'),
        ('4eme', '4ème - Quatrième'),
        ('3eme', '3ème - Troisième'),
        # Lycée
        ('2nde', '2nde - Seconde'),
        ('1ere', '1ère - Première'),
        ('term', 'Terminale')
    ], string='Classe/Niveau', required=False, default='6eme', tracking=True)
    
    # Garder school_year pour compatibilité (alias de class_level)
    school_year = fields.Selection([
        # Maternelle
        ('ps', 'Petite Section (PS)'),
        ('ms', 'Moyenne Section (MS)'),
        ('gs', 'Grande Section (GS)'),
        # Primaire
        ('cp', 'CP - Cours Préparatoire'),
        ('ce1', 'CE1 - Cours Élémentaire 1'),
        ('ce2', 'CE2 - Cours Élémentaire 2'),
        ('cm1', 'CM1 - Cours Moyen 1'),
        ('cm2', 'CM2 - Cours Moyen 2'),
        # Collège
        ('6eme', '6ème - Sixième'),
        ('5eme', '5ème - Cinquième'),
        ('4eme', '4ème - Quatrième'),
        ('3eme', '3ème - Troisième'),
        # Lycée
        ('2nde', '2nde - Seconde'),
        ('1ere', '1ère - Première'),
        ('term', 'Terminale')
    ], string='Classe/Année (Legacy)', required=False, default='6eme', tracking=True)
    
    # Filière (pour le lycée)
    track = fields.Selection([
        # Filières générales
        ('generale', 'Générale'),
        ('es', 'ES - Économique et Social'),
        ('l', 'L - Littéraire'),
        ('s', 'S - Scientifique'),
        # Filières technologiques
        ('stmg', 'STMG - Sciences et Technologies du Management'),
        ('sti2d', 'STI2D - Sciences et Technologies Industrielles'),
        ('st2s', 'ST2S - Sciences et Technologies de la Santé'),
        ('stl', 'STL - Sciences et Technologies de Laboratoire'),
        ('std2a', 'STD2A - Sciences et Technologies du Design'),
        # Filières professionnelles
        ('pro', 'Professionnelle'),
        ('pro_commerce', 'Bac Pro Commerce'),
        ('pro_compta', 'Bac Pro Comptabilité'),
        ('pro_info', 'Bac Pro Informatique'),
        ('pro_elec', 'Bac Pro Électricité')
    ], string='Filière/Série', 
       help='Filière pour les classes de lycée')

    # ==================== MATIÈRE ET CONTENU ====================
    
    subject_area = fields.Selection([
        # Matières fondamentales
        ('francais', 'Français'),
        ('maths', 'Mathématiques'),
        ('histoire_geo', 'Histoire-Géographie'),
        ('emc', 'EMC - Enseignement Moral et Civique'),
        # Langues
        ('anglais', 'Anglais'),
        ('espagnol', 'Espagnol'),
        ('allemand', 'Allemand'),
        ('italien', 'Italien'),
        ('arabe', 'Arabe'),
        ('chinois', 'Chinois'),
        # Sciences
        ('sciences', 'Sciences (Primaire/Collège)'),
        ('physique_chimie', 'Physique-Chimie'),
        ('svt', 'SVT - Sciences de la Vie et de la Terre'),
        ('technologie', 'Technologie'),
        ('informatique', 'Informatique/NSI'),
        # Arts et Sports
        ('arts_plastiques', 'Arts Plastiques'),
        ('musique', 'Éducation Musicale'),
        ('eps', 'EPS - Éducation Physique et Sportive'),
        # Spécialités lycée
        ('philosophie', 'Philosophie'),
        ('ses', 'SES - Sciences Économiques et Sociales'),
        ('hlp', 'HLP - Humanités, Littérature et Philosophie'),
        ('llce', 'LLCE - Langues, Littératures et Cultures Étrangères'),
        ('si', 'SI - Sciences de l\'Ingénieur'),
        # Autres
        ('autre', 'Autre Matière')
    ], string='Matière/Discipline', required=False, default='autre')
    
    # Type de cours
    course_type = fields.Selection([
        ('obligatoire', 'Obligatoire'),
        ('specialite', 'Spécialité'),
        ('option', 'Option'),
        ('ap', 'Accompagnement Personnalisé'),
        ('soutien', 'Soutien/Remédiation'),
        ('projet', 'Projet/Atelier')
    ], string='Type de Cours', default='obligatoire', required=True)

    # ==================== ORGANISATION PÉDAGOGIQUE ====================
    
    # Volume horaire
    weekly_hours = fields.Float('Heures/Semaine', required=True, default=1.0,
                               help='Nombre d\'heures de cours par semaine')
    annual_hours = fields.Float('Volume Horaire Annuel', 
                               compute='_compute_annual_hours', store=True)
    
    # Coefficient et évaluation
    coefficient = fields.Float('Coefficient', default=1.0, required=True,
                              help='Coefficient pour le calcul des moyennes')
    
    evaluation_type = fields.Selection([
        ('cc', 'Contrôle Continu'),
        ('examen', 'Examen Final'),
        ('mixte', 'Contrôle Continu + Examen'),
        ('competences', 'Évaluation par Compétences'),
        ('sans_note', 'Sans Note')
    ], string='Mode d\'Évaluation', default='cc', required=True)
    
    # Effectifs
    min_students = fields.Integer('Effectif Minimum', default=5)
    max_students = fields.Integer('Effectif Maximum', default=35)
    group_size = fields.Integer('Taille des Groupes', 
                               help='Pour les TP/TD, taille maximale d\'un groupe')

    # ==================== ENSEIGNANTS ET SALLES ====================
    
    # Enseignant principal
    main_teacher_id = fields.Many2one('op.faculty', string='Enseignant Principal')
    
    # Enseignants supplémentaires (pour co-enseignement)
    teacher_ids = fields.Many2many('op.faculty', 'course_teacher_rel',
                                  'course_id', 'teacher_id',
                                  string='Enseignants')
    
    # Salle par défaut
    classroom_id = fields.Many2one('op.classroom', string='Salle de Classe')
    
    # Salles spécialisées
    lab_required = fields.Boolean('Laboratoire Requis')
    computer_room_required = fields.Boolean('Salle Informatique Requise')
    special_equipment = fields.Text('Équipement Spécial Requis')

    # ==================== PROGRAMME ET CONTENU ====================
    
    # Programme officiel
    official_program = fields.Text('Programme Officiel',
                                  help='Description du programme officiel')
    
    # Compétences visées
    skills = fields.Text('Compétences Visées')
    
    # Prérequis
    prerequisites = fields.Text('Prérequis',
                               help='Connaissances requises pour suivre ce cours')
    
    # Objectifs pédagogiques
    learning_objectives = fields.Text('Objectifs Pédagogiques')
    
    # Méthodes pédagogiques
    teaching_methods = fields.Text('Méthodes Pédagogiques')
    
    # Ressources
    textbook = fields.Char('Manuel Scolaire')
    online_resources = fields.Text('Ressources en Ligne')
    
    # ==================== RELATIONS ====================
    
    # Lien avec les matières détaillées (subjects)
    subject_ids = fields.One2many('op.subject', 'course_id', 
                                 string='Chapitres/Modules')
    subject_count = fields.Integer('Nombre de Chapitres', 
                                  compute='_compute_subject_count')
    
    # Promotions/Classes
    batch_ids = fields.One2many('op.batch', 'course_id', string='Classes')
    batch_count = fields.Integer('Nombre de Classes', 
                                compute='_compute_batch_count')
    
    # Sessions de cours - Commenté car le champ course_id pourrait ne pas exister dans op.session
    # session_ids = fields.One2many('op.session', 'course_id', string='Sessions')
    session_count = fields.Integer('Nombre de Sessions', default=0)
    
    # Étudiants inscrits
    student_count = fields.Integer('Nombre d\'Élèves', 
                                  compute='_compute_student_count', store=True)

    # ==================== PLANNING ET CALENDRIER ====================
    
    # Période
    start_date = fields.Date('Date de Début')
    end_date = fields.Date('Date de Fin')
    
    # Jours de cours
    monday = fields.Boolean('Lundi', default=True)
    tuesday = fields.Boolean('Mardi', default=True)
    wednesday = fields.Boolean('Mercredi', default=True)
    thursday = fields.Boolean('Jeudi', default=True)
    friday = fields.Boolean('Vendredi', default=True)
    saturday = fields.Boolean('Samedi')
    
    # État
    state = fields.Selection([
        ('draft', 'Brouillon'),
        ('confirmed', 'Confirmé'),
        ('ongoing', 'En Cours'),
        ('done', 'Terminé'),
        ('cancelled', 'Annulé')
    ], string='État', default='draft', tracking=True)

    # ==================== CHAMPS CALCULÉS ====================
    
    @api.depends('weekly_hours')
    def _compute_annual_hours(self):
        """Calcule le volume horaire annuel (36 semaines)"""
        for course in self:
            course.annual_hours = course.weekly_hours * 36
    
    @api.depends('subject_ids')
    def _compute_subject_count(self):
        """Compte le nombre de chapitres/modules"""
        for course in self:
            course.subject_count = len(course.subject_ids)
    
    @api.depends('batch_ids')
    def _compute_batch_count(self):
        """Compte le nombre de classes"""
        for course in self:
            course.batch_count = len(course.batch_ids)
    
    @api.depends('session_ids')
    def _compute_session_count(self):
        """Compte le nombre de sessions"""
        for course in self:
            course.session_count = len(course.session_ids)
    
    @api.depends('batch_ids')
    def _compute_student_count(self):
        """Compte le nombre total d'élèves"""
        for course in self:
            total = 0
            for batch in course.batch_ids:
                # Compter via op.student.course
                students = self.env['op.student.course'].search([
                    ('course_id', '=', course.id),
                    ('batch_id', '=', batch.id),
                    ('state', '=', 'running')
                ])
                total += len(students)
            course.student_count = total

    # ==================== CONTRAINTES ====================
    
    @api.constrains('education_level', 'class_level')
    def _check_level_year_consistency(self):
        """Vérifie la cohérence entre niveau et année"""
        for course in self:
            valid_years = {
                'maternelle': ['ps', 'ms', 'gs'],
                'primaire': ['cp', 'ce1', 'ce2', 'cm1', 'cm2'],
                'college': ['6eme', '5eme', '4eme', '3eme'],
                'lycee': ['2nde', '1ere', 'term']
            }
            
            if course.education_level and course.class_level:
                if course.class_level not in valid_years.get(course.education_level, []):
                    raise ValidationError(
                        _('La classe %s n\'est pas compatible avec le niveau %s') % 
                        (course.class_level, course.education_level)
                    )
    
    @api.constrains('track', 'education_level', 'class_level')
    def _check_track_validity(self):
        """Vérifie que la filière n'est renseignée que pour le lycée"""
        for course in self:
            if course.track and course.education_level != 'lycee':
                raise ValidationError(
                    _('Les filières ne sont applicables qu\'au lycée')
                )
            
            if course.track and course.class_level not in ['1ere', 'term']:
                raise ValidationError(
                    _('Les filières ne sont applicables qu\'en 1ère et Terminale')
                )
    
    @api.constrains('start_date', 'end_date')
    def _check_dates(self):
        """Vérifie la cohérence des dates"""
        for course in self:
            if course.start_date and course.end_date:
                if course.start_date > course.end_date:
                    raise ValidationError(
                        _('La date de fin doit être après la date de début')
                    )
    
    @api.constrains('min_students', 'max_students')
    def _check_student_limits(self):
        """Vérifie les limites d'effectifs"""
        for course in self:
            if course.min_students < 0 or course.max_students < 0:
                raise ValidationError(
                    _('Les effectifs ne peuvent pas être négatifs')
                )
            if course.min_students > course.max_students:
                raise ValidationError(
                    _('L\'effectif minimum ne peut pas dépasser l\'effectif maximum')
                )

    # ==================== MÉTHODES ====================
    
    @api.model_create_multi
    def create(self, vals_list):
        """Création avec génération automatique du nom et code"""
        for vals in vals_list:
            # Générer le nom si non fourni
            if not vals.get('name'):
                if vals.get('subject_area') and vals.get('class_level'):
                    subject_name = dict(self._fields['subject_area'].selection).get(
                        vals['subject_area'], vals['subject_area']
                    )
                    year_name = dict(self._fields['class_level'].selection).get(
                        vals['class_level'], vals['class_level']
                    )
                    vals['name'] = f"{subject_name} - {year_name}"
                    
                    # Ajouter la filière si lycée
                    if vals.get('track'):
                        track_name = dict(self._fields['track'].selection).get(
                            vals['track'], vals['track']
                        )
                        vals['name'] += f" ({track_name})"
            
            # Générer le code si non fourni
            if not vals.get('code'):
                if vals.get('subject_area') and vals.get('class_level'):
                    subject_code = vals['subject_area'][:3].upper()
                    year_code = vals['class_level'][:3].upper()
                    
                    # Compter les cours similaires pour éviter les doublons
                    count = self.search_count([
                        ('subject_area', '=', vals.get('subject_area')),
                        ('class_level', '=', vals.get('class_level'))
                    ])
                    
                    vals['code'] = f"{subject_code}_{year_code}"
                    if count > 0:
                        vals['code'] += f"_{count + 1}"
        
        return super().create(vals_list)
    
    def name_get(self):
        """Formatage du nom d'affichage"""
        result = []
        for course in self:
            name = course.name or ''
            
            # Ajouter le code entre parenthèses
            if course.code:
                name = f"[{course.code}] {name}"
            
            # Ajouter le type de cours si ce n'est pas obligatoire
            if course.course_type and course.course_type != 'obligatoire':
                type_name = dict(self._fields['course_type'].selection).get(
                    course.course_type, course.course_type
                )
                name += f" ({type_name})"
            
            result.append((course.id, name))
        
        return result
    
    @api.model
    def name_search(self, name='', args=None, operator='ilike', limit=100):
        """Recherche par nom ou code"""
        if args is None:
            args = []
        
        if name:
            args = ['|', ('name', operator, name), ('code', operator, name)] + args
        
        return super().name_search(name='', args=args, operator=operator, limit=limit)

    # ==================== ACTIONS ====================
    
    def action_confirm(self):
        """Confirmer le cours"""
        self.ensure_one()
        if self.state != 'draft':
            raise ValidationError(_('Seul un cours en brouillon peut être confirmé'))
        
        # Vérifications
        if not self.main_teacher_id and not self.teacher_ids:
            raise ValidationError(_('Veuillez assigner au moins un enseignant'))
        
        if not self.batch_ids:
            raise ValidationError(_('Veuillez assigner au moins une classe'))
        
        self.state = 'confirmed'
        
        # Créer les sessions automatiquement si configuré
        if self.env.company.auto_create_sessions:
            self._create_sessions()
    
    def action_start(self):
        """Démarrer le cours"""
        self.ensure_one()
        if self.state != 'confirmed':
            raise ValidationError(_('Seul un cours confirmé peut être démarré'))
        
        self.state = 'ongoing'
    
    def action_done(self):
        """Terminer le cours"""
        self.ensure_one()
        if self.state != 'ongoing':
            raise ValidationError(_('Seul un cours en cours peut être terminé'))
        
        self.state = 'done'
    
    def action_cancel(self):
        """Annuler le cours"""
        self.ensure_one()
        if self.state == 'done':
            raise ValidationError(_('Un cours terminé ne peut pas être annulé'))
        
        self.state = 'cancelled'
    
    def action_draft(self):
        """Remettre en brouillon"""
        self.ensure_one()
        if self.state not in ['cancelled', 'confirmed']:
            raise ValidationError(
                _('Seul un cours annulé ou confirmé peut être remis en brouillon')
            )
        
        self.state = 'draft'
    
    def action_view_students(self):
        """Voir les élèves inscrits"""
        self.ensure_one()
        
        # Récupérer tous les étudiants via op.student.course
        student_courses = self.env['op.student.course'].search([
            ('course_id', '=', self.id),
            ('state', '=', 'running')
        ])
        
        student_ids = student_courses.mapped('student_id').ids
        
        return {
            'name': _('Élèves - %s') % self.name,
            'type': 'ir.actions.act_window',
            'res_model': 'op.student',
            'view_mode': 'tree,form',
            'domain': [('id', 'in', student_ids)],
            'context': {
                'default_course_id': self.id,
                'search_default_group_by_batch': True
            }
        }
    
    def action_view_sessions(self):
        """Voir les sessions du cours"""
        self.ensure_one()
        
        return {
            'name': _('Sessions - %s') % self.name,
            'type': 'ir.actions.act_window',
            'res_model': 'op.session',
            'view_mode': 'calendar,tree,form',
            'domain': [('course_id', '=', self.id)],
            'context': {
                'default_course_id': self.id,
                'default_subject_id': self.subject_ids[0].id if self.subject_ids else False,
                'default_batch_id': self.batch_ids[0].id if self.batch_ids else False,
                'default_faculty_id': self.main_teacher_id.id
            }
        }
    
    def action_view_attendance(self):
        """Voir les présences"""
        self.ensure_one()
        
        # Récupérer toutes les sessions
        session_ids = self.session_ids.ids
        
        return {
            'name': _('Présences - %s') % self.name,
            'type': 'ir.actions.act_window',
            'res_model': 'op.attendance.sheet',
            'view_mode': 'tree,form,pivot',
            'domain': [('session_id', 'in', session_ids)],
            'context': {
                'search_default_group_by_date': True,
                'search_default_current_month': True
            }
        }
    
    def action_generate_timetable(self):
        """Générer l'emploi du temps"""
        self.ensure_one()
        
        # Ouvrir l'assistant de génération d'emploi du temps
        return {
            'name': _('Générer l\'emploi du temps'),
            'type': 'ir.actions.act_window',
            'res_model': 'generate.timetable.wizard',
            'view_mode': 'form',
            'target': 'new',
            'context': {
                'default_course_id': self.id,
                'default_batch_ids': [(6, 0, self.batch_ids.ids)],
                'default_faculty_id': self.main_teacher_id.id
            }
        }
    
    # ==================== MÉTHODES PRIVÉES ====================
    
    def _create_sessions(self):
        """Créer automatiquement les sessions selon le planning"""
        # TODO: Implémenter la création automatique des sessions
        # selon les jours de la semaine et la période définie
        pass
    
    @api.onchange('education_level')
    def _onchange_education_level(self):
        """Réinitialiser les champs dépendants du niveau"""
        if self.education_level:
            # Réinitialiser l'année scolaire si elle n'est pas compatible
            valid_years = {
                'maternelle': ['ps', 'ms', 'gs'],
                'primaire': ['cp', 'ce1', 'ce2', 'cm1', 'cm2'],
                'college': ['6eme', '5eme', '4eme', '3eme'],
                'lycee': ['2nde', '1ere', 'term']
            }
            
            if self.class_level not in valid_years.get(self.education_level, []):
                self.class_level = False
            
            # Réinitialiser la filière si pas lycée
            if self.education_level != 'lycee':
                self.track = False
    
    @api.onchange('class_level')
    def _onchange_class_level(self):
        """Adapter les options selon l'année"""
        if self.class_level:
            # Pour les classes de lycée uniquement
            if self.class_level in ['2nde']:
                self.track = 'generale'  # Seconde générale par défaut
            elif self.class_level not in ['1ere', 'term']:
                self.track = False