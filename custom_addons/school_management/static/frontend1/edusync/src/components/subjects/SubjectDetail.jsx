import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
  Paper
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Book as BookIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  Grade as GradeIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import odooApi from '../../services/odooApi.jsx';

const SubjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subject, setSubject] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSubject();
    fetchSubjectTeachers();
  }, [id]);

  const fetchSubject = async () => {
    try {
      setLoading(true);
      const response = await odooApi.getSubject(id);
      console.log('📊 Données du sujet reçues:', response);
      
      // L'API retourne { status: 'success', data: {...} }
      if (response && response.data) {
        setSubject(response.data);
      } else {
        setError('Format de réponse API invalide');
      }
    } catch (err) {
      console.error('Erreur lors de la récupération de la matière:', err);
      setError('Erreur lors de la récupération de la matière');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjectTeachers = async () => {
    try {
      const data = await odooApi.getSubjectTeachers(id);
      setTeachers(data || []);
    } catch (err) {
      console.error('Erreur lors de la récupération des enseignants:', err);
      // Ne pas afficher d'erreur pour les enseignants, c'est optionnel
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette matière ?')) {
      try {
        await odooApi.deleteSubject(id);
        navigate('/subjects');
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
        setError('Erreur lors de la suppression de la matière');
      }
    }
  };

  const getStateColor = (state) => {
    const colors = {
      'draft': 'default',
      'planned': 'info',
      'ongoing': 'success',
      'done': 'secondary',
      'cancelled': 'error'
    };
    return colors[state] || 'default';
  };

  const getTypeColor = (type) => {
    const colors = {
      'theory': 'primary',
      'practical': 'secondary',
      'both': 'success',
      'other': 'default'
    };
    return colors[type] || 'default';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography>Chargement...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!subject) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="info">Matière non trouvée</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header avec navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/subjects')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Détails de la matière
        </Typography>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/subjects/${id}/edit`)}
          sx={{ mr: 2 }}
        >
          Modifier
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={handleDelete}
        >
          Supprimer
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Informations principales */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <BookIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h5" component="h2" gutterBottom>
                    {subject.name || 'Nom non défini'}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    Code: {subject.code || 'N/A'}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Description */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {subject.description || 'Aucune description disponible'}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Informations détaillées */}
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">Type</Typography>
                    </Box>
                    <Chip
                      label={subject.type_label || 'Tous les types'}
                      color={getTypeColor(subject.type)}
                      variant="outlined"
                    />
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">État</Typography>
                    </Box>
                    <Chip
                      label={subject.state_label || 'Tous les états'}
                      color={getStateColor(subject.state)}
                      variant="outlined"
                    />
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TimeIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">Durée</Typography>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {subject.duration || 0}h
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <GradeIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">Coefficient</Typography>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      Coeff. {subject.weight || 1}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Évaluation */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Évaluation
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Type:
                    </Typography>
                    <Typography variant="body1">
                      {subject.evaluation_type_label || 'Pas d\'évaluation'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Coefficient:
                    </Typography>
                    <Typography variant="body1">
                      {subject.weight || 1}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Note maximale:
                    </Typography>
                    <Typography variant="body1">
                      {subject.grade_weightage || 20}/20
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Ressources */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Ressources
                </Typography>
                <Typography variant="body1">
                  Exercices: {subject.has_exercises ? 'Oui' : 'Non'}
                </Typography>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Progression */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Progression
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  0%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Séquence: {subject.sequence || 10}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Panneau latéral */}
        <Grid item xs={12} md={4}>
          {/* Enseignants assignés */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1 }} />
                Enseignants assignés
              </Typography>
              
              {teachers.length > 0 ? (
                <List dense>
                  {teachers.map((teacher) => (
                    <ListItem 
                      key={teacher.id} 
                      divider
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/teachers/${teacher.id}`)}
                    >
                      <ListItemText
                        primary={teacher.name}
                        secondary={teacher.email || ''}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">
                  Aucun enseignant assigné
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Informations supplémentaires */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informations supplémentaires
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Type de contenu:
                </Typography>
                <Typography variant="body1">
                  {subject.content_type_label || 'Non défini'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Type de sujet:
                </Typography>
                <Typography variant="body1">
                  {subject.subject_type_label || 'Non défini'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Actif:
                </Typography>
                <Chip
                  label={subject.active ? 'Oui' : 'Non'}
                  color={subject.active ? 'success' : 'default'}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SubjectDetail; 