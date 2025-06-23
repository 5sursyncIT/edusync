import React, { useState } from 'react';
import { 
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  Send, 
  CheckCircle, 
  XCircle, 
  UserPlus,
  X
} from 'lucide-react';
import { admissionsAPI } from '../services/admissionsAPI';

// Composant boutons d'action modernisé
const ActionButtons = ({ admission, onAction }) => {
  const [convertDialog, setConvertDialog] = useState(false);
  const [converting, setConverting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const showNotification = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  };

  const handleAction = async (admissionId, action) => {
    console.log(`🚀 Action demandée: ${action} pour admission ${admissionId}`);
    setActionLoading(action);
    
    try {
      const response = await admissionsAPI.admissionAction(admissionId, action);
      console.log(`📥 Réponse API pour ${action}:`, response);
      
      if (response.status === 'success') {
        showNotification(response.message, 'success');
        // Notifier le parent pour rafraîchir la liste
        if (onAction) {
          onAction(admissionId, 'refresh');
        }
      } else {
        console.error(`❌ Erreur API pour ${action}:`, response);
        showNotification(response.message || 'Erreur lors de l\'action', 'error');
      }
    } catch (error) {
      console.error(`💥 Exception pour ${action}:`, error);
      showNotification('Erreur de connexion lors de l\'action', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConvertToStudent = async () => {
    console.log(`🔄 Conversion en étudiant pour admission ${admission.id}`);
    setConverting(true);
    try {
      const response = await admissionsAPI.convertToStudent(admission.id);
      console.log('📥 Réponse conversion:', response);
      
      if (response.status === 'success') {
        setConvertDialog(false);
        showNotification(
          `✅ Admission convertie en étudiant avec succès!\n\nÉtudiant créé: ${response.data.student_name}\nEmail: ${response.data.student_email}`,
          'success'
        );
        // Rafraîchir la liste ou notifier le parent
        if (onAction) {
          onAction(admission.id, 'refresh');
        }
      } else {
        console.error('❌ Erreur conversion:', response);
        showNotification(`Erreur: ${response.message}`, 'error');
      }
    } catch (error) {
      console.error('💥 Exception conversion:', error);
      showNotification('Erreur lors de la conversion en étudiant', 'error');
    } finally {
      setConverting(false);
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {admission.state === 'draft' && (
          <Tooltip title="Soumettre l'admission">
            <IconButton
              onClick={() => handleAction(admission.id, 'submit')}
              size="small"
              disabled={actionLoading === 'submit'}
              sx={{ 
                color: 'info.main',
                '&:hover': { bgcolor: 'info.light', color: 'white' }
              }}
            >
              <Send size={16} />
            </IconButton>
          </Tooltip>
        )}
        
        {admission.state === 'submit' && (
          <>
            <Tooltip title="Confirmer l'admission">
              <IconButton
                onClick={() => handleAction(admission.id, 'confirm')}
                size="small"
                disabled={actionLoading === 'confirm'}
                sx={{ 
                  color: 'success.main',
                  '&:hover': { bgcolor: 'success.light', color: 'white' }
                }}
              >
                <CheckCircle size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Rejeter l'admission">
              <IconButton
                onClick={() => handleAction(admission.id, 'reject')}
                size="small"
                disabled={actionLoading === 'reject'}
                sx={{ 
                  color: 'error.main',
                  '&:hover': { bgcolor: 'error.light', color: 'white' }
                }}
              >
                <XCircle size={16} />
              </IconButton>
            </Tooltip>
          </>
        )}
        
        {admission.state === 'confirm' && !admission.student_id && (
          <Tooltip title="Convertir en étudiant officiel">
            <IconButton
              onClick={() => setConvertDialog(true)}
              size="small"
              sx={{ 
                color: 'secondary.main',
                '&:hover': { bgcolor: 'secondary.light', color: 'white' }
              }}
            >
              <UserPlus size={16} />
            </IconButton>
          </Tooltip>
        )}
        
        {admission.state === 'confirm' && admission.student_id && (
          <Tooltip title="Déjà converti en étudiant">
            <IconButton
              disabled
              size="small"
              sx={{ color: 'success.main' }}
            >
              <CheckCircle size={16} />
            </IconButton>
          </Tooltip>
        )}
        
        {['draft', 'submit'].includes(admission.state) && (
          <Tooltip title="Annuler l'admission">
            <IconButton
              onClick={() => handleAction(admission.id, 'cancel')}
              size="small"
              disabled={actionLoading === 'cancel'}
              sx={{ 
                color: 'grey.600',
                '&:hover': { bgcolor: 'grey.200' }
              }}
            >
              <X size={16} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Dialog de confirmation pour conversion en étudiant */}
      <Dialog 
        open={convertDialog} 
        onClose={() => setConvertDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <UserPlus size={24} />
          Convertir en étudiant officiel
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Cette action va créer un nouvel étudiant officiel dans le système à partir de cette admission confirmée.
          </Alert>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Détails de l'admission :
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Nom :</strong> {admission.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Email :</strong> {admission.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Téléphone :</strong> {admission.phone}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Cours :</strong> {admission.course?.name || 'N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Promotion :</strong> {admission.batch?.name || 'N/A'}
            </Typography>
          </Box>

          <Alert severity="warning">
            <Typography variant="body2">
              ⚠️ Cette action est irréversible. L'étudiant sera automatiquement ajouté à la liste officielle des étudiants de l'école.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button 
            onClick={() => setConvertDialog(false)}
            variant="outlined"
            disabled={converting}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleConvertToStudent}
            variant="contained"
            disabled={converting}
            startIcon={converting ? null : <UserPlus size={18} />}
            sx={{
              bgcolor: 'secondary.main',
              '&:hover': { bgcolor: 'secondary.dark' }
            }}
          >
            {converting ? 'Conversion...' : 'Convertir en étudiant'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.severity} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ActionButtons; 