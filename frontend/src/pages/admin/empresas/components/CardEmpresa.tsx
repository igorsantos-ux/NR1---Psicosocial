import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Copy, Eye, Zap, FileDown, Clock, Hash, Layers, Users, ExternalLink, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import BarraProgresso from './BarraProgresso';
import ContadorRegressivo from './ContadorRegressivo';

interface CardEmpresaProps {
  empresa: any;
  onCopyLink: (token: string) => void;
  onGeneratePGR: (id: string) => void;
}

export default function CardEmpresa({ empresa, onCopyLink, onGeneratePGR }: CardEmpresaProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-clinicfy-teal/5 transition-all group"
    >
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
        {/* Lado Esquerdo: Info Principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-clinicfy-teal/10 p-2 rounded-xl text-clinicfy-teal group-hover:bg-clinicfy-teal group-hover:text-white transition-colors">
              <Building2 size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-clinicfy-dark truncate leading-tight">
                {empresa.razaoSocial}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase">
                  <Hash size={10} /> {empresa.cnpj}
                </span>
                <span className="w-1 h-1 bg-gray-200 rounded-full" />
                <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase">
                  <Layers size={10} /> GR {empresa.grauRiscoNr4}
                </span>
                <span className="w-1 h-1 bg-gray-200 rounded-full" />
                <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase">
                  <Users size={10} /> {empresa.totalFuncionarios} funcionários
                </span>
              </div>
            </div>
            <div className="ml-auto">
              <StatusBadge status={empresa.statusGeral} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <BarraProgresso atual={empresa.totalRespostas} total={empresa.totalFuncionarios} />
            <ContadorRegressivo dataExpiracao={empresa.dataExpiracaoLink} />
          </div>
        </div>

        {/* Lado Direito: Ações */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto md:border-l border-gray-100 md:pl-6">
          {empresa.statusGeral === 'ATIVA' && (
            <button
              onClick={() => onCopyLink(empresa.tokenColeta)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 text-gray-600 font-bold text-xs hover:bg-clinicfy-teal hover:text-white transition-all active:scale-95"
              title="Copiar Link de Coleta"
            >
              <Copy size={16} /> Copiar Link
            </button>
          )}

          <Link
            to={`/admin/empresas/${empresa.id}`}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 text-gray-600 font-bold text-xs hover:bg-gray-100 transition-all active:scale-95"
          >
            <Eye size={16} /> Ver Detalhes
          </Link>

          {(empresa.statusGeral === 'EXPIRADA' || (empresa.statusGeral === 'ATIVA' && empresa.totalRespostas > 0)) && (
            <button
              onClick={() => onGeneratePGR(empresa.id)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-clinicfy-pink text-white font-bold text-xs shadow-lg shadow-clinicfy-pink/20 hover:scale-105 transition-all active:scale-95"
            >
              <Zap size={16} /> Gerar PGR Agora
            </button>
          )}

          {empresa.statusGeral === 'AGUARDANDO_VALIDACAO' && (
            <Link
              to={`/pgr/${empresa.pgrId}/validar`}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-clinicfy-teal text-white font-bold text-xs shadow-lg shadow-clinicfy-teal/20 hover:scale-105 transition-all active:scale-95"
            >
              <Zap size={16} /> Validar PGR
            </Link>
          )}

          {empresa.statusGeral === 'FINALIZADO' && (
            <div className="flex gap-2 w-full md:w-auto">
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all active:scale-95">
                <FileDown size={16} /> PDF
              </button>
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 hover:scale-105 transition-all active:scale-95">
                <FileDown size={16} /> DOCX
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
