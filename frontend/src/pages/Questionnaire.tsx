import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import Toast from '../components/Toast';
import { ClipboardCheck, ArrowRight, CheckCircle2, Factory } from 'lucide-react';

const QUESTIONS = [
  { id: 'q1', text: 'Você sente que sua carga de trabalho é excessiva para o tempo disponível?' },
  { id: 'q2', text: 'Você tem autonomia para decidir como realizar suas tarefas?' },
  { id: 'q3', text: 'As relações interpessoais no ambiente de trabalho são saudáveis?' },
  { id: 'q4', text: 'Você sofre pressão excessiva para bater metas ou prazos?' },
  { id: 'q5', text: 'O ambiente físico (ruído, temperatura, iluminação) é adequado?' },
  { id: 'q6', text: 'Você sente suporte da sua liderança imediata?' },
  { id: 'q7', text: 'Há clareza sobre suas responsabilidades e funções?' },
];

export default function Questionnaire() {
  const { slug } = useParams();
  const [company, setCompany] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    gheId: '',
    answers: {} as any,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await api.get(`/companies/${slug}`);
        setCompany(res.data);
      } catch (err) {
        console.error('Erro ao carregar empresa');
      }
    };
    fetchCompany();
  }, [slug]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await api.post('/assessments', {
        gheId: formData.gheId,
        answers: formData.answers,
      });
      setResult(res.data);
      setStep(4);
    } catch (err) {
      setToast({ show: true, message: 'Não foi possível enviar suas respostas agora.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!company) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="min-h-screen bg-clinicfy-light p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-2xl flex items-center gap-3 mb-8">
        <div className="bg-clinicfy-teal p-2 rounded-xl text-white">
          <Factory size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-clinicfy-dark">{company.name}</h1>
          <p className="text-sm text-gray-500">Gestão de Riscos Ocupacionais (NR 01)</p>
        </div>
      </header>

      <main className="w-full max-w-2xl bg-white rounded-3xl p-6 md:p-10 shadow-xl shadow-clinicfy-teal/5 relative overflow-hidden">
        {/* Progress Bar */}
        <div className="flex gap-1 mb-8">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`h-2 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-clinicfy-teal' : 'bg-gray-100'}`} 
            />
          ))}
        </div>

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl font-bold mb-2">Identificação</h2>
            <p className="text-gray-500 mb-6">Por favor, selecione seu grupo de trabalho para iniciar.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 ml-1">Seu Setor / GHE</label>
                <select 
                  className="input-field appearance-none"
                  value={formData.gheId}
                  onChange={(e) => setFormData({ ...formData, gheId: e.target.value })}
                >
                  <option value="">Selecione um grupo...</option>
                  {company.ghes.map((g: any) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <button 
                disabled={!formData.gheId}
                onClick={() => setStep(2)}
                className="btn-secondary w-full mt-4 flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                Próximo <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl font-bold mb-2">Avaliação Psicossocial</h2>
            <p className="text-gray-500 mb-6">Responda de 1 a 5, onde 1 é 'Muito Baixo/Nunca' e 5 é 'Muito Alto/Sempre'.</p>
            
            <div className="space-y-8">
              {QUESTIONS.map((q) => (
                <div key={q.id}>
                  <p className="font-medium mb-3">{q.text}</p>
                  <div className="flex justify-between gap-2">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        onClick={() => setFormData({ 
                          ...formData, 
                          answers: { ...formData.answers, [q.id]: val } 
                        })}
                        className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center font-bold transition-all ${
                          formData.answers[q.id] === val 
                            ? 'bg-clinicfy-pink border-clinicfy-pink text-white scale-110' 
                            : 'border-gray-100 text-gray-400 hover:border-clinicfy-pink/30'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep(1)} className="flex-1 p-3 rounded-xl border border-gray-200 font-medium text-gray-500">Voltar</button>
                <button 
                  disabled={Object.keys(formData.answers).length < QUESTIONS.length}
                  onClick={handleSubmit} 
                  className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Processando IA...' : 'Finalizar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 4 && result && (
          <div className="animate-in zoom-in duration-500 text-center py-10">
            <div className="mx-auto bg-green-100 text-green-600 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Obrigado!</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Sua avaliação foi concluída com sucesso. Nossa inteligência artificial já processou os dados e encaminhou para a revisão do Eng. Denis Antônio.
            </p>
            <div className="bg-gray-50 p-6 rounded-2xl text-left border border-dashed border-gray-200">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Resultado Parcial da IA</h3>
              <div className="space-y-3">
                {result.riskMatrix?.map((r: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                    <span className="font-medium text-sm">{r.agent}</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${
                      r.level === 'Intolerável' ? 'bg-red-100 text-red-600' : 
                      r.level === 'Substancial' ? 'bg-orange-100 text-orange-600' : 
                      'bg-green-100 text-green-600'
                    }`}>
                      {r.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
      <Toast 
        show={toast.show} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, show: false })} 
      />
    </div>
  );
}
