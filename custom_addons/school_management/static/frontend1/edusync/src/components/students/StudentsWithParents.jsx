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
  CircularProgress,
  Chip,
  Tooltip,
  Alert,
  Card,
  CardContent,
  Grid,
  Fade,
  Zoom,
  Stack,
  Container,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  People as PeopleIcon,
  FamilyRestroom as FamilyIcon,
  ExpandMore as ExpandMoreIcon,
  ContactPhone as ContactPhoneIcon,
  AccountCircle as AccountCircleIcon
} from '@mui/icons-material';

// Composant pour afficher les informations d'un parent
const ParentInfo = ({ parent }) => (
  <Card variant="outlined" sx={{ mb: 1, bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
    <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Avatar sx={{ width: 24, height: 24, bgcolor: 'secondary.main', fontSize: '0.8rem' }}>
          {parent.name ? parent.name.charAt(0).toUpperCase() : 'P'}
        </Avatar>
        <Typography variant="subtitle2" fontWeight="bold">
          {parent.name || 'Nom non renseigné'}
        </Typography>
        {parent.relationship && (
          <Chip 
            label={parent.relationship} 
            size="small" 
            color="primary" 
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: 20 }}
          />
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {parent.mobile && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PhoneIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {parent.mobile}
            </Typography>
          </Box>
        )}
        {parent.email && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <EmailIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {parent.email}
            </Typography>
          </Box>
        )}
        {parent.has_portal_access && (
          <Chip 
            label="Accès Portal" 
            size="small" 
            color="success" 
            variant="filled"
            sx={{ fontSize: '0.6rem', height: 16 }}
          />
        )}
      </Box>
    </CardContent>
  </Card>
);

// Composant pour les statistiques en haut
const StatisticsCards = ({ totalCount, studentsWithParents, studentsWithoutParents, loading }) => {
  const stats = [
    {
      title: 'Total Étudiants',
      value: totalCount,
      icon: <SchoolIcon />,
      color: 'primary',
      bgColor: 'primary.light'
    },
    {
      title: 'Avec Parents',
      value: studentsWithParents,
      icon: <FamilyIcon />,
      color: 'success',
      bgColor: 'success.light'
    },
    {
      title: 'Sans Parents',
      value: studentsWithoutParents,
      icon: <PersonIcon />,
      color: 'warning',
      bgColor: 'warning.light'
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
                background: `linear-gradient(135deg, ${stat.bgColor} 0%, white 100%)`,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
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

const StudentsWithParents = () => {
  const navigate = useNavigate();
  
  // États pour la pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // États pour les données
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États pour la recherche
  const [searchTerm, setSearchTerm] = useState('');
  
  // États pour les statistiques
  const [studentsWithParents, setStudentsWithParents] = useState(0);
  const [studentsWithoutParents, setStudentsWithoutParents] = useState(0);

  // Fonction pour charger les étudiants avec parents
  const fetchStudentsWithParents = async (pageNum = page, search = searchTerm) => {
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
      
      // Récupérer les étudiants avec leurs parents
      const response = await odooApi.getStudentsWithParents(pageNum, rowsPerPage, search);
      
      if (response && response.students && response.pagination) {
        setStudents(response.students);
        setTotalCount(response.pagination.total || 0);
        
        // Calculer les statistiques
        const withParents = response.students.filter(student => student.has_parents).length;
        const withoutParents = response.students.filter(student => !student.has_parents).length;
        setStudentsWithParents(withParents);
        setStudentsWithoutParents(withoutParents);
      } else {
        console.error('Format de réponse invalide:', response);
        setError('Format de réponse invalide du serveur');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des étudiants:', error);
      setError(error.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage et lors des changements
  useEffect(() => {
    fetchStudentsWithParents();
  }, [page, rowsPerPage]);

  // Effet pour la recherche avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchStudentsWithParents(1, searchTerm);
      } else {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage + 1);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleRefresh = () => {
    fetchStudentsWithParents();
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
                color="primary"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2,
                  mb: 1
                }}
              >
                <FamilyIcon sx={{ fontSize: 45 }} />
                Étudiants et Parents
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Gérez les relations étudiants-parents
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={2}>
              <Tooltip title="Actualiser la liste">
                <IconButton
                  color="primary"
                  onClick={handleRefresh}
                  disabled={loading}
                  sx={{ 
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              
              <Button 
                variant="contained" 
                color="secondary" 
                startIcon={<PeopleIcon />}
                onClick={() => navigate('/parents')}
                size="large"
                sx={{ 
                  px: 2, 
                  py: 1,
                  borderRadius: 3,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  boxShadow: 3,
                  '&:hover': {
                    boxShadow: 8,
                    transform: 'translateY(-2px)',
                  }
                }}
              >
                Gérer Parents
              </Button>
            </Stack>
          </Box>

          {/* Cartes de statistiques */}
          <StatisticsCards 
            totalCount={totalCount}
            studentsWithParents={studentsWithParents}
            studentsWithoutParents={studentsWithoutParents}
            loading={loading} 
          />

          {/* Barre de recherche */}
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
                placeholder="Rechercher un étudiant ou un parent..."
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
                <FamilyIcon color="action" />
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
                  Chargement des étudiants et parents...
                </Typography>
              </Box>
            ) : (
              <>
                <TableContainer sx={{ maxHeight: 800 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        {[
                          { label: 'Étudiant', icon: <PersonIcon /> },
                          { label: 'Contact Étudiant', icon: <ContactPhoneIcon /> },
                          { label: 'Parents', icon: <FamilyIcon /> },
                          { label: 'Statut Parents', icon: <PeopleIcon /> }
                        ].map((col, index) => (
                          <TableCell 
                            key={index}
                            sx={{ 
                              fontWeight: 'bold',
                              fontSize: '1rem',
                              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                              color: 'primary.main',
                              minWidth: index === 2 ? 300 : 'auto'
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
                          <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                              <FamilyIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                              <Typography variant="h6" color="text.secondary">
                                {searchTerm ? 'Aucun étudiant trouvé pour cette recherche' : 'Aucun étudiant enregistré'}
                              </Typography>
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
                                },
                                transition: 'all 0.2s ease-in-out'
                              }}
                            >
                              {/* Colonne Étudiant */}
                              <TableCell sx={{ minWidth: 200 }}>
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
                                      ID: {student.id} {student.gr_no && `• ${student.gr_no}`}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              
                              {/* Colonne Contact Étudiant */}
                              <TableCell sx={{ minWidth: 200 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  {student.email && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                      <Typography variant="body2">
                                        {student.email}
                                      </Typography>
                                    </Box>
                                  )}
                                  {student.mobile && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                      <Typography variant="body2">
                                        {student.mobile}
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              </TableCell>
                              
                              {/* Colonne Parents */}
                              <TableCell sx={{ minWidth: 300 }}>
                                {student.parents && student.parents.length > 0 ? (
                                  <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                                    {student.parents.map((parent, parentIndex) => (
                                      <ParentInfo key={parentIndex} parent={parent} />
                                    ))}
                                  </Box>
                                ) : (
                                  <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 1,
                                    p: 2,
                                    bgcolor: 'warning.light',
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'warning.main'
                                  }}>
                                    <PersonIcon color="warning" />
                                    <Typography variant="body2" color="warning.dark" fontWeight="bold">
                                      Aucun parent enregistré
                                    </Typography>
                                  </Box>
                                )}
                              </TableCell>
                              
                              {/* Colonne Statut Parents */}
                              <TableCell sx={{ minWidth: 150 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  <Chip 
                                    label={student.has_parents ? 'Avec Parents' : 'Sans Parents'}
                                    color={student.has_parents ? 'success' : 'warning'}
                                    variant="filled"
                                    size="small"
                                    icon={student.has_parents ? <FamilyIcon /> : <PersonIcon />}
                                  />
                                  {student.parents && student.parents.length > 0 && (
                                    <Typography variant="caption" color="text.secondary">
                                      {student.parents.length} parent{student.parents.length > 1 ? 's' : ''}
                                    </Typography>
                                  )}
                                  {student.primary_parent && (
                                    <Typography variant="caption" color="primary" fontWeight="bold">
                                      Principal: {student.primary_parent.name}
                                    </Typography>
                                  )}
                                </Box>
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
        </Box>
      </Fade>
    </Container>
  );
};

export default StudentsWithParents; 