import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

interface MetricasCardsProps {
  metricas: {
    ativas: number;
    expiradas: number;
    finalizadas: number;
  };
}

export default function MetricasCards({ metricas }: MetricasCardsProps) {
  const cards = [
    { 
      label: 'ATIVAS', 
      value: metricas.ativas, 
      icon: Clock, 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-50',
      border: 'border-emerald-100'
    },
    { 
      label: 'EXPIRADAS', 
      value: metricas.expiradas, 
      icon: ShieldCheck, 
      color: 'text-amber-500', 
      bg: 'bg-amber-50',
      border: 'border-amber-100'
    },
    { 
      label: 'FINALIZADAS', 
      value: metricas.finalizadas, 
      icon: CheckCircle2, 
      color: 'text-slate-500', 
      bg: 'bg-slate-50',
      border: 'border-slate-200'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className={`bg-white rounded-3xl p-6 border ${card.border} shadow-sm flex items-center gap-5`}
        >
          <div className={`${card.bg} ${card.color} w-14 h-14 rounded-2xl flex items-center justify-center`}>
            <card.icon size={28} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{card.label}</p>
            <p className="text-3xl font-bold text-clinicfy-dark leading-none">{card.value}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
