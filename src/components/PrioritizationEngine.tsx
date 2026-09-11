import React, { useState } from 'react';
import { PrioritizationWeights, PrioritizationScores } from '../types';
import { Sliders, HelpCircle, FileText, Check, Cpu, Sparkles } from 'lucide-react';

interface PrioritizationEngineProps {
  weights: PrioritizationWeights;
  onWeightsChange: (newWeights: PrioritizationWeights) => void;
  userRole: string;
}

export default function PrioritizationEngine({ weights, onWeightsChange, userRole }: PrioritizationEngineProps) {
  // Interactive Simulator inputs
  const [scores, setScores] = useState<Omit<PrioritizationScores, 'overallScore'>>({
    alignment: 8,
    value: 7,
    urgency: 9,
    complexity: 6,
  });

  const [localWeights, setLocalWeights] = useState<PrioritizationWeights>({ ...weights });
  const [showFormulaInfo, setShowFormulaInfo] = useState<boolean>(true);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Sync weights if props update
  React.useEffect(() => {
    setLocalWeights({ ...weights });
  }, [weights]);

  // Recalculate weighted prioritization score in real-time
  const calculateScore = (
    s: typeof scores, 
    w: PrioritizationWeights
  ): number => {
    const raw = (s.alignment * w.alignment) + 
                (s.value * w.value) + 
                (s.urgency * w.urgency) + 
                (s.complexity * w.complexity);
    return Math.round(raw * 100) / 100;
  };

  const calculatedResult = calculateScore(scores, localWeights);

  const handleScoreChange = (key: keyof typeof scores, value: number) => {
    setScores(prev => ({ ...prev, [key]: value }));
  };

  const handleWeightChange = (key: keyof PrioritizationWeights, value: number) => {
    const updated = { ...localWeights, [key]: value };
    
    // Normalize weights to sum exactly to 1.0 (or just warn the user)
    setLocalWeights(updated);
  };

  const totalWeight = parseFloat((localWeights.alignment + localWeights.value + localWeights.urgency + localWeights.complexity).toFixed(3));
  const isWeightValid = Math.abs(totalWeight - 1.0) < 0.001;

  const saveWeights = () => {
    if (!isWeightValid) return;
    onWeightsChange(localWeights);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const restoreWeightsToDefault = () => {
    const def = { alignment: 0.30, value: 0.40, urgency: 0.15, complexity: 0.15 };
    setLocalWeights(def);
    onWeightsChange(def);
  };

  // Check if role can configure weights (Tenant Admin or Portfolio PMO)
  const canConfigureWeights = userRole === 'SUPER_ADMIN' || userRole === 'TENANT_ADMIN' || userRole === 'PORTFOLIO_MANAGER';

  // Pseudocode definition for Task 4
  const pseudocodeString = `// Algoritmo de Cálculo do Score de Priorização Ponderada (Prioritization Engine)
// Fórmula: Score = ∑ (Pontuação_Critério_i * Peso_Critério_i)

funcao calcularScorePriorizacao(scores, pesos):
    // Validar limites e normalizar
    soma_pesos = pesos.alinhamento + pesos.valor + pesos.urgencia + pesos.complexidade
    se Abs(soma_pesos - 1.0) > 0.001:
        disparar Erro("Pesos de priorização devem somar exatamente 100% (1.0)")

    // Cálculo ponderado
    pontuacao_alinhamento = scores.alinhamento * pesos.alinhamento
    pontuacao_valor       = scores.valor * pesos.valor
    pontuacao_urgencia    = scores.urgencia * pesos.urgencia
    pontuacao_complexidade = scores.complexidade * pesos.complexidade -- Obs: 10 é mais simples, 1 é mais complexo

    score_total = pontuacao_alinhamento + pontuacao_valor + pontuacao_urgencia + pontuacao_complexidade
    
    // Retornar arredondado em 2 casas decimais
    retornar Arredondar(score_total, 2)`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl" id="prioritization-engine-module">
      <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-500/10 text-violet-400 rounded-lg border border-violet-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100 font-display">
              Motor de Priorização Multicritério
            </h2>
            <p className="text-xs text-slate-400">
              Calcule a pontuação dos projetos do Upstream (Intake) usando médias ponderadas personalizáveis.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowFormulaInfo(!showFormulaInfo)}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-xs transition-all flex items-center gap-1.5 border border-slate-700"
        >
          <FileText className="w-3.5 h-3.5" />
          {showFormulaInfo ? 'Esconder Pseudocódigo' : 'Ver Formula & Pseudocódigo'}
        </button>
      </div>

      <div className="p-6 space-y-6">
        {showFormulaInfo && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 bg-violet-950/20 border border-violet-500/15 p-5 rounded-lg animate-fade-in">
            <div className="md:col-span-5 space-y-3">
              <h3 className="text-xs font-bold uppercase text-violet-400 tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                A Fórmula de Peso Ponderado
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                As PMEs variam suas estratégias. Algumas focam em **ROI financeiro imediato**, outras em **Alinhamento de Longo Prazo** ou **Velocidade de Entrega (Baixa Complexidade)**. 
              </p>
              <div className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-center text-xs">
                <div className="text-slate-400 text-[10px] uppercase mb-1">Fórmula Matemática do VMO</div>
                <div className="text-slate-200">
                  S = <span className="text-indigo-400">(A × W_a)</span> + <span className="text-emerald-400">(V × W_v)</span> + <span className="text-sky-400">(U × W_u)</span> + <span className="text-amber-400">(C × W_c)</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                <strong>Onde:</strong> A = Alinhamento, V = Valor Comercial, U = Urgência de Mercado, C = Baixa Complexidade (escala inversa, onde maior pontuação representa menor esforço).
              </p>
            </div>
            
            <div className="md:col-span-7 flex flex-col h-full rounded overflow-hidden border border-slate-800 bg-slate-950/80">
              <div className="p-2 bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <Sliders className="w-3 h-3 text-violet-400" />
                motor_priorizador_vmo.pseudo
              </div>
              <div className="p-3 overflow-auto max-h-[170px] font-mono text-[10px] text-indigo-200 leading-normal">
                <pre>{pseudocodeString}</pre>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Section A: Configurar Pesos Meta-Métricas (RBAC controlada) */}
          <div className="lg:col-span-5 bg-slate-950/40 p-5 rounded-lg border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Configuração de Pesos PMO (Módulos Base)
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                  canConfigureWeights ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {canConfigureWeights ? 'Acesso Permitido' : 'Somente Leitura'}
                </span>
              </div>
              
              <p className="text-xs text-slate-400 mb-6 leading-normal">
                Defina o peso estratégico para cada pilar de decisão. A soma dos pesos deve totalizar exatamente **100% (1.0)**.
              </p>

              <div className="space-y-4">
                {/* Weight sliders */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300">Alinhamento Estratégico (W_a):</span>
                    <span className="text-indigo-400 font-bold">{(localWeights.alignment * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    disabled={!canConfigureWeights}
                    value={localWeights.alignment}
                    onChange={(e) => handleWeightChange('alignment', parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300">Valor de Negócio / ROI (W_v):</span>
                    <span className="text-emerald-400 font-bold">{(localWeights.value * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    disabled={!canConfigureWeights}
                    value={localWeights.value}
                    onChange={(e) => handleWeightChange('value', parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300">Urgência de Mercado (W_u):</span>
                    <span className="text-sky-400 font-bold">{(localWeights.urgency * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    disabled={!canConfigureWeights}
                    value={localWeights.urgency}
                    onChange={(e) => handleWeightChange('urgency', parseFloat(e.target.value))}
                    className="w-full accent-sky-500 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300">Simplicidade / Esforço Inverso (W_c):</span>
                    <span className="text-amber-400 font-bold">{(localWeights.complexity * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    disabled={!canConfigureWeights}
                    value={localWeights.complexity}
                    onChange={(e) => handleWeightChange('complexity', parseFloat(e.target.value))}
                    className="w-full accent-amber-500 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-900 mt-6 flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Soma dos Pesos Atuais:</span>
                <span className={`font-mono font-bold text-sm ${isWeightValid ? 'text-emerald-400' : 'text-red-400'}`}>
                  {(totalWeight * 100).toFixed(0)}% ({totalWeight.toFixed(2)})
                </span>
              </div>

              {canConfigureWeights ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={restoreWeightsToDefault}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded transition"
                  >
                    Restaurar Padrão
                  </button>
                  <button
                    onClick={saveWeights}
                    disabled={!isWeightValid}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded text-white shadow transition flex items-center justify-center gap-1 ${
                      isWeightValid 
                        ? 'bg-violet-600 hover:bg-violet-500' 
                        : 'bg-slate-800 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : null}
                    {isSaved ? 'Salvo!' : 'Aplicar Pesos'}
                  </button>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 text-center italic">
                  Apenas Tenant Admins e Gestores de Portfólio dão peso aos critérios.
                </div>
              )}
            </div>
          </div>

          {/* Section B: Rodar Simulador de Notas (Test Center) */}
          <div className="lg:col-span-7 bg-slate-950 p-5 rounded-lg border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Calculadora de Pontos (Simulação de Intake)
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Ajuste os valores de 1 a 10 para cada critério do projeto e avalie o impacto imediato na classificação.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-indigo-400">1. Alinhamento Estratégico</span>
                    <span className="font-mono bg-indigo-500/10 text-indigo-300 px-1.5 py-0.2 rounded font-bold">{scores.alignment}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={scores.alignment}
                    onChange={(e) => handleScoreChange('alignment', parseInt(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <div className="text-[10px] text-slate-500 italic leading-snug">
                    O quanto o escopo resolve o KPI master da diretoria.
                  </div>
                </div>

                <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-emerald-400">2. Valor de Negócio / ROI</span>
                    <span className="font-mono bg-emerald-500/10 text-emerald-300 px-1.5 py-0.2 rounded font-bold">{scores.value}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={scores.value}
                    onChange={(e) => handleScoreChange('value', parseInt(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                  <div className="text-[10px] text-slate-500 italic leading-snug">
                    Retorno financeiro real ou redução de churn.
                  </div>
                </div>

                <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-sky-400">3. Urgência de Mercado</span>
                    <span className="font-mono bg-sky-500/10 text-sky-300 px-1.5 py-0.2 rounded font-bold">{scores.urgency}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={scores.urgency}
                    onChange={(e) => handleScoreChange('urgency', parseInt(e.target.value))}
                    className="w-full accent-sky-500"
                  />
                  <div className="text-[10px] text-slate-500 italic leading-snug">
                    Punições fiscais iminentes ou avanço da concorrência parceira.
                  </div>
                </div>

                <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-amber-400">4. Simplicidade (Menor Esforço)</span>
                    <span className="font-mono bg-amber-500/10 text-amber-300 px-1.5 py-0.2 rounded font-bold">{scores.complexity}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={scores.complexity}
                    onChange={(e) => handleScoreChange('complexity', parseInt(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                  <div className="text-[10px] text-slate-500 italic leading-snug">
                    10 = altíssima simplicidade (fácil); 1 = alta complexidade de engenharia.
                  </div>
                </div>

              </div>
            </div>

            {/* Total calculation indicator showcase */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 mt-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                  Resultado Estimado pelo Motor
                </span>
                <span className="text-xs text-slate-300">
                  Pontuação Global de Priorização (Média Pesada)
                </span>
              </div>

              <div className="flex items-baseline gap-2 bg-slate-950 px-5 py-3 rounded-lg border border-violet-500/30">
                <span className="font-mono text-3xl font-bold text-violet-400">
                  {calculatedResult.toFixed(2)}
                </span>
                <span className="text-slate-400 text-xs font-mono">/ 10</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
