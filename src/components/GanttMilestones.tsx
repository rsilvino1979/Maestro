import React, { useState } from 'react';
import { Milestone, Project, Persona } from '../types';
import { Calendar, Plus, Check, Ban, Trash2, Milestone as MilestoneIcon, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface GanttMilestonesProps {
  project: Project;
  onAddMilestone: (milestone: Omit<Milestone, 'id'>) => void;
  onDeleteMilestone: (id: string) => void;
  onUpdateMilestoneStatus: (id: string, status: Milestone['status'], progress: number) => void;
  userRole: Persona;
}

export default function GanttMilestones({ 
  project, 
  onAddMilestone, 
  onDeleteMilestone, 
  onUpdateMilestoneStatus,
  userRole 
}: GanttMilestonesProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState('2026-08-30');
  const [status, setStatus] = useState<Milestone['status']>('NOT_STARTED');
  const [progress, setProgress] = useState(0);

  const canEdit = userRole !== 'TEAM_MEMBER';
  const isGanttEnabled = project.features.gantt;

  if (!isGanttEnabled) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl text-center space-y-4 shadow" id="gantt-module">
        <div className="w-12 h-12 bg-slate-850 text-slate-500 rounded-full flex items-center justify-center mx-auto border border-slate-800">
          <Ban className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="text-sm font-semibold text-slate-200">Marcos de Gantt Ocultos</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            O módulo **Cronograma & Gantt de Marcos** está desativado nos Feature Toggles deste projeto. Ative-o na barra lateral de toggles para enxergar o mapa temporal do projeto.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddMilestone({
      name,
      dueDate,
      status,
      progress: status === 'COMPLETED' ? 100 : progress
    });

    setName('');
    setProgress(0);
    setStatus('NOT_STARTED');
    setShowForm(false);
  };

  const getStatusIcon = (st: Milestone['status']) => {
    switch (st) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'IN_PROGRESS':
        return <Clock className="w-4 h-4 text-indigo-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStatusLabelColor = (st: Milestone['status']) => {
    switch (st) {
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'IN_PROGRESS':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border border-slate-750';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg animate-fade-in text-xs" id="gantt-module">
      <div className="p-5 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4.5 h-4.5 text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-100 font-display">
            Cronograma de Marcos Híbrido (Agile-Gantt)
          </h3>
        </div>

        {canEdit && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-md text-xs transition-all flex items-center gap-1.5 shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Marco
          </button>
        )}
      </div>

      <div className="p-5 space-y-6">
        
        {/* Visual Roadmap Progression line */}
        {project.milestones.length > 0 && (
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-850">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-4">Linha do Tempo Visual</span>
            <div className="relative flex flex-col md:flex-row gap-6 md:gap-4 md:items-start md:justify-between py-2 overflow-x-auto">
              
              {/* Connecting line on desktop */}
              <div className="hidden md:block absolute top-[18px] left-[5%] right-[5%] h-0.5 bg-slate-800 -z-0" />

              {project.milestones.map((m, idx) => {
                const isCompleted = m.status === 'COMPLETED';
                const isInProgress = m.status === 'IN_PROGRESS';
                
                return (
                  <div key={m.id} className="relative z-10 flex md:flex-col items-center md:items-center text-left md:text-center shrink-0 w-full md:w-[28%] gap-3 md:gap-2">
                    
                    {/* Ring wrapper */}
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      isCompleted ? 'bg-emerald-950 border-emerald-500 text-emerald-400' :
                      isInProgress ? 'bg-indigo-950 border-indigo-500 text-indigo-400' :
                      'bg-slate-900 border-slate-800 text-slate-500'
                    }`}>
                      {isCompleted ? <Check className="w-4 h-4" /> : <span className="font-mono text-xs">{idx + 1}</span>}
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-200 line-clamp-1 text-xs md:text-[11px] leading-tight select-all">{m.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-mono">Meta: {m.dueDate}</p>
                      <div className="flex md:justify-center items-center gap-1.5 mt-1">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold font-mono ${getStatusLabelColor(m.status)}`}>
                          {m.status}
                        </span>
                        <span className="font-mono text-[9px] text-slate-400">({m.progress}%)</span>
                      </div>
                    </div>

                  </div>
                );
              })}

            </div>
          </div>
        )}

        {/* Expandable Add Milestone Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-slate-950 border border-slate-850 p-4 rounded-lg space-y-4 animate-fade-in text-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Novo Marco de Entrega</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2 space-y-1">
                <label className="text-slate-400">Nome do Marco (Milestone)</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Integração de Homologação Sandbox concluída"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2 rounded"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Data Limite (Due Date)</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2 rounded font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Status Inicial</label>
                <select
                  value={status}
                  onChange={(e) => {
                    const st = e.target.value as Milestone['status'];
                    setStatus(st);
                    if (st === 'COMPLETED') setProgress(100);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2 rounded"
                >
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              {status !== 'COMPLETED' && (
                <div className="space-y-1">
                  <label className="text-slate-400">Progresso Atual: <span className="font-mono text-indigo-400 font-bold">{progress}%</span></label>
                  <input
                    type="range"
                    min="0"
                    max="99"
                    step="5"
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
              )}

              <div className="md:col-span-4 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-400 rounded font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-semibold transition flex items-center gap-1 shadow"
                >
                  <Check className="w-3.5 h-3.5" />
                  Salvar Marco
                </button>
              </div>

            </div>
          </form>
        )}

        {/* Key Milestones Ledger */}
        <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
          <div className="p-3 bg-slate-900/60 font-mono text-[9px] uppercase tracking-wider text-slate-400 border-b border-slate-800 flex justify-between">
            <span>Listagem de Marcos de Cronograma</span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {project.milestones.length === 0 ? (
              <div className="p-8 text-center text-slate-500 italic">
                Nenhum marco de cronograma cadastrado neste projeto. Ative ou insira um acima.
              </div>
            ) : (
              project.milestones.map((m) => (
                <div key={m.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-900/10 transition-all">
                  <div className="flex items-center gap-3">
                    <MilestoneIcon className="w-4 h-4 text-slate-500 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-slate-200 select-all leading-normal text-xs md:text-[13px]">{m.name}</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">Prazo de Entrega Estimado: {m.dueDate}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap">
                    
                    {/* Status updater for PM/PMO */}
                    {canEdit ? (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-[10px] font-mono font-semibold">Atualizar Status:</span>
                        <select
                          value={m.status}
                          onChange={(e) => {
                            const newSt = e.target.value as Milestone['status'];
                            const newPrg = newSt === 'COMPLETED' ? 100 : (m.progress === 100 ? 50 : m.progress);
                            onUpdateMilestoneStatus(m.id, newSt, newPrg);
                          }}
                          className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 p-1.5 py-1 text-[11px] rounded transition focus:outline-none"
                        >
                          <option value="NOT_STARTED">Not Started</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(m.status)}
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${getStatusLabelColor(m.status)}`}>
                          {m.status}
                        </span>
                      </div>
                    )}

                    {/* Progress Slider updater for PM/PMO */}
                    <div className="w-32 space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                        <span>Conclusão</span>
                        <span className="font-bold">{m.progress}%</span>
                      </div>
                      
                      {canEdit && m.status !== 'COMPLETED' ? (
                        <input
                          type="range"
                          min="0"
                          max="95"
                          step="5"
                          value={m.progress}
                          onChange={(e) => onUpdateMilestoneStatus(m.id, m.status, parseInt(e.target.value))}
                          className="w-full accent-indigo-500 h-1"
                        />
                      ) : (
                        <div className="w-full bg-slate-850 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-500 h-full rounded-full transition-all"
                            style={{ width: `${m.progress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Delete button wrapper */}
                    {canEdit && (
                      <button
                        onClick={() => onDeleteMilestone(m.id)}
                        className="p-1.5 hover:bg-rose-500/10 hover:text-rose-400 text-slate-500 rounded transition"
                        title="Deletar Marco"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
