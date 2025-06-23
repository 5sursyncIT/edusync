# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
import random
import string

class LibraryCategory(models.Model):
    """Héritage du modèle de tag OpenEduCat pour les catégories"""
    _inherit = 'op.tag'
    _description = 'Catégorie de Livre'

    # Champs supplémentaires pour notre gestion de catégories
    color = fields.Char('Couleur', default='#1976d2', help='Couleur hex pour l\'affichage')
    parent_id = fields.Many2one('op.tag', 'Catégorie Parent')
    child_ids = fields.One2many('op.tag', 'parent_id', 'Sous-catégories')
    book_count = fields.Integer('Nombre de Livres', compute='_compute_book_count')

    @api.depends('name')
    def _compute_book_count(self):
        for category in self:
            category.book_count = self.env['op.media'].search_count([
                ('tags', 'in', category.id)
            ])

    @api.constrains('parent_id')
    def _check_recursion(self):
        if not self._check_recursion():
            raise ValidationError(_('Erreur! Vous ne pouvez pas créer de catégories récursives.'))


class LibraryAuthor(models.Model):
    """Héritage du modèle auteur OpenEduCat"""
    _inherit = 'op.author'
    _description = 'Auteur de Bibliothèque'

    # Champs supplémentaires pour notre gestion d'auteurs
    first_name = fields.Char('Prénom')
    last_name = fields.Char('Nom de Famille')
    biography = fields.Text('Biographie')
    birth_date = fields.Date('Date de Naissance')
    death_date = fields.Date('Date de Décès')
    nationality = fields.Many2one('res.country', 'Nationalité')
    website = fields.Url('Site Web')
    photo = fields.Binary('Photo')
    book_count = fields.Integer('Nombre de Livres', compute='_compute_book_count')

    @api.depends('media_ids')
    def _compute_book_count(self):
        for author in self:
            author.book_count = len(author.media_ids)

    @api.constrains('birth_date', 'death_date')
    def _check_dates(self):
        for author in self:
            if author.birth_date and author.death_date:
                if author.birth_date > author.death_date:
                    raise ValidationError(_('La date de décès ne peut pas être antérieure à la date de naissance.'))


class LibraryBook(models.Model):
    """Héritage du modèle média OpenEduCat pour les livres"""
    _inherit = 'op.media'
    _description = 'Livre de Bibliothèque'

    # Champs supplémentaires pour notre gestion de livres
    subtitle = fields.Char('Sous-titre')
    language = fields.Selection([
        ('fr', 'Français'),
        ('en', 'Anglais'),
        ('es', 'Espagnol'),
        ('de', 'Allemand'),
        ('ar', 'Arabe'),
        ('other', 'Autre')
    ], 'Langue', default='fr')
    pages = fields.Integer('Nombre de Pages')
    publication_date = fields.Date('Date de Publication')
    
    # Gestion physique
    barcode = fields.Char('Code-barres', copy=False)
    location_rack = fields.Char('Rayon')
    location_shelf = fields.Char('Étagère')
    total_copies = fields.Integer('Exemplaires Total', default=1, required=True)
    available_copies = fields.Integer('Exemplaires Disponibles', compute='_compute_available_copies', store=True)
    
    # Statut et métadonnées
    state = fields.Selection([
        ('available', 'Disponible'),
        ('borrowed', 'Emprunté'),
        ('reserved', 'Réservé'),
        ('maintenance', 'Maintenance'),
        ('lost', 'Perdu')
    ], 'Statut', default='available', compute='_compute_state', store=True)
    
    acquisition_date = fields.Date('Date d\'Acquisition', default=fields.Date.today)
    price = fields.Float('Prix d\'Achat')
    supplier = fields.Char('Fournisseur')
    notes = fields.Text('Notes')
    
    # Images et fichiers
    cover_image = fields.Binary('Image de Couverture')
    pdf_file = fields.Binary('Fichier PDF')
    pdf_filename = fields.Char('Nom du Fichier PDF')
    
    # Relations avec les modèles OpenEduCat
    borrowing_ids = fields.One2many('op.media.movement', 'media_id', 'Emprunts')
    reservation_ids = fields.One2many('op.media.queue', 'media_id', 'Réservations')
    
    # Statistiques
    borrow_count = fields.Integer('Nombre d\'Emprunts', compute='_compute_borrow_count', store=True)
    average_rating = fields.Float('Note Moyenne', compute='_compute_average_rating')

    @api.model
    def create(self, vals):
        if not vals.get('barcode'):
            vals['barcode'] = self._generate_barcode()
        return super().create(vals)

    def _generate_barcode(self):
        """Génère un code-barres unique"""
        while True:
            barcode = ''.join(random.choices(string.digits, k=12))
            if not self.search([('barcode', '=', barcode)]):
                return barcode

    @api.depends('movement_line')
    def _compute_available_copies(self):
        for book in self:
            borrowed_count = len(book.movement_line.filtered(lambda m: m.state in ['issue', 'reserve']))
            book.available_copies = max(0, book.total_copies - borrowed_count)

    @api.depends('available_copies', 'total_copies')
    def _compute_state(self):
        for book in self:
            if book.available_copies == 0 and book.total_copies > 0:
                # Vérifier s'il y a des réservations
                if book.queue_ids.filtered(lambda q: q.state == 'waiting'):
                    book.state = 'reserved'
                else:
                    book.state = 'borrowed'
            elif book.available_copies > 0:
                book.state = 'available'
            else:
                book.state = 'maintenance'

    @api.depends('movement_line')
    def _compute_borrow_count(self):
        for book in self:
            book.borrow_count = len(book.movement_line)

    def _compute_average_rating(self):
        # TODO: Implémenter le système de notation
        for book in self:
            book.average_rating = 0.0

    @api.constrains('total_copies')
    def _check_copies(self):
        for book in self:
            if book.total_copies < 1:
                raise ValidationError(_('Le nombre d\'exemplaires doit être au moins de 1.'))

    def action_borrow(self):
        """Action pour emprunter le livre"""
        return {
            'name': _('Nouvel Emprunt'),
            'type': 'ir.actions.act_window',
            'res_model': 'op.media.movement',
            'view_mode': 'form',
            'context': {'default_media_id': self.id},
            'target': 'new'
        }

    def action_reserve(self):
        """Action pour réserver le livre"""
        return {
            'name': _('Nouvelle Réservation'),
            'type': 'ir.actions.act_window',
            'res_model': 'op.media.queue',
            'view_mode': 'form',
            'context': {'default_media_id': self.id},
            'target': 'new'
        }


# Héritage pour étendre les fonctionnalités d'emprunt OpenEduCat
class LibraryBorrowing(models.Model):
    """Extension du modèle de mouvement de média OpenEduCat"""
    _inherit = 'op.media.movement'
    _description = 'Emprunt de Livre'

    # Champs supplémentaires pour notre gestion d'emprunts
    notes = fields.Text('Notes')
    renewal_count = fields.Integer('Nombre de Renouvellements', default=0)
    max_renewals = fields.Integer('Renouvellements Maximum', default=2)
    
    def action_renew(self):
        """Renouveler l'emprunt"""
        for record in self:
            if record.renewal_count >= record.max_renewals:
                raise ValidationError(_('Nombre maximum de renouvellements atteint.'))
            
            # Prolonger la date de retour de 14 jours
            from datetime import timedelta
            record.return_date = record.return_date + timedelta(days=14)
            record.renewal_count += 1
            
        return True


# Extension du modèle de queue pour les réservations
class LibraryReservation(models.Model):
    """Extension du modèle de queue OpenEduCat pour les réservations"""
    _inherit = 'op.media.queue'
    _description = 'Réservation de Livre'
    
    # Champs supplémentaires pour notre gestion de réservations
    expiry_date = fields.Date('Date d\'Expiration')
    notification_sent = fields.Boolean('Notification Envoyée', default=False)
    notes = fields.Text('Notes')
    
    @api.model
    def create(self, vals):
        # Définir une date d'expiration automatique (7 jours)
        if not vals.get('expiry_date'):
            from datetime import timedelta
            vals['expiry_date'] = fields.Date.today() + timedelta(days=7)
        return super().create(vals) 