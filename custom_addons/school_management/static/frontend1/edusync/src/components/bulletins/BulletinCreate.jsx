import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, Box, Grid, Card, CardContent,
  Button, TextField, FormControl, InputLabel, Select, MenuItem,
  Alert, CircularProgress, IconButton, Stepper, Step, StepLabel,
  StepContent, Divider, Autocomplete, Chip, Stack
} from '@mui/material';
import {
  ArrowBack, Save, Cancel, PersonOutline, SchoolOutlined,
  GradeOutlined, CalendarTodayOutlined, CheckCircle
} from '@mui/icons-material';
import { useOdoo } from '../../contexts/OdooContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://172.16.209.128:8069';

const BulletinCreate = () => {
  const navigate = useNavigate();
  const { odooApi } = useOdoo();
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Données du formulaire
  const [formData, setFormData] = useState({
    student_id: '',
    course_id: '',
    batch_id: '',
    trimestre_id: '',
    appreciation_generale: '',
    absence_non_justifiees: 0,
    absence_justifiees: 0,
    retards: 0
  });

  // Données de référence
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [trimestres, setTrimestres] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchReferenceData();
  }, []);

  useEffect(() => {
    // Filtrer les étudiants selon la classe sélectionnée
    if (formData.batch_id) {
      const batchStudents = students.filter(student => 
        student.batch_ids && student.batch_ids.includes(parseInt(formData.batch_id))
      );
      setFilteredStudents(batchStudents);
    } else {
      setFilteredStudents(students);
    }
  }, [formData.batch_id, students]);

  const fetchReferenceData = async () => {
    try {
      setLoading(true);
      
      const [studentsRes, coursesRes, batchesRes, trimestresRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/students`),
        fetch(`${API_BASE_URL}/api/courses`),
        fetch(`${API_BASE_URL}/api/batches`),
        fetch(`${API_BASE_URL}/api/trimestres`)
      ]);

      const [studentsData, coursesData, batchesData, trimestresData] = await Promise.all([
        studentsRes.json(),
        coursesRes.json(),
        batchesRes.json(),
        trimestresRes.json()
      ]);

      console.log('Données reçues:', {
        students: studentsData,
        courses: coursesData,
        batches: batchesData,
        trimestres: trimestresData
      });

      // Fonction utilitaire pour extraire les données d'un tableau
      const extractArray = (apiResponse, resourceName) => {
        if (!apiResponse || apiResponse.status !== 'success' || !apiResponse.data) {
          return [];
        }
        
        const data = apiResponse.data;
        
        // Si data est directement un tableau
        if (Array.isArray(data)) {
          return data;
        }
        
        // Si data est un objet avec une propriété tableau
        if (resourceName && Array.isArray(data[resourceName])) {
          return data[resourceName];
        }
        
        // Essayer de trouver le premier tableau dans data
        const keys = Object.keys(data);
        for (const key of keys) {
          if (Array.isArray(data[key])) {
            return data[key];
          }
        }
        
        return [];
      };

      // Extraire les données avec les noms de ressources appropriés
      const students = extractArray(studentsData, 'students');
      const courses = extractArray(coursesData, 'courses');
      const batches = extractArray(batchesData, 'batches');
      const trimestres = extractArray(trimestresData, 'trimestres');

      setStudents(students);
      setCourses(courses);
      setBatches(batches);
      setTrimestres(trimestres);

      console.log('Données extraites:', {
        studentsCount: students.length,
        coursesCount: courses.length,
        batchesCount: batches.length,
        trimestresCount: trimestres.length
      });

    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Erreur lors du chargement des données de référence');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Supprimer l'erreur de validation pour ce champ
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (step) => {
    const errors = {};
    
    switch (step) {
      case 0: // Sélection étudiant et classe
        if (!formData.student_id) errors.student_id = 'Veuillez sélectionner un étudiant';
        if (!formData.batch_id) errors.batch_id = 'Veuillez sélectionner une classe';
        if (!formData.course_id) errors.course_id = 'Veuillez sélectionner un cours';
        break;
      case 1: // Trimestre
        if (!formData.trimestre_id) errors.trimestre_id = 'Veuillez sélectionner un trimestre';
        break;
      case 2: // Informations complémentaires
        if (formData.absence_non_justifiees < 0) errors.absence_non_justifiees = 'Valeur invalide';
        if (formData.absence_justifiees < 0) errors.absence_justifiees = 'Valeur invalide';
        if (formData.retards < 0) errors.retards = 'Valeur invalide';
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validation finale
      if (!validateStep(2)) {
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/bulletins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        setSuccessMessage('Bulletin créé avec succès');
        // Rediriger vers le détail du bulletin créé
        setTimeout(() => {
          navigate(`/bulletins/${result.data.id}`);
        }, 2000);
      } else {
        setError(result.message || 'Erreur lors de la création du bulletin');
      }
    } catch (err) {
      console.error('Erreur lors de la création:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/bulletins');
  };

  const getSelectedStudent = () => {
    return Array.isArray(students) ? students.find(s => s.id === formData.student_id) : null;
  };

  const getSelectedBatch = () => {
    return Array.isArray(batches) ? batches.find(b => b.id === formData.batch_id) : null;
  };

  const getSelectedCourse = () => {
    return Array.isArray(courses) ? courses.find(c => c.id === formData.course_id) : null;
  };

  const getSelectedTrimestre = () => {
    return Array.isArray(trimestres) ? trimestres.find(t => t.id === formData.trimestre_id) : null;
  };

  const steps = [
    {
      label: 'Étudiant et Classe',
      description: 'Sélectionnez l\'étudiant, la classe et le cours'
    },
    {
      label: 'Trimestre',
      description: 'Choisissez le trimestre scolaire'
    },
    {
      label: 'Informations complémentaires',
      description: 'Ajoutez les informations sur les absences et appréciations'
    },
    {
      label: 'Confirmation',
      description: 'Vérifiez et créez le bulletin'
    }
  ];

  if (loading && students.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleCancel} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Créer un nouveau bulletin
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Stepper */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel>
                    <Typography variant="body2" fontWeight="medium">
                      {step.label}
                    </Typography>
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2" color="textSecondary">
                      {step.description}
                    </Typography>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </Grid>

        {/* Contenu du formulaire */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            {/* Étape 0: Étudiant et Classe */}
            {activeStep === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonOutline sx={{ mr: 1 }} />
                  Sélection de l'étudiant et de la classe
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControl fullWidth error={!!validationErrors.batch_id}>
                      <InputLabel>Classe</InputLabel>
                      <Select
                        value={formData.batch_id}
                        onChange={(e) => handleChange('batch_id', e.target.value)}
                        label="Classe"
                      >
                        {Array.isArray(batches) && batches.map((batch) => (
                          <MenuItem key={batch.id} value={batch.id}>
                            {batch.name} ({batch.course_name})
                          </MenuItem>
                        ))}
                      </Select>
                      {validationErrors.batch_id && (
                        <Typography variant="caption" color="error">
                          {validationErrors.batch_id}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <Autocomplete
                      options={filteredStudents}
                      getOptionLabel={(option) => `${option.name} (${option.roll_number || 'N/A'})`}
                      value={getSelectedStudent() || null}
                      onChange={(event, newValue) => {
                        handleChange('student_id', newValue ? newValue.id : '');
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Étudiant"
                          error={!!validationErrors.student_id}
                          helperText={validationErrors.student_id}
                          placeholder="Rechercher un étudiant..."
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props}>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {option.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              N° d'inscription: {option.roll_number || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl fullWidth error={!!validationErrors.course_id}>
                      <InputLabel>Cours</InputLabel>
                      <Select
                        value={formData.course_id}
                        onChange={(e) => handleChange('course_id', e.target.value)}
                        label="Cours"
                      >
                        {Array.isArray(courses) && courses.map((course) => (
                          <MenuItem key={course.id} value={course.id}>
                            {course.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {validationErrors.course_id && (
                        <Typography variant="caption" color="error">
                          {validationErrors.course_id}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Étape 1: Trimestre */}
            {activeStep === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarTodayOutlined sx={{ mr: 1 }} />
                  Sélection du trimestre
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControl fullWidth error={!!validationErrors.trimestre_id}>
                      <InputLabel>Trimestre</InputLabel>
                      <Select
                        value={formData.trimestre_id}
                        onChange={(e) => handleChange('trimestre_id', e.target.value)}
                        label="Trimestre"
                      >
                        {Array.isArray(trimestres) && trimestres.map((trimestre) => (
                          <MenuItem key={trimestre.id} value={trimestre.id}>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {trimestre.name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {trimestre.date_debut} - {trimestre.date_fin} | {trimestre.annee_scolaire}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                      {validationErrors.trimestre_id && (
                        <Typography variant="caption" color="error">
                          {validationErrors.trimestre_id}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Étape 2: Informations complémentaires */}
            {activeStep === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <GradeOutlined sx={{ mr: 1 }} />
                  Informations complémentaires
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Absences non justifiées"
                      type="number"
                      value={formData.absence_non_justifiees}
                      onChange={(e) => handleChange('absence_non_justifiees', parseInt(e.target.value) || 0)}
                      inputProps={{ min: 0 }}
                      error={!!validationErrors.absence_non_justifiees}
                      helperText={validationErrors.absence_non_justifiees}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Absences justifiées"
                      type="number"
                      value={formData.absence_justifiees}
                      onChange={(e) => handleChange('absence_justifiees', parseInt(e.target.value) || 0)}
                      inputProps={{ min: 0 }}
                      error={!!validationErrors.absence_justifiees}
                      helperText={validationErrors.absence_justifiees}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Retards"
                      type="number"
                      value={formData.retards}
                      onChange={(e) => handleChange('retards', parseInt(e.target.value) || 0)}
                      inputProps={{ min: 0 }}
                      error={!!validationErrors.retards}
                      helperText={validationErrors.retards}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Appréciation générale (optionnel)"
                      multiline
                      rows={4}
                      value={formData.appreciation_generale}
                      onChange={(e) => handleChange('appreciation_generale', e.target.value)}
                      placeholder="Saisissez une appréciation générale sur le travail de l'élève..."
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Étape 3: Confirmation */}
            {activeStep === 3 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle sx={{ mr: 1 }} />
                  Confirmation de création
                </Typography>
                
                <Alert severity="info" sx={{ mb: 3 }}>
                  Vérifiez les informations ci-dessous avant de créer le bulletin.
                </Alert>
                
                <Card variant="outlined">
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="textSecondary">Étudiant</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {getSelectedStudent()?.name}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="textSecondary">Classe</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {getSelectedBatch()?.name}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="textSecondary">Cours</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {getSelectedCourse()?.name}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="textSecondary">Trimestre</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {getSelectedTrimestre()?.name}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary">Absences</Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          <Chip 
                            label={`${formData.absence_non_justifiees} non justifiées`} 
                            size="small" 
                            color="error" 
                            variant="outlined"
                          />
                          <Chip 
                            label={`${formData.absence_justifiees} justifiées`} 
                            size="small" 
                            color="warning" 
                            variant="outlined"
                          />
                          <Chip 
                            label={`${formData.retards} retards`} 
                            size="small" 
                            color="info" 
                            variant="outlined"
                          />
                        </Stack>
                      </Grid>
                      {formData.appreciation_generale && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="textSecondary">Appréciation générale</Typography>
                          <Typography variant="body1">
                            {formData.appreciation_generale}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </Box>
            )}

            {/* Boutons de navigation */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                onClick={activeStep === 0 ? handleCancel : handleBack}
                startIcon={activeStep === 0 ? <Cancel /> : undefined}
              >
                {activeStep === 0 ? 'Annuler' : 'Précédent'}
              </Button>
              
              <Button
                variant="contained"
                onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
                disabled={loading}
                startIcon={activeStep === steps.length - 1 ? <Save /> : undefined}
              >
                {loading 
                  ? 'Création...' 
                  : activeStep === steps.length - 1 
                    ? 'Créer le bulletin' 
                    : 'Suivant'
                }
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default BulletinCreate; 