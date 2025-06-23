import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  IconButton,
  Typography,
  Paper,
  Breadcrumbs,
  Link
} from '@mui/material';
import { ArrowLeft, Home, Book } from 'lucide-react';
import EditBookForm from './EditBookForm';

const BookEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleSuccess = (updatedBook) => {
    // Rediriger vers la liste des livres après modification réussie
    navigate('/library/books');
  };

  const handleCancel = () => {
    // Retourner à la liste des livres
    navigate('/library/books');
  };

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh' }}>
      {/* Header avec navigation */}
      <Paper elevation={1} sx={{ borderRadius: 0, mb: 3 }}>
        <Container maxWidth="lg">
          <Box sx={{ py: 3 }}>
            {/* Breadcrumbs */}
            <Breadcrumbs sx={{ mb: 2 }}>
              <Link
                underline="hover"
                color="inherit"
                href="/dashboard"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                <Home className="w-4 h-4" />
                Accueil
              </Link>
              <Link
                underline="hover"
                color="inherit"
                href="/library/books"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                <Book className="w-4 h-4" />
                Bibliothèque
              </Link>
              <Typography color="text.primary">Modifier le livre</Typography>
            </Breadcrumbs>

            {/* Header avec bouton retour */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton
                onClick={handleCancel}
                color="primary"
                sx={{ 
                  bgcolor: 'primary.50',
                  '&:hover': { bgcolor: 'primary.100' }
                }}
                title="Retour à la liste"
              >
                <ArrowLeft className="w-5 h-5" />
              </IconButton>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="primary" sx={{ mb: 0.5 }}>
                  Modifier le Livre
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Modifiez les informations du livre sélectionné
                </Typography>
              </Box>
            </Box>
          </Box>
        </Container>
      </Paper>

      {/* Contenu principal */}
      <Container maxWidth="lg">
        <Box sx={{ pb: 4 }}>
          <Paper 
            elevation={2} 
            sx={{ 
              borderRadius: 3,
              overflow: 'hidden',
              maxWidth: 900,
              mx: 'auto'
            }}
          >
            <EditBookForm
              bookId={parseInt(id)}
              onClose={handleCancel}
              onSuccess={handleSuccess}
            />
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default BookEdit; 