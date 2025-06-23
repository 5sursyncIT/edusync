import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Avatar,
  Fade,
  Stack,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Button,
  Pagination,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  Book, 
  User, 
  Calendar, 
  Clock, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  X,
  Plus,
  ArrowLeft
} from 'lucide-react';
import { useBorrowings } from '../../hooks/useLibrary';
import SessionHelper from './SessionHelper';
import BorrowBookForm from './BorrowBookForm';

const BorrowingsList = ({ onShowBorrowForm, onBack }) => {
  const { borrowings, loading, error, fetchBorrowings, returnBook } = useBorrowings();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Debounce pour la recherche textuelle
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Effet pour debouncer la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Charger les emprunts quand les filtres changent
  useEffect(() => {
    loadBorrowings();
  }, [statusFilter, debouncedSearchTerm, currentPage]);

  const loadBorrowings = useCallback(() => {
    console.log('🔍 BorrowingsList: Chargement avec filtres:', { 
      statusFilter, 
      searchTerm: debouncedSearchTerm, 
      currentPage 
    });
    
    const params = {
      page: currentPage,
      limit: itemsPerPage,
      // Transmettre le filtre de statut à l'API si différent de 'all'
      ...(statusFilter !== 'all' && { state: statusFilter }),
      // Transmettre la recherche textuelle à l'API
      ...(debouncedSearchTerm.trim() && { search: debouncedSearchTerm.trim() })
    };
    
    fetchBorrowings(params);
  }, [statusFilter, debouncedSearchTerm, currentPage, itemsPerPage, fetchBorrowings]);

  const handleReturn = async (borrowingId) => {
    if (window.confirm('Confirmer le retour de ce livre ?')) {
      try {
        const result = await returnBook(borrowingId);
        if (result && result.success) {
          await loadBorrowings();
        }
      } catch (err) {
        console.error('Erreur lors du retour:', err);
      }
    }
  };

  // Supprimer le filtrage côté client car maintenant fait côté API
  const currentBorrowings = borrowings;
  const totalPages = Math.ceil((borrowings.length || 0) / itemsPerPage);

  // Gérer le changement de filtre de statut
  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setCurrentPage(1); // Réinitialiser à la première page
  };

  // Gérer le changement de terme de recherche
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Réinitialiser à la première page
  };

  const getStatusInfo = (borrowing) => {
    const borrowDate = new Date(borrowing.issued_date);
    const returnDate = new Date(borrowing.return_date);
    const today = new Date();
    
    if (borrowing.actual_return_date) {
      return {
        status: 'returned',
        label: 'Retourné',
        color: 'success',
        bgColor: '#e8f5e8',
        textColor: '#2e7d32',
        icon: CheckCircle
      };
    } else if (borrowing.is_overdue) {
      return {
        status: 'overdue',
        label: 'En retard',
        color: 'error',
        bgColor: '#ffebee',
        textColor: '#d32f2f',
        icon: AlertCircle
      };
    } else {
      return {
        status: 'borrowed',
        label: 'Emprunté',
        color: 'primary',
        bgColor: '#e3f2fd',
        textColor: '#1976d2',
        icon: Clock
      };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const BorrowingCard = ({ borrowing }) => {
    const statusInfo = getStatusInfo(borrowing);
    const StatusIcon = statusInfo.icon;

    return (
      <Fade in={true} timeout={300}>
        <Card 
          elevation={3}
          sx={{ 
            borderRadius: 3,
            border: '1px solid #e3f2fd',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 6,
              borderColor: '#bbdefb'
            }
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={3} alignItems="center">
              {/* Avatar et informations principales */}
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                      width: 50,
                      height: 50,
                      bgcolor: 'primary.light',
                      color: 'primary.contrastText',
                      mr: 2,
                      fontSize: '1.2rem',
                      fontWeight: 'bold'
                  }}
                >
                    {borrowing.student?.name?.charAt(0)?.toUpperCase() || 'E'}
                </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
                      {borrowing.student?.name || 'Étudiant inconnu'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ID: {borrowing.student?.id || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
                
                {/* Informations du livre */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  bgcolor: 'grey.50',
                  p: 2,
                  borderRadius: 2,
                  mb: 2
                }}>
                  <Book className="w-5 h-5" style={{ color: '#666', marginRight: '8px' }} />
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      {borrowing.book?.title || 'Livre inconnu'}
                  </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ID: {borrowing.book?.id || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Statut et actions */}
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  height: '100%',
                  justifyContent: 'space-between'
                }}>
                  <Chip
                    icon={<StatusIcon className="w-4 h-4" />}
                    label={statusInfo.label}
                    sx={{
                      bgcolor: statusInfo.bgColor,
                      color: statusInfo.textColor,
                      fontWeight: 'bold',
                      mb: 2,
                      px: 2,
                      py: 1
                    }}
                  />

                  {borrowing.state === 'issue' && (
                <Button
                  variant="contained"
                  color="success"
                      startIcon={<CheckCircle />}
                  onClick={() => handleReturn(borrowing.id)}
                  sx={{ 
                        borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 'bold',
                    px: 3
                  }}
                >
                  Marquer comme retourné
                </Button>
              )}
            </Box>
              </Grid>
            </Grid>

            {/* Dates */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Date d'emprunt:
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {formatDate(borrowing.issued_date)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Retour prévu:
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {formatDate(borrowing.return_date)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Retour effectif:
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {borrowing.actual_return_date ? formatDate(borrowing.actual_return_date) : 'Non retourné'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Fade>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress size={40} />
          <Typography variant="h6" sx={{ ml: 2 }} color="text.secondary">
            Chargement des emprunts...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Fade in={true} timeout={500}>
        <Box>
          {/* Header */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 4,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 3, sm: 0 }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title="Retour">
                <IconButton
                  onClick={onBack}
                  sx={{ 
                    mr: 2,
                    color: 'text.secondary',
                    '&:hover': { 
                      color: 'primary.main',
                      bgcolor: 'primary.light'
                    }
                  }}
                >
                  <ArrowLeft className="w-5 h-5" />
                </IconButton>
              </Tooltip>
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
                  <Book className="w-8 h-8" />
                  Gestion des emprunts
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  {currentBorrowings.length} emprunt(s) trouvé(s)
                </Typography>
              </Box>
            </Box>
            
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<Plus />}
              onClick={() => onShowBorrowForm && onShowBorrowForm()}
              size="large"
              sx={{ 
                px: 3, 
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold',
                boxShadow: 3,
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-2px)',
                }
              }}
            >
              Nouvel emprunt
            </Button>
          </Box>

          {/* Filters */}
          <Paper 
            elevation={2} 
            sx={{ 
              mb: 4, 
              p: 3,
              borderRadius: 2,
              border: '1px solid #e3f2fd'
            }}
          >
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Rechercher par étudiant ou livre..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  variant="outlined"
                  size="medium"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search className="w-5 h-5" style={{ color: '#666' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Statut</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Statut"
                    onChange={handleStatusFilterChange}
                    size="medium"
                  >
                    <MenuItem value="all">Tous les statuts</MenuItem>
                    <MenuItem value="issue">Emprunté</MenuItem>
                    <MenuItem value="return">Retourné</MenuItem>
                    <MenuItem value="overdue">En retard</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshCw />}
                  onClick={loadBorrowings}
                  size="large"
                  fullWidth
                  sx={{ 
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 'bold'
                  }}
                >
                  Actualiser
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Error message */}
          {error && (
            <Fade in={true}>
              <Alert 
                severity="error" 
                sx={{ mb: 3, borderRadius: 2 }}
              >
                {error}
              </Alert>
            </Fade>
          )}

          {/* Borrowings list */}
          {currentBorrowings.length === 0 ? (
            <Paper 
              elevation={2} 
              sx={{ 
                p: 8, 
                textAlign: 'center',
                borderRadius: 3,
                border: '1px solid #e3f2fd'
              }}
            >
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'grey.100',
                  mx: 'auto',
                  mb: 3
                }}
              >
                <Book className="w-10 h-10" style={{ color: '#ccc' }} />
              </Avatar>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
                Aucun emprunt trouvé
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                {searchTerm ? 'Essayez de modifier votre recherche' : 'Aucun emprunt enregistré pour le moment'}
              </Typography>
              <Button
                variant="contained"
                startIcon={<Plus />}
                onClick={() => onShowBorrowForm && onShowBorrowForm()}
                size="large"
                sx={{ 
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 'bold'
                }}
              >
                Créer un emprunt
              </Button>
            </Paper>
          ) : (
            <>
              <Stack spacing={3} sx={{ mb: 4 }}>
                {currentBorrowings.map((borrowing) => (
                  <BorrowingCard key={borrowing.id} borrowing={borrowing} />
                ))}
              </Stack>

              {/* Pagination */}
              {totalPages > 1 && (
                <Paper 
                  elevation={2} 
                  sx={{ 
                    p: 3, 
                    borderRadius: 2,
                    border: '1px solid #e3f2fd'
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 2, sm: 0 }
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      Affichage de {currentPage * itemsPerPage - itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, currentBorrowings.length)} sur {currentBorrowings.length} résultats
                    </Typography>
                    <Pagination
                      count={totalPages}
                      page={currentPage}
                      onChange={(event, value) => setCurrentPage(value)}
                      color="primary"
                      size="large"
                      showFirstButton
                      showLastButton
                    />
                  </Box>
                </Paper>
              )}
            </>
          )}
        </Box>
      </Fade>
    </Container>
  );
};

// Composant principal pour gérer l'état de l'affichage
const BorrowingsListPage = () => {
  const [showBorrowForm, setShowBorrowForm] = useState(false);

  const handleShowBorrowForm = () => {
    setShowBorrowForm(true);
  };

  const handleCloseBorrowForm = () => {
    setShowBorrowForm(false);
  };

  const handleBorrowSuccess = () => {
    setShowBorrowForm(false);
    // Actualiser la liste des emprunts si nécessaire
  };

  if (showBorrowForm) {
    return (
      <BorrowBookForm
        onClose={handleCloseBorrowForm}
        onSuccess={handleBorrowSuccess}
      />
    );
  }

  return (
    <BorrowingsList
      onShowBorrowForm={handleShowBorrowForm}
      onBack={() => window.history.back()}
    />
  );
};

export default BorrowingsListPage; 