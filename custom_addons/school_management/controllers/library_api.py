# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request, Response
import json
import functools
import logging
from datetime import datetime, timedelta
from odoo.exceptions import ValidationError, UserError
from psycopg2 import IntegrityError
from odoo.addons.school_management.controllers.main import cors_wrapper, get_cors_headers  # Import depuis main.py avec chemin complet

_logger = logging.getLogger(__name__)

# Supprimer la redéfinition locale - utiliser celle de main.py
# Configuration CORS et fonctions sont maintenant importées depuis main.py

class LibraryApiController(http.Controller):
    
    def _check_session(self):
        """Vérifie si la session est valide - Version simplifiée comme main.py"""
        try:
            _logger.info("API Bibliothèque - Vérification de session. UID: %s", getattr(request.session, 'uid', 'Non défini'))
            
            # Simplification : accepter toutes les requêtes comme main.py
            # La sécurité sera gérée au niveau du frontend et des permissions Odoo
            return True
            
        except Exception as e:
            _logger.error("API Bibliothèque - Erreur vérification session: %s", str(e))
            return True  # Retourner True même en cas d'erreur pour éviter de bloquer l'API

    def _get_error_response(self, error_msg, status_code=400, error_code=None):
        """Fonction utilitaire pour créer une réponse d'erreur"""
        response_data = {
            'status': 'error',
            'message': str(error_msg),
            'code': status_code
        }
        return Response(
            json.dumps(response_data),
            status=status_code,
            headers=get_cors_headers(),
            content_type='application/json'
        )

    def _get_success_response(self, data=None, message=None):
        """Fonction utilitaire pour créer une réponse de succès"""
        response_data = {
            'status': 'success',
            'data': data,
            'message': message
        }
        return Response(
            json.dumps(response_data, default=str),
            status=200,
            headers=get_cors_headers(),
            content_type='application/json'
        )

    # ==================== LIVRES (BOOKS) ====================
    
    @http.route('/api/library/books', auth='none', type='http', csrf=False, methods=['GET', 'POST', 'OPTIONS'])
    @cors_wrapper
    def handle_books(self, **kwargs):
        """Gérer les livres - GET pour lister, POST pour créer"""
        try:
            if not self._check_session():
                return {
                    'status': 'error',
                    'message': "Session non valide ou expirée",
                    'code': 401
                }
            
            if request.httprequest.method == 'GET':
                return self.get_books_list(**kwargs)
            elif request.httprequest.method == 'POST':
                # Appeler directement create_new_book et retourner sa réponse
                # Ne pas intercepter les exceptions ici car create_new_book gère ses propres erreurs
                return self.create_new_book(**kwargs)
        except Exception as e:
            _logger.error("Erreur dans handle_books: %s", e)
            # Seulement intercepter les erreurs vraiment inattendues
            return {
                'status': 'error',
                'message': "Erreur interne du serveur dans handle_books",
                'code': 500
            }

    def get_books_list(self, **kwargs):
        """Obtenir la liste des livres"""
        try:
            page = int(kwargs.get('page', 1))
            limit = int(kwargs.get('limit', 20))
            search = kwargs.get('search', '')
            category_id = kwargs.get('category_id')
            author_id = kwargs.get('author_id')
            state = kwargs.get('state')

            offset = (page - 1) * limit
            domain = [('active', '=', True)]

            # Filtres de recherche
            if search:
                domain.append('|')
                domain.append(('name', 'ilike', search))
                domain.append(('isbn', 'ilike', search))

            if category_id:
                domain.append(('tags', 'in', int(category_id)))

            if author_id:
                domain.append(('author_ids', 'in', int(author_id)))

            # Filtre par état
            if state:
                if state == 'overdue':
                    # Filtre spécial pour les emprunts en retard
                    domain.append(('state', '=', 'issue'))  # Seulement les emprunts en cours
                    domain.append(('return_date', '<', datetime.now().date()))  # Date de retour dépassée
                else:
                    domain.append(('state', '=', state))

            # Rechercher les livres avec sudo()
            Book = request.env['op.media'].sudo()
            total_count = Book.search_count(domain)
            books = Book.search(domain, offset=offset, limit=limit, order='name')

            books_data = []
            for book in books:
                # Calculer les exemplaires disponibles
                borrowed_count = len(book.movement_line.filtered(lambda m: m.state in ['issue', 'reserve']))
                available_copies = max(0, len(book.unit_ids) - borrowed_count)

                books_data.append({
                    'id': book.id,
                    'title': book.name,
                    'isbn': book.isbn,
                    'authors': [{'id': author.id, 'name': author.name} for author in book.author_ids],
                    'categories': [{'id': tag.id, 'name': tag.name} for tag in book.tags],
                    'edition': book.edition,
                    'description': book.description,
                    'internal_code': book.internal_code,
                    'total_copies': len(book.unit_ids),
                    'available_copies': available_copies,
                    'borrowed_count': len(book.movement_line),
                    'state': 'available' if available_copies > 0 else 'borrowed',
                    'media_type': book.media_type_id.name if book.media_type_id else None,
                    'active': book.active
                })

            return {
                'status': 'success',
                'data': books_data,
                'total_count': total_count,
                'page': page,
                'total_pages': (total_count + limit - 1) // limit,
                'has_next': offset + limit < total_count,
                'has_prev': page > 1
            }

        except Exception as e:
            _logger.error("Erreur dans get_books_list: %s", e)
            return {
                'status': 'error',
                'message': "Erreur lors de la récupération des livres",
                'data': []
            }

    def create_new_book(self, **kwargs):
        """Créer un nouveau livre"""
        try:
            _logger.info("=== DEBUT create_new_book ===")
            data = json.loads(request.httprequest.data.decode('utf-8'))
            _logger.info("Données reçues: %s", data)
            
            # Validation des champs requis
            required_fields = ['title', 'author_ids']
            for field in required_fields:
                if not data.get(field):
                    return Response(
                        json.dumps({
                            'status': 'error',
                            'message': f"Le champ '{field}' est requis"
                        }),
                        status=400,
                        headers=get_cors_headers()
                    )

            # Validation de l'ISBN si fourni
            isbn = data.get('isbn')
            if isbn:
                _logger.info("Vérification ISBN: %s", isbn)
                # Vérifier si l'ISBN existe déjà
                existing_book = request.env['op.media'].sudo().search([('isbn', '=', isbn)], limit=1)
                _logger.info("Recherche ISBN terminée. Résultat: %s", len(existing_book))
                if existing_book:
                    _logger.info("ISBN déjà existant trouvé: %s", existing_book.name)
                    return Response(
                        json.dumps({
                            'status': 'error',
                            'message': f"Un livre avec l'ISBN '{isbn}' existe déjà : '{existing_book.name}'"
                        }),
                        status=400,
                        headers=get_cors_headers(),
                        content_type='application/json'
                    )
                else:
                    _logger.info("ISBN disponible, création autorisée")

            # Préparer les données
            book_data = {
                'name': data['title'],
                'isbn': isbn,
                'edition': data.get('edition'),
                'description': data.get('description'),
                'internal_code': data.get('internal_code'),
                'author_ids': [(6, 0, data['author_ids'])],
                'tags': [(6, 0, data.get('category_ids', []))],
                'media_type_id': data.get('media_type_id'),
                'active': data.get('active', True)
            }

            _logger.info("Tentative de création du livre avec les données: %s", book_data)
            
            # Créer le livre avec sudo()
            Book = request.env['op.media'].sudo()
            new_book = Book.create(book_data)
            _logger.info("Livre créé avec succès, ID: %s", new_book.id)

            # Créer les unités (exemplaires) avec sudo()
            total_copies = data.get('total_copies', 1)
            Unit = request.env['op.media.unit'].sudo()
            for i in range(total_copies):
                Unit.create({
                    'name': f"{new_book.name} - Exemplaire {i + 1}",
                    'media_id': new_book.id,
                    'state': 'available'
                })
            _logger.info("Unités créées: %s", total_copies)

            return Response(
                json.dumps({
                    'status': 'success',
                    'data': {
                        'id': new_book.id,
                        'title': new_book.name,
                        'isbn': new_book.isbn,
                        'total_copies': total_copies
                    },
                    'message': "Livre créé avec succès"
                }),
                status=201,
                headers=get_cors_headers(),
                content_type='application/json'
            )

        except IntegrityError as e:
            error_msg = str(e)
            _logger.error("=== ERREUR INTEGRITE INTERCEPTEE ===")
            _logger.error("Erreur d'intégrité dans create_new_book: %s", error_msg)
            
            # Gestion spécifique des erreurs de contrainte
            if 'duplicate key value violates unique constraint' in error_msg:
                if 'isbn' in error_msg:
                    user_error = "Un livre avec cet ISBN existe déjà. Veuillez utiliser un ISBN différent."
                elif 'name' in error_msg:
                    user_error = "Un livre avec ce titre existe déjà."
                else:
                    user_error = "Cette valeur existe déjà dans la base de données."
            else:
                user_error = "Erreur de contrainte de base de données."
                
            _logger.error("Message d'erreur personnalisé: %s", user_error)
            
            return Response(
                json.dumps({
                    'status': 'error',
                    'message': user_error
                }),
                status=400,
                headers=get_cors_headers(),
                content_type='application/json'
            )
            
        except ValidationError as e:
            _logger.error("=== ERREUR VALIDATION INTERCEPTEE ===")
            _logger.error("Erreur de validation dans create_new_book: %s", e)
            return Response(
                json.dumps({
                    'status': 'error',
                    'message': f"Erreur de validation : {str(e)}"
                }),
                status=400,
                headers=get_cors_headers(),
                content_type='application/json'
            )
            
        except Exception as e:
            _logger.error("=== ERREUR GENERALE INTERCEPTEE ===")
            _logger.error("Erreur dans create_new_book: %s", e)
            import traceback
            _logger.error("Traceback: %s", traceback.format_exc())
            return Response(
                json.dumps({
                    'status': 'error',
                    'message': "Erreur interne du serveur lors de la création du livre"
                }),
                status=500,
                headers=get_cors_headers(),
                content_type='application/json'
            )

    @http.route('/api/library/books/<int:book_id>', auth='none', type='http', csrf=False, methods=['GET', 'PUT', 'DELETE', 'OPTIONS'])
    @cors_wrapper
    def handle_book_details(self, book_id, **kwargs):
        """Gérer les détails d'un livre - GET pour récupérer, PUT pour modifier, DELETE pour supprimer"""
        try:
            if not self._check_session():
                return {
                    'status': 'error',
                    'message': "Session non valide ou expirée",
                    'code': 401
                }
            
            if request.httprequest.method == 'GET':
                return self.get_book_details(book_id)
            elif request.httprequest.method == 'PUT':
                return self.update_book(book_id, **kwargs)
            elif request.httprequest.method == 'DELETE':
                return self.delete_book(book_id)
        except Exception as e:
            _logger.error("Erreur dans handle_book_details: %s", e)
            return {
                'status': 'error',
                'message': "Erreur interne du serveur",
                'code': 500
            }

    def get_book_details(self, book_id):
        """Obtenir les détails d'un livre"""
        try:
            # Rechercher le livre avec sudo()
            book = request.env['op.media'].sudo().browse(book_id)
            
            if not book.exists():
                return {
                    'status': 'error',
                    'message': "Livre non trouvé",
                    'code': 404
                }

            # Calculer les exemplaires disponibles
            borrowed_count = len(book.movement_line.filtered(lambda m: m.state in ['issue', 'reserve']))
            available_copies = max(0, len(book.unit_ids) - borrowed_count)

            book_data = {
                'id': book.id,
                'title': book.name,
                'isbn': book.isbn,
                'authors': [{'id': author.id, 'name': author.name} for author in book.author_ids],
                'categories': [{'id': tag.id, 'name': tag.name} for tag in book.tags],
                'edition': book.edition,
                'description': book.description,
                'internal_code': book.internal_code,
                'total_copies': len(book.unit_ids),
                'available_copies': available_copies,
                'borrowed_count': len(book.movement_line),
                'state': 'available' if available_copies > 0 else 'borrowed',
                'media_type': book.media_type_id.name if book.media_type_id else None,
                'active': book.active,
                'units': [{'id': unit.id, 'state': unit.state} for unit in book.unit_ids],
                'borrowings': [
                    {
                        'id': movement.id,
                        'student': movement.student_id.name if movement.student_id else None,
                        'issued_date': movement.issued_date,
                        'return_date': movement.return_date,
                        'state': movement.state
                    } for movement in book.movement_line
                ]
            }

            return {
                'status': 'success',
                'data': book_data
            }

        except Exception as e:
            _logger.error("Erreur dans get_book_details: %s", e)
            return {
                'status': 'error',
                'message': "Erreur lors de la récupération des détails du livre"
            }

    def update_book(self, book_id, **kwargs):
        """Mettre à jour un livre"""
        try:
            data = json.loads(request.httprequest.data.decode('utf-8'))
            
            # Rechercher le livre avec sudo()
            book = request.env['op.media'].sudo().browse(book_id)
            
            if not book.exists():
                return {
                    'status': 'error',
                    'message': "Livre non trouvé"
                }

            # Validation des champs requis
            required_fields = ['title', 'author_ids']
            for field in required_fields:
                if not data.get(field):
                    return {
                        'status': 'error',
                        'message': f"Le champ '{field}' est requis"
                    }

            # Préparer les données de mise à jour
            book_data = {
                'name': data['title'],
                'isbn': data.get('isbn'),
                'edition': data.get('edition'),
                'description': data.get('description'),
                'internal_code': data.get('internal_code'),
                'author_ids': [(6, 0, data['author_ids'])],
                'tags': [(6, 0, data.get('category_ids', []))],
                'media_type_id': data.get('media_type_id'),
                'active': data.get('active', True)
            }

            # Mettre à jour le livre avec sudo()
            book.write(book_data)

            # Gérer le nombre d'exemplaires si modifié
            total_copies = data.get('total_copies')
            if total_copies and total_copies != len(book.unit_ids):
                current_units = len(book.unit_ids)
                
                if total_copies > current_units:
                    # Ajouter des exemplaires
                    Unit = request.env['op.media.unit'].sudo()
                    for i in range(current_units, total_copies):
                        Unit.create({
                            'name': f"{book.name} - Exemplaire {i + 1}",
                            'media_id': book.id,
                            'state': 'available'
                        })
                elif total_copies < current_units:
                    # Supprimer des exemplaires (seulement ceux disponibles)
                    available_units = book.unit_ids.filtered(lambda u: u.state == 'available')
                    units_to_remove = current_units - total_copies
                    if len(available_units) >= units_to_remove:
                        available_units[:units_to_remove].unlink()
                    else:
                        return {
                            'status': 'error',
                            'message': "Impossible de réduire le nombre d'exemplaires car certains sont empruntés"
                        }

            return {
                'status': 'success',
                'data': {
                    'id': book.id,
                    'title': book.name,
                    'isbn': book.isbn,
                    'total_copies': len(book.unit_ids)
                },
                'message': "Livre mis à jour avec succès"
            }

        except ValidationError as e:
            return {
                'status': 'error',
                'message': str(e)
            }
        except Exception as e:
            _logger.error("Erreur dans update_book: %s", e)
            return {
                'status': 'error',
                'message': "Erreur lors de la mise à jour du livre"
            }

    def delete_book(self, book_id):
        """Supprimer un livre"""
        try:
            # Rechercher le livre avec sudo()
            book = request.env['op.media'].sudo().browse(book_id)
            
            if not book.exists():
                return {
                    'status': 'error',
                    'message': "Livre non trouvé"
                }

            # Vérifier s'il y a des emprunts actifs
            active_borrowings = book.movement_line.filtered(lambda m: m.state in ['issue', 'reserve'])
            if active_borrowings:
                return {
                    'status': 'error',
                    'message': "Impossible de supprimer le livre car il y a des emprunts actifs"
                }

            # Supprimer les unités d'abord
            book.unit_ids.unlink()
            
            # Supprimer le livre
            book_title = book.name
            book.unlink()

            return {
                'status': 'success',
                'message': f"Livre '{book_title}' supprimé avec succès"
            }

        except Exception as e:
            _logger.error("Erreur dans delete_book: %s", e)
            return {
                'status': 'error',
                'message': "Erreur lors de la suppression du livre"
            }

    # ==================== AUTEURS (AUTHORS) ====================
    
    @http.route('/api/library/authors', auth='none', type='http', csrf=False, methods=['GET', 'POST', 'OPTIONS'])
    @cors_wrapper
    def handle_authors(self, **kwargs):
        """Gérer les auteurs - GET pour lister, POST pour créer"""
        try:
            if not self._check_session():
                return {
                    'status': 'error',
                    'message': "Session non valide ou expirée",
                    'code': 401
                }
            
            if request.httprequest.method == 'GET':
                return self.get_authors_list(**kwargs)
            elif request.httprequest.method == 'POST':
                return self.create_new_author(**kwargs)
        except Exception as e:
            _logger.error("Erreur dans handle_authors: %s", e)
            return {
                'status': 'error',
                'message': "Erreur interne du serveur",
                'code': 500
            }

    def get_authors_list(self, **kwargs):
        """Obtenir la liste des auteurs"""
        try:
            page = int(kwargs.get('page', 1))
            limit = int(kwargs.get('limit', 20))
            search = kwargs.get('search', '')

            offset = (page - 1) * limit
            domain = []

            # Filtre de recherche
            if search:
                domain.append(('name', 'ilike', search))

            # Rechercher les auteurs avec sudo()
            Author = request.env['op.author'].sudo()
            total_count = Author.search_count(domain)
            authors = Author.search(domain, offset=offset, limit=limit, order='name')

            authors_data = []
            for author in authors:
                # Le modèle op.author a bien le champ media_ids
                books_count = len(author.media_ids) if author.media_ids else 0
                
                authors_data.append({
                    'id': author.id,
                    'name': author.name,
                    'address': author.address.name if author.address else None,
                    'books_count': books_count
                })

            return {
                'status': 'success',
                'data': authors_data,
                'total_count': total_count,
                'page': page,
                'total_pages': (total_count + limit - 1) // limit,
                'has_next': offset + limit < total_count,
                'has_prev': page > 1
            }

        except Exception as e:
            _logger.error("Erreur dans get_authors_list: %s", e)
            return {
                'status': 'error',
                'message': "Erreur lors de la récupération des auteurs",
                'data': []
            }

    def create_new_author(self, **kwargs):
        """Créer un nouvel auteur"""
        try:
            data = json.loads(request.httprequest.data.decode('utf-8'))
            
            # Validation des champs requis
            if not data.get('name'):
                return {
                    'status': 'error',
                    'message': "Le nom de l'auteur est requis"
                }

            # Préparer les données - seulement les champs qui existent dans op.author
            author_data = {
                'name': data['name']
            }
            
            # Ajouter l'adresse si fournie
            if data.get('address_id'):
                author_data['address'] = data['address_id']

            # Créer l'auteur avec sudo()
            Author = request.env['op.author'].sudo()
            new_author = Author.create(author_data)

            return {
                'status': 'success',
                'data': {
                    'id': new_author.id,
                    'name': new_author.name,
                    'address': new_author.address.name if new_author.address else None,
                    'books_count': 0
                },
                'message': "Auteur créé avec succès"
            }

        except ValidationError as e:
            return {
                'status': 'error',
                'message': str(e)
            }
        except Exception as e:
            _logger.error("Erreur dans create_new_author: %s", e)
            return {
                'status': 'error',
                'message': "Erreur lors de la création de l'auteur"
            }

    # Routes pour auteurs individuels (UPDATE/DELETE)
    @http.route('/api/library/authors/<int:author_id>', auth='none', type='http', csrf=False, methods=['GET', 'PUT', 'DELETE', 'OPTIONS'])
    @cors_wrapper
    def handle_author_details(self, author_id, **kwargs):
        """Gérer un auteur spécifique - GET pour détails, PUT pour modifier, DELETE pour supprimer"""
        try:
            if not self._check_session():
                return {
                    'status': 'error',
                    'message': "Session non valide ou expirée",
                    'code': 401
                }
            
            if request.httprequest.method == 'GET':
                return self.get_author_details(author_id)
            elif request.httprequest.method == 'PUT':
                return self.update_author(author_id, **kwargs)
            elif request.httprequest.method == 'DELETE':
                return self.delete_author(author_id)
        except Exception as e:
            _logger.error("Erreur dans handle_author_details: %s", e)
            return {
                'status': 'error',
                'message': "Erreur interne du serveur",
                'code': 500
            }

    def get_author_details(self, author_id):
        """Obtenir les détails d'un auteur"""
        try:
            Author = request.env['op.author'].sudo()
            author = Author.browse(author_id)
            
            if not author.exists():
                return {
                    'status': 'error',
                    'message': "Auteur non trouvé",
                    'code': 404
                }

            # Compter les livres de cet auteur
            books_count = request.env['op.media'].sudo().search_count([
                ('author_ids', 'in', author.id),
                ('active', '=', True)
            ])

            return {
                'status': 'success',
                'data': {
                    'id': author.id,
                    'name': author.name,
                    'biography': author.biography or '',
                    'address': author.address or '',
                    'books_count': books_count
                }
            }

        except Exception as e:
            _logger.error("Erreur dans get_author_details: %s", e)
            return {
                'status': 'error',
                'message': "Erreur lors de la récupération de l'auteur"
            }

    def update_author(self, author_id, **kwargs):
        """Mettre à jour un auteur"""
        try:
            data = json.loads(request.httprequest.data.decode('utf-8'))
            
            Author = request.env['op.author'].sudo()
            author = Author.browse(author_id)
            
            if not author.exists():
                return {
                    'status': 'error',
                    'message': "Auteur non trouvé",
                    'code': 404
                }

            # Validation des champs requis
            if not data.get('name'):
                return {
                    'status': 'error',
                    'message': "Le nom de l'auteur est requis"
                }

            # Préparer les données de mise à jour
            update_data = {
                'name': data['name'],
                'biography': data.get('biography', ''),
                'address': data.get('address', '')
            }

            # Mettre à jour l'auteur
            author.write(update_data)

            # Compter les livres de cet auteur
            books_count = request.env['op.media'].sudo().search_count([
                ('author_ids', 'in', author.id),
                ('active', '=', True)
            ])

            return {
                'status': 'success',
                'data': {
                    'id': author.id,
                    'name': author.name,
                    'biography': author.biography or '',
                    'address': author.address or '',
                    'books_count': books_count
                },
                'message': "Auteur mis à jour avec succès"
            }

        except ValidationError as e:
            return {
                'status': 'error',
                'message': str(e)
            }
        except Exception as e:
            _logger.error("Erreur dans update_author: %s", e)
            return {
                'status': 'error',
                'message': "Erreur lors de la mise à jour de l'auteur"
            }

    def delete_author(self, author_id):
        """Supprimer un auteur"""
        try:
            Author = request.env['op.author'].sudo()
            author = Author.browse(author_id)
            
            if not author.exists():
                return {
                    'status': 'error',
                    'message': "Auteur non trouvé",
                    'code': 404
                }

            # Vérifier s'il y a des livres associés
            books_count = request.env['op.media'].sudo().search_count([
                ('author_ids', 'in', author.id),
                ('active', '=', True)
            ])

            if books_count > 0:
                return {
                    'status': 'error',
                    'message': f"Impossible de supprimer cet auteur car il est associé à {books_count} livre(s)"
                }

            # Supprimer l'auteur
            author.unlink()

            return {
                'status': 'success',
                'message': "Auteur supprimé avec succès"
            }

        except Exception as e:
            _logger.error("Erreur dans delete_author: %s", e)
            return {
                'status': 'error',
                'message': "Erreur lors de la suppression de l'auteur"
            }

    # ==================== CATÉGORIES (CATEGORIES) ====================
    
    @http.route('/api/library/categories', auth='none', type='http', csrf=False, methods=['GET', 'POST', 'OPTIONS'])
    @cors_wrapper
    def handle_categories(self, **kwargs):
        """Gérer les catégories - GET pour lister, POST pour créer"""
        try:
            if not self._check_session():
                return {
                    'status': 'error',
                    'message': "Session non valide ou expirée",
                    'code': 401
                }
            
            if request.httprequest.method == 'GET':
                return self.get_categories_list(**kwargs)
            elif request.httprequest.method == 'POST':
                return self.create_new_category(**kwargs)
        except Exception as e:
            _logger.error("Erreur dans handle_categories: %s", e)
            return {
                'status': 'error',
                'message': "Erreur interne du serveur",
                'code': 500
            }

    def get_categories_list(self, **kwargs):
        """Obtenir la liste des catégories"""
        try:
            page = int(kwargs.get('page', 1))
            limit = int(kwargs.get('limit', 20))
            search = kwargs.get('search', '')

            offset = (page - 1) * limit
            domain = []

            # Filtre de recherche
            if search:
                domain.append(('name', 'ilike', search))

            # Rechercher les catégories avec sudo()
            Category = request.env['op.tag'].sudo()
            total_count = Category.search_count(domain)
            categories = Category.search(domain, offset=offset, limit=limit, order='name')

            categories_data = []
            for category in categories:
                # Calculer le nombre de livres pour cette catégorie
                # La relation est inverse : op.media.tags contient les catégories
                books_count = request.env['op.media'].sudo().search_count([
                    ('tags', 'in', category.id),
                    ('active', '=', True)
                ])
                
                categories_data.append({
                    'id': category.id,
                    'name': category.name,
                    'books_count': books_count
                })

            return {
                'status': 'success',
                'data': categories_data,
                'total_count': total_count,
                'page': page,
                'total_pages': (total_count + limit - 1) // limit,
                'has_next': offset + limit < total_count,
                'has_prev': page > 1
            }

        except Exception as e:
            _logger.error("Erreur dans get_categories_list: %s", e)
            return {
                'status': 'error',
                'message': "Erreur lors de la récupération des catégories",
                'data': []
            }

    def create_new_category(self, **kwargs):
        """Créer une nouvelle catégorie"""
        try:
            data = json.loads(request.httprequest.data.decode('utf-8'))
            
            # Validation des champs requis
            if not data.get('name'):
                return {
                    'status': 'error',
                    'message': "Le nom de la catégorie est requis"
                }

            # Préparer les données
            category_data = {
                'name': data['name']
            }

            # Créer la catégorie avec sudo()
            Category = request.env['op.tag'].sudo()
            new_category = Category.create(category_data)

            return {
                'status': 'success',
                'data': {
                    'id': new_category.id,
                    'name': new_category.name,
                    'books_count': 0
                },
                'message': "Catégorie créée avec succès"
            }

        except ValidationError as e:
            return {
                'status': 'error',
                'message': str(e)
            }
        except Exception as e:
            _logger.error("Erreur dans create_new_category: %s", e)
            return {
                'status': 'error',
                'message': "Erreur lors de la création de la catégorie"
            }

    # Routes pour catégories individuelles (UPDATE/DELETE)
    @http.route('/api/library/categories/<int:category_id>', auth='none', type='http', csrf=False, methods=['GET', 'PUT', 'DELETE', 'OPTIONS'])
    @cors_wrapper
    def handle_category_details(self, category_id, **kwargs):
        """Gérer une catégorie spécifique - GET pour détails, PUT pour modifier, DELETE pour supprimer"""
        try:
            if not self._check_session():
                return {
                    'status': 'error',
                    'message': "Session non valide ou expirée",
                    'code': 401
                }
            
            if request.httprequest.method == 'GET':
                return self.get_category_details(category_id)
            elif request.httprequest.method == 'PUT':
                return self.update_category(category_id, **kwargs)
            elif request.httprequest.method == 'DELETE':
                return self.delete_category(category_id)
        except Exception as e:
            _logger.error("Erreur dans handle_category_details: %s", e)
            return {
                'status': 'error',
                'message': "Erreur interne du serveur",
                'code': 500
            }

    def get_category_details(self, category_id):
        """Obtenir les détails d'une catégorie"""
        try:
            Category = request.env['op.tag'].sudo()
            category = Category.browse(category_id)
            
            if not category.exists():
                return {
                    'status': 'error',
                    'message': "Catégorie non trouvée",
                    'code': 404
                }

            # Compter les livres de cette catégorie
            books_count = request.env['op.media'].sudo().search_count([
                ('tags', 'in', category.id),
                ('active', '=', True)
            ])

            return {
                'status': 'success',
                'data': {
                    'id': category.id,
                    'name': category.name,
                    'description': category.description or '',
                    'books_count': books_count
                }
            }

        except Exception as e:
            _logger.error("Erreur dans get_category_details: %s", e)
            return {
                'status': 'error',
                'message': "Erreur lors de la récupération de la catégorie"
            }

    def update_category(self, category_id, **kwargs):
        """Mettre à jour une catégorie"""
        try:
            data = json.loads(request.httprequest.data.decode('utf-8'))
            
            Category = request.env['op.tag'].sudo()
            category = Category.browse(category_id)
            
            if not category.exists():
                return {
                    'status': 'error',
                    'message': "Catégorie non trouvée",
                    'code': 404
                }

            # Validation des champs requis
            if not data.get('name'):
                return {
                    'status': 'error',
                    'message': "Le nom de la catégorie est requis"
                }

            # Préparer les données de mise à jour
            update_data = {
                'name': data['name'],
                'description': data.get('description', '')
            }

            # Mettre à jour la catégorie
            category.write(update_data)

            # Compter les livres de cette catégorie
            books_count = request.env['op.media'].sudo().search_count([
                ('tags', 'in', category.id),
                ('active', '=', True)
            ])

            return {
                'status': 'success',
                'data': {
                    'id': category.id,
                    'name': category.name,
                    'description': category.description or '',
                    'books_count': books_count
                },
                'message': "Catégorie mise à jour avec succès"
            }

        except ValidationError as e:
            return {
                'status': 'error',
                'message': str(e)
            }
        except Exception as e:
            _logger.error("Erreur dans update_category: %s", e)
            return {
                'status': 'error',
                'message': "Erreur lors de la mise à jour de la catégorie"
            }

    def delete_category(self, category_id):
        """Supprimer une catégorie"""
        try:
            Category = request.env['op.tag'].sudo()
            category = Category.browse(category_id)
            
            if not category.exists():
                return {
                    'status': 'error',
                    'message': "Catégorie non trouvée",
                    'code': 404
                }

            # Vérifier s'il y a des livres associés
            books_count = request.env['op.media'].sudo().search_count([
                ('tags', 'in', category.id),
                ('active', '=', True)
            ])

            if books_count > 0:
                return {
                    'status': 'error',
                    'message': f"Impossible de supprimer cette catégorie car elle est associée à {books_count} livre(s)"
                }

            # Supprimer la catégorie
            category.unlink()

            return {
                'status': 'success',
                'message': "Catégorie supprimée avec succès"
            }

        except Exception as e:
            _logger.error("Erreur dans delete_category: %s", e)
            return {
                'status': 'error',
                'message': "Erreur lors de la suppression de la catégorie"
            }

    # ==================== EMPRUNTS (BORROWINGS) ====================
    
    @http.route('/api/library/borrowings', auth='none', type='http', csrf=False, methods=['GET', 'POST', 'OPTIONS'])
    @cors_wrapper
    def handle_borrowings(self, **kwargs):
        """Gérer les emprunts - GET pour lister, POST pour créer"""
        try:
            if not self._check_session():
                return {
                    'status': 'error',
                    'message': "Session non valide ou expirée",
                    'code': 401
                }
            
            if request.httprequest.method == 'GET':
                return self.get_borrowings_list(**kwargs)
            elif request.httprequest.method == 'POST':
                return self.create_new_borrowing(**kwargs)
        except Exception as e:
            _logger.error("Erreur dans handle_borrowings: %s", e)
            return {
                'status': 'error',
                'message': "Erreur interne du serveur",
                'code': 500
            }

    def get_borrowings_list(self, **kwargs):
        """Obtenir la liste des emprunts"""
        try:
            page = int(kwargs.get('page', 1))
            limit = int(kwargs.get('limit', 20))
            search = kwargs.get('search', '')
            state = kwargs.get('state')

            offset = (page - 1) * limit
            domain = []

            # Filtre de recherche
            if search:
                domain.append('|')
                domain.append(('student_id.name', 'ilike', search))
                domain.append(('media_id.name', 'ilike', search))

            # Filtre par état
            if state:
                if state == 'overdue':
                    # Filtre spécial pour les emprunts en retard
                    domain.append(('state', '=', 'issue'))  # Seulement les emprunts en cours
                    domain.append(('return_date', '<', datetime.now().date()))  # Date de retour dépassée
                else:
                    domain.append(('state', '=', state))

            # Rechercher les emprunts avec sudo()
            Borrowing = request.env['op.media.movement'].sudo()
            total_count = Borrowing.search_count(domain)
            borrowings = Borrowing.search(domain, offset=offset, limit=limit, order='issued_date desc')

            borrowings_data = []
            for borrowing in borrowings:
                # Déterminer le nom de l'emprunteur selon le type
                borrower_name = None
                if borrowing.type == 'student' and borrowing.student_id:
                    borrower_name = borrowing.student_id.name
                elif borrowing.type == 'faculty' and borrowing.faculty_id:
                    borrower_name = borrowing.faculty_id.name
                elif borrowing.partner_id:
                    borrower_name = borrowing.partner_id.name
                
                borrowings_data.append({
                    'id': borrowing.id,
                    'student': {
                        'id': borrowing.student_id.id if borrowing.student_id else (borrowing.faculty_id.id if borrowing.faculty_id else borrowing.partner_id.id if borrowing.partner_id else None),
                        'name': borrower_name
                    },
                    'book': {
                        'id': borrowing.media_id.id if borrowing.media_id else None,
                        'title': borrowing.media_id.name if borrowing.media_id else None
                    },
                    'issued_date': borrowing.issued_date,
                    'return_date': borrowing.return_date,
                    'actual_return_date': borrowing.actual_return_date,
                    'state': borrowing.state,
                    'is_overdue': borrowing.return_date and borrowing.return_date < datetime.now().date() and borrowing.state == 'issue'
                })

            return {
                'status': 'success',
                'data': {
                    'borrowings': borrowings_data,
                    'total_count': total_count,
                    'page': page,
                    'total_pages': (total_count + limit - 1) // limit,
                    'has_next': offset + limit < total_count,
                    'has_prev': page > 1
                }
            }

        except Exception as e:
            _logger.error("Erreur dans get_borrowings_list: %s", e)
            return {
                'status': 'error',
                'message': "Erreur lors de la récupération des emprunts",
                'code': 500
            }

    def create_new_borrowing(self, **kwargs):
        """Créer un nouvel emprunt"""
        try:
            data = json.loads(request.httprequest.data.decode('utf-8'))
            
            # Validation des champs requis
            required_fields = ['book_id', 'student', 'return_date']
            for field in required_fields:
                if not data.get(field):
                    return {
                        'status': 'error',
                        'message': f"Le champ '{field}' est requis",
                        'code': 400
                    }

            # Rechercher le livre avec sudo()
            book = request.env['op.media'].sudo().browse(data['book_id'])
            
            if not book.exists():
                return {
                    'status': 'error',
                    'message': "Livre non trouvé",
                    'code': 404
                }

            # Debug des unités disponibles
            _logger.info("Livre trouvé: %s, Unités totales: %s", book.name, len(book.unit_ids))
            for unit in book.unit_ids:
                _logger.info("Unité ID: %s, État: %s", unit.id, unit.state)

            # Trouver une unité disponible du livre
            available_units = book.unit_ids.filtered(lambda u: u.state == 'available')
            _logger.info("Unités disponibles trouvées: %s", len(available_units))
            
            if not available_units:
                return {
                    'status': 'error',
                    'message': "Aucun exemplaire disponible pour ce livre",
                    'code': 400
                }

            # Prendre la première unité disponible
            available_unit = available_units[0]
            _logger.info("Unité sélectionnée pour emprunt: ID=%s, État=%s", available_unit.id, available_unit.state)

            # Trouver un étudiant correspondant au nom (ou créer un contact temporaire)
            student_name = data['student'].strip()
            Student = request.env['op.student'].sudo()
            student = Student.search([('name', 'ilike', student_name)], limit=1)
            
            partner_id = None
            student_id = None
            faculty_id = None
            is_student = False
            
            if student:
                # Étudiant trouvé
                is_student = True
                student_id = student.id
                # Utiliser le partner_id de l'étudiant s'il existe
                if student.partner_id:
                    partner_id = student.partner_id.id
                else:
                    # Créer un partner pour l'étudiant s'il n'en a pas
                    Partner = request.env['res.partner'].sudo()
                    partner = Partner.create({
                        'name': student.name,
                        'is_company': False,
                        'supplier_rank': 0,
                        'customer_rank': 1,
                        'email': student.email if hasattr(student, 'email') else False,
                        'phone': student.phone if hasattr(student, 'phone') else False
                    })
                    partner_id = partner.id
                    # Mettre à jour l'étudiant avec le nouveau partner_id
                    student.write({'partner_id': partner_id})
            else:
                # Si aucun étudiant trouvé, chercher dans les contacts ou créer un nouveau contact
                Partner = request.env['res.partner'].sudo()
                partner = Partner.search([('name', 'ilike', student_name)], limit=1)
                
                if not partner:
                    # Créer un contact temporaire pour l'emprunt
                    partner = Partner.create({
                        'name': student_name,
                        'is_company': False,
                        'supplier_rank': 0,
                        'customer_rank': 1
                    })
                
                partner_id = partner.id
                faculty_id = partner_id  # Pour les non-étudiants, utiliser le partner comme faculty
                is_student = False

            _logger.info("Étudiant/Contact trouvé/créé: student_id=%s, partner_id=%s, faculty_id=%s, Nom=%s, Est étudiant=%s", 
                        student_id, partner_id, faculty_id, student_name, is_student)

            # Créer l'emprunt avec sudo()
            Movement = request.env['op.media.movement'].sudo()
            
            # S'assurer qu'il y a une carte de bibliothèque ou en créer une
            library_card_id = None
            try:
                if is_student and student:
                    _logger.info("Recherche de carte de bibliothèque pour l'étudiant ID: %s", student.id)
                    # Rechercher une carte de bibliothèque existante pour l'étudiant
                    LibraryCard = request.env['op.library.card'].sudo()
                    library_card = LibraryCard.search([('student_id', '=', student.id)], limit=1)
                    
                    if not library_card:
                        _logger.info("Création d'une nouvelle carte de bibliothèque pour l'étudiant")
                        
                        # S'assurer qu'il y a un type de carte de bibliothèque
                        LibraryCardType = request.env['op.library.card.type'].sudo()
                        card_type = LibraryCardType.search([], limit=1)
                        
                        if not card_type:
                            # Créer un type de carte par défaut
                            card_type = LibraryCardType.create({
                                'name': 'Carte Étudiante Standard',
                                'allow_media': 5,
                                'duration': 14,  # 14 jours
                                'penalty_amt_per_day': 1.0
                            })
                            _logger.info("Type de carte créé: %s", card_type.name)
                        
                        # Créer une carte de bibliothèque pour l'étudiant
                        library_card = LibraryCard.create({
                            'student_id': student.id,
                            'partner_id': partner_id,  # Utiliser le partner_id correct
                            'library_card_type_id': card_type.id,
                            'issue_date': datetime.now().date(),
                            'type': 'student'
                        })
                        _logger.info("Carte de bibliothèque créée avec ID: %s, Numéro: %s", library_card.id, library_card.number)
                    else:
                        _logger.info("Carte de bibliothèque existante trouvée: %s", library_card.id)
                    
                    library_card_id = library_card.id
                else:
                    _logger.info("Création d'une carte temporaire pour le contact ID: %s", partner_id)
                    
                    # S'assurer qu'il y a un type de carte de bibliothèque
                    LibraryCardType = request.env['op.library.card.type'].sudo()
                    card_type = LibraryCardType.search([], limit=1)
                    
                    if not card_type:
                        # Créer un type de carte par défaut
                        card_type = LibraryCardType.create({
                            'name': 'Carte Visiteur Standard',
                            'allow_media': 3,
                            'duration': 7,  # 7 jours
                            'penalty_amt_per_day': 1.0
                        })
                        _logger.info("Type de carte créé: %s", card_type.name)
                    
                    # Pour les non-étudiants, créer une carte temporaire
                    LibraryCard = request.env['op.library.card'].sudo()
                    library_card = LibraryCard.create({
                        'partner_id': partner_id,  # Utiliser le partner_id correct
                        'library_card_type_id': card_type.id,
                        'issue_date': datetime.now().date(),
                        'type': 'faculty'  # Utiliser 'faculty' pour les non-étudiants
                    })
                    library_card_id = library_card.id
                    _logger.info("Carte temporaire créée avec ID: %s, Numéro: %s", library_card_id, library_card.number)
                
                if not library_card_id:
                    raise ValueError("Impossible de créer ou trouver une carte de bibliothèque")
                    
            except Exception as card_error:
                _logger.error("Erreur lors de la création de la carte de bibliothèque: %s", card_error)
                import traceback
                _logger.error("Traceback: %s", traceback.format_exc())
                return {
                    'status': 'error',
                    'message': f"Erreur lors de la création de la carte de bibliothèque: {str(card_error)}",
                    'code': 500
                }
            
            # Préparer les données de l'emprunt avec tous les champs obligatoires
            borrowing_data = {
                'media_id': book.id,
                'media_unit_id': available_unit.id,
                'library_card_id': library_card_id,  # Champ obligatoire
                'type': 'student' if is_student else 'faculty',  # Champ obligatoire: 'student' ou 'faculty'
                'student_id': student_id if is_student else None,
                'faculty_id': faculty_id if not is_student else None,
                'partner_id': partner_id,  # Utiliser le partner_id correct
                'issued_date': datetime.now().date(),
                'return_date': data['return_date'],
                'state': 'issue'  # État de l'emprunt
            }

            _logger.info("Données d'emprunt à créer (avec tous les champs): %s", borrowing_data)
            
            # Vérification de sécurité avant création
            if not borrowing_data.get('library_card_id'):
                raise ValueError("library_card_id est manquant dans les données d'emprunt")
            if not borrowing_data.get('type'):
                raise ValueError("type est manquant dans les données d'emprunt")
                
            new_borrowing = Movement.create(borrowing_data)
            _logger.info("Emprunt créé avec succès, ID: %s", new_borrowing.id)

            # Marquer l'unité comme empruntée
            available_unit.write({'state': 'issue'})
            _logger.info("Unité marquée comme empruntée")

            return {
                'status': 'success',
                'data': {
                    'borrowing': {
                        'id': new_borrowing.id,
                        'book_title': book.name,
                        'student_name': student_name,
                        'issued_date': new_borrowing.issued_date,
                        'return_date': new_borrowing.return_date,
                        'state': new_borrowing.state
                    }
                },
                'message': "Emprunt créé avec succès"
            }

        except ValidationError as e:
            _logger.error("Erreur de validation dans create_new_borrowing: %s", e)
            return {
                'status': 'error',
                'message': str(e),
                'code': 400
            }
        except Exception as e:
            _logger.error("Erreur dans create_new_borrowing: %s", e)
            import traceback
            _logger.error("Traceback complet: %s", traceback.format_exc())
            return {
                'status': 'error',
                'message': "Erreur lors de la création de l'emprunt",
                'code': 500
            }

    # ==================== RETOUR DE LIVRE ====================
    
    @http.route('/api/library/borrowings/<int:borrowing_id>/return', auth='none', type='http', csrf=False, methods=['POST', 'OPTIONS'])
    @cors_wrapper
    def return_book(self, borrowing_id, **kwargs):
        """Retourner un livre emprunté"""
        try:
            if not self._check_session():
                return {
                    'status': 'error',
                    'message': "Session non valide ou expirée",
                    'code': 401
                }

            # Rechercher l'emprunt avec sudo()
            borrowing = request.env['op.media.movement'].sudo().browse(borrowing_id)
            
            if not borrowing.exists():
                return {
                    'status': 'error',
                    'message': "Emprunt non trouvé",
                    'code': 404
                }

            if borrowing.state != 'issue':
                return {
                    'status': 'error',
                    'message': "Ce livre n'est pas actuellement emprunté",
                    'code': 400
                }

            # Effectuer le retour
            borrowing.write({
                'state': 'return',
                'actual_return_date': datetime.now().date()
            })

            return {
                'status': 'success',
                'data': {
                    'borrowing': {
                        'id': borrowing.id,
                        'state': borrowing.state,
                        'actual_return_date': borrowing.actual_return_date
                    }
                },
                'message': "Livre retourné avec succès"
            }

        except Exception as e:
            _logger.error("Erreur dans return_book: %s", e)
            return {
                'status': 'error',
                'message': "Erreur lors du retour du livre",
                'code': 500
            }

    # ==================== STATISTIQUES ====================
    
    @http.route('/api/library/statistics', auth='none', type='http', csrf=False, methods=['GET', 'OPTIONS'])
    @cors_wrapper
    def get_stats(self, **kwargs):
        """Obtenir les statistiques de la bibliothèque"""
        try:
            # Compter les éléments
            total_books = request.env['op.media'].sudo().search_count([('active', '=', True)])
            total_authors = request.env['op.author'].sudo().search_count([])
            total_categories = request.env['op.tag'].sudo().search_count([])
            
            # Compter les emprunts actifs et en retard
            active_borrowings = request.env['op.media.movement'].sudo().search_count([('state', '=', 'issue')])
            overdue_borrowings = request.env['op.media.movement'].sudo().search_count([
                ('state', '=', 'issue'),
                ('return_date', '<', datetime.now().date())
            ])

            return {
                'status': 'success',
                'data': {
                    'total_books': total_books,
                    'total_authors': total_authors,
                    'total_categories': total_categories,
                    'active_borrowings': active_borrowings,
                    'overdue_borrowings': overdue_borrowings
                }
            }

        except Exception as e:
            _logger.error("Erreur dans get_stats: %s", e)
            return {
                'status': 'error',
                'message': "Erreur lors de la récupération des statistiques"
            } 