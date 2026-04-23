import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Settings as SettingsIcon, ShieldCheck, Mail, Key, Database, Zap, Save, CheckCircle2, Building2 } from 'lucide-react';
import api from '../api/api';
import Toast from '../components/Toast';

export default function Settings() {
  const [settings, setSettings] = useState({
    engineerName: '',
    engineerCrea: '',
    engineerContact: '',
    companyElaboradora: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings/engineer');
      setSettings({
        engineerName: res.data.engineerName || '',
        engineerCrea: res.data.engineerCrea || '',
        engineerContact: res.data.engineerContact || '',
        companyElaboradora: res.data.companyElaboradora || '',
      });
    } catch (err) {
      // Se não existe, mantém os defaults
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings/engineer', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setToast({ show: true, message: 'Configurações salvas com sucesso!', type: 'success' });
    } catch (err) {
      setToast({ show: true, message: 'Erro ao salvar configurações.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-clinicfy-dark">Configurações</h1>
          <p className="text-gray-500 text-sm">Gerencie os dados do engenheiro responsável e integrações do sistema.</p>
        </div>

        <div className="space-y-6">
          {/* Perfil do Engenheiro */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
              <h2 className="font-bold text-clinicfy-dark flex items-center gap-2">
                <ShieldCheck size={18} className="text-clinicfy-teal" /> Perfil do Engenheiro Responsável
              </h2>
              <button 
                onClick={handleSave}
                disabled={saving || loading}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  saved 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-clinicfy-teal text-white hover:opacity-90 shadow-md shadow-clinicfy-teal/20'
                } disabled:opacity-50`}
              >
                {saved ? (
                  <><CheckCircle2 size={14} /> Salvo!</>
                ) : saving ? (
                  <>Salvando...</>
                ) : (
                  <><Save size={14} /> Salvar</>
                )}
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Nome Completo</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      value={settings.engineerName}
                      onChange={e => setSettings({ ...settings, engineerName: e.target.value })}
                      placeholder="Nome do engenheiro responsável"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-clinicfy-teal/20 transition-all" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">CREA</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      value={settings.engineerCrea}
                      onChange={e => setSettings({ ...settings, engineerCrea: e.target.value })}
                      placeholder="Ex: CREA-SC 123456"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-clinicfy-teal/20 transition-all" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Contato / E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      value={settings.engineerContact}
                      onChange={e => setSettings({ ...settings, engineerContact: e.target.value })}
                      placeholder="eng.denis@pgrsmart.com"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-clinicfy-teal/20 transition-all" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Empresa Elaboradora</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      value={settings.companyElaboradora}
                      onChange={e => setSettings({ ...settings, companyElaboradora: e.target.value })}
                      placeholder="Nome da empresa de SST"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-clinicfy-teal/20 transition-all" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cards de Integração */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="bg-clinicfy-teal/10 p-3 rounded-2xl w-fit mb-4 text-clinicfy-teal">
                <Zap size={24} />
              </div>
              <h3 className="font-bold text-lg mb-2">Motor de IA (Gemini)</h3>
              <p className="text-gray-500 text-xs mb-4 leading-relaxed">
                A chave da API está configurada no servidor. O motor utiliza o modelo <span className="font-mono text-clinicfy-teal">gemini-2.0-flash</span> com prompts especializados em NR-01, Portaria MTE 1.419/2024 e matriz AIHA.
              </p>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-bold text-green-600">ATIVO</span>
              </div>
              <button disabled className="w-full py-3 rounded-xl border border-gray-200 text-gray-400 font-bold text-xs uppercase tracking-widest cursor-not-allowed">
                Alterar Chave
              </button>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="bg-clinicfy-pink/10 p-3 rounded-2xl w-fit mb-4 text-clinicfy-pink">
                <Database size={24} />
              </div>
              <h3 className="font-bold text-lg mb-2">Banco de Dados</h3>
              <p className="text-gray-500 text-xs mb-4 leading-relaxed">
                Utilizando SQLite para persistência rápida. Suporta Company, GHE, Assessment, ActionPlan, PgrReport e EngineerSettings.
              </p>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-bold text-green-600">OPERACIONAL</span>
              </div>
              <button disabled className="w-full py-3 rounded-xl border border-gray-200 text-gray-400 font-bold text-xs uppercase tracking-widest cursor-not-allowed">
                Exportar Backup
              </button>
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
