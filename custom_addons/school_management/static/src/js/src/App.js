import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import EvaluationList from './components/EvaluationList';
import EvaluationForm from './components/EvaluationForm';
import StudentGrades from './components/StudentGrades';
import StudentList from './components/StudentList';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="App">
          <Navigation />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<StudentList />} />
            <Route path="/evaluations" element={<EvaluationList />} />
            <Route path="/evaluations/new" element={<EvaluationForm />} />
            <Route path="/evaluations/:id" element={<EvaluationForm />} />
            <Route path="/student-grades" element={<StudentGrades />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App; 