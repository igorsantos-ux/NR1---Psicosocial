import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Building2, MapPin, Phone, Users, Clock, 
  FileDown, Calendar, AlertTriangle, Zap, CheckCircle2,
  Shield, Mail, Copy, Share2, FileText
} from 'lucide-react';
import Layout from '../../../components/Layout';
import api from '../../../api/api';
import Toast from '../../../components/Toast';

export default function DetalhesEmpresa() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  const fetchEmpresa = async () => {
    try {
      const res = await api.get(`/empresas/${id}`);
      setEmpresa(res.data);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Empresa não encontrada');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpresa();
  }, [id]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/q/${empresa?.tokenColeta}`;
    navigator.clipboard.writeText(url);
    setToast({ show: true, message: 'Link de coleta copiado!', type: 'success' });
  };

  if (loading) return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-clinicfy-teal mb-4"></div>
        <p className="text-gray-400 font-bold animate-pulse uppercase tracking-widest text-[10px]">Sincronizando dados...</p>
      </div>
    </Layout>
  );

  if (error || !empresa) return (
    <Layout>
      <div className="max-w-xl mx-auto py-20 text-center">
        <div className="bg-red-50 p-8 rounded-[32px] border border-red-100">
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-700 mb-2">Ops! Algo deu errado</h2>
            <p className="text-red-600/70 text-sm mb-6">{error || 'Não conseguimos localizar esta empresa.'}</p>
            <button 
                onClick={() => navigate('/admin/empresas')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl font-bold text-xs hover:bg-red-700 transition-all shadow-lg shadow-red-200"
            >
                <ArrowLeft size={16} /> VOLTAR PARA LISTAGEM
            </button>
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto pb-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <button 
            onClick={() => navigate('/admin/empresas')}
            className="p-4 rounded-2xl bg-white border border-gray-100 text-gray-400 hover:text-clinicfy-teal transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-clinicfy-dark tracking-tight uppercase">
                {empresa?.razaoSocial ?? 'NOME NÃO INFORMADO'}
              </h1>
              <span className={`text-[10px] px-3 py-1 rounded-full font-black tracking-widest border ${
                empresa?.statusColeta === 'ATIVA' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                empresa?.statusColeta === 'EXPIRADA' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                'bg-gray-50 text-gray-500 border-gray-100'
              }`}>
                {empresa?.statusColeta ?? 'DESCONHECIDO'}
              </span>
            </div>
            <p className="text-gray-400 text-xs font-bold mt-1">
              CNPJ: {empresa?.cnpj ?? '—'} <span className="mx-2 text-gray-200">|</span> ID: {empresa?.id?.split('-')[0].toUpperCase()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Card Perfil Corporativo */}
            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-clinicfy-teal/5 rounded-full -mr-16 -mt-16"></div>
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                <Building2 size={14} className="text-clinicfy-teal" /> Perfil Corporativo
              </h2>
              
              <div className="grid grid-cols-2 gap-y-8 gap-x-12 relative z-10">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest">CNAE Principal</label>
                  <p className="text-sm font-bold text-clinicfy-dark leading-tight">
                    {empresa?.cnae ?? '—'}
                  </p>
                  {empresa?.cnaeDescricao && (
                    <p className="text-[10px] text-gray-400 font-medium mt-1 leading-relaxed italic">{empresa.cnaeDescricao}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Grau de Risco (NR-04)</label>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-clinicfy-teal text-white flex items-center justify-center font-black text-sm">
                      {empresa?.grauRiscoNr4 ?? '0'}
                    </div>
                    <p className="text-sm font-bold text-clinicfy-dark">Risco {empresa?.grauRiscoNr4 >= 3 ? 'Alto' : 'Baixo'}</p>
                  </div>
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Localização</label>
                  <p className="text-sm font-bold text-clinicfy-dark flex items-center gap-2">
                    <MapPin size={16} className="text-clinicfy-teal" />
                    {empresa?.endereco ? `${empresa.endereco}, ${empresa.municipio} - ${empresa.estado}` : 'Endereço não cadastrado'}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Total de Funcionários</label>
                  <p className="text-sm font-bold text-clinicfy-dark flex items-center gap-2">
                    <Users size={16} className="text-clinicfy-teal" /> {empresa?.totalFuncionarios ?? 0} colaboradores
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Horário de Funcionamento</label>
                  <p className="text-sm font-bold text-clinicfy-dark flex items-center gap-2">
                    <Clock size={16} className="text-clinicfy-teal" /> {empresa?.horarioTrabalho ?? 'Horário comercial'}
                  </p>
                </div>
              </div>
            </div>

            {/* Card GHEs */}
            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Shield size={14} className="text-clinicfy-teal" /> Grupos Homogêneos (GHE)
                </h2>
                <span className="text-[10px] font-black text-clinicfy-teal bg-clinicfy-teal/5 px-3 py-1 rounded-full uppercase">
                  {empresa?.ghes?.length ?? 0} GRUPOS
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {empresa?.ghes?.map((ghe: any) => (
                  <div key={ghe.id} className="p-5 rounded-2xl bg-gray-50/50 border border-gray-50 flex items-center justify-between group hover:border-clinicfy-teal/20 transition-all">
                    <div>
                      <p className="text-xs font-black text-clinicfy-dark uppercase tracking-tight">{ghe.nome}</p>
                      <p className="text-[9px] text-gray-400 font-bold tracking-widest uppercase mt-0.5">{ghe.codigo}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-clinicfy-teal">
                        {ghe.cargos?.reduce((sum: number, cargo: any) => sum + (cargo.quantidade || 0), 0) ?? 0}
                      </p>
                      <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">Colaboradores</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Coluna Lateral */}
          <div className="space-y-8">
            
            {/* Card Monitoramento */}
            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Zap size={14} className="text-clinicfy-pink" /> Monitoramento da Coleta
              </h2>
              <div className="space-y-5">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Respostas Recebidas</span>
                  <span className="text-sm font-black text-clinicfy-dark">{empresa?.totalRespostas ?? 0} / {empresa?.totalFuncionarios ?? 0}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-clinicfy-teal rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min(100, ((empresa?.totalRespostas ?? 0) / (empresa?.totalFuncionarios ?? 1)) * 100)}%` }}
                  ></div>
                </div>
                <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                    <span className="text-[9px] font-bold text-gray-400 uppercase">Data de Expiração</span>
                    <span className="text-[10px] font-black text-clinicfy-dark">
                        {empresa?.dataExpiracaoLink 
                            ? new Date(empresa.dataExpiracaoLink).toLocaleDateString('pt-BR')
                            : '—'}
                    </span>
                </div>
              </div>
            </div>

            {/* Card Link de Coleta (NOVO) */}
            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Share2 size={14} className="text-clinicfy-teal" /> Link de Coleta
              </h3>
              
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100 mb-4">
                <span className="text-[10px] text-gray-500 flex-1 truncate font-mono">
                  {`${window.location.origin}/q/${empresa?.tokenColeta}`}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="p-2 text-clinicfy-teal hover:bg-clinicfy-teal/10 rounded-lg transition-colors"
                  title="Copiar link"
                >
                  <Copy size={14} />
                </button>
              </div>
              
              <a 
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Olá! Por favor, responda o questionário de saúde ocupacional da empresa ${empresa?.razaoSocial}:\n${window.location.origin}/q/${empresa?.tokenColeta}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#25D366] text-white rounded-2xl font-bold text-xs hover:opacity-90 transition-all shadow-lg shadow-green-100"
              >
                <Share2 size={16} /> COMPARTILHAR WHATSAPP
              </a>
              
              <p className="text-[9px] text-gray-400 text-center mt-4 leading-relaxed italic">
                {empresa?.statusColeta === 'ATIVA' 
                  ? `Válido até ${new Date(empresa?.dataExpiracaoLink).toLocaleDateString('pt-BR')}`
                  : 'Link expirado — coleta encerrada'}
              </p>
            </div>

            {/* Card Último PGR */}
            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm overflow-hidden relative">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <FileDown size={14} className="text-clinicfy-pink" /> Último PGR Consolidado
              </h2>
              
              {empresa?.ultimoPgr ? (
                <div className="space-y-4">
                  <div className={`text-[9px] px-3 py-1 rounded-full font-black tracking-widest border inline-block uppercase ${
                    empresa.ultimoPgr.status === 'AGUARDANDO_VALIDACAO' ? 'bg-clinicfy-pink/10 text-clinicfy-pink border-clinicfy-pink/20' :
                    empresa.ultimoPgr.status === 'VALIDADO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    empresa.ultimoPgr.status === 'REPROVADO' ? 'bg-red-50 text-red-600 border-red-100' :
                    'bg-gray-50 text-gray-500 border-gray-100'
                  }`}>
                    {empresa.ultimoPgr.status?.replace('_', ' ')}
                  </div>

                  {empresa.ultimoPgr.erroDetalhes && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl space-y-1">
                      <p className="text-[10px] font-black text-red-700 uppercase">Erro Identificado</p>
                      <p className="text-[11px] text-red-600 font-medium leading-tight">{empresa.ultimoPgr.erroDetalhes}</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    {empresa.ultimoPgr.temPdf && (
                      <a 
                        href={`${import.meta.env.VITE_API_URL || ''}/api/pgr/${empresa.ultimoPgr.id}/download/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-3 bg-clinicfy-pink text-white rounded-xl font-bold text-xs hover:opacity-90 transition-all shadow-lg shadow-clinicfy-pink/10"
                      >
                        <FileDown size={16} /> DOWNLOAD PDF
                      </a>
                    )}
                    {empresa.ultimoPgr.temDocx && (
                      <a 
                        href={`${import.meta.env.VITE_API_URL || ''}/api/pgr/${empresa.ultimoPgr.id}/download/docx`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-3 bg-clinicfy-teal text-white rounded-xl font-bold text-xs hover:opacity-90 transition-all shadow-lg shadow-clinicfy-teal/10"
                      >
                        <FileText size={16} /> DOWNLOAD DOCX
                      </a>
                    )}
                    {empresa.ultimoPgr.status === 'AGUARDANDO_VALIDACAO' && (
                      <button 
                        onClick={() => navigate(`/admin/pgr/${empresa.ultimoPgr.id}/validar`)}
                        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-clinicfy-pink text-clinicfy-pink rounded-xl font-bold text-xs hover:bg-clinicfy-pink hover:text-white transition-all"
                      >
                        <Zap size={16} /> VALIDAR AGORA
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center">
                    <p className="text-xs text-gray-400 font-medium italic">Nenhum laudo gerado.</p>
                </div>
              )}
            </div>

            {/* Card Engenheiro */}
            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-clinicfy-teal" /> Responsável Técnico
              </h2>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-clinicfy-teal/10 flex items-center justify-center text-clinicfy-teal font-black text-lg">
                    {empresa?.engenheiro?.nome?.charAt(0) ?? 'E'}
                </div>
                <div>
                    <p className="text-xs font-black text-clinicfy-dark uppercase tracking-tight">{empresa?.engenheiro?.nome ?? 'NÃO ATRIBUÍDO'}</p>
                    <p className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                        <Mail size={12} /> {empresa?.engenheiro?.email ?? ''}
                    </p>
                    {empresa?.engenheiro?.crea && (
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5 uppercase tracking-tighter">
                        CREA: {empresa.engenheiro.crea}
                      </p>
                    )}
                </div>
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
