import React, { Component, type ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Questionnaire from './pages/Questionnaire';
import Dashboard from './pages/Dashboard';
import RegisterCompany from './pages/RegisterCompany';
import ActionPlans from './pages/ActionPlans';
import GheManager from './pages/GheManager';
import PgrReport from './pages/PgrReport';
import Settings from './pages/Settings';
import ValidatePGR from './pages/ValidatePGR';
import ListaEmpresas from './pages/admin/empresas/ListaEmpresas';
import DetalhesEmpresa from './pages/admin/empresas/DetalhesEmpresa';
import './index.css';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error?: Error }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('ErrorBoundary capturou:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
          <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-xl border border-red-50 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold">!</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Algo deu errado</h1>
            <p className="text-gray-600 mb-8 text-sm">
              {this.state.error?.message || 'Ocorreu um erro inesperado na renderização desta tela.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-clinicfy-teal text-white rounded-2xl font-bold shadow-lg shadow-clinicfy-teal/20 transition-all active:scale-95"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Rota Pública do Questionário da Empresa */}
          <Route path="/q/:token" element={<Questionnaire />} />

          {/* Rota do Dashboard Administrativo */}
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/companies" element={<RegisterCompany />} />
          <Route path="/admin/plans" element={<ActionPlans />} />
          <Route path="/admin/ghes" element={<GheManager />} />
          <Route path="/admin/empresas" element={<ListaEmpresas />} />
          <Route path="/admin/empresas/:id" element={<DetalhesEmpresa />} />
          <Route path="/admin/pgr" element={<PgrReport />} />
          <Route path="/admin/settings" element={<Settings />} />

          {/* Validação de PGR */}
          <Route path="/admin/pgr/:id/validar" element={<ValidatePGR />} />

          {/* Redirecionamento Padrão */}
          <Route path="/" element={<Navigate to="/admin/companies" />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
