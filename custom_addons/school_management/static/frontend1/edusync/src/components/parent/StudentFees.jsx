import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Avatar,
  Stack,
  Divider,
  Fade,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
  Euro as EuroIcon,
  Print as PrintIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { parentAPI } from './ParentAPI';

const StudentFees = ({ selectedChild }) => {
  const darkBlue = '#00008B';
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState({});
  const [selectedFee, setSelectedFee] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (selectedChild) {
      loadFees();
    }
  }, [selectedChild, selectedYear]);

  const loadFees = async () => {
    if (!selectedChild) return;

    setLoading(true);
    setError('');

    try {
      const response = await parentAPI.getStudentFees(selectedChild.id);
      
      if (response.status === 'success') {
        setFees(response.data.fees || []);
        setSummary(response.data.summary || {});
      } else {
        setError(response.message || 'Erreur lors du chargement des frais');
        setFees([]);
        setSummary({});
      }
    } catch (error) {
      console.error('Erreur frais:', error);
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        setError('Service de frais scolaires non disponible. Veuillez contacter l\'administration.');
      } else {
        setError('Erreur de connexion');
      }
      setFees([]);
      setSummary({});
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#10b981';
      case 'partial': return '#f59e0b';
      case 'pending': return '#ef4444';
      case 'overdue': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircleIcon />;
      case 'partial': return <ScheduleIcon />;
      case 'pending': return <WarningIcon />;
      case 'overdue': return <CancelIcon />;
      default: return <PaymentIcon />;
    }
  };

  const getPaymentStatusText = (status) => {
    switch (status) {
      case 'paid': return 'Payé';
      case 'partial': return 'Partiel';
      case 'pending': return 'En attente';
      case 'overdue': return 'En retard';
      default: return 'Inconnu';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  };

  // Cartes de statistiques
  const StatCard = ({ title, value, subtitle, color = darkBlue, icon, percentage }) => (
    <Card
      elevation={2}
      sx={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        border: '1px solid #e2e8f0',
        borderRadius: 3,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 4,
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" fontWeight="medium">
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold" color={color} sx={{ mt: 1 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {percentage !== undefined && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#e2e8f0',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: color,
                      borderRadius: 3
                    }
                  }}
                />
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 48, height: 48, ml: 2 }}>
            {icon}
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );

  const handleViewDetails = (fee) => {
    setSelectedFee(fee);
    setDialogOpen(true);
  };

  const handlePrintReceipt = (fee) => {
    // Logique d'impression du reçu
    console.log('Impression du reçu pour:', fee);
  };

  // Générer les années (année courante et 2 précédentes)
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear];

  if (!selectedChild) {
    return (
      <Paper sx={{ p: 6, textAlign: 'center' }}>
        <SchoolIcon sx={{ fontSize: 64, color: '#94a3b8', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Sélectionnez un enfant pour voir ses frais scolaires
        </Typography>
      </Paper>
    );
  }

  return (
    <Fade in={true} timeout={500}>
      <Box>
        <Typography variant="h5" fontWeight="bold" color={darkBlue} gutterBottom>
          Frais Scolaires - {selectedChild.name}
        </Typography>

        {/* Statistiques */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total des Frais"
              value={formatCurrency(summary.total_fees)}
              subtitle="Année scolaire"
              color="#3b82f6"
              icon={<AccountBalanceIcon />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Montant Payé"
              value={formatCurrency(summary.paid_amount)}
              subtitle="Paiements effectués"
              color="#10b981"
              icon={<CheckCircleIcon />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Solde Restant"
              value={formatCurrency(summary.remaining_balance)}
              subtitle="À payer"
              color="#ef4444"
              icon={<WarningIcon />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Taux de Paiement"
              value={`${summary.payment_percentage || 0}%`}
              subtitle="Progression"
              color="#8b5cf6"
              icon={<PaymentIcon />}
              percentage={summary.payment_percentage || 0}
            />
          </Grid>
        </Grid>

        {/* Filtres */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Année Scolaire</InputLabel>
                  <Select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    label="Année Scolaire"
                  >
                    {years.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}-{year + 1}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CalendarIcon color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Messages d'erreur */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Chargement */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Tableau des frais */}
        {!loading && (
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Détail des Frais - Année {selectedYear}-{selectedYear + 1}
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {fees.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <ReceiptIcon sx={{ fontSize: 64, color: '#94a3b8', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Aucun frais disponible
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Les frais scolaires apparaîtront ici une fois configurés
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Date d'échéance</strong></TableCell>
                        <TableCell><strong>Type de Frais</strong></TableCell>
                        <TableCell><strong>Montant</strong></TableCell>
                        <TableCell><strong>Payé</strong></TableCell>
                        <TableCell><strong>Restant</strong></TableCell>
                        <TableCell><strong>Statut</strong></TableCell>
                        <TableCell><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {fees.map((fee, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <CalendarIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {new Date(fee.due_date).toLocaleDateString('fr-FR')}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Stack>
                              <Typography variant="body2" fontWeight="medium">
                                {fee.fee_type || 'Frais scolaires'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {fee.description || 'Frais de scolarité'}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {formatCurrency(fee.total_amount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="#10b981" fontWeight="medium">
                              {formatCurrency(fee.paid_amount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              color={fee.remaining_amount > 0 ? '#ef4444' : '#10b981'}
                              fontWeight="medium"
                            >
                              {formatCurrency(fee.remaining_amount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getPaymentStatusIcon(fee.status)}
                              label={getPaymentStatusText(fee.status)}
                              size="small"
                              sx={{
                                bgcolor: `${getPaymentStatusColor(fee.status)}20`,
                                color: getPaymentStatusColor(fee.status),
                                borderColor: getPaymentStatusColor(fee.status),
                                '& .MuiChip-icon': {
                                  color: getPaymentStatusColor(fee.status)
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<ReceiptIcon />}
                                onClick={() => handleViewDetails(fee)}
                              >
                                Détails
                              </Button>
                              {fee.status === 'paid' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<PrintIcon />}
                                  onClick={() => handlePrintReceipt(fee)}
                                >
                                  Reçu
                                </Button>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        )}

        {/* Dialog de détails */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Stack direction="row" alignItems="center" spacing={1}>
              <ReceiptIcon />
              <Typography variant="h6">
                Détails du Frais - {selectedFee?.fee_type}
              </Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            {selectedFee && (
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Informations Générales
                    </Typography>
                    <Stack spacing={1}>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">Type:</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedFee.fee_type}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">Description:</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedFee.description}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">Date d'échéance:</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(selectedFee.due_date).toLocaleDateString('fr-FR')}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, bgcolor: '#f8f9fa' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Détails Financiers
                    </Typography>
                    <Stack spacing={1}>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">Montant Total:</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatCurrency(selectedFee.total_amount)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">Montant Payé:</Typography>
                        <Typography variant="body2" color="#10b981">
                          {formatCurrency(selectedFee.paid_amount)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">Montant Restant:</Typography>
                        <Typography variant="body2" color="#ef4444">
                          {formatCurrency(selectedFee.remaining_amount)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
                {selectedFee.payments && selectedFee.payments.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Historique des Paiements
                    </Typography>
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Montant</TableCell>
                            <TableCell>Méthode</TableCell>
                            <TableCell>Référence</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedFee.payments.map((payment, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                {new Date(payment.date).toLocaleDateString('fr-FR')}
                              </TableCell>
                              <TableCell>{formatCurrency(payment.amount)}</TableCell>
                              <TableCell>{payment.method || 'N/A'}</TableCell>
                              <TableCell>{payment.reference || 'N/A'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>
              Fermer
            </Button>
            {selectedFee?.status === 'paid' && (
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => handlePrintReceipt(selectedFee)}
              >
                Télécharger Reçu
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Légende des statuts */}
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Légende des Statuts
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CheckCircleIcon sx={{ color: '#10b981' }} />
                  <Typography variant="body2">Payé</Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <ScheduleIcon sx={{ color: '#f59e0b' }} />
                  <Typography variant="body2">Paiement partiel</Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <WarningIcon sx={{ color: '#ef4444' }} />
                  <Typography variant="body2">En attente</Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CancelIcon sx={{ color: '#dc2626' }} />
                  <Typography variant="body2">En retard</Typography>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Fade>
  );
};

export default StudentFees; 