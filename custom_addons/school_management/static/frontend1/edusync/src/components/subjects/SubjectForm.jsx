// src/components/subjects/SubjectForm.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Alert, CircularProgress, Grid,
  FormControl, InputLabel, Select, MenuItem, Slider,
  Typography, Chip, FormControlLabel, Switch, Divider,
  Stack, Avatar, Card, CardContent
} from '@mui/material';
import { 
  Save, Cancel, MenuBook, Psychology, School, 
  Schedule, PlayArrow, CheckCircle, ImportContacts 
} from '@mui/icons-material';

const SubjectForm = ({ open, onClose, onSubmit, subject }) => {
  const [formData, setFormData] = useState({
    // Champs de base
    name: '',
    code: '',
    description: '',
    active: true,
    
    // Nouveaux champs du modèle op_subject.py
    content_type: 'chapitre',
    sequence: 10,
    duration: 2.0,
    state: 'draft',
    
    // Objectifs pédagogiques
    learning_objectives: '',
    skills: '',
    prerequisites: '',
    
    // Évaluation
    evaluation_type: 'none',
    weight: 1.0,
    max_grade: 20.0,
    
    // Ressources
    has_exercises: false,
    exercises_description: '',
    online_resources: '',
    
    // Relations (optionnel)
    course_id: null
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Types de contenu
  const contentTypes = [
    { value: 'chapitre', label: 'Chapitre', icon: MenuBook, color: '#1976d2', description: 'Chapitre de cours traditionnel' },
    { value: 'module', label: 'Module', icon: School, color: '#388e3c', description: 'Module d\'enseignement complet' },
    { value: 'unite', label: 'Unité d\'Enseignement', icon: MenuBook, color: '#f57c00', description: 'Unité pédagogique structurée' },
    { value: 'tp', label: 'Travaux Pratiques', icon: Psychology, color: '#7b1fa2', description: 'Séances de travaux pratiques' },
    { value: 'td', label: 'Travaux Dirigés', icon: Schedule, color: '#303f9f', description: 'Séances de travaux dirigés' },
    { value: 'projet', label: 'Projet', icon: PlayArrow, color: '#d32f2f', description: 'Projet ou étude de cas' },
    { value: 'evaluation', label: 'Évaluation', icon: CheckCircle, color: '#795548', description: 'Séance d\'évaluation' }
  ];

  // États disponibles
  const stateOptions = [
    { value: 'draft', label: 'Brouillon', color: 'default' },
    { value: 'planned', label: 'Planifié', color: 'info' },
    { value: 'ongoing', label: 'En Cours', color: 'success' },
    { value: 'done', label: 'Terminé', color: 'primary' },
    { value: 'cancelled', label: 'Annulé', color: 'error' }
  ];

  // Types d'évaluation
  const evaluationTypes = [
    { value: 'none', label: 'Pas d\'Évaluation' },
    { value: 'formative', label: 'Évaluation Formative' },
    { value: 'sommative', label: 'Évaluation Sommative' },
    { value: 'auto', label: 'Auto-Évaluation' }
  ];

  // Initialiser le formulaire avec les données de la matière
  useEffect(() => {
    if (subject) {
      setFormData({
        // Champs de base
        name: subject.name || '',
        code: subject.code || '',
        description: subject.description || '',
        active: subject.active !== undefined ? subject.active : true,
        
        // Nouveaux champs
        content_type: subject.content_type || 'chapitre',
        sequence: subject.sequence || 10,
        duration: subject.duration || 2.0,
        state: subject.state || 'draft',
        
        // Objectifs pédagogiques
        learning_objectives: subject.learning_objectives || '',
        skills: subject.skills || '',
        prerequisites: subject.prerequisites || '',
        
        // Évaluation
        evaluation_type: subject.evaluation_type || 'none',
        weight: subject.weight || 1.0,
        max_grade: subject.max_grade || 20.0,
        
        // Ressources
        has_exercises: subject.has_exercises || false,
        exercises_description: subject.exercises_description || '',
        online_resources: subject.online_resources || '',
        
        // Relations
        course_id: subject.course_id || null
      });
    } else {
      // Réinitialiser pour une nouvelle matière
      setFormData({
        name: '',
        code: '',
        description: '',
        active: true,
        content_type: 'chapitre',
        sequence: 10,
        duration: 2.0,
        state: 'draft',
        learning_objectives: '',
        skills: '',
        prerequisites: '',
        evaluation_type: 'none',
        weight: 1.0,
        max_grade: 20.0,
        has_exercises: false,
        exercises_description: '',
        online_resources: '',
        course_id: null
      });
    }
    setErrors({});
    setSubmitError('');
  }, [subject, open]);

  // Gestion des changements
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Nettoyer l'erreur du champ
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Gestion des changements numériques
  const handleNumberChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est obligatoire';
    }

    if (formData.code && !/^[A-Z0-9_-]+$/.test(formData.code)) {
      newErrors.code = 'Le code doit contenir uniquement des lettres majuscules, chiffres, traits d\'union et underscores';
    }

    if (formData.duration <= 0) {
      newErrors.duration = 'La durée doit être supérieure à 0';
    }

    if (formData.weight <= 0) {
      newErrors.weight = 'Le coefficient doit être supérieur à 0';
    }

    if (formData.max_grade <= 0) {
      newErrors.max_grade = 'La note maximale doit être supérieure à 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSubmitError('');

    try {
      // Préparer les données à envoyer
      const dataToSubmit = {
        // Champs de base
        name: formData.name.trim(),
        description: formData.description.trim(),
        active: formData.active,
        
        // Code optionnel
        ...(formData.code && { code: formData.code.trim().toUpperCase() }),
        
        // Configuration
        content_type: formData.content_type,
        sequence: parseInt(formData.sequence),
        duration: parseFloat(formData.duration),
        state: formData.state,
        
        // Objectifs pédagogiques
        ...(formData.learning_objectives && { learning_objectives: formData.learning_objectives.trim() }),
        ...(formData.skills && { skills: formData.skills.trim() }),
        ...(formData.prerequisites && { prerequisites: formData.prerequisites.trim() }),
        
        // Évaluation
        evaluation_type: formData.evaluation_type,
        weight: parseFloat(formData.weight),
        max_grade: parseFloat(formData.max_grade),
        
        // Ressources
        has_exercises: formData.has_exercises,
        ...(formData.exercises_description && { exercises_description: formData.exercises_description.trim() }),
        ...(formData.online_resources && { online_resources: formData.online_resources.trim() }),
        
        // Relations
        ...(formData.course_id && { course_id: formData.course_id })
      };

      const result = await onSubmit(dataToSubmit);
      
      if (result.success) {
        onClose();
      } else {
        setSubmitError(result.error || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      setSubmitError(error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Obtenir l'info du type sélectionné
  const selectedTypeInfo = contentTypes.find(t => t.value === formData.content_type);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: selectedTypeInfo?.color || 'primary.main' }}>
            {selectedTypeInfo?.icon ? React.createElement(selectedTypeInfo.icon) : <MenuBook />}
          </Avatar>
          <Box>
            <Typography variant="h6">
              {subject ? 'Modifier la matière' : 'Nouvelle matière'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedTypeInfo?.description || 'Créer ou modifier une matière d\'enseignement'}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}
          
          {/* Informations de base */}
          <Card sx={{ mb: 3, border: '1px solid #e3f2fd' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                📝 Informations de base
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nom de la matière"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={!!errors.name}
                    helperText={errors.name || "Nom descriptif de la matière"}
                    required
                    disabled={loading}
                    placeholder="Ex: Introduction à la Programmation"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Code (optionnel)"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    error={!!errors.code}
                    helperText={errors.code || "Code unique de la matière"}
                    disabled={loading}
                    placeholder="Ex: PROG_CH01"
                    inputProps={{ 
                      style: { textTransform: 'uppercase' }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Type de contenu</InputLabel>
                    <Select
                      name="content_type"
                      value={formData.content_type}
                      onChange={handleChange}
                      label="Type de contenu"
                      disabled={loading}
                    >
                      {contentTypes.map(type => (
                        <MenuItem key={type.value} value={type.value}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <type.icon sx={{ color: type.color, fontSize: 20 }} />
                            <span>{type.label}</span>
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Description détaillée de la matière..."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card sx={{ mb: 3, border: '1px solid #e3f2fd' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                ⚙️ Configuration
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Séquence"
                    name="sequence"
                    value={formData.sequence}
                    onChange={handleChange}
                    disabled={loading}
                    helperText="Ordre d'affichage"
                    inputProps={{ min: 1, max: 999 }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Durée (heures)"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    error={!!errors.duration}
                    helperText={errors.duration || "Durée en heures"}
                    disabled={loading}
                    inputProps={{ min: 0.5, max: 50, step: 0.5 }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>État</InputLabel>
                    <Select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      label="État"
                      disabled={loading}
                    >
                      {stateOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          <Chip 
                            label={option.label} 
                            color={option.color} 
                            size="small"
                            variant="outlined"
                          />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Objectifs pédagogiques */}
          <Card sx={{ mb: 3, border: '1px solid #e3f2fd' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                🎯 Objectifs pédagogiques
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Objectifs d'apprentissage"
                    name="learning_objectives"
                    value={formData.learning_objectives}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Objectifs que les étudiants doivent atteindre..."
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Compétences développées"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Compétences acquises..."
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Prérequis"
                    name="prerequisites"
                    value={formData.prerequisites}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Connaissances préalables nécessaires..."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Évaluation */}
          <Card sx={{ mb: 3, border: '1px solid #e3f2fd' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                📊 Évaluation
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Type d'évaluation</InputLabel>
                    <Select
                      name="evaluation_type"
                      value={formData.evaluation_type}
                      onChange={handleChange}
                      label="Type d'évaluation"
                      disabled={loading}
                    >
                      {evaluationTypes.map(type => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Coefficient"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    error={!!errors.weight}
                    helperText={errors.weight || "Poids dans l'évaluation"}
                    disabled={loading}
                    inputProps={{ min: 0.1, max: 10, step: 0.1 }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Note maximale"
                    name="max_grade"
                    value={formData.max_grade}
                    onChange={handleChange}
                    error={!!errors.max_grade}
                    helperText={errors.max_grade || "Note maximale"}
                    disabled={loading}
                    inputProps={{ min: 1, max: 100 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Ressources et exercices */}
          <Card sx={{ border: '1px solid #e3f2fd' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                📚 Ressources et exercices
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="has_exercises"
                        checked={formData.has_exercises}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    }
                    label="Cette matière comprend des exercices"
                  />
                </Grid>
                
                {formData.has_exercises && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Description des exercices"
                      name="exercises_description"
                      value={formData.exercises_description}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="Description des exercices proposés..."
                    />
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Ressources en ligne"
                    name="online_resources"
                    value={formData.online_resources}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Liens vers des ressources complémentaires..."
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="active"
                        checked={formData.active}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    }
                    label="Matière active"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={onClose}
          disabled={loading}
          startIcon={<Cancel />}
        >
          Annuler
        </Button>
        <Button 
          type="submit"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <Save />}
        >
          {loading ? 'Enregistrement...' : (subject ? 'Modifier' : 'Créer')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubjectForm;