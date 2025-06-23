import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Chip,
  useTheme,
  Button
} from '@mui/material';
import {
  School as SchoolIcon,
  Lightbulb as LightbulbIcon,
  Code as CodeIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Rocket as RocketIcon,
  CheckCircle as CheckCircleIcon,
  People as PeopleIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Support as SupportIcon,
  Update as UpdateIcon
} from '@mui/icons-material';
import Navbar from './layout/Navbar';
import Footer from './layout/Footer';

function AboutPage() {
  const theme = useTheme();
  const darkBlue = '#00008B';
  const elegantRed = '#B22222';

  // Technologies utilisées
  const technologies = [
    'Odoo ERP',
    'OpenEduCat',
    'React.js',
    'Python',
    'PostgreSQL',
    'Material-UI',
    'API REST'
  ];

  // Fonctionnalités principales
  const features = [
    {
      icon: <PeopleIcon fontSize="large" />,
      title: 'Gestion complète des élèves',
      description: 'Suivi des dossiers, inscriptions, et parcours scolaires'
    },
    {
      icon: <SchoolIcon fontSize="large" />,
      title: 'Planning et emplois du temps',
      description: 'Organisation dynamique des cours et des ressources'
    },
    {
      icon: <TrendingUpIcon fontSize="large" />,
      title: 'Suivi des notes et évaluations',
      description: 'Bulletins automatisés et analyses de performance'
    },
    {
      icon: <SecurityIcon fontSize="large" />,
      title: 'Communication intégrée',
      description: 'Liaison directe parents-école en temps réel'
    },
    {
      icon: <SpeedIcon fontSize="large" />,
      title: 'Gestion financière',
      description: 'Facturation, paiements et comptabilité intégrée'
    },
    {
      icon: <UpdateIcon fontSize="large" />,
      title: 'Rapports et analyses',
      description: 'Tableaux de bord et statistiques avancées'
    }
  ];

  // Avantages concurrentiels
  const advantages = [
    'Interface utilisateur moderne et intuitive',
    'Déploiement rapide et personnalisable',
    'Coûts réduits grâce à l\'open source',
    'Sécurité des données garantie',
    'Support technique réactif',
    'Mises à jour régulières',
    'Scalabilité pour tous types d\'établissements',
    'Formation et accompagnement inclus'
  ];
 const backgroundImageUrl = "/images/apropos.jpeg";
  return (
    <Box sx={{ 
      position: 'relative', 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column'
    }}>
      <Navbar />
      
      <Box sx={{ flexGrow: 1 }}>
        {/* Section Hero */}
        <Box
          sx={{
            py: { xs: 1, md: 1 },
            position: 'relative',
            overflow: 'hidden',
            backgroundImage: `url(${backgroundImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            '&:before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              zIndex: 1
            },
            '&:after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80px',
              height: '4px',
              background: `linear-gradient(90deg, ${elegantRed} 0%, white 50%, ${darkBlue} 100%)`,
              borderRadius: '2px',
              zIndex: 2
            },
            '& > *': {
              position: 'relative',
              zIndex: 2
            }
          }}
        >
          <Container maxWidth="lg">
            <Box sx={{ textAlign: 'center', mb: 6}}>
              <Typography
                variant="h2"
                component="h1"
                fontWeight="bold"
                gutterBottom
                sx={{
                  color: 'white',
                  fontSize: { xs: '3.5rem', md: '3.5rem' },
                  mb: 3
                }}
              >
                À Propos d'Edusync
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: 'rgba(255,255,255,0.9)',
                  maxWidth: '800px',
                  mx: 'auto',
                  mb: 3,
                  lineHeight: 1.6
                }}
              >
                Notre logiciel de gestion scolaire est une solution complète, intuitive et sécurisée, conçue pour centraliser et simplifier les tâches administratives et pédagogiques des établissements, de la maternelle au lycée.
              </Typography>
              
              {/* Statistiques */}
              <Grid container spacing={4} justifyContent="center" sx={{ mt: 4 }}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ 
                      background: `linear-gradient(180deg, ${elegantRed} 0%, ${darkBlue} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontWeight: 'bold' 
                    }}>
                      100%
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Open Source
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ 
                      background: `linear-gradient(180deg, ${elegantRed} 0%, ${darkBlue} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontWeight: 'bold' 
                    }}>
                      3
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Niveaux Couverts
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ 
                      background: `linear-gradient(180deg, ${elegantRed} 0%, ${darkBlue} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontWeight: 'bold' 
                    }}>
                      24/7
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Disponibilité
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ 
                      background: `linear-gradient(180deg, ${elegantRed} 0%, ${darkBlue} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontWeight: 'bold' 
                    }}>
                      ∞
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Évolutivité
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Container>
        </Box>

        {/* Section Mission & Vision */}
        <Box sx={{ py: 6, backgroundColor: 'grey.50' }}>
          <Container maxWidth="lg">
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    position: 'relative',
                    '&:before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: `linear-gradient(90deg, ${elegantRed} 0%, ${darkBlue} 100%)`,
                      borderRadius: '2px 2px 0 0',
                      transition: 'height 0.3s ease'
                    },
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0,0,139,0.1)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <LightbulbIcon sx={{ color: darkBlue, mr: 2, fontSize: '2rem' }} />
                      <Typography variant="h4" sx={{ color: darkBlue, fontWeight: 'bold' }}>
                        Notre Mission
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.7, mb: 2 }}>
                      Révolutionner la gestion éducative en proposant une solution moderne, 
                      intuitive et complète qui accompagne les établissements scolaires dans 
                      leur transformation numérique.
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.7 }}>
                      Nous croyons que la technologie doit simplifier les processus administratifs 
                      pour permettre aux équipes pédagogiques de se concentrer sur l'essentiel : 
                      l'éducation de qualité.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    position: 'relative',
                    '&:before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: `linear-gradient(90deg, ${elegantRed} 0%, ${darkBlue} 100%)`,
                      borderRadius: '2px 2px 0 0',
                      transition: 'height 0.3s ease'
                    },
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0,0,139,0.1)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <RocketIcon sx={{ color: darkBlue, fontSize: '2rem', mr: 2 }} />
                      <Typography variant="h4" sx={{ color: darkBlue, fontWeight: 'bold' }}>
                        Notre Vision
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.7, mb: 2 }}>
                      Devenir la référence en matière de solutions de gestion scolaire en Afrique 
                      et au-delà, en proposant des outils qui s'adaptent aux spécificités locales 
                      tout en respectant les standards internationaux.
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.7 }}>
                      Nous nous engageons à accompagner la modernisation du système éducatif 
                      par l'innovation technologique responsable et accessible.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Section Solution Technique */}
        <Box sx={{ py: 6, backgroundColor: 'white' }}>
          <Container maxWidth="lg">
            <Typography
              variant="h4"
              component="h2"
              fontWeight="bold"
              gutterBottom
              align="center"
              sx={{ color: darkBlue, mb: 6 }}
            >
              Une Architecture Technique Moderne
            </Typography>
            
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 4 }}>
                  <CodeIcon sx={{ color: darkBlue, fontSize: '3rem', mb: 2 }} />
                  <Typography variant="h5" sx={{ color: darkBlue, fontWeight: 'bold', mb: 2 }}>
                    Technologies de Pointe
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.7, mb: 3 }}>
                    Notre solution s'appuie sur une architecture robuste combinant la puissance 
                    d'Odoo ERP avec OpenEduCat pour le backend, et React.js pour une interface 
                    utilisateur moderne et responsive.
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.7 }}>
                    Cette combinaison garantit performance, sécurité, évolutivité et une 
                    expérience utilisateur exceptionnelle sur tous les appareils.
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {technologies.map((tech, index) => (
                    <Chip
                      key={index}
                      label={tech}
                      sx={{
                        backgroundColor: darkBlue,
                        color: 'white',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        '&:hover': {
                          backgroundColor: '#000070'
                        }
                      }}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Section Fonctionnalités */}
        <Box sx={{ py: 6, backgroundColor: 'grey.50' }}>
          <Container maxWidth="lg">
            <Typography
              variant="h4"
              component="h2"
              fontWeight="bold"
              gutterBottom
              align="center"
              sx={{ color: darkBlue, mb: 6 }}
            >
              Fonctionnalités Complètes
            </Typography>
            
            <Grid container spacing={4}>
              {features.map((feature, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      height: '100%',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'transform 0.3s, box-shadow 0.3s, border-color 0.3s',
                      position: 'relative',
                      '&:before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: `linear-gradient(90deg, ${elegantRed} 0%, ${darkBlue} 100%)`,
                        borderRadius: '2px 2px 0 0',
                        transition: 'height 0.3s ease'
                      },
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: `0 8px 25px rgba(0,0,139,0.1), 0 0 0 1px ${elegantRed}20`,
                        borderColor: elegantRed
                      }
                    }}
                  >
                    <Box sx={{ color: darkBlue, mb: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography
                      variant="h6"
                      component="h3"
                      fontWeight="bold"
                      gutterBottom
                      sx={{ color: darkBlue }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.6 }}>
                      {feature.description}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* Section Avantages */}
        <Box sx={{ py: 6, backgroundColor: 'white' }}>
          <Container maxWidth="lg">
            <Typography
              variant="h4"
              component="h2"
              fontWeight="bold"
              gutterBottom
              align="center"
              sx={{ color: darkBlue, mb: 2 }}
            >
              Pourquoi Choisir Edusync ?
            </Typography>
            <Typography
              variant="body1"
              align="center"
              sx={{ color: '#666', mb: 6, maxWidth: '600px', mx: 'auto' }}
            >
              Conçu en collaboration avec des professionnels de l'éducation, notre outil facilite la gestion des élèves, des emplois du temps, des évaluations, de la communication avec les parents, et bien plus encore. Il accompagne les équipes éducatives au quotidien, tout en garantissant un suivi transparent et efficace de la scolarité de chaque élève.

            </Typography>
            
            <Grid container spacing={3} justifyContent="center">
              {advantages.map((advantage, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 2,
                      borderRadius: 1,
                      transition: 'transform 0.2s',
                      borderLeft: '3px solid transparent',
                      '&:hover': {
                        transform: 'translateX(8px)',
                        backgroundColor: 'grey.50',
                        borderLeft: `3px solid ${elegantRed}`
                      }
                    }}
                  >
                    <CheckCircleIcon sx={{ color: darkBlue, mr: 2, flexShrink: 0 }} />
                    <Typography variant="body1" sx={{ color: '#333' }}>
                      {advantage}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* Section CTA */}
        <Box sx={{ py: 8, backgroundColor: darkBlue }}>
          <Container maxWidth="md">
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h4"
                component="h2"
                fontWeight="bold"
                gutterBottom
                sx={{ color: 'white', mb: 2 }}
              >
                Prêt à Transformer Votre Établissement ?
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: 'rgba(255,255,255,0.9)', mb: 4, fontSize: '1.1rem' }}
              >
                Découvrez comment Edusync peut révolutionner la gestion de votre école 
                et améliorer l'expérience de tous vos utilisateurs.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    backgroundColor: 'white',
                    color: darkBlue,
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    '&:hover': {
                      backgroundColor: 'grey.100',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  Demander une Démo
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  Nous Contacter
                </Button>
              </Box>
            </Box>
          </Container>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
}

export default AboutPage;