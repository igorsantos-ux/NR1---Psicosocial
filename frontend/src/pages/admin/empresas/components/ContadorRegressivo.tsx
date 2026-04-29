import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';

interface ContadorRegressivoProps {
  dataExpiracao: string | Date;
}

export default function ContadorRegressivo({ dataExpiracao }: ContadorRegressivoProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [colorClass, setColorClass] = useState<string>('text-gray-400');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const expiration = new Date(dataExpiracao);
      const diff = expiration.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('EXPIRADO');
        setColorClass('text-rose-500');
        setIsUrgent(false);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      // Cores baseadas no prazo
      if (days >= 7) {
        setColorClass('text-emerald-500');
      } else if (days >= 1) {
        setColorClass('text-amber-500');
      } else {
        setColorClass('text-rose-500 font-bold');
        setIsUrgent(true);
      }

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else {
        setTimeLeft(`${hours}h ${minutes}m`);
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 60000); // Atualiza a cada minuto

    return () => clearInterval(timer);
  }, [dataExpiracao]);

  return (
    <div className="flex items-center gap-1.5">
      <Clock size={12} className={colorClass} />
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-1">Expira em:</span>
      
      <AnimatePresence mode="wait">
        <motion.span
          key={timeLeft}
          initial={{ opacity: 0, y: -2 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            scale: isUrgent ? [1, 1.05, 1] : 1
          }}
          exit={{ opacity: 0, y: 2 }}
          transition={{ 
            duration: 0.3,
            scale: isUrgent ? { repeat: Infinity, duration: 1.5 } : { duration: 0.3 }
          }}
          className={`text-[11px] font-bold ${colorClass}`}
        >
          {timeLeft}
        </motion.span>
      </AnimatePresence>

      <span className="text-[10px] text-gray-400 ml-1">
        ({new Date(dataExpiracao).toLocaleDateString('pt-BR')} às {new Date(dataExpiracao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})
      </span>
    </div>
  );
}
