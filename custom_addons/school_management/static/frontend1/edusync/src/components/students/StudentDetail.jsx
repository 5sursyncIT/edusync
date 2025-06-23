import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudent } from '../../hooks/useOdoo';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Chip,
  Card,
  CardContent,
  Avatar,
  useTheme
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import EventIcon from '@mui/icons-material/Event';
import CakeIcon from '@mui/icons-material/Cake';
import ClassIcon from '@mui/icons-material/Class';
import BookIcon from '@mui/icons-material/Book';

// Fonction utilitaire pour calculer l'âge à partir de la date de naissance
function calculerAge(dateNaissance) {
  if (!dateNaissance) return '';
  const today = new Date();
  const birthDate = new Date(dateNaissance);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Utiliser le nouveau hook useStudent
  const { student, loading, error, refetch } = useStudent(id);
  
  // Retourner à la liste des élèves
  const handleBackToList = () => {
    navigate('/students');
  };
  
  // Naviguer vers la page de modification
  const handleEdit = () => {
    navigate(`/dashboard/students/${id}/edit`);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error || !student) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error || 'Élève non trouvé'}</Typography>
        <Button 
          variant="contained" 
          onClick={handleBackToList}
          sx={{ mt: 2 }}
        >
          Retour à la liste
        </Button>
      </Box>
    );
  }
  
  // Calculer l'âge et formater les données
  const enhancedStudent = {
    ...student,
    age: calculerAge(student.birth_date),
    displayName: `${student.name}${student.middle_name ? ' ' + student.middle_name : ''}${student.last_name ? ' ' + student.last_name : ''}`
  };
  
  // Déterminer le genre pour l'affichage
  const displayGender = student.gender === 'm' ? 'Masculin' : student.gender === 'f' ? 'Féminin' : 'Non spécifié';
  
  // Formater la date de naissance
  const formatDate = (dateString) => {
    if (!dateString) return 'Non spécifiée';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: { xs: 2, md: 4 },
          borderRadius: 2,
          boxShadow: theme => theme.shadows[8],
          background: 'linear-gradient(to right bottom, #ffffff, #f9f9f9)'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              onClick={handleBackToList}
              color="primary"
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography 
              variant="h5" 
              component="h1" 
              sx={{ 
                fontWeight: 'bold',
                color: theme.palette.primary.main,
                textShadow: '1px 1px 1px rgba(0,0,0,0.1)'
              }}
            >
              Détails de l'élève
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<EditIcon />}
            onClick={handleEdit}
            sx={{ 
              px: 3,
              py: 1,
              borderRadius: 2,
              boxShadow: theme.shadows[4],
              '&:hover': {
                boxShadow: theme.shadows[8],
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Modifier
          </Button>
        </Box>
        
        <Divider sx={{ mb: 4, borderColor: 'rgba(0,0,0,0.1)' }} />
        
        <Grid container spacing={4}>
          {/* Informations principales */}
          <Grid item xs={12} md={4}>
            <Card 
              elevation={4} 
              sx={{ 
                height: '100%',
                borderRadius: 3,
                overflow: 'hidden',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)'
                }
              }}
            >
              <Box sx={{ 
                bgcolor: theme.palette.primary.main, 
                py: 3, 
                position: 'relative',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
              }}>
                <Avatar 
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    mx: 'auto',
                    border: '4px solid white',
                    bgcolor: theme.palette.secondary.main,
                    fontSize: '3rem',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                  }}
                >
                  {enhancedStudent.displayName.charAt(0)}
                </Avatar>
              </Box>
              <CardContent sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                p: 3,
                pt: 4
              }}>
                <Typography 
                  variant="h5" 
                  gutterBottom 
                  align="center"
                  sx={{ 
                    fontWeight: 'bold',
                    mb: 2
                  }}
                >
                  {enhancedStudent.displayName}
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1, 
                  mb: 3, 
                  flexWrap: 'wrap', 
                  justifyContent: 'center' 
                }}>
                  <Chip 
                    label="Actif" 
                    color="success"
                    sx={{ fontWeight: 'bold' }}
                  />
                  <Chip 
                    label="Étudiant"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
                
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 2,
                  width: '100%',
                  p: 1,
                  borderRadius: 1,
                  bgcolor: 'rgba(0,0,0,0.03)'
                }}>
                  <SchoolIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    ID: {enhancedStudent.id}
                  </Typography>
                </Box>
                
                {enhancedStudent.age && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    width: '100%',
                    p: 1,
                    borderRadius: 1,
                    bgcolor: 'rgba(0,0,0,0.03)'
                  }}>
                    <CakeIcon color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      {enhancedStudent.age} ans
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Informations personnelles */}
          <Grid item xs={12} md={8}>
            <Card 
              elevation={4} 
              sx={{ 
                mb: 3,
                borderRadius: 3,
                overflow: 'hidden'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonIcon color="primary" sx={{ mr: 1 }} />
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: theme.palette.primary.main
                    }}
                  >
                    Informations personnelles
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Nom complet</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {enhancedStudent.name}
                      </Typography>
                    </Box>
                    
                    {enhancedStudent.middle_name && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Deuxième prénom</Typography>
                        <Typography variant="body1">{enhancedStudent.middle_name}</Typography>
                      </Box>
                    )}
                    
                    {enhancedStudent.last_name && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Nom de famille</Typography>
                        <Typography variant="body1">{enhancedStudent.last_name}</Typography>
                      </Box>
                    )}
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Genre</Typography>
                      <Typography variant="body1">{displayGender}</Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Date de naissance</Typography>
                      <Typography variant="body1">{formatDate(enhancedStudent.birth_date)}</Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Email</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EmailIcon color="action" sx={{ mr: 1, fontSize: '1.2rem' }} />
                        <Typography variant="body1">{enhancedStudent.email || 'Non spécifié'}</Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Téléphone</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PhoneIcon color="action" sx={{ mr: 1, fontSize: '1.2rem' }} />
                        <Typography variant="body1">{enhancedStudent.phone || 'Non spécifié'}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            {/* Informations académiques */}
              <Card 
                elevation={4} 
                sx={{ 
                  mb: 3,
                  borderRadius: 3,
                  overflow: 'hidden'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <BookIcon color="primary" sx={{ mr: 1 }} />
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: theme.palette.primary.main
                      }}
                    >
                      Informations académiques
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  
                  <Grid container spacing={3}>
                  {/* Cycle scolaire */}
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ 
                          mb: 2, 
                          p: 2, 
                          borderRadius: 2, 
                          bgcolor: 'rgba(25, 118, 210, 0.08)',
                          border: `1px solid rgba(25, 118, 210, 0.23)`
                        }}>
                      <Typography variant="body2" color="text.secondary">Cycle scolaire</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {student.school_cycle ? (
                          student.school_cycle === 'primaire' ? 'École Primaire' :
                          student.school_cycle === 'college' ? 'Collège' :
                          student.school_cycle === 'lycee' ? 'Lycée' :
                          student.school_cycle
                        ) : 'Non spécifié'}
                          </Typography>
                        </Box>
                      </Grid>
                    
                  {/* Promotion/Batch */}
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ 
                          mb: 2, 
                          p: 2, 
                          borderRadius: 2, 
                          bgcolor: 'rgba(156, 39, 176, 0.08)',
                          border: `1px solid rgba(156, 39, 176, 0.23)`
                        }}>
                      <Typography variant="body2" color="text.secondary">Promotion</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                        {student.batch ? student.batch.name : 'Non assigné'}
                          </Typography>
                      {student.batch && student.batch.code && (
                          <Typography variant="body2" color="text.secondary">
                          Code: {student.batch.code}
                          </Typography>
                      )}
                      {student.batch && student.batch.start_date && student.batch.end_date && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Période: {formatDate(student.batch.start_date)} - {formatDate(student.batch.end_date)}
                            </Typography>
                          )}
                    </Box>
                  </Grid>

                  {/* Cours si disponible */}
                  {student.course && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        mb: 2, 
                        p: 2, 
                        borderRadius: 2, 
                        bgcolor: 'rgba(76, 175, 80, 0.08)',
                        border: `1px solid rgba(76, 175, 80, 0.23)`
                      }}>
                        <Typography variant="body2" color="text.secondary">Cours</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                          {typeof student.course === 'object' && student.course.name 
                            ? student.course.name 
                            : typeof student.course === 'string' 
                            ? student.course 
                            : 'Non défini'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Code: {typeof student.course === 'object' && student.course.code 
                            ? student.course.code 
                            : 'Non défini'}
                        </Typography>
                        <Chip 
                          label={typeof student.course === 'object' && student.course.state 
                            ? typeof student.course.state === 'string' 
                              ? student.course.state 
                              : student.course.state.name || 'Actif'
                            : 'Actif'}
                          color="success"
                          size="small"
                          sx={{ mt: 1 }}
                        />
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            
            {/* Informations système */}
            <Card 
              elevation={4} 
              sx={{ 
                borderRadius: 3,
                overflow: 'hidden'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SchoolIcon color="primary" sx={{ mr: 1 }} />
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: theme.palette.primary.main
                    }}
                  >
                    Informations système
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ 
                      mb: 2, 
                      p: 2, 
                      borderRadius: 2, 
                      bgcolor: theme.palette.background.default,
                      border: `1px solid ${theme.palette.divider}`
                    }}>
                      <Typography variant="body2" color="text.secondary">ID Étudiant</Typography>
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                        {enhancedStudent.id}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ 
                      mb: 2, 
                      p: 2, 
                      borderRadius: 2, 
                      bgcolor: theme.palette.background.default,
                      border: `1px solid ${theme.palette.divider}`
                    }}>
                      <Typography variant="body2" color="text.secondary">Statut</Typography>
                      <Chip 
                        label="Actif"
                        color="success"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Grid>
                  
                  {enhancedStudent.created_on && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        mb: 2, 
                        p: 2, 
                        borderRadius: 2, 
                        bgcolor: theme.palette.background.default,
                        border: `1px solid ${theme.palette.divider}`
                      }}>
                        <Typography variant="body2" color="text.secondary">Date de création</Typography>
                        <Typography variant="body1">
                          {formatDate(enhancedStudent.created_on)}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                  
                  {enhancedStudent.updated_on && (
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        mb: 2, 
                        p: 2, 
                        borderRadius: 2, 
                        bgcolor: theme.palette.background.default,
                        border: `1px solid ${theme.palette.divider}`
                      }}>
                        <Typography variant="body2" color="text.secondary">Dernière modification</Typography>
                        <Typography variant="body1">
                          {formatDate(enhancedStudent.updated_on)}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default StudentDetail; 