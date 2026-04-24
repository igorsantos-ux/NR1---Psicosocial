import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Search, Filter, AlertTriangle, CheckCircle, Clock, XCircle, Factory } from 'lucide-react';
import api from '../api/api';
import Toast from '../components/Toast';

const RiskCard = ({ assessment }: any) => (
  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="font-bold text-clinicfy-dark">{assessment.employeeName || 'Colaborador Anônimo'}</h3>
        <p className="text-xs text-gray-400 font-medium">{assessment.ghe?.name || 'GHE não identificado'}</p>
      </div>
      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
        assessment.status === 'ANALYZED' ? 'bg-blue-100 text-blue-600' : 
        assessment.status === 'VALIDATED' ? 'bg-green-100 text-green-600' : 
        assessment.status === 'REJECTED' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
      }`}>
        {assessment.status === 'PENDING' ? 'PENDENTE' : 
         assessment.status === 'ANALYZED' ? 'ANALISADO' :
         assessment.status === 'VALIDATED' ? 'VALIDADO' : 'REPROVADO'}
      </span>
    </div>

    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
      {assessment.riskMatrix ? (() => {
        const riscos = assessment.riskMatrix.riscos_identificados || (Array.isArray(assessment.riskMatrix) ? assessment.riskMatrix : []);
        return riscos.length > 0 ? riscos.slice(0, 3).map((r: any, i: number) => (
          <div key={i} className={`flex-shrink-0 px-3 py-1 rounded-lg border text-xs flex items-center gap-1.5 ${
            (r.nivel_risco || r.level) === 'INTOLERÁVEL' || (r.nivel_risco || r.level) === 'Intolerável' ? 'border-red-100 bg-red-50 text-red-600' : 
            (r.nivel_risco || r.level) === 'SUBSTANCIAL' || (r.nivel_risco || r.level) === 'Substancial' ? 'border-orange-100 bg-orange-50 text-orange-600' : 
            (r.nivel_risco || r.level) === 'MODERADO' || (r.nivel_risco || r.level) === 'Moderado' ? 'border-yellow-100 bg-yellow-50 text-yellow-600' :
            'border-gray-100 bg-gray-50 text-gray-600'
          }`}>
            <AlertTriangle size={12} />
            {r.fator || r.type || r.agent || 'Risco'}
          </div>
        )) : <p className="text-[10px] text-gray-400 italic">Sem riscos identificados</p>;
      })() : (
        <p className="text-[10px] text-gray-400 italic">Coletado / Aguardando Consolidação</p>
      )}
    </div>

    <div className="flex gap-2 pt-4 border-t border-gray-50">
      <button className="flex-1 text-[11px] font-bold py-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors">VALIDAR</button>
      <button className="flex-1 text-[11px] font-bold py-2 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors">EDITAR</button>
      <button className="flex-1 text-[11px] font-bold py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">REPROVAR</button>
    </div>
  </div>
);

export default function Dashboard() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const res = await api.get('/assessments');
      setAssessments(res.data);
    } catch (err) {
      setToast({ show: true, message: 'Erro ao carregar dados do dashboard.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredAssessments = assessments.filter(a => 
    a.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.ghe?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    pending: assessments.filter(a => a.status === 'PENDING' || a.status === 'ANALYZED').length,
    validated: assessments.filter(a => a.status === 'VALIDATED').length,
    rejected: assessments.filter(a => a.status === 'REJECTED').length
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-clinicfy-dark">PGR Inteligente</h1>
            <p className="text-gray-500">Revisão técnica dos levantamentos de risco em tempo real.</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar funcionário..." 
                className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-clinicfy-teal/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50">
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card flex items-center gap-4 border border-gray-50">
            <div className="bg-blue-100 text-blue-600 p-3 rounded-2xl">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{loading ? '...' : stats.pending}</p>
              <p className="text-xs text-gray-400 font-bold uppercase">Aguardando Revisão</p>
            </div>
          </div>
          <div className="card flex items-center gap-4 border border-gray-50">
            <div className="bg-green-100 text-green-600 p-3 rounded-2xl">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{loading ? '...' : stats.validated}</p>
              <p className="text-xs text-gray-400 font-bold uppercase">Validados</p>
            </div>
          </div>
          <div className="card flex items-center gap-4 border border-gray-50">
            <div className="bg-red-100 text-red-600 p-3 rounded-2xl">
              <XCircle size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">{loading ? '...' : stats.rejected}</p>
              <p className="text-xs text-gray-400 font-bold uppercase">Reprovados</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <p className="text-gray-400 animate-pulse">Carregando avaliações...</p>
          </div>
        ) : filteredAssessments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssessments.map(a => <RiskCard key={a.id} assessment={a} />)}
          </div>
        ) : (
          <div className="py-20 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100 text-center">
            <div className="bg-white p-4 rounded-2xl shadow-sm w-fit mx-auto mb-4 text-gray-300">
              <Factory size={32} />
            </div>
            <h3 className="text-gray-500 font-bold">Nenhuma avaliação encontrada</h3>
            <p className="text-gray-400 text-sm">{searchTerm ? 'Tente outros termos de busca.' : 'Aguardando o envio dos primeiros questionários pelos funcionários.'}</p>
          </div>
        )}
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
