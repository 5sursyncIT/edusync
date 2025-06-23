import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Grid, FormControl, InputLabel,
  Select, MenuItem, Typography, Box, Switch,
  FormControlLabel, CircularProgress, Alert, Chip,
  Divider
} from '@mui/material';
import { useBatches } from '../../hooks/useBatches';
import { useTeachers } from '../../hooks/useTeachers';
import { Save, Cancel } from '@mui/icons-material';
import odooApi from '../../services/odooApi.jsx';

const BatchForm = ({ open, onClose, onSubmit, batch = null }) => {
  const { getAllTeachers } = useTeachers();
  
  // État du formulaire correspondant aux champs du modèle backend
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    school_cycle: '',
    course_id: '',
    start_date: '',
    end_date: '',
    total_capacity: '',
    class_teacher_id: '',
    deputy_teacher_id: '',
    active: true
  });

  // État de l'UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  // Charger les enseignants disponibles
  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        
        // Charger les enseignants
        try {
          console.log('🔄 BatchForm: Début du chargement des enseignants...');
          const teachersList = await getAllTeachers();
          console.log('📊 BatchForm: Réponse getAllTeachers:', teachersList);
          console.log('📊 BatchForm: Type de teachersList:', typeof teachersList);
          console.log('📊 BatchForm: Est un tableau?', Array.isArray(teachersList));
          
          if (Array.isArray(teachersList)) {
            const activeTeachers = teachersList.filter(teacher => teacher.active);
            console.log('✅ BatchForm: Enseignants actifs filtrés:', activeTeachers.length, 'sur', teachersList.length);
            setTeachers(activeTeachers);
          } else {
            console.warn('⚠️ BatchForm: teachersList n\'est pas un tableau:', teachersList);
            setTeachers([]);
          }
        } catch (teacherError) {
          console.error('❌ BatchForm: Erreur lors du chargement des enseignants:', teacherError);
          setTeachers([]); // Continuer même si les enseignants ne se chargent pas
        }
        
        // Charger les cours disponibles
        try {
          const coursesResponse = await odooApi.getAllCourses();
          console.log('🔍 DEBUG COURSES BATCH FORM:', coursesResponse);
          
          if (coursesResponse && coursesResponse.status === 'success' && coursesResponse.data && Array.isArray(coursesResponse.data.courses)) {
            setCourses(coursesResponse.data.courses);
          } else if (coursesResponse && coursesResponse.status === 'success' && Array.isArray(coursesResponse.data)) {
            // Au cas où l'API retourne directement data comme tableau
            setCourses(coursesResponse.data);
          } else if (coursesResponse && Array.isArray(coursesResponse)) {
            // Au cas où l'API retourne directement un tableau
            setCourses(coursesResponse);
          } else {
            console.warn('Format de réponse des cours non reconnu:', coursesResponse);
            setCourses([]);
          }
        } catch (courseError) {
          console.error('Erreur lors du chargement des cours:', courseError);
          setCourses([]); // Continuer même si les cours ne se chargent pas
        }
        
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setError('Erreur lors du chargement des données');
      }
    };

    if (open) {
      loadData();
    }
  }, [open, getAllTeachers]);

  // Initialiser le formulaire
  useEffect(() => {
    if (batch) {
      setFormData({
        name: batch.name || '',
        code: batch.code || '',
        school_cycle: batch.school_cycle || '',
        course_id: batch.course_id || batch.course?.id || '',
        start_date: batch.start_date ? new Date(batch.start_date).toISOString().split('T')[0] : '',
        end_date: batch.end_date ? new Date(batch.end_date).toISOString().split('T')[0] : '',
        total_capacity: batch.total_capacity || '',
        class_teacher_id: batch.class_teacher_id ? (Array.isArray(batch.class_teacher_id) ? batch.class_teacher_id[0] : batch.class_teacher_id) : '',
        deputy_teacher_id: batch.deputy_teacher_id ? (Array.isArray(batch.deputy_teacher_id) ? batch.deputy_teacher_id[0] : batch.deputy_teacher_id) : '',
        active: batch.active !== undefined ? batch.active : true
      });
    } else {
      setFormData({
        name: '',
        code: '',
        school_cycle: '',
        course_id: '',
        start_date: '',
        end_date: '',
        total_capacity: '',
        class_teacher_id: '',
        deputy_teacher_id: '',
        active: true
      });
    }
    setError(null);
    setValidationErrors({});
  }, [batch, open]);

  // Gestion des changements dans le formulaire
  const handleChange = (field) => (event) => {
    const value = field === 'active' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Effacer l'erreur de validation pour ce champ
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // Gestionnaire pour les changements de date
  const handleDateChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Effacer l'erreur de validation
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // Validation du formulaire
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Le nom est obligatoire';
    }

    if (!formData.code.trim()) {
      errors.code = 'Le code est obligatoire';
    }

    if (!formData.school_cycle) {
      errors.school_cycle = 'Le cycle scolaire est obligatoire';
    }

    if (!formData.start_date) {
      errors.start_date = 'La date de début est obligatoire';
    }

    if (!formData.end_date) {
      errors.end_date = 'La date de fin est obligatoire';
    }

    if (formData.start_date && formData.end_date && new Date(formData.start_date) >= new Date(formData.end_date)) {
      errors.end_date = 'La date de fin doit être postérieure à la date de début';
    }

    if (formData.total_capacity && (isNaN(formData.total_capacity) || parseInt(formData.total_capacity) <= 0)) {
      errors.total_capacity = 'La capacité totale doit être un nombre positif';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Soumission du formulaire
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Préparer les données pour l'API - correspondant exactement aux champs du modèle
      const submitData = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        school_cycle: formData.school_cycle,
        course_id: formData.course_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        total_capacity: formData.total_capacity ? parseInt(formData.total_capacity) : null,
        class_teacher_id: formData.class_teacher_id || null,
        deputy_teacher_id: formData.deputy_teacher_id || null,
        active: formData.active
      };

      const result = await onSubmit(submitData);
      
      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      setError(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  // Fermer le formulaire
  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleCancel}
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle>
        {batch ? 'Modifier la promotion' : 'Nouvelle promotion'}
        {batch && (
          <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 0.5 }}>
            ID: {batch.id}
          </Typography>
        )}
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Informations de base */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Informations générales
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nom de la promotion *"
                value={formData.name}
                onChange={handleChange('name')}
                error={!!validationErrors.name}
                helperText={validationErrors.name}
                placeholder="Ex: Promotion CP 2024-2025"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Code de la promotion *"
                value={formData.code}
                onChange={handleChange('code')}
                error={!!validationErrors.code}
                helperText={validationErrors.code}
                placeholder="Ex: CP-2024"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth 
                error={!!validationErrors.school_cycle}
              >
                <InputLabel>Cycle Scolaire *</InputLabel>
                <Select
                  value={formData.school_cycle}
                  onChange={handleChange('school_cycle')}
                  label="Cycle Scolaire *"
                >
                  <MenuItem value="primaire">École Primaire</MenuItem>
                  <MenuItem value="college">Collège</MenuItem>
                  <MenuItem value="lycee">Lycée</MenuItem>
                </Select>
                {validationErrors.school_cycle && (
                  <Typography variant="caption" color="error">
                    {validationErrors.school_cycle}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Cours Principal (optionnel)</InputLabel>
                <Select
                  value={formData.course_id}
                  onChange={handleChange('course_id')}
                  label="Cours Principal (optionnel)"
                >
                  <MenuItem value="">
                    <em>Aucun cours sélectionné</em>
                  </MenuItem>
                  {courses.map((course) => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.name} ({course.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Dates et planification */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Planification
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                type="date"
                fullWidth
                label="Date de début *"
                value={formData.start_date}
                onChange={handleDateChange('start_date')}
                error={!!validationErrors.start_date}
                helperText={validationErrors.start_date}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                type="date"
                fullWidth
                label="Date de fin *"
                value={formData.end_date}
                onChange={handleDateChange('end_date')}
                inputProps={{ min: formData.start_date }}
                error={!!validationErrors.end_date}
                helperText={validationErrors.end_date}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Configuration */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Configuration
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Capacité totale"
                type="number"
                value={formData.total_capacity}
                onChange={handleChange('total_capacity')}
                error={!!validationErrors.total_capacity}
                helperText={validationErrors.total_capacity || "Nombre maximum d'élèves (laisser vide pour aucune limite)"}
                inputProps={{ min: 1 }}
              />
            </Grid>

            {/* Enseignants responsables */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Enseignants Responsables
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Professeur Principal</InputLabel>
                <Select
                  value={formData.class_teacher_id}
                  onChange={handleChange('class_teacher_id')}
                  label="Professeur Principal"
                >
                  <MenuItem value="">
                    <em>Aucun</em>
                  </MenuItem>
                  {teachers.map((teacher) => (
                    <MenuItem key={teacher.id} value={teacher.id}>
                      {teacher.name} {teacher.employee_id ? `- ${teacher.employee_id}` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Professeur Principal Adjoint</InputLabel>
                <Select
                  value={formData.deputy_teacher_id}
                  onChange={handleChange('deputy_teacher_id')}
                  label="Professeur Principal Adjoint"
                >
                  <MenuItem value="">
                    <em>Aucun</em>
                  </MenuItem>
                  {teachers.filter(teacher => teacher.id !== formData.class_teacher_id).map((teacher) => (
                    <MenuItem key={teacher.id} value={teacher.id}>
                      {teacher.name} {teacher.employee_id ? `- ${teacher.employee_id}` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.active}
                    onChange={handleChange('active')}
                    color="primary"
                  />
                }
                label="Promotion active"
              />
              <Typography variant="caption" color="textSecondary" display="block">
                Les promotions inactives ne sont pas visibles aux étudiants
              </Typography>
            </Grid>

            {/* Informations supplémentaires pour l'édition */}
            {batch && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Statistiques
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">
                      Nombre d'élèves inscrits: {batch.current_students || 0}
                      {batch.total_capacity && ` / ${batch.total_capacity}`}
                    </Typography>
                  </Grid>
                  {batch.create_date && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="textSecondary">
                        Créé le: {new Date(batch.create_date).toLocaleDateString('fr-FR')}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCancel} 
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
            {loading ? 'Sauvegarde...' : (batch ? 'Mettre à jour' : 'Créer')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default BatchForm;
