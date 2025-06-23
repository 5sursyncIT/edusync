// src/hooks/useSubjects.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import odooApi from '../services/odooApi.jsx';

export const useSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
    hasNext: false,
    hasPrev: false
  });
  const { user } = useAuth();

  // État pour les filtres
  const [filters, setFilters] = useState({
    search: '',
    content_type: null,
    state: null,
    course_id: null,
    order: 'name asc'
  });

  // Récupérer la liste des matières
  const fetchSubjects = useCallback(async (
    page = pagination.currentPage, 
    search = filters.search, 
    order = filters.order,
    content_type = filters.content_type,
    state = filters.state,
    course_id = filters.course_id
  ) => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Valider et nettoyer les paramètres
      const validPage = Number.isInteger(page) && page > 0 ? page : 1;
      const validLimit = Number.isInteger(pagination.limit) && pagination.limit > 0 ? pagination.limit : 20;
      const validSearch = search || '';
      const validOrder = order || 'name asc';

      const filterParams = {};
      if (content_type && content_type !== 'all') {
        filterParams.content_type = content_type;
      }
      if (state && state !== 'all') {
        filterParams.state = state;
      }
      if (course_id && course_id !== 'all') {
        filterParams.course_id = course_id;
      }

      const result = await odooApi.getSubjects(validPage, validLimit, validSearch, validOrder, filterParams);
      
      // Extraire les données du format API
      const data = result.data || result;
      
      setSubjects(data.subjects || result.subjects || []);
      setPagination(data.pagination || result.pagination || {
        currentPage: validPage,
        totalPages: 1,
        totalCount: 0,
        limit: validLimit,
        hasNext: false,
        hasPrev: false
      });
      
      // Mettre à jour les filtres
      setFilters(prev => ({
        ...prev,
        search: validSearch,
        order: validOrder,
        content_type,
        state,
        course_id
      }));

    } catch (err) {
      console.error('Erreur lors de la récupération des matières:', err);
      setError(err.message || 'Erreur lors de la récupération des matières');
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, pagination.currentPage, pagination.limit, filters.search, filters.order, filters.content_type, filters.state, filters.course_id]);

  // Créer une nouvelle matière
  const createSubject = useCallback(async (subjectData) => {
    try {
      setLoading(true);
      setError(null);
      
      const newSubject = await odooApi.createSubject(subjectData);
      
      // Rafraîchir la liste
      await fetchSubjects();
      
      return { success: true, data: newSubject };
    } catch (err) {
      console.error('Erreur lors de la création de la matière:', err);
      const errorMessage = err.message || 'Erreur lors de la création de la matière';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchSubjects]);

  // Mettre à jour une matière
  const updateSubject = useCallback(async (id, subjectData) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedSubject = await odooApi.updateSubject(id, subjectData);
      
      // Mettre à jour localement
      setSubjects(prev => prev.map(subject => 
        subject.id === id ? { ...subject, ...updatedSubject } : subject
      ));
      
      return { success: true, data: updatedSubject };
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la matière:', err);
      const errorMessage = err.message || 'Erreur lors de la mise à jour de la matière';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Supprimer une matière
  const deleteSubject = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      await odooApi.deleteSubject(id);
      
      // Supprimer localement
      setSubjects(prev => prev.filter(subject => subject.id !== id));
      
      // Mettre à jour la pagination
      setPagination(prev => ({
        ...prev,
        totalCount: prev.totalCount - 1
      }));
      
      // Si la page actuelle n'a plus d'éléments, revenir à la page précédente
      if (subjects.length === 1 && pagination.currentPage > 1) {
        await fetchSubjects(pagination.currentPage - 1);
      }
      
      return { success: true };
    } catch (err) {
      console.error('Erreur lors de la suppression de la matière:', err);
      const errorMessage = err.message || 'Erreur lors de la suppression de la matière';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [subjects.length, pagination.currentPage, fetchSubjects]);

  // Récupérer une matière spécifique
  const getSubject = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const subject = await odooApi.getSubject(id);
      return { success: true, data: subject };
    } catch (err) {
      console.error('Erreur lors de la récupération de la matière:', err);
      const errorMessage = err.message || 'Erreur lors de la récupération de la matière';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Assigner un enseignant à une matière
  const assignTeacher = useCallback(async (subjectId, teacherId) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await odooApi.assignTeacherToSubject(subjectId, teacherId);
      
      // Rafraîchir la liste ou la matière spécifique
      await fetchSubjects();
      
      return { success: true, data: result };
    } catch (err) {
      console.error('Erreur lors de l\'assignation:', err);
      const errorMessage = err.message || 'Erreur lors de l\'assignation';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchSubjects]);

  // Retirer un enseignant d'une matière
  const removeTeacher = useCallback(async (subjectId, teacherId) => {
    try {
      setLoading(true);
      setError(null);
      
      await odooApi.removeTeacherFromSubject(subjectId, teacherId);
      
      // Rafraîchir la liste
      await fetchSubjects();
      
      return { success: true };
    } catch (err) {
      console.error('Erreur lors du retrait:', err);
      const errorMessage = err.message || 'Erreur lors du retrait';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchSubjects]);

  // Changer de page
  const changePage = useCallback((newPage) => {
    const validPage = Number.isInteger(newPage) && newPage > 0 ? newPage : 1;
    fetchSubjects(validPage, filters.search, filters.order, filters.content_type, filters.state, filters.course_id);
  }, [fetchSubjects, filters]);

  // Changer le nombre d'éléments par page
  const changeLimit = useCallback((newLimit) => {
    const validLimit = Number.isInteger(newLimit) && newLimit > 0 && newLimit <= 1000 ? newLimit : 20;
    setPagination(prev => ({ ...prev, limit: validLimit }));
    fetchSubjects(1, filters.search, filters.order, filters.content_type, filters.state, filters.course_id);
  }, [fetchSubjects, filters]);

  // Rechercher
  const search = useCallback((searchTerm) => {
    fetchSubjects(1, searchTerm, filters.order, filters.content_type, filters.state, filters.course_id);
  }, [fetchSubjects, filters.order, filters.content_type, filters.state, filters.course_id]);

  // Trier
  const sort = useCallback((field, direction = 'asc') => {
    const newOrder = `${field} ${direction}`;
    fetchSubjects(pagination.currentPage, filters.search, newOrder, filters.content_type, filters.state, filters.course_id);
  }, [fetchSubjects, pagination.currentPage, filters.search, filters.content_type, filters.state, filters.course_id]);

  // Filtrer par type de contenu
  const filterByContentType = useCallback((content_type) => {
    fetchSubjects(1, filters.search, filters.order, content_type, filters.state, filters.course_id);
  }, [fetchSubjects, filters.search, filters.order, filters.state, filters.course_id]);

  // Filtrer par état
  const filterByState = useCallback((state) => {
    fetchSubjects(1, filters.search, filters.order, filters.content_type, state, filters.course_id);
  }, [fetchSubjects, filters.search, filters.order, filters.content_type, filters.course_id]);

  // Filtrer par cours
  const filterByCourse = useCallback((course_id) => {
    fetchSubjects(1, filters.search, filters.order, filters.content_type, filters.state, course_id);
  }, [fetchSubjects, filters.search, filters.order, filters.content_type, filters.state]);

  // Fonction pour effacer tous les filtres
  const clearFilters = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      search: '',
      content_type: null,
      state: null,
      course_id: null
    }));
    fetchSubjects(1, '', 'name asc', null, null, null);
  }, [fetchSubjects]);

  // Rafraîchir
  const refresh = useCallback(() => {
    fetchSubjects(pagination.currentPage, filters.search, filters.order, filters.content_type, filters.state, filters.course_id);
  }, [fetchSubjects, pagination.currentPage, filters]);

  // Récupérer toutes les matières (pour les dropdowns)
  const getAllSubjects = useCallback(async () => {
    try {
      const result = await odooApi.getAllSubjects();
      // Extraire les données du format API
      const data = result.data || result;
      return data.subjects || result.subjects || [];
    } catch (err) {
      console.error('Erreur lors de la récupération de toutes les matières:', err);
      return [];
    }
  }, []);

  // Effet initial
  useEffect(() => {
    if (user?.id) {
      fetchSubjects();
    }
  }, [user?.id]); // Ne pas inclure fetchSubjects pour éviter les boucles

  return {
    // État
    subjects,
    loading,
    error,
    pagination,
    filters,
    
    // Actions CRUD
    createSubject,
    updateSubject,
    deleteSubject,
    getSubject,
    
    // Actions d'assignation
    assignTeacher,
    removeTeacher,
    
    // Actions de liste
    fetchSubjects,
    changePage,
    changeLimit,
    search,
    sort,
    filterByContentType,
    filterByState,
    filterByCourse,
    clearFilters,
    refresh,
    getAllSubjects,
    
    // Helpers
    isFirstPage: pagination.currentPage === 1,
    isLastPage: pagination.currentPage === pagination.totalPages,
    isEmpty: subjects.length === 0 && !loading
  };
};

// Hook pour une matière spécifique avec ses enseignants
export const useSubject = (subjectId) => {
  const [subject, setSubject] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchSubject = useCallback(async () => {
    if (!user?.id || !subjectId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const subjectData = await odooApi.getSubject(subjectId);
      setSubject(subjectData);
      setTeachers(subjectData.teachers || []);
    } catch (err) {
      console.error('Erreur lors de la récupération de la matière:', err);
      setError(err.message || 'Erreur lors de la récupération de la matière');
      setSubject(null);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  }, [subjectId, user?.id]);

  const updateSubject = useCallback(async (subjectData) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedSubject = await odooApi.updateSubject(subjectId, subjectData);
      setSubject(updatedSubject);
      
      return { success: true, data: updatedSubject };
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la matière:', err);
      const errorMessage = err.message || 'Erreur lors de la mise à jour de la matière';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  const assignTeacher = useCallback(async (teacherId) => {
    try {
      setLoading(true);
      setError(null);
      
      await odooApi.assignTeacherToSubject(subjectId, teacherId);
      
      // Rafraîchir les données
      await fetchSubject();
      
      return { success: true };
    } catch (err) {
      console.error('Erreur lors de l\'assignation:', err);
      const errorMessage = err.message || 'Erreur lors de l\'assignation';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [subjectId, fetchSubject]);

  const removeTeacher = useCallback(async (teacherId) => {
    try {
      setLoading(true);
      setError(null);
      
      await odooApi.removeTeacherFromSubject(subjectId, teacherId);
      
      // Supprimer localement
      setTeachers(prev => prev.filter(teacher => teacher.id !== teacherId));
      
      return { success: true };
    } catch (err) {
      console.error('Erreur lors du retrait:', err);
      const errorMessage = err.message || 'Erreur lors du retrait';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    fetchSubject();
  }, [fetchSubject]);

  return {
    subject,
    teachers,
    loading,
    error,
    refresh: fetchSubject,
    updateSubject,
    assignTeacher,
    removeTeacher
  };
};