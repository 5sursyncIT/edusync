import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Avatar,
  Fade,
  Zoom,
  Stack,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  Alert,
  Snackbar,
  Button
} from '@mui/material';
import {
  GraduationCap,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  RefreshCw as RefreshIcon,
  BarChart3,
  Plus
} from 'lucide-react';

// Imports des composants séparés
import { admissionsAPI } from './services/admissionsAPI';
import AdmissionsList from './AdmissionsList';
import StatusBadge from './components/StatusBadge';
import AdmissionForm from './components/AdmissionForm';
import SimpleModal from './components/SimpleModal';
import DetailedReports from './components/DetailedReports';

// Composant pour les statistiques modernes
const ModernStatisticsCards = ({ statistics, loading }) => {
  const defaultStats = {
    total_admissions: 0,
    recent_admissions: 0,
    conversion_rate: 0,
    status_distribution: { submit: 0 }
  };

  const stats = statistics || defaultStats;

  const statisticsData = [
    {
      title: 'Total Admissions',
      value: stats.total_admissions,
      icon: <Users className="w-6 h-6" />,
      color: 'primary',
      bgColor: 'white'
    },
    {
      title: 'Récentes (30j)',
      value: stats.recent_admissions,
      icon: <Calendar className="w-6 h-6" />,
      color: 'success',
      bgColor: 'white'
    },
    {
      title: 'Taux Conversion',
      value: `${stats.conversion_rate}%`,
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'info',
      bgColor: 'white'
    },
    {
      title: 'En Attente',
      value: stats.status_distribution?.submit || 0,
      icon: <Clock className="w-6 h-6" />,
      color: 'warning',
      bgColor: 'white'
    }
  ];

  if (loading) {
    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ 
              height: '120px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center'
            }}>
              <CircularProgress size={24} />
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {statisticsData.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Zoom in={true} timeout={300 + index * 100}>
            <Card 
              sx={{ 
                height: '120px',
                background: 'white',
                border: `1px solid ${stat.bgColor}`,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                  border: `2px solid ${stat.bgColor}`,
                }
              }}
            >
              <CardContent sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Avatar
                    sx={{
                      bgcolor: stat.color + '.main',
                      width: 56,
                      height: 56,
                      mr: 2,
                      boxShadow: 3
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h4" fontWeight="bold" color={stat.color + '.main'}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight="medium">
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>
      ))}
    </Grid>
  );
};

// Composant principal de gestion des admissions
const AdmissionsManagement = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [statistics, setStatistics] = useState(null);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Charger les données
  useEffect(() => {
    loadAdmissions();
    loadStatistics();
  }, [pagination.page, searchTerm, statusFilter]);

  const loadAdmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        status: statusFilter
      };
      const response = await admissionsAPI.getAdmissions(params);
      if (response.status === 'success') {
        setAdmissions(response.data.admissions);
        setPagination(prev => ({ ...prev, ...response.data.pagination }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setError('Erreur lors du chargement des admissions');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    setStatisticsLoading(true);
    try {
      const response = await admissionsAPI.getStatistics();
      if (response.status === 'success') {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('Erreur statistiques:', error);
    } finally {
      setStatisticsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAdmissions();
    loadStatistics();
  };

  const handleAction = async (admissionId, action) => {
    try {
      const response = await admissionsAPI.admissionAction(admissionId, action);
      if (response.status === 'success') {
        loadAdmissions();
        setSuccessMessage(response.message || 'Action effectuée avec succès');
      } else {
        setError(response.message || 'Erreur lors de l\'action');
      }
    } catch (error) {
      console.error('Erreur action:', error);
      setError('Erreur lors de l\'action');
    }
  };

  const openModal = (type, admission = null) => {
    console.log('🔍 openModal appelé avec:', { type, admission });
    setModalType(type);
    setSelectedAdmission(admission);
    setShowModal(true);
    console.log('🪟 État modal après ouverture:', { modalType: type, showModal: true });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Rendu principal
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Fade in={true} timeout={500}>
        <Box>
          {/* En-tête moderne */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 4,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 3, sm: 0 }
          }}>
            <Box>
              <Typography 
                variant="h4" 
                fontWeight="bold" 
                color="blue"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2,
                  mb: 1
                }}
              >
                <GraduationCap className="w-10 h-10" style={{ color: 'blue' }} />
                Gestion des Admissions
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Gérez les demandes d'admission des étudiants
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={2}>
              <Tooltip title="Actualiser les données">
                <IconButton
                  onClick={handleRefresh}
                  disabled={loading || statisticsLoading}
                  sx={{ 
                    bgcolor: 'blue',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.main' }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<Plus />}
                onClick={() => {
                  console.log('🔘 Bouton "Nouvelle Admission" cliqué !');
                  console.log('🔍 État actuel:', { showModal, modalType });
                  openModal('create');
                }}
                size="large"
                sx={{ 
                  px: 2, 
                  py: 1,
                  borderRadius: 3,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  boxShadow: 3,
                  color: 'blue',
                  background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                  '&:hover': {
                    boxShadow: 8,
                    transform: 'translateY(-2px)',
                  }
                }}
              >
                Nouvelle Admission
              </Button>
            </Stack>
          </Box>

          {/* Cartes de statistiques modernes */}
          <ModernStatisticsCards 
            statistics={statistics} 
            loading={statisticsLoading} 
          />

          {/* Messages d'erreur/succès */}
          {error && (
            <Fade in={true}>
              <Alert 
                severity="error" 
                sx={{ mb: 3, borderRadius: 2 }} 
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            </Fade>
          )}

          {/* Onglets modernes */}
          <Paper 
            elevation={3} 
            sx={{ 
              mb: 3, 
              borderRadius: 3,
              overflow: 'hidden'
            }}
          >
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  minHeight: 64,
                  fontWeight: 'bold',
                  fontSize: '1.1rem'
                }
              }}
            >
              <Tab 
                label="Liste des admissions" 
                icon={<Users className="w-5 h-5" style={{ color: 'blue' }} />}
                iconPosition="start"
              />
              <Tab 
                label="Rapports détaillés" 
                icon={<BarChart3 className="w-5 h-5" style={{ color: 'blue' }} />}
                iconPosition="start"
              />
            </Tabs>
          </Paper>

          {/* Contenu selon l'onglet */}
          <Box>
            {activeTab === 0 && (
              <AdmissionsList
                admissions={admissions}
                loading={loading}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                pagination={pagination}
                setPagination={setPagination}
                onAction={handleAction}
                openModal={openModal}
              />
            )}
            {activeTab === 1 && (
              <DetailedReports />
            )}
          </Box>

          {/* Modal */}
          <SimpleModal
            open={showModal}
            onClose={() => {
              console.log('🔒 Fermeture du modal');
              setShowModal(false);
            }}
            title={
              modalType === 'create' ? 'Nouvelle admission' :
              modalType === 'edit' ? 'Modifier l\'admission' :
              'Détails de l\'admission'
            }
          >
            {modalType === 'view' && selectedAdmission ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Nom complet</label>
                    <p className="text-lg">{selectedAdmission.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Statut</label>
                    <StatusBadge status={selectedAdmission.state} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <p>{selectedAdmission.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Téléphone</label>
                    <p>{selectedAdmission.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Cours</label>
                    <p>{selectedAdmission.course?.name || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Promotion</label>
                    <p>{selectedAdmission.batch?.name || '-'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <AdmissionForm
                admission={modalType === 'edit' ? selectedAdmission : null}
                onSave={() => {
                  console.log('💾 Sauvegarde réussie');
                  setShowModal(false);
                  loadAdmissions();
                  setSuccessMessage('Admission sauvegardée avec succès');
                }}
                onCancel={() => {
                  console.log('❌ Annulation du formulaire');
                  setShowModal(false);
                }}
              />
            )}
          </SimpleModal>

          {/* Snackbar pour les messages de succès */}
          <Snackbar
            open={!!successMessage}
            autoHideDuration={6000}
            onClose={() => setSuccessMessage('')}
          >
            <Alert 
              onClose={() => setSuccessMessage('')} 
              severity="success" 
              sx={{ width: '100%' }}
            >
              {successMessage}
            </Alert>
          </Snackbar>
        </Box>
      </Fade>
    </Container>
  );
};

export default AdmissionsManagement;