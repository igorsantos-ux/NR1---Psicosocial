import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Questionnaire from './pages/Questionnaire';
import Dashboard from './pages/Dashboard';
import RegisterCompany from './pages/RegisterCompany';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rota Pública do Questionário da Empresa */}
        <Route path="/:slug/form" element={<Questionnaire />} />
        
        {/* Rota do Dashboard Administrativo */}
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/companies" element={<RegisterCompany />} />
        
        {/* Redirecionamento Padrão */}
        <Route path="/" element={<Navigate to="/maravilha-linguicas/form" />} />
      </Routes>
    </Router>
  );
}

export default App;
