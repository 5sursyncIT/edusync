import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  Pagination,
  Snackbar,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  MonetizationOn as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import useFees from '../../hooks/useFees';
import { formatDate } from '../../config/apiConfig';

// Composant principal de gestion des frais
const FeesManagement = () => {
  const [currentTab, setCurrentTab] = useState(0);
  
  // Utilisation du hook personnalisé
  const {
    // Données
    feesTerms,
    feesDetails,
    statistics,
    unpaidFees,
    overdueFees,
    students,
    
    // États UI
    loading,
    error,
    success,
    
    // Pagination
    termsPagination,
    detailsPagination,
    
    // Actions
    loadAllData,
    createTerm,
    updateTerm,
    deleteTerm,
    createDetail,
    updateDetail,
    deleteDetail,
    generateStudentFees,
    applyLateFee,
    goToTermsPage,
    goToDetailsPage,
    clearMessages,
    loadStudents
  } = useFees();

  // États pour les dialogues
  const [termDialog, setTermDialog] = useState({ open: false, mode: 'create', data: null });
  const [detailDialog, setDetailDialog] = useState({ open: false, mode: 'create', data: null });

  // Charger les données initiales
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Gestion des onglets
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Composant des statistiques
  const StatisticsCards = () => {
    if (!statistics) return null;

    return (
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ReceiptIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6" component="div">
                    {statistics.terms.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Termes de frais
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <MoneyIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6" component="div">
                    {statistics.amounts.total_amount.toLocaleString()} €
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Montant total
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUpIcon color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6" component="div">
                    {statistics.amounts.payment_rate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Taux de paiement
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <WarningIcon color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6" component="div">
                    {statistics.details.late}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Frais en retard
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Composant tableau des termes de frais
  const FeesTermsTable = () => (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Année scolaire</TableCell>
              <TableCell>Obligatoire</TableCell>
              <TableCell>Méthode de paiement</TableCell>
              <TableCell>Frais de retard</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {feesTerms.map((term) => (
              <TableRow key={term.id}>
                <TableCell>{term.name}</TableCell>
                <TableCell>{term.school_year.name || 'N/A'}</TableCell>
                <TableCell>
                  <Chip
                    label={term.is_mandatory ? 'Oui' : 'Non'}
                    color={term.is_mandatory ? 'primary' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{term.payment_method}</TableCell>
                <TableCell>{term.late_fee_amount} €</TableCell>
                <TableCell>
                  <Tooltip title="Modifier">
                    <IconButton
                      size="small"
                      onClick={() => handleEditTerm(term)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Supprimer">
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteTerm(term.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {termsPagination.pages > 1 && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination
            count={termsPagination.pages}
            page={termsPagination.page}
            onChange={(event, page) => goToTermsPage(page)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );

  // Composant tableau des détails de frais
  const FeesDetailsTable = () => (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Étudiant</TableCell>
              <TableCell>Montant</TableCell>
              <TableCell>Méthode de paiement</TableCell>
              <TableCell>État</TableCell>
              <TableCell>Date limite</TableCell>
              <TableCell>En retard</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {feesDetails.map((detail) => {
              // Calculer si le frais est en retard
              const isOverdue = detail.payment_deadline && 
                new Date(detail.payment_deadline) < new Date() && 
                detail.state === 'draft';
              
              // Calculer les jours de retard
              const daysOverdue = detail.payment_deadline ? 
                Math.max(0, Math.floor((new Date() - new Date(detail.payment_deadline)) / (1000 * 60 * 60 * 24))) : 0;

              // Fonction pour formater la date de manière plus robuste
              const formatPaymentDeadline = (dateString) => {
                if (!dateString) return 'Aucune date limite';
                
                try {
                  // Essayer différents formats de date
                  let date;
                  
                  // Si c'est déjà un objet Date
                  if (dateString instanceof Date) {
                    date = dateString;
                  }
                  // Si c'est une chaîne au format ISO ou similaire
                  else if (typeof dateString === 'string') {
                    // Nettoyer la chaîne (enlever les heures si présentes)
                    const cleanDateString = dateString.split('T')[0];
                    date = new Date(cleanDateString);
                  }
                  // Si c'est un timestamp
                  else if (typeof dateString === 'number') {
                    date = new Date(dateString);
                  }
                  else {
                    console.error('Type de date non supporté:', typeof dateString, dateString);
                    return 'Format de date invalide';
                  }
                  
                  // Vérifier si la date est valide
                  if (isNaN(date.getTime())) {
                    console.error('Date invalide après parsing:', date, 'depuis:', dateString);
                    return 'Date invalide';
                  }
                  
                  // Utiliser formatDate ou formater manuellement
                  const day = date.getDate().toString().padStart(2, '0');
                  const month = (date.getMonth() + 1).toString().padStart(2, '0');
                  const year = date.getFullYear();
                  
                  const formattedDate = `${day}/${month}/${year}`;
                  return formattedDate;
                } catch (error) {
                  console.error('Erreur lors du formatage de la date:', error, 'Date:', dateString);
                  return 'Erreur de formatage';
                }
              };

              return (
                <TableRow key={detail.id}>
                  <TableCell>{detail.student?.name || 'Nom non disponible'}</TableCell>
                  <TableCell>{detail.amount} €</TableCell>
                  <TableCell>
                    {detail.payment_method === 'cash' && 'Espèces'}
                    {detail.payment_method === 'bank_transfer' && 'Virement bancaire'}
                    {detail.payment_method === 'check' && 'Chèque'}
                    {detail.payment_method === 'card' && 'Carte bancaire'}
                    {detail.payment_method === 'mobile_money' && 'Mobile Money'}
                    {!['cash', 'bank_transfer', 'check', 'card', 'mobile_money'].includes(detail.payment_method) && detail.payment_method}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={detail.state === 'draft' ? 'Impayé' : 'Payé'}
                      color={detail.state === 'draft' ? 'error' : 'success'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {formatPaymentDeadline(detail.payment_deadline)}
                  </TableCell>
                  <TableCell>
                    {isOverdue ? (
                      <Chip
                        label={`En retard (${daysOverdue} jour${daysOverdue > 1 ? 's' : ''})`}
                        color="warning"
                        size="small"
                        icon={<WarningIcon />}
                      />
                    ) : (
                      detail.state === 'paid' ? (
                        <Chip
                          label="Payé à temps"
                          color="success"
                          size="small"
                        />
                      ) : (
                        <Chip
                          label="Dans les délais"
                          color="info"
                          size="small"
                        />
                      )
                    )}
                  </TableCell>
                  <TableCell>
                    {/* Bouton pour appliquer les frais de retard */}
                    {isOverdue && detail.state === 'draft' && (
                      <Tooltip title="Appliquer frais de retard">
                        <IconButton
                          size="small"
                          onClick={() => handleApplyLateFee(detail.id)}
                          color="warning"
                        >
                          <MoneyIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    {/* Bouton pour modifier le détail */}
                    <Tooltip title="Modifier">
                      <IconButton
                        size="small"
                        onClick={() => handleEditDetail(detail)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    
                    {/* Bouton Supprimer - seulement pour les frais non payés */}
                    {detail.state === 'draft' && (
                      <Tooltip title="Supprimer ce détail de frais">
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleDeleteDetail(detail.id)}
                          sx={{ minWidth: 'auto', p: 1 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </Button>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      {detailsPagination.pages > 1 && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination
            count={detailsPagination.pages}
            page={detailsPagination.page}
            onChange={(event, page) => goToDetailsPage(page)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );

  // Gestionnaires d'événements
  const handleEditTerm = (term) => {
    setTermDialog({ open: true, mode: 'edit', data: term });
  };

  const handleEditDetail = (detail) => {
    setDetailDialog({ open: true, mode: 'edit', data: detail });
  };

  const handleDeleteTerm = async (termId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce terme de frais ?')) {
      try {
        await deleteTerm(termId);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleDeleteDetail = async (detailId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce détail de frais ?')) {
      try {
        await deleteDetail(detailId);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleApplyLateFee = async (detailId) => {
    if (window.confirm('Êtes-vous sûr de vouloir appliquer des frais de retard ?')) {
      try {
        await applyLateFee(detailId);
      } catch (error) {
        console.error('Erreur lors de l\'application des frais de retard:', error);
      }
    }
  };

  // Gestionnaires pour les dialogues
  const handleTermSubmit = async (formData) => {
    try {
      if (termDialog.mode === 'create') {
        await createTerm(formData);
      } else {
        await updateTerm(termDialog.data.id, formData);
      }
      setTermDialog({ open: false, mode: 'create', data: null });
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    }
  };

  const handleDetailSubmit = async (formData) => {
    try {
      if (detailDialog.mode === 'create') {
        await createDetail(formData);
      } else {
        await updateDetail(detailDialog.data.id, formData);
      }
      setDetailDialog({ open: false, mode: 'create', data: null });
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    }
  };

  // Composant Dialog pour les termes de frais
  const TermDialog = () => {
    const [formData, setFormData] = useState({
      name: termDialog.data?.name || '',
      is_mandatory: termDialog.data?.is_mandatory || false,
      payment_method: termDialog.data?.payment_method || 'cash',
      late_fee_amount: termDialog.data?.late_fee_amount || 0
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      handleTermSubmit(formData);
    };

    const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
      <Dialog 
        open={termDialog.open} 
        onClose={() => setTermDialog({ open: false, mode: 'create', data: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {termDialog.mode === 'create' ? 'Créer un terme de frais' : 'Modifier le terme de frais'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              label="Nom du terme"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              sx={{ mb: 2 }}
            />
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Méthode de paiement</InputLabel>
              <Select
                value={formData.payment_method}
                onChange={(e) => handleChange('payment_method', e.target.value)}
                label="Méthode de paiement"
              >
                <MenuItem value="cash">Espèces</MenuItem>
                <MenuItem value="bank_transfer">Virement bancaire</MenuItem>
                <MenuItem value="check">Chèque</MenuItem>
                <MenuItem value="card">Carte bancaire</MenuItem>
                <MenuItem value="mobile_money">Mobile Money</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Frais de retard (€)"
              type="number"
              value={formData.late_fee_amount}
              onChange={(e) => handleChange('late_fee_amount', parseFloat(e.target.value) || 0)}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Obligatoire</InputLabel>
              <Select
                value={formData.is_mandatory}
                onChange={(e) => handleChange('is_mandatory', e.target.value)}
                label="Obligatoire"
              >
                <MenuItem value={true}>Oui</MenuItem>
                <MenuItem value={false}>Non</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setTermDialog({ open: false, mode: 'create', data: null })}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={loading}
            >
              {termDialog.mode === 'create' ? 'Créer' : 'Modifier'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  };

  // Composant Dialog pour les détails de frais
  const DetailDialog = () => {
    // Fonction pour convertir une date au format YYYY-MM-DD pour les inputs de type date
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      
      try {
        let date;
        if (dateString instanceof Date) {
          date = dateString;
        } else {
          date = new Date(dateString);
        }
        
        if (isNaN(date.getTime())) return '';
        
        // Format YYYY-MM-DD requis pour les inputs de type date
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        
        return `${year}-${month}-${day}`;
      } catch (error) {
        console.error('Erreur lors du formatage de la date pour input:', error);
        return '';
      }
    };

    const [formData, setFormData] = useState({
      student_id: detailDialog.data?.student?.id || '',
      amount: detailDialog.data?.amount || 0,
      payment_method: detailDialog.data?.payment_method || 'cash',
      payment_deadline: formatDateForInput(detailDialog.data?.payment_deadline) || ''
    });

    const [studentSearch, setStudentSearch] = useState('');

    // Réinitialiser le formulaire quand le dialogue change
    React.useEffect(() => {
      if (detailDialog.open) {
        setFormData({
          student_id: detailDialog.data?.student?.id || '',
          amount: detailDialog.data?.amount || 0,
          payment_method: detailDialog.data?.payment_method || 'cash',
          payment_deadline: formatDateForInput(detailDialog.data?.payment_deadline) || ''
        });
        setStudentSearch('');
        // Charger les étudiants seulement à l'ouverture du dialogue
        if (students.length === 0) {
          loadStudents();
        }
      }
    }, [detailDialog.open, detailDialog.data]);

    const handleSubmit = (e) => {
      e.preventDefault();
      handleDetailSubmit(formData);
    };

    const handleChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleStudentSearchChange = (event) => {
      const newSearch = event.target.value;
      setStudentSearch(newSearch);
      
      // Rechercher avec un délai pour éviter trop d'appels API
      if (newSearch.length > 2) {
        setTimeout(() => {
          loadStudents({ search: newSearch });
        }, 500);
      }
    };

    // Filtrer les étudiants selon la recherche
    const filteredStudents = (students || []).filter(student => 
      student && student.full_display && 
      student.full_display.toLowerCase().includes((studentSearch || '').toLowerCase())
    );

    return (
      <Dialog 
        open={detailDialog.open} 
        onClose={() => setDetailDialog({ open: false, mode: 'create', data: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {detailDialog.mode === 'create' ? 'Créer un détail de frais' : 'Modifier le détail de frais'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {detailDialog.mode === 'create' ? (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Étudiant</InputLabel>
                <Select
                  value={formData.student_id}
                  onChange={(e) => handleChange('student_id', e.target.value)}
                  label="Étudiant"
                  required
                >
                  <MenuItem value="">
                    <TextField
                      size="small"
                      placeholder="Rechercher un étudiant..."
                      value={studentSearch}
                      onChange={handleStudentSearchChange}
                      onClick={(e) => e.stopPropagation()}
                      fullWidth
                      sx={{ mb: 1 }}
                    />
                  </MenuItem>
                  {/* Debug: Afficher le nombre d'étudiants disponibles */}
                  <MenuItem disabled>
                    <em>{(students || []).length} étudiants disponibles</em>
                  </MenuItem>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <MenuItem key={student.id} value={student.id}>
                        {student.full_display}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>
                      {studentSearch ? 
                        `Aucun étudiant trouvé pour "${studentSearch}"` : 
                        (students && students.length > 0 ? 
                          'Tapez pour rechercher un étudiant' : 
                          'Aucun étudiant disponible - Vérifiez la connexion API'
                        )
                      }
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            ) : (
              <TextField
                fullWidth
                label="Étudiant"
                value={detailDialog.data?.student?.name || 'Nom non disponible'}
                disabled
                sx={{ mb: 2 }}
                helperText="L'étudiant ne peut pas être modifié en mode édition"
              />
            )}
            
            <TextField
              fullWidth
              label="Montant (€)"
              type="number"
              value={formData.amount}
              onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
              required
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Méthode de paiement</InputLabel>
              <Select
                value={formData.payment_method}
                onChange={(e) => handleChange('payment_method', e.target.value)}
                label="Méthode de paiement"
              >
                <MenuItem value="cash">Espèces</MenuItem>
                <MenuItem value="bank_transfer">Virement bancaire</MenuItem>
                <MenuItem value="check">Chèque</MenuItem>
                <MenuItem value="card">Carte bancaire</MenuItem>
                <MenuItem value="mobile_money">Mobile Money</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Date limite"
              type="date"
              value={formData.payment_deadline}
              onChange={(e) => handleChange('payment_deadline', e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setDetailDialog({ open: false, mode: 'create', data: null })}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={loading || (!formData.student_id && detailDialog.mode === 'create')}
            >
              {detailDialog.mode === 'create' ? 'Créer' : 'Modifier'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  };

  // Rendu principal
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestion des Frais Scolaires
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearMessages}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={clearMessages}>
          {success}
        </Alert>
      )}

      <StatisticsCards />

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Termes de frais" />
          <Tab label="Détails des frais" />
          <Tab label="Frais impayés" />
          <Tab label="Frais en retard" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              {currentTab === 0 && 'Termes de frais'}
              {currentTab === 1 && 'Détails des frais'}
              {currentTab === 2 && 'Frais impayés'}
              {currentTab === 3 && 'Frais en retard'}
            </Typography>
            
            <Box>
              <Button
                startIcon={<RefreshIcon />}
                onClick={loadAllData}
                sx={{ mr: 1 }}
                disabled={loading}
              >
                Actualiser
              </Button>
              
              {(currentTab === 0 || currentTab === 1) && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    if (currentTab === 0) {
                      setTermDialog({ open: true, mode: 'create', data: null });
                    } else {
                      setDetailDialog({ open: true, mode: 'create', data: null });
                    }
                  }}
                  disabled={loading}
                >
                  Ajouter
                </Button>
              )}
            </Box>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {currentTab === 0 && <FeesTermsTable />}
              {currentTab === 1 && <FeesDetailsTable />}
              {currentTab === 2 && (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Étudiant</TableCell>
                        <TableCell>Montant</TableCell>
                        <TableCell>Date limite</TableCell>
                        <TableCell>Jours de retard</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {unpaidFees.map((fee) => (
                        <TableRow key={fee.id}>
                          <TableCell>{fee.student.name}</TableCell>
                          <TableCell>{fee.amount} €</TableCell>
                          <TableCell>{formatDate(fee.payment_deadline) || 'Aucune date limite'}</TableCell>
                          <TableCell>
                            {fee.days_overdue > 0 && (
                              <Chip
                                label={`${fee.days_overdue} jours`}
                                color="warning"
                                size="small"
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              {currentTab === 3 && (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Étudiant</TableCell>
                        <TableCell>Montant</TableCell>
                        <TableCell>Frais de retard</TableCell>
                        <TableCell>Jours de retard</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {overdueFees.map((fee) => (
                        <TableRow key={fee.id}>
                          <TableCell>{fee.student.name}</TableCell>
                          <TableCell>{fee.amount} €</TableCell>
                          <TableCell>{fee.late_fee_applied} €</TableCell>
                          <TableCell>
                            <Chip
                              label={`${fee.days_overdue} jours`}
                              color="error"
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </Box>
      </Paper>

      {/* Dialogues pour les formulaires */}
      <TermDialog />
      <DetailDialog />
    </Box>
  );
};

export default FeesManagement;