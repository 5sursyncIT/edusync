import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Fade,
  Breadcrumbs,
  Link,
  Stack,
  Tooltip,
  Badge
} from '@mui/material';
import { 
  Book, 
  User, 
  Tag, 
  Calendar, 
  Hash, 
  FileText, 
  Package, 
  ArrowLeft,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  BookOpen,
  Copy,
  Eye
} from 'lucide-react';
import { useBooks } from '../../hooks/useLibrary';

const BookDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getBookDetails, loading, error } = useBooks();
  const [book, setBook] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [errorDetails, setErrorDetails] = useState(null);

  useEffect(() => {
    const loadBookDetails = async () => {
      if (!id) return;

      setLoadingDetails(true);
      setErrorDetails(null);

      try {
        const bookData = await getBookDetails(id);
        setBook(bookData);
      } catch (error) {
        setErrorDetails('Erreur de connexion');
      } finally {
        setLoadingDetails(false);
      }
    };

    loadBookDetails();
  }, [id, getBookDetails]);

  const handleEdit = () => {
    navigate(`/library/books/${id}/edit`);
  };

  const handleDelete = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce livre ?')) {
      // Logique de suppression à implémenter
      navigate('/library/books');
    }
  };

  const handleBack = () => {
    navigate('/library/books');
  };

  const getStatusColor = (state) => {
    switch (state) {
      case 'available':
        return { color: 'success', label: 'Disponible' };
      case 'borrowed':
        return { color: 'error', label: 'Emprunté' };
      default:
        return { color: 'default', label: 'Inconnu' };
    }
  };

  const getBorrowingStatusColor = (borrowing) => {
    if (borrowing.state === 'return') {
      return { color: 'success', label: 'Retourné' };
    }
    if (borrowing.is_overdue) {
      return { color: 'error', label: 'En retard' };
    }
    return { color: 'primary', label: 'En cours' };
  };

  if (loadingDetails) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress size={40} />
          <Typography variant="h6" sx={{ ml: 2 }} color="text.secondary">
            Chargement des détails...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (errorDetails) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Fade in={true}>
          <Alert 
            severity="error" 
            icon={<AlertCircle className="w-6 h-6" />}
            action={
              <Button color="inherit" onClick={handleBack}>
                Retour à la liste
              </Button>
            }
            sx={{ borderRadius: 2 }}
          >
            <Typography variant="h6" sx={{ mb: 1 }}>Erreur</Typography>
            <Typography>{errorDetails}</Typography>
          </Alert>
        </Fade>
      </Container>
    );
  }

  if (!book) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ p: 8, textAlign: 'center', borderRadius: 3 }}>
          <Avatar sx={{ width: 80, height: 80, bgcolor: 'grey.100', mx: 'auto', mb: 3 }}>
            <Book className="w-10 h-10" style={{ color: '#ccc' }} />
          </Avatar>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
            Livre non trouvé
          </Typography>
          <Button variant="contained" onClick={handleBack} startIcon={<ArrowLeft />}>
              Retour à la liste
          </Button>
        </Paper>
      </Container>
    );
  }

  const statusInfo = getStatusColor(book.state);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Fade in={true} timeout={500}>
        <Box>
        {/* Header avec navigation */}
          <Paper 
            elevation={2} 
            sx={{ 
              mb: 4, 
              p: 3,
              borderRadius: 2,
              border: '1px solid #e3f2fd',
              background: 'linear-gradient(135deg, #f8f9ff 0%, #e3f2fd 100%)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton
                onClick={handleBack}
                  sx={{ 
                    color: 'primary.main',
                    '&:hover': { 
                      bgcolor: 'primary.light',
                      transform: 'translateX(-2px)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                  size="large"
                >
                  <ArrowLeft className="w-6 h-6" />
                </IconButton>
                
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    width: 56,
                    height: 56
                  }}
                >
                  <Eye className="w-8 h-8" />
                </Avatar>
                
                <Box>
                  <Typography 
                    variant="h4" 
                    fontWeight="bold" 
                    color="primary"
                    sx={{ mb: 1 }}
                  >
                    {book.title}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    Détails du livre
                  </Typography>
                </Box>
              </Box>

              <Stack direction="row" spacing={1}>
                <Tooltip title="Modifier">
                  <Button
                    variant="outlined"
                    startIcon={<Edit className="w-4 h-4" />}
                onClick={handleEdit}
                    sx={{ borderRadius: 2 }}
                  >
                    Modifier
                  </Button>
                </Tooltip>
                <Tooltip title="Supprimer">
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Trash2 className="w-4 h-4" />}
                    onClick={handleDelete}
                    sx={{ borderRadius: 2 }}
                  >
                    Supprimer
                  </Button>
                </Tooltip>
              </Stack>
            </Box>

            {/* Breadcrumbs */}
            <Breadcrumbs aria-label="breadcrumb">
              <Link 
                underline="hover" 
                color="inherit" 
                onClick={() => navigate('/library')}
                sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <BookOpen className="w-4 h-4" />
                Bibliothèque
              </Link>
              <Link 
                underline="hover" 
                color="inherit" 
                onClick={() => navigate('/library/books')}
                sx={{ cursor: 'pointer' }}
              >
                Livres
              </Link>
              <Typography color="text.primary" fontWeight="medium">
                {book.title}
              </Typography>
            </Breadcrumbs>
          </Paper>

          {/* Statistiques rapides */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <Card sx={{ borderRadius: 2, border: '1px solid #e3f2fd' }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Avatar sx={{ bgcolor: statusInfo.color === 'success' ? 'success.main' : 'error.main', mx: 'auto', mb: 2 }}>
                    {statusInfo.color === 'success' ? <CheckCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold">
                    Statut
                  </Typography>
                  <Chip 
                    label={statusInfo.label}
                    color={statusInfo.color}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card sx={{ borderRadius: 2, border: '1px solid #e3f2fd' }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Avatar sx={{ bgcolor: 'info.main', mx: 'auto', mb: 2 }}>
                    <Copy className="w-6 h-6" />
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold">
                    Exemplaires
                  </Typography>
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    {book.available_copies || 0} / {book.total_copies || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Disponibles
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card sx={{ borderRadius: 2, border: '1px solid #e3f2fd' }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Avatar sx={{ bgcolor: 'warning.main', mx: 'auto', mb: 2 }}>
                    <User className="w-6 h-6" />
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold">
                    Emprunts actifs
                  </Typography>
                  <Typography variant="h4" color="warning.main" fontWeight="bold">
                    {book.borrowed_count || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    En cours
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card sx={{ borderRadius: 2, border: '1px solid #e3f2fd' }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', mx: 'auto', mb: 2 }}>
                    <Book className="w-6 h-6" />
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold">
                    Total emprunts
                  </Typography>
                  <Typography variant="h4" color="secondary.main" fontWeight="bold">
                    {book.borrowings?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Historique
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Informations détaillées */}
          <Grid container spacing={3}>
            {/* Informations générales */}
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: 'fit-content' }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Book className="w-5 h-5" />
                  Informations générales
                </Typography>
                
                <Stack spacing={3}>
                {book.isbn && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'grey.100', width: 40, height: 40 }}>
                        <Hash className="w-5 h-5" style={{ color: '#666' }} />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" color="text.secondary">ISBN</Typography>
                        <Typography variant="body1" fontWeight="medium">{book.isbn}</Typography>
                      </Box>
                    </Box>
                )}

                {book.edition && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'grey.100', width: 40, height: 40 }}>
                        <FileText className="w-5 h-5" style={{ color: '#666' }} />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Édition</Typography>
                        <Typography variant="body1" fontWeight="medium">{book.edition}</Typography>
                      </Box>
                    </Box>
                )}

                {book.internal_code && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'grey.100', width: 40, height: 40 }}>
                        <Package className="w-5 h-5" style={{ color: '#666' }} />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Code interne</Typography>
                        <Typography variant="body1" fontWeight="medium">{book.internal_code}</Typography>
                      </Box>
                    </Box>
                )}

                {book.media_type && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'grey.100', width: 40, height: 40 }}>
                        <Book className="w-5 h-5" style={{ color: '#666' }} />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Type de média</Typography>
                        <Typography variant="body1" fontWeight="medium">{book.media_type}</Typography>
                      </Box>
                    </Box>
                  )}
                </Stack>
              </Paper>
            </Grid>

            {/* Auteurs et catégories */}
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: 'fit-content' }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <User className="w-5 h-5" />
                  Auteurs et catégories
                </Typography>
                
                <Stack spacing={3}>
                {/* Auteurs */}
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Auteurs
                    </Typography>
                    {book.authors && book.authors.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {book.authors.map(author => (
                          <Chip
                            key={author.id}
                            label={author.name}
                            color="primary"
                            size="small"
                            icon={<User className="w-4 h-4" />}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Aucun auteur
                      </Typography>
                    )}
                  </Box>

                {/* Catégories */}
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Catégories
                    </Typography>
                    {book.categories && book.categories.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {book.categories.map(category => (
                          <Chip
                            key={category.id}
                            label={category.name}
                            color="secondary"
                            size="small"
                            icon={<Tag className="w-4 h-4" />}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Aucune catégorie
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

            {/* Description */}
            {book.description && (
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mt: 3 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                  Description
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                {book.description}
              </Typography>
            </Paper>
            )}

            {/* Exemplaires */}
            {book.units && book.units.length > 0 && (
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mt: 3 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                  Exemplaires ({book.units.length})
              </Typography>
              <Grid container spacing={2}>
                {book.units.map((unit, index) => {
                  const unitStatus = getStatusColor(unit.state);
                  return (
                    <Grid item xs={12} sm={6} md={4} key={unit.id}>
                      <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ py: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="body2" fontWeight="medium">
                        Exemplaire {index + 1}
                            </Typography>
                            <Chip 
                              label={unitStatus.label}
                              color={unitStatus.color}
                              size="small"
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>
            )}

            {/* Historique des emprunts */}
            {book.borrowings && book.borrowings.length > 0 && (
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mt: 3 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
                  Historique des emprunts ({book.borrowings.length})
              </Typography>
              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                <Stack spacing={2}>
                  {book.borrowings.map(borrowing => {
                    const borrowingStatus = getBorrowingStatusColor(borrowing);
                    return (
                      <Card key={borrowing.id} variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ bgcolor: 'grey.100', width: 32, height: 32 }}>
                                <User className="w-4 h-4" style={{ color: '#666' }} />
                              </Avatar>
                              <Typography variant="body1" fontWeight="medium">
                            {borrowing.student || 'Étudiant inconnu'}
                              </Typography>
                            </Box>
                            <Chip 
                              label={borrowingStatus.label}
                              color={borrowingStatus.color}
                              size="small"
                            />
                          </Box>
                          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Calendar className="w-4 h-4" style={{ color: '#666' }} />
                              <Typography variant="body2" color="text.secondary">
                                Emprunté: {borrowing.issue_date}
                              </Typography>
                            </Box>
                          {borrowing.return_date && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Clock className="w-4 h-4" style={{ color: '#666' }} />
                                <Typography variant="body2" color="text.secondary">
                                  Retour prévu: {borrowing.return_date}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                          {borrowing.state === 'issue' && borrowing.is_overdue && (
                            <Alert severity="warning" sx={{ mt: 2 }}>
                              <Typography variant="body2">
                                Cet emprunt est en retard
                              </Typography>
                            </Alert>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </Stack>
              </Box>
            </Paper>
          )}
        </Box>
      </Fade>
    </Container>
  );
};

export default BookDetailsPage; 