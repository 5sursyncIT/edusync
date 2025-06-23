import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Fade,
  Stack,
  Alert,
  Chip,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  InputAdornment,
  Snackbar
} from '@mui/material';
import { 
  School as SchoolIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  MenuBook as BookIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Send as SendIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';

// Configuration de l'API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://172.16.209.128:8069';

// Service API pour les admissions publiques
const publicAdmissionsAPI = {
  // Soumettre une demande d'admission
  submitAdmission: async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/admissions/public/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const textResponse = await response.text();
    console.log('📥 Réponse brute:', textResponse);
    
    try {
      const jsonResponse = JSON.parse(textResponse);
      console.log('📦 Réponse parsée:', jsonResponse);
      return jsonResponse;
    } catch (error) {
      console.error('❌ Erreur parsing JSON:', error);
      throw new Error('Réponse invalide du serveur');
    }
  },

  // Vérifier le statut d'une admission
  checkStatus: async (email, applicationNumber) => {
    const response = await fetch(`${API_BASE_URL}/api/admissions/public/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      body: JSON.stringify({
        email: email,
        application_number: applicationNumber
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  // Récupérer les options pour le formulaire
  getFormOptions: async () => {
    const response = await fetch(`${API_BASE_URL}/api/admissions/form-options`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
};

// Composant principal du formulaire public d'admission
const PublicAdmissionForm = () => {
  const darkBlue = '#00008B';
  const elegantRed = '#B22222';
  const backgroundImageUrl = "/images/form.jpeg";
  const [activeTab, setActiveTab] = useState(0); // 0 = apply, 1 = status
  
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
    family_business: '',
    family_income: 0,
  });
  
  const [formOptions, setFormOptions] = useState({ courses: [], batches: [], countries: [] });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [errors, setErrors] = useState({});
  const [openSnackbar, setOpenSnackbar] = useState(false);

  // États pour la vérification de statut
  const [statusForm, setStatusForm] = useState({
    email: '',
    application_number: ''
  });
  const [statusResult, setStatusResult] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    loadFormOptions();
  }, []);

  const loadFormOptions = async () => {
    try {
      const response = await publicAdmissionsAPI.getFormOptions();
      if (response.status === 'success') {
        setFormOptions(response.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des options:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Champs obligatoires
    const requiredFields = {
      first_name: 'Prénom',
      last_name: 'Nom de famille',
      email: 'Email',
      phone: 'Téléphone',
      gender: 'Genre',
      birth_date: 'Date de naissance'
    };

    Object.entries(requiredFields).forEach(([field, label]) => {
      if (!formData[field]) {
        newErrors[field] = `${label} est obligatoire`;
      }
    });

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    // Validation téléphone
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Format de téléphone invalide';
    }

    // Validation date de naissance (âge minimum 16 ans)
    if (formData.birth_date) {
      const birthDate = new Date(formData.birth_date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 16) {
        newErrors.birth_date = 'Vous devez avoir au moins 16 ans';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Effacer l'erreur si elle existe
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔥 handleSubmit appelé');
    console.log('📋 Données du formulaire:', formData);
    
    const isValid = validateForm();
    console.log('✅ Validation:', isValid);
    console.log('❌ Erreurs:', errors);
    
    if (!isValid) {
      console.log('❌ Validation échouée, arrêt de la soumission');
      // Afficher un message d'erreur pour la validation
      setSubmissionResult({
        status: 'error',
        message: 'Veuillez corriger les erreurs dans le formulaire avant de soumettre.'
      });
      return;
    }

    console.log('🚀 Début de la soumission...');
    setLoading(true);
    setSubmissionResult({
      status: 'loading',
      message: 'Soumission en cours... Veuillez patienter.'
    });
    
    try {
      console.log('📤 Envoi des données:', formData);
      const response = await publicAdmissionsAPI.submitAdmission(formData);
      console.log('📥 Réponse reçue:', response);
      
      if (response.status === 'success') {
        console.log('✅ Soumission réussie !');
        setSubmitted(true);
        setOpenSnackbar(true);
        // Message de succès personnalisé
        setSubmissionResult({
          status: 'success',
          message: `🎉 Félicitations ! Votre demande d'admission a été soumise avec succès. Numéro de dossier : ${response.data?.application_number || 'N/A'}`,
          data: response.data
        });
      } else {
        console.log('❌ Soumission échouée:', response);
        setSubmissionResult({
          status: 'error',
          message: response.message || response.error || 'Erreur lors de la soumission'
        });
      }
    } catch (error) {
      console.error('💥 Erreur lors de la soumission:', error);
      setSubmissionResult({
        status: 'error',
        message: 'Erreur de connexion au serveur. Veuillez vérifier votre connexion internet et réessayer.'
      });
    } finally {
      setLoading(false);
      console.log('🏁 Fin de la soumission');
    }
  };

  const handleStatusCheck = async (e) => {
    e.preventDefault();
    setStatusLoading(true);
    try {
      const response = await publicAdmissionsAPI.checkStatus(
        statusForm.email,
        statusForm.application_number
      );
      setStatusResult(response);
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      setStatusResult({
        status: 'error',
        message: 'Erreur de connexion. Veuillez réessayer.'
      });
    } finally {
      setStatusLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
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
      family_business: '',
      family_income: 0,
    });
    setSubmitted(false);
    setSubmissionResult(null);
    setErrors({});
    setActiveTab(0);
  };

  // Page de confirmation après soumission réussie
  if (submitted && submissionResult?.status === 'success') {
    return (
      <Box sx={{ 
        position: 'relative', 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: 'white'
      }}>
        <Navbar />
        
        {/* Section Hero */}
        <Box sx={{ 
          py: 8, 
          position: 'relative',
          overflow: 'hidden',
          backgroundImage: `url(${backgroundImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 1
          },
          '& > *': {
            position: 'relative',
            zIndex: 2
          }
        }}>
          <Container maxWidth="lg">
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Typography 
                variant="h2" 
                fontWeight="bold" 
                sx={{ mb: 3, fontSize: { xs: '2.5rem', md: '3.5rem' }, color: 'white' }}
              >
                Admission en Ligne
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ mb: 3, opacity: 0.9, fontWeight: 800, color: 'rgba(255,255,255,0.9)' }}
              >
                Rejoignez notre établissement d'excellence
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  maxWidth: '800px', 
                  mx: 'auto', 
                  
                  lineHeight: 1.6,
                  color: 'rgba(255,255,255,0.8)'
                }}
              >
                Déposez votre candidature en quelques minutes et suivez l'évolution de votre dossier en temps réel.
              </Typography>
            </Box>
          </Container>
          
          {/* Ligne décorative tricolore */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80px',
              height: '4px',
              background: `linear-gradient(90deg, ${elegantRed} 0%, white 50%, ${darkBlue} 100%)`,
              borderRadius: '2px',
              zIndex: 2
            }}
          />
        </Box>
        
        <Box sx={{ flexGrow: 1, py: 8 }}>
          <Container maxWidth="md">
            <Fade in={true} timeout={500}>
              <Card 
                elevation={0}
                sx={{ 
                  textAlign: 'center', 
                  p: 6,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2
                }}
              >
                <CheckCircleIcon 
                  sx={{ 
                    fontSize: '4rem', 
                    color: '#4caf50', 
                    mb: 3 
                  }} 
                />
                <Typography 
                  variant="h3" 
                  fontWeight="bold" 
                  sx={{ color: darkBlue, mb: 3 }}
                >
                  Demande Soumise avec Succès !
                </Typography>
                
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3, 
                    mb: 4, 
                    backgroundColor: 'grey.50',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2 
                  }}
                >
                  <Typography variant="body1" sx={{ mb: 1, color: '#333' }}>
                    <strong>Numéro de demande:</strong> {submissionResult.data?.application_number}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1, color: '#333' }}>
                    <strong>Nom:</strong> {submissionResult.data?.name}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#333' }}>
                    <strong>Cours:</strong> {submissionResult.data?.course}
                  </Typography>
                </Paper>
                
                <Typography variant="body1" sx={{ color: '#666', mb: 4, lineHeight: 1.6 }}>
                  Nous avons envoyé une confirmation à votre adresse email. 
                  Vous pouvez suivre le statut de votre demande avec votre numéro de demande.
                </Typography>
                
                <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} justifyContent="center">
                  <Button
                    variant="contained"
                    onClick={() => setActiveTab(1)}
                    sx={{
                      backgroundColor: darkBlue,
                      px: 4,
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      '&:hover': {
                        backgroundColor: '#000070',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    Vérifier le Statut
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={resetForm}
                    sx={{
                      borderColor: darkBlue,
                      color: darkBlue,
                      px: 4,
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      '&:hover': {
                        borderColor: darkBlue,
                        backgroundColor: 'rgba(0,0,139,0.04)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    Nouvelle Demande
                  </Button>
                </Stack>
              </Card>
            </Fade>
          </Container>
        </Box>
        
        <Footer />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      position: 'relative', 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: 'white'
    }}>
      <Navbar />
      
      {/* Section Hero */}
      <Box sx={{ 
        py: 8, 
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: `url(${backgroundImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 1
        },
        '& > *': {
          position: 'relative',
          zIndex: 2
        }
      }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography 
              variant="h2" 
              fontWeight="bold" 
              sx={{ mb: 3, fontSize: { xs: '2rem', md: '3rem' }, color: 'white' }}
            >
              Admission en Ligne
            </Typography>
            <Typography 
              variant="h5" 
              sx={{ mb: 4, opacity: 0.9, fontWeight: 300, color: 'rgba(255,255,255,0.9)' }}
            >
              Rejoignez notre établissement d'excellence
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                maxWidth: '600px', 
                mx: 'auto', 
                opacity: 0.8,
                lineHeight: 1.6,
                color: 'rgba(255,255,255,0.8)'
              }}
            >
              Déposez votre candidature en quelques minutes et suivez l'évolution de votre dossier en temps réel.
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Section Formulaire */}
      <Box sx={{ py: 6, backgroundColor: 'grey.50' }}>
        <Container maxWidth="lg">
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            {/* Onglets */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={activeTab} 
                onChange={(event, newValue) => setActiveTab(newValue)}
                sx={{ 
                  '& .MuiTab-root': {
                    py: 3,
                    px: 4,
                    textTransform: 'none',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    color: '#666',
                    '&.Mui-selected': {
                      color: darkBlue
                    }
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: darkBlue
                  }
                }}
              >
                <Tab 
                  icon={<SendIcon />} 
                  iconPosition="start"
                  label="Faire une Demande" 
                />
                <Tab 
                  icon={<SearchIcon />} 
                  iconPosition="start"
                  label="Vérifier le Statut" 
                />
              </Tabs>
            </Box>

            <CardContent sx={{ p: 4 }}>
              {activeTab === 0 ? (
                // Formulaire de demande d'admission
                <Fade in={true} timeout={300}>
                  <Box>
                    <Typography 
                      variant="h4" 
                      fontWeight="bold" 
                      sx={{ color: darkBlue, mb: 4 }}
                    >
                      Formulaire de Demande d'Admission
                    </Typography>

                    {submissionResult?.status === 'error' && (
                      <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                        {submissionResult.message}
                      </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit}>
                      {/* Informations personnelles */}
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 4, 
                          mb: 4, 
                          border: '1px solid', 
                          borderColor: 'divider',
                          borderRadius: 2,
                          position: 'relative',
                          transition: 'transform 0.2s, box-shadow 0.3s',
                          '&:before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '3px',
                            background: `linear-gradient(90deg, ${elegantRed} 0%, ${darkBlue} 100%)`,
                            borderRadius: '2px 2px 0 0',
                            transition: 'height 0.3s ease'
                          },
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 15px rgba(0,0,139,0.1), 0 0 0 1px ${elegantRed}20`
                          }
                        }}
                      >
                        <Typography 
                          variant="h5" 
                          fontWeight="bold" 
                          sx={{ 
                            color: darkBlue,
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 2, 
                            mb: 4 
                          }}
                        >
                          <PersonIcon />
                          Informations Personnelles
                        </Typography>
                        
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              label="Prénom *"
                              value={formData.first_name}
                              onChange={(e) => handleChange('first_name', e.target.value)}
                              error={!!errors.first_name}
                              helperText={errors.first_name}
                              variant="outlined"
                              placeholder="Votre prénom"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '&:hover fieldset': {
                                    borderColor: darkBlue,
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: darkBlue,
                                  }
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                  color: darkBlue,
                                }
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              label="Deuxième Prénom"
                              value={formData.middle_name}
                              onChange={(e) => handleChange('middle_name', e.target.value)}
                              variant="outlined"
                              placeholder="Deuxième prénom (optionnel)"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '&:hover fieldset': {
                                    borderColor: darkBlue,
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: darkBlue,
                                  }
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                  color: darkBlue,
                                }
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              label="Nom de Famille *"
                              value={formData.last_name}
                              onChange={(e) => handleChange('last_name', e.target.value)}
                              error={!!errors.last_name}
                              helperText={errors.last_name}
                              variant="outlined"
                              placeholder="Votre nom de famille"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '&:hover fieldset': {
                                    borderColor: darkBlue,
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: darkBlue,
                                  }
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                  color: darkBlue,
                                }
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Adresse Email *"
                              type="email"
                              value={formData.email}
                              onChange={(e) => handleChange('email', e.target.value)}
                              error={!!errors.email}
                              helperText={errors.email}
                              variant="outlined"
                              placeholder="votre@email.com"
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <EmailIcon sx={{ color: '#666' }} />
                                  </InputAdornment>
                                ),
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '&:hover fieldset': {
                                    borderColor: darkBlue,
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: darkBlue,
                                  }
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                  color: darkBlue,
                                }
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Téléphone *"
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => handleChange('phone', e.target.value)}
                              error={!!errors.phone}
                              helperText={errors.phone}
                              variant="outlined"
                              placeholder="+221 77 123 45 67"
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <PhoneIcon sx={{ color: '#666' }} />
                                  </InputAdornment>
                                ),
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '&:hover fieldset': {
                                    borderColor: darkBlue,
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: darkBlue,
                                  }
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                  color: darkBlue,
                                }
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              label="Téléphone Mobile"
                              type="tel"
                              value={formData.mobile}
                              onChange={(e) => handleChange('mobile', e.target.value)}
                              variant="outlined"
                              placeholder="Mobile (optionnel)"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '&:hover fieldset': {
                                    borderColor: darkBlue,
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: darkBlue,
                                  }
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                  color: darkBlue,
                                }
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} md={4}>
                            <FormControl 
                              fullWidth 
                              error={!!errors.gender}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '&:hover fieldset': {
                                    borderColor: darkBlue,
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: darkBlue,
                                  }
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                  color: darkBlue,
                                }
                              }}
                            >
                              <InputLabel>Genre *</InputLabel>
                              <Select
                                value={formData.gender}
                                label="Genre *"
                                onChange={(e) => handleChange('gender', e.target.value)}
                              >
                                <MenuItem value="male">Masculin</MenuItem>
                                <MenuItem value="female">Féminin</MenuItem>
                                <MenuItem value="other">Autre</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>

                          <Grid item xs={12} md={4}>
                            <TextField
                              fullWidth
                              label="Date de Naissance *"
                              type="date"
                              value={formData.birth_date}
                              onChange={(e) => handleChange('birth_date', e.target.value)}
                              error={!!errors.birth_date}
                              helperText={errors.birth_date}
                              variant="outlined"
                              InputLabelProps={{
                                shrink: true,
                              }}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <CalendarIcon sx={{ color: '#666' }} />
                                  </InputAdornment>
                                ),
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '&:hover fieldset': {
                                    borderColor: darkBlue,
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: darkBlue,
                                  }
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                  color: darkBlue,
                                }
                              }}
                            />
                          </Grid>
                        </Grid>
                      </Paper>

                      {/* Informations académiques */}
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 4, 
                          mb: 4, 
                          border: '1px solid', 
                          borderColor: 'divider',
                          borderRadius: 2,
                          position: 'relative',
                          transition: 'transform 0.2s, box-shadow 0.3s',
                          '&:before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '3px',
                            background: `linear-gradient(90deg, ${elegantRed} 0%, ${darkBlue} 100%)`,
                            borderRadius: '2px 2px 0 0',
                            transition: 'height 0.3s ease'
                          },
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 15px rgba(0,0,139,0.1), 0 0 0 1px ${elegantRed}20`
                          }
                        }}
                      >
                        <Typography 
                          variant="h5" 
                          fontWeight="bold" 
                          sx={{ 
                            color: darkBlue,
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 2, 
                            mb: 4 
                          }}
                        >
                          <BookIcon />
                          Informations Académiques
                        </Typography>
                        
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <FormControl 
                              fullWidth 
                              error={!!errors.course_id}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '&:hover fieldset': {
                                    borderColor: darkBlue,
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: darkBlue,
                                  }
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                  color: darkBlue,
                                }
                              }}
                            >
                              <InputLabel>Cours Souhaité *</InputLabel>
                              <Select
                                value={formData.course_id}
                                label="Cours Souhaité *"
                                onChange={(e) => handleChange('course_id', e.target.value)}
                              >
                                {formOptions.courses?.map((course) => (
                                  <MenuItem key={course.id} value={course.id}>
                                    {course.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <FormControl 
                              fullWidth
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '&:hover fieldset': {
                                    borderColor: darkBlue,
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: darkBlue,
                                  }
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                  color: darkBlue,
                                }
                              }}
                            >
                              <InputLabel>Promotion</InputLabel>
                              <Select
                                value={formData.batch_id}
                                label="Promotion"
                                onChange={(e) => handleChange('batch_id', e.target.value)}
                              >
                                {formOptions.batches?.map((batch) => (
                                  <MenuItem key={batch.id} value={batch.id}>
                                    {batch.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                        </Grid>
                      </Paper>

                      {/* Adresse */}
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 4, 
                          mb: 4, 
                          border: '1px solid', 
                          borderColor: 'divider',
                          borderRadius: 2,
                          position: 'relative',
                          transition: 'transform 0.2s, box-shadow 0.3s',
                          '&:before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '3px',
                            background: `linear-gradient(90deg, ${elegantRed} 0%, ${darkBlue} 100%)`,
                            borderRadius: '2px 2px 0 0',
                            transition: 'height 0.3s ease'
                          },
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 15px rgba(0,0,139,0.1), 0 0 0 1px ${elegantRed}20`
                          }
                        }}
                      >
                        <Typography 
                          variant="h5" 
                          fontWeight="bold" 
                          sx={{ 
                            color: darkBlue,
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 2, 
                            mb: 4 
                          }}
                        >
                          <LocationIcon />
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
                              placeholder="Votre adresse"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '&:hover fieldset': {
                                    borderColor: darkBlue,
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: darkBlue,
                                  }
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                  color: darkBlue,
                                }
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Ville"
                              value={formData.city}
                              onChange={(e) => handleChange('city', e.target.value)}
                              variant="outlined"
                              placeholder="Votre ville"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '&:hover fieldset': {
                                    borderColor: darkBlue,
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: darkBlue,
                                  }
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                  color: darkBlue,
                                }
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Code Postal"
                              value={formData.zip}
                              onChange={(e) => handleChange('zip', e.target.value)}
                              variant="outlined"
                              placeholder="Code postal"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '&:hover fieldset': {
                                    borderColor: darkBlue,
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: darkBlue,
                                  }
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                  color: darkBlue,
                                }
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Nationalité"
                              value={formData.nationality}
                              onChange={(e) => handleChange('nationality', e.target.value)}
                              variant="outlined"
                              placeholder="Votre nationalité"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '&:hover fieldset': {
                                    borderColor: darkBlue,
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: darkBlue,
                                  }
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                  color: darkBlue,
                                }
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <FormControl 
                              fullWidth
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '&:hover fieldset': {
                                    borderColor: darkBlue,
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: darkBlue,
                                  }
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                  color: darkBlue,
                                }
                              }}
                            >
                              <InputLabel>Pays</InputLabel>
                              <Select
                                value={formData.country}
                                label="Pays"
                                onChange={(e) => handleChange('country', e.target.value)}
                              >
                                {formOptions.countries?.map((country) => (
                                  <MenuItem key={country.id} value={country.id}>
                                    {country.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                        </Grid>
                      </Paper>

                      {/* Informations complémentaires */}
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 4, 
                          mb: 4, 
                          border: '1px solid', 
                          borderColor: 'divider',
                          borderRadius: 2,
                          position: 'relative',
                          transition: 'transform 0.2s, box-shadow 0.3s',
                          '&:before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '3px',
                            background: `linear-gradient(90deg, ${elegantRed} 0%, ${darkBlue} 100%)`,
                            borderRadius: '2px 2px 0 0',
                            transition: 'height 0.3s ease'
                          },
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 15px rgba(0,0,139,0.1), 0 0 0 1px ${elegantRed}20`
                          }
                        }}
                      >
                        <Typography 
                          variant="h5" 
                          fontWeight="bold" 
                          sx={{ color: darkBlue, mb: 4 }}
                        >
                          Informations Complémentaires
                        </Typography>
                        
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Profession des Parents"
                              value={formData.family_business}
                              onChange={(e) => handleChange('family_business', e.target.value)}
                              variant="outlined"
                              placeholder="Profession des parents"
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '&:hover fieldset': {
                                    borderColor: darkBlue,
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: darkBlue,
                                  }
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                  color: darkBlue,
                                }
                              }}
                            />
                          </Grid>

                          <Grid item xs={12} md={6}>
                            <TextField
                              fullWidth
                              label="Revenus Familiaux (Optionnel)"
                              type="number"
                              value={formData.family_income}
                              onChange={(e) => handleChange('family_income', parseFloat(e.target.value) || 0)}
                              variant="outlined"
                              placeholder="Revenus en FCFA"
                              inputProps={{ min: 0 }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '&:hover fieldset': {
                                    borderColor: darkBlue,
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: darkBlue,
                                  }
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                  color: darkBlue,
                                }
                              }}
                            />
                          </Grid>
                        </Grid>
                      </Paper>

                      {/* Bouton de soumission */}
                      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 3 }}>
                        <Button
                          type="submit"
                          variant="contained"
                          size="large"
                          disabled={loading}
                          onClick={handleSubmit}
                          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                          sx={{
                            backgroundColor: darkBlue,
                            px: 6,
                            py: 1.5,
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            '&:hover': {
                              backgroundColor: '#000070',
                              transform: 'translateY(-2px)'
                            }
                          }}
                        >
                          {loading ? 'Envoi en cours...' : 'Soumettre ma Demande'}
                        </Button>
                      </Box>

                      {/* Messages d'état */}
                      {submissionResult && (
                        <Box sx={{ mt: 3 }}>
                          <Alert 
                            severity={
                              submissionResult.status === 'success' ? 'success' :
                              submissionResult.status === 'loading' ? 'info' : 'error'
                            }
                            sx={{
                              '& .MuiAlert-message': {
                                fontSize: '1rem',
                                fontWeight: 500
                              }
                            }}
                          >
                            {submissionResult.message}
                            {submissionResult.status === 'success' && submissionResult.data && (
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  📋 Détails de votre demande :
                                </Typography>
                                <Typography variant="body2">
                                  • Nom complet : {submissionResult.data.name}
                                </Typography>
                                <Typography variant="body2">
                                  • Numéro de dossier : {submissionResult.data.application_number}
                                </Typography>
                                <Typography variant="body2">
                                  • ID d'admission : {submissionResult.data.admission_id}
                                </Typography>
                              </Box>
                            )}
                          </Alert>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Fade>
              ) : (
                // Vérification du statut
                <Fade in={true} timeout={300}>
                  <Box>
                    <Typography 
                      variant="h4" 
                      fontWeight="bold" 
                      sx={{ color: darkBlue, mb: 4 }}
                    >
                      Vérifier le Statut de Votre Demande
                    </Typography>

                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 4, 
                        mb: 4, 
                        border: '1px solid', 
                        borderColor: 'divider',
                        borderRadius: 2,
                        maxWidth: 500 
                      }}
                    >
                      <Box component="form" onSubmit={handleStatusCheck}>
                        <Stack spacing={3}>
                          <TextField
                            fullWidth
                            label="Adresse Email"
                            type="email"
                            required
                            value={statusForm.email}
                            onChange={(e) => setStatusForm(prev => ({ ...prev, email: e.target.value }))}
                            variant="outlined"
                            placeholder="votre@email.com"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <EmailIcon sx={{ color: '#666' }} />
                                </InputAdornment>
                              ),
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                '&:hover fieldset': {
                                  borderColor: darkBlue,
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: darkBlue,
                                }
                              },
                              '& .MuiInputLabel-root.Mui-focused': {
                                color: darkBlue,
                              }
                            }}
                          />

                          <TextField
                            fullWidth
                            label="Numéro de Demande"
                            required
                            value={statusForm.application_number}
                            onChange={(e) => setStatusForm(prev => ({ ...prev, application_number: e.target.value }))}
                            variant="outlined"
                            placeholder="ADM123456"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                '&:hover fieldset': {
                                  borderColor: darkBlue,
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: darkBlue,
                                }
                              },
                              '& .MuiInputLabel-root.Mui-focused': {
                                color: darkBlue,
                              }
                            }}
                          />

                          <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={statusLoading}
                            startIcon={statusLoading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                            sx={{
                              backgroundColor: darkBlue,
                              py: 1.5,
                              fontSize: '1rem',
                              fontWeight: 'bold',
                              '&:hover': {
                                backgroundColor: '#000070',
                                transform: 'translateY(-2px)'
                              }
                            }}
                          >
                            {statusLoading ? 'Vérification...' : 'Vérifier le Statut'}
                          </Button>
                        </Stack>
                      </Box>
                    </Paper>

                    {/* Résultat de la vérification */}
                    {statusResult && (
                      <Fade in={true} timeout={300}>
                        <Box>
                          {statusResult.status === 'success' ? (
                            <Card 
                              elevation={0} 
                              sx={{ 
                                border: '1px solid', 
                                borderColor: 'divider',
                                borderRadius: 2
                              }}
                            >
                              <CardContent sx={{ p: 4 }}>
                                <Typography 
                                  variant="h5" 
                                  fontWeight="bold" 
                                  sx={{ color: darkBlue, mb: 3 }}
                                >
                                  Statut de Votre Demande
                                </Typography>
                                
                                <Grid container spacing={3}>
                                  <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" sx={{ color: '#666' }}>
                                      Numéro:
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                      {statusResult.data.application_number}
                                    </Typography>
                                  </Grid>
                                  
                                  <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" sx={{ color: '#666' }}>
                                      Nom:
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                      {statusResult.data.name}
                                    </Typography>
                                  </Grid>
                                  
                                  <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" sx={{ color: '#666' }}>
                                      Cours:
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                      {statusResult.data.course}
                                    </Typography>
                                  </Grid>
                                  
                                  <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" sx={{ color: '#666' }}>
                                      Date de demande:
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                      {statusResult.data.application_date ? 
                                        new Date(statusResult.data.application_date).toLocaleDateString('fr-FR') : 
                                        '-'
                                      }
                                    </Typography>
                                  </Grid>
                                  
                                  <Grid item xs={12}>
                                    <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                                      Statut:
                                    </Typography>
                                    <StatusBadge status={statusResult.data.state} label={statusResult.data.state_label} />
                                  </Grid>
                                </Grid>
                                
                                {statusResult.data.student_info && (
                                  <Alert 
                                    severity="success" 
                                    sx={{ 
                                      mt: 3,
                                      borderRadius: 2,
                                      '& .MuiAlert-message': {
                                        width: '100%'
                                      }
                                    }}
                                  >
                                    <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>
                                      ✅ Félicitations ! Votre admission a été confirmée et votre dossier étudiant a été créé.
                                    </Typography>
                                    {statusResult.data.student_info.gr_no && (
                                      <Typography variant="body2">
                                        Numéro étudiant: {statusResult.data.student_info.gr_no}
                                      </Typography>
                                    )}
                                  </Alert>
                                )}
                              </CardContent>
                            </Card>
                          ) : (
                            <Alert severity="error" sx={{ borderRadius: 2 }}>
                              {statusResult.message}
                            </Alert>
                          )}
                        </Box>
                      </Fade>
                    )}
                  </Box>
                </Fade>
              )}
            </CardContent>
          </Card>
        </Container>
      </Box>

      <Footer />

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={submissionResult?.status === 'success' ? 'success' : 'error'}
          sx={{ width: '100%' }}
        >
          {submissionResult?.status === 'success' 
            ? 'Demande soumise avec succès !' 
            : submissionResult?.message || 'Une erreur est survenue'
          }
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Composant badge de statut
const StatusBadge = ({ status, label }) => {
  const statusConfig = {
    draft: { color: 'default', variant: 'outlined' },
    submit: { color: 'primary', variant: 'filled' },
    confirm: { color: 'success', variant: 'filled' },
    reject: { color: 'error', variant: 'filled' },
    cancel: { color: 'default', variant: 'outlined' }
  };

  const config = statusConfig[status] || { color: 'default', variant: 'outlined' };

  return (
    <Chip
      label={label || status}
      color={config.color}
      variant={config.variant}
      sx={{ 
        fontWeight: 'bold',
        px: 1 
      }}
    />
  );
};

export default PublicAdmissionForm;