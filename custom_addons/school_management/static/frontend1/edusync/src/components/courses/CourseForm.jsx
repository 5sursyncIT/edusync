import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import odooApi from '../../services/odooApi.jsx';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Snackbar,
  Container,
  Card,
  CardContent,
  Divider,
  Stack,
  Fade,
  Chip
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Book as BookIcon,
  Code as CodeIcon,
  Description as DescriptionIcon,
  Category as CategoryIcon
} from '@mui/icons-material';

const CourseForm = ({ mode = 'create' }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = mode === 'edit' || !!id;

  // États pour le formulaire
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    education_level: '',
    school_year: '',
    subject_area: '',
    active: true
  });

  // États pour la gestion
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [validation, setValidation] = useState({});

  // Charger les données du cours si en mode édition
  useEffect(() => {
    if (isEdit && id) {
      fetchCourseData();
    }
  }, [isEdit, id]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await odooApi.getCourse(id);
      
      if (response && response.data) {
        setFormData({
          name: response.data.name || '',
          code: response.data.code || '',
          description: response.data.description || '',
          education_level: response.data.education_level || '',
          school_year: response.data.school_year || '',
          subject_area: response.data.subject_area || '',
          active: response.data.active !== false
        });
      } else {
        setError('Erreur lors du chargement des données du cours');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du cours:', error);
      setError(`Erreur lors du chargement: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Validation du formulaire
  const validateForm = () => {
    const newValidation = {};
    
    if (!formData.name?.trim()) {
      newValidation.name = 'Le nom du cours est obligatoire';
    }
    
    if (!formData.code?.trim()) {
      newValidation.code = 'Le code du cours est obligatoire';
    } else if (formData.code.length < 2) {
      newValidation.code = 'Le code doit contenir au moins 2 caractères';
    }
    
    setValidation(newValidation);
    return Object.keys(newValidation).length === 0;
  };

  // Gestionnaire de changement des champs
  const handleFieldChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Effacer l'erreur de validation pour ce champ
    if (validation[field]) {
      setValidation(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // Gestionnaire de soumission
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      setError('Veuillez corriger les erreurs dans le formulaire');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      const dataToSend = { ...formData };
      
      if (isEdit) {
        await odooApi.updateCourse(id, dataToSend);
        setSuccessMessage('Cours mis à jour avec succès');
      } else {
        await odooApi.createCourse(dataToSend);
        setSuccessMessage('Cours créé avec succès');
      }
      
      // Rediriger après un délai
      setTimeout(() => {
        navigate('/courses');
      }, 1500);
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setError(`Erreur lors de la sauvegarde: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Gestionnaire d'annulation
  const handleCancel = () => {
    navigate('/courses');
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccessMessage('');
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={40} />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Fade in={true} timeout={600}>
        <Box>
          {/* En-tête */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 4,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            p: 3,
            borderRadius: 2,
            boxShadow: 3
          }}>
            <BookIcon sx={{ fontSize: 40, mr: 2 }} />
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold">
                {isEdit ? 'Modifier le Cours' : 'Nouveau Cours'}
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                {isEdit ? 'Modifiez les informations du cours' : 'Créez un nouveau cours dans le système'}
              </Typography>
            </Box>
          </Box>

          {/* Formulaire */}
          <Card sx={{ boxShadow: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  {/* Informations de base */}
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', display: 'flex', alignItems: 'center' }}>
                      <BookIcon sx={{ mr: 1 }} />
                      Informations de Base
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                  </Grid>

                  {/* Nom du cours */}
                  <Grid item xs={12} md={8}>
                    <TextField
                      fullWidth
                      label="Nom du Cours"
                      value={formData.name}
                      onChange={handleFieldChange('name')}
                      error={!!validation.name}
                      helperText={validation.name}
                      required
                      variant="outlined"
                      placeholder="Ex: Mathématiques Avancées"
                      InputProps={{
                        startAdornment: <BookIcon sx={{ mr: 1, color: 'action.active' }} />
                      }}
                    />
                  </Grid>

                  {/* Code du cours */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Code du Cours"
                      value={formData.code}
                      onChange={handleFieldChange('code')}
                      error={!!validation.code}
                      helperText={validation.code}
                      required
                      variant="outlined"
                      placeholder="Ex: MATH101"
                      InputProps={{
                        startAdornment: <CodeIcon sx={{ mr: 1, color: 'action.active' }} />
                      }}
                    />
                  </Grid>

                  {/* Description */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={formData.description}
                      onChange={handleFieldChange('description')}
                      multiline
                      rows={3}
                      variant="outlined"
                      placeholder="Description détaillée du cours, objectifs, contenu..."
                      InputProps={{
                        startAdornment: <DescriptionIcon sx={{ mr: 1, color: 'action.active', alignSelf: 'flex-start', mt: 1 }} />
                      }}
                    />
                  </Grid>

                  {/* Détails académiques */}
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2, mt: 2, color: 'primary.main', display: 'flex', alignItems: 'center' }}>
                      <CategoryIcon sx={{ mr: 1 }} />
                      Détails Académiques
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                  </Grid>

                  {/* Niveau d'éducation */}
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Niveau d'Éducation</InputLabel>
                      <Select
                        value={formData.education_level}
                        onChange={handleFieldChange('education_level')}
                        label="Niveau d'Éducation"
                      >
                        <MenuItem value="">
                          <em>Non spécifié</em>
                        </MenuItem>
                        <MenuItem value="prescolaire">Préscolaire</MenuItem>
                        <MenuItem value="primaire">Primaire</MenuItem>
                        <MenuItem value="college">Collège</MenuItem>
                        <MenuItem value="lycee">Lycée</MenuItem>
                        <MenuItem value="university">Université</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Année scolaire */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Année Scolaire"
                      value={formData.school_year}
                      onChange={handleFieldChange('school_year')}
                      variant="outlined"
                      placeholder="Ex: 2023-2024"
                    />
                  </Grid>

                  {/* Domaine de matière */}
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Domaine de Matière</InputLabel>
                      <Select
                        value={formData.subject_area}
                        onChange={handleFieldChange('subject_area')}
                        label="Domaine de Matière"
                      >
                        <MenuItem value="">
                          <em>Non spécifié</em>
                        </MenuItem>
                        <MenuItem value="mathematics">Mathématiques</MenuItem>
                        <MenuItem value="sciences">Sciences</MenuItem>
                        <MenuItem value="languages">Langues</MenuItem>
                        <MenuItem value="humanities">Sciences Humaines</MenuItem>
                        <MenuItem value="arts">Arts</MenuItem>
                        <MenuItem value="sports">Sports</MenuItem>
                        <MenuItem value="technology">Technologie</MenuItem>
                        <MenuItem value="other">Autre</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Statut */}
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mb: 2, mt: 2, color: 'primary.main' }}>
                      Statut
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.active}
                          onChange={handleFieldChange('active')}
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography sx={{ mr: 1 }}>
                            Cours actif
                          </Typography>
                          <Chip 
                            label={formData.active ? 'Actif' : 'Inactif'}
                            color={formData.active ? 'success' : 'error'}
                            size="small"
                          />
                        </Box>
                      }
                    />
                  </Grid>

                  {/* Boutons d'action */}
                  <Grid item xs={12}>
                    <Divider sx={{ my: 3 }} />
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                      <Button
                        variant="outlined"
                        onClick={handleCancel}
                        disabled={saving}
                        startIcon={<CancelIcon />}
                        size="large"
                      >
                        Annuler
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                        size="large"
                        sx={{
                          minWidth: 150,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                          }
                        }}
                      >
                        {saving ? 'Sauvegarde...' : (isEdit ? 'Mettre à jour' : 'Créer le cours')}
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Box>
      </Fade>

      {/* Snackbars pour les messages */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CourseForm; 