import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/api';
import Toast from '../components/Toast';
import { ClipboardCheck, ArrowRight, ArrowLeft, CheckCircle2, Factory, Briefcase, AlertTriangle, Clock } from 'lucide-react';

// 15 Fatores de Risco Psicossocial conforme NR-01 Anexo I
const CATEGORIES = [
  {
    id: 'organizacao',
    title: 'Organização do Trabalho',
    description: 'Avalie aspectos relacionados à carga, jornada e ritmo de trabalho.',
    icon: '🏢',
    questions: [
      { id: 'q01', text: 'Você sente que sua carga de trabalho é excessiva para o tempo disponível?', factor: 'Sobrecarga ou ritmo excessivo de trabalho' },
      { id: 'q02', text: 'Você realiza jornada prolongada ou trabalho em turnos com frequência?', factor: 'Jornada prolongada ou trabalho em turnos' },
      { id: 'q03', text: 'As metas exigidas pela empresa são inalcançáveis ou geram pressão excessiva?', factor: 'Metas inalcançáveis ou pressão excessiva por produtividade' },
      { id: 'q04', text: 'Suas atividades são monótonas e repetitivas na maior parte do tempo?', factor: 'Monotonia e repetitividade' },
    ]
  },
  {
    id: 'relacoes',
    title: 'Relações Socioprofissionais',
    description: 'Avalie a qualidade das relações interpessoais no trabalho.',
    icon: '🤝',
    questions: [
      { id: 'q05', text: 'Existe um ambiente conflituoso entre colegas ou com a liderança?', factor: 'Ambiente conflituoso entre colegas ou com liderança' },
      { id: 'q06', text: 'Você já vivenciou ou presenciou situações de assédio moral ou humilhação?', factor: 'Assédio moral ou situações de humilhação' },
      { id: 'q07', text: 'Você sente falta de suporte e orientação da sua chefia imediata?', factor: 'Falta de suporte da chefia imediata' },
      { id: 'q08', text: 'Você se sente isolado socialmente no ambiente de trabalho?', factor: 'Isolamento social no trabalho' },
    ]
  },
  {
    id: 'condicoes',
    title: 'Condições e Organização',
    description: 'Avalie autonomia, recognition e comunicação no trabalho.',
    icon: '⚙️',
    questions: [
      { id: 'q09', text: 'Você sente falta de autonomia ou é submetido a microgestão constante?', factor: 'Falta de autonomia / microgestão' },
      { id: 'q10', text: 'Você sente falta de reconhecimento ou feedback sobre seu trabalho?', factor: 'Falta de reconhecimento ou feedback' },
      { id: 'q11', text: 'A comunicação na empresa é ineficaz ou confusa?', factor: 'Comunicação ineficaz na empresa' },
      { id: 'q12', text: 'Você sente insegurança em relação à manutenção do seu emprego?', factor: 'Insegurança no emprego' },
    ]
  },
  {
    id: 'estressores',
    title: 'Estressores Individuais',
    description: 'Avalie sinais de esgotamento e sofrimento relacionados ao trabalho.',
    icon: '🧠',
    questions: [
      { id: 'q13', text: 'Você apresenta sinais de esgotamento emocional ou burnout?', factor: 'Sinais de esgotamento emocional (burnout)' },
      { id: 'q14', text: 'Você sente ansiedade ou sofrimento psíquico relacionado ao trabalho?', factor: 'Ansiedade ou sofrimento psíquico relacionado ao trabalho' },
      { id: 'q15', text: 'De modo geral, sua satisfação com o trabalho está baixa?', factor: 'Baixa satisfação geral com o trabalho' },
    ]
  }
];

const ALL_QUESTIONS = CATEGORIES.flatMap(c => c.questions);
const TOTAL_STEPS = CATEGORIES.length + 2; // Identificação + 4 categorias + Resultado

const SCALE_LABELS = [
  { value: 1, label: 'Nunca', color: 'border-green-200 bg-green-50 text-green-700' },
  { value: 2, label: 'Raramente', color: 'border-lime-200 bg-lime-50 text-lime-700' },
  { value: 3, label: 'Às vezes', color: 'border-yellow-200 bg-yellow-50 text-yellow-700' },
  { value: 4, label: 'Frequente', color: 'border-orange-200 bg-orange-50 text-orange-700' },
  { value: 5, label: 'Sempre', color: 'border-red-200 bg-red-50 text-red-700' },
];

export default function Questionnaire() {
  const { token } = useParams();
  const [empresa, setEmpresa] = useState<any>(null);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    colaboradorId: `col-${Math.random().toString(36).substr(2, 9)}`,
    gheId: '',
    cargo: '',
    answers: {} as Record<string, number>,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [status, setStatus] = useState<'LOADING' | 'ACTIVE' | 'EXPIRED' | 'ERROR'>('LOADING');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await api.get(`/q/${token}`);
        setEmpresa(res.data.empresa);
        if (res.data.empresa.statusColeta === 'ATIVA') {
          setStatus('ACTIVE');
        } else {
          setStatus('EXPIRED');
        }
      } catch (err: any) {
        setStatus('ERROR');
      }
    };
    fetchCompany();
  }, [token]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/q/${token}/responder`, {
        colaboradorId: formData.colaboradorId,
        gheId: formData.gheId,
        cargo: formData.cargo,
        respostasRaw: formData.answers,
      });
      setResult(res.data);
      setStep(TOTAL_STEPS - 1);
    } catch (err: any) {
      setToast({ show: true, message: err.response?.data?.message || 'Erro ao enviar respostas.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const currentCategory = step >= 1 && step <= CATEGORIES.length ? CATEGORIES[step - 1] : null;

  const isCategoryComplete = () => {
    if (!currentCategory) return false;
    return currentCategory.questions.every(q => formData.answers[q.id] !== undefined);
  };

  const isLastCategory = step === CATEGORIES.length;

  const answeredCount = Object.keys(formData.answers).length;
  const totalQuestions = ALL_QUESTIONS.length;
  const progress = step === 0 ? 0 : Math.min((step / (TOTAL_STEPS - 1)) * 100, 100);

  if (status === 'ERROR') {
    return (
      <div className="min-h-screen bg-clinicfy-light p-8 flex flex-col items-center justify-center text-center">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md border border-gray-100">
          <div className="bg-red-50 text-red-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-clinicfy-dark mb-2">Página não Encontrada</h2>
          <p className="text-gray-500 mb-6">O link que você acessou é inválido ou a empresa não está cadastrada no sistema.</p>
        </div>
      </div>
    );
  }

  if (status === 'EXPIRED') {
    return (
      <div className="min-h-screen bg-clinicfy-light p-8 flex flex-col items-center justify-center text-center">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md border border-gray-100">
          <div className="bg-orange-50 text-orange-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Clock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-clinicfy-dark mb-2">Coleta Encerrada</h2>
          <p className="text-gray-500 mb-6">O prazo para responder a este questionário expirou em <b>{empresa?.dataExpiracaoLink ? new Date(empresa.dataExpiracaoLink).toLocaleString('pt-BR') : ''}</b>. Entre em contato com o responsável da sua empresa.</p>
        </div>
      </div>
    );
  }

  if (status === 'LOADING') return (
    <div className="min-h-screen bg-clinicfy-light p-8 flex flex-col items-center justify-center text-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="bg-clinicfy-teal/20 w-12 h-12 rounded-full mb-4"></div>
        <p className="text-gray-400 font-medium">Carregando...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/30 p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-2xl flex items-center gap-3 mb-6">
        <div className="bg-clinicfy-teal p-2 rounded-xl text-white">
          <Factory size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-clinicfy-dark">{empresa?.nomeFantasia || empresa?.razaoSocial}</h1>
          <p className="text-sm text-gray-500">Avaliação de Riscos Psicossociais — NR 01</p>
        </div>
      </header>

      <main className="w-full max-w-2xl bg-white rounded-3xl p-6 md:p-10 shadow-xl shadow-clinicfy-teal/5 relative overflow-hidden">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {step === 0 ? 'Início' : step <= CATEGORIES.length ? `Seção ${step} de ${CATEGORIES.length}` : 'Concluído'}
            </span>
            <span className="text-[10px] font-bold text-clinicfy-teal">
              {answeredCount}/{totalQuestions} respondidas
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-clinicfy-teal to-emerald-400 h-2 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* STEP 0: Identificação */}
        {step === 0 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <p className="text-gray-500 mb-6 text-sm">Responda com sinceridade. Sua participação é fundamental para a gestão da saúde na empresa. <b>O questionário é anônimo.</b></p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1 ml-1">Seu Setor / GHE <span className="text-red-400">*</span></label>
                <select
                  className="input-field appearance-none"
                  value={formData.gheId}
                  onChange={(e) => setFormData({ ...formData, gheId: e.target.value })}
                >
                  <option value="">Selecione seu setor...</option>
                  {empresa?.ghes?.map((g: any) => (
                    <option key={g.id} value={g.id}>{g.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 ml-1 flex items-center gap-2">
                  <Briefcase size={14} className="text-gray-400" />
                  Seu Cargo <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Auxiliar de Produção, Conferente..."
                  className="input-field"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                />
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mt-4">
                <div className="flex gap-3">
                  <ClipboardCheck className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm font-medium text-blue-800 mb-1">Sobre esta avaliação</p>
                    <p className="text-xs text-blue-600 leading-relaxed">
                      Este questionário avalia fatores de risco psicossocial conforme a NR-01.
                      Suas respostas serão consolidadas por GHE, garantindo o anonimato individual.
                    </p>
                  </div>
                </div>
              </div>

              <button
                disabled={!formData.gheId || !formData.cargo}
                onClick={() => setStep(1)}
                className="btn-secondary w-full mt-4 flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                Iniciar Questionário <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 1-4: Categorias de Perguntas */}
        {currentCategory && (
          <div key={currentCategory.id} className="animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{currentCategory.icon}</span>
              <div>
                <h2 className="text-xl font-bold">{currentCategory.title}</h2>
                <p className="text-gray-500 text-sm">{currentCategory.description}</p>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-6">
              Responda de 1 (Nunca) a 5 (Sempre)
            </p>

            <div className="space-y-6">
              {currentCategory.questions.map((q, qi) => (
                <div key={q.id} className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                  <p className="font-medium mb-3 text-sm text-clinicfy-dark">
                    <span className="text-clinicfy-teal font-bold mr-1.5">{qi + 1}.</span>
                    {q.text}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {SCALE_LABELS.map((scale) => (
                      <button
                        key={scale.value}
                        onClick={() => setFormData({
                          ...formData,
                          answers: { ...formData.answers, [q.id]: scale.value }
                        })}
                        className={`flex-1 min-w-[60px] py-2.5 px-1 rounded-xl border-2 text-center transition-all duration-200 ${formData.answers[q.id] === scale.value
                            ? `${scale.color} scale-105 shadow-md font-bold ring-2 ring-offset-1 ring-current/20`
                            : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200 hover:bg-gray-50'
                          }`}
                      >
                        <div className="text-lg font-bold leading-none mb-0.5">{scale.value}</div>
                        <div className="text-[9px] uppercase tracking-wider leading-none">{scale.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex-shrink-0 px-5 py-3 rounded-xl border border-gray-200 font-medium text-gray-500 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <ArrowLeft size={16} /> Voltar
                </button>

                {isLastCategory ? (
                  <button
                    disabled={!isCategoryComplete() || loading}
                    onClick={handleSubmit}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={18} />
                        Finalizar e Enviar
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    disabled={!isCategoryComplete()}
                    onClick={() => setStep(step + 1)}
                    className="btn-secondary flex-1 flex items-center justify-center gap-2 group disabled:opacity-50"
                  >
                    Próxima Seção <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP RESULTADO */}
        {step === TOTAL_STEPS - 1 && result && (
          <div className="animate-in zoom-in duration-500 text-center py-8">
            <div className="mx-auto bg-green-100 text-green-600 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Obrigado!</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Sua avaliação psicossocial foi concluída com sucesso. Seus dados foram salvos e serão processados pelo engenheiro responsável na consolidação do PGR da empresa.
            </p>

            {/* Removida análise individual imediata para economia de tokens */}
          </div>
        )}
      </main>

      <footer className="w-full max-w-2xl mt-6 text-center">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest">
          PGR Smart — Motor de IA para Gestão de Riscos Ocupacionais
        </p>
      </footer>

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
}
