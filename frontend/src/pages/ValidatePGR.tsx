import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { FileCheck, FileX, Download, CheckCircle2, AlertCircle, Eye, FileText, ChevronLeft, BarChart3, TrendingUp, Info } from 'lucide-react';
import api from '../api/api';
import Toast from '../components/Toast';

export default function ValidatePGR() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pgr, setPgr] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [validating, setValidating] = useState(false);
    const [observacoes, setObservacoes] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

    useEffect(() => {
        fetchPgr();
    }, [id]);

    const fetchPgr = async () => {
        try {
            const res = await api.get(`/pgr/${id}/status`);
            // Aqui buscamos o objeto completo se necessário, mas o status já traz o básico
            // No mundo real, poderíamos ter um GET /pgr/:id completo
            setPgr(res.data);
        } catch (err) {
            setToast({ show: true, message: 'Erro ao carregar dados do PGR.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        setValidating(true);
        try {
            await api.post(`/pgr/${id}/validar`, { approved: true });
            setToast({ show: true, message: 'PGR aprovado com sucesso!', type: 'success' });
            setTimeout(() => navigate('/admin/plans'), 2000);
        } catch (err) {
            setToast({ show: true, message: 'Erro ao aprovar PGR.', type: 'error' });
        } finally {
            setValidating(false);
        }
    };

    const handleReject = async () => {
        if (!observacoes.trim()) {
            setToast({ show: true, message: 'Por favor, insira o motivo da reprovação.', type: 'error' });
            return;
        }
        setValidating(true);
        try {
            await api.post(`/pgr/${id}/validar`, { approved: false, observacoes });
            setToast({ show: true, message: 'PGR reprovado com sucesso.', type: 'success' });
            setTimeout(() => navigate('/admin/plans'), 2000);
        } catch (err) {
            setToast({ show: true, message: 'Erro ao reprovar PGR.', type: 'error' });
        } finally {
            setValidating(false);
        }
    };

    if (loading) return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-4">
          <div className="w-8 h-8 border-4 border-clinicfy-teal border-t-transparent rounded-full animate-spin" />
          <p className="font-medium animate-pulse">Carregando análise técnica...</p>
        </div>
      </Layout>
    );

    return (
        <Layout>
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <Link to="/admin/plans" className="flex items-center gap-2 text-clinicfy-teal font-bold text-xs mb-4 hover:translate-x-[-4px] transition-all">
                          <ChevronLeft size={16} /> VOLTAR PARA LISTAGEM
                        </Link>
                        <h1 className="text-2xl font-bold text-clinicfy-dark">Validação Técnica do PGR</h1>
                        <p className="text-gray-500 text-sm">Empresa: <span className="font-bold text-clinicfy-dark">{pgr?.empresa?.razaoSocial || 'Carregando...'}</span></p>
                    </div>

                    <div className="flex gap-3">
                        <a
                            href={`${api.defaults.baseURL}/pgr/${id}/download/docx`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
                        >
                            <Download size={16} className="text-blue-500" /> DOCX
                        </a>
                        <a
                            href={`${api.defaults.baseURL}/pgr/${id}/download/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
                        >
                            <Download size={16} className="text-red-500" /> PDF
                        </a>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Visualizador do PDF / Preview */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-gray-900 rounded-[32px] overflow-hidden aspect-[1/1.4] shadow-2xl relative group border-4 border-white">
                            <iframe
                                src={`${api.defaults.baseURL}/pgr/${id}/download/pdf#toolbar=0`}
                                className="w-full h-full border-none"
                                title="PGR Preview"
                            />
                            <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent p-6 pointer-events-none">
                                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full inline-flex items-center gap-2 text-white font-bold text-[10px] uppercase tracking-widest">
                                    <Eye size={14} /> Prévia do Documento Gerado
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Resumo e Ações */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Resumo Executivo */}
                        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                            <div className="flex items-center gap-2 pb-4 border-b border-gray-50">
                              <BarChart3 size={18} className="text-clinicfy-teal" />
                              <h4 className="text-sm font-bold text-clinicfy-dark uppercase tracking-tight">Resumo Executivo</h4>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 bg-gray-50 rounded-2xl text-center">
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Respondentes</p>
                                <p className="text-xl font-black text-clinicfy-dark">{pgr?.empresa?._count?.respostas || 0}</p>
                              </div>
                              <div className="p-3 bg-gray-50 rounded-2xl text-center">
                                <p className="text-[10px] font-bold text-gray-400 uppercase">GHEs</p>
                                <p className="text-xl font-black text-clinicfy-dark">{pgr?.empresa?._count?.ghes || 0}</p>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase ml-1">Distribuição de Riscos</p>
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500" style={{ width: '60%' }} />
                                  </div>
                                  <span className="text-[10px] font-bold text-gray-600">60% Trivial</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-400" style={{ width: '25%' }} />
                                  </div>
                                  <span className="text-[10px] font-bold text-gray-600">25% Mod.</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-orange-500" style={{ width: '15%' }} />
                                  </div>
                                  <span className="text-[10px] font-bold text-gray-600">15% Subst.</span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2 pt-2">
                              <p className="text-[10px] font-bold text-gray-400 uppercase ml-1">Top Riscos Identificados</p>
                              <ul className="space-y-1">
                                {['Sobrecarga de trabalho', 'Falta de feedback', 'Ruído excessivo'].map((r, i) => (
                                  <li key={i} className="flex items-center gap-2 text-[11px] text-gray-600">
                                    <TrendingUp size={12} className="text-red-400" /> {r}
                                  </li>
                                ))}
                              </ul>
                            </div>
                        </div>

                        {/* Painel de Decisão */}
                        <div className="bg-clinicfy-dark p-6 rounded-[32px] shadow-xl space-y-6">
                            <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
                              <Zap size={14} /> Decisão Técnica
                            </h4>
                            
                            {!showRejectForm ? (
                                <div className="space-y-3">
                                    <button
                                        onClick={handleApprove}
                                        disabled={validating}
                                        className="w-full py-4 bg-clinicfy-teal text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-clinicfy-teal/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        <FileCheck size={20} />
                                        {validating ? 'PROCESSANDO...' : 'APROVAR E FINALIZAR'}
                                    </button>
                                    <button
                                        onClick={() => setShowRejectForm(true)}
                                        className="w-full py-4 bg-transparent border-2 border-white/10 text-white/60 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/5 transition-all"
                                    >
                                        <FileX size={20} />
                                        REPROVAR / AJUSTAR
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-red-400 uppercase ml-1">Motivo da Reprovação</label>
                                        <textarea
                                            className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-400/30 h-32 placeholder:text-white/20"
                                            placeholder="Descreva o que precisa ser ajustado..."
                                            value={observacoes}
                                            onChange={(e) => setObservacoes(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleReject}
                                            disabled={validating}
                                            className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-xs hover:bg-red-600 transition-all"
                                        >
                                            {validating ? 'ENVIANDO...' : 'CONFIRMAR'}
                                        </button>
                                        <button
                                            onClick={() => setShowRejectForm(false)}
                                            className="px-4 py-3 bg-white/10 text-white rounded-xl font-bold text-xs hover:bg-white/20 transition-all"
                                        >
                                            VOLTAR
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start gap-3 text-[10px] text-white/40 leading-relaxed pt-2">
                                <Info size={14} className="text-white/20 flex-shrink-0 mt-0.5" />
                                <p>Ao aprovar, o documento será enviado para a pasta oficial do cliente e o download definitivo será habilitado.</p>
                            </div>
                        </div>
                    </div>
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
