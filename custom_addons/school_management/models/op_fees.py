# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import UserError, ValidationError
from datetime import datetime, date


class OpFeesTerms(models.Model):
    """Héritage du modèle des termes de frais pour school_management"""
    _inherit = "op.fees.terms"

    # Champs additionnels pour school_management
    school_year_id = fields.Many2one(
        'op.academic.year', 
        string='Année Scolaire',
        help="Année scolaire pour ces termes de frais"
    )
    is_mandatory = fields.Boolean(
        string='Frais Obligatoires',
        default=True,
        help="Si coché, ces frais sont obligatoires pour tous les étudiants"
    )
    payment_method = fields.Selection([
        ('cash', 'Espèces'),
        ('bank_transfer', 'Virement Bancaire'),
        ('check', 'Chèque'),
        ('card', 'Carte'),
        ('mobile_money', 'Mobile Money')
    ], string='Méthode de Paiement Préférée')
    
    late_fee_amount = fields.Float(
        string='Montant Frais de Retard',
        default=50.0,
        help="Montant des frais de retard appliqués en cas de paiement tardif"
    )

    @api.constrains('late_fee_amount')
    def _check_late_fee_amount(self):
        for record in self:
            if record.late_fee_amount < 0:
                raise ValidationError(_("Le montant des frais de retard ne peut pas être négatif."))


class OpStudentFeesDetails(models.Model):
    """Héritage du modèle des détails de frais des étudiants"""
    _inherit = "op.student.fees.details"

    # Champs additionnels pour school_management
    payment_method = fields.Selection([
        ('cash', 'Espèces'),
        ('bank_transfer', 'Virement Bancaire'),
        ('check', 'Chèque'),
        ('card', 'Carte'),
        ('mobile_money', 'Mobile Money')
    ], string='Méthode de Paiement')
    
    payment_reference = fields.Char(
        string='Référence de Paiement',
        help="Numéro de référence du paiement (chèque, virement, etc.)"
    )
    
    is_late = fields.Boolean(
        string='Paiement en Retard',
        compute='_compute_is_late',
        store=True
    )
    
    late_fee_applied = fields.Float(
        string='Frais de Retard Appliqués',
        default=0.0
    )
    
    payment_deadline = fields.Date(
        string='Date Limite de Paiement',
        help="Date limite pour le paiement de ces frais"
    )
    
    # Suppression du champ parent_id qui causait le conflit
    # Le champ parent_ids existe déjà dans OpenEduCat via student_id.parent_ids

    @api.depends('date', 'payment_deadline')
    def _compute_is_late(self):
        for record in self:
            if record.payment_deadline and record.date:
                record.is_late = record.date > record.payment_deadline
            else:
                record.is_late = False

    def apply_late_fee(self):
        """Appliquer les frais de retard"""
        for record in self:
            if record.is_late and record.fees_line_id.fees_id.late_fee_amount > 0:
                record.late_fee_applied = record.fees_line_id.fees_id.late_fee_amount
                record.amount += record.late_fee_applied

    @api.model
    def create(self, vals):
        """Surcharge de la création pour vérifier les frais de retard"""
        record = super(OpStudentFeesDetails, self).create(vals)
        if record.is_late:
            record.apply_late_fee()
        return record


class OpStudent(models.Model):
    """Héritage du modèle étudiant pour les frais"""
    _inherit = "op.student"

    # Champs calculés pour les frais
    total_fees_amount = fields.Float(
        string='Montant Total des Frais',
        compute='_compute_fees_amounts',
        store=True
    )
    
    paid_fees_amount = fields.Float(
        string='Montant Payé',
        compute='_compute_fees_amounts',
        store=True
    )
    
    outstanding_fees_amount = fields.Float(
        string='Montant Impayé',
        compute='_compute_fees_amounts',
        store=True
    )
    
    fees_status = fields.Selection([
        ('paid', 'Payé'),
        ('partial', 'Partiellement Payé'),
        ('unpaid', 'Impayé'),
        ('overdue', 'En Retard')
    ], string='Statut des Frais', compute='_compute_fees_status', store=True)

    @api.depends('fees_detail_ids.amount', 'fees_detail_ids.state')
    def _compute_fees_amounts(self):
        for student in self:
            total = 0.0
            paid = 0.0
            
            for fee_detail in student.fees_detail_ids:
                total += fee_detail.amount
                if fee_detail.state == 'invoice' and fee_detail.invoice_state == 'posted':
                    paid += fee_detail.amount
            
            student.total_fees_amount = total
            student.paid_fees_amount = paid
            student.outstanding_fees_amount = total - paid

    @api.depends('outstanding_fees_amount', 'fees_detail_ids.is_late')
    def _compute_fees_status(self):
        for student in self:
            if student.outstanding_fees_amount == 0:
                student.fees_status = 'paid'
            elif student.outstanding_fees_amount == student.total_fees_amount:
                # Vérifier s'il y a des paiements en retard
                if any(fee.is_late for fee in student.fees_detail_ids):
                    student.fees_status = 'overdue'
                else:
                    student.fees_status = 'unpaid'
            else:
                student.fees_status = 'partial'

    def generate_fees_for_student(self):
        """Générer les frais pour un étudiant basé sur son cours"""
        for student in self:
            if not student.course_detail_ids:
                raise UserError(_("L'étudiant doit être inscrit à au moins un cours."))
            
            for course_detail in student.course_detail_ids:
                if course_detail.fees_term_id:
                    fees_term = course_detail.fees_term_id
                    
                    # Créer les détails de frais pour chaque ligne de terme
                    for term_line in fees_term.line_ids:
                        # Vérifier si les frais n'existent pas déjà
                        existing_fees = self.env['op.student.fees.details'].search([
                            ('student_id', '=', student.id),
                            ('fees_line_id', '=', term_line.id)
                        ])
                        
                        if not existing_fees:
                            # Calculer le montant basé sur les éléments de frais
                            amount = 0.0
                            product_id = False
                            
                            for element in term_line.fees_element_line:
                                amount += element.product_id.list_price * (element.value / 100)
                                if not product_id:
                                    product_id = element.product_id.id
                            
                            if not product_id and term_line.fees_element_line:
                                product_id = term_line.fees_element_line[0].product_id.id
                            
                            # Créer le détail de frais
                            self.env['op.student.fees.details'].create({
                                'student_id': student.id,
                                'fees_line_id': term_line.id,
                                'amount': amount or 100.0,  # Montant par défaut si pas d'éléments
                                'product_id': product_id,
                                'course_id': course_detail.course_id.id,
                                'batch_id': course_detail.batch_id.id,
                                'state': 'draft',
                                'date': course_detail.fees_start_date or fields.Date.today(),
                            })


class OpCourse(models.Model):
    """Héritage du modèle cours pour les frais"""
    _inherit = "op.course"

    # Montant total des frais pour le cours
    total_fees_amount = fields.Float(
        string='Montant Total des Frais',
        compute='_compute_total_fees',
        help="Montant total des frais pour ce cours"
    )

    @api.depends('fees_term_id.line_ids')
    def _compute_total_fees(self):
        for course in self:
            total = 0.0
            if course.fees_term_id:
                for line in course.fees_term_id.line_ids:
                    for element in line.fees_element_line:
                        total += element.product_id.list_price * (element.value / 100)
            course.total_fees_amount = total


class OpFeesElement(models.Model):
    """Héritage du modèle élément de frais"""
    _inherit = "op.fees.element"

    # Champs additionnels
    is_optional = fields.Boolean(
        string='Optionnel',
        default=False,
        help="Si coché, cet élément de frais est optionnel"
    )
    
    description = fields.Text(
        string='Description',
        help="Description détaillée de cet élément de frais"
    ) 