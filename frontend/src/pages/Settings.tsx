import React from 'react';
import Layout from '../components/Layout';
import { Settings as SettingsIcon, ShieldCheck, Mail, Key, Database, Zap } from 'lucide-react';

export default function Settings() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-clinicfy-dark">Configurações</h1>
          <p className="text-gray-500 text-sm">Gerencie as preferências e chaves de integração do sistema.</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-gray-50/50">
              <h2 className="font-bold text-clinicfy-dark flex items-center gap-2">
                <ShieldCheck size={18} className="text-clinicfy-teal" /> Perfil do Engenheiro
              </h2>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Nome Completo</label>
                  <div className="relative">
                    <input disabled type="text" value="Denis Antônio" className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">E-mail de Acesso</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input disabled type="text" value="eng.denis@pgrsmart.com" className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="bg-clinicfy-teal/10 p-3 rounded-2xl w-fit mb-4 text-clinicfy-teal">
                <Zap size={24} />
              </div>
              <h3 className="font-bold text-lg mb-2">Motor de IA (Gemini)</h3>
              <p className="text-gray-500 text-xs mb-6">A chave da API está configurada no servidor. O status atual é <span className="text-green-600 font-bold">ATIVO</span>.</p>
              <button disabled className="w-full py-3 rounded-xl border border-gray-200 text-gray-400 font-bold text-xs uppercase tracking-widest cursor-not-allowed">
                Alterar Chave
              </button>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="bg-clinicfy-pink/10 p-3 rounded-2xl w-fit mb-4 text-clinicfy-pink">
                <Database size={24} />
              </div>
              <h3 className="font-bold text-lg mb-2">Banco de Dados</h3>
              <p className="text-gray-500 text-xs mb-6">Utilizando SQLite para persistência rápida. Volume persistente mapeado no Easypanel.</p>
              <button disabled className="w-full py-3 rounded-xl border border-gray-200 text-gray-400 font-bold text-xs uppercase tracking-widest cursor-not-allowed">
                Exportar Backup
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
