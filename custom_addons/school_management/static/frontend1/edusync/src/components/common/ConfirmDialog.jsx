import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Warning, Info, Error, CheckCircle } from '@mui/icons-material';

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = 'Confirmer l\'action',
  message = 'Êtes-vous sûr de vouloir continuer ?',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  severity = 'warning', // 'warning', 'error', 'info', 'success'
  confirmColor = 'primary',
  maxWidth = 'sm',
  fullWidth = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Définir l'icône selon la sévérité
  const getIcon = () => {
    switch (severity) {
      case 'error':
        return <Error color="error" sx={{ fontSize: 48 }} />;
      case 'warning':
        return <Warning color="warning" sx={{ fontSize: 48 }} />;
      case 'info':
        return <Info color="info" sx={{ fontSize: 48 }} />;
      case 'success':
        return <CheckCircle color="success" sx={{ fontSize: 48 }} />;
      default:
        return <Warning color="warning" sx={{ fontSize: 48 }} />;
    }
  };

  // Définir la couleur du bouton de confirmation selon la sévérité
  const getConfirmColor = () => {
    if (confirmColor !== 'primary') return confirmColor;
    
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      case 'success':
        return 'success';
      default:
        return 'primary';
    }
  };

  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          pb: 1
        }}
      >
        {getIcon()}
        {title}
      </DialogTitle>
      
      <DialogContent>
        <DialogContentText
          sx={{
            fontSize: '1rem',
            color: 'text.primary',
            whiteSpace: 'pre-line'
          }}
        >
          {message}
        </DialogContentText>
      </DialogContent>
      
      <DialogActions
        sx={{
          p: 2,
          gap: 1,
          flexDirection: isMobile ? 'column-reverse' : 'row'
        }}
      >
        <Button
          onClick={handleCancel}
          color="inherit"
          size="large"
          fullWidth={isMobile}
          sx={{
            minWidth: isMobile ? 'auto' : 100
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={getConfirmColor()}
          size="large"
          fullWidth={isMobile}
          autoFocus
          sx={{
            minWidth: isMobile ? 'auto' : 100
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog; 