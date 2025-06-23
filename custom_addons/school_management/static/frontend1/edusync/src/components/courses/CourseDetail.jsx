import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import odooApi from '../../services/odooApi.jsx';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Container,
  Card,
  CardContent,
  Divider,
  Stack,
  Fade,
  IconButton,
  Tooltip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Book as BookIcon,
  Code as CodeIcon,
  Description as DescriptionIcon,
  Category as CategoryIcon,
  School as SchoolIcon,
  AccessTime as AccessTimeIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

const CourseDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // États
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Charger les données du cours
  useEffect(() => {
    if (id) {
      fetchCourseData();
    }
  }, [id]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await odooApi.getCourse(id);
      
      if (response && response.data) {
        setCourse(response.data);
      } else {
        setError('Cours non trouvé');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du cours:', error);
      setError(`Erreur lors du chargement: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Gestionnaires d'événements
  const handleEdit = () => {
    navigate(`/courses/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le cours "${course?.name}" ?`)) {
      return;
    }

    try {
      setDeleting(true);
      await odooApi.deleteCourse(id);
      setSuccessMessage('Cours supprimé avec succès');
      setTimeout(() => {
        navigate('/courses');
      }, 1500);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setError(`Erreur lors de la suppression: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleBack = () => {
    navigate('/courses');
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccessMessage('');
  };

  // Fonctions utilitaires
  const getEducationLevelLabel = (level) => {
    const levels = {
      'prescolaire': 'Préscolaire',
      'primary': 'Primaire',
      'middle': 'Collège',
      'high': 'Lycée',
      'university': 'Université'
    };
    return levels[level] || level || 'Non spécifié';
  };

  const getSubjectAreaLabel = (area) => {
    const areas = {
      'mathematics': 'Mathématiques',
      'sciences': 'Sciences',
      'languages': 'Langues',
      'humanities': 'Sciences Humaines',
      'arts': 'Arts',
      'sports': 'Sports',
      'technology': 'Technologie',
      'other': 'Autre'
    };
    return areas[area] || area || 'Non spécifié';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={40} />
      </Container>
    );
  }

  if (!course) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">Cours non trouvé</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Fade in={true} timeout={600}>
        <Box>
          {/* En-tête avec navigation */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 4,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            p: 3,
            borderRadius: 2,
            boxShadow: 3
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton 
                onClick={handleBack}
                sx={{ color: 'white', mr: 2 }}
              >
                <ArrowBackIcon />
              </IconButton>
              <BookIcon sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h4" component="h1" fontWeight="bold">
                  Détails du Cours
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  Informations complètes sur le cours
                </Typography>
              </Box>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="warning"
                startIcon={<EditIcon />}
                onClick={handleEdit}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                  }
                }}
              >
                Modifier
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
                onClick={handleDelete}
                disabled={deleting}
                sx={{
                  bgcolor: 'rgba(244, 67, 54, 0.8)',
                  '&:hover': {
                    bgcolor: 'rgba(244, 67, 54, 0.9)',
                  }
                }}
              >
                {deleting ? 'Suppression...' : 'Supprimer'}
              </Button>
            </Stack>
          </Box>

          <Grid container spacing={4}>
            {/* Informations principales */}
            <Grid item xs={12} md={8}>
              <Card sx={{ boxShadow: 3, mb: 3 }}>
                <CardContent sx={{ p: 4 }}>
                  {/* En-tête du cours */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: 'primary.main', 
                        width: 64, 
                        height: 64, 
                        mr: 3,
                        boxShadow: 3
                      }}
                    >
                      <BookIcon sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h4" fontWeight="bold" gutterBottom>
                        {course.name}
                      </Typography>
                      <Chip 
                        label={course.code}
                        color="primary"
                        icon={<CodeIcon />}
                        sx={{ mr: 2 }}
                      />
                      <Chip 
                        label={course.active ? 'Actif' : 'Inactif'}
                        color={course.active ? 'success' : 'error'}
                        icon={course.active ? <CheckCircleIcon /> : <CancelIcon />}
                      />
                    </Box>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  {/* Description */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', display: 'flex', alignItems: 'center' }}>
                      <DescriptionIcon sx={{ mr: 1 }} />
                      Description
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                      {course.description || 'Aucune description disponible pour ce cours.'}
                    </Typography>
                  </Box>

                  {/* Détails académiques */}
                  <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', display: 'flex', alignItems: 'center' }}>
                    <CategoryIcon sx={{ mr: 1 }} />
                    Détails Académiques
                  </Typography>
                  
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <SchoolIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Niveau d'éducation"
                        secondary={getEducationLevelLabel(course.education_level)}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <AccessTimeIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Année scolaire"
                        secondary={course.school_year || 'Non spécifiée'}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <CategoryIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Domaine de matière"
                        secondary={getSubjectAreaLabel(course.subject_area)}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Informations complémentaires */}
            <Grid item xs={12} md={4}>
              {/* Statut et métadonnées */}
              <Card sx={{ boxShadow: 3, mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', display: 'flex', alignItems: 'center' }}>
                    <InfoIcon sx={{ mr: 1 }} />
                    Informations
                  </Typography>
                  
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="ID du cours"
                        secondary={course.id}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemText 
                        primary="Statut"
                        secondary={
                          <Chip 
                            label={course.active ? 'Actif' : 'Inactif'}
                            color={course.active ? 'success' : 'error'}
                            size="small"
                          />
                        }
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>

              {/* Actions rapides */}
              <Card sx={{ boxShadow: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                    Actions Rapides
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={handleEdit}
                    >
                      Modifier le cours
                    </Button>
                    
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      Supprimer le cours
                    </Button>
                    
                    <Divider />
                    
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<ArrowBackIcon />}
                      onClick={handleBack}
                    >
                      Retour à la liste
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
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

export default CourseDetail; 