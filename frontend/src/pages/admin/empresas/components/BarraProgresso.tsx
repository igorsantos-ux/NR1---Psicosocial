import React from 'react';
import { motion } from 'framer-motion';

interface BarraProgressoProps {
  atual: number;
  total: number;
  showLabel?: boolean;
}

export default function BarraProgresso({ atual, total, showLabel = true }: BarraProgressoProps) {
  const percentual = Math.min(Math.round((atual / total) * 100) || 0, 100);
  
  let cor = 'bg-emerald-400';
  if (percentual < 30) cor = 'bg-rose-400';
  else if (percentual < 70) cor = 'bg-amber-400';

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Respostas: {atual} / {total}</span>
          <span className={`text-[10px] font-bold ${cor.replace('bg-', 'text-')}`}>{percentual}%</span>
        </div>
      )}
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentual}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`${cor} h-full rounded-full shadow-sm`}
        />
      </div>
    </div>
  );
}
