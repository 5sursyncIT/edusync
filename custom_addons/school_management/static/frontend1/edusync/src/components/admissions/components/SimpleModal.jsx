import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Fade
} from '@mui/material';
import { X } from 'lucide-react';

// Modal simple et robuste pour éviter les conflits CSS
const SimpleModal = ({ 
  open, 
  onClose, 
  title, 
  children, 
  maxWidth = 'md',
  fullWidth = true 
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      TransitionComponent={Fade}
      transitionDuration={300}
      PaperProps={{
        sx: {
          borderRadius: 4,
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          maxHeight: '95vh',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
        }
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)'
        }
      }}
    >
      {/* En-tête du modal */}
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
          px: 4,
          pt: 3,
          borderBottom: '2px solid #e3f2fd',
          background: 'linear-gradient(135deg, #e3f2fd 0%, #f0f8ff 100%)'
        }}
      >
        <Box 
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: 'primary.main'
          }}
        >
          {title}
        </Box>
        
        <IconButton
          onClick={onClose}
          sx={{
            color: 'text.secondary',
            bgcolor: 'rgba(255,255,255,0.8)',
            '&:hover': {
              color: 'error.main',
              bgcolor: 'rgba(255,255,255,1)',
              transform: 'scale(1.1)'
            },
            transition: 'all 0.2s ease'
          }}
        >
          <X size={24} />
        </IconButton>
      </DialogTitle>
      
      {/* Contenu du modal */}
      <DialogContent
        sx={{
          pt: 4,
          pb: 3,
          px: 4,
          maxHeight: '70vh',
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#c1c1c1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#a8a8a8',
          }
        }}
      >
        <Box sx={{ minHeight: '200px' }}>
          {children}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleModal; 