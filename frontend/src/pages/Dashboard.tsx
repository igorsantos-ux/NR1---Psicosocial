import React from 'react';
import Layout from '../components/Layout';
import { Search, Filter, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';

const RiskCard = ({ assessment }: any) => (
  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="font-bold text-clinicfy-dark">{assessment.employeeName}</h3>
        <p className="text-xs text-gray-400 font-medium">{assessment.ghe}</p>
      </div>
      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
        assessment.status === 'ANALYZED' ? 'bg-blue-100 text-blue-600' : 
        assessment.status === 'VALIDATED' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
      }`}>
        {assessment.status}
      </span>
    </div>

    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
      {assessment.risks?.map((r: any, i: number) => (
        <div key={i} className={`flex-shrink-0 px-3 py-1 rounded-lg border text-xs flex items-center gap-1.5 ${
          r.level === 'Intolerável' ? 'border-red-100 bg-red-50 text-red-600' : 'border-gray-100 bg-gray-50 text-gray-600'
        }`}>
          <AlertTriangle size={12} />
          {r.agent}
        </div>
      ))}
    </div>

    <div className="flex gap-2 pt-4 border-t border-gray-50">
      <button className="flex-1 text-[11px] font-bold py-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors">VALIDAR</button>
      <button className="flex-1 text-[11px] font-bold py-2 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors">EDITAR</button>
      <button className="flex-1 text-[11px] font-bold py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">REPROVAR</button>
    </div>
  </div>
);

export default function Dashboard() {
  // Mock de dados para demonstração visual
  const assessments = [
    { 
      id: '1', employeeName: 'João Ferreira', ghe: 'Produção - Área Fria', status: 'ANALYZED',
      risks: [{ agent: 'Ruído > 85dB', level: 'Intolerável' }, { agent: 'Frio Intenso', level: 'Moderado' }]
    },
    { 
      id: '2', employeeName: 'Maria Antônia', ghe: 'Logística', status: 'ANALYZED',
      risks: [{ agent: 'Stress / Carga', level: 'Substancial' }]
    },
    { 
      id: '3', employeeName: 'Carlos Eduardo', ghe: 'Administrativo', status: 'VALIDATED',
      risks: [{ agent: 'Postura Sentada', level: 'Trivial' }]
    },
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-clinicfy-dark">PGR Inteligente</h1>
            <p className="text-gray-500">Revisão técnica dos levantamentos de risco.</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Buscar funcionário..." className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-clinicfy-teal/20" />
            </div>
            <button className="p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50">
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card flex items-center gap-4">
            <div className="bg-blue-100 text-blue-600 p-3 rounded-2xl">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">12</p>
              <p className="text-xs text-gray-400 font-bold uppercase">Aguardando Revisão</p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="bg-green-100 text-green-600 p-3 rounded-2xl">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">45</p>
              <p className="text-xs text-gray-400 font-bold uppercase">Validados</p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="bg-red-100 text-red-600 p-3 rounded-2xl">
              <XCircle size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold">3</p>
              <p className="text-xs text-gray-400 font-bold uppercase">Reprovados</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessments.map(a => <RiskCard key={a.id} assessment={a} />)}
        </div>
      </div>
    </Layout>
  );
}
