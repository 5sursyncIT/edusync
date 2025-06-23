import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Search, Plus, Tag, BookOpen, Edit, Trash2, Filter, Save, X } from 'lucide-react';
import { useCategories } from '../../hooks/useLibrary';

// Composant de formulaire de catégorie modal
const CategoryFormModal = ({ open, onClose, category = null, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || ''
      });
    } else {
      setFormData({
        name: '',
        description: ''
      });
    }
    setFormErrors({});
  }, [category, open]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Effacer l'erreur pour ce champ
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Le nom est requis';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      setFormErrors({ submit: error.message || 'Erreur lors de la sauvegarde' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <Tag className="w-5 h-5" />
          </Avatar>
          <Typography variant="h6">
            {category ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
          </Typography>
        </Box>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {formErrors.submit && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formErrors.submit}
            </Alert>
          )}
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom *"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={4}
                placeholder="Description de la catégorie..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} disabled={submitting}>
            Annuler
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : <Save />}
          >
            {submitting ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const CategoriesList = () => {
  const { categories, loading, error, fetchCategories, createCategory, updateCategory, deleteCategory } = useCategories();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  
  // États pour les modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleDelete = async (categoryId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      try {
        await deleteCategory(categoryId);
        await fetchCategories();
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
      }
    }
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setShowEditModal(true);
  };

  const handleSaveCategory = async (formData) => {
    if (selectedCategory) {
      await updateCategory(selectedCategory.id, formData);
    } else {
      await createCategory(formData);
    }
    await fetchCategories();
  };

  const filteredCategories = categories.filter(category =>
    category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCategories = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

  const getColorForCategory = (index) => {
    const colors = [
      { bg: '#e3f2fd', text: '#1976d2' }, // blue
      { bg: '#e8f5e8', text: '#2e7d32' }, // green
      { bg: '#f3e5f5', text: '#7b1fa2' }, // purple
      { bg: '#fff3e0', text: '#f57c00' }, // orange
      { bg: '#fce4ec', text: '#c2185b' }, // pink
      { bg: '#e8eaf6', text: '#3f51b5' }, // indigo
      { bg: '#ffebee', text: '#d32f2f' }, // red
      { bg: '#fff8e1', text: '#f9a825' }, // amber
    ];
    return colors[index % colors.length];
  };

  const CategoryCard = ({ category, index }) => {
    const categoryColor = getColorForCategory(index);
    
    return (
      <Fade in={true} timeout={300}>
        <Card 
          sx={{ 
            height: '100%',
            background: 'white',
            border: '1px solid #e3f2fd',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 6,
              border: '2px solid #e3f2fd',
            }
          }}
        >
          <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <Avatar
                  sx={{
                    bgcolor: categoryColor.bg,
                    color: categoryColor.text,
                    width: 48,
                    height: 48,
                    mr: 2
                  }}
                >
                  <Tag className="w-6 h-6" />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    {category.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {category.books_count || 0} livre(s)
                  </Typography>
                </Box>
              </Box>
              <Stack direction="row" spacing={1}>
                <Tooltip title="Modifier">
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(category)}
                    sx={{ 
                      color: 'text.secondary',
                      '&:hover': { 
                        color: 'primary.main',
                        bgcolor: 'primary.light'
                      }
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Supprimer">
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(category.id)}
                    sx={{ 
                      color: 'text.secondary',
                      '&:hover': { 
                        color: 'error.main',
                        bgcolor: 'error.light'
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
            
            {category.description && (
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  mb: 2,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {category.description}
              </Typography>
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto' }}>
              <BookOpen className="w-4 h-4" style={{ marginRight: 8, color: '#666' }} />
              <Typography variant="body2" color="text.secondary">
                {category.books_count || 0} livre(s) dans cette catégorie
              </Typography>
            </Box>
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
            Chargement des catégories...
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
                <Tag className="w-8 h-8" />
                Catégories
              </Typography>
              <Typography variant="h6" color="text.secondary">
                {filteredCategories.length} catégorie(s) trouvée(s)
              </Typography>
            </Box>
            
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<Plus />}
              onClick={() => setShowAddModal(true)}
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
              Ajouter une catégorie
            </Button>
          </Box>

          {/* Search */}
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
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  placeholder="Rechercher par nom ou description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
              <Grid item xs={12} md={4}>
                <Button
                  variant="outlined"
                  startIcon={<Filter />}
                  size="large"
                  fullWidth
                  sx={{ 
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 'bold'
                  }}
                >
                  Filtres
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

          {/* Categories grid */}
          {currentCategories.length === 0 ? (
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
                <Tag className="w-10 h-10" style={{ color: '#ccc' }} />
              </Avatar>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
                Aucune catégorie trouvée
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                {searchTerm ? 'Essayez de modifier votre recherche' : 'Commencez par ajouter votre première catégorie'}
              </Typography>
              <Button
                variant="contained"
                startIcon={<Plus />}
                onClick={() => setShowAddModal(true)}
                size="large"
                sx={{ 
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 'bold'
                }}
              >
                Ajouter une catégorie
              </Button>
            </Paper>
          ) : (
            <>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {currentCategories.map((category, index) => (
                  <Grid item xs={12} md={6} lg={4} key={category.id}>
                    <CategoryCard category={category} index={index} />
                  </Grid>
                ))}
              </Grid>

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
                      Affichage de {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, filteredCategories.length)} sur {filteredCategories.length} résultats
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
      
      {/* Modales */}
      <CategoryFormModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveCategory}
      />
      
      <CategoryFormModal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        onSave={handleSaveCategory}
      />
    </Container>
  );
};

export default CategoriesList; 