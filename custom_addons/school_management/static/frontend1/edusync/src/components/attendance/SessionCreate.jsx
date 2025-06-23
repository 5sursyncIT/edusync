import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, TextField, Button, Select, MenuItem,
  FormControl, InputLabel, Alert, Container, CircularProgress, Snackbar
} from '@mui/material';
import { Save, Cancel, Schedule, CheckCircle } from '@mui/icons-material';
import { useSessionActions } from '../../hooks/useAttendance';
import { useBatches, useAllSubjects, useFaculties } from '../../hooks/useOdoo';

const SessionCreate = ({ onBack, onSuccess }) => {
  // États du formulaire
  const [formData, setFormData] = useState({
    name: '',
    subject_id: '',
    batch_id: '',
    faculty_id: '',
    start_datetime: '',
    end_datetime: '',
    state: 'draft'
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);

  // Hooks
  const { createSession } = useSessionActions();
  const { data: batchesData, loading: batchesLoading, error: batchesError } = useBatches();
  const { data: subjectsData, loading: subjectsLoading, error: subjectsError } = useAllSubjects();
  const { data: facultiesData, loading: facultiesLoading, error: facultiesError } = useFaculties();

  // Données formatées
  const batches = batchesData?.batches || [];
  const subjects = subjectsData || [];
  const faculties = facultiesData || [];

  // Debug - Vérifier les données récupérées
  useEffect(() => {
    console.log('=== SessionCreate Debug ===');
    console.log('Batches data:', batchesData, 'loading:', batchesLoading, 'error:', batchesError);
    console.log('Subjects data:', subjectsData, 'loading:', subjectsLoading, 'error:', subjectsError);
    console.log('Faculties data:', facultiesData, 'loading:', facultiesLoading, 'error:', facultiesError);
    console.log('Formatted - Batches:', batches);
    console.log('Formatted - Subjects:', subjects);
    console.log('Formatted - Faculties:', faculties);
    console.log('========================');
  }, [batchesData, subjectsData, facultiesData, batches, subjects, faculties, 
      batchesLoading, subjectsLoading, facultiesLoading,
      batchesError, subjectsError, facultiesError]);

  // Génération automatique du nom de session
  useEffect(() => {
    if (formData.subject_id && formData.batch_id && formData.start_datetime) {
      const subject = subjects.find(s => s.id == formData.subject_id);
      const batch = batches.find(b => b.id == formData.batch_id);
      const date = new Date(formData.start_datetime);
      
      if (subject && batch) {
        const dateStr = date.toLocaleDateString('fr-FR');
        const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const sessionName = `${subject.name} - ${batch.name} - ${dateStr} ${timeStr}`;
        
        setFormData(prev => ({
          ...prev,
          name: sessionName
        }));
      }
    }
  }, [formData.subject_id, formData.batch_id, formData.start_datetime, subjects, batches]);

  // Gestionnaires d'événements
  const handleChange = (e) => {
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

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom de la session est obligatoire';
    }

    if (!formData.subject_id) {
      newErrors.subject_id = 'La matière est obligatoire';
    }

    if (!formData.batch_id) {
      newErrors.batch_id = 'La promotion est obligatoire';
    }

    if (!formData.faculty_id) {
      newErrors.faculty_id = 'L\'enseignant est obligatoire';
    }

    if (!formData.start_datetime) {
      newErrors.start_datetime = 'La date/heure de début est obligatoire';
    }

    if (!formData.end_datetime) {
      newErrors.end_datetime = 'La date/heure de fin est obligatoire';
    }

    if (formData.start_datetime && formData.end_datetime) {
      const startDate = new Date(formData.start_datetime);
      const endDate = new Date(formData.end_datetime);
      
      if (endDate <= startDate) {
        newErrors.end_datetime = 'L\'heure de fin doit être postérieure à l\'heure de début';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('📝 SessionCreate: Soumission du formulaire avec données:', formData);
    
    if (!validateForm()) {
      console.log('❌ SessionCreate: Validation du formulaire échouée');
      return;
    }

    try {
      setSaving(true);
      setErrors({}); // Effacer les erreurs précédentes
      
      // Préparer les données
      console.log('🔧 Données du formulaire avant conversion:', {
        start_datetime: formData.start_datetime,
        end_datetime: formData.end_datetime
      });
      
      // Extraire directement à partir des chaînes datetime-local (format: YYYY-MM-DDTHH:MM)
      const [startDate, startTime] = formData.start_datetime.split('T');
      const [endDate, endTime] = formData.end_datetime.split('T');
      
      console.log('🔧 Après extraction:', {
        date: startDate,
        start_time: startTime,
        end_time: endTime
      });
      
      const sessionData = {
        name: formData.name.trim(),
        subject_id: parseInt(formData.subject_id),
        batch_id: parseInt(formData.batch_id),
        teacher_id: parseInt(formData.faculty_id),
        date: startDate,
        start_time: startTime,
        end_time: endTime,
        state: formData.state
      };

      console.log('🔧 SessionCreate: Données préparées pour l\'API:', sessionData);

      const result = await createSession(sessionData);
      
      console.log('📡 SessionCreate: Résultat de createSession:', result);
      
      // Vérifier le format de la réponse
      if (result && result.success) {
        console.log('🎉 SessionCreate: Création réussie, appel de onSuccess');
        if (onSuccess) {
          onSuccess(result);
        }
        setShowSuccessNotification(true);
      } else {
        // Gérer les erreurs retournées par le hook
        const errorMessage = result?.error || 'Erreur inconnue lors de la création';
        console.log('❌ SessionCreate: Erreur de création:', errorMessage);
        setErrors({ submit: errorMessage });
      }
    } catch (error) {
      console.error('💥 SessionCreate: Exception dans handleSubmit:', error);
      setErrors({ submit: error.message || 'Erreur lors de la création de la session' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* En-tête */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Schedule color="primary" />
              Nouvelle Session
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Créer une nouvelle session de cours
            </Typography>
          </Box>
          {onBack && (
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              onClick={onBack}
            >
              Annuler
            </Button>
          )}
        </Box>
      </Paper>

      {/* Formulaire */}
      <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
        {/* Alertes d'erreur pour les hooks */}
        {(batchesError || subjectsError || facultiesError) && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Erreurs de chargement des données :
            </Typography>
            {batchesError && <Typography variant="body2">• Promotions : {batchesError}</Typography>}
            {subjectsError && <Typography variant="body2">• Matières : {subjectsError}</Typography>}
            {facultiesError && <Typography variant="body2">• Enseignants : {facultiesError}</Typography>}
          </Alert>
        )}

        {/* Indicateur de chargement global */}
        {(batchesLoading || subjectsLoading || facultiesLoading) && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={20} />
              <Typography>
                Chargement des données 
                {batchesLoading && ' (promotions)'}
                {subjectsLoading && ' (matières)'}
                {facultiesLoading && ' (enseignants)'}
                ...
              </Typography>
            </Box>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {/* Erreur générale */}
          {errors.submit && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {errors.submit}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Nom de la session */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom de la session"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                placeholder="Ex: Mathématiques - L1 Info - 15/03/2024 09:00"
              />
            </Grid>

            {/* Matière */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.subject_id}>
                <InputLabel>Matière *</InputLabel>
                <Select
                  name="subject_id"
                  value={formData.subject_id}
                  onChange={handleChange}
                  label="Matière *"
                  disabled={subjectsLoading}
                >
                  <MenuItem value="">Sélectionner une matière</MenuItem>
                  {subjectsLoading ? (
                    <MenuItem disabled>Chargement des matières...</MenuItem>
                  ) : subjects.length > 0 ? (
                    subjects.map(subject => (
                      <MenuItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>Aucune matière disponible</MenuItem>
                  )}
                </Select>
                {errors.subject_id && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.subject_id}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Promotion */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.batch_id}>
                <InputLabel>Promotion *</InputLabel>
                <Select
                  name="batch_id"
                  value={formData.batch_id}
                  onChange={handleChange}
                  label="Promotion *"
                  disabled={batchesLoading}
                >
                  <MenuItem value="">Sélectionner une promotion</MenuItem>
                  {batchesLoading ? (
                    <MenuItem disabled>Chargement des promotions...</MenuItem>
                  ) : batches.length > 0 ? (
                    batches.map(batch => (
                      <MenuItem key={batch.id} value={batch.id}>
                        {batch.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>Aucune promotion disponible</MenuItem>
                  )}
                </Select>
                {errors.batch_id && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.batch_id}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Enseignant */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.faculty_id}>
                <InputLabel>Enseignant *</InputLabel>
                <Select
                  name="faculty_id"
                  value={formData.faculty_id}
                  onChange={handleChange}
                  label="Enseignant *"
                  disabled={facultiesLoading}
                >
                  <MenuItem value="">Sélectionner un enseignant</MenuItem>
                  {facultiesLoading ? (
                    <MenuItem disabled>Chargement des enseignants...</MenuItem>
                  ) : faculties.length > 0 ? (
                    faculties.map(faculty => (
                      <MenuItem key={faculty.id} value={faculty.id}>
                        {faculty.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>Aucun enseignant disponible</MenuItem>
                  )}
                </Select>
                {errors.faculty_id && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                    {errors.faculty_id}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* État */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>État</InputLabel>
                <Select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  label="État"
                >
                  <MenuItem value="draft">Brouillon</MenuItem>
                  <MenuItem value="confirm">Confirmée</MenuItem>
                  <MenuItem value="done">Terminée</MenuItem>
                  <MenuItem value="cancel">Annulée</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Date/heure de début */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date et heure de début"
                name="start_datetime"
                type="datetime-local"
                value={formData.start_datetime}
                onChange={handleChange}
                error={!!errors.start_datetime}
                helperText={errors.start_datetime}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Date/heure de fin */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date et heure de fin"
                name="end_datetime"
                type="datetime-local"
                value={formData.end_datetime}
                onChange={handleChange}
                error={!!errors.end_datetime}
                helperText={errors.end_datetime}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Boutons d'action */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                {onBack && (
                  <Button
                    variant="outlined"
                    startIcon={<Cancel />}
                    onClick={onBack}
                    disabled={saving}
                  >
                    Annuler
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                  disabled={saving}
                >
                  {saving ? 'Création...' : 'Créer la session'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Notification de succès */}
      <Snackbar
        open={showSuccessNotification}
        autoHideDuration={6000}
        onClose={() => setShowSuccessNotification(false)}
      >
        <Alert onClose={() => setShowSuccessNotification(false)} severity="success" sx={{ width: '100%' }}>
          <Typography variant="body1" fontWeight="bold">
            <CheckCircle color="success" sx={{ mr: 1 }} />
            Session créée avec succès !
          </Typography>
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SessionCreate; 