import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Layout from '../components/Layout';
import { Building2, FileText, Hash, Layers, Plus, Trash2, Link as LinkIcon, Copy, CheckCircle2, MapPin, Phone, Users, Clock, Briefcase } from 'lucide-react';
import api from '../api/api';
import Toast from '../components/Toast';

interface GHE {
  id: string;
  nome: string;
  codigo?: string;
  cargos?: string[];
}

export default function RegisterCompany() {
  const [formData, setFormData] = useState({
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    cnae: '',
    cnaeDescricao: '',
    grauRiscoNr4: 1,
    endereco: '',
    municipio: '',
    estado: '',
    cep: '',
    telefone: '',
    totalFuncionarios: 0,
    horarioTrabalho: '',
    dataExpiracaoLink: '',
    empresaElaboradora: 'PGR Smart Engenharia',
    engenheiroId: 'fb098935-d227-4638-89c0-63ceba51532f' // ID fixo para desenvolvimento/Denis
  });

  const [ghes, setGhes] = useState<GHE[]>([]);
  const [newGheNome, setNewGheNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  const handleAddGhe = () => {
    const nome = newGheNome.trim();
    if (!nome) return;

    // Evita duplicatas
    if (ghes.some(g => g.nome.toLowerCase() === nome.toLowerCase())) {
      setToast({ show: true, message: 'Este GHE já foi adicionado.', type: 'error' });
      return;
    }

    const novoGhe: GHE = {
      id: uuidv4(),
      nome,
      codigo: `GHE ${String(ghes.length + 1).padStart(2, '0')}`,
      cargos: []
    };

    setGhes(prev => [...prev, novoGhe]);
    setNewGheNome('');
  };

  const removeGhe = (id: string) => {
    setGhes(prev => prev.filter(g => g.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddGhe();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // O backend espera o formato { nome, codigo, cargos } para os GHEs
      const ghesPayload = ghes.map(g => ({
        nome: g.nome,
        codigo: g.codigo,
        cargos: g.cargos
      }));

      // Formata a data de expiração para ISO, garantindo que seja válida
      let dataExpiracao = null;
      if (formData.dataExpiracaoLink) {
        const d = new Date(formData.dataExpiracaoLink);
        if (!isNaN(d.getTime())) {
          dataExpiracao = d.toISOString();
        }
      }

      const response = await api.post('/empresas', {
        ...formData,
        totalFuncionarios: Number(formData.totalFuncionarios),
        grauRiscoNr4: Number(formData.grauRiscoNr4),
        dataExpiracaoLink: dataExpiracao,
        ghes: ghesPayload
      });

      const token = response.data.empresa.tokenColeta;
      const url = `${window.location.origin}/q/${token}`;
      setGeneratedLink(url);
      setToast({ show: true, message: 'Empresa cadastrada com sucesso!', type: 'success' });
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.message || 'Erro ao cadastrar empresa. Verifique os dados.';
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

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Olá! Por favor, responda ao questionário psicossocial da empresa ${formData.nomeFantasia || formData.razaoSocial} através do link: ${generatedLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const ESTADOS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-clinicfy-dark">Cadastrar Nova Empresa</h1>
          <p className="text-gray-500 text-sm">Configure os dados completos da empresa para geração do PGR.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Bloco 1 - Dados Básicos */}
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Building2 size={14} className="text-clinicfy-teal" /> Dados Cadastrais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Razão Social</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        required
                        type="text"
                        placeholder="Ex: Maravilha Linguiças Ltda."
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-clinicfy-teal/20 transition-all"
                        value={formData.razaoSocial}
                        onChange={e => setFormData({ ...formData, razaoSocial: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Nome Fantasia</label>
                    <input
                      type="text"
                      placeholder="Ex: Maravilha Linguiças"
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-clinicfy-teal/20 transition-all"
                      value={formData.nomeFantasia}
                      onChange={e => setFormData({ ...formData, nomeFantasia: e.target.value })}
                    />
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
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">CNAE</label>
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
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Descrição CNAE</label>
                    <input
                      type="text"
                      placeholder="Ex: Fabricação de produtos de carne"
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-clinicfy-teal/20 transition-all"
                      value={formData.cnaeDescricao}
                      onChange={e => setFormData({ ...formData, cnaeDescricao: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Grau de Risco (NR4)</label>
                    <div className="relative">
                      <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <select
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-clinicfy-teal/20 appearance-none transition-all"
                        value={formData.grauRiscoNr4}
                        onChange={e => setFormData({ ...formData, grauRiscoNr4: Number(e.target.value) })}
                      >
                        <option value="1">Grau 1</option>
                        <option value="2">Grau 2</option>
                        <option value="3">Grau 3</option>
                        <option value="4">Grau 4</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Nº de Funcionários</label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="number"
                        placeholder="Ex: 45"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-clinicfy-teal/20 transition-all"
                        value={formData.totalFuncionarios}
                        onChange={e => setFormData({ ...formData, totalFuncionarios: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1 text-clinicfy-teal font-bold">Expiração do Link</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-clinicfy-teal" size={18} />
                      <input
                        required
                        type="datetime-local"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-clinicfy-teal/20 bg-clinicfy-teal/5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-clinicfy-teal/20 transition-all"
                        value={formData.dataExpiracaoLink}
                        onChange={e => setFormData({ ...formData, dataExpiracaoLink: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloco 2 - Endereço e Contato */}
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <MapPin size={14} className="text-clinicfy-teal" /> Endereço e Contato
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Endereço Completo</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        placeholder="Rua, número, bairro"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-clinicfy-teal/20 transition-all"
                        value={formData.endereco}
                        onChange={e => setFormData({ ...formData, endereco: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Município</label>
                    <input
                      type="text"
                      placeholder="Ex: Chapecó"
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-clinicfy-teal/20 transition-all"
                      value={formData.municipio}
                      onChange={e => setFormData({ ...formData, municipio: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Estado</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-clinicfy-teal/20 appearance-none transition-all"
                      value={formData.estado}
                      onChange={e => setFormData({ ...formData, estado: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">CEP</label>
                    <input
                      type="text"
                      placeholder="00000-000"
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-clinicfy-teal/20 transition-all"
                      value={formData.cep}
                      onChange={e => setFormData({ ...formData, cep: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Telefone</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        placeholder="(49) 3322-1100"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-clinicfy-teal/20 transition-all"
                        value={formData.telefone}
                        onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Horário de Trabalho</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        placeholder="Ex: 07:00 às 17:00 (segunda a sexta)"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-clinicfy-teal/20 transition-all"
                        value={formData.horarioTrabalho}
                        onChange={e => setFormData({ ...formData, horarioTrabalho: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Empresa Elaboradora</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-clinicfy-teal/20 transition-all"
                      value={formData.empresaElaboradora}
                      onChange={e => setFormData({ ...formData, empresaElaboradora: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Bloco 3 - GHEs */}
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Layers size={14} className="text-clinicfy-teal" /> Setores / GHEs
                  </h3>
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase">{ghes.length} adicionados</span>
                </div>

                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Adicionar nome do GHE..."
                    className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-clinicfy-teal transition-all outline-none text-sm"
                    value={newGheNome}
                    onChange={e => setNewGheNome(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <button
                    type="button"
                    onClick={handleAddGhe}
                    disabled={!newGheNome.trim()}
                    className="w-12 h-12 rounded-xl bg-clinicfy-teal text-white hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center shadow-lg shadow-clinicfy-teal/20"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div className="space-y-2">
                  {ghes.map((ghe) => (
                    <div key={ghe.id} className="flex items-center justify-between px-4 py-3 bg-clinicfy-teal/5 text-clinicfy-teal rounded-2xl border border-clinicfy-teal/10 group animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-clinicfy-teal/10 rounded-lg flex items-center justify-center text-[10px]">
                          <Briefcase size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-clinicfy-dark">{ghe.nome}</p>
                          <p className="text-[9px] text-gray-400 uppercase tracking-widest">{ghe.codigo}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeGhe(ghe.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {ghes.length === 0 && (
                    <p className="text-xs text-gray-400 italic py-4 text-center border-2 border-dashed border-gray-50 rounded-2xl">
                      Adicione ao menos um GHE para continuar.
                    </p>
                  )}
                </div>
              </div>

              <button
                disabled={loading || ghes.length === 0}
                className={`w-full py-5 rounded-3xl font-bold flex items-center justify-center gap-2 transition-all ${loading || ghes.length === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-clinicfy-pink text-white shadow-xl shadow-clinicfy-pink/20 hover:scale-[1.01] active:scale-[0.99]'
                  }`}
              >
                {loading ? 'Processando...' : 'CADASTRAR EMPRESA E GERAR LINK'}
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div className={`bg-gradient-to-br from-clinicfy-teal to-clinicfy-dark p-8 rounded-[40px] text-white shadow-2xl transition-all duration-500 ${generatedLink ? 'opacity-100 translate-y-0' : 'opacity-50 blur-[2px]'}`}>
              <div className="bg-white/20 p-3 rounded-2xl w-fit mb-6">
                <LinkIcon size={28} />
              </div>
              <h3 className="font-bold text-xl mb-3">Link Gerado</h3>
              <p className="text-white/70 text-sm mb-8 leading-relaxed">
                Este é o link público que os funcionários utilizarão para responder ao questionário psicossocial de forma anônima.
              </p>

              {generatedLink ? (
                <div className="space-y-4">
                  <div className="bg-white/10 rounded-2xl p-4 break-all text-[11px] font-mono border border-white/20 leading-relaxed">
                    {generatedLink}
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="w-full py-4 rounded-2xl bg-white text-clinicfy-dark font-bold text-sm flex items-center justify-center gap-2 hover:bg-clinicfy-light transition-all active:scale-95"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 size={18} className="text-green-500" />
                        COPIADO COM SUCESSO!
                      </>
                    ) : (
                      <>
                        <Copy size={18} />
                        COPIAR LINK
                      </>
                    )}
                  </button>
                  <button
                    onClick={shareWhatsApp}
                    className="w-full py-4 rounded-2xl bg-[#25D366] text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95"
                  >
                    <Phone size={18} />
                    COMPARTILHAR WHATSAPP
                  </button>
                </div>
              ) : (
                <div className="py-12 text-center border-2 border-dashed border-white/20 rounded-3xl">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Aguardando Cadastro</p>
                </div>
              )}
            </div>

            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-6 tracking-widest">Próximos Passos</h4>
              <ul className="space-y-4">
                <li className="flex gap-4 text-xs text-gray-600 leading-relaxed">
                  <div className="w-6 h-6 rounded-xl bg-clinicfy-teal/10 text-clinicfy-teal flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <span>Envie o link para todos os funcionários via WhatsApp ou e-mail.</span>
                </li>
                <li className="flex gap-4 text-xs text-gray-600 leading-relaxed">
                  <div className="w-6 h-6 rounded-xl bg-clinicfy-teal/10 text-clinicfy-teal flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <span>Acompanhe o status das respostas em tempo real no Dashboard.</span>
                </li>
                <li className="flex gap-4 text-xs text-gray-600 leading-relaxed">
                  <div className="w-6 h-6 rounded-xl bg-clinicfy-teal/10 text-clinicfy-teal flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <span>Após o prazo de expiração, o PGR será gerado automaticamente pela IA.</span>
                </li>
                <li className="flex gap-4 text-xs text-gray-600 leading-relaxed">
                  <div className="w-6 h-6 rounded-xl bg-clinicfy-teal/10 text-clinicfy-teal flex items-center justify-center font-bold flex-shrink-0">4</div>
                  <span>Acesse o "Painel de Revisão" para validar e baixar o PDF final.</span>
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
