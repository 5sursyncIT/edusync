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
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useTeacher } from '../../hooks/useOdoo';
import odooApi from '../../services/odooApi.jsx';

const TeacherDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Utiliser le nouveau hook useTeacher
  const { teacher, loading, error, refetch } = useTeacher(id);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    if (teacher) {
      fetchTeacherSubjects();
    }
  }, [teacher]);

  const fetchTeacherSubjects = async () => {
    try {
      const data = await odooApi.getTeacherSubjects(id);
      setSubjects(data || []);
    } catch (err) {
      console.error('Erreur lors de la récupération des matières:', err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet enseignant ?')) {
      try {
        await odooApi.deleteTeacher(id);
        navigate('/teachers');
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
        // Optionnel: afficher un message d'erreur à l'utilisateur
      }
    }
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

  if (!teacher) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="info">Enseignant non trouvé</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header avec navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/teachers')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Détails de l'enseignant
        </Typography>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/teachers/${id}/edit`)}
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
                <Avatar
                  sx={{ width: 80, height: 80, mr: 3, bgcolor: 'primary.main' }}
                >
                  <PersonIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Box>
                  <Typography variant="h5" component="h2" gutterBottom>
                    {teacher.name}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    {teacher.employee_id && `ID: ${teacher.employee_id}`}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <EmailIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography>
                      <strong>Email:</strong> {teacher.email || 'Non renseigné'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PhoneIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography>
                      <strong>Téléphone:</strong> {teacher.phone || 'Non renseigné'}
                    </Typography>
                  </Box>
                </Grid>
                {teacher.department && (
                  <Grid item xs={12} sm={6}>
                    <Typography>
                      <strong>Département:</strong> {teacher.department}
                    </Typography>
                  </Grid>
                )}
                {teacher.specialization && (
                  <Grid item xs={12} sm={6}>
                    <Typography>
                      <strong>Spécialisation:</strong> {teacher.specialization}
                    </Typography>
                  </Grid>
                )}
                {teacher.hire_date && (
                  <Grid item xs={12} sm={6}>
                    <Typography>
                      <strong>Date d'embauche:</strong> {new Date(teacher.hire_date).toLocaleDateString()}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {teacher.bio && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Biographie
                  </Typography>
                  <Typography variant="body1">
                    {teacher.bio}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Matières enseignées */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <SchoolIcon sx={{ mr: 1 }} />
                Matières enseignées
              </Typography>
              
              {subjects.length > 0 ? (
                <List dense>
                  {subjects.map((subject) => (
                    <ListItem key={subject.id} divider>
                      <ListItemText
                        primary={subject.name}
                        secondary={subject.code ? `Code: ${subject.code}` : ''}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">
                  Aucune matière assignée
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Statut */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statut
              </Typography>
              <Chip
                label={teacher.active ? 'Actif' : 'Inactif'}
                color={teacher.active ? 'success' : 'default'}
                variant="outlined"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeacherDetail;
