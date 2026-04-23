import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { FileText, Building2, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, Clock, Shield, Loader2, BarChart3, Calendar, Users } from 'lucide-react';
import api from '../api/api';
import Toast from '../components/Toast';

const RiskBadge = ({ level }: { level: string }) => {
  const colors: Record<string, string> = {
    'INTOLERÁVEL': 'bg-red-100 text-red-700 border-red-200',
    'SUBSTANCIAL': 'bg-orange-100 text-orange-700 border-orange-200',
    'MODERADO': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'TRIVIAL': 'bg-green-100 text-green-700 border-green-200',
  };
  return (
    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${colors[level] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
      {level}
    </span>
  );
};

const Section = ({ title, icon: Icon, children, defaultOpen = false }: any) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="bg-clinicfy-teal/10 p-2 rounded-xl text-clinicfy-teal"><Icon size={18} /></div>
          <h3 className="font-bold text-clinicfy-dark text-sm">{title}</h3>
        </div>
        {open ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-gray-50">{children}</div>}
    </div>
  );
};

export default function PgrReport() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [reports, setReports] = useState<any[]>([]);
  const [activeReport, setActiveReport] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => { fetchCompanies(); }, []);
  useEffect(() => { if (selectedCompany) fetchReports(); }, [selectedCompany]);

  const fetchCompanies = async () => {
    try {
      const res = await api.get('/companies');
      setCompanies(res.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const fetchReports = async () => {
    try {
      const res = await api.get(`/pgr/reports/${selectedCompany}`);
      setReports(res.data);
      if (res.data.length > 0) setActiveReport(res.data[0]);
      else setActiveReport(null);
    } catch { /* ignore */ }
  };

  const handleGenerate = async () => {
    if (!selectedCompany) return;
    setGenerating(true);
    try {
      const res = await api.post(`/pgr/consolidate/${selectedCompany}`, {
        periodoColeta: new Date().toLocaleDateString('pt-BR'),
      });
      setActiveReport(res.data);
      setReports(prev => [res.data, ...prev]);
      setToast({ show: true, message: 'PGR consolidado gerado com sucesso!', type: 'success' });
    } catch (err: any) {
      setToast({ show: true, message: err.response?.data?.error || 'Erro ao gerar PGR.', type: 'error' });
    } finally { setGenerating(false); }
  };

  const handleValidate = async (id: string) => {
    try {
      await api.patch(`/pgr/reports/${id}/validate`);
      setActiveReport((prev: any) => prev ? { ...prev, status: 'VALIDATED' } : prev);
      setToast({ show: true, message: 'Relatório validado!', type: 'success' });
    } catch { setToast({ show: true, message: 'Erro ao validar.', type: 'error' }); }
  };

  const rd = activeReport?.reportData; // report data shorthand

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-clinicfy-dark">Relatório PGR Consolidado</h1>
            <p className="text-gray-500 text-sm">Gere e visualize o PGR psicossocial completo por empresa.</p>
          </div>
          <div className="flex gap-3 items-end">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Empresa</label>
              <select className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium min-w-[220px]" value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)}>
                <option value="">Selecione...</option>
                {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <button onClick={handleGenerate} disabled={!selectedCompany || generating} className="btn-primary flex items-center gap-2 disabled:opacity-50 whitespace-nowrap">
              {generating ? <><Loader2 size={16} className="animate-spin" /> Gerando...</> : <><FileText size={16} /> Gerar PGR</>}
            </button>
          </div>
        </div>

        {generating && (
          <div className="py-20 text-center">
            <Loader2 size={40} className="animate-spin text-clinicfy-teal mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Gerando PGR consolidado com IA...</p>
            <p className="text-gray-400 text-xs mt-1">Isso pode levar até 30 segundos.</p>
          </div>
        )}

        {!generating && !activeReport && selectedCompany && (
          <div className="py-20 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100 text-center">
            <FileText size={32} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-gray-500 font-bold">Nenhum relatório gerado</h3>
            <p className="text-gray-400 text-sm">Clique em "Gerar PGR" para consolidar as avaliações.</p>
          </div>
        )}

        {!generating && activeReport && rd && (
          <div className="space-y-4">
            {/* Resumo Executivo */}
            {rd.resumo_executivo && (
              <div className="bg-gradient-to-br from-clinicfy-teal to-clinicfy-dark rounded-3xl p-6 text-white shadow-xl">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><BarChart3 size={20} /> Resumo Executivo</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {[
                    { label: 'Trivial', value: rd.resumo_executivo.distribuicao_geral?.trivial || 0, color: 'bg-green-500/20' },
                    { label: 'Moderado', value: rd.resumo_executivo.distribuicao_geral?.moderado || 0, color: 'bg-yellow-500/20' },
                    { label: 'Substancial', value: rd.resumo_executivo.distribuicao_geral?.substancial || 0, color: 'bg-orange-500/20' },
                    { label: 'Intolerável', value: rd.resumo_executivo.distribuicao_geral?.intoleravel || 0, color: 'bg-red-500/20' },
                  ].map(s => (
                    <div key={s.label} className={`${s.color} rounded-2xl p-4 text-center`}>
                      <p className="text-2xl font-bold">{s.value}</p>
                      <p className="text-[10px] uppercase tracking-widest opacity-80">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 text-xs opacity-80 mb-3">
                  <span className="flex items-center gap-1"><Users size={12} /> {rd.resumo_executivo.total_respondentes || activeReport.totalRespondentes} respondentes</span>
                  <span className="flex items-center gap-1"><Calendar size={12} /> {rd.resumo_executivo.periodo_coleta || activeReport.periodoColeta}</span>
                  <span className="flex items-center gap-1"><Shield size={12} /> {rd.resumo_executivo.total_ghes} GHEs</span>
                </div>
                {rd.resumo_executivo.parecer_sintetico && <p className="text-sm opacity-90 italic border-t border-white/20 pt-3 mt-3">{rd.resumo_executivo.parecer_sintetico}</p>}
                {rd.resumo_executivo.ghes_atencao_imediata?.length > 0 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <span className="text-[10px] uppercase font-bold opacity-60">Atenção Imediata:</span>
                    {rd.resumo_executivo.ghes_atencao_imediata.map((g: string, i: number) => (
                      <span key={i} className="bg-red-500/30 px-2 py-0.5 rounded text-[10px] font-bold">{g}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Status */}
            <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${activeReport.status === 'VALIDATED' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                  {activeReport.status === 'VALIDATED' ? '✅ VALIDADO' : '⏳ RASCUNHO'}
                </span>
                <span className="text-xs text-gray-400">Gerado em {new Date(activeReport.createdAt).toLocaleString('pt-BR')}</span>
              </div>
              {activeReport.status !== 'VALIDATED' && (
                <button onClick={() => handleValidate(activeReport.id)} className="px-4 py-2 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors flex items-center gap-2">
                  <CheckCircle2 size={14} /> Validar PGR
                </button>
              )}
            </div>

            {/* Identificação */}
            {rd.identificacao && (
              <Section title="Identificação da Empresa" icon={Building2} defaultOpen={true}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {[
                    ['Razão Social', rd.identificacao.razao_social],
                    ['CNPJ', rd.identificacao.cnpj],
                    ['CNAE', `${rd.identificacao.cnae} — ${rd.identificacao.cnae_descricao}`],
                    ['Grau de Risco', rd.identificacao.grau_risco],
                    ['Endereço', rd.identificacao.endereco],
                    ['Município/UF', `${rd.identificacao.municipio} / ${rd.identificacao.estado}`],
                    ['Funcionários', rd.identificacao.total_funcionarios],
                    ['Engenheiro', `${rd.identificacao.engenheiro_nome} — ${rd.identificacao.engenheiro_crea}`],
                    ['Vigência', `${rd.identificacao.vigencia_inicio} a ${rd.identificacao.vigencia_fim}`],
                  ].filter(([_, v]) => v).map(([label, value]) => (
                    <div key={label as string} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
                      <p className="text-sm font-medium text-clinicfy-dark mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Seção 10 - Riscos por GHE */}
            {rd.secao_10_por_ghe?.map((ghe: any, gi: number) => (
              <Section key={gi} title={`${ghe.ghe_codigo || `GHE ${gi+1}`} — ${ghe.ghe_nome}`} icon={Shield}>
                <p className="text-xs text-gray-400 mt-3 mb-2">{ghe.total_colaboradores} colaborador(es) avaliado(s)</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-3 py-2 text-left font-bold text-gray-400 uppercase">Fator de Risco</th>
                        <th className="px-3 py-2 text-left font-bold text-gray-400 uppercase">Fonte</th>
                        <th className="px-3 py-2 text-left font-bold text-gray-400 uppercase">Efeito</th>
                        <th className="px-3 py-2 text-center font-bold text-gray-400 uppercase">P</th>
                        <th className="px-3 py-2 text-center font-bold text-gray-400 uppercase">C</th>
                        <th className="px-3 py-2 text-center font-bold text-gray-400 uppercase">Score</th>
                        <th className="px-3 py-2 text-center font-bold text-gray-400 uppercase">Nível</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {ghe.riscos_psicossociais?.map((r: any, ri: number) => (
                        <tr key={ri} className="hover:bg-gray-50/50">
                          <td className="px-3 py-2.5 font-medium text-clinicfy-dark max-w-[200px]">{r.descricao_agente}</td>
                          <td className="px-3 py-2.5 text-gray-500 max-w-[150px]">{r.fonte_geradora}</td>
                          <td className="px-3 py-2.5 text-gray-500 max-w-[150px]">{r.efeito}</td>
                          <td className="px-3 py-2.5 text-center font-mono">{r.probabilidade}</td>
                          <td className="px-3 py-2.5 text-center font-mono">{r.consequencia}</td>
                          <td className="px-3 py-2.5 text-center font-bold font-mono">{r.score}</td>
                          <td className="px-3 py-2.5 text-center"><RiskBadge level={r.nivel_risco} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            ))}

            {/* Seção 11 - Cronograma */}
            {rd.secao_11 && (
              <Section title="Seção 11 — Metas e Prioridades de Controle" icon={Calendar}>
                <div className="mt-4 space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase">Cronograma de Ações</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="px-3 py-2 text-left font-bold text-gray-400 uppercase">Ação</th>
                          <th className="px-3 py-2 text-left font-bold text-gray-400 uppercase">Tipo</th>
                          <th className="px-3 py-2 text-left font-bold text-gray-400 uppercase">GHE Alvo</th>
                          <th className="px-3 py-2 text-center font-bold text-gray-400 uppercase">Meses</th>
                          <th className="px-3 py-2 text-left font-bold text-gray-400 uppercase">Responsável</th>
                          <th className="px-3 py-2 text-center font-bold text-gray-400 uppercase">Prioridade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {rd.secao_11.cronograma_acoes?.map((a: any, i: number) => (
                          <tr key={i} className="hover:bg-gray-50/50">
                            <td className="px-3 py-2.5 font-medium text-clinicfy-dark max-w-[250px]">{a.acao}</td>
                            <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.tipo === 'Treinamento' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>{a.tipo}</span></td>
                            <td className="px-3 py-2.5 text-gray-500">{Array.isArray(a.ghe_alvo) ? a.ghe_alvo.join(', ') : a.ghe_alvo}</td>
                            <td className="px-3 py-2.5 text-center font-mono">{a.mes_inicio}–{a.mes_fim}</td>
                            <td className="px-3 py-2.5 text-gray-500">{a.responsavel}</td>
                            <td className="px-3 py-2.5 text-center">
                              <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[10px] font-bold ${
                                a.prioridade === 4 ? 'bg-red-100 text-red-600' : a.prioridade === 3 ? 'bg-orange-100 text-orange-600' : a.prioridade === 2 ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
                              }`}>{a.prioridade}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Section>
            )}

            {/* Seção 13 - Recomendações */}
            {rd.secao_13_recomendacoes && (
              <Section title="Seção 13 — Recomendações à Empresa" icon={AlertTriangle}>
                <p className="text-sm text-gray-700 leading-relaxed mt-4 whitespace-pre-line">{rd.secao_13_recomendacoes}</p>
              </Section>
            )}

            {/* Seção 14 - Considerações Finais */}
            {rd.secao_14_consideracoes_finais && (
              <Section title="Seção 14 — Considerações Finais" icon={CheckCircle2}>
                <p className="text-sm text-gray-700 leading-relaxed mt-4 whitespace-pre-line">{rd.secao_14_consideracoes_finais}</p>
              </Section>
            )}

            {/* Histórico */}
            {reports.length > 1 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Histórico de Relatórios</h3>
                <div className="space-y-2">
                  {reports.map((r: any) => (
                    <button key={r.id} onClick={() => setActiveReport(r)} className={`w-full flex justify-between items-center p-3 rounded-xl text-xs transition-colors ${activeReport?.id === r.id ? 'bg-clinicfy-teal/10 border border-clinicfy-teal/20' : 'hover:bg-gray-50'}`}>
                      <span className="font-medium">{new Date(r.createdAt).toLocaleString('pt-BR')}</span>
                      <span className={`px-2 py-0.5 rounded font-bold ${r.status === 'VALIDATED' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>{r.status}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
    </Layout>
  );
}
