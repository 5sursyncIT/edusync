// src/components/exams/ExamDetail.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Chip,
  IconButton,
  Avatar,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Tabs,
  Tab,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Grade as GradeIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Cancel as CancelIcon,
  GetApp as DownloadIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  People as StudentsIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  CloudDownload as CloudDownloadIcon,
  FileCopy as FileCopyIcon,
  Sync as SyncIcon,
  AccountBalance as BulletinIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import { useExam, useExamGrades, useExamActions } from '../../hooks/useExams';
import { useAuth } from '../../contexts/AuthContext';
import { useOdoo } from '../../contexts/OdooContext';
import LoadingSpinner from '../ui/LoadingSpinner';
import ConfirmDialog from '../common/ConfirmDialog';

// Composant TabPanel pour les onglets
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`detail-tabpanel-${index}`}
      aria-labelledby={`detail-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ExamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const { api } = useOdoo();
  
  // États locaux
  const [selectedTab, setSelectedTab] = useState(0);
  const [editingGrade, setEditingGrade] = useState(null);
  const [tempGrade, setTempGrade] = useState({ note: '', appreciation: '' });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStateDialog, setShowStateDialog] = useState({ open: false, action: null });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // États pour la gestion des notes en lot
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [bulkNote, setBulkNote] = useState('');
  const [bulkAppreciation, setBulkAppreciation] = useState('');
  
  // États pour l'export
  const [exportFormat, setExportFormat] = useState('csv');
  const [showExportDialog, setShowExportDialog] = useState(false);
  
  // États pour l'intégration bulletins
  const [bulletinSync, setBulletinSync] = useState({
    loading: false,
    trimestres: [],
    selectedTrimestre: '',
    bulletins: [],
    syncResults: null,
    validation: null
  });

  // Hooks pour récupérer les données de l'examen
  const {
    data: examData,
    loading,
    error: examError,
    refetch: refetchExam
  } = useExam(id);

  // Hook pour les notes de l'examen
  const {
    data: gradesData,
    loading: gradesLoading,
    error: gradesError,
    saving: gradesSaving,
    refetch: refetchGrades,
    updateSingleGrade,
    updateGrades
  } = useExamGrades(id);

  // Hook pour les actions sur les examens
  const {
    loading: actionLoading,
    error: actionError,
    deleteExam,
    startExam,
    finishExam,
    cancelExam,
    duplicateExam,
    exportResults,
    clearError: clearActionError
  } = useExamActions();

  // Charger les données initiales pour l'intégration bulletins
  useEffect(() => {
    if (selectedTab === 4) { // Onglet Intégration Bulletins
      loadBulletinData();
    }
  }, [selectedTab]);

  const loadBulletinData = async () => {
    try {
      setBulletinSync(prev => ({ ...prev, loading: true }));
      
      const trimestresRes = await api.getTrimestres();
      
      if (trimestresRes.success) {
        setBulletinSync(prev => ({
          ...prev,
          trimestres: trimestresRes.data,
          loading: false
        }));
      }
      
    } catch (error) {
      console.error('Erreur chargement données bulletin:', error);
      setBulletinSync(prev => ({ ...prev, loading: false }));
      setError('Erreur lors du chargement des données de bulletin');
    }
  };

  const handleTrimestreChange = async (trimestreId) => {
    try {
      setBulletinSync(prev => ({ 
        ...prev, 
        selectedTrimestre: trimestreId,
        loading: true 
      }));
      
      if (trimestreId && examData) {
        // Récupérer les bulletins pour ce trimestre et cette classe
        const batchId = examData.batch_id || examData.data?.batch_id;
        
        if (batchId) {
          const bulletinsRes = await api.getBulletins({
            trimestre_id: trimestreId,
            batch_id: batchId
          });
          
          if (bulletinsRes.success) {
            setBulletinSync(prev => ({
              ...prev,
              bulletins: bulletinsRes.data,
              loading: false
            }));
          }
        }
      }
      
    } catch (error) {
      console.error('Erreur changement trimestre:', error);
      setBulletinSync(prev => ({ ...prev, loading: false }));
      setError('Erreur lors du chargement des bulletins');
    }
  };

  const handleSyncWithBulletins = async () => {
    try {
      setBulletinSync(prev => ({ ...prev, loading: true }));
      
      const { selectedTrimestre, bulletins } = bulletinSync;
      
      if (!selectedTrimestre || bulletins.length === 0) {
        setError('Veuillez sélectionner un trimestre avec des bulletins existants');
        return;
      }
      
      let syncResults = [];
      
      for (const bulletin of bulletins) {
        try {
          const result = await api.syncExamGradesToBulletin(bulletin.id, {
            forceRecalculate: true,
            weightByCoefficient: true,
            exam_id: id
          });
          
          syncResults.push({
            bulletinId: bulletin.id,
            studentName: bulletin.student_name,
            success: result.success,
            message: result.message
          });
          
        } catch (error) {
          syncResults.push({
            bulletinId: bulletin.id,
            studentName: bulletin.student_name,
            success: false,
            message: error.message
          });
        }
      }
      
      setBulletinSync(prev => ({
        ...prev,
        syncResults,
        loading: false
      }));
      
      const successCount = syncResults.filter(r => r.success).length;
      setSuccess(`Synchronisation terminée: ${successCount}/${syncResults.length} bulletins mis à jour`);
      
    } catch (error) {
      console.error('Erreur sync bulletins:', error);
      setBulletinSync(prev => ({ ...prev, loading: false }));
      setError('Erreur lors de la synchronisation avec les bulletins');
    }
  };

  const handleValidateBulletinGrades = async () => {
    try {
      setBulletinSync(prev => ({ ...prev, loading: true }));
      
      const { selectedTrimestre, bulletins } = bulletinSync;
      
      if (!selectedTrimestre || bulletins.length === 0) {
        setError('Veuillez sélectionner un trimestre avec des bulletins');
        return;
      }
      
      let validationResults = [];
      
      for (const bulletin of bulletins) {
        try {
          const result = await api.validateGradesForBulletin(
            bulletin.student_id, 
            selectedTrimestre
          );
          
          validationResults.push({
            studentName: bulletin.student_name,
            isValid: result.isValid,
            errors: result.errors || [],
            warnings: result.warnings || []
          });
          
        } catch (error) {
          validationResults.push({
            studentName: bulletin.student_name,
            isValid: false,
            errors: [error.message],
            warnings: []
          });
        }
      }
      
      setBulletinSync(prev => ({
        ...prev,
        validation: validationResults,
        loading: false
      }));
      
    } catch (error) {
      console.error('Erreur validation notes bulletin:', error);
      setBulletinSync(prev => ({ ...prev, loading: false }));
      setError('Erreur lors de la validation des notes pour bulletins');
    }
  };

  const handleCalculateBulletinAverages = async () => {
    try {
      setBulletinSync(prev => ({ ...prev, loading: true }));
      
      const { selectedTrimestre, bulletins } = bulletinSync;
      
      if (!selectedTrimestre || bulletins.length === 0) {
        setError('Veuillez sélectionner un trimestre avec des bulletins');
        return;
      }
      
      let calculationResults = [];
      
      for (const bulletin of bulletins) {
        try {
          const result = await api.calculateBulletinGrades(
            bulletin.student_id,
            selectedTrimestre,
            'weighted_average'
          );
          
          calculationResults.push({
            studentName: bulletin.student_name,
            success: result.success,
            data: result.data
          });
          
        } catch (error) {
          calculationResults.push({
            studentName: bulletin.student_name,
            success: false,
            error: error.message
          });
        }
      }
      
      setBulletinSync(prev => ({ ...prev, loading: false }));
      
      const successCount = calculationResults.filter(r => r.success).length;
      setSuccess(`Calcul terminé: ${successCount}/${calculationResults.length} moyennes calculées`);
      
    } catch (error) {
      console.error('Erreur calcul moyennes bulletin:', error);
      setBulletinSync(prev => ({ ...prev, loading: false }));
      setError('Erreur lors du calcul des moyennes de bulletin');
    }
  };

  // Debug console pour comprendre la structure des données
  useEffect(() => {
    console.log('🔍 Debug ExamDetail - Données reçues:', {
      id,
      examData,
      loading,
      examError,
      hasData: !!examData,
      dataKeys: examData ? Object.keys(examData) : []
    });

    if (examData) {
      console.log('📋 Structure complète de l\'examen:', examData);
      console.log('🔑 Propriétés disponibles:', Object.keys(examData));
      
      // Debug spécifique pour examData.data
      if (examData.data) {
        console.log('🎯 Contenu de examData.data:');
        console.log('📋 examData.data =', examData.data);
        console.log('🔑 Propriétés dans examData.data:', Object.keys(examData.data));
        
        // Afficher toutes les propriétés avec leurs valeurs
        Object.entries(examData.data).forEach(([key, value]) => {
          console.log(`  📄 ${key}:`, value, `(${typeof value})`);
        });
      } else {
        console.log('❌ examData.data n\'existe pas');
      }
      
      // Debug général pour toute structure exam
      if (examData.exam) {
        console.log('🎯 Contenu de examData.exam:', examData.exam);
      }
      
      // Test de quelques champs importants
      console.log('🔍 Valeurs des champs importants:');
      [
        { label: 'Nom', keys: ['name', 'title', 'exam_name'] },
        { label: 'ID', keys: ['id'] },
        { label: 'Description', keys: ['description'] },
        { label: 'Date', keys: ['date', 'exam_date'] },
        { label: 'État', keys: ['state', 'status'] },
        { label: 'Matière', keys: ['subject_name'] },
        { label: 'Enseignant', keys: ['teacher_name'] }
      ].forEach(({ label, keys }) => {
        const value = getExamValue(examData, keys, 'N/A');
        console.log(`  ${label}: ${value}`);
      });
    }
  }, [examData, loading, examError, id]);

  // Extraction des données selon la structure de l'API
  const exam = useMemo(() => {
    if (!examData) return null;
    
    // Structure des données: examData.data.exam contient les vraies données
    if (examData.status === 'success' && examData.data?.exam) {
      return examData.data.exam;
    }
    
    // Fallback si la structure est différente
    if (examData.data) {
      return examData.data;
    }
    
    // Si examData est directement l'objet examen
    return examData;
  }, [examData]);

  // Données calculées et statistiques
  const statistics = useMemo(() => {
    // Utiliser les données des notes du hook dédié ou celles de l'examen en fallback
    const grades = gradesData?.grades || exam?.grades || [];
    
    if (!Array.isArray(grades) || grades.length === 0) {
      return {
        total_students: 0,
        graded_students: 0,
        average: 0,
        min_grade: 0,
        max_grade: 0,
        success_rate: 0,
        grade_distribution: {},
        absent_students: 0
      };
    }

    const validGrades = grades.filter(g => g.note !== null && g.note !== undefined);
    const notes = validGrades.map(g => parseFloat(g.note)).filter(n => !isNaN(n));
    const noteMax = exam?.note_max || 20;
    const seuilReussite = noteMax / 2;

    const stats = {
      total_students: grades.length,
      graded_students: validGrades.length,
      absent_students: grades.filter(g => g.note === null || g.note === undefined).length,
      average: notes.length > 0 ? (notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(2) : 0,
      min_grade: notes.length > 0 ? Math.min(...notes) : 0,
      max_grade: notes.length > 0 ? Math.max(...notes) : 0,
      success_rate: notes.length > 0 ? ((notes.filter(n => n >= seuilReussite).length / notes.length) * 100).toFixed(1) : 0,
      grade_distribution: {}
    };

    // Distribution des notes par tranches (ajustée selon la note max)
    const tranches = [
      { label: `Excellent (${Math.round(noteMax * 0.8)}-${noteMax})`, min: noteMax * 0.8, max: noteMax, color: 'success' },
      { label: `Bien (${Math.round(noteMax * 0.7)}-${Math.round(noteMax * 0.8)})`, min: noteMax * 0.7, max: noteMax * 0.8, color: 'info' },
      { label: `Assez bien (${Math.round(noteMax * 0.6)}-${Math.round(noteMax * 0.7)})`, min: noteMax * 0.6, max: noteMax * 0.7, color: 'warning' },
      { label: `Passable (${Math.round(noteMax * 0.5)}-${Math.round(noteMax * 0.6)})`, min: noteMax * 0.5, max: noteMax * 0.6, color: 'secondary' },
      { label: `Insuffisant (0-${Math.round(noteMax * 0.5)})`, min: 0, max: noteMax * 0.5, color: 'error' }
    ];

    tranches.forEach(tranche => {
      const count = notes.filter(n => n >= tranche.min && n < tranche.max).length;
      stats.grade_distribution[tranche.label] = {
        count,
        percentage: notes.length > 0 ? ((count / notes.length) * 100).toFixed(1) : 0,
        color: tranche.color
      };
    });

    return stats;
  }, [exam, gradesData]);

  // Gestionnaires d'événements
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleEdit = () => {
    navigate(`/exams/${id}/edit`);
  };

  const handleDelete = async () => {
    try {
      const result = await deleteExam(id);
      if (result.success) {
        setSuccess('Examen supprimé avec succès');
        setTimeout(() => {
          navigate('/exams');
        }, 1500);
      } else {
        setError(result.error || 'Erreur lors de la suppression de l\'examen');
      }
    } catch (err) {
      setError('Erreur lors de la suppression de l\'examen');
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleStateChange = async (action) => {
    try {
      let result;
      switch (action) {
        case 'start':
          result = await startExam(id);
          break;
        case 'finish':
          result = await finishExam(id);
          break;
        case 'cancel':
          result = await cancelExam(id);
          break;
        default:
          throw new Error('Action non reconnue');
      }
      
      if (result.success) {
        const actionText = {
          start: 'démarré',
          finish: 'terminé',
          cancel: 'annulé'
        };
        setSuccess(`Examen ${actionText[action]} avec succès`);
        refetchExam();
      } else {
        setError(result.error || 'Erreur lors du changement d\'état de l\'examen');
      }
    } catch (err) {
      setError('Erreur lors du changement d\'état de l\'examen');
    } finally {
      setShowStateDialog({ open: false, action: null });
    }
  };

  const handleGradeEdit = (grade) => {
    setEditingGrade(grade.id);
    setTempGrade({
      note: grade.note || '',
      appreciation: grade.appreciation || ''
    });
  };

  const handleGradeSave = async (gradeId) => {
    try {
      // Validation des données
      const note = parseFloat(tempGrade.note);
      const noteMax = exam?.note_max || 20;
      
      if (isNaN(note) || note < 0 || note > noteMax) {
        setError(`La note doit être comprise entre 0 et ${noteMax}`);
        return;
      }
      
      const result = await updateSingleGrade(gradeId, note, tempGrade.appreciation);
      
      if (result.success) {
        setSuccess('Note mise à jour avec succès');
        setEditingGrade(null);
        setTempGrade({ note: '', appreciation: '' });
        refetchExam(); // Rafraîchir aussi les données de l'examen pour les statistiques
      } else {
        setError(result.error || 'Erreur lors de la mise à jour de la note');
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour de la note');
    }
  };

  const handleBulkGradeSave = async () => {
    try {
      if (selectedGrades.length === 0) {
        setError('Veuillez sélectionner au moins une note à modifier');
        return;
      }
      
      const note = parseFloat(bulkNote);
      const noteMax = exam?.note_max || 20;
      
      if (bulkNote && (isNaN(note) || note < 0 || note > noteMax)) {
        setError(`La note doit être comprise entre 0 et ${noteMax}`);
        return;
      }
      
      // Préparer les données pour la mise à jour en lot
      const gradesToUpdate = selectedGrades.map(gradeId => ({
        id: gradeId,
        note: bulkNote ? note : undefined,
        appreciation: bulkAppreciation || undefined
      }));
      
      const result = await updateGrades(gradesToUpdate);
      
      if (result.success) {
        setSuccess(`${selectedGrades.length} note(s) mise(s) à jour avec succès`);
        setBulkEditMode(false);
        setSelectedGrades([]);
        setBulkNote('');
        setBulkAppreciation('');
        refetchExam();
      } else {
        setError(result.error || 'Erreur lors de la mise à jour des notes');
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour des notes');
    }
  };

  const handleExport = async () => {
    try {
      const result = await exportResults(id, exportFormat);
      
      if (result.success) {
        // Créer un lien de téléchargement si l'API retourne un blob ou une URL
        if (result.data.url) {
          window.open(result.data.url, '_blank');
        } else if (result.data.blob) {
          const url = window.URL.createObjectURL(result.data.blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `examen_${id}_resultats.${exportFormat}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
        
        setSuccess('Export téléchargé avec succès');
      } else {
        setError(result.error || 'Erreur lors de l\'export');
      }
    } catch (err) {
      setError('Erreur lors de l\'export');
    } finally {
      setShowExportDialog(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      const result = await duplicateExam(id, {
        name: `${exam.name} (Copie)`,
        date: null, // L'utilisateur devra définir une nouvelle date
        state: 'draft'
      });
      
      if (result.success) {
        setSuccess('Examen dupliqué avec succès');
        // Rediriger vers l'édition du nouvel examen
        setTimeout(() => {
          navigate(`/exams/${result.data.id}/edit`);
        }, 1500);
      } else {
        setError(result.error || 'Erreur lors de la duplication');
      }
    } catch (err) {
      setError('Erreur lors de la duplication');
    }
  };

  const handleGradeSelection = (gradeId, selected) => {
    if (selected) {
      setSelectedGrades(prev => [...prev, gradeId]);
    } else {
      setSelectedGrades(prev => prev.filter(id => id !== gradeId));
    }
  };

  const handleSelectAllGrades = (selectAll) => {
    if (selectAll && gradesData?.grades) {
      setSelectedGrades(gradesData.grades.map(g => g.id));
    } else {
      setSelectedGrades([]);
    }
  };

  // Gestionnaire pour fermer les messages d'erreur/succès
  const handleCloseMessage = () => {
    setError('');
    setSuccess('');
    if (actionError) {
      clearActionError();
    }
  };

  // Utilitaires d'affichage
  const getStateBadge = (state) => {
    const stateConfig = {
      draft: { label: 'Brouillon', color: 'default', icon: AssignmentIcon },
      ongoing: { label: 'En cours', color: 'info', icon: PlayArrowIcon },
      done: { label: 'Terminé', color: 'success', icon: CheckCircleIcon },
      cancelled: { label: 'Annulé', color: 'error', icon: CancelIcon }
    };
    const config = stateConfig[state] || stateConfig.draft;
    const IconComponent = config.icon;
    
    return (
      <Chip 
        label={config.label} 
        color={config.color} 
        icon={<IconComponent />}
        sx={{ fontWeight: 'medium' }}
      />
    );
  };

  // Fonction utilitaire pour récupérer une valeur avec plusieurs tentatives de noms de propriétés
  const getExamValue = (exam, keys, defaultValue = 'Non disponible') => {
    console.log(`🔍 getExamValue: Recherche dans [${keys.join(', ')}]`);
    
    // Structure des données: examData.data.exam contient les vraies données
    const examSource = exam?.data?.exam || exam?.data || exam?.exam || exam;
    
    for (const key of keys) {
      const value = examSource?.[key];
      console.log(`  - ${key}: `, value, typeof value);
      if (value !== undefined && value !== null && value !== '') {
        console.log(`  ✅ Valeur trouvée: ${value}`);
        return value;
      }
    }
    console.log(`  ❌ Aucune valeur trouvée, retour de: ${defaultValue}`);
    return defaultValue;
  };

  // Fonction utilitaire pour accéder aux propriétés imbriquées
  const getNestedValue = (exam, path, defaultValue = 'Non disponible') => {
    console.log(`🔗 getNestedValue: Recherche de ${path}`);
    
    // Structure des données: examData.data.exam contient les vraies données
    const examSource = exam?.data?.exam || exam?.data || exam?.exam || exam;
    
    if (!examSource || !path) {
      console.log(`  ❌ Source ou chemin invalide`);
      return defaultValue;
    }
    
    const keys = path.split('.');
    let current = examSource;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
        console.log(`  - ${key}: `, current, typeof current);
      } else {
        console.log(`  ❌ Propriété ${key} introuvable dans:`, current);
        return defaultValue;
      }
    }
    
    const result = current !== undefined && current !== null && current !== '' ? current : defaultValue;
    console.log(`  ✅ Résultat final: ${result}`);
    return result;
  };

  // Fonction pour formater les dates avec un meilleur debug
  const formatDate = (dateString) => {
    console.log('📅 formatDate input:', dateString, typeof dateString);
    
    if (!dateString) {
      console.log('📅 Pas de date fournie');
      return 'Non disponible';
    }
    
    try {
      const date = new Date(dateString);
      console.log('📅 Date parsée:', date);
      
      if (isNaN(date.getTime())) {
        console.log('📅 Date invalide');
        return 'Date invalide';
      }
      
      const formatted = date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      console.log('📅 Date formatée:', formatted);
      return formatted;
    } catch (error) {
      console.log('📅 Erreur formatage date:', error);
      return 'Date invalide';
    }
  };

  const getGradeColor = (note, noteMax = 20) => {
    const percentage = (note / noteMax) * 100;
    if (percentage >= 80) return theme.palette.success.main;
    if (percentage >= 60) return theme.palette.info.main;
    if (percentage >= 40) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Rendu conditionnel selon l'état de chargement
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (examError || !exam) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Erreur lors du chargement de l'examen
          </Typography>
          <Typography variant="body2">
            {examError || 'Examen non trouvé'}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/exams')}
            sx={{ mt: 2 }}
          >
            Retour à la liste
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Messages de succès et d'erreur */}
      {success && (
        <Alert 
          severity="success" 
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={handleCloseMessage}
        >
          {success}
        </Alert>
      )}
      
      {(error || actionError || gradesError) && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={handleCloseMessage}
        >
          {error || actionError || gradesError}
        </Alert>
      )}

      {/* En-tête avec informations principales */}
      <Paper elevation={2} sx={{ p: 4, mb: 3, borderRadius: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/exams')}
              sx={{ mb: 2, borderRadius: 2 }}
            >
              Retour à la liste
            </Button>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {exam.name}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              {getStateBadge(exam.state)}
              <Chip 
                icon={<CalendarIcon />}
                label={formatDate(exam.date)}
                variant="outlined"
              />
              {exam.evaluation_type_name && (
                <Chip 
                  icon={<AssessmentIcon />}
                  label={exam.evaluation_type_name}
                  color="primary"
                  variant="outlined"
                />
              )}
            </Stack>
          </Box>
          
          <Stack direction="row" spacing={1}>
            <Tooltip title="Modifier">
              <IconButton
                color="primary"
                onClick={handleEdit}
                sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Dupliquer">
              <IconButton
                color="info"
                onClick={handleDuplicate}
                disabled={actionLoading}
                sx={{ 
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.2) }
                }}
              >
                <FileCopyIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Rafraîchir">
              <IconButton
                color="secondary"
                onClick={() => {
                  refetchExam();
                  refetchGrades();
                }}
                disabled={loading || gradesLoading}
                sx={{ 
                  bgcolor: alpha(theme.palette.secondary.main, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.secondary.main, 0.2) }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Exporter">
              <IconButton
                color="success"
                onClick={() => setShowExportDialog(true)}
                sx={{ 
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.2) }
                }}
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Supprimer">
              <IconButton
                color="error"
                onClick={() => setShowDeleteDialog(true)}
                sx={{ 
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) }
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* Informations détaillées */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                <SchoolIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Matière
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {exam.subject_name || exam.subject?.name || '-'}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                <PersonIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Enseignant
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {exam.teacher_name || exam.teacher?.name || '-'}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                <GradeIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Note maximale
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {exam.note_max || 20} points
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: theme.palette.warning.main }}>
                <StudentsIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Étudiants
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {statistics.total_students} inscrits
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Actions selon l'état */}
        {exam.state === 'draft' && (
          <Box mt={3} display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={() => setShowStateDialog({ open: true, action: 'start' })}
              disabled={actionLoading}
            >
              Démarrer l'examen
            </Button>
          </Box>
        )}
        
        {exam.state === 'ongoing' && (
          <Box mt={3} display="flex" gap={2}>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={() => setShowStateDialog({ open: true, action: 'finish' })}
              disabled={actionLoading}
            >
              Terminer l'examen
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              onClick={() => setShowStateDialog({ open: true, action: 'cancel' })}
              disabled={actionLoading}
            >
              Annuler
            </Button>
          </Box>
        )}
      </Paper>

      {/* Onglets pour les différentes sections */}
      <Card sx={{ borderRadius: 3 }}>
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
                minHeight: 48,
              }
            }}
          >
            <Tab 
              icon={<AssessmentIcon />} 
              label="Vue d'ensemble" 
              iconPosition="start"
              sx={{ gap: 1 }}
            />
            <Tab 
              icon={<GradeIcon />} 
              label={`Notes (${statistics.graded_students}/${statistics.total_students})`}
              iconPosition="start"
              sx={{ gap: 1 }}
            />
            <Tab 
              icon={<BarChartIcon />} 
              label="Statistiques" 
              iconPosition="start"
              sx={{ gap: 1 }}
            />
            <Tab 
              icon={<InfoIcon />} 
              label="Détails" 
              iconPosition="start"
              sx={{ gap: 1 }}
            />
            <Tab 
              icon={<BulletinIcon />} 
              label="Intégration Bulletins" 
              iconPosition="start"
              sx={{ gap: 1 }}
            />
          </Tabs>
        </Box>

        {/* Contenu des onglets */}
        <TabPanel value={selectedTab} index={0}>
          {renderOverview()}
        </TabPanel>
        
        <TabPanel value={selectedTab} index={1}>
          {renderGrades()}
        </TabPanel>
        
        <TabPanel value={selectedTab} index={2}>
          {renderStatistics()}
        </TabPanel>
        
        <TabPanel value={selectedTab} index={3}>
          {renderDetails()}
        </TabPanel>
        
        <TabPanel value={selectedTab} index={4}>
          {renderBulletinSync()}
        </TabPanel>
      </Card>

      {/* Dialogs de confirmation */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'error.main' }}>
              <WarningIcon />
            </Avatar>
            Supprimer l'examen
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer l'examen "{exam.name}" ? 
            Cette action est irréversible et supprimera également toutes les notes associées.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowDeleteDialog(false)}
            disabled={actionLoading}
          >
            Annuler
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDelete}
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showStateDialog.open}
        onClose={() => setShowStateDialog({ open: false, action: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Changer l'état de l'examen
        </DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir {
              showStateDialog.action === 'start' ? 'démarrer' :
              showStateDialog.action === 'finish' ? 'terminer' :
              'annuler'
            } cet examen ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowStateDialog({ open: false, action: null })}
            disabled={actionLoading}
          >
            Annuler
          </Button>
          <Button 
            variant="contained" 
            onClick={() => handleStateChange(showStateDialog.action)}
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : null}
          >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Exporter les résultats
        </DialogTitle>
        <DialogContent>
          <Typography>
            Choisissez le format d'exportation:
          </Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="export-format-label">Format</InputLabel>
            <Select
              labelId="export-format-label"
              id="export-format"
              value={exportFormat}
              label="Format"
              onChange={(e) => setExportFormat(e.target.value)}
            >
              <MenuItem value="csv">CSV</MenuItem>
              <MenuItem value="excel">Excel</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowExportDialog(false)}
            disabled={actionLoading}
          >
            Annuler
          </Button>
          <Button 
            variant="contained" 
            color="success" 
            onClick={handleExport}
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            Exporter
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar pour les notifications système */}
      <Snackbar
        open={!!(success || error || actionError || gradesError)}
        autoHideDuration={6000}
        onClose={handleCloseMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseMessage} 
          severity={success ? 'success' : 'error'} 
          sx={{ width: '100%' }}
        >
          {success || error || actionError || gradesError}
        </Alert>
      </Snackbar>
    </Container>
  );

  // Fonction pour rendre la vue d'ensemble
  function renderOverview() {
    return (
      <Grid container spacing={3}>
        {/* Cartes de statistiques rapides */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 2,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white'
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {statistics.total_students}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Étudiants inscrits
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <StudentsIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 2,
            background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
            color: 'white'
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {statistics.graded_students}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Notes saisies
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <GradeIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 2,
            background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
            color: 'white'
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {statistics.average}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Moyenne générale
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <TimelineIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 2,
            background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
            color: 'white'
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {statistics.success_rate}%
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Taux de réussite
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
                  <TrendingUpIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Description et informations générales */}
        {exam.description && (
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 2 }}>
              <CardHeader
                title="Description de l'examen"
                avatar={
                  <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                    <InfoIcon />
                  </Avatar>
                }
              />
              <Divider />
              <CardContent>
                <Typography variant="body1">
                  {exam.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    );
  }

  // Fonction pour rendre les notes
  function renderGrades() {
    // Utiliser les données des notes du hook dédié ou celles de l'examen en fallback
    const grades = gradesData?.grades || exam?.grades || [];
    
    if (grades.length === 0) {
      return (
        <Box display="flex" flexDirection="column" alignItems="center" py={8}>
          <GradeIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucune note disponible
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Les notes apparaîtront ici une fois saisies
          </Typography>
        </Box>
      );
    }

    return (
      <Box>
        {/* Barre d'outils pour la gestion des notes */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <FormControlLabel
              control={
                <Switch
                  checked={bulkEditMode}
                  onChange={(e) => {
                    setBulkEditMode(e.target.checked);
                    if (!e.target.checked) {
                      setSelectedGrades([]);
                      setBulkNote('');
                      setBulkAppreciation('');
                    }
                  }}
                />
              }
              label="Mode édition groupée"
            />
            
            {bulkEditMode && (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleSelectAllGrades(selectedGrades.length !== grades.length)}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  {selectedGrades.length === grades.length ? 'Désélectionner tout' : 'Sélectionner tout'}
                </Button>
                
                <TextField
                  size="small"
                  type="number"
                  label="Note"
                  value={bulkNote}
                  onChange={(e) => setBulkNote(e.target.value)}
                  inputProps={{ min: 0, max: exam?.note_max || 20, step: 0.1 }}
                  sx={{ width: 100 }}
                />
                
                <TextField
                  size="small"
                  label="Appréciation"
                  value={bulkAppreciation}
                  onChange={(e) => setBulkAppreciation(e.target.value)}
                  sx={{ minWidth: 200 }}
                />
                
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleBulkGradeSave}
                  disabled={gradesSaving || selectedGrades.length === 0}
                  startIcon={gradesSaving ? <CircularProgress size={16} /> : <SaveIcon />}
                >
                  Appliquer ({selectedGrades.length})
                </Button>
              </>
            )}
            
            <Box sx={{ flexGrow: 1 }} />
            
            {/* Bouton de synchronisation rapide avec les bulletins */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<BulletinIcon />}
              onClick={() => setSelectedTab(4)} // Basculer vers l'onglet Intégration Bulletins
              sx={{ 
                whiteSpace: 'nowrap',
                borderColor: theme.palette.info.main,
                color: theme.palette.info.main,
                '&:hover': {
                  bgcolor: alpha(theme.palette.info.main, 0.1)
                }
              }}
            >
              Sync Bulletins
            </Button>
            
            <Typography variant="body2" color="text.secondary">
              {grades.filter(g => g.note !== null && g.note !== undefined).length} / {grades.length} notes saisies
            </Typography>
          </Stack>
        </Paper>

        {/* Indicateur de chargement pour les notes */}
        {(gradesLoading || gradesSaving) && (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ ml: 2 }}>
              {gradesLoading ? 'Chargement des notes...' : 'Sauvegarde en cours...'}
            </Typography>
          </Box>
        )}

        {/* Message d'erreur spécifique aux notes */}
        {gradesError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Erreur lors du chargement des notes: {gradesError}
          </Alert>
        )}

        {/* Tableau des notes */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {bulkEditMode && (
                  <TableCell padding="checkbox">
                    <Switch
                      checked={selectedGrades.length === grades.length && grades.length > 0}
                      indeterminate={selectedGrades.length > 0 && selectedGrades.length < grades.length}
                      onChange={(e) => handleSelectAllGrades(e.target.checked)}
                    />
                  </TableCell>
                )}
                <TableCell>Étudiant</TableCell>
                <TableCell align="center">Note</TableCell>
                <TableCell>Appréciation</TableCell>
                <TableCell align="center">Statut</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {grades.map((grade) => (
                <TableRow key={grade.id} hover>
                  {bulkEditMode && (
                    <TableCell padding="checkbox">
                      <Switch
                        checked={selectedGrades.includes(grade.id)}
                        onChange={(e) => handleGradeSelection(grade.id, e.target.checked)}
                        size="small"
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                        {grade.student_name ? grade.student_name.charAt(0) : '?'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {grade.student_name || 'Étudiant inconnu'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {grade.student_id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    {editingGrade === grade.id ? (
                      <TextField
                        size="small"
                        type="number"
                        value={tempGrade.note}
                        onChange={(e) => setTempGrade(prev => ({ ...prev, note: e.target.value }))}
                        inputProps={{ min: 0, max: exam?.note_max || 20, step: 0.1 }}
                        sx={{ width: 80 }}
                        autoFocus
                      />
                    ) : (
                      <Box>
                        {grade.note !== null && grade.note !== undefined ? (
                          <Chip
                            label={`${grade.note}/${exam?.note_max || 20}`}
                            sx={{
                              bgcolor: alpha(getGradeColor(grade.note, exam?.note_max || 20), 0.1),
                              color: getGradeColor(grade.note, exam?.note_max || 20),
                              fontWeight: 'bold'
                            }}
                          />
                        ) : (
                          <Chip
                            label="Non noté"
                            variant="outlined"
                            color="default"
                          />
                        )}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingGrade === grade.id ? (
                      <TextField
                        size="small"
                        multiline
                        rows={2}
                        value={tempGrade.appreciation}
                        onChange={(e) => setTempGrade(prev => ({ ...prev, appreciation: e.target.value }))}
                        placeholder="Appréciation..."
                        sx={{ minWidth: 200 }}
                      />
                    ) : (
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={grade.appreciation || '-'}
                      >
                        {grade.appreciation || '-'}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {grade.note !== null && grade.note !== undefined ? (
                      grade.note >= ((exam?.note_max || 20) / 2) ? (
                        <Chip
                          label="Réussi"
                          color="success"
                          size="small"
                          icon={<CheckCircleIcon />}
                        />
                      ) : (
                        <Chip
                          label="Échec"
                          color="error"
                          size="small"
                          icon={<CancelIcon />}
                        />
                      )
                    ) : (
                      <Chip
                        label="En attente"
                        color="default"
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {editingGrade === grade.id ? (
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleGradeSave(grade.id)}
                          disabled={gradesSaving}
                        >
                          {gradesSaving ? <CircularProgress size={16} /> : <CheckCircleIcon fontSize="small" />}
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setEditingGrade(null);
                            setTempGrade({ note: '', appreciation: '' });
                          }}
                          disabled={gradesSaving}
                        >
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ) : (
                      <IconButton
                        size="small"
                        onClick={() => handleGradeEdit(grade)}
                        disabled={gradesSaving || bulkEditMode}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }

  // Fonction pour rendre les statistiques
  function renderStatistics() {
    return (
      <Grid container spacing={3}>
        {/* Distribution des notes */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, height: '100%' }}>
            <CardHeader
              title="Distribution des notes"
              avatar={
                <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                  <PieChartIcon />
                </Avatar>
              }
            />
            <Divider />
            <CardContent>
              <Stack spacing={2}>
                {Object.entries(statistics.grade_distribution).map(([label, data]) => (
                  <Box key={label}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" fontWeight="medium">
                        {label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {data.count} étudiants ({data.percentage}%)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={parseFloat(data.percentage)}
                      color={data.color}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Statistiques détaillées */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, height: '100%' }}>
            <CardHeader
              title="Statistiques détaillées"
              avatar={
                <Avatar sx={{ bgcolor: theme.palette.success.main }}>
                  <BarChartIcon />
                </Avatar>
              }
            />
            <Divider />
            <CardContent>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Note minimale
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="error.main">
                    {statistics.min_grade}/{exam.note_max}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Note maximale
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    {statistics.max_grade}/{exam.note_max}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Étudiants absents
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="warning.main">
                    {statistics.absent_students}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Progression de correction
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <LinearProgress
                      variant="determinate"
                      value={(statistics.graded_students / statistics.total_students) * 100}
                      sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="body2" fontWeight="medium">
                      {Math.round((statistics.graded_students / statistics.total_students) * 100)}%
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  }

  // Fonction pour rendre les détails
  function renderDetails() {
    return (
      <Grid container spacing={3}>
        {/* Informations générales */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, height: '100%' }}>
            <CardHeader
              title="Informations générales"
              avatar={
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                  <InfoIcon />
                </Avatar>
              }
            />
            <Divider />
            <CardContent>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    Nom de l'examen
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" sx={{ mt: 0.5 }}>
                    {getExamValue(examData, ['name', 'title', 'exam_name'])}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {getExamValue(examData, ['description', 'details', 'content'], 'Aucune description fournie')}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    Date et heure
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" sx={{ mt: 0.5 }}>
                    {formatDate(getExamValue(examData, ['date', 'exam_date', 'scheduled_date'], null))}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    Durée prévue
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" sx={{ mt: 0.5 }}>
                    {getExamValue(examData, ['duration', 'exam_duration', 'time_limit'], 'Non spécifiée')}
                    {getExamValue(examData, ['duration', 'exam_duration', 'time_limit'], null) && ' minutes'}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    Note maximale
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="primary.main" sx={{ mt: 0.5 }}>
                    {getExamValue(examData, ['note_max', 'max_grade', 'total_marks'], '20')} points
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    Type d'évaluation
                  </Typography>
                  <Chip
                    label={getExamValue(examData, ['evaluation_type_name', 'evaluation_type', 'exam_type', 'type'], 'Non spécifié')}
                    color="primary"
                    variant="outlined"
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Informations académiques */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, height: '100%' }}>
            <CardHeader
              title="Informations académiques"
              avatar={
                <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                  <SchoolIcon />
                </Avatar>
              }
            />
            <Divider />
            <CardContent>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    Matière
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" sx={{ mt: 0.5 }}>
                    {getExamValue(examData, ['subject_name', 'subject.name', 'course_subject'], 'Non spécifiée') ||
                     getNestedValue(examData, 'subject.name', 'Non spécifiée')}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    Enseignant responsable
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" sx={{ mt: 0.5 }}>
                    {getExamValue(examData, ['teacher_name', 'instructor_name', 'professor_name'], 'Non assigné') ||
                     getNestedValue(examData, 'teacher.name', 'Non assigné')}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    Cours/Promotion
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" sx={{ mt: 0.5 }}>
                    {getExamValue(examData, ['course_name', 'class_name', 'program_name'], 'Non spécifié') ||
                     getNestedValue(examData, 'course.name', 'Non spécifié')}
                    {getExamValue(examData, ['batch_name', 'group_name'], null) && (
                      <Chip
                        label={getExamValue(examData, ['batch_name', 'group_name'])}
                        size="small"
                        color="info"
                        variant="outlined"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Typography>
                </Box>
                
                {getExamValue(examData, ['class_name', 'classroom', 'section'], null) && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight="medium">
                      Classe
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" sx={{ mt: 0.5 }}>
                      {getExamValue(examData, ['class_name', 'classroom', 'section'])}
                    </Typography>
                  </Box>
                )}
                
                {getExamValue(examData, ['semester', 'term', 'period'], null) && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight="medium">
                      Semestre
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" sx={{ mt: 0.5 }}>
                      {getExamValue(examData, ['semester', 'term', 'period'])}
                    </Typography>
                  </Box>
                )}
                
                {getExamValue(examData, ['academic_year', 'year', 'session'], null) && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight="medium">
                      Année académique
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" sx={{ mt: 0.5 }}>
                      {getExamValue(examData, ['academic_year', 'year', 'session'])}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Instructions et consignes */}
        {getExamValue(examData, ['instructions', 'guidelines', 'notes'], null) && (
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 2 }}>
              <CardHeader
                title="Instructions et consignes"
                avatar={
                  <Avatar sx={{ bgcolor: theme.palette.warning.main }}>
                    <AssignmentIcon />
                  </Avatar>
                }
              />
              <Divider />
              <CardContent>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {getExamValue(examData, ['instructions', 'guidelines', 'notes'])}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Paramètres d'évaluation */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2 }}>
            <CardHeader
              title="Paramètres d'évaluation"
              avatar={
                <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                  <GradeIcon />
                </Avatar>
              }
            />
            <Divider />
            <CardContent>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    Barème de notation
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="primary.main" sx={{ mt: 0.5 }}>
                    Sur {getExamValue(examData, ['note_max', 'max_grade', 'total_marks'], '20')} points
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    Note de passage
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="success.main" sx={{ mt: 0.5 }}>
                    {(parseFloat(getExamValue(examData, ['note_max', 'max_grade', 'total_marks'], '20')) / 2)} points
                  </Typography>
                </Box>
                
                {getExamValue(examData, ['coefficient', 'weight', 'multiplier'], null) && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight="medium">
                      Coefficient
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" sx={{ mt: 0.5 }}>
                      {getExamValue(examData, ['coefficient', 'weight', 'multiplier'])}
                    </Typography>
                  </Box>
                )}
                
                {getExamValue(examData, ['is_makeup', 'is_retake', 'makeup'], null) !== null && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight="medium">
                      Type de session
                    </Typography>
                    <Chip
                      label={getExamValue(examData, ['is_makeup', 'is_retake', 'makeup']) ? 'Rattrapage' : 'Session normale'}
                      color={getExamValue(examData, ['is_makeup', 'is_retake', 'makeup']) ? 'warning' : 'success'}
                      variant="outlined"
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                )}
                
                {getExamValue(examData, ['room', 'classroom', 'venue', 'location'], null) && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight="medium">
                      Salle d'examen
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" sx={{ mt: 0.5 }}>
                      {getExamValue(examData, ['room', 'classroom', 'venue', 'location'])}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Informations système */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2 }}>
            <CardHeader
              title="Informations système"
              avatar={
                <Avatar sx={{ bgcolor: theme.palette.grey[600] }}>
                  <SettingsIcon />
                </Avatar>
              }
            />
            <Divider />
            <CardContent>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    État actuel
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    {getStateBadge(getExamValue(examData, ['state', 'status', 'exam_state'], 'draft'))}
                  </Box>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    Date de création
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {formatDate(getExamValue(examData, ['created_at', 'create_date', 'date_created'], null))}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    Dernière modification
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {formatDate(getExamValue(examData, ['updated_at', 'write_date', 'date_modified'], null))}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    Créé par
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" sx={{ mt: 0.5 }}>
                    {getExamValue(examData, ['created_by', 'creator', 'author'], user?.name || 'Non disponible') ||
                     getNestedValue(examData, 'create_uid.name', user?.name || 'Administrator')}
                  </Typography>
                </Box>
                
                {getExamValue(examData, ['id', 'exam_id'], null) && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight="medium">
                      Identifiant système
                    </Typography>
                    <Typography variant="body1" fontFamily="monospace" sx={{ mt: 0.5 }}>
                      #{getExamValue(examData, ['id', 'exam_id'])}
                    </Typography>
                  </Box>
                )}
                
                {getExamValue(examData, ['external_id', 'reference', 'code'], null) && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight="medium">
                      Référence externe
                    </Typography>
                    <Typography variant="body1" fontFamily="monospace" sx={{ mt: 0.5 }}>
                      {getExamValue(examData, ['external_id', 'reference', 'code'])}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Statistiques de participation */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 2 }}>
            <CardHeader
              title="Statistiques de participation"
              avatar={
                <Avatar sx={{ bgcolor: theme.palette.success.main }}>
                  <AssessmentIcon />
                </Avatar>
              }
            />
            <Divider />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                      {statistics.total_students}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Étudiants inscrits
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {statistics.graded_students}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Notes saisies
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight="bold" color="warning.main">
                      {statistics.absent_students}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Absents
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" fontWeight="bold" color="info.main">
                      {statistics.success_rate}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Taux de réussite
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              {/* Barre de progression */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Progression de la correction
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <LinearProgress
                    variant="determinate"
                    value={statistics.total_students > 0 ? (statistics.graded_students / statistics.total_students) * 100 : 0}
                    sx={{ flexGrow: 1, height: 10, borderRadius: 5 }}
                  />
                  <Typography variant="body2" fontWeight="bold">
                    {statistics.total_students > 0 ? Math.round((statistics.graded_students / statistics.total_students) * 100) : 0}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  }

  // Fonction pour rendre l'intégration bulletins
  function renderBulletinSync() {
    return (
      <Box>
        <Typography variant="h6" gutterBottom className="flex items-center gap-2">
          <BulletinIcon />
          Intégration avec les Bulletins
        </Typography>
        
        <Typography variant="body2" color="text.secondary" className="mb-6">
          Synchronisez les notes de cet examen avec les bulletins des étudiants
        </Typography>

        {/* Sélection du trimestre */}
        <Card className="mb-6">
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Trimestre</InputLabel>
                  <Select
                    value={bulletinSync.selectedTrimestre}
                    onChange={(e) => handleTrimestreChange(e.target.value)}
                    label="Trimestre"
                    disabled={bulletinSync.loading}
                  >
                    <MenuItem value="">Sélectionner un trimestre</MenuItem>
                    {bulletinSync.trimestres.map((trimestre) => (
                      <MenuItem key={trimestre.id} value={trimestre.id}>
                        {trimestre.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={8}>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    startIcon={<SyncIcon />}
                    onClick={handleSyncWithBulletins}
                    disabled={
                      bulletinSync.loading || 
                      !bulletinSync.selectedTrimestre || 
                      bulletinSync.bulletins.length === 0
                    }
                  >
                    Synchroniser
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<CheckCircleIcon />}
                    onClick={handleValidateBulletinGrades}
                    disabled={
                      bulletinSync.loading || 
                      !bulletinSync.selectedTrimestre || 
                      bulletinSync.bulletins.length === 0
                    }
                  >
                    Valider
                  </Button>
                  
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<CalculateIcon />}
                    onClick={handleCalculateBulletinAverages}
                    disabled={
                      bulletinSync.loading || 
                      !bulletinSync.selectedTrimestre || 
                      bulletinSync.bulletins.length === 0
                    }
                  >
                    Calculer Moyennes
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Informations sur les bulletins trouvés */}
        {bulletinSync.selectedTrimestre && (
          <Card className="mb-6">
            <CardHeader
              title="Bulletins concernés"
              subheader={`${bulletinSync.bulletins.length} bulletin(s) trouvé(s) pour ce trimestre`}
            />
            <CardContent>
              {bulletinSync.bulletins.length > 0 ? (
                <Grid container spacing={2}>
                  {bulletinSync.bulletins.map((bulletin) => (
                    <Grid item xs={12} sm={6} md={4} key={bulletin.id}>
                      <Card variant="outlined">
                        <CardContent className="p-3">
                          <Typography variant="subtitle2" fontWeight="bold">
                            {bulletin.student_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {bulletin.batch_name || 'Classe non définie'}
                          </Typography>
                          <Chip
                            label={bulletin.state || 'draft'}
                            size="small"
                            color={bulletin.state === 'validated' ? 'success' : 'default'}
                            className="mt-2"
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert severity="info">
                  Aucun bulletin trouvé pour ce trimestre. Assurez-vous que les bulletins ont été créés.
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Résultats de synchronisation */}
        {bulletinSync.syncResults && (
          <Card className="mb-6">
            <CardHeader title="Résultats de la synchronisation" />
            <CardContent>
              <Grid container spacing={2}>
                {bulletinSync.syncResults.map((result, index) => (
                  <Grid item xs={12} key={index}>
                    <Alert 
                      severity={result.success ? 'success' : 'error'}
                      className="mb-2"
                    >
                      <Typography variant="subtitle2">
                        {result.studentName}
                      </Typography>
                      <Typography variant="body2">
                        {result.message}
                      </Typography>
                    </Alert>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Résultats de validation */}
        {bulletinSync.validation && (
          <Card className="mb-6">
            <CardHeader title="Validation des notes pour bulletins" />
            <CardContent>
              <Grid container spacing={2}>
                {bulletinSync.validation.map((validation, index) => (
                  <Grid item xs={12} key={index}>
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box className="flex items-center gap-2 w-full">
                          <Typography variant="subtitle2">
                            {validation.studentName}
                          </Typography>
                          <Chip
                            label={validation.isValid ? 'Valide' : 'Erreurs détectées'}
                            color={validation.isValid ? 'success' : 'error'}
                            size="small"
                          />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        {validation.errors.length > 0 && (
                          <Box className="mb-3">
                            <Typography variant="subtitle2" color="error" gutterBottom>
                              Erreurs:
                            </Typography>
                            {validation.errors.map((error, errorIndex) => (
                              <Alert key={errorIndex} severity="error" className="mb-1">
                                {error}
                              </Alert>
                            ))}
                          </Box>
                        )}
                        
                        {validation.warnings.length > 0 && (
                          <Box>
                            <Typography variant="subtitle2" color="warning.main" gutterBottom>
                              Avertissements:
                            </Typography>
                            {validation.warnings.map((warning, warningIndex) => (
                              <Alert key={warningIndex} severity="warning" className="mb-1">
                                {warning}
                              </Alert>
                            ))}
                          </Box>
                        )}
                        
                        {validation.isValid && validation.errors.length === 0 && validation.warnings.length === 0 && (
                          <Alert severity="success">
                            Toutes les notes sont valides pour ce bulletin
                          </Alert>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Guide d'utilisation */}
        <Card>
          <CardHeader title="Guide d'utilisation" />
          <CardContent>
            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>1. Sélectionner un trimestre :</strong> Choisissez le trimestre pour lequel vous souhaitez synchroniser les notes.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>2. Synchroniser :</strong> Les notes de cet examen seront ajoutées aux bulletins des étudiants pour le trimestre sélectionné.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              <strong>3. Valider :</strong> Vérifiez que toutes les notes sont conformes aux exigences des bulletins.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>4. Calculer les moyennes :</strong> Recalculez automatiquement les moyennes des bulletins en tenant compte de cet examen.
            </Typography>
          </CardContent>
        </Card>

        {/* Loading overlay */}
        {bulletinSync.loading && (
          <Box className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Paper className="p-6 flex flex-col items-center gap-4">
              <CircularProgress />
              <Typography>Traitement en cours...</Typography>
            </Paper>
          </Box>
        )}
      </Box>
    );
  }
};

export default ExamDetail;