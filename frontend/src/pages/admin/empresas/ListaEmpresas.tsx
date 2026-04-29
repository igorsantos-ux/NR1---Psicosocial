import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Factory, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import Layout from '../../../components/Layout';
import api from '../../../api/api';
import Toast from '../../../components/Toast';
import MetricasCards from './components/MetricasCards';
import CardEmpresa from './components/CardEmpresa';

export default function ListaEmpresas() {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [metricas, setMetricas] = useState({ ativas: 0, expiradas: 0, finalizadas: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todas');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resEmpresas, resMetricas] = await Promise.all([
        api.get('/empresas', { params: { status: filter, search } }),
        api.get('/empresas/metricas')
      ]);
      setEmpresas(resEmpresas.data);
      setMetricas(resMetricas.data);
    } catch (error) {
      console.error(error);
      setToast({ show: true, message: 'Erro ao carregar dados.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  // Polling para atualizar status de geração
  useEffect(() => {
    const hasProcessing = empresas.some(e => e.statusGeral === 'GERANDO');
    
    if (hasProcessing) {
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [empresas]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/q/${token}`;
    navigator.clipboard.writeText(url);
    setToast({ show: true, message: 'Link de coleta copiado!', type: 'success' });
  };

  const handleGeneratePGR = async (id: string) => {
    try {
      await api.post(`/pgr/gerar`, { empresaId: id });
      setToast({ show: true, message: 'Geração do PGR iniciada!', type: 'success' });
      fetchData();
    } catch (error) {
      setToast({ show: true, message: 'Erro ao iniciar geração do PGR.', type: 'error' });
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-clinicfy-dark">Empresas Cadastradas</h1>
            <p className="text-gray-500 text-sm">Gerencie coletas ativas e gere o PGR consolidado.</p>
          </div>
          <Link
            to="/admin/companies"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-clinicfy-pink text-white font-bold shadow-xl shadow-clinicfy-pink/20 hover:scale-105 transition-all active:scale-95"
          >
            <Plus size={20} /> Nova Empresa
          </Link>
        </div>

        {/* Métricas */}
        <MetricasCards metricas={metricas} />

        {/* Filtros */}
        <div className="bg-white rounded-3xl p-4 mt-8 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <form onSubmit={handleSearch} className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por razão social ou CNPJ..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-clinicfy-teal transition-all outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          <div className="flex bg-gray-50 p-1 rounded-xl w-full md:w-auto">
            {['todas', 'ativas', 'expiradas', 'finalizadas'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  filter === f 
                    ? 'bg-white text-clinicfy-teal shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button 
            onClick={fetchData}
            className="p-3 rounded-xl bg-gray-50 text-gray-400 hover:text-clinicfy-teal transition-colors"
            title="Atualizar Lista"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Lista de Empresas */}
        <div className="mt-6 space-y-4">
          <AnimatePresence mode="popLayout">
            {loading && empresas.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                <RefreshCw size={40} className="animate-spin mb-4 opacity-20" />
                <p className="font-medium animate-pulse">Carregando empresas...</p>
              </div>
            ) : empresas.length > 0 ? (
              empresas.map((empresa) => (
                <CardEmpresa
                  key={empresa.id}
                  empresa={empresa}
                  onCopyLink={handleCopyLink}
                  onGeneratePGR={handleGeneratePGR}
                />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-3xl p-20 text-center border border-dashed border-gray-200"
              >
                <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <Factory size={40} />
                </div>
                <h3 className="text-gray-500 font-bold">Nenhuma empresa encontrada</h3>
                <p className="text-gray-400 text-sm mt-1">Tente ajustar seus filtros ou cadastre uma nova empresa.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </Layout>
  );
}
