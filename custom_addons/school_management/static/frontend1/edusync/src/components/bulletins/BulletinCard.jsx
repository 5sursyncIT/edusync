import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  Button,
  Grid,
  LinearProgress,
  Avatar,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  School,
  CalendarMonth,
  TrendingUp,
  Visibility,
  Edit,
  Calculate,
  CheckCircle,
  Delete,
  Download,
  Assessment,
  Archive
} from '@mui/icons-material';
import { useOdoo } from '../../contexts/OdooContext';

const BulletinCard = ({ 
  bulletin, 
  onView, 
  onEdit, 
  onCalculate, 
  onValidate, 
  onDelete,
  onDownload 
}) => {
  const { api } = useOdoo();

  const getStateColor = (state) => {
    const stateColors = {
      'brouillon': 'default',
      'calcule': 'info',
      'valide': 'success',
      'publie': 'primary',
      'archive': 'secondary'
    };
    return stateColors[state] || 'default';
  };

  const getStateIcon = (state) => {
    const stateIcons = {
      'brouillon': <Edit fontSize="small" />,
      'calcule': <Calculate fontSize="small" />,
      'valide': <CheckCircle fontSize="small" />,
      'publie': <Assessment fontSize="small" />,
      'archive': <Archive fontSize="small" />
    };
    return stateIcons[state] || <Edit fontSize="small" />;
  };

  const moyenne = bulletin.moyenne_generale || 0;
  const progressValue = (moyenne / 20) * 100;
  const gradeBadge = api.getBulletinGradeBadge(moyenne);

  return (
    <Card className="h-full hover:shadow-lg transition-shadow duration-300">
      <CardContent>
        {/* En-tête avec avatar et info étudiant */}
        <Box className="flex items-center gap-3 mb-4">
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <School />
          </Avatar>
          <Box className="flex-1">
            <Typography variant="h6" className="font-bold truncate">
              {bulletin.student_name || 'Étudiant inconnu'}
            </Typography>
            <Typography variant="body2" color="text.secondary" className="flex items-center gap-1">
              <CalendarMonth fontSize="small" />
              {bulletin.trimestre_name || 'Trimestre non défini'}
            </Typography>
          </Box>
          <Chip
            label={bulletin.state}
            color={getStateColor(bulletin.state)}
            size="small"
            icon={getStateIcon(bulletin.state)}
          />
        </Box>

        <Divider className="mb-4" />

        {/* Informations principales */}
        <Grid container spacing={2} className="mb-4">
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" className="mb-1">
              Classe
            </Typography>
            <Typography variant="body1" className="font-medium">
              {bulletin.batch_name || 'Non assigné'}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" className="mb-1">
              Date de création
            </Typography>
            <Typography variant="body1">
              {bulletin.create_date ? api.formatBulletinDate(bulletin.create_date) : 'N/A'}
            </Typography>
          </Grid>
        </Grid>

        {/* Moyenne générale */}
        <Box className="mb-4">
          <Box className="flex justify-between items-center mb-2">
            <Typography variant="body2" color="text.secondary">
              Moyenne Générale
            </Typography>
            <Chip
              label={`${moyenne.toFixed(2)}/20`}
              color={gradeBadge.color}
              size="small"
              icon={<TrendingUp fontSize="small" />}
            />
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressValue}
            color={gradeBadge.color}
            className="h-2 rounded"
          />
          <Typography 
            variant="caption" 
            color="text.secondary"
            className="block text-center mt-1"
          >
            {gradeBadge.text}
          </Typography>
        </Box>

        {/* Statistiques rapides */}
        {bulletin.stats && (
          <Grid container spacing={1} className="mb-3">
            <Grid item xs={6}>
              <Box className="text-center p-2 bg-gray-50 rounded">
                <Typography variant="h6" className="font-bold text-blue-600">
                  {bulletin.stats.total_subjects || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Matières
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box className="text-center p-2 bg-gray-50 rounded">
                <Typography variant="h6" className="font-bold text-green-600">
                  {bulletin.stats.total_exams || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Examens
                </Typography>
              </Box>
            </Grid>
          </Grid>
        )}

        {/* Observations/Remarques */}
        {bulletin.observations && (
          <Box className="mt-3">
            <Typography variant="body2" color="text.secondary" className="mb-1">
              Observations
            </Typography>
            <Typography 
              variant="body2" 
              className="bg-yellow-50 p-2 rounded text-sm"
              style={{ 
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {bulletin.observations}
            </Typography>
          </Box>
        )}
      </CardContent>

      <CardActions className="justify-between">
        <Box className="flex gap-1">
          <Tooltip title="Voir détails">
            <IconButton size="small" onClick={() => onView(bulletin)}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          
          {bulletin.state === 'brouillon' && (
            <>
              <Tooltip title="Modifier">
                <IconButton size="small" onClick={() => onEdit(bulletin)}>
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Calculer">
                <IconButton size="small" onClick={() => onCalculate(bulletin.id)}>
                  <Calculate fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
          
          {bulletin.state === 'calcule' && (
            <Tooltip title="Valider">
              <IconButton size="small" onClick={() => onValidate(bulletin.id)}>
                <CheckCircle fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          <Tooltip title="Supprimer">
            <IconButton 
              size="small" 
              color="error" 
              onClick={() => onDelete(bulletin.id)}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Download />}
            onClick={() => onDownload(bulletin.id)}
            disabled={bulletin.state === 'brouillon'}
          >
            PDF
          </Button>
        </Box>
      </CardActions>
    </Card>
  );
};

export default BulletinCard; 