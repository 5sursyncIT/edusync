import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Paper,
  Grid,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Divider,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { Save, X } from 'lucide-react';
import { admissionsAPI } from '../services/admissionsAPI';

// Composant formulaire d'admission
const AdmissionForm = ({ admission, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone: '',
    mobile: '',
    gender: '',
    birth_date: '',
    course_id: '',
    batch_id: '',
    street: '',
    city: '',
    zip: '',
    nationality: '',
    country: '',
    prev_institute_id: '',
    fees: 0
  });
  const [formOptions, setFormOptions] = useState({ courses: [], batches: [], countries: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fonction pour nettoyer les données d'admission
  const cleanAdmissionData = (admission) => {
    if (!admission) return {};
    
    return {
      first_name: admission.first_name || '',
      middle_name: admission.middle_name || '',
      last_name: admission.last_name || '',
      email: admission.email || '',
      phone: admission.phone || '',
      mobile: admission.mobile || '',
      gender: admission.gender || '',
      birth_date: admission.birth_date || '',
      course_id: admission.course_id || '',
      batch_id: admission.batch_id || '',
      street: admission.street || '',
      city: admission.city || '',
      zip: admission.zip || '',
      nationality: admission.nationality || '',
      country: admission.country || '',
      prev_institute_id: admission.prev_institute_id || '',
      fees: admission.fees || 0
    };
  };

  useEffect(() => {
    if (admission) {
      setFormData(cleanAdmissionData(admission));
    }
  }, [admission]);

  useEffect(() => {
    console.log('🔄 Chargement des options du formulaire...');
    loadFormOptions();
  }, []);

  const loadFormOptions = async () => {
    try {
      console.log('🔄 Chargement des options du formulaire...');
      const response = await admissionsAPI.getFormOptions();
      console.log('📥 Réponse reçue:', response);
      
      if (response.status === 'success' && response.data) {
        console.log('✅ Options chargées avec succès:', response.data);
        const { courses = [], batches = [], genders = [], countries = [] } = response.data;
        
        setFormOptions({
          courses: courses.map(c => ({ id: c.id, name: c.name, code: c.code })),
          batches: batches.map(b => ({ 
            id: b.id, 
            name: b.name, 
            code: b.code,
            course_id: b.course_id && b.course_id[0]
          })),
          genders: genders.map(g => ({ id: g.id, name: g.name })),
          countries: countries.map(c => ({ id: c.id, name: c.name, code: c.code }))
        });
      } else {
        console.error('❌ Réponse invalide:', response);
        setError('Format de réponse invalide');
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des options:', error);
      setError(`Erreur lors du chargement des options du formulaire: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      let response;
      if (admission?.id) {
        response = await admissionsAPI.updateAdmission(admission.id, formData);
      } else {
        response = await admissionsAPI.createAdmission(formData);
      }
      
      if (response.status === 'success') {
        setSuccess(response.message || 'Admission sauvegardée avec succès');
        setTimeout(() => onSave(), 1500);
      } else {
        setError(response.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: '900px', mx: 'auto' }}>
      <Stack spacing={4}>
        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Informations personnelles */}
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            borderRadius: 2,
            border: '1px solid #e3f2fd'
          }}
        >
          <Typography 
            variant="h6" 
            color="primary" 
            fontWeight="bold" 
            sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            Informations personnelles
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                required
                fullWidth
                label="Prénom"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
                variant="outlined"
                size="medium"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Deuxième prénom"
                value={formData.middle_name}
                onChange={(e) => handleChange('middle_name', e.target.value)}
                variant="outlined"
                size="medium"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                required
                fullWidth
                label="Nom de famille"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                variant="outlined"
                size="medium"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                type="email"
                label="Email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                variant="outlined"
                size="medium"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Téléphone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                variant="outlined"
                size="medium"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Mobile"
                value={formData.mobile}
                onChange={(e) => handleChange('mobile', e.target.value)}
                variant="outlined"
                size="medium"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Genre</InputLabel>
                <Select
                  value={formData.gender || ''}
                  label="Genre"
                  onChange={(e) => handleChange('gender', e.target.value)}
                >
                  <MenuItem value="">Sélectionner</MenuItem>
                  <MenuItem value="m">Masculin</MenuItem>
                  <MenuItem value="f">Féminin</MenuItem>
                  <MenuItem value="o">Autre</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                required
                fullWidth
                type="date"
                label="Date de naissance"
                value={formData.birth_date}
                onChange={(e) => handleChange('birth_date', e.target.value)}
                variant="outlined"
                size="medium"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Informations académiques */}
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            borderRadius: 2,
            border: '1px solid #e3f2fd'
          }}
        >
          <Typography 
            variant="h6" 
            color="primary" 
            fontWeight="bold" 
            sx={{ mb: 3 }}
          >
            Informations académiques
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Cours</InputLabel>
                <Select
                  value={formData.course_id || ''}
                  label="Cours"
                  onChange={(e) => handleChange('course_id', e.target.value)}
                >
                  <MenuItem value="">Sélectionner un cours</MenuItem>
                  {formOptions.courses && formOptions.courses.map(course => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Promotion</InputLabel>
                <Select
                  value={formData.batch_id || ''}
                  label="Promotion"
                  onChange={(e) => handleChange('batch_id', e.target.value)}
                >
                  <MenuItem value="">Sélectionner une promotion</MenuItem>
                  {formOptions.batches && formOptions.batches
                    .filter(batch => !formData.course_id || batch.course_id[0] === formData.course_id)
                    .map(batch => (
                      <MenuItem key={batch.id} value={batch.id}>
                        {batch.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Établissement précédent"
                value={formData.prev_institute_id}
                onChange={(e) => handleChange('prev_institute_id', e.target.value)}
                variant="outlined"
                size="medium"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Frais d'admission"
                value={formData.fees}
                onChange={(e) => handleChange('fees', parseFloat(e.target.value) || 0)}
                variant="outlined"
                size="medium"
                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Adresse */}
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            borderRadius: 2,
            border: '1px solid #e3f2fd'
          }}
        >
          <Typography 
            variant="h6" 
            color="primary" 
            fontWeight="bold" 
            sx={{ mb: 3 }}
          >
            Adresse
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Rue"
                value={formData.street}
                onChange={(e) => handleChange('street', e.target.value)}
                variant="outlined"
                size="medium"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Ville"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                variant="outlined"
                size="medium"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Code postal"
                value={formData.zip}
                onChange={(e) => handleChange('zip', e.target.value)}
                variant="outlined"
                size="medium"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Pays</InputLabel>
                <Select
                  value={formData.country || ''}
                  label="Pays"
                  onChange={(e) => handleChange('country', e.target.value)}
                >
                  <MenuItem value="">Sélectionner</MenuItem>
                  {formOptions.countries.map(country => (
                    <MenuItem key={country.id} value={country.name}>
                      {country.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Boutons */}
        <Box sx={{ pt: 2 }}>
          <Divider sx={{ mb: 3 }} />
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={saving}
              startIcon={<X />}
              size="large"
              sx={{ 
                px: 4,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold'
              }}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
              size="large"
              sx={{ 
                px: 4,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold',
                bgcolor: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.dark',
                  transform: 'translateY(-1px)',
                  boxShadow: 4
                }
              }}
            >
              {saving ? 'Enregistrement...' : (admission?.id ? 'Modifier' : 'Créer')}
            </Button>
          </Stack>
        </Box>

        {/* Messages */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setError('')} 
            severity="error" 
            sx={{ width: '100%' }}
          >
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!success}
          autoHideDuration={4000}
          onClose={() => setSuccess('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setSuccess('')} 
            severity="success" 
            sx={{ width: '100%' }}
          >
            {success}
          </Alert>
        </Snackbar>
      </Stack>
    </Box>
  );
};

export default AdmissionForm; 