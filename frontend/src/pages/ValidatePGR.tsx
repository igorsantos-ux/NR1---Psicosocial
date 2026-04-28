import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { FileCheck, FileX, Download, CheckCircle2, AlertCircle, Eye, FileText } from 'lucide-react';
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
            await api.post(`/pgr/${id}/validar`, { aprovado: true });
            setToast({ show: true, message: 'PGR aprovado com sucesso!', type: 'success' });
            setTimeout(() => navigate('/admin/pgr'), 2000);
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
            await api.post(`/pgr/${id}/validar`, { aprovado: false, observacoes });
            setToast({ show: true, message: 'PGR reprovado. Uma nova versão pode ser gerada após ajustes.', type: 'error' });
            setTimeout(() => navigate('/admin/plans'), 2000);
        } catch (err) {
            setToast({ show: true, message: 'Erro ao reprovar PGR.', type: 'error' });
        } finally {
            setValidating(false);
        }
    };

    const handleDownload = async (type: 'pdf' | 'docx') => {
        try {
            const response = await api.get(`/pgr/${id}/download?type=${type}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `PGR_${pgr.empresa?.razaoSocial}_${new Date().getFullYear()}.${type}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            setToast({ show: true, message: 'Erro ao baixar arquivo.', type: 'error' });
        }
    };

    if (loading) return <Layout><div className="flex items-center justify-center h-64 text-gray-400">Carregando análise técnica...</div></Layout>;

    return (
        <Layout>
            <div className="max-w-6xl mx-auto">
                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-clinicfy-teal/10 text-clinicfy-teal text-[10px] font-bold px-2 py-1 rounded-full uppercase">Revisão Técnica</span>
                            <span className="text-gray-300">/</span>
                            <span className="text-gray-500 text-xs font-medium">ID: {id?.split('-')[0]}</span>
                        </div>
                        <h1 className="text-2xl font-bold text-clinicfy-dark">Validar PGR Consolidado</h1>
                        <p className="text-gray-500 text-sm">Revise o conteúdo gerado pela IA e aprove para envio ao cliente.</p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => handleDownload('docx')}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
                        >
                            <FileText size={16} className="text-blue-500" /> DOCX
                        </button>
                        <button
                            onClick={() => handleDownload('pdf')}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
                        >
                            <FileText size={16} className="text-red-500" /> PDF
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-3 space-y-6">
                        {/* Visualizador de PDF (Simulado com iframe ou Placeholder) */}
                        <div className="bg-gray-900 rounded-[32px] overflow-hidden aspect-[1/1.4] shadow-2xl relative group">
                            <iframe
                                src={`${api.defaults.baseURL}/pgr/${id}/download?type=pdf#toolbar=0`}
                                className="w-full h-full border-none"
                                title="PGR Preview"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-2 text-white font-bold text-sm">
                                    <Eye size={18} /> MODO DE VISUALIZAÇÃO PRÉVIA
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Resumo da Empresa</h4>
                                <div className="p-4 bg-gray-50 rounded-2xl">
                                    <p className="text-sm font-bold text-clinicfy-dark">{pgr.empresa?.razaoSocial}</p>
                                    <p className="text-[10px] text-gray-500">{pgr.empresa?.cnpj}</p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-gray-50">
                                {!showRejectForm ? (
                                    <>
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
                                            className="w-full py-4 bg-white border-2 border-red-100 text-red-500 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition-all"
                                        >
                                            <FileX size={20} />
                                            REPROVAR / AJUSTAR
                                        </button>
                                    </>
                                ) : (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-red-500 uppercase ml-1">Motivo da Reprovação</label>
                                            <textarea
                                                className="w-full p-4 bg-red-50 border border-red-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200 h-32 placeholder:text-red-300"
                                                placeholder="Descreva o que precisa ser ajustado (ex: GHE X está com cargo trocado, análise de risco Y está muito alta...)"
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
                                                {validating ? 'ENVIANDO...' : 'CONFIRMAR REPROVAÇÃO'}
                                            </button>
                                            <button
                                                onClick={() => setShowRejectForm(false)}
                                                className="px-4 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all"
                                            >
                                                CANCELAR
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-gray-50 space-y-3">
                                <div className="flex items-start gap-3 text-[11px] text-gray-400 leading-relaxed">
                                    <AlertCircle size={14} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                                    <p>Ao aprovar, o documento será marcado como versão final oficial e ficará disponível para download definitivo.</p>
                                </div>
                                <div className="flex items-start gap-3 text-[11px] text-gray-400 leading-relaxed">
                                    <CheckCircle2 size={14} className="text-clinicfy-teal flex-shrink-0 mt-0.5" />
                                    <p>A IA baseou-se nas {pgr.empresa?.respostas?.length || 0} respostas coletadas para este GHE.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-clinicfy-dark to-clinicfy-dark/90 p-8 rounded-[32px] text-white shadow-xl">
                            <h4 className="text-xs font-bold text-white/50 uppercase mb-4 tracking-widest">Dica Técnica</h4>
                            <p className="text-xs text-white/80 leading-relaxed italic">
                                "Revise se as sugestões do Plano de Ação estão condizentes com a realidade estrutural da empresa antes de baixar o PDF final."
                            </p>
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
