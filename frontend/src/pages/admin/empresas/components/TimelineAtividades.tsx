import React from 'react';
import { motion } from 'framer-motion';
import { User, ClipboardCheck, Zap, CheckCircle2, History } from 'lucide-react';

interface Activity {
  id: string;
  criadaEm: string;
  ghe: { nome: string };
  cargo?: string;
}

interface TimelineAtividadesProps {
  atividades: Activity[];
}

export default function TimelineAtividades({ atividades }: TimelineAtividadesProps) {
  if (atividades.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
          <History size={24} />
        </div>
        <p className="text-xs text-gray-400 italic">Nenhuma atividade recente registrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
      {atividades.map((act, i) => (
        <motion.div
          key={act.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex gap-4 relative"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 shadow-sm ${
            i === 0 ? 'bg-clinicfy-teal text-white' : 'bg-white border border-gray-100 text-gray-400'
          }`}>
            <User size={18} />
          </div>
          <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 flex-1">
            <div className="flex justify-between items-start mb-1">
              <p className="text-xs font-bold text-clinicfy-dark">Resposta recebida</p>
              <span className="text-[10px] text-gray-400 font-medium">
                {new Date(act.criadaEm).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Um funcionário do GHE <b className="text-clinicfy-teal">{act.ghe.nome}</b> ({act.cargo || 'Cargo não informado'}) finalizou a avaliação.
            </p>
            <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase tracking-wider">
              {new Date(act.criadaEm).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
