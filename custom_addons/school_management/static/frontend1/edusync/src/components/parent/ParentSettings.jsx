import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock as LockIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { parentAPI } from './ParentAPI';

const ParentSettings = ({ parentInfo }) => {
  const darkBlue = '#00008B';
  
  const [passwordForm, setPasswordForm] = useState({
    new_password: '',
    confirm_password: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handlePasswordChange = (field) => (event) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    // Effacer les messages d'erreur lors de la saisie
    if (message.type === 'error') {
      setMessage({ type: '', text: '' });
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Validation côté client
    if (!passwordForm.new_password || !passwordForm.confirm_password) {
      setMessage({
        type: 'error',
        text: 'Veuillez remplir tous les champs'
      });
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setMessage({
        type: 'error',
        text: 'Les nouveaux mots de passe ne correspondent pas'
      });
      return;
    }

    if (passwordForm.new_password.length < 6) {
      setMessage({
        type: 'error',
        text: 'Le mot de passe doit contenir au moins 6 caractères'
      });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await parentAPI.changePassword({
        new_password: passwordForm.new_password,
        confirm_password: passwordForm.confirm_password
      });

      if (response.status === 'success') {
        setMessage({
          type: 'success',
          text: 'Mot de passe modifié avec succès !'
        });
        // Réinitialiser le formulaire
        setPasswordForm({
          new_password: '',
          confirm_password: ''
        });
        setShowPasswords({ new: false, confirm: false });
      } else {
        setMessage({
          type: 'error',
          text: response.message || 'Erreur lors du changement de mot de passe'
        });
      }
    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      setMessage({
        type: 'error',
        text: 'Erreur de connexion. Veuillez réessayer.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, color: darkBlue, fontWeight: 'bold' }}>
        Paramètres du compte
      </Typography>

      {/* Informations du parent */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, color: darkBlue }}>
            Informations personnelles
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nom"
                value={parentInfo?.name || ''}
                disabled
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                value={parentInfo?.email || ''}
                disabled
                variant="outlined"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Changement de mot de passe */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <LockIcon sx={{ mr: 1, color: darkBlue }} />
            <Typography variant="h6" sx={{ color: darkBlue }}>
              Changer le mot de passe
            </Typography>
          </Box>
          
          <Divider sx={{ mb: 3 }} />

          {message.text && (
            <Alert severity={message.type} sx={{ mb: 2 }}>
              {message.text}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nouveau mot de passe"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordForm.new_password}
                  onChange={handlePasswordChange('new_password')}
                  variant="outlined"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility('new')}
                          edge="end"
                        >
                          {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  helperText="Minimum 6 caractères"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Confirmer le nouveau mot de passe"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordForm.confirm_password}
                  onChange={handlePasswordChange('confirm_password')}
                  variant="outlined"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility('confirm')}
                          edge="end"
                        >
                          {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                    sx={{
                      backgroundColor: darkBlue,
                      '&:hover': { backgroundColor: '#000080' }
                    }}
                  >
                    {loading ? 'Modification...' : 'Modifier le mot de passe'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ParentSettings; 