from odoo import models, fields, api
import logging

_logger = logging.getLogger(__name__)

class OpStudent(models.Model):
    _inherit = 'op.student'

    school_level = fields.Selection([
        ('primary', 'Primaire'),
        ('middle', 'Collège'),
        ('high', 'Lycée')
    ], string='Niveau Scolaire', tracking=True)
    
    is_scholarship = fields.Boolean('Boursier', default=False)
    scholarship_type = fields.Selection([
        ('full', 'Complète'),
        ('partial', 'Partielle')
    ], string='Type de Bourse')
    
    transport_needed = fields.Boolean('Transport Scolaire', default=False)
    school_insurance = fields.Boolean('Assurance Scolaire', default=False)
    
    # Champs pour la gestion des noms
    first_name = fields.Char('Prénom', required=True, tracking=True)
    middle_name = fields.Char('Deuxième Prénom', tracking=True)
    last_name = fields.Char('Nom de Famille', required=True, tracking=True)
    
    # Redéfinir le champ name pour qu'il soit calculé automatiquement (sans store=True)
    name = fields.Char(
        'Nom Complet',
        compute='_compute_name',
        tracking=True,
        help="Nom complet généré automatiquement à partir du prénom et nom de famille"
    )

    @api.depends('first_name', 'middle_name', 'last_name')
    def _compute_name(self):
        """Calculer le nom complet à partir des composants"""
        for record in self:
            record.name = record._build_name(
                record.first_name or '',
                record.middle_name or '',
                record.last_name or ''
            )

    def _build_name(self, first_name, middle_name, last_name):
        """Construire le nom complet à partir des composants"""
        name_parts = [part.strip() for part in [first_name, middle_name, last_name] if part and part.strip()]
        return ' '.join(name_parts) if name_parts else 'Nom Incomplet'

    @api.model_create_multi
    def create(self, vals_list):
        """Override create to automatically build name from first_name, middle_name, last_name"""
        for vals in vals_list:
            if not vals.get('name') and (vals.get('first_name') or vals.get('last_name')):
                vals['name'] = self._build_name(
                    vals.get('first_name', ''),
                    vals.get('middle_name', ''),
                    vals.get('last_name', '')
                )
        return super(OpStudent, self).create(vals_list)

    def write(self, vals):
        """Override write to automatically update name when name parts change"""
        if any(field in vals for field in ['first_name', 'middle_name', 'last_name']):
            for record in self:
                # Récupérer les nouvelles valeurs ou les valeurs existantes
                first_name = vals.get('first_name', record.first_name or '')
                middle_name = vals.get('middle_name', record.middle_name or '')
                last_name = vals.get('last_name', record.last_name or '')
                
                # Construire le nouveau nom
                vals['name'] = self._build_name(first_name, middle_name, last_name)
        
        return super(OpStudent, self).write(vals)

class OpStudentExtended(models.Model):
    _inherit = 'op.student'

    # Champs calculés pour les parents (sans store=True pour éviter les erreurs DB)
    primary_parent_id = fields.Many2one(
        'op.parent', 
        string='Parent Principal',
        compute='_compute_primary_parent',
        help="Parent principal (père ou mère selon disponibilité)"
    )
    
    parent_names = fields.Char(
        string='Noms des Parents',
        compute='_compute_parent_names',
        help="Noms de tous les parents séparés par des virgules"
    )
    
    parent_phones = fields.Char(
        string='Téléphones des Parents',
        compute='_compute_parent_phones',
        help="Numéros de téléphone des parents"
    )
    
    parent_emails = fields.Char(
        string='Emails des Parents',
        compute='_compute_parent_emails',
        help="Adresses email des parents"
    )
    
    has_parents = fields.Boolean(
        string='A des Parents',
        compute='_compute_has_parents',
        help="Indique si l'étudiant a au moins un parent enregistré"
    )

    @api.depends('parent_ids')
    def _compute_primary_parent(self):
        """Calculer le parent principal (priorité: père, puis mère, puis premier disponible)"""
        for student in self:
            primary_parent = False
            if student.parent_ids:
                # Chercher d'abord le père
                father = student.parent_ids.filtered(
                    lambda p: p.relationship_id.name and 'père' in p.relationship_id.name.lower()
                )
                if father:
                    primary_parent = father[0]
                else:
                    # Puis la mère
                    mother = student.parent_ids.filtered(
                        lambda p: p.relationship_id.name and 'mère' in p.relationship_id.name.lower()
                    )
                    if mother:
                        primary_parent = mother[0]
                    else:
                        # Sinon le premier parent disponible
                        primary_parent = student.parent_ids[0]
            student.primary_parent_id = primary_parent

    @api.depends('parent_ids')
    def _compute_parent_names(self):
        """Calculer les noms de tous les parents"""
        for student in self:
            names = []
            for parent in student.parent_ids:
                if parent.name and parent.name.name:
                    relationship = parent.relationship_id.name if parent.relationship_id else ''
                    name_with_relation = f"{parent.name.name} ({relationship})" if relationship else parent.name.name
                    names.append(name_with_relation)
            student.parent_names = ', '.join(names) if names else ''

    @api.depends('parent_ids')
    def _compute_parent_phones(self):
        """Calculer les téléphones des parents"""
        for student in self:
            phones = []
            for parent in student.parent_ids:
                if parent.mobile:
                    phones.append(parent.mobile)
            student.parent_phones = ', '.join(phones) if phones else ''

    @api.depends('parent_ids')
    def _compute_parent_emails(self):
        """Calculer les emails des parents"""
        for student in self:
            emails = []
            for parent in student.parent_ids:
                if parent.name and parent.name.email:
                    emails.append(parent.name.email)
            student.parent_emails = ', '.join(emails) if emails else ''

    @api.depends('parent_ids')
    def _compute_has_parents(self):
        """Calculer si l'étudiant a des parents"""
        for student in self:
            student.has_parents = bool(student.parent_ids)

    def get_parent_for_fees(self):
        """
        Retourner le parent à utiliser pour les frais (parent principal)
        """
        self.ensure_one()
        # Recalculer le parent principal
        self._compute_primary_parent()
        if self.primary_parent_id:
            return {
                'id': self.primary_parent_id.id,
                'name': self.primary_parent_id.name.name if self.primary_parent_id.name else '',
                'mobile': self.primary_parent_id.mobile or '',
                'email': self.primary_parent_id.name.email if self.primary_parent_id.name else '',
                'relationship': self.primary_parent_id.relationship_id.name if self.primary_parent_id.relationship_id else ''
            }
        return {
            'id': None,
            'name': '',
            'mobile': '',
            'email': '',
            'relationship': ''
        }

    def get_all_parents_info(self):
        """
        Retourner les informations de tous les parents
        """
        self.ensure_one()
        parents_info = []
        for parent in self.parent_ids:
            parents_info.append({
                'id': parent.id,
                'name': parent.name.name if parent.name else '',
                'mobile': parent.mobile or '',
                'email': parent.name.email if parent.name else '',
                'relationship': parent.relationship_id.name if parent.relationship_id else '',
                'user_id': parent.user_id.id if parent.user_id else None,
                'has_portal_access': bool(parent.user_id and parent.user_id.has_group('base.group_portal'))
            })
        return parents_info

    @api.model
    def create_parent_for_student(self, student_id, parent_data):
        """
        Créer un nouveau parent pour un étudiant
        """
        try:
            # Créer d'abord le partner
            partner_vals = {
                'name': parent_data.get('name'),
                'mobile': parent_data.get('mobile', ''),
                'email': parent_data.get('email', ''),
                'is_company': False,
                'is_parent': True,
            }
            partner = self.env['res.partner'].create(partner_vals)
            
            # Créer le parent
            parent_vals = {
                'name': partner.id,
                'student_ids': [(6, 0, [student_id])],
                'relationship_id': parent_data.get('relationship_id'),
            }
            parent = self.env['op.parent'].create(parent_vals)
            
            return {
                'success': True,
                'parent_id': parent.id,
                'message': 'Parent créé avec succès'
            }
        except Exception as e:
            _logger.error(f"Erreur lors de la création du parent: {str(e)}")
            return {
                'success': False,
                'message': f'Erreur: {str(e)}'
            } 