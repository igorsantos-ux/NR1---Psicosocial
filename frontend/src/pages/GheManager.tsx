import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Users, Building2, Shield, Plus, MoreVertical } from 'lucide-react';
import api from '../api/api';
import Toast from '../components/Toast';

export default function GheManager() {
  const [ghes, setGhes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchGhes();
  }, []);

  const fetchGhes = async () => {
    try {
      const res = await api.get('/ghes');
      setGhes(res.data);
    } catch (err) {
      setToast({ show: true, message: 'Erro ao carregar GHEs.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-clinicfy-dark">GHEs e Equipes</h1>
            <p className="text-gray-500 text-sm">Gerencie os Grupos de Exposição Homogênea de todas as empresas.</p>
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Novo GHE
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p className="col-span-full py-10 text-center text-gray-400 italic">Carregando grupos...</p>
          ) : ghes.length === 0 ? (
            <p className="col-span-full py-10 text-center text-gray-400 italic">Nenhum GHE cadastrado.</p>
          ) : (
            ghes.map((ghe) => (
              <div key={ghe.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-clinicfy-teal/10 p-2 rounded-xl text-clinicfy-teal">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-clinicfy-dark leading-none">{ghe.name}</h3>
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest leading-none">GHE Ativo</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 bg-gray-50 px-3 py-2 rounded-xl">
                  <Building2 size={16} className="text-gray-400" />
                  <span className="truncate">{ghe.company?.name}</span>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Users size={14} />
                    <span>Cadastro em {new Date(ghe.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <button className="text-gray-300 hover:text-gray-600 transition-colors">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
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
