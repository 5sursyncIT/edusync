import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Grid,
  AppBar,
  Toolbar,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Stack,
  Fade,
  Zoom,
  Badge,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  MenuBook as BookIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Assessment as AssessmentIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Home as HomeIcon,
  Notifications as NotificationsIcon,
  BarChart as BarChartIcon,
  Group as GroupIcon,
  Event as EventIcon,
  Message as MessageIcon
} from '@mui/icons-material';
import { parentAPI } from './ParentAPI';
import ParentSettings from './ParentSettings';
import StudentGrades from './StudentGrades';
import StudentAttendance from './StudentAttendance';
import StudentTimetable from './StudentTimetable';
import StudentFees from './StudentFees';
import StudentMessages from './StudentMessages';

const ParentDashboard = ({ parentInfo, onLogout }) => {
  const darkBlue = '#00008B';
  
  const [activeTab, setActiveTab] = useState(0);
  const [selectedChild, setSelectedChild] = useState(null);
  const [dashboardData, setDashboardData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (parentInfo?.children && parentInfo.children.length > 0) {
      setSelectedChild(parentInfo.children[0]);
      console.log('👶 Enfant sélectionné:', parentInfo.children[0]);
    }
  }, [parentInfo]);

  useEffect(() => {
    if (selectedChild && activeTab === 0) {
      loadDashboard();
    }
  }, [selectedChild, activeTab]);

  const loadDashboard = async () => {
    if (!selectedChild) return;
    
    setLoading(true);
    try {
      const response = await parentAPI.getStudentDashboard(selectedChild.id);
      if (response.status === 'success') {
        setDashboardData(response.data);
      } else {
        // Si l'API retourne une erreur, utiliser des données par défaut
        setDashboardData({
          recent_grades: [],
          attendance_rate: 0,
          pending_fees: 0,
          today_classes: [],
          recent_activities: [],
        });
      }
    } catch (error) {
      console.error('Erreur dashboard:', error);
      // En cas d'erreur réseau, utiliser des données par défaut
      setDashboardData({
        recent_grades: [],
        attendance_rate: 0,
        pending_fees: 0,
        today_classes: [],
        recent_activities: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('parent_session_id');
    localStorage.removeItem('parent_info');
    onLogout();
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleChildChange = (event) => {
    const child = parentInfo.children.find(c => c.id === parseInt(event.target.value));
    setSelectedChild(child);
    console.log('👶 Enfant sélectionné:', child);
  };

  // Configuration des onglets
  const tabs = [
    { label: 'Tableau de bord', icon: <HomeIcon /> },
    { label: 'Notes', icon: <AssessmentIcon /> },
    { label: 'Présence', icon: <CalendarIcon /> },
    { label: 'Emploi du temps', icon: <ScheduleIcon /> },
    { label: 'Frais scolaires', icon: <MoneyIcon /> },
    { label: 'Messages', icon: <MessageIcon /> },
    { label: 'Paramètres', icon: <SettingsIcon /> }
  ];

  // Cartes de statistiques
  const StatCard = ({ title, value, icon, color = darkBlue, subtitle }) => (
    <Zoom in={true} timeout={300}>
      <Card
        elevation={2}
        sx={{
          height: '140px',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          border: '1px solid #e2e8f0',
          borderRadius: 3,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 6,
            border: `2px solid ${color}`,
          }
        }}
      >
        <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>
              {icon}
            </Avatar>
            <Typography variant="h4" fontWeight="bold" color={color}>
              {value}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight="medium">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </Zoom>
  );

  const renderTabContent = () => {
    if (!selectedChild) {
      return (
        <Paper sx={{ p: 6, textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <SchoolIcon sx={{ fontSize: 64, color: '#94a3b8', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#475569', fontWeight: 500 }} gutterBottom>
            Aucun enfant trouvé
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Veuillez contacter l'administration pour associer vos enfants à votre compte.
          </Typography>
        </Paper>
      );
    }

    switch (activeTab) {
      case 0: // Dashboard
        return (
          <Fade in={true} timeout={500}>
            <Box>
              <Typography variant="h5" fontWeight="bold" color={darkBlue} gutterBottom>
                Tableau de bord - {selectedChild.name}
              </Typography>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={3} sx={{ mt: 2 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                      title="Notes Récentes"
                      value={dashboardData.recent_grades?.length || 0}
                      icon={<AssessmentIcon />}
                      color="#10b981"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                      title="Taux de Présence"
                      value={`${dashboardData.attendance_rate || 0}%`}
                      icon={<CheckCircleIcon />}
                      color="#3b82f6"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                      title="Frais Restants"
                      value={dashboardData.pending_fees ? `${dashboardData.pending_fees}€` : '0€'}
                      icon={<MoneyIcon />}
                      color="#f59e0b"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                      title="Cours Aujourd'hui"
                      value={dashboardData.today_classes?.length || 0}
                      icon={<ScheduleIcon />}
                      color="#8b5cf6"
                    />
                  </Grid>
                  
                  {/* Activités récentes */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '300px' }}>
                      <CardContent>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          Activités Récentes
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        {dashboardData.recent_activities?.length > 0 ? (
                          <List>
                            {dashboardData.recent_activities.slice(0, 4).map((activity, index) => (
                              <ListItem key={index} divider>
                                <ListItemIcon>
                                  {activity.type === 'grade' && <AssessmentIcon color="primary" />}
                                  {activity.type === 'attendance' && <CalendarIcon color="secondary" />}
                                  {activity.type === 'fee' && <MoneyIcon color="warning" />}
                                </ListItemIcon>
                                <ListItemText
                                  primary={activity.title}
                                  secondary={activity.date}
                                />
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                              Aucune activité récente
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Cours du jour */}
                  <Grid item xs={12} md={6}>
                    <Card sx={{ height: '300px' }}>
                      <CardContent>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          Cours d'Aujourd'hui
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        {dashboardData.today_classes?.length > 0 ? (
                          <List>
                            {dashboardData.today_classes.map((classItem, index) => (
                              <ListItem key={index} divider>
                                <ListItemIcon>
                                  <BookIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={classItem.subject}
                                  secondary={`${classItem.time} - ${classItem.teacher}`}
                                />
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                              Aucun cours aujourd'hui
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
            </Box>
          </Fade>
        );
      
      case 1: // Notes
        return <StudentGrades selectedChild={selectedChild} />;
      
      case 2: // Présence  
        return <StudentAttendance selectedChild={selectedChild} />;
      
      case 3: // Emploi du temps
        return <StudentTimetable selectedChild={selectedChild} />;
      
      case 4: // Frais scolaires
        return <StudentFees selectedChild={selectedChild} />;
      
      case 5: // Messages
        return <StudentMessages selectedChild={selectedChild} />;
      
      case 6: // Paramètres
        return <ParentSettings parentInfo={parentInfo} />;
      
      default:
        return null;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* En-tête */}
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{
          bgcolor: darkBlue,
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        <Toolbar>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ flexGrow: 1 }}>
            <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }}>
              <SchoolIcon />
            </Avatar>
            <Typography variant="h6" fontWeight="bold" color="white">
              Portail Parent
            </Typography>
          </Stack>

          {/* Sélecteur d'enfant */}
          {parentInfo?.children && parentInfo.children.length > 1 && (
            <FormControl size="small" sx={{ minWidth: 200, mr: 2 }}>
              <InputLabel sx={{ color: 'white' }}>Enfant</InputLabel>
              <Select
                value={selectedChild?.id || ''}
                onChange={handleChildChange}
                label="Enfant"
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white',
                  },
                  '& .MuiSelect-icon': {
                    color: 'white',
                  },
                }}
              >
                {parentInfo.children.map((child) => (
                  <MenuItem key={child.id} value={child.id}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: darkBlue }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                      <Typography>{child.name}</Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton color="inherit" sx={{ mr: 1 }}>
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Profil parent */}
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mr: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }}>
              <PersonIcon />
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" color="white" fontWeight="medium">
                {parentInfo?.name || 'Parent'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {parentInfo?.email}
              </Typography>
            </Box>
          </Stack>

          {/* Bouton déconnexion */}
          <Tooltip title="Déconnexion">
            <IconButton color="inherit" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Navigation par onglets */}
        <Paper sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.95rem',
              },
              '& .Mui-selected': {
                color: darkBlue,
                fontWeight: 'bold',
              },
              '& .MuiTabs-indicator': {
                backgroundColor: darkBlue,
                height: 3,
              },
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                icon={tab.icon}
                label={tab.label}
                iconPosition="start"
                sx={{ px: 3 }}
              />
            ))}
          </Tabs>
        </Paper>

        {/* Contenu de l'onglet actif */}
        {renderTabContent()}
      </Container>
    </Box>
  );
};

export default ParentDashboard; 