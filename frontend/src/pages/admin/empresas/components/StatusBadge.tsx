import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const configs: Record<string, { label: string, classes: string }> = {
    'ATIVA': { label: 'ATIVO', classes: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    'EXPIRADA': { label: 'EXPIRADO', classes: 'bg-amber-50 text-amber-600 border-amber-100' },
    'GERANDO': { label: 'GERANDO', classes: 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse' },
    'AGUARDANDO_VALIDACAO': { label: 'AGUARDANDO VALIDAÇÃO', classes: 'bg-rose-50 text-rose-600 border-rose-100' },
    'FINALIZADO': { label: 'FINALIZADO', classes: 'bg-slate-50 text-slate-500 border-slate-200' },
    'ENCERRADA_MANUALMENTE': { label: 'ENCERRADA', classes: 'bg-slate-100 text-slate-400 border-slate-200' }
  };

  const config = configs[status] || { label: status, classes: 'bg-gray-50 text-gray-400 border-gray-100' };

  return (
    <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${config.classes}`}>
      {config.label}
    </span>
  );
}
