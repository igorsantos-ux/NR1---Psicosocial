import React, { useState } from 'react';
import Layout from '../components/Layout';
import { Building2, FileText, Hash, Layers, Plus, Trash2, Link as LinkIcon, Copy, CheckCircle2 } from 'lucide-react';
import api from '../api/api';
import Toast from '../components/Toast';

export default function RegisterCompany() {
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    cnae: '',
    riskLevel: '1',
  });
  const [ghes, setGhes] = useState<string[]>(['Produção', 'Administrativo']);
  const [newGhe, setNewGhe] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  const handleAddGhe = () => {
    if (newGhe.trim() && !ghes.includes(newGhe.trim())) {
      setGhes([...ghes, newGhe.trim()]);
      setNewGhe('');
    }
  };

  const removeGhe = (index: number) => {
    setGhes(ghes.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/companies', {
        ...formData,
        ghes
      });
      
      setGeneratedLink(url);
      setToast({ show: true, message: 'Empresa cadastrada com sucesso!', type: 'success' });
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.error || 'Erro ao cadastrar empresa. Verifique os dados.';
      setToast({ show: true, message: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-clinicfy-dark">Cadastrar Nova Empresa</h1>
          <p className="text-gray-500 text-sm">Configure os dados da empresa e gere o link para coleta de dados.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Nome da Empresa</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      required
                      type="text"
                      placeholder="Ex: Maravilha Linguiças"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-clinicfy-teal/20 transition-all"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">CNPJ</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      required
                      type="text"
                      placeholder="00.000.000/0000-00"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-clinicfy-teal/20 transition-all"
                      value={formData.cnpj}
                      onChange={e => setFormData({ ...formData, cnpj: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">CNAE (Opcional)</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="10.13-9-01"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-clinicfy-teal/20 transition-all"
                      value={formData.cnae}
                      onChange={e => setFormData({ ...formData, cnae: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Grau de Risco (NR4)</label>
                  <div className="relative">
                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <select
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-clinicfy-teal/20 appearance-none transition-all"
                      value={formData.riskLevel}
                      onChange={e => setFormData({ ...formData, riskLevel: e.target.value })}
                    >
                      <option value="1">Grau 1</option>
                      <option value="2">Grau 2</option>
                      <option value="3">Grau 3</option>
                      <option value="4">Grau 4</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-50">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Setores / GHEs</label>
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase">{ghes.length} adicionados</span>
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Adicionar nome do GHE..."
                    className="flex-1 px-4 py-2 text-sm rounded-xl border border-gray-100 bg-gray-50 focus:bg-white outline-none"
                    value={newGhe}
                    onChange={e => setNewGhe(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddGhe())}
                  />
                  <button
                    type="button"
                    onClick={handleAddGhe}
                    className="p-2 rounded-xl bg-clinicfy-teal text-white hover:opacity-90 transition-opacity"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {ghes.map((ghe, index) => (
                    <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-clinicfy-teal/5 text-clinicfy-teal rounded-lg border border-clinicfy-teal/10 text-xs font-semibold group">
                      {ghe}
                      <button 
                        type="button" 
                        onClick={() => removeGhe(index)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {ghes.length === 0 && (
                    <p className="text-xs text-gray-400 italic py-2">Adicione ao menos um GHE para continuar.</p>
                  )}
                </div>
              </div>

              <button
                disabled={loading || ghes.length === 0}
                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                  loading || ghes.length === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-clinicfy-pink text-white shadow-lg shadow-clinicfy-pink/20 hover:scale-[1.01] active:scale-[0.99]'
                }`}
              >
                {loading ? 'Cadastrando...' : 'CADASTRAR EMPRESA E GERAR LINK'}
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div className={`bg-gradient-to-br from-clinicfy-teal to-clinicfy-dark p-6 rounded-3xl text-white shadow-xl transition-all duration-500 ${generatedLink ? 'opacity-100 translate-y-0' : 'opacity-50 blur-[2px]'}`}>
              <div className="bg-white/20 p-2 rounded-xl w-fit mb-4">
                <LinkIcon size={24} />
              </div>
              <h3 className="font-bold text-lg mb-2">Link Gerado</h3>
              <p className="text-white/70 text-xs mb-6 leading-relaxed">
                Este é o link público que os funcionários utilizarão para responder ao questionário.
              </p>

              {generatedLink ? (
                <div className="space-y-4">
                  <div className="bg-white/10 rounded-xl p-3 break-all text-[11px] font-mono border border-white/20">
                    {generatedLink}
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="w-full py-3 rounded-xl bg-white text-clinicfy-dark font-bold text-xs flex items-center justify-center gap-2 hover:bg-clinicfy-light transition-colors"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 size={16} className="text-green-500" />
                        COPIADO!
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        COPIAR LINK
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="py-8 text-center border-2 border-dashed border-white/20 rounded-2xl">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Aguardando Cadastro</p>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">Instruções</h4>
              <ul className="space-y-3">
                <li className="flex gap-3 text-xs text-gray-600">
                  <div className="w-5 h-5 rounded-full bg-clinicfy-teal/10 text-clinicfy-teal flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <span>Preencha os dados básicos da empresa para identificação nos laudos.</span>
                </li>
                <li className="flex gap-3 text-xs text-gray-600">
                  <div className="w-5 h-5 rounded-full bg-clinicfy-teal/10 text-clinicfy-teal flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <span>Liste todos os setores ou GHEs que participarão da coleta.</span>
                </li>
                <li className="flex gap-3 text-xs text-gray-600">
                  <div className="w-5 h-5 rounded-full bg-clinicfy-teal/10 text-clinicfy-teal flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <span>Envie o link gerado via WhatsApp ou e-mail para a equipe.</span>
                </li>
              </ul>
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
