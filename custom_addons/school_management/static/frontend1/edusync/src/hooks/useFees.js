import { useState, useEffect, useCallback } from 'react';
import feesService from '../services/feesApi';
import API_CONFIG from '../config/apiConfig';

/**
 * Hook personnalisé pour la gestion des frais scolaires
 * Fournit les états et actions nécessaires pour les composants de frais
 */
export const useFees = () => {
  // États pour les données
  const [feesTerms, setFeesTerms] = useState([]);
  const [feesDetails, setFeesDetails] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [unpaidFees, setUnpaidFees] = useState([]);
  const [overdueFees, setOverdueFees] = useState([]);
  const [students, setStudents] = useState([]);

  // États pour l'interface utilisateur
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // États pour la pagination
  const [termsPagination, setTermsPagination] = useState({
    page: API_CONFIG.PAGINATION.DEFAULT_PAGE,
    limit: API_CONFIG.PAGINATION.DEFAULT_LIMIT,
    total: 0,
    pages: 0
  });

  const [detailsPagination, setDetailsPagination] = useState({
    page: API_CONFIG.PAGINATION.DEFAULT_PAGE,
    limit: API_CONFIG.PAGINATION.DEFAULT_LIMIT,
    total: 0,
    pages: 0
  });

  // Fonction utilitaire pour gérer les erreurs
  const handleError = useCallback((error, defaultMessage = 'Une erreur est survenue') => {
    const message = error.message || defaultMessage;
    setError(message);
    console.error('Erreur dans useFees:', error);
    
    // Auto-clear error après un délai
    setTimeout(() => setError(null), API_CONFIG.NOTIFICATIONS.ERROR_DURATION);
  }, []);

  // Fonction utilitaire pour gérer les succès
  const handleSuccess = useCallback((message) => {
    setSuccess(message);
    
    // Auto-clear success après un délai
    setTimeout(() => setSuccess(null), API_CONFIG.NOTIFICATIONS.SUCCESS_DURATION);
  }, []);

  // ================= ACTIONS POUR LES STATISTIQUES =================

  const loadStatistics = useCallback(async () => {
    try {
      const response = await feesService.statistics.getStatistics();
      
      if (response.status === 'success') {
        setStatistics(response.data);
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des statistiques');
      }
    } catch (error) {
      handleError(error, 'Erreur lors du chargement des statistiques');
    }
  }, [handleError]);

  const loadUnpaidFees = useCallback(async (params = {}) => {
    try {
      const response = await feesService.statistics.getUnpaidFees(params);
      
      if (response.status === 'success') {
        setUnpaidFees(response.data.unpaid_fees);
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des frais impayés');
      }
    } catch (error) {
      handleError(error, 'Erreur lors du chargement des frais impayés');
    }
  }, [handleError]);

  const loadOverdueFees = useCallback(async (params = {}) => {
    try {
      const response = await feesService.statistics.getOverdueFees(params);
      
      if (response.status === 'success') {
        setOverdueFees(response.data.overdue_fees);
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des frais en retard');
      }
    } catch (error) {
      handleError(error, 'Erreur lors du chargement des frais en retard');
    }
  }, [handleError]);

  const loadStudents = useCallback(async (params = {}) => {
    try {
      const response = await feesService.students.getSimpleList(params);
      
      if (response.status === 'success') {
        setStudents(response.data.students);
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des étudiants');
      }
    } catch (error) {
      handleError(error, 'Erreur lors du chargement des étudiants');
    }
  }, [handleError]);

  // ================= ACTIONS POUR LES TERMES DE FRAIS =================

  const loadFeesTerms = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const queryParams = {
        page: params.page || termsPagination.page,
        limit: params.limit || termsPagination.limit,
        ...params
      };

      const response = await feesService.terms.getTerms(queryParams);
      
      if (response.status === 'success') {
        setFeesTerms(response.data.fees_terms);
        setTermsPagination(response.data.pagination);
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des termes');
      }
    } catch (error) {
      handleError(error, 'Erreur lors du chargement des termes de frais');
    } finally {
      setLoading(false);
    }
  }, [termsPagination.page, termsPagination.limit, handleError]);

  const createTerm = useCallback(async (termData) => {
    try {
      setLoading(true);
      const response = await feesService.terms.createTerm(termData);
      
      if (response.status === 'success') {
        handleSuccess('Terme de frais créé avec succès');
        await loadFeesTerms(); // Recharger la liste
        return response.data;
      } else {
        throw new Error(response.message || 'Erreur lors de la création');
      }
    } catch (error) {
      handleError(error, 'Erreur lors de la création du terme de frais');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadFeesTerms, handleError, handleSuccess]);

  const updateTerm = useCallback(async (termId, termData) => {
    try {
      setLoading(true);
      const response = await feesService.terms.updateTerm(termId, termData);
      
      if (response.status === 'success') {
        handleSuccess('Terme de frais mis à jour avec succès');
        await loadFeesTerms(); // Recharger la liste
        return response.data;
      } else {
        throw new Error(response.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      handleError(error, 'Erreur lors de la mise à jour du terme de frais');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadFeesTerms, handleError, handleSuccess]);

  const deleteTerm = useCallback(async (termId) => {
    try {
      setLoading(true);
      const response = await feesService.terms.deleteTerm(termId);
      
      if (response.status === 'success') {
        handleSuccess('Terme de frais supprimé avec succès');
        await loadFeesTerms(); // Recharger la liste
        return response.data;
      } else {
        throw new Error(response.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      handleError(error, 'Erreur lors de la suppression du terme de frais');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadFeesTerms, handleError, handleSuccess]);

  // ================= ACTIONS POUR LES DÉTAILS DE FRAIS =================

  const loadFeesDetails = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const queryParams = {
        page: params.page || detailsPagination.page,
        limit: params.limit || detailsPagination.limit,
        ...params
      };

      const response = await feesService.details.getDetails(queryParams);
      
      if (response.status === 'success') {
        setFeesDetails(response.data.fees_details);
        setDetailsPagination(response.data.pagination);
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des détails');
      }
    } catch (error) {
      handleError(error, 'Erreur lors du chargement des détails de frais');
    } finally {
      setLoading(false);
    }
  }, [detailsPagination.page, detailsPagination.limit, handleError]);

  const createDetail = useCallback(async (detailData) => {
    try {
      setLoading(true);
      const response = await feesService.details.createDetail(detailData);
      
      if (response.status === 'success') {
        handleSuccess('Détail de frais créé avec succès');
        await loadFeesDetails(); // Recharger la liste
        return response.data;
      } else {
        throw new Error(response.message || 'Erreur lors de la création');
      }
    } catch (error) {
      handleError(error, 'Erreur lors de la création du détail de frais');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadFeesDetails, handleError, handleSuccess]);

  const updateDetail = useCallback(async (detailId, detailData) => {
    try {
      setLoading(true);
      const response = await feesService.details.updateDetail(detailId, detailData);
      
      if (response.status === 'success') {
        handleSuccess('Détail de frais mis à jour avec succès');
        await loadFeesDetails(); // Recharger la liste
        return response.data;
      } else {
        throw new Error(response.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      handleError(error, 'Erreur lors de la mise à jour du détail de frais');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadFeesDetails, handleError, handleSuccess]);

  const deleteDetail = useCallback(async (detailId) => {
    try {
      setLoading(true);
      const response = await feesService.details.deleteDetail(detailId);
      
      if (response.status === 'success') {
        handleSuccess('Détail de frais supprimé avec succès');
        await Promise.all([
          loadFeesDetails(),
          loadStatistics()
        ]);
        return response.data;
      } else {
        throw new Error(response.message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      handleError(error, 'Erreur lors de la suppression du détail de frais');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadFeesDetails, loadStatistics, handleError, handleSuccess]);

  // ================= ACTIONS SPÉCIALES =================

  const generateStudentFees = useCallback(async (studentId) => {
    try {
      setLoading(true);
      const response = await feesService.actions.generateStudentFees(studentId);
      
      if (response.status === 'success') {
        handleSuccess('Frais générés avec succès pour l\'étudiant');
        await Promise.all([
          loadFeesDetails(),
          loadStatistics()
        ]);
        return response.data;
      } else {
        throw new Error(response.message || 'Erreur lors de la génération des frais');
      }
    } catch (error) {
      handleError(error, 'Erreur lors de la génération des frais');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadFeesDetails, loadStatistics, handleError, handleSuccess]);

  const applyLateFee = useCallback(async (detailId) => {
    try {
      setLoading(true);
      const response = await feesService.actions.applyLateFee(detailId);
      
      if (response.status === 'success') {
        handleSuccess('Frais de retard appliqués avec succès');
        await Promise.all([
          loadFeesDetails(),
          loadStatistics(),
          loadOverdueFees()
        ]);
        return response.data;
      } else {
        throw new Error(response.message || 'Erreur lors de l\'application des frais de retard');
      }
    } catch (error) {
      handleError(error, 'Erreur lors de l\'application des frais de retard');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadFeesDetails, loadStatistics, loadOverdueFees, handleError, handleSuccess]);

  // ================= FONCTION DE CHARGEMENT INITIAL =================

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadFeesTerms(),
        loadFeesDetails(),
        loadStatistics(),
        loadUnpaidFees({ limit: 5 }),
        loadOverdueFees({ limit: 5 }),
        loadStudents()
      ]);
    } catch (error) {
      handleError(error, 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [loadFeesTerms, loadFeesDetails, loadStatistics, loadUnpaidFees, loadOverdueFees, loadStudents, handleError]);

  // ================= FONCTIONS DE PAGINATION =================

  const goToTermsPage = useCallback((page) => {
    setTermsPagination(prev => ({ ...prev, page }));
    loadFeesTerms({ page });
  }, [loadFeesTerms]);

  const goToDetailsPage = useCallback((page) => {
    setDetailsPagination(prev => ({ ...prev, page }));
    loadFeesDetails({ page });
  }, [loadFeesDetails]);

  // ================= FONCTION DE NETTOYAGE =================

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  // Retourner toutes les données et fonctions
  return {
    // Données
    feesTerms,
    feesDetails,
    statistics,
    unpaidFees,
    overdueFees,
    students,
    
    // États UI
    loading,
    error,
    success,
    
    // Pagination
    termsPagination,
    detailsPagination,
    
    // Actions pour les termes
    loadFeesTerms,
    createTerm,
    updateTerm,
    deleteTerm,
    
    // Actions pour les détails
    loadFeesDetails,
    createDetail,
    updateDetail,
    deleteDetail,
    
    // Actions pour les statistiques
    loadStatistics,
    loadUnpaidFees,
    loadOverdueFees,
    loadStudents,
    
    // Actions spéciales
    generateStudentFees,
    applyLateFee,
    
    // Utilitaires
    loadAllData,
    goToTermsPage,
    goToDetailsPage,
    clearMessages
  };
};

export default useFees; 