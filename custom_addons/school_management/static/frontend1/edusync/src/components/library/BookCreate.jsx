import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  IconButton,
  Fade,
  Avatar,
  Breadcrumbs,
  Link
} from '@mui/material';
import { ArrowLeft, BookOpen, Plus } from 'lucide-react';
import AddBookForm from './AddBookForm';

const BookCreate = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/library/books');
  };

  const handleBookAdded = (book) => {
    navigate('/library/books');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <IconButton
                onClick={handleClose}
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
                <Plus className="w-8 h-8" />
              </Avatar>
              
              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="h4" 
                  fontWeight="bold" 
                  color="primary"
                  sx={{ mb: 1 }}
                >
                  Nouveau Livre
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Ajouter un nouveau livre à la bibliothèque
                </Typography>
              </Box>
            </Box>

            {/* Breadcrumbs */}
            <Breadcrumbs aria-label="breadcrumb" sx={{ mt: 2 }}>
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
                Nouveau livre
              </Typography>
            </Breadcrumbs>
          </Paper>

          {/* Formulaire dans une carte */}
          <Paper 
            elevation={3} 
            sx={{ 
              borderRadius: 3,
              border: '1px solid #e3f2fd',
              overflow: 'hidden',
              background: 'white'
            }}
          >
            <AddBookForm 
              onClose={handleClose} 
              onBookAdded={handleBookAdded} 
            />
          </Paper>
        </Box>
      </Fade>
    </Container>
  );
};

export default BookCreate; 