import React, { useState } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Avatar,
  Fade,
  Stack,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Login as LoginIcon
} from '@mui/icons-material';
import { parentAPI } from './ParentAPI';
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';

const ParentLogin = ({ onLoginSuccess }) => {
  const darkBlue = '#00008B';
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
    // Effacer l'erreur lors de la saisie
    if (error) setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔐 Tentative de connexion pour:', loginData.email);
      const response = await parentAPI.parentLogin(loginData.email, loginData.password);
      console.log('📨 Réponse login:', response);
      
      if (response.status === 'success') {
        console.log('✅ Connexion réussie, session:', response.session_id);
        localStorage.setItem('parent_session_id', response.session_id);
        localStorage.setItem('parent_info', JSON.stringify(response.parent));
        
        // Charger les informations du parent après connexion
        console.log('🔄 Chargement des enfants...');
        const childrenResponse = await parentAPI.getChildren();
        console.log('📋 Réponse API enfants:', childrenResponse);
        
        if (childrenResponse.status === 'success') {
          const parentInfo = {
            ...response.parent,
            children: childrenResponse.data?.children || []
          };
          onLoginSuccess(parentInfo);
        } else {
          setError('Erreur lors du chargement des enfants');
        }
      } else {
        console.error('❌ Échec connexion:', response.message);
        setError(response.message || 'Erreur de connexion');
      }
    } catch (error) {
      console.error('💥 Erreur login:', error);
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box>
      <Navbar />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f8faff 0%, #ffffff 50%, #f0f4ff 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4
        }}
      >
        <Container maxWidth="sm">
          <Fade in={true} timeout={800}>
            <Card
              elevation={12}
              sx={{
                borderRadius: 4,
                overflow: 'hidden',
                backdropFilter: 'blur(10px)',
                background: 'rgba(255, 255, 255, 0.95)'
              }}
            >
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${darkBlue} 0%, #1565c0 100%)`,
                  color: 'white',
                  py: 4,
                  textAlign: 'center'
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    width: 80,
                    height: 80,
                    mx: 'auto',
                    mb: 2
                  }}
                >
                  <PersonIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                  Portail Parent
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Accédez au suivi scolaire de votre enfant
                </Typography>
              </Box>

              <CardContent sx={{ p: 4 }}>
                <Box component="form" onSubmit={handleLogin}>
                  {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                      {error}
                    </Alert>
                  )}

                  <Stack spacing={3}>
                    <TextField
                      fullWidth
                      label="Adresse email"
                      name="email"
                      type="email"
                      value={loginData.email}
                      onChange={handleInputChange}
                      variant="outlined"
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon color="action" />
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
                          },
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: darkBlue,
                        },
                      }}
                    />

                    <TextField
                      fullWidth
                      label="Mot de passe"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={loginData.password}
                      onChange={handleInputChange}
                      variant="outlined"
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={togglePasswordVisibility}
                              edge="end"
                              aria-label="toggle password visibility"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
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
                          },
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: darkBlue,
                        },
                      }}
                    />

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
                      sx={{
                        bgcolor: darkBlue,
                        py: 1.5,
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        borderRadius: 2,
                        textTransform: 'none',
                        '&:hover': {
                          bgcolor: '#1565c0',
                          transform: 'translateY(-2px)',
                          boxShadow: 6,
                        },
                        '&:disabled': {
                          bgcolor: 'rgba(0, 0, 139, 0.5)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {loading ? 'Connexion en cours...' : 'Se connecter'}
                    </Button>
                  </Stack>
                </Box>

                <Paper
                  elevation={0}
                  sx={{
                    mt: 4,
                    p: 3,
                    bgcolor: 'rgba(0, 0, 139, 0.05)',
                    borderRadius: 2,
                    border: `1px solid rgba(0, 0, 139, 0.1)`
                  }}
                >
                  <Typography variant="body2" color="text.secondary" textAlign="center" gutterBottom>
                    <strong>Informations de connexion :</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    Mot de passe par défaut : <strong>parent123</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    Vous pourrez modifier votre mot de passe après connexion
                  </Typography>
                </Paper>
              </CardContent>
            </Card>
          </Fade>
        </Container>
      </Box>
      <Footer />
    </Box>
  );
};

export default ParentLogin; 