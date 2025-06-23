import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { parentAPI } from './ParentAPI';
import ParentLogin from './ParentLogin';
import ParentDashboard from './ParentDashboard';

// Composant principal ParentPortal
const ParentPortal = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [parentInfo, setParentInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const sessionId = localStorage.getItem('parent_session_id');
      const parentData = localStorage.getItem('parent_info');
      
      if (sessionId && parentData) {
        console.log('🔍 Session trouvée, chargement des enfants...');
        const parsedParentInfo = JSON.parse(parentData);
        
        // Charger les enfants
        const childrenResponse = await parentAPI.getChildren();
        console.log('📋 Réponse API enfants:', childrenResponse);
        
        if (childrenResponse.status === 'success') {
          const fullParentInfo = {
            ...parsedParentInfo,
            children: childrenResponse.data?.children || []
          };
          setParentInfo(fullParentInfo);
          setIsLoggedIn(true);
          console.log('✅ Session restaurée avec succès');
        } else {
          console.log('❌ Erreur lors du chargement des enfants, déconnexion');
          localStorage.removeItem('parent_session_id');
          localStorage.removeItem('parent_info');
        }
      }
    } catch (error) {
      console.error('💥 Erreur lors de la vérification de session:', error);
      localStorage.removeItem('parent_session_id');
      localStorage.removeItem('parent_info');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (parentData) => {
    setParentInfo(parentData);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setParentInfo(null);
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          bgcolor: '#f8fafc'
        }}
      >
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          Chargement du portail parent...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {!isLoggedIn ? (
        <ParentLogin onLoginSuccess={handleLoginSuccess} />
      ) : (
        <ParentDashboard 
          parentInfo={parentInfo} 
          onLogout={handleLogout} 
        />
      )}
    </Box>
  );
};

export default ParentPortal;