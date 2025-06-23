import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Alert,
  Chip,
  Avatar,
  Stack,
  IconButton,
  useTheme,
  CircularProgress,
  FormHelperText,
  Skeleton
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Grade as GradeIcon,
  Description as DescriptionIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  AccessTime as AccessTimeIcon,
  PlayCircleFilled as PlayCircleFilledIcon
} from '@mui/icons-material';
import { useExam, useExamActions } from '../../hooks/useExams';
import { useAllSubjects, useAllCourses, useAllTeachers, useBatchesByCourse, useEvaluationTypes } from '../../hooks/useOdoo';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';

const ExamEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  
  // États du formulaire
  const [formData, setFormData] = useState({
    name: '',
    exam_code: '',
    date: '',
    start_time: '08:00',
    end_time: '10:00',
    state: 'draft',
    evaluation_type_id: '',
    subject_id: '',
    course_id: '',
    batch_id: '',
    faculty_id: '',
    note_max: 20,
    description: ''
  });
  
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  // Options d'état disponibles
  const stateOptions = [
    { value: 'draft', label: 'Brouillon', icon: '📝', color: 'default', description: 'Examen en préparation' },
    { value: 'ongoing', label: 'En cours', icon: '⏳', color: 'warning', description: 'Examen en cours de passation' },
    { value: 'done', label: 'Terminé', icon: '✅', color: 'success', description: 'Examen terminé et corrigé' },
    { value: 'cancelled', label: 'Annulé', icon: '❌', color: 'error', description: 'Examen annulé' }
  ];

  // Fonction pour obtenir le badge d'état
  const getStateBadge = (state) => {
    const stateInfo = stateOptions.find(s => s.value === state) || stateOptions[0];
    return stateInfo;
  };

  // Hooks pour récupérer les données
  const { data: examData, loading: examLoading, error: examError } = useExam(id);
  const { updateExam, loading: actionLoading, error: actionError, clearError } = useExamActions();
  
  // Hooks pour les options
  const { data: subjects, loading: subjectsLoading } = useAllSubjects();
  const { data: courses, loading: coursesLoading } = useAllCourses();
  const { data: teachers, loading: teachersLoading } = useAllTeachers();
  const { data: evaluationTypes, loading: typesLoading } = useEvaluationTypes();
  
  // Hook pour les batches basé sur le cours sélectionné
  const { data: batchesFromCourse, loading: batchesLoading } = useBatchesByCourse(formData.course_id);

  // Filtrer les batches par cours sélectionné
  const [filteredBatches, setFilteredBatches] = useState([]);

  // Extraction des données de l'examen
  const exam = examData?.status === 'success' ? examData.data.exam : examData;

  // Initialiser le formulaire avec les données de l'examen
  useEffect(() => {
    if (exam) {
      setFormData({
        name: exam.name || '',
        exam_code: exam.exam_code || '',
        date: exam.date ? exam.date.split('T')[0] : '',
        start_time: exam.start_time || '08:00',
        end_time: exam.end_time || '10:00',
        state: exam.state || 'draft',
        evaluation_type_id: exam.evaluation_type_id || '',
        subject_id: exam.subject_id || '',
        course_id: exam.course_id || '',
        batch_id: exam.batch_id || '',
        faculty_id: exam.faculty_id || exam.teacher_id || '',
        note_max: exam.note_max || 20,
        description: exam.description || ''
      });
    }
  }, [exam]);

  useEffect(() => {
    if (formData.course_id && batchesFromCourse) {
      setFilteredBatches(Array.isArray(batchesFromCourse) ? batchesFromCourse : []);
      
      // Réinitialiser la sélection de batch si le cours change
      if (formData.batch_id && !batchesFromCourse.find(b => b.id === parseInt(formData.batch_id))) {
        setFormData(prev => ({ ...prev, batch_id: '' }));
      }
    } else {
      setFilteredBatches([]);
      setFormData(prev => ({ ...prev, batch_id: '' }));
    }
  }, [formData.course_id, batchesFromCourse, formData.batch_id, batchesLoading]);

  // Gestionnaires d'événements
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur pour ce champ
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom de l\'examen est obligatoire';
    }
    
    if (!formData.date) {
      newErrors.date = 'La date de l\'examen est obligatoire';
    }
    
    if (!formData.start_time) {
      newErrors.start_time = 'L\'heure de début est obligatoire';
    }
    
    if (!formData.end_time) {
      newErrors.end_time = 'L\'heure de fin est obligatoire';
    }
    
    // Vérifier que l'heure de fin est après l'heure de début
    if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
      newErrors.end_time = 'L\'heure de fin doit être après l\'heure de début';
    }
    
    if (!formData.subject_id) {
      newErrors.subject_id = 'La matière est obligatoire';
    }
    
    if (!formData.course_id) {
      newErrors.course_id = 'Le cours est obligatoire';
    }
    
    if (!formData.batch_id) {
      newErrors.batch_id = 'La promotion est obligatoire';
    }
    
    if (!formData.faculty_id) {
      newErrors.faculty_id = 'L\'enseignant est obligatoire';
    }
    
    if (!formData.evaluation_type_id) {
      newErrors.evaluation_type_id = 'Le type d\'évaluation est obligatoire';
    }
    
    if (!formData.note_max || formData.note_max <= 0) {
      newErrors.note_max = 'La note maximale doit être supérieure à 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    clearError();
    setSuccess('');
    
    // Préparer les données pour l'API
    const examData = {
      name: formData.name,
      date: formData.date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      state: formData.state,
      subject_id: parseInt(formData.subject_id),
      course_id: parseInt(formData.course_id),
      batch_id: parseInt(formData.batch_id),
      faculty_id: parseInt(formData.faculty_id),
      evaluation_type_id: parseInt(formData.evaluation_type_id),
      note_max: parseFloat(formData.note_max),
      description: formData.description
    };
    
    console.log('📤 Données d\'examen à mettre à jour:', examData);
    
    const result = await updateExam(id, examData);
    
    if (result.success) {
      setSuccess('Examen modifié avec succès !');
      setTimeout(() => {
        navigate(`/exams/${id}`);
      }, 1500);
    }
  };

  const handleCancel = () => {
    navigate(`/exams/${id}`);
  };

  // Affichage du loading
  const isLoading = examLoading || subjectsLoading || coursesLoading || teachersLoading || typesLoading || batchesLoading;

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid item xs={12}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (examError || !exam) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
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
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* En-tête simple */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EditIcon color="primary" />
              Modifier l'Examen
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Modifier les détails de l'examen "{exam.name}"
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleCancel}
          >
            Retour
          </Button>
        </Box>
      </Paper>

      {/* Messages de succès et d'erreur */}
      {success && (
        <Alert 
          severity="success" 
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={() => setSuccess('')}
        >
          {success}
        </Alert>
      )}
      
      {actionError && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={clearError}
        >
          {actionError}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          {/* Section 1: Informations de base */}
          <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom color="primary.main" fontWeight="bold">
              Informations de base
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nom de l'examen"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Code de l'examen"
                  name="exam_code"
                  value={formData.exam_code}
                  onChange={handleInputChange}
                  error={!!errors.exam_code}
                  helperText={errors.exam_code}
                  placeholder="Ex: EXAM2024-001"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  error={!!errors.date}
                  helperText={errors.date}
                  required
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min: new Date().toISOString().split('T')[0]
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Heure de début"
                  name="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  error={!!errors.start_time}
                  helperText={errors.start_time}
                  required
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: <AccessTimeIcon sx={{ color: 'action.active', mr: 1 }} />
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Heure de fin"
                  name="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                  error={!!errors.end_time}
                  helperText={errors.end_time}
                  required
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: <AccessTimeIcon sx={{ color: 'action.active', mr: 1 }} />
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.state}>
                  <InputLabel>État de l'examen</InputLabel>
                  <Select
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    label="État de l'examen"
                  >
                    {stateOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{option.icon}</span>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {option.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {option.description}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.state && (
                    <FormHelperText>{errors.state}</FormHelperText>
                  )}
                  <FormHelperText>
                    État actuel: <Chip 
                      size="small" 
                      label={getStateBadge(formData.state).label}
                      color={getStateBadge(formData.state).color}
                      variant="outlined"
                    />
                  </FormHelperText>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.evaluation_type_id}>
                  <InputLabel>Type d'évaluation *</InputLabel>
                  <Select
                    name="evaluation_type_id"
                    value={formData.evaluation_type_id}
                    onChange={handleInputChange}
                    label="Type d'évaluation *"
                  >
                    {evaluationTypes?.length > 0 ? (
                      evaluationTypes.map((type) => (
                        <MenuItem key={type.id} value={type.id}>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {type.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {type.type_evaluation} ({type.education_level || 'Général'}) - Coeff: {type.coefficient}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>
                        <Typography variant="body2" color="text.secondary">
                          ⚠️ Aucun type d'évaluation disponible
                        </Typography>
                      </MenuItem>
                    )}
                  </Select>
                  {errors.evaluation_type_id && (
                    <FormHelperText>{errors.evaluation_type_id}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Section 2: Configuration académique */}
          <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom color="success.main" fontWeight="bold">
              Configuration académique
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.subject_id}>
                  <InputLabel>Matière *</InputLabel>
                  <Select
                    name="subject_id"
                    value={formData.subject_id}
                    onChange={handleInputChange}
                    label="Matière *"
                  >
                    {subjects?.length > 0 ? (
                      subjects.map((subject) => (
                        <MenuItem key={subject.id} value={subject.id}>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {subject.name}
                            </Typography>
                            {subject.code && (
                              <Chip 
                                label={subject.code} 
                                size="small" 
                                variant="outlined"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>
                        <Typography variant="body2" color="text.secondary">
                          ⚠️ Aucune matière disponible
                        </Typography>
                      </MenuItem>
                    )}
                  </Select>
                  {errors.subject_id && (
                    <FormHelperText>{errors.subject_id}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.course_id}>
                  <InputLabel>Cours *</InputLabel>
                  <Select
                    name="course_id"
                    value={formData.course_id}
                    onChange={handleInputChange}
                    label="Cours *"
                  >
                    {courses?.map((course) => (
                      <MenuItem key={course.id} value={course.id}>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {course.name}
                          </Typography>
                          {course.code && (
                            <Chip 
                              label={course.code} 
                              size="small" 
                              variant="outlined"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.course_id && (
                    <FormHelperText>{errors.course_id}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl 
                  fullWidth 
                  error={!!errors.batch_id}
                  disabled={!formData.course_id}
                >
                  <InputLabel>Promotion *</InputLabel>
                  <Select
                    name="batch_id"
                    value={formData.batch_id}
                    onChange={handleInputChange}
                    label="Promotion *"
                  >
                    {filteredBatches?.length > 0 ? (
                      filteredBatches.map((batch) => (
                        <MenuItem key={batch.id} value={batch.id}>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {batch.name}
                            </Typography>
                            {batch.code && (
                              <Chip 
                                label={batch.code} 
                                size="small" 
                                variant="outlined"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Box>
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>
                        <Typography variant="body2" color="text.secondary">
                          {formData.course_id 
                            ? `❌ Aucune promotion pour ce cours (ID: ${formData.course_id})`
                            : '⚠️ Veuillez d\'abord sélectionner un cours'
                          }
                        </Typography>
                      </MenuItem>
                    )}
                  </Select>
                  {errors.batch_id && (
                    <FormHelperText>{errors.batch_id}</FormHelperText>
                  )}
                  {!formData.course_id && (
                    <FormHelperText>Sélectionnez d'abord un cours</FormHelperText>
                  )}
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Section 3: Assignation et notation */}
          <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom color="warning.main" fontWeight="bold">
              Assignation et notation
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={8}>
                <FormControl 
                  fullWidth 
                  error={!!errors.faculty_id}
                  variant="outlined"
                >
                  <InputLabel>Enseignant responsable *</InputLabel>
                  <Select
                    name="faculty_id"
                    value={formData.faculty_id}
                    onChange={handleInputChange}
                    label="Enseignant responsable *"
                  >
                    {teachers?.map((teacher) => (
                      <MenuItem key={teacher.id} value={teacher.id}>
                        <Box display="flex" alignItems="center">
                          <Avatar 
                            sx={{ 
                              width: 24, 
                              height: 24, 
                              mr: 1,
                              bgcolor: theme.palette.primary.main 
                            }}
                          >
                            <PersonIcon fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {teacher.name}
                            </Typography>
                            {teacher.email && (
                              <Typography variant="caption" color="text.secondary">
                                {teacher.email}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.faculty_id && (
                    <FormHelperText>{errors.faculty_id}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Note maximale"
                  name="note_max"
                  value={formData.note_max}
                  onChange={handleInputChange}
                  error={!!errors.note_max}
                  helperText={errors.note_max}
                  required
                  variant="outlined"
                  inputProps={{
                    min: 1,
                    max: 100,
                    step: 0.1
                  }}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description (optionnel)"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  variant="outlined"
                  placeholder="Informations complémentaires sur l'examen..."
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Boutons d'action */}
          <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                size="large"
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
                disabled={actionLoading}
                sx={{ 
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 'medium'
                }}
              >
                Annuler
              </Button>
              
              <Button
                size="large"
                type="submit"
                variant="contained"
                startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                disabled={actionLoading}
                sx={{ 
                  borderRadius: 2,
                  px: 4,
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
                {actionLoading ? 'Modification en cours...' : 'Modifier l\'examen'}
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </form>
    </Container>
  );
};

export default ExamEdit; 