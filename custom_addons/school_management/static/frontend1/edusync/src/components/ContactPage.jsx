import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  TextField,
  Button,
  useTheme,
  Alert,
  Snackbar,
  Divider
} from '@mui/material';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Send as SendIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Support as SupportIcon,
  QuestionAnswer as QuestionIcon
} from '@mui/icons-material';
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';

function ContactPage() {
  const theme = useTheme();
  const darkBlue = '#00008B';
  const elegantRed = '#B22222'; // Ajout de la couleur rouge élégante
  // Utilisons l'approche la plus simple
  const backgroundImageUrl = "/images/contact.jpeg";

  // État du formulaire
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    message: ''
  });

  // État des notifications
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSeveritySnackbar] = useState('success');

  // Informations de contact
  const contactInfo = [
    {
      icon: <EmailIcon fontSize="large" />,
      title: 'Email',
      primary: 'contact@edusync.pro',
      secondary: 'support@edusync.pro',
      description: 'Réponse sous 24h'
    },
    {
      icon: <PhoneIcon fontSize="large" />,
      title: 'Téléphone',
      primary: '+221 33 XXX XX XX',
      secondary: '+221 77 XXX XX XX',
      description: 'Lun-Ven: 8h-18h'
    },
    {
      icon: <LocationIcon fontSize="large" />,
      title: 'Adresse',
      primary: 'Dakar, Sénégal',
      secondary: 'Zone industrielle',
      description: 'Rendez-vous sur RDV'
    },
    {
      icon: <TimeIcon fontSize="large" />,
      title: 'Horaires',
      primary: 'Lundi - Vendredi',
      secondary: '08h00 - 18h00',
      description: 'Support disponible'
    }
  ];

  // Types de demandes
  const requestTypes = [
    {
      icon: <QuestionIcon fontSize="large" />,
      title: 'Demande de démo',
      description: 'Découvrez notre solution en action'
    },
    {
      icon: <SupportIcon fontSize="large" />,
      title: 'Support technique',
      description: 'Assistance et résolution de problèmes'
    },
    {
      icon: <BusinessIcon fontSize="large" />,
      title: 'Partenariat',
      description: 'Opportunités de collaboration'
    },
    {
      icon: <PersonIcon fontSize="large" />,
      title: 'Information générale',
      description: 'Questions sur nos services'
    }
  ];

  // Gestion du formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation simple
    if (!formData.name || !formData.email || !formData.message) {
      setSnackbarMessage('Veuillez remplir tous les champs obligatoires');
      setSeveritySnackbar('error');
      setOpenSnackbar(true);
      return;
    }

    // Simulation d'envoi
    console.log('Données du formulaire:', formData);
    
    // Reset du formulaire
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      subject: '',
      message: ''
    });

    setSnackbarMessage('Votre message a été envoyé avec succès! Nous vous répondrons dans les plus brefs délais.');
    setSeveritySnackbar('success');
    setOpenSnackbar(true);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Box sx={{ 
      position: 'relative', 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: 'white'
    }}>
      <Navbar />
      
      <Box sx={{ flexGrow: 1 }}>
        {/* Section Hero */}
        <Box
          sx={{
            py: { xs: 6, md: 8 },
            minHeight: '10px',
            position: 'relative',
            overflow: 'hidden',
            background: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${backgroundImageUrl}), linear-gradient(135deg, ${darkBlue} 0%, #000070 100%)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            '& > *': {
              position: 'relative',
              zIndex: 2
            }
          }}
        >
          <Container maxWidth="lg">
            <Box sx={{ textAlign: 'center', mb: 3}}>
              <Typography
                variant="h2"
                component="h1"
                fontWeight="bold"
                gutterBottom
                sx={{
                  color: 'white',
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  mb: 3
                }}
              >
                Contactez-Nous
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: 'rgba(255,255,255,0.9)',
                  maxWidth: '600px',
                  mx: 'auto',
                  lineHeight: 1.6
                }}
              >
                Notre équipe est là pour répondre à toutes vos questions et vous accompagner 
                dans votre projet de transformation numérique
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

        {/* Section Informations de contact */}
        <Box sx={{ py: 6, backgroundColor: 'grey.50' }}>
          <Container maxWidth="lg">
            <Typography
              variant="h4"
              component="h2"
              fontWeight="bold"
              gutterBottom
              align="center"
              sx={{ color: darkBlue, mb: 6 }}
            >
              Nos Coordonnées
            </Typography>
            
            <Grid container spacing={4}>
              {contactInfo.map((info, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card
                    sx={{
                      height: '100%',
                      textAlign: 'center',
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      position: 'relative',
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
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 25px rgba(0,0,139,0.1), 0 0 0 1px ${elegantRed}20`,
                        borderColor: elegantRed
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ color: darkBlue, mb: 2 }}>
                        {info.icon}
                      </Box>
                      <Typography
                        variant="h6"
                        component="h3"
                        fontWeight="bold"
                        gutterBottom
                        sx={{ color: darkBlue }}
                      >
                        {info.title}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ color: '#333', fontWeight: 500, mb: 1 }}
                      >
                        {info.primary}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: '#666', mb: 1 }}
                      >
                        {info.secondary}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: '#999', fontSize: '0.875rem' }}
                      >
                        {info.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* Section Types de demandes */}
        <Box sx={{ py: 6, backgroundColor: 'white' }}>
          <Container maxWidth="lg">
            <Typography
              variant="h4"
              component="h2"
              fontWeight="bold"
              gutterBottom
              align="center"
              sx={{ color: darkBlue, mb: 6 }}
            >
              Comment Pouvons-Nous Vous Aider ?
            </Typography>
            
            <Grid container spacing={4}>
              {requestTypes.map((type, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      height: '100%',
                      textAlign: 'center',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      position: 'relative',
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
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 25px rgba(0,0,139,0.1), 0 0 0 1px ${elegantRed}20`,
                        borderColor: elegantRed
                      }
                    }}
                  >
                    <Box sx={{ color: darkBlue, mb: 2 }}>
                      {type.icon}
                    </Box>
                    <Typography
                      variant="h6"
                      component="h3"
                      fontWeight="bold"
                      gutterBottom
                      sx={{ color: darkBlue }}
                    >
                      {type.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.6 }}>
                      {type.description}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* Section Formulaire de contact */}
        <Box sx={{ py: 8, backgroundColor: 'grey.50' }}>
          <Container maxWidth="md">
            <Typography
              variant="h4"
              component="h2"
              fontWeight="bold"
              gutterBottom
              align="center"
              sx={{ color: darkBlue, mb: 2 }}
            >
              Envoyez-Nous un Message
            </Typography>
            <Typography
              variant="body1"
              align="center"
              sx={{ color: '#666', mb: 6 }}
            >
              Remplissez le formulaire ci-dessous et nous vous répondrons rapidement
            </Typography>

            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nom complet *"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      variant="outlined"
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
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email *"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      variant="outlined"
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
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Téléphone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      variant="outlined"
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
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Établissement/Entreprise"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      variant="outlined"
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
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Sujet"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      variant="outlined"
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
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Message *"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      variant="outlined"
                      multiline
                      rows={6}
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
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ textAlign: 'center' }}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        startIcon={<SendIcon />}
                        sx={{
                          backgroundColor: darkBlue,
                          px: 4,
                          py: 1.5,
                          fontSize: '1.1rem',
                          fontWeight: 'bold',
                          '&:hover': {
                            backgroundColor: '#000070',
                            transform: 'translateY(-2px)'
                          }
                        }}
                      >
                        Envoyer le Message
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </form>
            </Paper>
          </Container>
        </Box>

        {/* Section FAQ rapide */}
        <Box sx={{ py: 6, backgroundColor: 'white' }}>
          <Container maxWidth="lg">
            <Typography
              variant="h4"
              component="h2"
              fontWeight="bold"
              gutterBottom
              align="center"
              sx={{ color: darkBlue, mb: 6 }}
            >
              Questions Fréquentes
            </Typography>
            
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h6"
                    sx={{ color: darkBlue, fontWeight: 'bold', mb: 1 }}
                  >
                    Combien de temps faut-il pour déployer la solution ?
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.6 }}>
                    Le déploiement standard prend entre 2 à 4 semaines selon la taille de 
                    votre établissement et vos besoins de personnalisation.
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h6"
                    sx={{ color: darkBlue, fontWeight: 'bold', mb: 1 }}
                  >
                    Proposez-vous une formation pour les utilisateurs ?
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.6 }}>
                    Oui, nous incluons une formation complète pour tous les utilisateurs et 
                    un accompagnement pendant les premiers mois d'utilisation.
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h6"
                    sx={{ color: darkBlue, fontWeight: 'bold', mb: 1 }}
                  >
                    La solution est-elle adaptée aux petits établissements ?
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.6 }}>
                    Absolument ! Notre solution est scalable et s'adapte aussi bien aux 
                    petites écoles qu'aux grands complexes scolaires.
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h6"
                    sx={{ color: darkBlue, fontWeight: 'bold', mb: 1 }}
                  >
                    Quel type de support technique proposez-vous ?
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.6 }}>
                    Support technique complet par email, téléphone et assistance à distance. 
                    Maintenance et mises à jour incluses.
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>

      <Footer />

      {/* Snackbar pour les notifications */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ContactPage;