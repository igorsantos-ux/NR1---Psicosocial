import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Questionnaire from './pages/Questionnaire';
import Dashboard from './pages/Dashboard';
import RegisterCompany from './pages/RegisterCompany';
import ActionPlans from './pages/ActionPlans';
import GheManager from './pages/GheManager';
import PgrReport from './pages/PgrReport';
import Settings from './pages/Settings';
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
        <Route path="/admin/plans" element={<ActionPlans />} />
        <Route path="/admin/ghes" element={<GheManager />} />
        <Route path="/admin/pgr" element={<PgrReport />} />
        <Route path="/admin/settings" element={<Settings />} />
        
        {/* Redirecionamento Padrão */}
        <Route path="/" element={<Navigate to="/admin/companies" />} />
      </Routes>
    </Router>
  );
}

export default App;
