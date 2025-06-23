# -*- coding: utf-8 -*-

from odoo import models, fields, api

class OpFaculty(models.Model):
    _inherit = 'op.faculty'

    # Champ pour la date d'embauche
    joining_date = fields.Date(
        string="Date d'embauche",
        help="Date à laquelle l'enseignant a rejoint l'établissement"
    )

    subject_ids = fields.Many2many(
        'op.subject',
        'faculty_subject_rel',
        'faculty_id',
        'subject_id',
        string='Matières enseignées'
    ) 