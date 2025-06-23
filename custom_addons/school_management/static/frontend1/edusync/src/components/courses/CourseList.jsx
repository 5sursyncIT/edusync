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
  Book as BookIcon,
  School as SchoolIcon,
  Category as CategoryIcon,
  FilterList as FilterIcon,
  Code as CodeIcon
} from '@mui/icons-material';

// Composant pour les statistiques en haut
const StatisticsCards = ({ totalCount, loading }) => {
  const stats = [
    {
      title: 'Total Cours',
      value: totalCount,
      icon: <BookIcon />,
      color: 'primary',
      bgColor: 'white'
    },
    {
      title: 'Nouveaux ce mois',
      value: '5',
      icon: <SchoolIcon />,
      color: 'success',
      bgColor: 'white'
    },
    {
      title: 'Actifs',
      value: totalCount,
      icon: <CategoryIcon />,
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

const CourseList = () => {
  const navigate = useNavigate();
  
  // États pour la pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // États pour les données
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // États pour la recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDebounce, setSearchDebounce] = useState(null);
  
  // États pour la suppression
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fonction pour charger les cours
  const fetchCourses = async (pageNum = page, search = searchTerm) => {
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
      
      // Récupérer les cours
      const response = await odooApi.getCourses(pageNum, rowsPerPage, search);
      
      if (response && response.data && response.data.courses && response.data.pagination) {
        setCourses(response.data.courses);
        setTotalCount(response.data.pagination.total_count || response.data.pagination.total || 0);
        setTotalPages(response.data.pagination.pages || 0);
        setPage(response.data.pagination.page || 1);
      } else {
        console.error('Format de réponse API inattendu:', response);
        setError('Format de données inattendu');
        setCourses([]);
        setTotalCount(0);
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement des cours:', error);
      setError(`Erreur lors du chargement des cours: ${error.message}`);
      setCourses([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Chargement initial
  useEffect(() => {
    fetchCourses(1, '');
  }, []);

  // Gestion du debounce pour la recherche
  useEffect(() => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    
    const timeout = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchCourses(1, searchTerm);
      }
    }, 500);
    
    setSearchDebounce(timeout);
    
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [searchTerm]);

  // Gestionnaires d'événements
  const handleChangePage = (event, newPage) => {
    const actualPage = newPage + 1; // MUI utilise 0-indexed, notre API utilise 1-indexed
    fetchCourses(actualPage, searchTerm);
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    fetchCourses(1, searchTerm); // Retour à la première page
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleRefresh = () => {
    fetchCourses(page, searchTerm);
  };

  const handleAddCourse = () => {
    navigate('/courses/new');
  };

  const handleEditCourse = (id) => {
    navigate(`/courses/${id}/edit`);
  };

  const handleViewCourse = (id) => {
    navigate(`/courses/${id}`);
  };

  const handleDeleteConfirmation = (course) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setCourseToDelete(null);
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    
    try {
      setDeleting(true);
      await odooApi.deleteCourse(courseToDelete.id);
      setSuccessMessage(`Cours "${courseToDelete.name}" supprimé avec succès`);
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
      fetchCourses(page, searchTerm); // Recharger la liste
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setError(`Erreur lors de la suppression: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccessMessage('');
  };

  // Fonction pour formater le statut actif
  const formatActiveStatus = (active) => {
    return active ? 'Actif' : 'Inactif';
  };

  const getActiveColor = (active) => {
    return active ? 'success' : 'error';
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Fade in={true} timeout={600}>
        <Box>
          {/* En-tête avec titre et bouton d'ajout */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 4,
            background: 'white',
            color: 'blue',
            p: 3,
            borderRadius: 2,
            boxShadow: 3
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <BookIcon sx={{ fontSize: 40, mr: 2 }} />
              <Box>
                <Typography variant="h4" component="h1" fontWeight="bold">
                  Gestion des Cours
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  Gérez tous les cours et programmes d'études
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddCourse}
              size="large"
              sx={{
                bgcolor: 'blue',
                '&:hover': {
                  bgcolor: 'primary.main'
                }
              }}
            >
              Nouveau Cours
            </Button>
          </Box>

          {/* Cartes de statistiques */}
          <StatisticsCards totalCount={totalCount} loading={loading} />

          {/* Barre de recherche et actions */}
          <Paper sx={{ p: 2, mb: 3, background: 'white' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <TextField
                placeholder="Rechercher un cours..."
                value={searchTerm}
                onChange={handleSearch}
                size="small"
                sx={{ 
                  flexGrow: 1, 
                  minWidth: 300,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'white',
                    '&:hover': {
                      boxShadow: 2,
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={loading}
                sx={{
                  bgcolor: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                  }
                }}
              >
                Actualiser
              </Button>
            </Stack>
          </Paper>

          {/* Tableau des cours */}
          <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 3 }}>
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      bgcolor: 'primary.main', 
                      color: 'primary.contrastText',
                      minWidth: 60
                    }}>
                      ID
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      bgcolor: 'primary.main', 
                      color: 'primary.contrastText',
                      minWidth: 180
                    }}>
                      Nom du Cours
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      bgcolor: 'primary.main', 
                      color: 'primary.contrastText',
                      minWidth: 120
                    }}>
                      Code
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      bgcolor: 'primary.main', 
                      color: 'primary.contrastText',
                      minWidth: 200
                    }}>
                      Description
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      bgcolor: 'primary.main', 
                      color: 'primary.contrastText',
                      minWidth: 100
                    }}>
                      Statut
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold', 
                      bgcolor: 'primary.main', 
                      color: 'primary.contrastText',
                      minWidth: 150
                    }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <CircularProgress size={40} />
                        <Typography variant="body2" sx={{ mt: 2 }}>
                          Chargement des cours...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : courses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <BookIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                          {searchTerm ? 'Aucun cours trouvé pour cette recherche' : 'Aucun cours disponible'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {!searchTerm && 'Commencez par ajouter votre premier cours'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    courses.map((course, index) => (
                      <TableRow 
                        key={course.id} 
                        hover
                        sx={{ 
                          '&:nth-of-type(odd)': { 
                            bgcolor: 'action.hover' 
                          },
                          '&:hover': {
                            bgcolor: 'primary.light',
                            '& .MuiTableCell-root': {
                              color: 'primary.contrastText'
                            }
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <TableCell>
                          <Badge 
                            badgeContent={course.id} 
                            color="primary"
                            anchorOrigin={{
                              vertical: 'top',
                              horizontal: 'right',
                            }}
                          >
                            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                              <BookIcon sx={{ fontSize: 18 }} />
                            </Avatar>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {course.name || 'Sans nom'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={course.code || 'N/A'}
                            variant="outlined"
                            size="small"
                            icon={<CodeIcon />}
                            color="primary"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title={course.description || 'Aucune description'}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                maxWidth: 200,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {course.description || 'Aucune description'}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={formatActiveStatus(course.active)}
                            color={getActiveColor(course.active)}
                            size="small"
                            variant="filled"
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="Voir les détails">
                              <IconButton
                                size="small"
                                onClick={() => handleViewCourse(course.id)}
                                sx={{ 
                                  color: 'info.main',
                                  '&:hover': { bgcolor: 'info.light', color: 'white' }
                                }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Modifier">
                              <IconButton
                                size="small"
                                onClick={() => handleEditCourse(course.id)}
                                sx={{ 
                                  color: 'warning.main',
                                  '&:hover': { bgcolor: 'warning.light', color: 'white' }
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Supprimer">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteConfirmation(course)}
                                sx={{ 
                                  color: 'error.main',
                                  '&:hover': { bgcolor: 'error.light', color: 'white' }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Pagination */}
            {!loading && courses.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={totalCount}
                rowsPerPage={rowsPerPage}
                page={page - 1} // MUI utilise 0-indexed
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Lignes par page:"
                labelDisplayedRows={({ from, to, count }) => 
                  `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
                }
                sx={{
                  borderTop: 1,
                  borderColor: 'divider',
                  bgcolor: 'grey.50'
                }}
              />
            )}
          </Paper>
        </Box>
      </Fade>

      {/* Dialog de confirmation de suppression */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Confirmer la suppression
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer le cours "{courseToDelete?.name}" ?
            Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCloseDeleteDialog}
            variant="outlined"
            disabled={deleting}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleDeleteCourse}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {deleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default CourseList; 