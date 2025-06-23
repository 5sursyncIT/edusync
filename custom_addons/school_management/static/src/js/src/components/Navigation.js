import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
} from '@mui/material';
import {
  Assessment,
  Dashboard,
  School,
  People,
} from '@mui/icons-material';

function Navigation() {
  return (
    <AppBar position="static">
      <Container>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Gestion Scolaire
          </Typography>
          <Button
            color="inherit"
            component={RouterLink}
            to="/"
            startIcon={<Dashboard />}
          >
            Tableau de bord
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/students"
            startIcon={<People />}
          >
            Élèves
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/evaluations"
            startIcon={<Assessment />}
          >
            Évaluations
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/student-grades"
            startIcon={<School />}
          >
            Notes
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navigation; 