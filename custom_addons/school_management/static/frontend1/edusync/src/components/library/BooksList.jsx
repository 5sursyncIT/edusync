import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Button,
  Alert,
  Pagination,
  Badge,
  CardActions
} from '@mui/material';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  Eye,
  Users,
  Tag,
  AlertCircle,
  Filter as FilterIcon
} from 'lucide-react';
import { useBooks, useAuthors, useCategories } from '../../hooks/useLibrary';

// Composant carte de livre modernisé
const ModernBookCard = ({ book, onEdit, onDelete, onView }) => {
  const getStatusColor = (state) => {
    switch (state) {
      case 'available':
        return 'success';
      case 'borrowed':
        return 'error';
      case 'reserved':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusText = (state) => {
    switch (state) {
      case 'available':
        return 'Disponible';
      case 'borrowed':
        return 'Emprunté';
      case 'reserved':
        return 'Réservé';
      default:
        return 'Inconnu';
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        {/* En-tête avec statut */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
              {book.title}
            </Typography>
            {book.authors && book.authors.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Users size={16} />
                <Typography variant="body2" color="text.secondary">
                  {book.authors.map(author => author.name).join(', ')}
                </Typography>
              </Box>
            )}
            {book.isbn && (
              <Typography variant="caption" color="text.secondary">
                ISBN: {book.isbn}
              </Typography>
            )}
          </Box>
          <Chip
            label={getStatusText(book.state)}
            color={getStatusColor(book.state)}
            size="small"
            variant="outlined"
          />
        </Box>

        {/* Catégories */}
        {book.categories && book.categories.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {book.categories.map(category => (
              <Chip
                key={category.id}
                label={category.name}
                size="small"
                icon={<Tag size={12} />}
                variant="outlined"
                color="primary"
              />
            ))}
          </Box>
        )}

        {/* Statistiques */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Exemplaires: {book.available_copies || 0}/{book.total_copies || 0}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Emprunts: {book.borrowed_count || 0}
          </Typography>
        </Box>

        {/* Description */}
        {book.description && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {book.description}
          </Typography>
        )}
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
        <Button
          startIcon={<Eye size={16} />}
          onClick={() => onView(book.id)}
          size="small"
          variant="text"
        >
          Voir détails
        </Button>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Modifier">
            <IconButton
              onClick={() => onEdit(book.id)}
              size="small"
              sx={{ 
                color: 'warning.main',
                '&:hover': { bgcolor: 'warning.light', color: 'white' }
              }}
            >
              <Edit3 size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Supprimer">
            <IconButton
              onClick={() => onDelete(book.id)}
              size="small"
              sx={{ 
                color: 'error.main',
                '&:hover': { bgcolor: 'error.light', color: 'white' }
              }}
            >
              <Trash2 size={16} />
            </IconButton>
          </Tooltip>
        </Stack>
      </CardActions>
    </Card>
  );
};

const BooksList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // État pour les paramètres de recherche
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedAuthor, setSelectedAuthor] = useState(searchParams.get('author') || '');
  const [selectedState, setSelectedState] = useState(searchParams.get('state') || '');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [showFilters, setShowFilters] = useState(false);

  // Hooks pour les données
  const { books, loading: booksLoading, error: booksError, pagination, fetchBooks, deleteBook } = useBooks();
  const { authors, fetchAuthors } = useAuthors();
  const { categories, fetchCategories } = useCategories();

  // Fonction de recherche mémorisée
  const handleSearch = useCallback(async (params = {}) => {
    const searchParams = {
      search: searchQuery || undefined,
      category_id: selectedCategory || undefined,
      author_id: selectedAuthor || undefined,
      state: selectedState || undefined,
      page: currentPage,
      ...params
    };

    // Supprimer les paramètres vides
    Object.keys(searchParams).forEach(key => {
      if (!searchParams[key]) delete searchParams[key];
    });

    // Mettre à jour l'URL
    const newSearchParams = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) newSearchParams.set(key, value.toString());
    });
    setSearchParams(newSearchParams);

    await fetchBooks(searchParams);
  }, [searchQuery, selectedCategory, selectedAuthor, selectedState, currentPage, fetchBooks, setSearchParams]);

  // Charger les données initiales
  useEffect(() => {
    fetchAuthors();
    fetchCategories();
  }, [fetchAuthors, fetchCategories]);

  // Effectuer la recherche quand les paramètres changent
  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  const handleSubmitSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    handleSearch({ page: 1 });
  };

  const handleView = (bookId) => {
    navigate(`/library/books/${bookId}`);
  };

  const handleEdit = (bookId) => {
    navigate(`/library/books/${bookId}/edit`);
  };

  const handleDelete = async (bookId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce livre ?')) {
      try {
        await deleteBook(bookId);
        // Recharger la liste après suppression
        handleSearch();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage);
    handleSearch({ page: newPage });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedAuthor('');
    setSelectedState('');
    setCurrentPage(1);
    setSearchParams({});
  };

  if (booksError) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Erreur lors du chargement des livres: {booksError}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Fade in={true} timeout={500}>
        <Box>
          {/* En-tête moderne */}
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
                <BookOpen className="w-10 h-10" style={{ color: 'blue' }} />
                Gestion des Livres
              </Typography>
              <Typography variant="h6" color="text.secondary">
                {pagination?.total || 0} livre(s) au total
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={2}>
              <Tooltip title="Filtres">
                <IconButton
                  onClick={() => setShowFilters(!showFilters)}
                  sx={{ 
                    bgcolor: showFilters ? 'blue' : 'grey.100',
                    color: showFilters ? 'white' : 'grey.600',
                    '&:hover': { bgcolor: showFilters ? 'primary.main' : 'grey.200' }
                  }}
                >
                  <FilterIcon />
                </IconButton>
              </Tooltip>
              
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<Plus />}
                component={Link}
                to="/library/books/new"
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
                Nouveau Livre
              </Button>
            </Stack>
          </Box>

          {/* Barre de recherche et filtres */}
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              mb: 3, 
              borderRadius: 3,
              background: 'white'
            }}
          >
            <form onSubmit={handleSubmitSearch}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                flexDirection: { xs: 'column', md: 'row' }
              }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Rechercher par titre, auteur, ISBN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      bgcolor: 'white'
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={20} />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  sx={{ 
                    minWidth: 120,
                    borderRadius: 3,
                    height: 56
                  }}
                >
                  Rechercher
                </Button>
              </Box>
            </form>

            {/* Filtres avancés */}
            {showFilters && (
              <Box sx={{ mt: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Catégorie</InputLabel>
                      <Select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        label="Catégorie"
                        sx={{ borderRadius: 3 }}
                      >
                        <MenuItem value="">Toutes les catégories</MenuItem>
                        {categories.map(category => (
                          <MenuItem key={category.id} value={category.id}>
                            {category.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Auteur</InputLabel>
                      <Select
                        value={selectedAuthor}
                        onChange={(e) => setSelectedAuthor(e.target.value)}
                        label="Auteur"
                        sx={{ borderRadius: 3 }}
                      >
                        <MenuItem value="">Tous les auteurs</MenuItem>
                        {authors.map(author => (
                          <MenuItem key={author.id} value={author.id}>
                            {author.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Statut</InputLabel>
                      <Select
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        label="Statut"
                        sx={{ borderRadius: 3 }}
                      >
                        <MenuItem value="">Tous les statuts</MenuItem>
                        <MenuItem value="available">Disponible</MenuItem>
                        <MenuItem value="borrowed">Emprunté</MenuItem>
                        <MenuItem value="reserved">Réservé</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      onClick={resetFilters}
                      variant="outlined"
                      fullWidth
                      sx={{ 
                        height: 56,
                        borderRadius: 3
                      }}
                    >
                      Réinitialiser
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>

          {/* Grille des livres */}
          {booksLoading ? (
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
                Chargement des livres...
              </Typography>
            </Box>
          ) : books.length === 0 ? (
            <Paper 
              elevation={2} 
              sx={{ 
                p: 6, 
                textAlign: 'center', 
                borderRadius: 3,
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
              }}
            >
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'grey.100',
                  mx: 'auto',
                  mb: 2
                }}
              >
                <BookOpen size={40} color="grey" />
              </Avatar>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                Aucun livre trouvé
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Aucun livre ne correspond à vos critères de recherche
              </Typography>
              <Button
                variant="contained"
                component={Link}
                to="/library/books/new"
                startIcon={<Plus />}
                sx={{ borderRadius: 3 }}
              >
                Ajouter un livre
              </Button>
            </Paper>
          ) : (
            <>
              <Grid container spacing={3}>
                {books.map((book) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={book.id}>
                    <ModernBookCard
                      book={book}
                      onView={handleView}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {pagination && pagination.total_pages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={pagination.total_pages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                    sx={{
                      '& .MuiPaginationItem-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      </Fade>
    </Container>
  );
};

export default BooksList; 