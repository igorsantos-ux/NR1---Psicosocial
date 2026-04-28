import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { ClipboardList, ExternalLink, Calendar, AlertTriangle, CheckCircle2, Shield } from 'lucide-react';
import api from '../api/api';
import Toast from '../components/Toast';

export default function ActionPlans() {
  const [respostas, setRespostas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPgr, setGeneratingPgr] = useState(false);
  const [pgrProgress, setPgrProgress] = useState({ step: 0, status: 'idle' });
  const [pgrId, setPgrId] = useState<string | null>(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchRespostas();
  }, []);

  const fetchRespostas = async () => {
    try {
      // Nota: No mundo real, filtraríamos pela empresa selecionada ou contexto do engenheiro.
      // Por simplicidade, pegaremos todas as respostas disponíveis para o engenheiro.
      const res = await api.get('/empresas'); // Pegando as empresas e suas respostas
      const allRespostas = res.data.flatMap((e: any) => e.respostas || []);
      setRespostas(allRespostas);
    } catch (err) {
      setToast({ show: true, message: 'Erro ao carregar respostas.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleGerarPGR = async (empresaId: string) => {
    setGeneratingPgr(true);
    setPgrProgress({ step: 1, status: 'Consolidando respostas...' });

    try {
      const res = await api.post(`/pgr/gerar/${empresaId}`);
      const id = res.data.pgrId;
      setPgrId(id);
      startPolling(id);
    } catch (error: any) {
      setGeneratingPgr(false);
      setToast({ show: true, message: error.response?.data?.message || 'Erro ao iniciar geração do PGR.', type: 'error' });
    }
  };

  const startPolling = (id: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/pgr/${id}/status`);
        const status = res.data.status;

        if (status === 'AGUARDANDO_VALIDACAO') {
          clearInterval(interval);
          setPgrProgress({ step: 4, status: 'Pronto!' });
          setTimeout(() => {
            window.location.href = `/pgr/${id}/validar`;
          }, 1000);
        } else if (status === 'REPROVADO') {
          clearInterval(interval);
          setGeneratingPgr(false);
          setToast({ show: true, message: `Erro na geração: ${res.data.observacoesEngenheiro}`, type: 'error' });
        } else {
          // Atualizar mensagens fictícias de progresso baseadas no tempo ou no status
          // (No backend poderíamos ter status mais granulares para refletir cada etapa)
          setPgrProgress(prev => {
            if (prev.step === 1) return { step: 2, status: 'Processando análise da IA...' };
            if (prev.step === 2) return { step: 3, status: 'Preenchendo documento...' };
            if (prev.step === 3) return { step: 4, status: 'Convertendo para PDF...' };
            return prev;
          });
        }
      } catch (err) {
        clearInterval(interval);
        setGeneratingPgr(false);
        setToast({ show: true, message: 'Erro ao verificar status do PGR.', type: 'error' });
      }
    }, 3000);
  };

  const getRiskColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'INTOLERÁVEL': return 'text-red-600 bg-red-50 border-red-100';
      case 'SUBSTANCIAL': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'MODERADO': return 'text-yellow-600 bg-yellow-50 border-yellow-100';
      case 'TRIVIAL': return 'text-green-600 bg-green-50 border-green-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-clinicfy-dark">Planos de Ação (IA)</h1>
            <p className="text-gray-500 text-sm">Acompanhe as análises psicosociais coletadas para geração do PGR.</p>
          </div>
          <div className="flex gap-4 mb-1 items-center">
            <button
              onClick={() => handleGerarPGR(respostas[0]?.empresaId)} // Exemplo pegando a primeira empresa
              disabled={respostas.length === 0 || generatingPgr}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 ${respostas.length === 0 || generatingPgr
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-clinicfy-teal text-white shadow-clinicfy-teal/20 hover:scale-105 active:scale-95'
                }`}
            >
              <ClipboardList size={18} />
              GERAR PGR CONSOLIDADO
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Colaborador / GHE / Cargo</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Data do Envio</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">Carregando respostas...</td>
                </tr>
              ) : respostas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">Nenhuma resposta recebida ainda.</td>
                </tr>
              ) : (
                respostas.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-clinicfy-dark text-xs uppercase tracking-tight">Colaborador Anônimo</span>
                        <span className="text-[10px] text-gray-400 font-medium">#{item.colaboradorId.split('-')[0]}</span>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[10px] bg-clinicfy-teal/10 text-clinicfy-teal px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                            <Shield size={10} /> {item.ghe?.nome}
                          </span>
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-bold">
                            {item.cargo}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={14} className="text-gray-400" />
                        {new Date(item.criadaEm).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {item.nivelDominante ? (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${getRiskColor(item.nivelDominante)}`}>
                            {item.nivelDominante}
                          </span>
                        ) : (
                          <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-bold">BRUTO (AGUARDANDO PGR)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-clinicfy-teal hover:bg-clinicfy-teal/10 rounded-lg transition-all" title="Ver Detalhes">
                        <ExternalLink size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {generatingPgr && (
        <div className="fixed inset-0 bg-clinicfy-dark/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl text-center space-y-6">
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 border-4 border-clinicfy-teal/20 rounded-full"></div>
              <div
                className="absolute inset-0 border-4 border-clinicfy-teal rounded-full border-t-transparent animate-spin"
                style={{ animationDuration: '1.5s' }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <ClipboardList size={32} className="text-clinicfy-teal animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-clinicfy-dark">Gerando PGR Consolidado</h3>
              <p className="text-sm text-gray-500">Isso pode levar até 2 minutos devido ao processamento da IA.</p>
            </div>

            <div className="space-y-4">
              {[
                { step: 1, label: 'Consolidando respostas...' },
                { step: 2, label: 'Processando análise da IA...' },
                { step: 3, label: 'Preenchendo documento...' },
                { step: 4, label: 'Convertendo para PDF...' },
              ].map((s) => (
                <div key={s.step} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${pgrProgress.step >= s.step ? 'bg-clinicfy-teal text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
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

            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-4">Não feche esta aba durante o processo</p>
          </div>
        </div>
      )}

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </Layout>
  );
}
