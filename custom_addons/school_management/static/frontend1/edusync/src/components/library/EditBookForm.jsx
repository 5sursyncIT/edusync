import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  Avatar,
  Fade
} from '@mui/material';
import { BookOpen, User, Tag, Save, AlertCircle } from 'lucide-react';
import { useLibrary, useAuthors, useCategories } from '../../hooks/useLibrary';

const EditBookForm = ({ bookId, onClose, onSuccess }) => {
  const { updateBook, getBookById } = useLibrary();
  const { fetchAuthors, authors, loading: authorsLoading, error: authorsError } = useAuthors();
  const { fetchCategories, categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  
  const [formData, setFormData] = useState({
    title: '',
    isbn: '',
    edition: '',
    description: '',
    internal_code: '',
    author_ids: [],
    category_ids: [],
    total_copies: 1
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingBook, setLoadingBook] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, [bookId]);

  const loadInitialData = async () => {
    setLoadingBook(true);
    try {
      // Charger les données parallèlement
      await Promise.all([
        fetchAuthors(),
        fetchCategories()
      ]);

      // Charger les détails du livre
      const bookResponse = await getBookById(bookId);

      if (bookResponse.status === 'success') {
        const book = bookResponse.data;
        setFormData({
          title: book.title || '',
          isbn: book.isbn || '',
          edition: book.edition || '',
          internal_code: book.internal_code || '',
          total_copies: book.total_copies || 1,
          description: book.description || '',
          author_ids: book.authors?.map(a => a.id) || [],
          category_ids: book.categories?.map(c => c.id) || []
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setFormErrors({ submit: 'Erreur lors du chargement des données' });
    } finally {
      setLoadingBook(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));

    // Effacer l'erreur pour ce champ
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAuthorToggle = (authorId) => {
    setFormData(prev => ({
      ...prev,
      author_ids: prev.author_ids.includes(authorId)
        ? prev.author_ids.filter(id => id !== authorId)
        : [...prev.author_ids, authorId]
    }));
    
    // Effacer l'erreur des auteurs si au moins un est sélectionné
    if (formErrors.authors && !formData.author_ids.includes(authorId)) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.authors;
        return newErrors;
      });
    }
  };

  const handleCategoryToggle = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId]
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = 'Le titre est requis';
    }

    if (formData.author_ids.length === 0) {
      errors.authors = 'Au moins un auteur doit être sélectionné';
    }

    if (formData.total_copies < 1) {
      errors.total_copies = 'Le nombre d\'exemplaires doit être d\'au moins 1';
    }

    if (formData.isbn && formData.isbn.length < 10) {
      errors.isbn = 'L\'ISBN doit contenir au moins 10 caractères';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setFormErrors({}); // Effacer les erreurs précédentes

    try {
      const response = await updateBook(bookId, formData);
      
      // Vérifier si la réponse indique un succès
      if (response && response.status === 'success') {
        // Succès : fermer le formulaire et notifier le parent
        console.log('Livre modifié avec succès:', response.data);
        onSuccess && onSuccess(response.data);
        onClose();
      } else {
        // Erreur dans la réponse
        setFormErrors({ submit: response?.message || 'Erreur lors de la modification du livre' });
      }
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      
      // Extraire le message d'erreur approprié
      let errorMessage = 'Erreur de connexion';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setFormErrors({ submit: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  // Utiliser les données des hooks
  const loading = authorsLoading || categoriesLoading || loadingBook;
  const hasError = authorsError || categoriesError;

  if (loadingBook) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={24} />
          <Typography color="text.secondary">Chargement du livre...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* Header du formulaire */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Avatar
          sx={{
            bgcolor: 'primary.main',
            width: 64,
            height: 64,
            mx: 'auto',
            mb: 2
          }}
        >
          <BookOpen className="w-8 h-8" />
        </Avatar>
        <Typography variant="h5" fontWeight="bold" color="primary" sx={{ mb: 1 }}>
          Modifier le livre
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Modifiez les informations du livre ci-dessous
        </Typography>
      </Box>

      {/* Gestion des erreurs de chargement */}
      {hasError && (
        <Fade in={true}>
          <Box sx={{ mb: 3 }}>
            <Alert 
              severity="error" 
              icon={<AlertCircle className="w-5 h-5" />}
              action={
                <Button 
                  color="inherit" 
                  size="small"
                  onClick={() => {
                    fetchAuthors();
                    fetchCategories();
                  }}
                >
                  Réessayer
                </Button>
              }
            >
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Erreur de chargement des données
              </Typography>
              <Typography variant="body2">
                {authorsError && `Auteurs: ${authorsError}`}
                {categoriesError && ` Catégories: ${categoriesError}`}
              </Typography>
            </Alert>
          </Box>
        </Fade>
      )}

      {/* Indicateur de chargement global */}
      {loading && !hasError && !loadingBook && (
        <Fade in={true}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={20} />
              <Typography>Chargement des données...</Typography>
            </Box>
          </Alert>
        </Fade>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit}>
        {/* Erreur générale */}
        {formErrors.submit && (
          <Fade in={true}>
            <Alert severity="error" sx={{ mb: 3 }}>
              {formErrors.submit}
            </Alert>
          </Fade>
        )}

        {/* Section 1: Informations de base */}
        <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <BookOpen className="w-5 h-5" />
            Informations générales
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Titre"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                error={!!formErrors.title}
                helperText={formErrors.title}
                required
                placeholder="Entrez le titre du livre"
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ISBN"
                name="isbn"
                value={formData.isbn}
                onChange={handleInputChange}
                error={!!formErrors.isbn}
                helperText={formErrors.isbn || "Format: 978-XXXXXXXXX"}
                placeholder="978-XXXXXXXXX"
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Édition"
                name="edition"
                value={formData.edition}
                onChange={handleInputChange}
                placeholder="Ex: 1ère édition"
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Code interne"
                name="internal_code"
                value={formData.internal_code}
                onChange={handleInputChange}
                placeholder="Code de référence interne"
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre d'exemplaires"
                name="total_copies"
                type="number"
                value={formData.total_copies}
                onChange={handleInputChange}
                error={!!formErrors.total_copies}
                helperText={formErrors.total_copies}
                required
                inputProps={{ min: 1 }}
                variant="outlined"
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
                rows={3}
                placeholder="Description du livre"
                variant="outlined"
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Section 2: Auteurs */}
        <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <User className="w-5 h-5" />
            Auteurs *
          </Typography>
          
          {formErrors.authors && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formErrors.authors}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
              <CircularProgress size={20} />
              <Typography color="text.secondary">Chargement des auteurs...</Typography>
            </Box>
          ) : authors.length === 0 ? (
            <Alert severity="warning">
              Aucun auteur disponible. Veuillez d'abord créer des auteurs.
            </Alert>
          ) : (
            <>
              {/* Auteurs sélectionnés */}
              {formData.author_ids.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Auteurs sélectionnés:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {authors
                      .filter(author => formData.author_ids.includes(author.id))
                      .map(author => (
                        <Chip
                          key={author.id}
                          label={author.name}
                          color="primary"
                          size="small"
                          onDelete={() => handleAuthorToggle(author.id)}
                        />
                      ))}
                  </Box>
                </Box>
              )}

              <FormControl component="fieldset" error={!!formErrors.authors}>
                <FormGroup>
                  <Box sx={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
                    {authors.map(author => (
                      <FormControlLabel
                        key={author.id}
                        control={
                          <Checkbox
                            checked={formData.author_ids.includes(author.id)}
                            onChange={() => handleAuthorToggle(author.id)}
                            color="primary"
                          />
                        }
                        label={author.name}
                      />
                    ))}
                  </Box>
                </FormGroup>
              </FormControl>
            </>
          )}
        </Paper>

        {/* Section 3: Catégories */}
        <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tag className="w-5 h-5" />
            Catégories
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
              <CircularProgress size={20} />
              <Typography color="text.secondary">Chargement des catégories...</Typography>
            </Box>
          ) : categories.length === 0 ? (
            <Alert severity="info">
              Aucune catégorie disponible. Vous pouvez créer des catégories plus tard.
            </Alert>
          ) : (
            <>
              {/* Catégories sélectionnées */}
              {formData.category_ids.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Catégories sélectionnées:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {categories
                      .filter(category => formData.category_ids.includes(category.id))
                      .map(category => (
                        <Chip
                          key={category.id}
                          label={category.name}
                          color="secondary"
                          size="small"
                          onDelete={() => handleCategoryToggle(category.id)}
                        />
                      ))}
                  </Box>
                </Box>
              )}

              <FormControl component="fieldset">
                <FormGroup>
                  <Box sx={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
                    {categories.map(category => (
                      <FormControlLabel
                        key={category.id}
                        control={
                          <Checkbox
                            checked={formData.category_ids.includes(category.id)}
                            onChange={() => handleCategoryToggle(category.id)}
                            color="secondary"
                          />
                        }
                        label={category.name}
                      />
                    ))}
                  </Box>
                </FormGroup>
              </FormControl>
            </>
          )}
        </Paper>

        {/* Boutons d'action */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={submitting}
            size="large"
            sx={{ px: 4 }}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : <Save className="w-4 h-4" />}
            size="large"
            sx={{ px: 4 }}
          >
            {submitting ? 'Modification...' : 'Modifier le livre'}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default EditBookForm; 