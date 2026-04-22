import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { ClipboardList, ExternalLink, Calendar, AlertTriangle, CheckCircle2, Shield } from 'lucide-react';
import api from '../api/api';
import Toast from '../components/Toast';

export default function ActionPlans() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const res = await api.get('/assessments');
      setAssessments(res.data);
    } catch (err) {
      setToast({ show: true, message: 'Erro ao carregar avaliações.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Intolerável': return 'text-red-600 bg-red-50 border-red-100';
      case 'Substancial': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'Moderado': return 'text-yellow-600 bg-yellow-50 border-yellow-100';
      case 'Trivial': return 'text-green-600 bg-green-50 border-green-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-clinicfy-dark">Planos de Ação (IA)</h1>
            <p className="text-gray-500 text-sm">Acompanhe as análises psicosociais geradas pelo motor Gemini.</p>
          </div>
          <div className="flex gap-4 mb-1">
            <div className="text-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Pendentes</p>
              <div className="bg-white border border-gray-100 px-4 py-2 rounded-xl font-bold text-clinicfy-dark shadow-sm">
                {assessments.filter(a => a.status === 'PENDING').length}
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Analisados</p>
              <div className="bg-white border border-gray-100 px-4 py-2 rounded-xl font-bold text-clinicfy-teal shadow-sm">
                {assessments.filter(a => a.status === 'ANALYZED').length}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Empresa / GHE</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Data do Envio</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Análise de Risco (IA)</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">Carregando avaliações...</td>
                </tr>
              ) : assessments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">Nenhuma avaliação recebida ainda.</td>
                </tr>
              ) : (
                assessments.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-clinicfy-dark">{item.ghe?.company?.name}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Shield size={12} className="text-clinicfy-teal" /> {item.ghe?.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={14} className="text-gray-400" />
                        {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {item.riskMatrix ? (
                          item.riskMatrix.slice(0, 2).map((r: any, idx: number) => (
                            <span 
                              key={idx} 
                              className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${getRiskColor(r.level)}`}
                            >
                              {r.level}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-bold">AGUARDANDO...</span>
                        )}
                        {item.riskMatrix?.length > 2 && (
                          <span className="text-[10px] text-gray-300 font-bold ml-1">+{item.riskMatrix.length - 2}</span>
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
      <Toast 
        show={toast.show} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, show: false })} 
      />
    </Layout>
  );
}
