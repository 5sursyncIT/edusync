// src/hooks/useTeachers.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import odooApi from '../services/odooApi.jsx';

export const useTeachers = () => {
  const [teachers, setTeachers] = useState([]);
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

  // État pour les filtres
  const [filters, setFilters] = useState({
    search: '',
    departmentId: null,
    active: null,
    order: 'name asc'
  });

  // Récupérer la liste des enseignants
  const fetchTeachers = useCallback(async (
    current_page = 1, 
    search = '', 
    order = 'name asc',
    departmentId = null,
    activeFilter = null
  ) => {
    try {
      console.log('🔄 fetchTeachers appelé avec:', { current_page, search, order, departmentId, activeFilter });
      setLoading(true);
      setError(null);
      
      // S'assurer que current_page est un nombre
      const current_pageNumber = parseInt(current_page) || 1;
      
      console.log('📡 Appel API getTeachers...');
      const response = await odooApi.getTeachers(
        current_pageNumber,
        20,
        search || '',
        order || 'name asc',
        {
          ...(departmentId ? { main_department_id: departmentId } : {}),
          ...(activeFilter !== null ? { active: activeFilter } : {})
        }
      );
      
      console.log('✅ Réponse API reçue:', response);
      console.log('📊 Structure de response:', {
        hasData: !!response?.data,
        hasTeachers: !!response?.data?.teachers,
        teachersType: typeof response?.data?.teachers,
        teachersLength: response?.data?.teachers?.length,
        teachersContent: response?.data?.teachers
      });
      
      const teachersData = response?.data?.teachers || [];
      console.log('👥 Teachers extraits:', teachersData);
      console.log('📈 Nombre d\'enseignants:', teachersData.length);
      
      // Mise à jour de l'état
      console.log('🔄 Mise à jour de l\'état teachers...');
      setTeachers(teachersData);
      
      const paginationData = {
        currentPage: parseInt(response?.data?.pagination?.page, 10) || current_pageNumber || 1,
        totalPages: parseInt(response?.data?.pagination?.pages, 10) || 1,
        totalCount: parseInt(response?.data?.pagination?.total, 10) || 0,
        limit: parseInt(response?.data?.pagination?.limit, 10) || 20,
        hasNext: (response?.data?.pagination?.page || 1) < (response?.data?.pagination?.pages || 1),
        hasPrev: (response?.data?.pagination?.page || 1) > 1
      };
      
      console.log('📄 Pagination mise à jour:', paginationData);
      setPagination(paginationData);

      setFilters(prev => ({
        ...prev,
        search: search || '',
        order: order || 'name asc',
        departmentId,
        active: activeFilter
      }));

      console.log('✅ State mis à jour - Teachers count:', teachersData.length);

    } catch (err) {
      console.error('❌ Erreur lors de la récupération des enseignants:', err);
      setError(err.message || 'Erreur lors de la récupération des enseignants');
      setTeachers([]);
    } finally {
      setLoading(false);
      console.log('⏰ Loading mis à false');
    }
  }, []);

  // Créer un enseignant
  const createTeacher = useCallback(async (teacherData) => {
    try {
      setLoading(true);
      setError(null);
      
      const newTeacher = await odooApi.createTeacher(teacherData);
      
      // Rafraîchir la liste avec un appel direct à l'API
      try {
        const response = await odooApi.getTeachers(
          1,
          20,
          '',
          'name asc',
          {}
        );
        
        setTeachers(response?.data?.teachers || []);
        setPagination({
          currentPage: parseInt(response?.data?.pagination?.page, 10) || 1,
          totalPages: parseInt(response?.data?.pagination?.pages, 10) || 1,
          totalCount: parseInt(response?.data?.pagination?.total, 10) || 0,
          limit: parseInt(response?.data?.pagination?.limit, 10) || 20,
          hasNext: (response?.data?.pagination?.page || 1) < (response?.data?.pagination?.pages || 1),
          hasPrev: (response?.data?.pagination?.page || 1) > 1
        });

        setFilters(prev => ({
          ...prev,
          search: '',
          order: 'name asc',
          departmentId: null,
          active: null
        }));
      } catch (refreshErr) {
        console.error('Erreur lors du rafraîchissement après création:', refreshErr);
      }
      
      return { success: true, data: newTeacher };
    } catch (err) {
      console.error('Erreur lors de la création de l\'enseignant:', err);
      const errorMessage = err.message || 'Erreur lors de la création de l\'enseignant';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Mettre à jour un enseignant
  const updateTeacher = useCallback(async (id, teacherData) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedTeacher = await odooApi.updateTeacher(id, teacherData);
      
      // Mettre à jour localement
      setTeachers(prev => prev.map(teacher => 
        teacher.id === id ? { ...teacher, ...updatedTeacher } : teacher
      ));
      
      return { success: true, data: updatedTeacher };
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'enseignant:', err);
      const errorMessage = err.message || 'Erreur lors de la mise à jour de l\'enseignant';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Supprimer un enseignant
  const deleteTeacher = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      await odooApi.deleteTeacher(id);
      
      // Supprimer localement
      setTeachers(prev => prev.filter(teacher => teacher.id !== id));
      
      // Mettre à jour la pagination
      setPagination(prev => ({
        ...prev,
        totalCount: prev.totalCount - 1
      }));
      
      // Si la current_page actuelle n'a plus d'éléments, faire un appel direct à l'API
      if (teachers.length === 1 && pagination.currentPage > 1) {
        try {
          const response = await odooApi.getTeachers(
            parseInt(pagination.currentPage, 10) - 1,
            parseInt(pagination.limit, 10) || 20,
            filters.search || '',
            filters.order || 'name asc',
            {
              ...(filters.departmentId ? { main_department_id: filters.departmentId } : {}),
              ...(filters.active !== null ? { active: filters.active } : {})
            }
          );
          
          setTeachers(response?.data?.teachers || []);
          setPagination({
            currentPage: parseInt(response?.data?.pagination?.page, 10) || Math.max(1, parseInt(pagination.currentPage, 10) - 1),
            totalPages: parseInt(response?.data?.pagination?.pages, 10) || 1,
            totalCount: parseInt(response?.data?.pagination?.total, 10) || 0,
            limit: parseInt(response?.data?.pagination?.limit, 10) || 20,
            hasNext: (response?.data?.pagination?.page || 1) < (response?.data?.pagination?.pages || 1),
            hasPrev: (response?.data?.pagination?.page || 1) > 1
          });
        } catch (refreshErr) {
          console.error('Erreur lors du rafraîchissement après suppression:', refreshErr);
        }
      }
      
      return { success: true };
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'enseignant:', err);
      const errorMessage = err.message || 'Erreur lors de la suppression de l\'enseignant';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [teachers.length, pagination.currentPage, pagination.limit, filters.search, filters.order, filters.departmentId, filters.active]);

  // Récupérer un enseignant spécifique
  const getTeacher = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const teacher = await odooApi.getTeacher(id);
      return { success: true, data: teacher };
    } catch (err) {
      console.error('Erreur lors de la récupération de l\'enseignant:', err);
      const errorMessage = err.message || 'Erreur lors de la récupération de l\'enseignant';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Changer de current_page
  const changePage = useCallback(async (newPage) => {
    // Valider et convertir newPage en nombre
    const current_pageNumber = parseInt(newPage, 10);
    if (isNaN(current_pageNumber) || current_pageNumber < 1) {
      console.error('Page invalide dans changePage:', newPage);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await odooApi.getTeachers(
        current_pageNumber,
        parseInt(pagination.limit, 10) || 20,
        filters.search || '',
        filters.order || 'name asc',
        {
          ...(filters.departmentId ? { main_department_id: filters.departmentId } : {}),
          ...(filters.active !== null ? { active: filters.active } : {})
        }
      );
      
      setTeachers(response?.data?.teachers || []);
      setPagination({
        currentPage: parseInt(response?.data?.pagination?.page, 10) || current_pageNumber || 1,
        totalPages: parseInt(response?.data?.pagination?.pages, 10) || 1,
        totalCount: parseInt(response?.data?.pagination?.total, 10) || 0,
        limit: parseInt(response?.data?.pagination?.limit, 10) || 20,
        hasNext: (response?.data?.pagination?.page || 1) < (response?.data?.pagination?.pages || 1),
        hasPrev: (response?.data?.pagination?.page || 1) > 1
      });

    } catch (err) {
      console.error('Erreur lors du changement de current_page:', err);
      setError(err.message || 'Erreur lors du changement de current_page');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, filters.search, filters.order, filters.departmentId, filters.active]);

  // Changer le nombre d'éléments par current_page
  const changeLimit = useCallback(async (newLimit) => {
    const limitNumber = parseInt(newLimit, 10);
    if (isNaN(limitNumber) || limitNumber < 1) {
      console.error('Limite invalide:', newLimit);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await odooApi.getTeachers(
        1,
        limitNumber,
        filters.search || '',
        filters.order || 'name asc',
        {
          ...(filters.departmentId ? { main_department_id: filters.departmentId } : {}),
          ...(filters.active !== null ? { active: filters.active } : {})
        }
      );
      
      setTeachers(response?.data?.teachers || []);
      setPagination({
        currentPage: 1,
        totalPages: parseInt(response?.data?.pagination?.pages, 10) || 1,
        totalCount: parseInt(response?.data?.pagination?.total, 10) || 0,
        limit: limitNumber,
        hasNext: (response?.data?.pagination?.page || 1) < (response?.data?.pagination?.pages || 1),
        hasPrev: (response?.data?.pagination?.page || 1) > 1
      });

    } catch (err) {
      console.error('Erreur lors du changement de limite:', err);
      setError(err.message || 'Erreur lors du changement de limite');
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.order, filters.departmentId, filters.active]);

  // Rechercher
  const search = useCallback(async (searchTerm) => {
    try {
      setLoading(true);
      setError(null);

      const response = await odooApi.getTeachers(
        1,
        parseInt(pagination.limit, 10) || 20,
        searchTerm || '',
        filters.order || 'name asc',
        {
          ...(filters.departmentId ? { main_department_id: filters.departmentId } : {}),
          ...(filters.active !== null ? { active: filters.active } : {})
        }
      );
      
      setTeachers(response?.data?.teachers || []);
      setPagination({
        currentPage: 1,
        totalPages: parseInt(response?.data?.pagination?.pages, 10) || 1,
        totalCount: parseInt(response?.data?.pagination?.total, 10) || 0,
        limit: parseInt(pagination.limit, 10) || 20,
        hasNext: (response?.data?.pagination?.page || 1) < (response?.data?.pagination?.pages || 1),
        hasPrev: (response?.data?.pagination?.page || 1) > 1
      });

      setFilters(prev => ({
        ...prev,
        search: searchTerm || ''
      }));

    } catch (err) {
      console.error('Erreur lors de la recherche:', err);
      setError(err.message || 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, filters.order, filters.departmentId, filters.active]);

  // Trier
  const sort = useCallback(async (field, direction = 'asc') => {
    const newOrder = `${field} ${direction}`;

    try {
      setLoading(true);
      setError(null);

      const response = await odooApi.getTeachers(
        parseInt(pagination.currentPage, 10) || 1,
        parseInt(pagination.limit, 10) || 20,
        filters.search || '',
        newOrder,
        {
          ...(filters.departmentId ? { main_department_id: filters.departmentId } : {}),
          ...(filters.active !== null ? { active: filters.active } : {})
        }
      );
      
      setTeachers(response?.data?.teachers || []);
      setPagination(prev => ({
        ...prev,
        totalPages: parseInt(response?.data?.pagination?.pages, 10) || 1,
        totalCount: parseInt(response?.data?.pagination?.total, 10) || 0,
        hasNext: (response?.data?.pagination?.page || 1) < (response?.data?.pagination?.pages || 1),
        hasPrev: (response?.data?.pagination?.page || 1) > 1
      }));

      setFilters(prev => ({
        ...prev,
        order: newOrder
      }));

    } catch (err) {
      console.error('Erreur lors du tri:', err);
      setError(err.message || 'Erreur lors du tri');
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.limit, filters.search, filters.departmentId, filters.active]);

  // Filtrer par département
  const filterByDepartment = useCallback(async (departmentId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await odooApi.getTeachers(
        1,
        parseInt(pagination.limit, 10) || 20,
        filters.search || '',
        filters.order || 'name asc',
        {
          ...(departmentId ? { main_department_id: departmentId } : {}),
          ...(filters.active !== null ? { active: filters.active } : {})
        }
      );
      
      setTeachers(response?.data?.teachers || []);
      setPagination({
        currentPage: 1,
        totalPages: parseInt(response?.data?.pagination?.pages, 10) || 1,
        totalCount: parseInt(response?.data?.pagination?.total, 10) || 0,
        limit: parseInt(pagination.limit, 10) || 20,
        hasNext: (response?.data?.pagination?.page || 1) < (response?.data?.pagination?.pages || 1),
        hasPrev: (response?.data?.pagination?.page || 1) > 1
      });

      setFilters(prev => ({
        ...prev,
        departmentId
      }));

    } catch (err) {
      console.error('Erreur lors du filtrage par département:', err);
      setError(err.message || 'Erreur lors du filtrage');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, filters.search, filters.order, filters.active]);

  // Filtrer par statut actif
  const filterByActive = useCallback(async (active) => {
    try {
      setLoading(true);
      setError(null);

      const response = await odooApi.getTeachers(
        1,
        parseInt(pagination.limit, 10) || 20,
        filters.search || '',
        filters.order || 'name asc',
        {
          ...(filters.departmentId ? { main_department_id: filters.departmentId } : {}),
          ...(active !== null ? { active: active } : {})
        }
      );
      
      setTeachers(response?.data?.teachers || []);
      setPagination({
        currentPage: 1,
        totalPages: parseInt(response?.data?.pagination?.pages, 10) || 1,
        totalCount: parseInt(response?.data?.pagination?.total, 10) || 0,
        limit: parseInt(pagination.limit, 10) || 20,
        hasNext: (response?.data?.pagination?.page || 1) < (response?.data?.pagination?.pages || 1),
        hasPrev: (response?.data?.pagination?.page || 1) > 1
      });

      setFilters(prev => ({
        ...prev,
        active
      }));

    } catch (err) {
      console.error('Erreur lors du filtrage par statut:', err);
      setError(err.message || 'Erreur lors du filtrage');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, filters.search, filters.order, filters.departmentId]);

  // Rafraîchir
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await odooApi.getTeachers(
        parseInt(pagination.currentPage, 10) || 1,
        parseInt(pagination.limit, 10) || 20,
        filters.search || '',
        filters.order || 'name asc',
        {
          ...(filters.departmentId ? { main_department_id: filters.departmentId } : {}),
          ...(filters.active !== null ? { active: filters.active } : {})
        }
      );
      
      setTeachers(response?.data?.teachers || []);
      setPagination(prev => ({
        ...prev,
        totalPages: parseInt(response?.data?.pagination?.pages, 10) || 1,
        totalCount: parseInt(response?.data?.pagination?.total, 10) || 0,
        hasNext: (response?.data?.pagination?.page || 1) < (response?.data?.pagination?.pages || 1),
        hasPrev: (response?.data?.pagination?.page || 1) > 1
      }));

    } catch (err) {
      console.error('Erreur lors du rafraîchissement:', err);
      setError(err.message || 'Erreur lors du rafraîchissement');
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.limit, filters]);

  // Récupérer tous les enseignants (pour les dropdowns)
  const getAllTeachers = useCallback(async () => {
    try {
      const response = await odooApi.getAllTeachers();
      console.log('🔍 getAllTeachers response:', response);
      
      // Extraire le tableau des enseignants de la réponse API
      if (response && response.status === 'success' && response.data && Array.isArray(response.data.teachers)) {
        console.log('✅ getAllTeachers: Retour de', response.data.teachers.length, 'enseignants');
        return response.data.teachers;
      } else if (response && Array.isArray(response.data)) {
        // Au cas où l'API retourne directement data comme tableau
        console.log('✅ getAllTeachers: Retour de', response.data.length, 'enseignants (format alternatif)');
        return response.data;
      } else if (response && Array.isArray(response)) {
        // Au cas où l'API retourne directement un tableau
        console.log('✅ getAllTeachers: Retour de', response.length, 'enseignants (format direct)');
        return response;
      } else {
        console.warn('⚠️ getAllTeachers: Format de réponse non reconnu:', response);
        return [];
      }
    } catch (err) {
      console.error('❌ Erreur lors de la récupération de tous les enseignants:', err);
      return [];
    }
  }, []);

  // Effet initial
  useEffect(() => {
    // Fonction de chargement initial séparée pour éviter les boucles
    const loadInitialTeachers = async () => {
      try {
        console.log('🚀 loadInitialTeachers appelé au montage du composant');
        setLoading(true);
        setError(null);
        
        console.log('📡 Appel API getTeachers (initial)...');
        const response = await odooApi.getTeachers(
          1,
          20,
          '',
          'name asc',
          {}
        );
        
        console.log('✅ Réponse API initiale reçue:', response);
        console.log('📊 Structure de response (initial):', {
          hasTeachers: !!response.data?.teachers,
          teachersType: typeof response.data?.teachers,
          teachersLength: response.data?.teachers?.length,
          teachersContent: response.data?.teachers,
          hasPagination: !!response.data?.pagination
        });
        
        const teachersData = response.data?.teachers || [];
        console.log('👥 Teachers extraits (initial):', teachersData);
        console.log('📈 Nombre d\'enseignants (initial):', teachersData.length);
        
        console.log('🔄 Mise à jour de l\'état teachers (initial)...');
        setTeachers(teachersData);
        
        const paginationData = {
          currentPage: parseInt(response.data?.pagination?.page, 10) || 1,
          totalPages: parseInt(response.data?.pagination?.pages, 10) || 1,
          totalCount: parseInt(response.data?.pagination?.total, 10) || 0,
          limit: parseInt(response.data?.pagination?.limit, 10) || 20,
          hasNext: (response.data?.pagination?.page || 1) < (response.data?.pagination?.pages || 1),
          hasPrev: (response.data?.pagination?.page || 1) > 1
        };
        
        console.log('📄 Pagination mise à jour (initial):', paginationData);
        setPagination(paginationData);

        setFilters(prev => ({
          ...prev,
          search: '',
          order: 'name asc',
          departmentId: null,
          active: null
        }));

        console.log('✅ State initial mis à jour - Teachers count:', teachersData.length);

      } catch (err) {
        console.error('❌ Erreur lors de la récupération initiale des enseignants:', err);
        setError(err.message || 'Erreur lors de la récupération des enseignants');
        setTeachers([]);
      } finally {
        setLoading(false);
        console.log('⏰ Loading initial mis à false');
      }
    };

    loadInitialTeachers();
  }, []); // Pas de dépendances, charge seulement au montage

  return {
    // État
    teachers,
    loading,
    error,
    pagination,
    filters,
    
    // Actions CRUD
    createTeacher,
    updateTeacher,
    deleteTeacher,
    getTeacher,
    
    // Actions de liste
    fetchTeachers,
    changePage,
    changeLimit,
    search,
    sort,
    filterByDepartment,
    filterByActive,
    refresh,
    getAllTeachers,
    
    // Helpers
    isFirstPage: parseInt(pagination.currentPage, 10) === 1,
    isLastPage: parseInt(pagination.currentPage, 10) === parseInt(pagination.totalPages, 10),
    isEmpty: teachers.length === 0 && !loading
  };
};

