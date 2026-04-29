import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { ClipboardList, ExternalLink, Calendar, AlertTriangle, CheckCircle2, Shield, FileDown, Clock, Zap, AlertCircle } from 'lucide-react';
import api from '../api/api';
import Toast from '../components/Toast';
import { Link } from 'react-router-dom';

export default function ActionPlans() {
  const [pgrs, setPgrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchPgrs();
  }, []);

  // Polling para atualizar status de geração
  useEffect(() => {
    const hasProcessing = pgrs.some(p => p.status === 'GERANDO');
    if (hasProcessing) {
      const interval = setInterval(fetchPgrs, 5000);
      return () => clearInterval(interval);
    }
  }, [pgrs]);

  const fetchPgrs = async () => {
    try {
      const res = await api.get('/pgr');
      setPgrs(res.data);
    } catch (err) {
      setToast({ show: true, message: 'Erro ao carregar planos de ação.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'GERANDO':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'AGUARDANDO_VALIDACAO':
        return 'bg-clinicfy-pink/10 text-clinicfy-pink border-clinicfy-pink/20';
      case 'VALIDADO':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'REPROVADO':
        return 'bg-red-50 text-red-600 border-red-100';
      default:
        return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'GERANDO': return 'Processando IA';
      case 'AGUARDANDO_VALIDACAO': return 'Aguardando Validação';
      case 'VALIDADO': return 'Finalizado e Validado';
      case 'REPROVADO': return 'Erro na Geração';
      default: return status;
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-clinicfy-dark">Planos de Ação (PGR)</h1>
            <p className="text-gray-500 text-sm">Gerencie os Programas de Gerenciamento de Riscos consolidados pela IA.</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Empresa / Documento</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Data de Geração</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && pgrs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">Carregando planos...</td>
                </tr>
              ) : pgrs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400 italic">Nenhum PGR gerado ainda.</td>
                </tr>
              ) : (
                pgrs.map((pgr) => (
                  <tr key={pgr.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-clinicfy-dark text-xs uppercase tracking-tight">
                          {pgr.empresa?.razaoSocial}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">#{pgr.id.split('-')[0]}</span>
                        {pgr.resumo && (
                          <p className="text-[10px] text-gray-500 mt-1 italic truncate max-w-xs">
                            {pgr.resumo}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={14} className="text-gray-400" />
                        {new Date(pgr.geradoEm).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold flex items-center gap-1 ${getStatusStyle(pgr.status)}`}>
                          {pgr.status === 'GERANDO' && <Clock size={10} className="animate-spin" />}
                          {pgr.status === 'VALIDADO' && <CheckCircle2 size={10} />}
                          {pgr.status === 'REPROVADO' && <AlertCircle size={10} />}
                          {getStatusLabel(pgr.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {pgr.status === 'AGUARDANDO_VALIDACAO' && (
                          <Link
                            to={`/admin/pgr/${pgr.id}/validar`}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-clinicfy-pink text-white text-[10px] font-bold shadow-lg shadow-clinicfy-pink/20 hover:scale-105 transition-all"
                          >
                            <Zap size={14} /> VALIDAR
                          </Link>
                        )}

                        {pgr.status === 'VALIDADO' && (
                          <>
                            <a
                              href={`${import.meta.env.VITE_API_URL || ''}/api/pgr/${pgr.id}/download/pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                              title="Download PDF"
                            >
                              <FileDown size={18} />
                            </a>
                            <a
                              href={`${import.meta.env.VITE_API_URL || ''}/api/pgr/${pgr.id}/download/docx`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Download DOCX"
                            >
                              <FileDown size={18} />
                            </a>
                          </>
                        )}

                        {pgr.status === 'REPROVADO' && (
                          <button 
                            onClick={() => setToast({ show: true, message: 'Verifique os logs para detalhes do erro.', type: 'error' })}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <AlertTriangle size={18} />
                          </button>
                        )}
                      </div>
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
