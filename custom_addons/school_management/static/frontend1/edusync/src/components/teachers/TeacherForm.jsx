// src/components/teachers/TeacherForm.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, FormControlLabel, Switch,
  Alert, CircularProgress, Grid, FormControl, InputLabel,
  Select, MenuItem, FormLabel, RadioGroup, Radio
} from '@mui/material';
import { Save, Cancel } from '@mui/icons-material';
import { Typography } from '@mui/material';

const TeacherForm = ({ open, onClose, onSubmit, teacher }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone: '',
    mobile: '',
    gender: '',
    blood_group: '',
    birth_date: '',
    joining_date: '',
    nationality: '',
    id_number: '',
    visa_info: '',
    main_department_id: '',
    faculty_subject_ids: [],
    street: '',
    city: '',
    zip: '',
    active: true
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Initialiser le formulaire avec les données de l'enseignant
  useEffect(() => {
    if (teacher) {
      setFormData({
        first_name: teacher.first_name || '',
        middle_name: teacher.middle_name || '',
        last_name: teacher.last_name || '',
        email: teacher.email || '',
        phone: teacher.phone || '',
        mobile: teacher.mobile || '',
        gender: teacher.gender || '',
        blood_group: teacher.blood_group || '',
        birth_date: teacher.birth_date || '',
        joining_date: teacher.joining_date || '',
        nationality: teacher.nationality || '',
        id_number: teacher.id_number || '',
        visa_info: teacher.visa_info || '',
        main_department_id: teacher.department?.id || '',
        faculty_subject_ids: teacher.faculty_subject_ids || [],
        street: teacher.street || '',
        city: teacher.city || '',
        zip: teacher.zip || '',
        active: teacher.active !== undefined ? teacher.active : true
      });
    } else {
      // Réinitialiser pour un nouvel enseignant
      setFormData({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        phone: '',
        mobile: '',
        gender: '',
        blood_group: '',
        birth_date: '',
        joining_date: '',
        nationality: '',
        id_number: '',
        visa_info: '',
        main_department_id: '',
        faculty_subject_ids: [],
        street: '',
        city: '',
        zip: '',
        active: true
      });
    }
    setErrors({});
    setSubmitError('');
  }, [teacher, open]);

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

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'Le prénom est obligatoire';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Le nom est obligatoire';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est obligatoire';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (formData.phone && !/^[\d\s\-+()\x20]+$/.test(formData.phone)) {
      newErrors.phone = 'Format de téléphone invalide';
    }

    if (formData.mobile && !/^[\d\s\-+()\x20]+$/.test(formData.mobile)) {
      newErrors.mobile = 'Format de mobile invalide';
    }

    if (formData.birth_date && new Date(formData.birth_date) > new Date()) {
      newErrors.birth_date = 'La date de naissance ne peut pas être dans le futur';
    }

    if (formData.joining_date && new Date(formData.joining_date) > new Date()) {
      newErrors.joining_date = 'La date d\'embauche ne peut pas être dans le futur';
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
      // Construire le nom complet requis par le backend
      const nameParts = [];
      if (formData.first_name?.trim()) {
        nameParts.push(formData.first_name.trim());
      }
      if (formData.middle_name?.trim()) {
        nameParts.push(formData.middle_name.trim());
      }
      if (formData.last_name?.trim()) {
        nameParts.push(formData.last_name.trim());
      }
      const fullName = nameParts.join(' ');

      // Préparer les données à envoyer
      const dataToSubmit = {
        // Champ name obligatoire pour le backend
        name: fullName,
        // Champs individuels
        first_name: formData.first_name.trim(),
        middle_name: formData.middle_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        mobile: formData.mobile.trim(),
        gender: formData.gender,
        blood_group: formData.blood_group,
        birth_date: formData.birth_date || null,
        joining_date: formData.joining_date || null,
        nationality: formData.nationality,
        id_number: formData.id_number.trim(),
        visa_info: formData.visa_info.trim(),
        main_department_id: formData.main_department_id || null,
        faculty_subject_ids: formData.faculty_subject_ids,
        street: formData.street.trim(),
        city: formData.city.trim(),
        zip: formData.zip.trim(),
        active: formData.active
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
        {teacher ? 'Modifier l\'enseignant' : 'Nouvel enseignant'}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}
          
          <Grid container spacing={2}>
            {/* Informations personnelles */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Informations personnelles
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Prénom"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                error={!!errors.first_name}
                helperText={errors.first_name}
                required
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nom"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                error={!!errors.last_name}
                helperText={errors.last_name}
                required
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nom du milieu"
                name="middle_name"
                value={formData.middle_name}
                onChange={handleChange}
                disabled={loading}
                placeholder="Optionnel"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                required
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Genre</FormLabel>
                <RadioGroup
                  row
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <FormControlLabel value="male" control={<Radio />} label="Homme" />
                  <FormControlLabel value="female" control={<Radio />} label="Femme" />
                </RadioGroup>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={loading}>
                <InputLabel>Groupe sanguin</InputLabel>
                <Select
                  name="blood_group"
                  value={formData.blood_group}
                  onChange={handleChange}
                  label="Groupe sanguin"
                >
                  <MenuItem value="">Aucun</MenuItem>
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

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={loading}>
                <InputLabel>Nationalité</InputLabel>
                <Select
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  label="Nationalité"
                >
                  <MenuItem value="">Aucune</MenuItem>
                  <MenuItem value="Française">Française</MenuItem>
                  <MenuItem value="Sénégalaise">Sénégalaise</MenuItem>
                  <MenuItem value="Marocaine">Marocaine</MenuItem>
                  <MenuItem value="Algérienne">Algérienne</MenuItem>
                  <MenuItem value="Tunisienne">Tunisienne</MenuItem>
                  <MenuItem value="Camerounaise">Camerounaise</MenuItem>
                  <MenuItem value="Ivoirienne">Ivoirienne</MenuItem>
                  <MenuItem value="Malienne">Malienne</MenuItem>
                  <MenuItem value="Burkinabé">Burkinabé</MenuItem>
                  <MenuItem value="Nigérienne">Nigérienne</MenuItem>
                  <MenuItem value="Tchadienne">Tchadienne</MenuItem>
                  <MenuItem value="Gabonaise">Gabonaise</MenuItem>
                  <MenuItem value="Congolaise">Congolaise</MenuItem>
                  <MenuItem value="Béninoise">Béninoise</MenuItem>
                  <MenuItem value="Togolaise">Togolaise</MenuItem>
                  <MenuItem value="Ghanéenne">Ghanéenne</MenuItem>
                  <MenuItem value="Nigériane">Nigériane</MenuItem>
                  <MenuItem value="Mauritanienne">Mauritanienne</MenuItem>
                  <MenuItem value="Guinéenne">Guinéenne</MenuItem>
                  <MenuItem value="Belge">Belge</MenuItem>
                  <MenuItem value="Suisse">Suisse</MenuItem>
                  <MenuItem value="Canadienne">Canadienne</MenuItem>
                  <MenuItem value="Luxembourgeoise">Luxembourgeoise</MenuItem>
                  <MenuItem value="Autre">Autre</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Numéro de carte d'identité"
                name="id_number"
                value={formData.id_number}
                onChange={handleChange}
                disabled={loading}
                placeholder="Ex: 123456789"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Informations visa"
                name="visa_info"
                value={formData.visa_info}
                onChange={handleChange}
                disabled={loading}
                placeholder="Ex: Visa de travail"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Téléphone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                error={!!errors.phone}
                helperText={errors.phone}
                disabled={loading}
                placeholder="Ex: +33 1 23 45 67 89"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mobile"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                error={!!errors.mobile}
                helperText={errors.mobile}
                disabled={loading}
                placeholder="Ex: +33 6 12 34 56 78"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date de naissance"
                name="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={handleChange}
                error={!!errors.birth_date}
                helperText={errors.birth_date}
                disabled={loading}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date d'embauche"
                name="joining_date"
                type="date"
                value={formData.joining_date}
                onChange={handleChange}
                error={!!errors.joining_date}
                helperText={errors.joining_date}
                disabled={loading}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            {/* Adresse */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Adresse
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Rue"
                name="street"
                value={formData.street}
                onChange={handleChange}
                disabled={loading}
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ville"
                name="city"
                value={formData.city}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Code postal"
                name="zip"
                value={formData.zip}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.active}
                    onChange={handleChange}
                    name="active"
                    disabled={loading}
                  />
                }
                label="Enseignant actif"
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, pt: 0 }}>
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
          startIcon={loading ? <CircularProgress size={20} /> : <Save />}
        >
          {loading ? 'Enregistrement...' : (teacher ? 'Modifier' : 'Créer')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TeacherForm;