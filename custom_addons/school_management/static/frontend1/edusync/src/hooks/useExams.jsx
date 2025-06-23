// src/hooks/useExams.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import odooApi from '../services/odooApi.jsx';

// Hook principal pour les examens
export const useExams = (page = 1, limit = 20, filters = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchExams = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await odooApi.getExams(page, limit, '', filters);
      setData(result);
    } catch (err) {
      console.error('Erreur lors de la récupération des examens:', err);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, page, limit, JSON.stringify(filters)]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchExams();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [fetchExams]);

  return {
    data,
    loading,
    error,
    refetch: fetchExams
  };
};

// Hook pour un examen spécifique
export const useExam = (examId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchExam = useCallback(async () => {
    if (!user?.id || !examId) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await odooApi.getExam(examId);
      setData(result);
    } catch (err) {
      console.error(`Erreur lors de la récupération de l'examen ${examId}:`, err);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, examId]);

  useEffect(() => {
    if (examId) {
      fetchExam();
    }
  }, [fetchExam]);

  return {
    data,
    loading,
    error,
    refetch: fetchExam
  };
};

// Hook pour les notes d'un examen
export const useExamGrades = (examId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const fetchGrades = useCallback(async () => {
    if (!user?.id || !examId) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await odooApi.getExamGrades(examId);
      setData(result);
    } catch (err) {
      console.error(`Erreur lors de la récupération des notes de l'examen ${examId}:`, err);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, examId]);

  const updateGrades = useCallback(async (grades) => {
    try {
      setSaving(true);
      setError(null);
      
      await odooApi.updateExamGrades(examId, grades);
      
      // Rafraîchir les données après la mise à jour
      await fetchGrades();
      
      return { success: true };
    } catch (err) {
      console.error(`Erreur lors de la mise à jour des notes:`, err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, [examId, fetchGrades]);

  const updateSingleGrade = useCallback(async (gradeId, note, appreciation = '') => {
    try {
      setSaving(true);
      setError(null);
      
      await odooApi.updateSingleGrade(examId, gradeId, note, appreciation);
      
      // Rafraîchir les données après la mise à jour
      await fetchGrades();
      
      return { success: true };
    } catch (err) {
      console.error(`Erreur lors de la mise à jour de la note:`, err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setSaving(false);
    }
  }, [examId, fetchGrades]);

  useEffect(() => {
    if (examId) {
      fetchGrades();
    }
  }, [fetchGrades]);

  return {
    data,
    loading,
    error,
    saving,
    refetch: fetchGrades,
    updateGrades,
    updateSingleGrade
  };
};

// Hook pour les statistiques des examens
export const useExamsStatistics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchStatistics = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await odooApi.getExamsStatistics();
      setData(result);
    } catch (err) {
      console.error('Erreur lors de la récupération des statistiques:', err);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchStatistics();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [fetchStatistics]);

  return {
    data,
    loading,
    error,
    refetch: fetchStatistics
  };
};

// Hook pour les types d'évaluation
export const useEvaluationTypes = (niveauScolaire = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchEvaluationTypes = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await odooApi.getEvaluationTypes(niveauScolaire);
      
      // Extraire les données correctement selon la structure de l'API
      if (result && result.status === 'success') {
        // Les données sont dans result.data (un tableau)
        setData(result.data || []);
      } else {
        console.warn('⚠️ useEvaluationTypes (useExams): Format de réponse inattendu:', result);
        setData([]);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des types d\'évaluation:', err);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, niveauScolaire]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchEvaluationTypes();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [fetchEvaluationTypes]);

  return {
    data,
    loading,
    error,
    refetch: fetchEvaluationTypes
  };
};

// Hook pour les actions sur les examens (créer, modifier, supprimer)
export const useExamActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createExam = useCallback(async (examData) => {
    try {
      setLoading(true);
      setError(null);
      
      const validationErrors = odooApi.validateExamData(examData);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }
      
      const result = await odooApi.createExam(examData);
      return { success: true, data: result };
    } catch (err) {
      console.error('Erreur lors de la création de l\'examen:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateExam = useCallback(async (examId, examData) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await odooApi.updateExam(examId, examData);
      return { success: true, data: result };
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'examen:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteExam = useCallback(async (examId) => {
    try {
      setLoading(true);
      setError(null);
      
      await odooApi.deleteExam(examId);
      return { success: true };
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'examen:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const startExam = useCallback(async (examId) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await odooApi.startExam(examId);
      return { success: true, data: result };
    } catch (err) {
      console.error('Erreur lors du démarrage de l\'examen:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const finishExam = useCallback(async (examId) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await odooApi.finishExam(examId);
      return { success: true, data: result };
    } catch (err) {
      console.error('Erreur lors de la finalisation de l\'examen:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelExam = useCallback(async (examId) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await odooApi.cancelExam(examId);
      return { success: true, data: result };
    } catch (err) {
      console.error('Erreur lors de l\'annulation de l\'examen:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const duplicateExam = useCallback(async (examId, newData = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await odooApi.duplicateExam(examId, newData);
      return { success: true, data: result };
    } catch (err) {
      console.error('Erreur lors de la duplication de l\'examen:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const exportResults = useCallback(async (examId, format = 'csv') => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await odooApi.exportExamResults(examId, format);
      return { success: true, data: result };
    } catch (err) {
      console.error('Erreur lors de l\'export:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createExam,
    updateExam,
    deleteExam,
    startExam,
    finishExam,
    cancelExam,
    duplicateExam,
    exportResults,
    clearError: () => setError(null)
  };
};

// Hook pour les examens filtrés par entité
export const useExamsByEntity = (entityType, entityId, state = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchExams = useCallback(async () => {
    if (!user?.id || !entityId) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let result;
      switch (entityType) {
        case 'course':
          result = await odooApi.getExamsByCourse(entityId, state);
          break;
        case 'batch':
          result = await odooApi.getExamsByBatch(entityId, state);
          break;
        case 'subject':
          result = await odooApi.getExamsBySubject(entityId, state);
          break;
        case 'teacher':
          result = await odooApi.getExamsByTeacher(entityId, state);
          break;
        default:
          throw new Error(`Type d'entité non supporté: ${entityType}`);
      }
      
      setData(result);
    } catch (err) {
      console.error(`Erreur lors de la récupération des examens pour ${entityType} ${entityId}:`, err);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, entityType, entityId, state]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchExams();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [fetchExams]);

  return {
    data,
    loading,
    error,
    refetch: fetchExams
  };
};

// Hook pour la recherche d'examens
export const useExamSearch = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const searchExams = useCallback(async (filters, page = 1, limit = 20, order = 'date desc') => {
    if (!user?.id) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await odooApi.searchExams(filters, page, limit, order);
      setData(result);
      return result;
    } catch (err) {
      console.error('Erreur lors de la recherche d\'examens:', err);
      setError(err.message);
      setData(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const clearSearch = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    searchExams,
    clearSearch
  };
};