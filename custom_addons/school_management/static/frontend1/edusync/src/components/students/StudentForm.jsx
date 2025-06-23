import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import odooApi from '../../services/odooApi.jsx';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Autocomplete
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

const StudentForm = ({ mode = 'create' }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // États pour les données de référence
  const [batches, setBatches] = useState([]);
  const [schoolCycles, setSchoolCycles] = useState([]);
  const [loadingReference, setLoadingReference] = useState(true);
  
  // État pour les données du formulaire - CHAMPS SUPPORTÉS PAR LE BACKEND
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone: '',
    mobile: '',
    gender: 'm',
    birth_date: '',
    blood_group: '',
    nationality: '',
    id_number: '',
    visa_info: '',
    gr_no: '',
    street: '',
    city: '',
    zip: '',
    school_level: '',
    is_scholarship: false,
    scholarship_type: '',
    transport_needed: false,
    school_insurance: false,
    school_cycle: '',
    batch_id: '',
    active: true
  });
  
  // État pour les erreurs de validation
  const [validationErrors, setValidationErrors] = useState({});

  // Charger les données de référence au montage
  useEffect(() => {
    loadReferenceData();
    
    // Si on est en mode édition, charger les données de l'étudiant
    if (mode === 'edit' && id) {
      loadStudentData(id);
    }
  }, [mode, id]);

  // Charger les données de référence (promotions)
  const loadReferenceData = async () => {
    try {
      setLoadingReference(true);
      console.log('🔍 Début du chargement des données de référence...');
      
      // Récupérer toutes les promotions
      const batchesData = await odooApi.getBatches(1, 1000);
      
      console.log('📋 Réponse brute de l\'API:', batchesData);
      console.log('📋 Type de la réponse:', typeof batchesData);
      console.log('📋 Clés de la réponse:', Object.keys(batchesData || {}));
      
      // CORRECTION: Utiliser la bonne structure de données
      let batchesArray = [];
      if (batchesData && typeof batchesData === 'object') {
        if (batchesData.data && Array.isArray(batchesData.data.batches)) {
          // Structure: { status: "success", data: { batches: [...] } }
          batchesArray = batchesData.data.batches;
          console.log('📋 Structure détectée: data.batches');
        } else if (Array.isArray(batchesData.batches)) {
          // Structure: { batches: [...] }
          batchesArray = batchesData.batches;
          console.log('📋 Structure détectée: batches directement');
        } else if (Array.isArray(batchesData)) {
          // Structure: [...]
          batchesArray = batchesData;
          console.log('📋 Structure détectée: array direct');
        }
      }
      
      console.log('📋 Batches array:', batchesArray);
      console.log('📋 Nombre de batches:', batchesArray.length);
      
      setBatches(batchesArray);
      
      // Extraire les cycles scolaires uniques des promotions
      const allCycles = batchesArray.map(batch => {
        console.log('🔄 Batch:', batch.name, 'Cycle:', batch.school_cycle);
        return batch.school_cycle;
      });
      
      console.log('📝 Tous les cycles bruts:', allCycles);
      
      const filteredCycles = allCycles.filter(cycle => cycle && cycle.trim() !== '');
      console.log('📝 Cycles filtrés:', filteredCycles);
      
      const uniqueSchoolCycles = [...new Set(filteredCycles)].sort();
      console.log('📝 Cycles uniques:', uniqueSchoolCycles);
      
      setSchoolCycles(uniqueSchoolCycles);
      
      console.log('✅ État final:', {
        batches: batchesArray.length,
        schoolCycles: uniqueSchoolCycles.length,
        cyclesDetails: uniqueSchoolCycles
      });
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données de référence:', error);
      console.error('❌ Stack trace:', error.stack);
      setBatches([]);
      setSchoolCycles([]);
    } finally {
      setLoadingReference(false);
    }
  };

  // Charger les données d'un étudiant existant
  const loadStudentData = async (studentId) => {
    try {
      setLoading(true);
      const student = await odooApi.getStudent(studentId);
      
      // Mettre à jour le formulaire avec les données de l'étudiant
      setFormData({
        first_name: student.first_name || '',
        middle_name: student.middle_name || '',
        last_name: student.last_name || '',
        email: student.email || '',
        phone: student.phone || '',
        mobile: student.mobile || '',
        gender: student.gender || 'm',
        birth_date: student.birth_date || '',
        blood_group: student.blood_group || '',
        nationality: student.nationality || '',
        id_number: student.id_number || '',
        visa_info: student.visa_info || '',
        gr_no: student.gr_no || '',
        street: student.street || '',
        city: student.city || '',
        zip: student.zip || '',
        school_level: student.school_level || '',
        is_scholarship: student.is_scholarship || false,
        scholarship_type: student.scholarship_type || '',
        transport_needed: student.transport_needed || false,
        school_insurance: student.school_insurance || false,
        school_cycle: student.batch?.school_cycle || '',
        batch_id: student.batch ? student.batch.id : '',
        active: student.active !== false
      });
    } catch (error) {
      console.error('Erreur lors du chargement de l\'étudiant:', error);
      setError('Impossible de charger les données de l\'étudiant');
    } finally {
      setLoading(false);
    }
  };

  // Gérer les changements dans le formulaire
  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Si on change le cycle scolaire, réinitialiser la promotion
    if (field === 'school_cycle') {
      setFormData(prev => ({
        ...prev,
        [field]: value,
        batch_id: '' // Réinitialiser la promotion
      }));
    }
    
    // Effacer l'erreur de validation pour ce champ
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Filtrer les promotions en fonction du cycle scolaire sélectionné
  const getFilteredBatches = () => {
    if (!formData.school_cycle || !Array.isArray(batches)) return batches;
    
    // Filtrer les promotions par school_cycle
    return batches.filter(batch => batch.school_cycle === formData.school_cycle);
  };

  // Valider le formulaire
  const validateForm = () => {
    const errors = {};
    
    // Nom obligatoire
    if (!formData.first_name.trim()) {
      errors.first_name = 'Le prénom est obligatoire';
    }
    
    // Email valide si fourni
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email invalide';
    }
    
    // Date de naissance valide si fournie
    if (formData.birth_date) {
      const birthDate = new Date(formData.birth_date);
      const today = new Date();
      if (birthDate > today) {
        errors.birth_date = 'La date de naissance ne peut pas être dans le futur';
      }
    }
    
    // Si un cycle scolaire est sélectionné, vérifier que la promotion correspond
    if (formData.school_cycle && formData.batch_id) {
      const selectedBatch = batches.find(b => b.id === parseInt(formData.batch_id));
      if (selectedBatch && selectedBatch.school_cycle !== formData.school_cycle) {
        errors.batch_id = 'Cette promotion ne correspond pas au cycle scolaire sélectionné';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Sauvegarder le formulaire
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Valider le formulaire
    if (!validateForm()) {
      setError('Veuillez corriger les erreurs dans le formulaire');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      // Préparer les données à envoyer
      const dataToSend = { ...formData };
      
      // Convertir les IDs en entiers si présents
      if (dataToSend.batch_id) {
        dataToSend.batch_id = parseInt(dataToSend.batch_id);
      }
      
      // Supprimer les champs vides pour éviter les erreurs
      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] === '' || dataToSend[key] === null) {
          delete dataToSend[key];
        }
      });
      
      console.log('📤 Données envoyées:', dataToSend);
      
      let response;
      if (mode === 'create') {
        response = await odooApi.createStudent(dataToSend);
        setSuccessMessage('Étudiant créé avec succès');
      } else {
        response = await odooApi.updateStudent(id, dataToSend);
        setSuccessMessage('Étudiant mis à jour avec succès');
      }
      
      console.log('✅ Réponse serveur:', response);
      
      // Rediriger vers la liste après un délai
      setTimeout(() => {
        navigate('/students');
      }, 1500);
      
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      setError(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // Annuler et retourner à la liste
  const handleCancel = () => {
    navigate('/students');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Section debug - SUPPRIMÉE */}

      <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
        {/* En-tête simple */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleCancel} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" fontWeight="bold">
            {mode === 'create' ? 'Nouvel Étudiant' : 'Modifier l\'Étudiant'}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {successMessage}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Informations personnelles */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary.main" fontWeight="bold">
                Informations personnelles
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Prénom"
                value={formData.first_name}
                onChange={handleChange('first_name')}
                error={!!validationErrors.first_name}
                helperText={validationErrors.first_name}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Deuxième prénom"
                value={formData.middle_name}
                onChange={handleChange('middle_name')}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Nom de famille"
                value={formData.last_name}
                onChange={handleChange('last_name')}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Genre</InputLabel>
                <Select
                  value={formData.gender}
                  onChange={handleChange('gender')}
                  label="Genre"
                >
                  <MenuItem value="m">Masculin</MenuItem>
                  <MenuItem value="f">Féminin</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Date de naissance"
                type="date"
                value={formData.birth_date}
                onChange={handleChange('birth_date')}
                error={!!validationErrors.birth_date}
                helperText={validationErrors.birth_date}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Numéro GR"
                value={formData.gr_no}
                onChange={handleChange('gr_no')}
                helperText="Numéro d'enregistrement général"
              />
            </Grid>

            {/* Contact */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }} color="success.main" fontWeight="bold">
                Informations de contact
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                error={!!validationErrors.email}
                helperText={validationErrors.email}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Téléphone"
                value={formData.phone}
                onChange={handleChange('phone')}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Mobile"
                value={formData.mobile}
                onChange={handleChange('mobile')}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Groupe sanguin</InputLabel>
                <Select
                  value={formData.blood_group}
                  onChange={handleChange('blood_group')}
                  label="Groupe sanguin"
                >
                  <MenuItem value="">Non spécifié</MenuItem>
                  <MenuItem value="A+">A+</MenuItem>
                  <MenuItem value="A-">A-</MenuItem>
                  <MenuItem value="B+">B+</MenuItem>
                  <MenuItem value="B-">B-</MenuItem>
                  <MenuItem value="AB+">AB+</MenuItem>
                  <MenuItem value="AB-">AB-</MenuItem>
                  <MenuItem value="O+">O+</MenuItem>
                  <MenuItem value="O-">O-</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Nationalité"
                value={formData.nationality}
                onChange={handleChange('nationality')}
                placeholder="Ex: Française"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Numéro de carte d'identité"
                value={formData.id_number}
                onChange={handleChange('id_number')}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Informations visa"
                value={formData.visa_info}
                onChange={handleChange('visa_info')}
                placeholder="Si applicable"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Code postal"
                value={formData.zip}
                onChange={handleChange('zip')}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Adresse"
                value={formData.street}
                onChange={handleChange('street')}
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ville"
                value={formData.city}
                onChange={handleChange('city')}
              />
            </Grid>

            {/* Informations académiques */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }} color="primary.main" fontWeight="bold">
                Informations académiques
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={loadingReference}>
                <InputLabel>Cycle scolaire</InputLabel>
                <Select
                  value={formData.school_cycle}
                  onChange={handleChange('school_cycle')}
                  label="Cycle scolaire"
                >
                  <MenuItem value="">Non spécifié</MenuItem>
                  {Array.isArray(schoolCycles) && schoolCycles.map((cycle) => {
                    // Traduire les cycles en français
                    const cycleLabels = {
                      'primaire': 'École Primaire',
                      'college': 'Collège',
                      'lycee': 'Lycée'
                    };
                    return (
                    <MenuItem key={cycle} value={cycle}>
                        {cycleLabels[cycle] || cycle}
                    </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={loadingReference || !formData.school_cycle}>
                <InputLabel>Promotion</InputLabel>
                <Select
                  value={formData.batch_id}
                  onChange={handleChange('batch_id')}
                  label="Promotion"
                  error={!!validationErrors.batch_id}
                >
                  <MenuItem value="">Aucune promotion</MenuItem>
                  {Array.isArray(getFilteredBatches()) && getFilteredBatches().map((batch) => (
                    <MenuItem key={batch.id} value={batch.id}>
                      {batch.name} {batch.code ? `(${batch.code})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {validationErrors.batch_id && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                  {validationErrors.batch_id}
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Niveau scolaire</InputLabel>
                <Select
                  value={formData.school_level}
                  onChange={handleChange('school_level')}
                  label="Niveau scolaire"
                >
                  <MenuItem value="">Non spécifié</MenuItem>
                  <MenuItem value="primaire">Primaire</MenuItem>
                  <MenuItem value="college">Collège</MenuItem>
                  <MenuItem value="lycee">Lycée</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Boursier</InputLabel>
                <Select
                  value={formData.is_scholarship}
                  onChange={handleChange('is_scholarship')}
                  label="Boursier"
                >
                  <MenuItem value={false}>Non</MenuItem>
                  <MenuItem value={true}>Oui</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.is_scholarship && (
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Type de bourse</InputLabel>
                  <Select
                    value={formData.scholarship_type}
                    onChange={handleChange('scholarship_type')}
                    label="Type de bourse"
                  >
                    <MenuItem value="">Sélectionner</MenuItem>
                    <MenuItem value="full">Complète</MenuItem>
                    <MenuItem value="partial">Partielle</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Transport scolaire</InputLabel>
                <Select
                  value={formData.transport_needed}
                  onChange={handleChange('transport_needed')}
                  label="Transport scolaire"
                >
                  <MenuItem value={false}>Non</MenuItem>
                  <MenuItem value={true}>Oui</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Assurance scolaire</InputLabel>
                <Select
                  value={formData.school_insurance}
                  onChange={handleChange('school_insurance')}
                  label="Assurance scolaire"
                >
                  <MenuItem value={false}>Non</MenuItem>
                  <MenuItem value={true}>Oui</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Note d'information */}
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Note :</strong> Ce formulaire permet de créer un étudiant avec ses informations de base 
                  et de l'assigner à un cycle scolaire et une promotion. L'étudiant sera automatiquement lié à la 
                  promotion sélectionnée lors de la création.
                </Typography>
              </Alert>
            </Grid>

            {/* Boutons d'action */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  startIcon={<CancelIcon />}
                  disabled={saving}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={saving}
                >
                  {saving ? 'Enregistrement...' : (mode === 'create' ? 'Créer' : 'Mettre à jour')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default StudentForm;