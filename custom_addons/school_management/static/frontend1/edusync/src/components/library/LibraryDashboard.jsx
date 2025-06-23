import React from 'react';
import { Link } from 'react-router-dom';
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
  Alert,
  Button
} from '@mui/material';
import { 
  BookOpen, 
  Users, 
  Tag, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  Plus,
  Search,
  BarChart
} from 'lucide-react';
import { useLibraryStatistics } from '../../hooks/useLibrary';

// Composant pour les cartes de statistiques modernisées
const ModernStatCard = ({ title, value, icon: Icon, color, trend, link, loading }) => (
  <Zoom in={true} timeout={300}>
    <Card 
      sx={{ 
        height: '120px',
        background: 'white',
        border: '1px solid white',
        borderRadius: 3,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
          border: '2px solid white',
        }
      }}
    >
      <CardContent sx={{ 
        p: 3, 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center'
      }}>
        {loading ? (
          <CircularProgress size={24} />
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Avatar
              sx={{
                bgcolor: color.replace('linear-gradient(135deg, ', '').split(' ')[0],
                width: 56,
                height: 56,
                mr: 2,
                boxShadow: 3
              }}
            >
              <Icon className="w-6 h-6" />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                {value}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight="medium">
                {title}
              </Typography>
              {trend && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <Typography variant="caption" color="text.secondary">
                    {trend}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  </Zoom>
);

// Composant pour les cartes d'actions rapides
const ModernQuickActionCard = ({ title, description, icon: Icon, color, onClick, link }) => {
  const Component = link ? Link : 'div';
  const props = link ? { to: link, style: { textDecoration: 'none' } } : { onClick };
  
  return (
    <Component {...props}>
      <Card
        sx={{
          height: '120px',
          borderRadius: 3,
          border: '1px solid white',
          transition: 'all 0.3s ease-in-out',
          cursor: 'pointer',
          background: 'white',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 6,
            border: '2px solid white'
          }
        }}
      >
        <CardContent sx={{ 
          p: 3, 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center'
        }}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: 56,
              height: 56,
              mr: 2,
              boxShadow: 3
            }}
          >
            <Icon className="w-6 h-6" style={{ color: 'white' }} />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Component>
  );
};

const LibraryDashboard = () => {
  const { statistics, loading, error } = useLibraryStatistics();

  // Données des statistiques avec couleurs modernes
  const statisticsData = [
    {
      title: 'Total des Livres',
      value: loading ? "..." : statistics?.total_books?.toLocaleString() || '0',
      icon: BookOpen,
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      link: '/library/books'
    },
    {
      title: 'Emprunts Actifs',
      value: loading ? "..." : statistics?.active_borrowings?.toLocaleString() || '0',
      icon: Clock,
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      link: '/library/borrowings?state=issue'
    },
    {
      title: 'Livres en Retard',
      value: loading ? "..." : statistics?.overdue_borrowings?.toLocaleString() || '0',
      icon: AlertTriangle,
      color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      link: '/library/borrowings?state=overdue'
    },
    {
      title: 'Auteurs',
      value: loading ? "..." : statistics?.total_authors?.toLocaleString() || '0',
      icon: Users,
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      link: '/library/authors'
    },
    {
      title: 'Catégories',
      value: loading ? "..." : statistics?.total_categories?.toLocaleString() || '0',
      icon: Tag,
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      link: '/library/categories'
    }
  ];

  // Actions rapides avec couleurs
  const quickActions = [
    {
      title: 'Gérer les Livres',
      description: 'Ajouter, modifier ou supprimer des livres',
      icon: BookOpen,
      color: 'primary.main',
      link: '/library/books'
    },
    {
      title: 'Emprunts & Retours',
      description: 'Gérer les emprunts et les retours',
      icon: Clock,
      color: 'info.main',
      link: '/library/borrowings'
    },
    {
      title: 'Gérer les Auteurs',
      description: 'Ajouter et modifier les auteurs',
      icon: Users,
      color: 'success.main',
      link: '/library/authors'
    },
    {
      title: 'Catégories',
      description: 'Organiser les livres par catégories',
      icon: Tag,
      color: 'warning.main',
      link: '/library/categories'
    },
    {
      title: 'Recherche Avancée',
      description: 'Rechercher des livres avec des filtres',
      icon: Search,
      color: 'primary.main',
      link: '/library/search'
    },
    {
      title: 'Rapports',
      description: 'Statistiques et analyses détaillées',
      icon: BarChart,
      color: 'info.main',
      link: '/library/reports'
    }
  ];

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert 
          severity="error" 
          sx={{ borderRadius: 2 }}
          icon={<AlertTriangle />}
        >
          Erreur lors du chargement des statistiques: {error}
        </Alert>
      </Container>
    );
  }

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
                <BookOpen className="w-10 h-10" style={{ color: 'blue' }} />
                Gestion de Bibliothèque
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Tableau de bord et statistiques
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={2}>
              <Tooltip title="Nouveau livre">
                <IconButton
                  component={Link}
                  to="/library/books/new"
                  sx={{ 
                    bgcolor: 'blue',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.main' }
                  }}
                >
                  <Plus />
                </IconButton>
              </Tooltip>
              
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<Search />}
                component={Link}
                to="/library/search"
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
                Rechercher
              </Button>
            </Stack>
          </Box>

          {/* Cartes de statistiques modernisées */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {statisticsData.map((stat, index) => (
              <Grid item xs={12} sm={6} md={2.4} key={index}>
                <ModernStatCard
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  color={stat.color}
                  link={stat.link}
                  loading={loading}
                />
              </Grid>
            ))}
          </Grid>

          {/* Actions rapides */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
              Actions Rapides
            </Typography>
            <Grid container spacing={3}>
              {quickActions.map((action, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <ModernQuickActionCard
                    title={action.title}
                    description={action.description}
                    icon={action.icon}
                    color={action.color}
                    link={action.link}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Section des dernières activités */}
          <Paper 
            elevation={4} 
            sx={{ 
              p: 4, 
              borderRadius: 3,
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              minHeight: 300
            }}
          >
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
              Activités Récentes
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Les dernières activités de la bibliothèque seront affichées ici.
            </Typography>
          </Paper>
        </Box>
      </Fade>
    </Container>
  );
};

export default LibraryDashboard; 