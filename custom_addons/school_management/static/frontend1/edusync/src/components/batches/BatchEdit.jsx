import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, TextField, Button, Grid,
  FormControl, InputLabel, Select, MenuItem, Box, Alert,
  CircularProgress, Switch, FormControlLabel, Skeleton,
  Card, CardHeader, CardContent, IconButton, Divider
} from '@mui/material';
import {
  Save, Cancel, ArrowBack, School, DateRange, People, Description
} from '@mui/icons-material';
import { useBatches } from '../../hooks/useBatches';
import { useTeachers } from '../../hooks/useTeachers';

const BatchEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getBatch, updateBatch } = useBatches();
  const { getAllTeachers } = useTeachers();

  // État du formulaire
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    school_cycle: '',
    start_date: '',
    end_date: '',
    total_capacity: '',
    class_teacher_id: '',
    deputy_teacher_id: '',
    active: true
  });

  // États UI
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [teachers, setTeachers] = useState([]);

  // Options de cycles scolaires
  const schoolCycles = [
    { id: 'primary', name: 'Primaire' },
    { id: 'middle', name: 'Collège' },
    { id: 'high', name: 'Lycée' }
  ];

  // Charger les données initiales
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Charger les données de la promotion et les enseignants
        const [batchData, teachersData] = await Promise.all([
          getBatch(id),
          getAllTeachers()
        ]);

        if (batchData) {
          setFormData({
            name: batchData.name || '',
            code: batchData.code || '',
            school_cycle: batchData.school_cycle || '',
            start_date: batchData.start_date ? new Date(batchData.start_date).toISOString().split('T')[0] : '',
            end_date: batchData.end_date ? new Date(batchData.end_date).toISOString().split('T')[0] : '',
            total_capacity: batchData.total_capacity || '',
            class_teacher_id: batchData.class_teacher_id || '',
            deputy_teacher_id: batchData.deputy_teacher_id || '',
            active: batchData.active !== undefined ? batchData.active : true
          });
        }

        setTeachers(teachersData || []);
      } catch (err) {
        console.error('Erreur lors du chargement:', err);
        setError(err.message || 'Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  // Gérer les changements de champs
  const handleFieldChange = (field, value) => {
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

  // Validation du formulaire
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Le nom est requis';
    }

    if (!formData.code.trim()) {
      errors.code = 'Le code est requis';
    }

    if (!formData.school_cycle) {
      errors.school_cycle = 'Le cycle scolaire est requis';
    }

    if (!formData.start_date) {
      errors.start_date = 'La date de début est requise';
    }

    if (!formData.end_date) {
      errors.end_date = 'La date de fin est requise';
    }

    if (formData.start_date && formData.end_date && 
        new Date(formData.start_date) >= new Date(formData.end_date)) {
      errors.end_date = 'La date de fin doit être après la date de début';
    }

    if (formData.max_students && formData.max_students <= 0) {
      errors.max_students = 'Le nombre maximum d\'étudiants doit être positif';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const dataToSubmit = {
        ...formData,
        max_students: formData.max_students ? parseInt(formData.max_students) : null
      };

      await updateBatch(id, dataToSubmit);
      navigate(`/batches/${id}`);
    } catch (err) {
      console.error('Erreur lors de la modification:', err);
      setError(err.message || 'Erreur lors de la modification de la promotion');
    } finally {
      setSubmitting(false);
    }
  };

  // Retour à la liste
  const handleCancel = () => {
    navigate('/batches');
  };

  // Interface de chargement
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Box mb={3}>
            <Skeleton variant="text" width={300} height={40} />
          </Box>
          <Grid container spacing={3}>
            {[...Array(6)].map((_, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Skeleton variant="rectangular" height={56} />
              </Grid>
            ))}
          </Grid>
          <Box mt={3} display="flex" gap={2}>
            <Skeleton variant="rectangular" width={120} height={40} />
            <Skeleton variant="rectangular" width={120} height={40} />
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardHeader
          avatar={
            <IconButton onClick={handleCancel}>
              <ArrowBack />
            </IconButton>
          }
          title={
            <Typography variant="h5" component="h1">
              Modifier la promotion
            </Typography>
          }
          subheader={`ID: ${id}`}
        />

        <Divider />

        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Informations générales */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <School /> Informations générales
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nom de la promotion"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  error={!!validationErrors.name}
                  helperText={validationErrors.name}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Code *"
                  value={formData.code}
                  onChange={(e) => handleFieldChange('code', e.target.value)}
                  error={!!validationErrors.code}
                  helperText={validationErrors.code}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!validationErrors.school_cycle}>
                  <InputLabel>Cycle scolaire *</InputLabel>
                  <Select
                    value={formData.school_cycle}
                    onChange={(e) => handleFieldChange('school_cycle', e.target.value)}
                    label="Cycle scolaire *"
                  >
                    {schoolCycles.map((cycle) => (
                      <MenuItem key={cycle.id} value={cycle.id}>
                        {cycle.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {validationErrors.school_cycle && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                      {validationErrors.school_cycle}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  InputProps={{
                    startAdornment: <Description sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
              </Grid>

              {/* Dates */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DateRange /> Dates
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date de début"
                  value={formData.start_date}
                  onChange={(e) => handleFieldChange('start_date', e.target.value)}
                  error={!!validationErrors.start_date}
                  helperText={validationErrors.start_date}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date de fin"
                  value={formData.end_date}
                  onChange={(e) => handleFieldChange('end_date', e.target.value)}
                  error={!!validationErrors.end_date}
                  helperText={validationErrors.end_date}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              {/* Configuration */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <People /> Configuration
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Nombre maximum d'étudiants"
                  value={formData.max_students}
                  onChange={(e) => handleFieldChange('max_students', e.target.value)}
                  error={!!validationErrors.max_students}
                  helperText={validationErrors.max_students}
                  inputProps={{ min: 1 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Statut</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => handleFieldChange('status', e.target.value)}
                    label="Statut"
                  >
                    <MenuItem value="draft">Brouillon</MenuItem>
                    <MenuItem value="in_progress">En cours</MenuItem>
                    <MenuItem value="completed">Terminé</MenuItem>
                    <MenuItem value="cancelled">Annulé</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.active}
                      onChange={(e) => handleFieldChange('active', e.target.checked)}
                    />
                  }
                  label="Promotion active"
                />
              </Grid>
            </Grid>

            {/* Actions */}
            <Box mt={4} display="flex" gap={2} justifyContent="flex-end">
              <Button
                onClick={handleCancel}
                disabled={submitting}
                startIcon={<Cancel />}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={20} /> : <Save />}
              >
                {submitting ? 'Modification...' : 'Modifier'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BatchEdit;
