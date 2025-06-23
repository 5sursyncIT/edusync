import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography
} from '@mui/material';
import { X } from 'lucide-react';

// Modal Material-UI compatible
const Modal = ({ show, onClose, title, children }) => {
  return (
    <Dialog
      open={show}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
          borderBottom: '1px solid #e0e0e0'
        }}
      >
        <Typography variant="h6" fontWeight="bold" color="primary">
          {title}
        </Typography>
        <IconButton
            onClick={onClose}
          sx={{
            color: 'text.secondary',
            '&:hover': {
              color: 'text.primary',
              bgcolor: 'action.hover'
            }
          }}
          >
          <X size={20} />
        </IconButton>
      </DialogTitle>
      
      <DialogContent
        sx={{
          pt: 3,
          pb: 3,
          maxHeight: '70vh',
          overflow: 'auto'
        }}
      >
          {children}
      </DialogContent>
    </Dialog>
  );
};

export default Modal; 