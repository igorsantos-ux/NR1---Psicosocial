import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Factory, RefreshCw, ClipboardList, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout';
import api from '../../../api/api';
import Toast from '../../../components/Toast';
import MetricasCards from './components/MetricasCards';
import CardEmpresa from './components/CardEmpresa';

export default function ListaEmpresas() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [metricas, setMetricas] = useState({ ativas: 0, expiradas: 0, finalizadas: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todas');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });
  
  // Estados para o Modal de Geração
  const [generatingPgr, setGeneratingPgr] = useState(false);
  const [pgrProgress, setPgrProgress] = useState({ step: 0, status: 'idle' });
  const [currentPgrId, setCurrentPgrId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [resEmpresas, resMetricas] = await Promise.all([
        api.get('/empresas', { params: { status: filter, search } }),
        api.get('/empresas/metricas')
      ]);
      setEmpresas(resEmpresas.data);
      setMetricas(resMetricas.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  // Polling Geral da Lista
  useEffect(() => {
    const hasProcessing = empresas.some(e => e.statusGeral === 'GERANDO');
    if (hasProcessing && !generatingPgr) {
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [empresas, generatingPgr]);

  // Polling Específico do Modal de Geração
  useEffect(() => {
    let interval: any;
    if (generatingPgr && currentPgrId) {
      interval = setInterval(async () => {
        try {
          const res = await api.get(`/pgr/${currentPgrId}/status`);
          const { status, observacoesEngenheiro } = res.data;

          if (status === 'AGUARDANDO_VALIDACAO') {
            setPgrProgress({ step: 4, status: 'Pronto!' });
            clearInterval(interval);
            setTimeout(() => {
              navigate(`/admin/pgr/${currentPgrId}/validar`);
            }, 1000);
          } else if (status === 'REPROVADO') {
            clearInterval(interval);
            setGeneratingPgr(false);
            setToast({ show: true, message: `Erro: ${observacoesEngenheiro}`, type: 'error' });
          } else {
            // Evolução visual das etapas
            setPgrProgress(prev => {
              if (prev.step === 1) return { step: 2, status: 'Processando análise da IA...' };
              if (prev.step === 2) return { step: 3, status: 'Preenchendo documento...' };
              if (prev.step === 3) return { step: 4, status: 'Convertendo para PDF...' };
              return prev;
            });
          }
        } catch (err) {
          console.error(err);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [generatingPgr, currentPgrId]);

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
    setGeneratingPgr(true);
    setPgrProgress({ step: 1, status: 'Consolidando respostas...' });
    
    try {
      const res = await api.post(`/pgr/gerar`, { empresaId: id });
      setCurrentPgrId(res.data.pgrId);
    } catch (error: any) {
      setGeneratingPgr(false);
      setToast({ show: true, message: error.response?.data?.message || 'Erro ao iniciar geração.', type: 'error' });
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
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

        <MetricasCards metricas={metricas} />

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
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal de Progresso de Geração */}
      <AnimatePresence>
        {generatingPgr && (
          <div className="fixed inset-0 bg-clinicfy-dark/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl text-center space-y-6"
            >
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 border-4 border-clinicfy-teal/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-clinicfy-teal rounded-full border-t-transparent animate-spin" style={{ animationDuration: '1.5s' }}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <ClipboardList size={32} className="text-clinicfy-teal animate-pulse" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-clinicfy-dark">Gerando PGR Consolidado</h3>
                <p className="text-sm text-gray-500">A IA está processando as respostas. Por favor, aguarde.</p>
              </div>

              <div className="space-y-4 text-left">
                {[
                  { step: 1, label: 'Consolidando respostas...' },
                  { step: 2, label: 'Processando análise da IA...' },
                  { step: 3, label: 'Preenchendo documento...' },
                  { step: 4, label: 'Convertendo para PDF...' },
                ].map((s) => (
                  <div key={s.step} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${pgrProgress.step >= s.step ? 'bg-clinicfy-teal text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {pgrProgress.step > s.step ? <CheckCircle2 size={12} /> : s.step}
                    </div>
                    <span className={`text-sm font-medium ${pgrProgress.step === s.step ? 'text-clinicfy-teal' : pgrProgress.step > s.step ? 'text-clinicfy-dark' : 'text-gray-300'}`}>
                      {s.label}
                    </span>
                    {pgrProgress.step === s.step && (
                      <span className="ml-auto flex gap-1">
                        <span className="w-1 h-1 bg-clinicfy-teal rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1 h-1 bg-clinicfy-teal rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1 h-1 bg-clinicfy-teal rounded-full animate-bounce"></span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </Layout>
  );
}
