// src/components/exams/ExamList.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Avatar,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Skeleton,
  Stack,
  Divider,
  useTheme,
  alpha,
  LinearProgress,
  Tooltip,
  Badge,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Collapse,
  AvatarGroup,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Today as TodayIcon,
  DateRange as DateRangeIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Grade as GradeIcon,
  Warning as WarningIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Cancel as CancelIcon,
  GetApp as DownloadIcon,
  Refresh as RefreshIcon,
  Dashboard as DashboardIcon,
  CalendarToday as CalendarIcon,
  Book as BookIcon,
  ExpandLess,
  ExpandMore,
  Timeline as TimelineIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  PriorityHigh as PriorityIcon
} from '@mui/icons-material';
import { useExams, useExamActions } from '../../hooks/useExams';
import { useAllSubjects, useAllTeachers, useBatches } from '../../hooks/useOdoo';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import ConfirmDialog from '../common/ConfirmDialog';

// Composant TabPanel pour les onglets
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ExamList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, isAuthenticated } = useAuth();
  
  // États locaux
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, exam: null });
  const [showFilters, setShowFilters] = useState(false);
  const [showUpcomingDetails, setShowUpcomingDetails] = useState(false);
  const [filters, setFilters] = useState({
    subject_id: '',
    course_id: '',
    batch_id: '',
    state: '',
    exam_type: ''
  });

  // Hooks
  const {
    data: examsData,
    loading,
    error,
    refetch: fetchExams
  } = useExams(currentPage, rowsPerPage, filters);
  
  // Hook pour les actions d'examen
  const {
    loading: actionLoading,
    error: actionError,
    createExam,
    updateExam,
    deleteExam,
    startExam,
    finishExam,
    cancelExam,
    duplicateExam,
    exportResults,
    clearError
  } = useExamActions();
  
  const { data: subjectsData } = useAllSubjects();
  const { data: teachersData } = useAllTeachers();
  const { batches = [] } = useBatches();

  // Debug: Afficher les données reçues
  useEffect(() => {
    console.log('🔍 Debug ExamList - Données reçues:', {
      user,
      isAuthenticated,
      examsData,
      loading,
      error,
      hasData: !!examsData,
      dataKeys: examsData ? Object.keys(examsData) : [],
      status: examsData?.status,
      dataStructure: examsData?.data ? Object.keys(examsData.data) : null,
      examsArray: examsData?.data?.exams || examsData?.exams,
      examsCount: (examsData?.data?.exams || examsData?.exams || []).length
    });
    
    // Debug: Afficher les examens avec leurs IDs
    const examsList = examsData?.data?.exams || examsData?.exams || [];
    if (examsList.length > 0) {
      console.log('📋 Examens disponibles:', examsList.map(exam => ({
        id: exam.id,
        name: exam.name,
        hasValidId: exam.id && !isNaN(exam.id)
      })));
    }
  }, [user, isAuthenticated, examsData, loading, error]);

  // Extraction correcte des données selon la structure API
  const subjects = subjectsData?.subjects || [];
  const teachers = teachersData?.teachers || [];
  
  // Correction: Gérer la structure de données selon l'API
  const exams = useMemo(() => {
    if (!examsData) return [];
    
    // Si examsData.status === 'success', alors les données sont dans examsData.data
    if (examsData.status === 'success' && examsData.data?.exams) {
      console.log('✅ Structure API correcte - exams trouvés:', examsData.data.exams.length);
      return examsData.data.exams;
    }
    
    // Fallback pour d'autres structures possibles
    if (examsData.exams) {
      console.log('✅ Structure directe - exams trouvés:', examsData.exams.length);
      return examsData.exams;
    }
    
    // Si examsData est directement un tableau
    if (Array.isArray(examsData)) {
      console.log('✅ Tableau direct - exams trouvés:', examsData.length);
      return examsData;
    }
    
    console.log('⚠️ Structure de données non reconnue:', examsData);
    return [];
  }, [examsData]);

  // Filtrage des examens selon les critères
  const filteredExams = useMemo(() => {
    if (!exams || !Array.isArray(exams)) return [];
    
    return exams.filter(exam => {
      // Filtre par terme de recherche
      if (searchTerm && !exam.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filtre par matière
      if (filters.subject_id && exam.subject_id !== parseInt(filters.subject_id)) {
        return false;
      }
      
      // Filtre par état
      if (filters.state && exam.state !== filters.state) {
        return false;
      }
      
      return true;
    });
  }, [exams, searchTerm, filters]);

  // Données du tableau de bord
  const dashboardStats = useMemo(() => {
    console.log('📊 Calcul des statistiques avec:', exams.length, 'examens');
    
    if (!exams.length) return { 
      total: 0, 
      upcoming: 0, 
      ongoing: 0, 
      completed: 0,
      overdue: 0,
      bySubject: {},
      byCourse: {},
      upcomingList: [],
      overdueList: []
    };
    
    const today = new Date();
    const upcoming = exams.filter(exam => {
      if (!exam.date) return false;
      const examDate = new Date(exam.date);
      return examDate > today && exam.state === 'draft';
    });
    
    const overdue = exams.filter(exam => {
      if (!exam.date) return false;
      const examDate = new Date(exam.date);
      return examDate < today && exam.state === 'draft';
    });
    
    const ongoing = exams.filter(exam => exam.state === 'ongoing');
    const completed = exams.filter(exam => exam.state === 'done');
    
    // Statistiques par matière
    const bySubject = {};
    exams.forEach(exam => {
      const subjectName = exam.subject_name || exam.subject?.name;
      if (subjectName) {
        bySubject[subjectName] = (bySubject[subjectName] || 0) + 1;
      }
    });
    
    // Statistiques par cours
    const byCourse = {};
    exams.forEach(exam => {
      const courseName = exam.course_name || exam.course?.name;
      if (courseName) {
        byCourse[courseName] = (byCourse[courseName] || 0) + 1;
      }
    });
    
    const stats = {
      total: exams.length,
      upcoming: upcoming.length,
      ongoing: ongoing.length,
      completed: completed.length,
      overdue: overdue.length,
      bySubject,
      byCourse,
      upcomingList: upcoming.slice(0, 5),
      overdueList: overdue.slice(0, 3)
    };
    
    console.log('📊 Statistiques calculées:', stats);
    return stats;
  }, [exams]);

  // Pagination
  const pagination = useMemo(() => {
    if (!examsData) return { total_pages: 1, total_count: 0 };
    
    if (examsData.status === 'success' && examsData.data?.pagination) {
      return {
        total_pages: examsData.data.pagination.totalPages || 1,
        total_count: examsData.data.pagination.totalCount || 0
      };
    }
    
    return examsData?.pagination || { total_pages: 1, total_count: 0 };
  }, [examsData]);

  // Gestionnaires d'événements
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      subject_id: '',
      course_id: '',
      batch_id: '',
      state: '',
      exam_type: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (!deleteConfirm.exam) return;

    console.log('🗑️ Suppression de l\'examen:', deleteConfirm.exam.id);
    
    const result = await deleteExam(deleteConfirm.exam.id);
    if (result.success) {
      console.log('✅ Examen supprimé avec succès');
      setDeleteConfirm({ open: false, exam: null });
      fetchExams(); // Recharger la liste
    } else {
      console.error('❌ Erreur lors de la suppression:', result.error);
    }
  };

  const handleDeleteConfirmation = (exam) => {
    console.log('🔍 Confirmation de suppression pour:', exam);
    setDeleteConfirm({ open: true, exam });
  };

  const handleStateChange = async (exam, action) => {
    console.log(`🔄 Changement d'état de l'examen ${exam.id}: ${action}`);
    
    let result;
    switch (action) {
      case 'start':
        result = await startExam(exam.id);
        break;
      case 'finish':
        result = await finishExam(exam.id);
        break;
      case 'cancel':
        result = await cancelExam(exam.id);
        break;
      default:
        return;
    }

    if (result.success) {
      console.log(`✅ État changé avec succès: ${action}`);
      fetchExams(); // Recharger la liste
    } else {
      console.error(`❌ Erreur lors du changement d'état:`, result.error);
    }
  };

  const handleChangePage = (event, newPage) => {
    setCurrentPage(newPage + 1);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(1);
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  // Utilitaires d'affichage
  const getStateBadge = (state) => {
    const stateConfig = {
      draft: { label: 'Brouillon', color: 'default' },
      ongoing: { label: 'En cours', color: 'info' },
      done: { label: 'Terminé', color: 'success' },
      cancelled: { label: 'Annulé', color: 'error' }
    };
    const config = stateConfig[state] || { label: state, color: 'default' };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const getDaysUntilExam = (dateString) => {
    if (!dateString) return null;
    const examDate = new Date(dateString);
    const today = new Date();
    const diffTime = examDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Vérification d'authentification
  if (!isAuthenticated || !user) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          Vous devez être connecté pour voir les examens. Veuillez vous connecter.
        </Alert>
      </Container>
    );
  }

  if (loading && !exams.length) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {[...Array(5)].map((_, index) => (
            <Grid item xs={12} sm={6} md={2.4} key={index}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
          <Grid item xs={12}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* En-tête avec titre */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Gestion des Examens
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gérez les examens, les notes et les évaluations
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            size="large"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
            onClick={() => {
              console.log('🔄 Rafraîchissement manuel des examens');
              fetchExams();
            }}
            disabled={loading}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 'medium'
            }}
          >
            {loading ? 'Chargement...' : 'Actualiser'}
          </Button>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => navigate('/exams/new')}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 'medium',
              background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
              boxShadow: `0 3px 5px 2px ${theme.palette.primary.main}30`,
              '&:hover': {
                boxShadow: `0 6px 10px 4px ${theme.palette.primary.main}30`,
              }
            }}
          >
            Nouvel Examen
          </Button>
          
        </Stack>
      </Box>

      {/* Messages d'erreur */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          Erreur lors du chargement des examens: {error}
        </Alert>
      )}

      {actionError && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={clearError}
        >
          Erreur lors de l'action: {actionError}
        </Alert>
      )}

      {/* Tableau de bord avec statistiques amélioré */}
     

      {/* Onglets pour navigation */}
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={selectedTab} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 'medium',
                fontSize: '1rem',
                minHeight: 64,
                px: 3
              }
            }}
          >
            <Tab 
              icon={<DashboardIcon />} 
              label="Tableau de bord" 
              iconPosition="start"
            />
            <Tab 
              icon={<AssignmentIcon />} 
              label={`Tous les examens (${filteredExams.length})`}
              iconPosition="start"
            />
            <Tab 
              icon={<BarChartIcon />} 
              label="Statistiques" 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        <TabPanel value={selectedTab} index={0}>
          {renderDashboard()}
        </TabPanel>

        <TabPanel value={selectedTab} index={1}>
          {renderExamsList()}
        </TabPanel>

        <TabPanel value={selectedTab} index={2}>
          {renderStatistics()}
        </TabPanel>
      </Card>

      {/* Dialog de confirmation de suppression */}
      <Dialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, exam: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Confirmer la suppression
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Êtes-vous sûr de vouloir supprimer l'examen "{deleteConfirm.exam?.name}" ?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cette action est irréversible et supprimera également toutes les notes associées.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setDeleteConfirm({ open: false, exam: null })}
            variant="outlined"
            disabled={actionLoading}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {actionLoading ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );

  // Fonction pour rendre la liste des examens
  function renderExamsList(examsList = filteredExams) {
    return (
      <Box>
        {/* Barre de recherche et filtres */}
        <Box mb={3}>
          <TextField
            fullWidth
            placeholder="Rechercher un examen..."
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />

          {/* Filtres avancés */}
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ borderRadius: 2 }}
            >
              Filtres
              {Object.values(filters).some(f => f) && (
                <Badge color="primary" variant="dot" sx={{ ml: 1 }} />
              )}
            </Button>
            <Button
              size="small"
              onClick={fetchExams}
              disabled={loading}
              startIcon={<RefreshIcon />}
              sx={{ borderRadius: 2 }}
            >
              Actualiser
            </Button>
          </Box>

          <Collapse in={showFilters}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                mb: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
              }}
            >
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Matière</InputLabel>
                    <Select
                      value={filters.subject_id}
                      label="Matière"
                      onChange={(e) => handleFilterChange('subject_id', e.target.value)}
                    >
                      <MenuItem value="">Toutes les matières</MenuItem>
                      {subjects?.map((subject) => (
                        <MenuItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>État</InputLabel>
                    <Select
                      value={filters.state}
                      label="État"
                      onChange={(e) => handleFilterChange('state', e.target.value)}
                    >
                      <MenuItem value="">Tous les états</MenuItem>
                      <MenuItem value="draft">Brouillon</MenuItem>
                      <MenuItem value="ongoing">En cours</MenuItem>
                      <MenuItem value="done">Terminé</MenuItem>
                      <MenuItem value="cancelled">Annulé</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={clearFilters}
                    size="small"
                    sx={{ height: 40 }}
                  >
                    Effacer filtres
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Collapse>
        </Box>

        {/* Tableau des examens */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Examen</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Matière</TableCell>
                <TableCell>Cours/Promotion</TableCell>
                <TableCell>Enseignant</TableCell>
                <TableCell>État</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    {[...Array(7)].map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : examsList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                      <AssignmentIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                      <Typography variant="h6" color="text.secondary">
                        {searchTerm || Object.values(filters).some(f => f) 
                          ? 'Aucun examen trouvé avec ces critères.' 
                          : 'Aucun examen créé pour le moment.'
                        }
                      </Typography>
                      {!searchTerm && !Object.values(filters).some(f => f) && (
                        <>
                          <Typography variant="body2" color="text.secondary" align="center">
                            {loading ? 'Chargement en cours...' : 
                             error ? 'Erreur lors du chargement' : 
                             'Commencez par créer votre premier examen'}
                          </Typography>
                          <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate('/exams/new')}
                          >
                            Créer le premier examen
                          </Button>
                        </>
                      )}
                      {(searchTerm || Object.values(filters).some(f => f)) && (
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setSearchTerm('');
                            clearFilters();
                          }}
                        >
                          Effacer les filtres
                        </Button>
                      )}
                      {process.env.NODE_ENV === 'development' && (
                        <Typography variant="caption" color="text.disabled" sx={{ mt: 2 }}>
                          Debug: {exams.length} examens chargés, loading: {loading.toString()}, error: {error || 'none'}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                examsList.map((exam) => (
                  <TableRow 
                    key={exam.id} 
                    hover
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
                    }}
                    onClick={() => {
                      console.log('🔍 Navigation vers détails examen:', exam.id);
                      navigate(`/exams/${exam.id}`);
                    }}
                  >
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {exam.name}
                        </Typography>
                        {(exam.evaluation_type_name || exam.evaluation_type) && (
                          <Typography variant="caption" color="text.secondary">
                            {exam.evaluation_type_name || exam.evaluation_type}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {formatDate(exam.date)}
                        </Typography>
                        {exam.date && (
                          <Typography variant="caption" color="text.secondary">
                            {(() => {
                              const days = getDaysUntilExam(exam.date);
                              if (days === 0) return "Aujourd'hui";
                              if (days === 1) return "Demain";
                              if (days > 0) return `Dans ${days} jours`;
                              return `Il y a ${Math.abs(days)} jours`;
                            })()}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: theme.palette.primary.main }}>
                          <SchoolIcon sx={{ fontSize: 14 }} />
                        </Avatar>
                        <Typography variant="body2">
                          {exam.subject_name || exam.subject?.name || '-'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {exam.course_name || exam.course?.name || '-'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {exam.batch_name || exam.batch?.name || '-'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: theme.palette.secondary.main }}>
                          <PersonIcon sx={{ fontSize: 14 }} />
                        </Avatar>
                        <Typography variant="body2">
                          {exam.teacher_name || exam.teacher?.name || '-'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {getStateBadge(exam.state)}
                    </TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="Voir détails">
                          <IconButton 
                            size="small" 
                            onClick={() => {
                              console.log('🔍 Navigation vers détails examen:', exam.id);
                              navigate(`/exams/${exam.id}`);
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifier">
                          <IconButton 
                            size="small" 
                            onClick={() => {
                              console.log('✏️ Navigation vers édition examen:', exam.id);
                              navigate(`/exams/${exam.id}/edit`);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => {
                              handleDeleteConfirmation(exam);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <TablePagination
            component="div"
            count={pagination.total_count || 0}
            page={currentPage - 1}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Lignes par page:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
          />
        )}
      </Box>
    );
  }

  // Fonction pour rendre le tableau de bord
  function renderDashboard() {
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Cartes statistiques principales */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card 
            sx={{ 
              borderRadius: 3,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <CardContent sx={{ pb: '16px !important' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {dashboardStats.total}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Examens
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <AssignmentIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card 
            sx={{ 
              borderRadius: 3,
              background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <CardContent sx={{ pb: '16px !important' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {dashboardStats.upcoming}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    À venir
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <ScheduleIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card 
            sx={{ 
              borderRadius: 3,
              background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <CardContent sx={{ pb: '16px !important' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {dashboardStats.ongoing}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    En cours
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <PlayArrowIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card 
            sx={{ 
              borderRadius: 3,
              background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <CardContent sx={{ pb: '16px !important' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {dashboardStats.completed}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Terminés
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <CheckCircleIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card 
            sx={{ 
              borderRadius: 3,
              background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <CardContent sx={{ pb: '16px !important' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {dashboardStats.overdue}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    En retard
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <WarningIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Section examens à venir */}
        {dashboardStats.upcomingList && dashboardStats.upcomingList.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardHeader
                title={
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                      <CalendarIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">Examens à Venir</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Prochaines échéances
                      </Typography>
                    </Box>
                  </Box>
                }
                action={
                  <Button
                    size="small"
                    endIcon={showUpcomingDetails ? <ExpandLess /> : <ExpandMore />}
                    onClick={() => setShowUpcomingDetails(!showUpcomingDetails)}
                  >
                    {showUpcomingDetails ? 'Masquer' : 'Voir tout'}
                  </Button>
                }
              />
              <Divider />
              <CardContent sx={{ pt: 0 }}>
                <List dense>
                  {dashboardStats.upcomingList.slice(0, showUpcomingDetails ? undefined : 3).map((exam) => (
                    <ListItem 
                      key={exam.id} 
                      sx={{ 
                        px: 0,
                        cursor: 'pointer',
                        borderRadius: 1,
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
                      }}
                      onClick={() => {
                        console.log('🔍 Navigation vers détails examen:', exam.id);
                        navigate(`/exams/${exam.id}`);
                      }}
                    >
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
                          <Typography variant="caption" fontWeight="bold">
                            {getDaysUntilExam(exam.date)}
                          </Typography>
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2" fontWeight="medium">
                            {exam.name}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {exam.subject_name || exam.subject?.name} • {exam.course_name || exam.course?.name}
                            </Typography>
                            <Typography variant="caption" color="info.main">
                              {formatDate(exam.date)} • {getDaysUntilExam(exam.date) === 1 ? 'Demain' : `Dans ${getDaysUntilExam(exam.date)} jours`}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Chip 
                          label={exam.state === 'draft' ? 'Programmé' : exam.state}
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
                {!showUpcomingDetails && dashboardStats.upcomingList.length > 3 && (
                  <Box textAlign="center" mt={1}>
                    <Typography variant="caption" color="text.secondary">
                      +{dashboardStats.upcomingList.length - 3} autres examens
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Section examens en cours */}
        {dashboardStats.ongoing > 0 && (
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardHeader
                title={
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: theme.palette.warning.main }}>
                      <PlayArrowIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">Examens en Cours</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Actuellement en déroulement
                      </Typography>
                    </Box>
                  </Box>
                }
                action={
                  <Chip 
                    label={`${dashboardStats.ongoing} en cours`}
                    size="small"
                    color="warning"
                  />
                }
              />
              <Divider />
              <CardContent sx={{ pt: 0 }}>
                <List dense>
                  {exams.filter(exam => exam.state === 'ongoing').slice(0, 4).map((exam) => (
                    <ListItem 
                      key={exam.id} 
                      sx={{ 
                        px: 0,
                        cursor: 'pointer',
                        borderRadius: 1,
                        '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.05) }
                      }}
                      onClick={() => {
                        console.log('🔍 Navigation vers détails examen:', exam.id);
                        navigate(`/exams/${exam.id}`);
                      }}
                    >
                      <ListItemIcon>
                        <Avatar 
                          sx={{ 
                            bgcolor: theme.palette.warning.main,
                            width: 32, 
                            height: 32 
                          }}
                        >
                          <PlayArrowIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle2" fontWeight="medium">
                              {exam.name}
                            </Typography>
                            <Chip 
                              label="En cours"
                              size="small"
                              color="warning"
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {exam.subject_name || exam.subject?.name}
                            </Typography>
                            <Typography variant="caption" color="warning.main">
                              Démarré le {formatDate(exam.date)}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('🔍 Navigation vers détails examen:', exam.id);
                            navigate(`/exams/${exam.id}`);
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    );
  }

  // Fonction pour rendre les statistiques
  function renderStatistics() {
    return (
      <Grid container spacing={3}>
        {/* Statistiques par matière */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, height: '400px' }}>
            <CardHeader
              title={
                <Box display="flex" alignItems="center" gap={1}>
                  <PieChartIcon color="primary" />
                  <Typography variant="h6">Répartition par Matière</Typography>
                </Box>
              }
            />
            <Divider />
            <CardContent sx={{ height: 'calc(100% - 80px)', overflow: 'auto' }}>
              {Object.keys(dashboardStats.bySubject).length === 0 ? (
                <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                  <Typography variant="body2" color="text.secondary">
                    Aucune donnée disponible
                  </Typography>
                </Box>
              ) : (
                <List>
                  {Object.entries(dashboardStats.bySubject).map(([subject, count]) => (
                    <ListItem key={subject} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
                          <Typography variant="caption" fontWeight="bold">
                            {count}
                          </Typography>
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={subject}
                        secondary={`${count} examen${count > 1 ? 's' : ''}`}
                      />
                      <LinearProgress 
                        variant="determinate" 
                        value={(count / dashboardStats.total) * 100}
                        sx={{ width: 60, ml: 2 }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Statistiques par cours */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, height: '400px' }}>
            <CardHeader
              title={
                <Box display="flex" alignItems="center" gap={1}>
                  <BarChartIcon color="secondary" />
                  <Typography variant="h6">Répartition par Cours</Typography>
                </Box>
              }
            />
            <Divider />
            <CardContent sx={{ height: 'calc(100% - 80px)', overflow: 'auto' }}>
              {Object.keys(dashboardStats.byCourse).length === 0 ? (
                <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                  <Typography variant="body2" color="text.secondary">
                    Aucune donnée disponible
                  </Typography>
                </Box>
              ) : (
                <List>
                  {Object.entries(dashboardStats.byCourse).map(([course, count]) => (
                    <ListItem key={course} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: theme.palette.secondary.main, width: 32, height: 32 }}>
                          <Typography variant="caption" fontWeight="bold">
                            {count}
                          </Typography>
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={course}
                        secondary={`${count} examen${count > 1 ? 's' : ''}`}
                      />
                      <LinearProgress 
                        variant="determinate" 
                        value={(count / dashboardStats.total) * 100}
                        sx={{ width: 60, ml: 2 }}
                        color="secondary"
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Examens en retard */}
        {dashboardStats.overdueList && dashboardStats.overdueList.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 2 }}>
              <CardHeader
                title={
                  <Box display="flex" alignItems="center" gap={1}>
                    <WarningIcon color="error" />
                    <Typography variant="h6">Examens en Retard</Typography>
                    <Chip label={dashboardStats.overdueList.length} size="small" color="error" />
                  </Box>
                }
              />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  {dashboardStats.overdueList.map((exam) => (
                    <Grid item xs={12} sm={6} md={4} key={exam.id}>
                      <Paper 
                        elevation={0}
                        sx={{ 
                          p: 2, 
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.error.main, 0.1),
                          border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.error.main, 0.15),
                            transform: 'translateY(-2px)',
                            boxShadow: 2
                          }
                        }}
                        onClick={() => {
                          console.log('🔍 Navigation vers détails examen:', exam.id);
                          navigate(`/exams/${exam.id}`);
                        }}
                      >
                        <Box display="flex" alignItems="center" justifyContent="between" mb={1}>
                          <Chip 
                            label={`${Math.abs(getDaysUntilExam(exam.date))} jours de retard`}
                            size="small"
                            color="error"
                            variant="filled"
                          />
                        </Box>
                        <Typography variant="subtitle2" fontWeight="bold" noWrap>
                          {exam.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {exam.subject_name || exam.subject?.name} • {exam.course_name || exam.course?.name}
                        </Typography>
                        <Typography variant="caption" color="error.main">
                          Prévu le {formatDate(exam.date)}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    );
  }
};

export default ExamList;