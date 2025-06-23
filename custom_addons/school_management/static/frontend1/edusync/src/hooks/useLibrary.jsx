import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

const API_BASE_URL = 'http://172.16.209.128:8069';

// Fonction utilitaire pour obtenir le session ID
const getSessionId = () => {
  return localStorage.getItem('session_id');
};

// Fonction utilitaire pour les requêtes API
const apiRequest = async (endpoint, options = {}) => {
  const sessionId = getSessionId();
  const headers = {
    'Content-Type': 'application/json',
    ...(sessionId && { 'X-Openerp-Session-Id': sessionId }),
    ...options.headers,
  };

  const url = `${API_BASE_URL}/api/library${endpoint}`;
  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Erreur HTTP: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Erreur API:', error);
    throw error;
  }
};

// Hook pour gérer les livres
export const useBooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 0,
    totalCount: 0,
    hasNext: false,
    hasPrev: false
  });

  const fetchBooks = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams(params).toString();
      const data = await apiRequest(`/books?${queryParams}`);
      
      setBooks(data.data || []);
      setPagination({
        page: data.page || 1,
        totalPages: data.total_pages || 0,
        totalCount: data.total_count || 0,
        hasNext: data.has_next || false,
        hasPrev: data.has_prev || false
      });
      
      // Retourner la réponse complète pour pouvoir être utilisée dans d'autres composants
      return data;
    } catch (err) {
      setError(err.message);
      toast.error(`Erreur lors du chargement des livres: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createBook = async (bookData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/library/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Openerp-Session-Id': getSessionId(),
        },
        body: JSON.stringify(bookData),
      });

      // Accepter les codes 200 (OK) et 201 (Created) comme succès
      if (!response.ok && response.status !== 201) {
        // Gestion spécifique des erreurs HTTP
        let errorMessage = `Erreur HTTP: ${response.status}`;
        
        try {
          const errorData = await response.text();
          
          // Tentative de parsing JSON pour plus de détails
          try {
            const jsonError = JSON.parse(errorData);
            if (jsonError.message) {
              errorMessage = jsonError.message;
            } else if (jsonError.error) {
              errorMessage = jsonError.error;
            }
          } catch (e) {
            // Vérification des erreurs spécifiques dans le texte brut
            if (errorData.includes('duplicate key value violates unique constraint') && 
                errorData.includes('isbn')) {
              errorMessage = `Erreur : Un livre avec cet ISBN existe déjà. Veuillez utiliser un ISBN différent.`;
            } else if (errorData.includes('duplicate key value violates unique constraint')) {
              errorMessage = `Erreur : Cette valeur existe déjà dans la base de données.`;
            } else if (response.status === 400) {
              errorMessage = `Erreur : Données invalides. Vérifiez tous les champs obligatoires.`;
            } else if (response.status === 401) {
              errorMessage = `Erreur : Session expirée. Veuillez vous reconnecter.`;
              // Rediriger vers la page de connexion ou rafraîchir la session
              localStorage.removeItem('session_id');
              window.location.href = '/login';
            } else if (response.status === 500) {
              errorMessage = `Erreur serveur : Problème technique. Contactez l'administrateur.`;
            }
          }
          
        } catch (e) {
          // Si on ne peut pas lire la réponse d'erreur
          console.error('Erreur lors de la lecture de la réponse d\'erreur:', e);
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        toast.success('Livre créé avec succès !');
        // Rafraîchir la liste des livres après création
        await fetchBooks();
        return result;
      } else {
        throw new Error(result.message || result.error || 'Erreur lors de la création du livre');
      }
    } catch (error) {
      console.error('Erreur lors de la création du livre:', error);
      
      // Messages d'erreur personnalisés
      let userMessage = error.message;
      
      if (error.message.includes('Failed to fetch')) {
        userMessage = 'Erreur de connexion. Vérifiez votre connexion internet.';
      } else if (error.message.includes('NetworkError')) {
        userMessage = 'Erreur réseau. Le serveur est peut-être indisponible.';
      }
      
      setError(userMessage);
      toast.error(userMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getBookDetails = useCallback(async (bookId) => {
    setLoading(true);
    try {
      const response = await apiRequest(`/books/${bookId}`);
      if (response.status === 'success') {
        return response.data;
      }
    } catch (err) {
      setError(err.message);
      toast.error(`Erreur lors du chargement des détails: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getBookById = async (bookId) => {
    setLoading(true);
    try {
      const response = await apiRequest(`/books/${bookId}`);
      if (response.status === 'success') {
        return response;
      } else {
        throw new Error(response.message || 'Erreur lors de la récupération du livre');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateBook = async (bookId, bookData) => {
    setLoading(true);
    try {
      const response = await apiRequest(`/books/${bookId}`, {
        method: 'PUT',
        body: JSON.stringify(bookData),
      });

      if (response.status === 'success') {
        toast.success('Livre mis à jour avec succès');
        await fetchBooks();
        return response;
      } else {
        throw new Error(response.message || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      setError(err.message);
      toast.error(`Erreur lors de la mise à jour: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteBook = async (bookId) => {
    setLoading(true);
    try {
      const response = await apiRequest(`/books/${bookId}`, {
        method: 'DELETE',
      });

      if (response.status === 'success') {
        toast.success('Livre supprimé avec succès');
        await fetchBooks();
        return true;
      } else {
        throw new Error(response.message || 'Erreur lors de la suppression');
      }
    } catch (err) {
      setError(err.message);
      toast.error(`Erreur lors de la suppression: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    books,
    loading,
    error,
    pagination,
    fetchBooks,
    createBook,
    getBookDetails,
    getBookById,
    updateBook,
    deleteBook
  };
};

// Hook pour gérer les auteurs
export const useAuthors = () => {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAuthors = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiRequest('/authors');
      setAuthors(data.data || []);
    } catch (err) {
      setError(err.message);
      toast.error(`Erreur lors du chargement des auteurs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const createAuthor = async (authorData) => {
    setLoading(true);
    try {
      const response = await apiRequest('/authors', {
        method: 'POST',
        body: JSON.stringify(authorData),
      });

      if (response.status === 'success') {
        toast.success('Auteur créé avec succès');
        await fetchAuthors();
        return response;
      } else {
        throw new Error(response.message || 'Erreur lors de la création de l\'auteur');
      }
    } catch (err) {
      setError(err.message);
      toast.error(`Erreur lors de la création de l'auteur: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAuthor = async (authorId, authorData) => {
    setLoading(true);
    try {
      const response = await apiRequest(`/authors/${authorId}`, {
        method: 'PUT',
        body: JSON.stringify(authorData),
      });

      if (response.status === 'success') {
        toast.success('Auteur mis à jour avec succès');
        await fetchAuthors();
        return response;
      } else {
        throw new Error(response.message || 'Erreur lors de la mise à jour de l\'auteur');
      }
    } catch (err) {
      setError(err.message);
      toast.error(`Erreur lors de la mise à jour de l'auteur: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAuthor = async (authorId) => {
    setLoading(true);
    try {
      const response = await apiRequest(`/authors/${authorId}`, {
        method: 'DELETE',
      });

      if (response.status === 'success') {
        toast.success('Auteur supprimé avec succès');
        await fetchAuthors();
        return true;
      } else {
        throw new Error(response.message || 'Erreur lors de la suppression de l\'auteur');
      }
    } catch (err) {
      setError(err.message);
      toast.error(`Erreur lors de la suppression de l'auteur: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    authors,
    loading,
    error,
    fetchAuthors,
    createAuthor,
    updateAuthor,
    deleteAuthor
  };
};

// Hook pour gérer les catégories
export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiRequest('/categories');
      setCategories(data.data || []);
    } catch (err) {
      setError(err.message);
      toast.error(`Erreur lors du chargement des catégories: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCategory = async (categoryData) => {
    setLoading(true);
    try {
      const response = await apiRequest('/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData),
      });

      if (response.status === 'success') {
        toast.success('Catégorie créée avec succès');
        await fetchCategories();
        return response;
      } else {
        throw new Error(response.message || 'Erreur lors de la création de la catégorie');
      }
    } catch (err) {
      setError(err.message);
      toast.error(`Erreur lors de la création de la catégorie: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = async (categoryId, categoryData) => {
    setLoading(true);
    try {
      const response = await apiRequest(`/categories/${categoryId}`, {
        method: 'PUT',
        body: JSON.stringify(categoryData),
      });

      if (response.status === 'success') {
        toast.success('Catégorie mise à jour avec succès');
        await fetchCategories();
        return response;
      } else {
        throw new Error(response.message || 'Erreur lors de la mise à jour de la catégorie');
      }
    } catch (err) {
      setError(err.message);
      toast.error(`Erreur lors de la mise à jour de la catégorie: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (categoryId) => {
    setLoading(true);
    try {
      const response = await apiRequest(`/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (response.status === 'success') {
        toast.success('Catégorie supprimée avec succès');
        await fetchCategories();
        return true;
      } else {
        throw new Error(response.message || 'Erreur lors de la suppression de la catégorie');
      }
    } catch (err) {
      setError(err.message);
      toast.error(`Erreur lors de la suppression de la catégorie: ${err.message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory
  };
};

// Hook pour les emprunts
export const useBorrowings = () => {
  const [borrowings, setBorrowings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0
  });

  const fetchBorrowings = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 useBorrowings: Paramètres reçus:', params);
      
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 20,
        ...(params.state && { state: params.state }),
        ...(params.status && { state: params.status }),
        ...(params.student_id && { student_id: params.student_id }),
        ...(params.search && { search: params.search })
      });

      console.log('🔍 useBorrowings: Paramètres envoyés à l\'API:', queryParams.toString());

      const response = await apiRequest(`/borrowings?${queryParams}`);
      
      console.log('🔍 useBorrowings: Réponse API:', response);
      
      if (response.status === 'success') {
        setBorrowings(response.data?.borrowings || response.borrowings || []);
        setPagination({
          page: response.data?.page || 1,
          totalPages: response.data?.total_pages || 1,
          totalCount: response.data?.total_count || 0
        });
      } else {
        setError(response.message || 'Erreur lors de la récupération des emprunts');
      }
    } catch (err) {
      setError('Erreur lors de la récupération des emprunts');
      console.error('Erreur fetchBorrowings:', err);
    } finally {
      setLoading(false);
    }
  };

  const createBorrowing = async (borrowingData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest('/borrowings', {
        method: 'POST',
        body: JSON.stringify(borrowingData),
      });

      if (response.status === 'success') {
        await fetchBorrowings();
        return response;
      } else {
        setError(response.message || 'Erreur lors de la création de l\'emprunt');
        return response;
      }
    } catch (err) {
      setError('Erreur lors de la création de l\'emprunt');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const returnBook = async (borrowingId, returnData = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest(`/borrowings/${borrowingId}/return`, {
        method: 'POST',
        body: JSON.stringify(returnData),
      });

      if (response.status === 'success') {
        await fetchBorrowings();
        return response;
      } else {
        setError(response.message || 'Erreur lors du retour du livre');
        return response;
      }
    } catch (err) {
      setError('Erreur lors du retour du livre');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    borrowings,
    loading,
    error,
    pagination,
    fetchBorrowings,
    createBorrowing,
    borrowBook: createBorrowing,
    returnBook
  };
};

// Hook pour les statistiques de la bibliothèque
export const useLibraryStatistics = () => {
  const [statistics, setStatistics] = useState({
    total_books: 0,
    active_borrowings: 0,
    overdue_borrowings: 0,
    total_authors: 0,
    total_categories: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatistics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest('/statistics');
      
      if (response.status === 'success') {
        setStatistics(response.data);
      } else {
        setError(response.message || 'Erreur lors du chargement des statistiques');
      }
    } catch (err) {
      setError(err.message);
      toast.error(`Erreur lors du chargement des statistiques: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  return {
    statistics,
    loading,
    error,
    fetchStatistics
  };
};

// Hook principal qui combine tous les hooks de la bibliothèque
export const useLibrary = () => {
  const books = useBooks();
  const authors = useAuthors();
  const categories = useCategories();
  const borrowings = useBorrowings();
  const statistics = useLibraryStatistics();

  return {
    // Books
    fetchBooks: books.fetchBooks,
    getBooks: books.fetchBooks,
    getBookById: books.getBookById,
    getBookDetails: books.getBookDetails,
    createBook: books.createBook,
    updateBook: books.updateBook,
    deleteBook: books.deleteBook,
    books: books.books,
    
    // Authors  
    fetchAuthors: authors.fetchAuthors,
    createAuthor: authors.createAuthor,
    authors: authors.authors,
    
    // Categories
    fetchCategories: categories.fetchCategories,
    createCategory: categories.createCategory,
    categories: categories.categories,
    
    // Borrowings
    fetchBorrowings: borrowings.fetchBorrowings,
    createBorrowing: borrowings.createBorrowing,
    borrowBook: borrowings.createBorrowing,
    returnBook: borrowings.returnBook,
    
    // Statistics
    fetchStatistics: statistics.fetchStatistics,
    statistics: statistics.statistics,
    
    // Loading and error states
    loading: books.loading || authors.loading || categories.loading || borrowings.loading || statistics.loading,
    error: books.error || authors.error || categories.error || borrowings.error || statistics.error
  };
}; 