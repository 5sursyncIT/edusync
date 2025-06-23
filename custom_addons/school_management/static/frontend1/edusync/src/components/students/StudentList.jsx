import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import odooApi from '../../services/odooApi.jsx';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Chip,
  Tooltip,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Grid,
  Fade,
  Zoom,
  Stack,
  Container,
  Divider,
  Badge,
  Avatar
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

// Fonction utilitaire pour calculer l'âge
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

// Composant pour les statistiques en haut
const StatisticsCards = ({ totalCount, loading }) => {
  const stats = [
    {
      title: 'Total Étudiants',
      value: totalCount,
      icon: <SchoolIcon />,
      color: 'primary',
      bgColor: 'white'
    },
    {
      title: 'Nouveaux ce mois',
      value: '12',
      icon: <PersonIcon />,
      color: 'success',
      bgColor: 'white'
    },
    {
      title: 'Actifs',
      value: totalCount,
      icon: <SchoolIcon />,
      color: 'info',
      bgColor: 'white'
    }
  ];

  if (loading) {
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[1, 2, 3].map((i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Card sx={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Zoom in={true} timeout={300 + index * 100}>
            <Card 
              sx={{ 
                height: '120px',
                background: `linear-gradient(135deg, ${stat.bgColor} 0%, transparent 100%)`,
                border: `1px solid ${stat.bgColor}`,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                  border: `2px solid ${stat.bgColor}`,
                }
              }}
            >
              <CardContent sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Avatar
                    sx={{
                      bgcolor: stat.color + '.main',
                      width: 56,
                      height: 56,
                      mr: 2,
                      boxShadow: 3
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h4" fontWeight="bold" color={stat.color + '.main'}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight="medium">
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>
      ))}
    </Grid>
  );
};

const StudentList = () => {
  const navigate = useNavigate();
  
  // États pour la pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // États pour les données
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // États pour la recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDebounce, setSearchDebounce] = useState(null);
  
  // États pour la suppression
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fonction pour charger les étudiants
  const fetchStudents = async (pageNum = page, search = searchTerm) => {
    try {
      setLoading(true);
      setError(null);
      
      // Vérifier l'authentification
      const isAuthenticated = await odooApi.isAuthenticated();
      if (!isAuthenticated) {
        setError("Session expirée. Redirection vers la page de connexion...");
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      
      // Récupérer les étudiants
      const response = await odooApi.getStudents(pageNum, rowsPerPage, search);
      
      if (response && response.data && response.data.students && response.data.pagination) {
        setStudents(response.data.students);
        setTotalCount(response.data.pagination.total_count || response.data.pagination.total || 0);
        setTotalPages(response.data.pagination.total_pages || response.data.pagination.pages || 0);
      } else if (response.students && response.pagination) {
        setStudents(response.students);
        setTotalCount(response.pagination.total_count || response.pagination.total || 0);
        setTotalPages(response.pagination.total_pages || response.pagination.pages || 0);
      } else {
        console.warn('Format de réponse inattendu:', response);
        setStudents([]);
        setError("Format de données inattendu");
      }
      
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      
      if (err.message.includes('Session expirée') || err.message.includes('401')) {
        setError("Session expirée. Redirection vers la page de connexion...");
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(`Erreur: ${err.message}`);
      }
      
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage et lors des changements de page/recherche
  useEffect(() => {
    fetchStudents(page, searchTerm);
  }, [page, rowsPerPage]);

  // Gérer la recherche avec debounce
  useEffect(() => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    
    const timeout = setTimeout(() => {
      setPage(1);
      fetchStudents(1, searchTerm);
    }, 500);
    
    setSearchDebounce(timeout);
    
    return () => {
      if (searchDebounce) {
        clearTimeout(searchDebounce);
      }
    };
  }, [searchTerm]);

  // Gérer le changement de page
  const handleChangePage = (event, newPage) => {
    setPage(newPage + 1);
  };

  // Gérer le changement de nombre de lignes par page
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  // Gérer la recherche
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  // Rafraîchir la liste
  const handleRefresh = () => {
    fetchStudents(page, searchTerm);
  };

  // Navigation vers les différentes pages
  const handleAddStudent = () => {
    navigate('/dashboard/students/new');
  };

  const handleEditStudent = (id) => {
    navigate(`/dashboard/students/${id}/edit`);
  };

  const handleViewStudent = (id) => {
    navigate(`/dashboard/students/${id}`);
  };

  // Gestion de la suppression
  const handleDeleteConfirmation = (student) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setStudentToDelete(null);
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    
    try {
      setDeleting(true);
      
      const response = await odooApi.deleteStudent(studentToDelete.id);
      
      if (response.status === 'success') {
        setSuccessMessage(response.message || 'Étudiant supprimé avec succès');
        fetchStudents(page, searchTerm);
      }
      
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError(`Erreur lors de la suppression: ${err.message}`);
    } finally {
      setDeleting(false);
      handleCloseDeleteDialog();
    }
  };

  // Formater le genre pour l'affichage
  const formatGender = (gender) => {
    switch (gender) {
      case 'm':
      case 'male':
        return 'Masculin';
      case 'f':
      case 'female':
        return 'Féminin';
      default:
        return gender || 'Non spécifié';
    }
  };

  // Formater la date pour l'affichage
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    } catch (error) {
      return dateString;
    }
  };

  // Obtenir la couleur selon l'âge
  const getAgeColor = (age) => {
    if (age < 12) return 'info';
    if (age < 16) return 'primary';
    if (age < 18) return 'warning';
    return 'success';
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Fade in={true} timeout={500}>
        <Box>
          {/* En-tête avec titre et actions */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 4,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 3, sm: 0 }
          }}>
            <Box>
              <Typography 
                variant="h4" 
                fontWeight="bold" 
                color="blue"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2,
                  mb: 1
                }}
              >
                <SchoolIcon sx={{ fontSize: 45 }} />
                Gestion des Étudiants
              </Typography>
              <Typography variant="h6" color="text.secondary">
                      Gérez votre liste d'étudiants facilement
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={2}>
              <Tooltip title="Actualiser la liste">
                <IconButton
                  color="blue"
                  onClick={handleRefresh}
                  disabled={loading}
                  sx={{ 
                    bgcolor: 'blue',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.main' }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                onClick={handleAddStudent}
                size="large"
                sx={{ 
                  px: 2, 
                  py: 1,
                  borderRadius: 3,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  boxShadow: 3,
                  color: 'blue',
                  background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                  '&:hover': {
                    boxShadow: 8,
                    transform: 'translateY(-2px)',
                  }
                }}
              >
                Nouvel Étudiant
              </Button>
            </Stack>
          </Box>

          {/* Cartes de statistiques */}
          <StatisticsCards totalCount={totalCount} loading={loading} />

          {/* Barre de recherche améliorée */}
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              mb: 3, 
              borderRadius: 3,
              background: 'white'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SearchIcon color="primary" sx={{ fontSize: 28 }} />
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Rechercher un étudiant par nom, email ou téléphone..."
                value={searchTerm}
                onChange={handleSearch}
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    bgcolor: 'white',
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  }
                }}
                InputProps={{
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setSearchTerm('')} size="small">
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Badge badgeContent={totalCount} color="primary" max={999}>
                <FilterIcon color="action" />
              </Badge>
            </Box>
          </Paper>

          {/* Messages d'erreur */}
          {error && (
            <Fade in={true}>
              <Alert 
                severity="error" 
                sx={{ mb: 3, borderRadius: 2 }} 
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            </Fade>
          )}

          {/* Tableau principal */}
          <Paper 
            elevation={4} 
            sx={{ 
              borderRadius: 3, 
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
            }}
          >
            {loading ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center', 
                alignItems: 'center', 
                height: 400,
                gap: 2
              }}>
                <CircularProgress size={48} thickness={4} />
                <Typography variant="h6" color="text.secondary">
                  Chargement des étudiants...
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer sx={{ maxHeight: 600 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        {[
                          { label: 'Étudiant', icon: <PersonIcon /> },
                          { label: 'Email', icon: <EmailIcon /> },
                          { label: 'Téléphone', icon: <PhoneIcon /> },
                          { label: 'Genre', icon: null },
                          { label: 'Naissance', icon: <CalendarIcon /> },
                          { label: 'Âge', icon: null },
                          { label: 'Actions', icon: null }
                        ].map((col, index) => (
                          <TableCell 
                            key={index}
                            sx={{ 
                              fontWeight: 'bold',
                              fontSize: '1rem',
                              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                              color: 'blue',
                              textAlign: index === 6 ? 'center' : 'left'
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {col.icon}
                              {col.label}
                            </Box>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {students.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                              <SchoolIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                              <Typography variant="h6" color="text.secondary">
                                {searchTerm ? 'Aucun étudiant trouvé pour cette recherche' : 'Aucun étudiant enregistré'}
                              </Typography>
                              {!searchTerm && (
                                <Button
                                  variant="contained"
                                  startIcon={<AddIcon />}
                                  onClick={handleAddStudent}
                                  sx={{ mt: 2 }}
                                >
                                  Ajouter le premier étudiant
                                </Button>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ) : (
                        students.map((student, index) => (
                          <Fade in={true} timeout={300 + index * 50} key={student.id}>
                            <TableRow 
                              hover 
                              sx={{ 
                                '&:nth-of-type(odd)': { 
                                  bgcolor: 'rgba(0, 0, 0, 0.02)' 
                                },
                                '&:hover': {
                                  bgcolor: 'rgba(25, 118, 210, 0.08)',
                                  transform: 'scale(1.002)',
                                },
                                transition: 'all 0.2s ease-in-out',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleViewStudent(student.id)}
                            >
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Avatar 
                                    sx={{ 
                                      bgcolor: 'primary.main',
                                      width: 40,
                                      height: 40,
                                      fontSize: '1.2rem',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    {student.name ? student.name.charAt(0).toUpperCase() : 'E'}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="subtitle1" fontWeight="bold">
                                      {student.name || '-'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      ID: {student.id}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              
                              <TableCell>
                                <Typography variant="body2">
                                  {student.email || '-'}
                                </Typography>
                              </TableCell>
                              
                              <TableCell>
                                <Typography variant="body2">
                                  {student.phone || '-'}
                                </Typography>
                              </TableCell>
                              
                              <TableCell>
                                <Chip 
                                  label={formatGender(student.gender)} 
                                  size="small"
                                  color={student.gender === 'm' || student.gender === 'male' ? 'primary' : 'secondary'}
                                  variant="outlined"
                                  sx={{ 
                                    fontWeight: 'bold',
                                    borderRadius: 2
                                  }}
                                />
                              </TableCell>
                              
                              <TableCell>
                                <Typography variant="body2">
                                  {formatDate(student.birth_date)}
                                </Typography>
                              </TableCell>
                              
                              <TableCell>
                                {student.birth_date && (
                                  <Chip 
                                    label={`${calculerAge(student.birth_date)} ans`}
                                    size="small"
                                    color={getAgeColor(calculerAge(student.birth_date))}
                                    variant="outlined"
                                    sx={{ fontWeight: 'bold' }}
                                  />
                                )}
                              </TableCell>
                              
                              <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                <Stack direction="row" spacing={1} justifyContent="center">
                                  <Tooltip title="Voir détails">
                                    <IconButton 
                                      size="small" 
                                      color="info"
                                      onClick={() => handleViewStudent(student.id)}
                                      sx={{ 
                                        '&:hover': { 
                                          bgcolor: 'info.light',
                                          color: 'white'
                                        }
                                      }}
                                    >
                                      <VisibilityIcon />
                                    </IconButton>
                                  </Tooltip>
                                  
                                  <Tooltip title="Modifier">
                                    <IconButton 
                                      size="small" 
                                      color="primary" 
                                      onClick={() => handleEditStudent(student.id)}
                                      sx={{ 
                                        '&:hover': { 
                                          bgcolor: 'primary.light',
                                          color: 'white'
                                        }
                                      }}
                                    >
                                      <EditIcon />
                                    </IconButton>
                                  </Tooltip>
                                  
                                  <Tooltip title="Supprimer">
                                    <span>
                                      <IconButton 
                                        size="small" 
                                        color="error" 
                                        onClick={() => handleDeleteConfirmation(student)}
                                        disabled={deleting}
                                        sx={{ 
                                          '&:hover': { 
                                            bgcolor: 'error.light',
                                            color: 'white'
                                          }
                                        }}
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          </Fade>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {students.length > 0 && (
                  <Box sx={{ 
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'rgba(0, 0, 0, 0.02)'
                  }}>
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25, 50]}
                      component="div"
                      count={totalCount}
                      rowsPerPage={rowsPerPage}
                      page={page - 1}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      labelRowsPerPage="Lignes par page"
                      labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
                      sx={{
                        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                          fontWeight: 'bold'
                        }
                      }}
                    />
                  </Box>
                )}
              </>
            )}
          </Paper>

          {/* Boîte de dialogue de confirmation de suppression */}
          <Dialog
            open={deleteDialogOpen}
            onClose={handleCloseDeleteDialog}
            PaperProps={{
              sx: { 
                borderRadius: 3,
                minWidth: 400
              }
            }}
          >
            <DialogTitle sx={{ 
              bgcolor: 'error.light', 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <DeleteIcon />
              Confirmer la suppression
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <DialogContentText sx={{ fontSize: '1.1rem' }}>
                Êtes-vous sûr de vouloir supprimer l'étudiant{' '}
                <Typography component="span" fontWeight="bold" color="text.primary">
                  {studentToDelete?.name}
                </Typography>{' '}
                ?
                <br />
                <Typography component="span" color="error" fontWeight="bold">
                  Cette action est irréversible.
                </Typography>
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ p: 3, gap: 2 }}>
              <Button 
                onClick={handleCloseDeleteDialog} 
                disabled={deleting}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleDeleteStudent} 
                color="error" 
                variant="contained" 
                autoFocus
                disabled={deleting}
                startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
                sx={{ borderRadius: 2 }}
              >
                {deleting ? 'Suppression...' : 'Supprimer'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Snackbar pour les messages de succès */}
          <Snackbar
            open={!!successMessage}
            autoHideDuration={4000}
            onClose={() => setSuccessMessage('')}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert 
              severity="success" 
              onClose={() => setSuccessMessage('')}
              sx={{ borderRadius: 2 }}
            >
              {successMessage}
            </Alert>
          </Snackbar>
        </Box>
      </Fade>
    </Container>
  );
};

export default StudentList;