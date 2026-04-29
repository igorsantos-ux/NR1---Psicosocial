import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Building2, MapPin, Phone, Users, Clock, Hash, 
  ExternalLink, Copy, Share2, Mail, Zap, CheckCircle2, 
  FileDown, Calendar, AlertCircle, RefreshCw, Layers, Edit3
} from 'lucide-react';
import Layout from '../../../components/Layout';
import api from '../../../api/api';
import Toast from '../../../components/Toast';
import StatusBadge from './components/StatusBadge';
import BarraProgresso from './components/BarraProgresso';
import ContadorRegressivo from './components/ContadorRegressivo';
import TimelineAtividades from './components/TimelineAtividades';

export default function DetalhesEmpresa() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });
  const [copied, setCopied] = useState(false);

  const fetchEmpresa = async () => {
    try {
      const res = await api.get(`/empresas/${id}`);
      setEmpresa(res.data);
    } catch (error) {
      setToast({ show: true, message: 'Erro ao carregar detalhes.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpresa();
  }, [id]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/q/${empresa.tokenColeta}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setToast({ show: true, message: 'Link de coleta copiado!', type: 'success' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGeneratePGR = async () => {
    try {
      await api.post(`/pgr/gerar`, { empresaId: id });
      setToast({ show: true, message: 'Geração do PGR iniciada!', type: 'success' });
      fetchEmpresa();
    } catch (error) {
      setToast({ show: true, message: 'Erro ao gerar PGR.', type: 'error' });
    }
  };

  if (loading) return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <RefreshCw size={40} className="animate-spin mb-4" />
        <p className="font-bold animate-pulse">Carregando detalhes da empresa...</p>
      </div>
    </Layout>
  );

  if (!empresa) return (
    <Layout>
      <div className="text-center py-20">
        <h2 className="text-xl font-bold">Empresa não encontrada.</h2>
        <Link to="/admin/empresas" className="text-clinicfy-teal mt-4 block">Voltar para a lista</Link>
      </div>
    </Layout>
  );

  const publicUrl = `${window.location.origin}/q/${empresa.tokenColeta}`;
  const totalRespostas = empresa.respostas?.length || 0;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Top Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/admin/empresas')}
            className="p-3 rounded-2xl bg-white border border-gray-100 text-gray-400 hover:text-clinicfy-teal transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-clinicfy-dark">{empresa.razaoSocial}</h1>
              <StatusBadge status={empresa.statusColeta} />
            </div>
            <p className="text-gray-500 text-sm">CNPJ: {empresa.cnpj}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* COLUNA ESQUERDA (60%) */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Card 1 - Informações */}
            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                <button className="text-gray-400 hover:text-clinicfy-teal transition-colors">
                  <Edit3 size={20} />
                </button>
              </div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Building2 size={14} className="text-clinicfy-teal" /> Informações da Empresa
              </h3>
              
              <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">CNAE</label>
                  <p className="text-sm font-medium text-clinicfy-dark">{empresa.cnae} - {empresa.cnaeDescricao || 'Sem descrição'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Grau de Risco</label>
                  <p className="text-sm font-bold text-clinicfy-teal">Nível {empresa.grauRiscoNr4}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Endereço</label>
                  <p className="text-sm font-medium text-clinicfy-dark flex items-start gap-2">
                    <MapPin size={16} className="text-gray-300 mt-0.5" />
                    {empresa.endereco}, {empresa.municipio} - {empresa.estado} (CEP: {empresa.cep})
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Telefone</label>
                  <p className="text-sm font-medium text-clinicfy-dark flex items-center gap-2">
                    <Phone size={16} className="text-gray-300" /> {empresa.telefone || 'Não informado'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Horário</label>
                  <p className="text-sm font-medium text-clinicfy-dark flex items-center gap-2">
                    <Clock size={16} className="text-gray-300" /> {empresa.horarioTrabalho || 'Comercial'}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2 - Status da Coleta */}
            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Clock size={14} className="text-clinicfy-teal" /> Status da Coleta
              </h3>
              
              <div className="flex flex-col md:flex-row gap-10 items-center">
                <div className="flex-1 w-full space-y-6">
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <ContadorRegressivo dataExpiracao={empresa.dataExpiracaoLink} />
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <BarraProgresso atual={totalRespostas} total={empresa.totalFuncionarios} />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex-1 py-3 px-4 rounded-xl border border-gray-100 font-bold text-xs text-gray-500 hover:bg-gray-50 transition-all">
                      Estender Prazo
                    </button>
                    <button className="flex-1 py-3 px-4 rounded-xl border border-rose-100 font-bold text-xs text-rose-500 hover:bg-rose-50 transition-all">
                      Encerrar Coleta Agora
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col items-center justify-center p-6 bg-clinicfy-teal/5 rounded-3xl border border-clinicfy-teal/10">
                  <p className="text-4xl font-bold text-clinicfy-teal">{totalRespostas}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Respostas Totais</p>
                </div>
              </div>
            </div>

            {/* Card 3 - GHEs */}
            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Layers size={14} className="text-clinicfy-teal" /> Distribuição por GHE
              </h3>
              <div className="space-y-4">
                {empresa.ghes?.map((ghe: any) => (
                  <div key={ghe.id} className="p-4 rounded-2xl border border-gray-50 bg-gray-50/30 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-clinicfy-dark">{ghe.nome}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-0.5">{ghe.codigo}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-clinicfy-teal">{ghe.respostas?.length || 0} respostas</p>
                      <div className="flex gap-1 mt-1.5 justify-end">
                        <div className="w-8 h-1.5 rounded-full bg-emerald-400 opacity-30" />
                        <div className="w-4 h-1.5 rounded-full bg-amber-400" />
                        <div className="w-2 h-1.5 rounded-full bg-rose-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* COLUNA DIREITA (40%) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Card Link */}
            <div className="bg-gradient-to-br from-clinicfy-teal to-clinicfy-dark rounded-[32px] p-8 text-white shadow-xl shadow-clinicfy-teal/10">
              <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-6">Link de Coleta</h3>
              <div className="bg-white/10 p-4 rounded-2xl border border-white/10 mb-6 break-all">
                <p className="text-[10px] font-mono text-white/80">{publicUrl}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button 
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-clinicfy-dark font-bold text-xs hover:bg-clinicfy-light transition-all active:scale-95"
                >
                  {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />} 
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
                <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white font-bold text-xs hover:opacity-90 transition-all active:scale-95">
                  <Share2 size={16} /> WhatsApp
                </button>
              </div>
              <div className="bg-white p-4 rounded-2xl flex items-center justify-center">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(publicUrl)}`}
                  alt="QR Code"
                  className="w-32 h-32"
                />
              </div>
            </div>

            {/* Card Ações PGR */}
            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Ações do PGR</h3>
              
              <div className="space-y-4">
                <button 
                  onClick={handleGeneratePGR}
                  className="w-full py-4 rounded-2xl bg-clinicfy-pink text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-clinicfy-pink/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Zap size={20} /> Gerar PGR Consolidado
                </button>
                <p className="text-[10px] text-gray-400 text-center leading-relaxed px-4">
                  Esta ação irá processar todas as respostas com IA e gerar o documento consolidado.
                </p>

                {empresa.pgrs?.length > 0 && (
                  <div className="pt-6 mt-6 border-t border-gray-100 space-y-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 text-center">Último PGR Gerado</p>
                    <button className="w-full py-3 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors">
                      <FileDown size={16} /> Download PDF
                    </button>
                    <button className="w-full py-3 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors">
                      <FileDown size={16} /> Download DOCX
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Histórico */}
            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <History size={14} className="text-clinicfy-teal" /> Histórico de Atividades
              </h3>
              <TimelineAtividades atividades={empresa.respostas || []} />
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
