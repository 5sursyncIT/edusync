// src/hooks/useBatches.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import odooApi from '../services/odooApi.jsx';

export const useBatches = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
    hasNext: false,
    hasPrev: false
  });
  const { user } = useAuth();

  // État pour les filtres
  const [filters, setFilters] = useState({
    search: '',
    courseId: null,
    status: null, // upcoming, running, completed
    order: 'name asc'
  });

  // Récupérer la liste des batches
  const fetchBatches = useCallback(async (
    page = 1, 
    search = '', 
    order = 'name asc',
    courseId = null,
    status = null
  ) => {
    console.log('🔍 fetchBatches: DEBUT - Paramètres:', { page, search, order, courseId, status, user: user?.id });
    
    if (!user?.id) {
      console.log('⚠️ fetchBatches: Pas d\'utilisateur connecté');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const filterParams = {};
      if (courseId) {
        filterParams.course_id = courseId;
      }
      if (status) {
        filterParams.status = status;
      }

      console.log('🔍 fetchBatches: Appel odooApi.getBatches avec params:', { page, limit: pagination.limit, search, order, filterParams });
      const result = await odooApi.getBatches(page, pagination.limit, search, order, filterParams);
      
      console.log('🔍 fetchBatches: Résultat COMPLET de l\'API:', result);
      console.log('🔍 fetchBatches: Type du résultat:', typeof result);
      console.log('🔍 fetchBatches: result.status:', result?.status);
      console.log('🔍 fetchBatches: result.data:', result?.data);
      console.log('🔍 fetchBatches: result.data.batches:', result?.data?.batches);
      console.log('🔍 fetchBatches: Type de result.data.batches:', typeof result?.data?.batches);
      console.log('🔍 fetchBatches: Array.isArray(result.data.batches):', Array.isArray(result?.data?.batches));
      
      // Vérifier le format de la réponse
      if (result && result.data && result.data.batches) {
        console.log('✅ fetchBatches: Format correct détecté - data.batches existe');
        console.log('📊 fetchBatches: Nombre de batches reçus:', result.data.batches.length);
        console.log('📊 fetchBatches: Premier batch:', result.data.batches[0]);
        
        const batchesArray = result.data.batches || [];
        console.log('🔍 fetchBatches: Array final à définir:', batchesArray);
        console.log('🔍 fetchBatches: Type de l\'array final:', typeof batchesArray);
        console.log('🔍 fetchBatches: Est-ce un array?', Array.isArray(batchesArray));
        
        setBatches(batchesArray);
        
        // Assurer que les données de pagination sont cohérentes
        const paginationData = result.data.pagination || {};
        setPagination({
          currentPage: parseInt(paginationData.page || page, 10) || 1,
          totalPages: parseInt(paginationData.pages || 1, 10) || 1,
          totalCount: parseInt(paginationData.total || 0, 10) || 0,
          limit: parseInt(paginationData.limit || pagination.limit, 10) || 10,
          hasNext: paginationData.has_next || false,
          hasPrev: paginationData.has_prev || false
        });
      } else {
        console.log('⚠️ fetchBatches: Format non standard - utilisation du fallback');
        console.log('🔍 fetchBatches: result.batches:', result?.batches);
        console.log('🔍 fetchBatches: result (comme tableau):', result);
        
        // Fallback pour l'ancien format
        const fallbackBatches = result.batches || result || [];
        console.log('🔍 fetchBatches: Fallback batches:', fallbackBatches);
        console.log('🔍 fetchBatches: Type du fallback:', typeof fallbackBatches);
        console.log('🔍 fetchBatches: Est-ce un array?', Array.isArray(fallbackBatches));
        
        setBatches(fallbackBatches);
        const paginationData = result.pagination || {};
        setPagination({
          currentPage: parseInt(paginationData.currentPage || page, 10) || 1,
          totalPages: parseInt(paginationData.totalPages || 1, 10) || 1,
          totalCount: parseInt(paginationData.totalCount || 0, 10) || 0,
          limit: parseInt(paginationData.limit || pagination.limit, 10) || 10,
          hasNext: paginationData.hasNext || false,
          hasPrev: paginationData.hasPrev || false
        });
      }
      
      // Mettre à jour les filtres
      setFilters(prev => ({
        ...prev,
        search,
        order,
        courseId,
        status
      }));

      console.log('✅ fetchBatches: FIN - Données définies avec succès');

    } catch (err) {
      console.error('❌ fetchBatches: ERREUR lors de la récupération des promotions:', err);
      console.error('❌ fetchBatches: Stack trace:', err.stack);
      setError(err.message || 'Erreur lors de la récupération des promotions');
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, pagination.limit]);

  // Créer un nouveau batch
  const createBatch = useCallback(async (batchData) => {
    try {
      setLoading(true);
      setError(null);
      
      const newBatch = await odooApi.createBatch(batchData);
      
      // Rafraîchir la liste en forçant le rechargement
      await fetchBatches(pagination.currentPage, filters.search, filters.order, filters.courseId, filters.status);
      
      return { success: true, data: newBatch };
    } catch (err) {
      console.error('Erreur lors de la création de la promotion:', err);
      const errorMessage = err.message || 'Erreur lors de la création de la promotion';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchBatches, pagination.currentPage, filters]);

  // Mettre à jour un batch
  const updateBatch = useCallback(async (id, batchData) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedBatch = await odooApi.updateBatch(id, batchData);
      
      // Mettre à jour localement
      setBatches(prev => prev.map(batch => 
        batch.id === id ? { ...batch, ...updatedBatch } : batch
      ));
      
      return { success: true, data: updatedBatch };
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la promotion:', err);
      const errorMessage = err.message || 'Erreur lors de la mise à jour de la promotion';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Supprimer un batch
  const deleteBatch = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      await odooApi.deleteBatch(id);
      
      // Rafraîchir la liste complète
      await fetchBatches(pagination.currentPage, filters.search, filters.order, filters.courseId, filters.status);
      
      return { success: true };
    } catch (err) {
      console.error('Erreur lors de la suppression de la promotion:', err);
      const errorMessage = err.message || 'Erreur lors de la suppression de la promotion';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchBatches, pagination.currentPage, filters]);

  // Récupérer un batch spécifique
  const getBatch = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const batch = await odooApi.getBatch(id);
      return { success: true, data: batch };
    } catch (err) {
      console.error('Erreur lors de la récupération de la promotion:', err);
      const errorMessage = err.message || 'Erreur lors de la récupération de la promotion';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Changer de page
  const changePage = useCallback((newPage) => {
    fetchBatches(newPage, filters.search, filters.order, filters.courseId, filters.status);
  }, [fetchBatches, filters]);

  // Changer le nombre d'éléments par page
  const changeLimit = useCallback((newLimit) => {
    setPagination(prev => ({ ...prev, limit: newLimit }));
    fetchBatches(1, filters.search, filters.order, filters.courseId, filters.status);
  }, [fetchBatches, filters]);

  // Rechercher
  const search = useCallback((searchTerm) => {
    fetchBatches(1, searchTerm, filters.order, filters.courseId, filters.status);
  }, [fetchBatches, filters.order, filters.courseId, filters.status]);

  // Trier
  const sort = useCallback((field, direction = 'asc') => {
    const newOrder = `${field} ${direction}`;
    fetchBatches(pagination.currentPage, filters.search, newOrder, filters.courseId, filters.status);
  }, [fetchBatches, pagination.currentPage, filters.search, filters.courseId, filters.status]);

  // Filtrer par cours
  const filterByCourse = useCallback((courseId) => {
    fetchBatches(1, filters.search, filters.order, courseId, filters.status);
  }, [fetchBatches, filters.search, filters.order, filters.status]);

  // Filtrer par statut
  const filterByStatus = useCallback((status) => {
    fetchBatches(1, filters.search, filters.order, filters.courseId, status);
  }, [fetchBatches, filters.search, filters.order, filters.courseId]);

  // Rafraîchir
  const refresh = useCallback(() => {
    fetchBatches(pagination.currentPage, filters.search, filters.order, filters.courseId, filters.status);
  }, [fetchBatches, pagination.currentPage, filters]);

  // Récupérer les batches d'un cours
  const getBatchesByCourse = useCallback(async (courseId) => {
    try {
      const batchesList = await odooApi.getBatchesByCourse(courseId);
      return batchesList;
    } catch (err) {
      console.error('Erreur lors de la récupération des promotions du cours:', err);
      return [];
    }
  }, []);

  // Effet initial
  useEffect(() => {
    if (user?.id) {
      fetchBatches();
    }
  }, [user?.id]);

  return {
    // État
    batches,
    loading,
    error,
    pagination,
    filters,
    
    // Actions CRUD
    createBatch,
    updateBatch,
    deleteBatch,
    getBatch,
    
    // Actions de liste
    fetchBatches,
    changePage,
    changeLimit,
    search,
    sort,
    filterByCourse,
    filterByStatus,
    refresh,
    getBatchesByCourse,
    
    // Helpers
    isFirstPage: pagination.currentPage === 1,
    isLastPage: pagination.currentPage === pagination.totalPages,
    isEmpty: batches.length === 0 && !loading
  };
};

// Hook pour un batch spécifique avec ses étudiants
export const useBatch = (batchId) => {
  const [batch, setBatch] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentsPagination, setStudentsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 50,
    hasNext: false,
    hasPrev: false
  });
  const { user } = useAuth();

  // Récupérer les détails du batch
  const fetchBatch = useCallback(async () => {
    if (!user?.id || !batchId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const batchData = await odooApi.getBatch(batchId);
      console.log('Données du batch récupérées:', batchData);
      
      setBatch(batchData);
      
      // Utiliser les étudiants directement depuis la réponse du batch
      if (batchData && batchData.students) {
        setStudents(batchData.students);
        setStudentsPagination(prev => ({
          ...prev,
          totalCount: batchData.student_count || batchData.students.length,
          currentPage: 1
        }));
      }
    } catch (err) {
      console.error('Erreur lors de la récupération de la promotion:', err);
      setError(err.message || 'Erreur lors de la récupération de la promotion');
      setBatch(null);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [batchId, user?.id]);

  // Récupérer les étudiants du batch (pour pagination/recherche spécifique)
  const fetchBatchStudents = useCallback(async (page = 1, search = '') => {
    if (!user?.id || !batchId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Utiliser l'API spécialisée pour la récupération des étudiants avec pagination
      const result = await odooApi.getBatchStudents(batchId, page, studentsPagination.limit, search);
      setStudents(result.students || []);
      setStudentsPagination(result.pagination || studentsPagination);
    } catch (err) {
      console.error('Erreur lors de la récupération des étudiants:', err);
      setError(err.message || 'Erreur lors de la récupération des étudiants');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [batchId, user?.id, studentsPagination.limit]);

  // Mettre à jour le batch
  const updateBatch = useCallback(async (batchData) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedBatch = await odooApi.updateBatch(batchId, batchData);
      setBatch(updatedBatch);
      
      return { success: true, data: updatedBatch };
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la promotion:', err);
      const errorMessage = err.message || 'Erreur lors de la mise à jour de la promotion';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  // Ajouter un étudiant au batch
  const addStudent = useCallback(async (studentId) => {
    try {
      setLoading(true);
      setError(null);
      
      await odooApi.addStudentToBatch(batchId, studentId);
      
      // Rafraîchir la liste des étudiants
      await fetchBatchStudents();
      
      return { success: true };
    } catch (err) {
      console.error('Erreur lors de l\'ajout de l\'étudiant:', err);
      const errorMessage = err.message || 'Erreur lors de l\'ajout de l\'étudiant';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [batchId, fetchBatchStudents]);

  // Retirer un étudiant du batch
  const removeStudent = useCallback(async (studentId) => {
    try {
      setLoading(true);
      setError(null);
      
      await odooApi.removeStudentFromBatch(batchId, studentId);
      
      // Supprimer localement
      setStudents(prev => prev.filter(student => student.id !== studentId));
      
      return { success: true };
    } catch (err) {
      console.error('Erreur lors du retrait de l\'étudiant:', err);
      const errorMessage = err.message || 'Erreur lors du retrait de l\'étudiant';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    fetchBatch();
  }, [fetchBatch]);

  return {
    batch,
    students,
    loading,
    error,
    studentsPagination,
    refresh: fetchBatch,
    updateBatch,
    fetchBatchStudents,
    addStudent,
    removeStudent
  };
};

// Hook pour les statistiques des batches
export const useBatchStatistics = (batchId) => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchStatistics = useCallback(async () => {
    if (!user?.id || !batchId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const stats = await odooApi.getBatchStatistics(batchId);
      setStatistics(stats);
    } catch (err) {
      console.error('Erreur lors de la récupération des statistiques:', err);
      setError(err.message || 'Erreur lors de la récupération des statistiques');
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  }, [batchId, user?.id]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    refresh: fetchStatistics
  };
};