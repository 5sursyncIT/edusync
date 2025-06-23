import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Tooltip,
  Avatar,
  Stack,
  Chip,
  Badge
} from '@mui/material';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Mail, 
  Phone,
  Filter as FilterIcon,
  User as PersonIcon,
  Mail as EmailIcon,
  Phone as PhoneIcon,
  Calendar as CalendarIcon
} from 'lucide-react';
import StatusBadge from './components/StatusBadge';
import ActionButtons from './components/ActionButtons';
import { admissionsAPI } from './services/admissionsAPI';

// Composant liste des admissions modernisé
const AdmissionsList = ({ 
  // Props optionnelles pour utilisation en tant que composant enfant
  admissions: propAdmissions, 
  loading: propLoading, 
  searchTerm: propSearchTerm, 
  setSearchTerm: propSetSearchTerm, 
  statusFilter: propStatusFilter, 
  setStatusFilter: propSetStatusFilter, 
  pagination: propPagination, 
  setPagination: propSetPagination, 
  onAction: propOnAction, 
  openModal: propOpenModal 
}) => {
  // État local pour utilisation autonome
  const [localAdmissions, setLocalAdmissions] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [localStatusFilter, setLocalStatusFilter] = useState('');
  const [localPagination, setLocalPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  // Déterminer si on utilise les props ou l'état local
  const isStandalone = !propAdmissions;
  const admissions = isStandalone ? localAdmissions : propAdmissions;
  const loading = isStandalone ? localLoading : propLoading;
  const searchTerm = isStandalone ? localSearchTerm : propSearchTerm;
  const statusFilter = isStandalone ? localStatusFilter : propStatusFilter;
  const pagination = isStandalone ? localPagination : propPagination;

  const setSearchTerm = isStandalone ? setLocalSearchTerm : propSetSearchTerm;
  const setStatusFilter = isStandalone ? setLocalStatusFilter : propSetStatusFilter;
  const setPagination = isStandalone ? setLocalPagination : propSetPagination;

  // Charger les données en mode autonome
  useEffect(() => {
    if (isStandalone) {
      loadAdmissions();
    }
  }, [isStandalone, pagination.page, searchTerm, statusFilter]);

  const loadAdmissions = async () => {
    if (!isStandalone) return;
    
    setLocalLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        status: statusFilter
      };
      const response = await admissionsAPI.getAdmissions(params);
      if (response.status === 'success') {
        setLocalAdmissions(response.data.admissions);
        setLocalPagination(prev => ({ ...prev, ...response.data.pagination }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleAction = async (admissionId, action) => {
    if (propOnAction) {
      return propOnAction(admissionId, action);
    }

    // Action spéciale pour rafraîchir la liste
    if (action === 'refresh') {
      if (isStandalone) {
        loadAdmissions();
      }
      return;
    }

    try {
      const response = await admissionsAPI.admissionAction(admissionId, action);
      if (response.status === 'success') {
        loadAdmissions();
        alert(response.message);
      } else {
        alert(response.message);
      }
    } catch (error) {
      console.error('Erreur action:', error);
      alert('Erreur lors de l\'action');
    }
  };

  const handleOpenModal = (type, admission = null) => {
    if (propOpenModal) {
      return propOpenModal(type, admission);
    }
    
    // En mode autonome, nous pourrions ouvrir une nouvelle page ou modal
    if (type === 'view' && admission) {
      window.open(`/admissions/${admission.id}`, '_blank');
    } else if (type === 'edit' && admission) {
      window.open(`/admissions/${admission.id}/edit`, '_blank');
    } else if (type === 'create') {
      window.open('/admissions/create', '_blank');
    }
  };

  const handleChangePage = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage + 1 }));
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination(prev => ({ 
      ...prev, 
      limit: event.target.value, 
      page: 1 
    }));
  };

  return (
    <Box>
      {/* Barre de recherche et filtres modernisée */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 3,
          background: 'white'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          flexDirection: { xs: 'column', md: 'row' }
        }}>
          <Search color="primary" sx={{ fontSize: 28 }} />
          
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Rechercher par nom, email ou téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                bgcolor: 'white',
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} />
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl 
            sx={{ minWidth: 200 }}
            variant="outlined"
          >
            <InputLabel>Statut</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Statut"
              disabled={loading}
              sx={{
                borderRadius: 3,
                bgcolor: 'white'
              }}
            >
              <MenuItem value="">Tous les statuts</MenuItem>
              <MenuItem value="draft">Brouillon</MenuItem>
              <MenuItem value="submit">Soumise</MenuItem>
              <MenuItem value="confirm">Confirmée</MenuItem>
              <MenuItem value="reject">Rejetée</MenuItem>
              <MenuItem value="cancel">Annulée</MenuItem>
            </Select>
          </FormControl>

          <Badge badgeContent={pagination.total} color="primary" max={999}>
            <FilterIcon color="action" />
          </Badge>
        </Box>
      </Paper>

      {/* Tableau modernisé */}
      <Paper 
        elevation={4} 
        sx={{ 
          borderRadius: 3, 
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
        }}
      >
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: 400,
            gap: 2
          }}>
            <CircularProgress size={48} thickness={4} />
            <Typography variant="h6" color="text.secondary">
              Chargement des admissions...
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    {[
                      { label: 'Candidat', icon: <PersonIcon /> },
                      { label: 'Contact', icon: <EmailIcon /> },
                      { label: 'Date', icon: <CalendarIcon /> },
                      { label: 'Statut', icon: null },
                      { label: 'Actions', icon: null }
                    ].map((col, index) => (
                      <TableCell 
                        key={index}
                        sx={{ 
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                          color: 'blue',
                          textAlign: index === 4 ? 'center' : 'left'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {col.icon}
                          {col.label}
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {admissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          gap: 2 
                        }}>
                          <Avatar
                            sx={{
                              width: 64,
                              height: 64,
                              bgcolor: 'grey.100'
                            }}
                          >
                            <PersonIcon size={32} color="grey" />
                          </Avatar>
                          <Typography variant="h6" color="text.secondary">
                            Aucune admission trouvée
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Essayez de modifier vos critères de recherche
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    admissions.map((admission) => (
                      <TableRow 
                        key={admission.id} 
                        sx={{ 
                          '&:hover': { 
                            bgcolor: 'action.hover',
                            transform: 'scale(1.001)',
                            transition: 'all 0.2s ease-in-out'
                          }
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar
                              sx={{
                                bgcolor: 'primary.main',
                                width: 40,
                                height: 40
                              }}
                            >
                              {admission.name?.charAt(0)?.toUpperCase() || 'A'}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {admission.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {admission.application_number}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Stack spacing={1}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Mail size={16} />
                              <Typography variant="body2">
                                {admission.email}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Phone size={16} />
                              <Typography variant="body2">
                                {admission.phone}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Box>
                          <Typography variant="body2">
                            {admission.application_date ? 
                              new Date(admission.application_date).toLocaleDateString('fr-FR') : 
                              '-'
                            }
                          </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {admission.batch?.name || 'Aucune promotion'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={admission.state} />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="Voir les détails">
                              <IconButton
                                onClick={() => handleOpenModal('view', admission)}
                                size="small"
                                sx={{ 
                                  color: 'info.main',
                                  '&:hover': { bgcolor: 'info.light', color: 'white' }
                                }}
                              >
                                <Eye size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Modifier">
                              <IconButton
                                onClick={() => handleOpenModal('edit', admission)}
                                size="small"
                                sx={{ 
                                  color: 'warning.main',
                                  '&:hover': { bgcolor: 'warning.light', color: 'white' }
                                }}
                              >
                                <Edit size={16} />
                              </IconButton>
                            </Tooltip>
                            <ActionButtons admission={admission} onAction={handleAction} />
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination modernisée */}
            {pagination.pages > 1 && (
              <TablePagination
                component="div"
                count={pagination.total}
                page={pagination.page - 1}
                onPageChange={handleChangePage}
                rowsPerPage={pagination.limit}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[10, 20, 50, 100]}
                labelRowsPerPage="Éléments par page:"
                labelDisplayedRows={({ from, to, count }) => 
                  `${from}-${to} sur ${count !== -1 ? count : `plus que ${to}`}`
                }
                sx={{
                  borderTop: 1,
                  borderColor: 'divider',
                  bgcolor: 'background.paper'
                }}
              />
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default AdmissionsList;