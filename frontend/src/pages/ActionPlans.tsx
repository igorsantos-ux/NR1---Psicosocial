import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  ClipboardList, ExternalLink, Calendar, AlertTriangle, 
  CheckCircle2, Shield, FileDown, Clock, Zap, AlertCircle,
  RefreshCw, Filter, List, ChevronDown, ChevronUp
} from 'lucide-react';
import api from '../api/api';
import Toast from '../components/Toast';
import { Link } from 'react-router-dom';

export default function ActionPlans() {
  const [pgrs, setPgrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [expandedError, setExpandedError] = useState<string | null>(null);
  const [showAllVersions, setShowAllVersions] = useState(false);
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

  const handleRegenerate = async (pgrId: string) => {
    setRegeneratingId(pgrId);
    try {
      await api.post(`/pgr/${pgrId}/regenerar`);
      setToast({ show: true, message: 'Regeneração iniciada com sucesso!', type: 'success' });
      setExpandedError(null);
      fetchPgrs();
    } catch (err: any) {
      setToast({ show: true, message: 'Falha ao iniciar regeneração.', type: 'error' });
    } finally {
      setRegeneratingId(null);
    }
  };

  const traduzirErro = (erro: string): string => {
    if (!erro) return 'Erro técnico desconhecido.';
    const e = erro.toLowerCase();
    
    if (e.includes('malformed xml')) 
      return 'O template Word (PGR-MODELO.docx) possui tags inválidas ou corrompidas. Verifique as chaves {empresa...}.';
    if (e.includes('quota') || e.includes('429')) 
      return 'Limite da IA atingido. O sistema tentará novamente em breve ou você pode tentar agora.';
    if (e.includes('not found') || e.includes('gemini-1.5') || e.includes('gemini-2.0'))
      return 'Versão da IA desatualizada. Por favor, solicite a atualização para o Gemini 2.5 Flash no painel.';
    if (e.includes('enoent') || e.includes('no such file'))
      return 'Falha ao acessar os arquivos de sistema. Verifique as permissões da pasta output.';
    if (e.includes('libreoffice') || e.includes('convert-to pdf'))
      return 'O conversor de PDF falhou. Tente regenerar para reiniciar o serviço.';
    if (e.includes('json') || e.includes('parse'))
      return 'A IA gerou uma resposta confusa. Tente regenerar para obter uma nova análise.';
    
    return erro.length > 100 ? erro.substring(0, 100) + '...' : erro;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'GERANDO': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'AGUARDANDO_VALIDACAO': return 'bg-clinicfy-pink/10 text-clinicfy-pink border-clinicfy-pink/20';
      case 'VALIDADO': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'REPROVADO': case 'ERRO': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'GERANDO': return 'Processando IA';
      case 'AGUARDANDO_VALIDACAO': return 'Aguardando Validação';
      case 'VALIDADO': return 'Finalizado e Validado';
      case 'REPROVADO': case 'ERRO': return 'Erro na Geração';
      default: return status;
    }
  };

  // Lógica de Filtro: Mostrar apenas o último PGR por empresa por padrão
  const pgrsExibidos = showAllVersions 
    ? pgrs 
    : pgrs.filter((pgr, index, arr) => 
        arr.findIndex(p => p.empresa?.id === pgr.empresa?.id) === index
      );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-clinicfy-dark tracking-tight">Planos de Ação (PGR)</h1>
            <p className="text-gray-500 text-sm">Gerencie os laudos psicossociais consolidados pela Inteligência Artificial.</p>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setShowAllVersions(false)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${!showAllVersions ? 'bg-white shadow-sm text-clinicfy-teal' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Zap size={14} /> ÚLTIMA VERSÃO
            </button>
            <button 
              onClick={() => setShowAllVersions(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${showAllVersions ? 'bg-white shadow-sm text-clinicfy-teal' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <List size={14} /> HISTÓRICO COMPLETO
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Empresa / Documento</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data de Geração</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && pgrs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="animate-spin text-clinicfy-teal" size={24} />
                        <p className="text-sm text-gray-400 font-medium">Sincronizando laudos...</p>
                    </div>
                  </td>
                </tr>
              ) : pgrsExibidos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-gray-400 italic">Nenhum laudo disponível para este filtro.</td>
                </tr>
              ) : (
                pgrsExibidos.map((pgr) => (
                  <React.Fragment key={pgr.id}>
                    <tr className={`transition-colors ${expandedError === pgr.id ? 'bg-red-50/30' : 'hover:bg-gray-50/50'}`}>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-clinicfy-dark text-xs uppercase tracking-tight">
                            {pgr.empresa?.razaoSocial}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold">#{pgr.id.split('-')[0].toUpperCase()}</span>
                          {pgr.resumo && (
                            <p className="text-[10px] text-gray-500 mt-1 italic line-clamp-1 max-w-xs">
                              {pgr.resumo}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                          <Calendar size={14} className="text-gray-300" />
                          {new Date(pgr.geradoEm).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-2">
                          <span className={`text-[9px] px-2.5 py-1 rounded-full border font-black uppercase tracking-wider flex items-center gap-1.5 w-fit ${getStatusStyle(pgr.status)}`}>
                            {pgr.status === 'GERANDO' && <Clock size={10} className="animate-spin" />}
                            {pgr.status === 'VALIDADO' && <CheckCircle2 size={10} />}
                            {(pgr.status === 'REPROVADO' || pgr.status === 'ERRO') && <AlertCircle size={10} />}
                            {getStatusLabel(pgr.status)}
                          </span>
                          
                          {(pgr.status === 'REPROVADO' || pgr.status === 'ERRO') && (
                            <button
                                onClick={() => setExpandedError(expandedError === pgr.id ? null : pgr.id)}
                                className="text-[10px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors w-fit"
                            >
                                {expandedError === pgr.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                {expandedError === pgr.id ? 'OCULTAR ERRO' : 'VER MOTIVO DA FALHA'}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2">
                          {pgr.status === 'AGUARDANDO_VALIDACAO' && (
                            <Link
                              to={`/admin/pgr/${pgr.id}/validar`}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-clinicfy-pink text-white text-[10px] font-black shadow-lg shadow-clinicfy-pink/20 hover:scale-105 active:scale-95 transition-all"
                            >
                              <Zap size={14} /> VALIDAR
                            </Link>
                          )}

                          {pgr.status === 'VALIDADO' && (
                            <div className="flex gap-1">
                              <a
                                href={`${import.meta.env.VITE_API_URL || ''}/api/pgr/${pgr.id}/download/pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-transparent hover:border-emerald-100"
                                title="Download PDF"
                              >
                                <FileDown size={18} />
                              </a>
                              <a
                                href={`${import.meta.env.VITE_API_URL || ''}/api/pgr/${pgr.id}/download/docx`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100"
                                title="Download DOCX"
                              >
                                <FileDown size={18} />
                              </a>
                            </div>
                          )}

                          {(pgr.status === 'REPROVADO' || pgr.status === 'ERRO') && (
                            <button 
                              onClick={() => handleRegenerate(pgr.id)}
                              disabled={regeneratingId === pgr.id}
                              className={`p-2.5 rounded-xl transition-all border border-transparent ${regeneratingId === pgr.id ? 'bg-gray-100 text-gray-400' : 'text-red-500 hover:bg-red-50 hover:border-red-100'}`}
                              title="Tentar Novamente"
                            >
                              <RefreshCw size={18} className={regeneratingId === pgr.id ? 'animate-spin' : ''} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Linha Expansível de Erro */}
                    {expandedError === pgr.id && (
                        <tr className="bg-red-50/50">
                            <td colSpan={4} className="px-6 py-4">
                                <div className="p-4 bg-white border border-red-100 rounded-2xl shadow-sm space-y-3 animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle size={18} className="text-red-500 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-[11px] font-black text-red-700 uppercase tracking-tight">Falha Crítica na Geração</p>
                                            <p className="text-xs text-gray-600 font-medium leading-relaxed">
                                                {traduzirErro(pgr.erroDetalhes)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t border-red-50 flex items-center justify-between">
                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Ação Corretiva Recomendada</span>
                                        <button 
                                            onClick={() => handleRegenerate(pgr.id)}
                                            disabled={regeneratingId === pgr.id}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-[9px] font-black rounded-lg hover:bg-red-700 transition-all shadow-md shadow-red-200"
                                        >
                                            <RefreshCw size={12} className={regeneratingId === pgr.id ? 'animate-spin' : ''} />
                                            {regeneratingId === pgr.id ? 'REPROCESSANDO...' : 'REGENERAR LAUDO AGORA'}
                                        </button>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    )}
                  </React.Fragment>
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
