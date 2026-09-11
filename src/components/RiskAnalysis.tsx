import React, { useState } from 'react';
import { Risk, Project, Persona } from '../types';
import { ShieldAlert, Plus, Check, Ban, Trash2, ArrowUpRight, HelpCircle, AlertTriangle } from 'lucide-react';

interface RiskAnalysisProps {
  project: Project;
  onAddRisk: (risk: Omit<Risk, 'id'>) => void;
  onDeleteRisk: (id: string) => void;
  userRole: Persona;
}

export default function RiskAnalysis({ project, onAddRisk, onDeleteRisk, userRole }: RiskAnalysisProps) {
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState<Risk['category']>('Technical');
  const [description, setDescription] = useState('');
  const [probability, setProbability] = useState(3);
  const [impact, setImpact] = useState(3);
  const [mitigationPlan, setMitigationPlan] = useState('');

  const canEdit = userRole !== 'TEAM_MEMBER';
  const isRisksEnabled = project.features.risks;

  if (!isRisksEnabled) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl text-center space-y-4 shadow" id="risks-module">
        <div className="w-12 h-12 bg-slate-850 text-slate-500 rounded-full flex items-center justify-center mx-auto border border-slate-800">
          <Ban className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="text-sm font-semibold text-slate-200">Matriz de Riscos Oculta</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            O módulo **Controle & Matriz de Riscos (PxI)** está desativado nos Feature Toggles deste projeto. Ative o módulo riscos para analisar contingências.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    onAddRisk({
      category,
      description,
      probability,
      impact,
      mitigationPlan
    });

    setDescription('');
    setMitigationPlan('');
    setShowForm(false);
  };

  const getRiskScoreText = (p: number, i: number) => {
    const score = p * i;
    if (score >= 15) return { label: 'Crítico', color: 'text-red-400 bg-red-400/10 border border-red-500/20' };
    if (score >= 8) return { label: 'Moderado', color: 'text-amber-400 bg-amber-400/10 border border-amber-500/20' };
    return { label: 'Baixo', color: 'text-emerald-400 bg-emerald-400/10 border border-emerald-500/20' };
  };

  // Matrix rendering helper: check which cell has risks
  const getCellRisks = (prob: number, imp: number): Risk[] => {
    return project.risks.filter(r => r.probability === prob && r.impact === imp);
  };

  // Generate grid cells (Probability: 5 to 1, Impact: 1 to 5)
  const rows = [5, 4, 3, 2, 1];
  const cols = [1, 2, 3, 4, 5];

  const getCellColorClass = (prob: number, imp: number) => {
    const score = prob * imp;
    if (score >= 15) return 'bg-red-950/40 border border-red-500/20 text-red-400';
    if (score >= 8) return 'bg-amber-950/30 border border-amber-500/15 text-amber-400';
    return 'bg-emerald-950/20 border border-emerald-500/10 text-emerald-400';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg animate-fade-in text-xs" id="risks-module">
      <div className="p-5 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
          <h3 className="text-sm font-semibold text-slate-100 font-display">
            Matriz de Riscos (Probabilidade x Impacto)
          </h3>
        </div>

        {canEdit && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-md text-xs transition-all flex items-center gap-1.5 shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Risco
          </button>
        )}
      </div>

      <div className="p-5 space-y-6">
        
        {/* Risk Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Section A: Heatmap Matrix 5x5 */}
          <div className="lg:col-span-5 bg-slate-950 p-4 rounded-lg border border-slate-850 flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-3">Matriz de Calor 5x5 (Severidade)</span>
              
              <div className="relative">
                {/* Y-Axis Label */}
                <div className="absolute left-[-22px] top-1/2 transform -translate-y-1/2 -rotate-90 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Probabilidade
                </div>

                {/* 5x5 Matrix Grid */}
                <div className="ml-5 space-y-1">
                  {rows.map(p => (
                    <div key={p} className="flex gap-1 items-center">
                      {/* Row coordinate */}
                      <span className="w-4 text-right pr-1 font-mono text-[10px] text-slate-400">{p}</span>
                      
                      {/* Columns */}
                      <div className="flex-1 grid grid-cols-5 gap-1">
                        {cols.map(i => {
                          const cellRisks = getCellRisks(p, i);
                          return (
                            <div
                              key={`${p}-${i}`}
                              className={`h-11 rounded flex flex-col items-center justify-center relative font-sans text-[11px] font-bold ${getCellColorClass(p, i)}`}
                              title={`Probabilidade ${p} x Impacto ${i} (Severidade: ${p * i})`}
                            >
                              {cellRisks.length > 0 && (
                                <div className="absolute bg-slate-900 border border-slate-750 text-[10px] px-1.5 py-0.5 rounded-full shadow-lg font-mono text-slate-200">
                                  {cellRisks.length} R{cellRisks.length > 1 ? 's' : ''}
                                </div>
                              )}
                              
                              <span className="text-[8px] opacity-20 font-mono absolute top-0.5 right-1">
                                {p*i}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* X-Axis coordinates */}
                  <div className="flex pl-4 pt-1">
                    <div className="w-1 px-1" />
                    <div className="flex-1 grid grid-cols-5 gap-1 text-center font-mono text-[10px] text-slate-400">
                      {cols.map(i => (
                        <span key={i}>{i}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* X-Axis Label */}
                <div className="text-center text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-2">
                  Impacto de Severidade
                </div>

              </div>
            </div>

            <div className="bg-slate-900 p-3 rounded border border-slate-800 mt-4 text-[10px] text-slate-500 space-y-1.5 list-none leading-relaxed">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-red-500/20 border border-red-500/40 rounded"></span> Zona de Risco Crítico (Sev ≥ 15)</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-500/20 border border-amber-500/40 rounded"></span> Zona de Risco Moderado (Sev 8-12)</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded"></span> Zona de Risco Aceitável (Sev 1-6)</div>
            </div>

          </div>

          {/* Section B: Risks Register list & creation */}
          <div className="lg:col-span-7 space-y-3">
            {showForm && (
              <form onSubmit={handleSubmit} className="bg-slate-950 border border-slate-850 p-4 rounded-lg space-y-4 animate-fade-in text-xs mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Estruturar Novo Risco</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400">Categoria</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Risk['category'])}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-300 p-2 rounded"
                    >
                      <option value="Technical">Technical (Técnico)</option>
                      <option value="Financial">Financial (CapEx/OpEx)</option>
                      <option value="Strategic">Strategic (Estratégico)</option>
                      <option value="Operational">Operational (Operação)</option>
                      <option value="Schedule">Schedule (Prazos)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400">Probabilidade (1 a 5)</label>
                    <select
                      value={probability}
                      onChange={(e) => setProbability(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-300 p-2 rounded font-mono"
                    >
                      <option value="1">1 - Muito Rara</option>
                      <option value="2">2 - Improvável</option>
                      <option value="3">3 - Possível</option>
                      <option value="4">4 - Provável</option>
                      <option value="5">5 - Quase Certa</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400">Impacto no Projeto (1 a 5)</label>
                    <select
                      value={impact}
                      onChange={(e) => setImpact(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-300 p-2 rounded font-mono"
                    >
                      <option value="1">1 - Desprezível</option>
                      <option value="2">2 - Marginal</option>
                      <option value="3">3 - Moderado</option>
                      <option value="4">4 - Crítico</option>
                      <option value="5">5 - Catastrófico</option>
                    </select>
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <label className="text-slate-400">Descrição Detalhada do Risco</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Escassez de mão de obra sênior em K8s atrasará migração..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-300 p-2.5 rounded"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <label className="text-slate-400">Plano de Mitigação / Redução de Severidade</label>
                    <input
                      type="text"
                      value={mitigationPlan}
                      onChange={(e) => setMitigationPlan(e.target.value)}
                      placeholder="Ex: Contratação de consultoria terceirizada premium por 60 horas."
                      className="w-full bg-slate-900 border border-slate-800 text-slate-300 p-2.5 rounded placeholder:text-slate-600"
                    />
                  </div>

                  <div className="md:col-span-3 flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-3.5 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-400 rounded font-semibold transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded transition flex items-center gap-1 shadow"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Registrar Risco
                    </button>
                  </div>

                </div>
              </form>
            )}

            {/* List scroll panel */}
            <div className="border border-slate-800 rounded-lg bg-slate-950 overflow-hidden">
              <div className="bg-slate-900/60 p-2 px-3 font-mono text-[9px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                Lista de Riscos Cadastrados
              </div>

              <div className="divide-y divide-slate-800/50 max-h-[290px] overflow-y-auto">
                {project.risks.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 italic">
                    Nenhum risco de severidade listado para este escopo.
                  </div>
                ) : (
                  project.risks.map((r) => {
                    const sev = r.probability * r.impact;
                    const rating = getRiskScoreText(r.probability, r.impact);
                    return (
                      <div key={r.id} className="p-4 hover:bg-slate-900/10 transition-colors space-y-2">
                        
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                              {r.category} Type Risco
                            </span>
                            <h4 className="text-slate-100 font-semibold text-xs leading-normal select-all">
                              {r.description}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="text-[10px] font-mono font-bold text-slate-400">Prob {r.probability} × Imp {r.impact}</div>
                              <div className="text-[9px] text-slate-500">Gravidade: <span className="font-bold text-slate-300 font-mono">{sev}</span></div>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${rating.color}`}>
                              {rating.label}
                            </span>
                          </div>
                        </div>

                        {r.mitigationPlan && (
                          <div className="bg-slate-900/60 border border-slate-850/60 p-2.5 rounded text-[11px] text-slate-400 leading-normal">
                            <span className="text-indigo-400 font-bold block mb-0.5">Plano de Contigência (PMO):</span>
                            {r.mitigationPlan}
                          </div>
                        )}

                        {canEdit && (
                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => onDeleteRisk(r.id)}
                              className="text-[10px] font-medium text-slate-500 hover:text-rose-400 flex items-center gap-1 bg-slate-900 hover:bg-rose-500/10 px-2 py-1 rounded transition border border-slate-800 hover:border-rose-500/20"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Deletar Risco
                            </button>
                          </div>
                        )}

                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
