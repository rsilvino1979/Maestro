import React from 'react';
import { ToggleLeft, ToggleRight, Layout, Cpu, Database, Eye, MessageSquareText, Layers, FileCode } from 'lucide-react';

export default function ProductTreeExplain() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl" id="front-component-tree">
      <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-center gap-3">
        <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20 animate-pulse">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-100 font-display">
            Árvore de Componentes & Progressive Disclosure Map
          </h2>
          <p className="text-xs text-slate-400">
            Saiba como o Front-End transpõe Feature Toggles e regras de RBAC em interfaces adaptativas.
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Conceptual map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-amber-400" />
              O algoritmo do Progressive Disclosure
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              No SaaS VMO, para evitar sobrecarga cognitiva (**Cognitive Overload**) das PMEs clientes, as interfaces ocultam menus complexos que estão desativados a nível de projeto. 
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              A arquitetura avalia o vetor <code className="px-1 text-slate-200 bg-slate-950 font-mono">project.features</code>. Se desligado, o módulo é omitido da árvore de renderização do DOM em tempo de execução usando declarações condicionais clássicas do React.
            </p>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 font-mono text-[11px]">
              <span className="text-slate-500 font-bold block">// Progressive Disclosure Engine Condicional</span>
              <div className="text-slate-300">
                <span className="text-purple-400">const</span> {'{ canvas, budget, risks } = project.features;'}
              </div>
              <div className="text-slate-300 pl-4 mt-1.5">
                {'{canvas && ('}
                <div className="pl-4 text-amber-400">{'<ProjectCanvas data={project.canvasData} />'}</div>
                {')}'}
              </div>
              <div className="text-slate-300 pl-4 mt-1.5">
                {'{budget && ('}
                <div className="pl-4 text-emerald-400">{'<BudgetTracker data={project.budgetLines} />'}</div>
                {')}'}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-950 p-5 rounded-lg border border-slate-850">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-4">
              <FileCode className="w-4 h-4 text-indigo-400" />
              Hierarquia Visual de Componentes (React Tree)
            </h3>

            {/* Simulated file tree map */}
            <div className="font-mono text-xs text-slate-300 leading-relaxed space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-indigo-400 font-mono">{'[App.tsx]'}</span>
                <span className="text-[11px] text-slate-500">— Root Shell (Gerencia Tenant, Persona e Abas principais)</span>
              </div>
              
              <div className="pl-4 border-l border-slate-800 ml-2 space-y-1 py-1">
                
                {/* Global stats */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">├──</span>
                  <span className="text-slate-300">{'<SidebarDashboard />'}</span>
                  <span className="text-[11px] text-slate-500">— Controla visões macro estrategicas e táticas</span>
                </div>

                {/* DB sandbox */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-200">├──</span>
                  <span className="text-violet-400 font-semibold flex items-center gap-1">{'<DbSchemaView />'}</span>
                  <span className="text-[11px] text-slate-500">— DB relacional & painel de queries SQL com simulação RLS</span>
                </div>

                {/* API specs */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">├──</span>
                  <span className="text-sky-400 font-semibold flex items-center gap-1">{'<ApiSpecView />'}</span>
                  <span className="text-[11px] text-slate-500">— Endpoints restful & playground de requisição mock</span>
                </div>

                {/* Prioritization */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">├──</span>
                  <span className="text-violet-400 font-semibold flex items-center gap-1">{'<PrioritizationEngine />'}</span>
                  <span className="text-[11px] text-slate-500">— Calculadora real de pesos e pseudocódigo do motor</span>
                </div>

                {/* Project details wrapper */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">└──</span>
                  <span className="text-slate-100 font-bold">{'<ProjectManagementOffice />'}</span>
                  <span className="text-[11px] text-slate-500">— Pipeline Central (Upstream (Intake) → Downstream (Ativo))</span>
                </div>

                {/* Children inside Project details */}
                <div className="pl-6 border-l border-slate-800 ml-2 space-y-1.5 py-1">
                  
                  {/* Intake sub-module */}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">├──</span>
                    <span className="text-amber-400">{'<UpstreamIntakeQueue />'}</span>
                    <span className="text-[11px] text-slate-400">— Triage, priorização e aprovação p/ Downstream</span>
                  </div>

                  {/* Progressive Disclosure modules */}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">├──</span>
                    <span className="text-indigo-400">{'<ProjectCanvas />'}</span>
                    <span className="px-1.5 py-0.2 bg-slate-900 border border-slate-800 text-indigo-300 rounded text-[9px] font-bold">Depends on "canvas" toggle</span>
                    <span className="text-[11px] text-slate-500">— Pitch Canvas bento grid</span>
                  </div>

                  {/* Business Case module */}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">├──</span>
                    <span className="text-emerald-400">{'<BusinessCase />'}</span>
                    <span className="px-1.5 py-0.2 bg-slate-900 border border-slate-800 text-emerald-300 rounded text-[9px] font-bold">Depends on "business_case" toggle</span>
                    <span className="text-[11px] text-slate-500">— Problem & ROI model</span>
                  </div>

                  {/* Budget tracker */}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">├──</span>
                    <span className="text-rose-400">{'<BudgetTracker />'}</span>
                    <span className="px-1.5 py-0.2 bg-slate-900 border border-slate-800 text-rose-300 rounded text-[9px] font-bold">Depends on "budget" toggle</span>
                    <span className="text-[11px] text-slate-500">— Capex/Opex ledger</span>
                  </div>

                  {/* Gantt Milestones */}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">├──</span>
                    <span className="text-sky-400">{'<GanttMilestones />'}</span>
                    <span className="px-1.5 py-0.2 bg-slate-900 border border-slate-800 text-sky-300 rounded text-[9px] font-bold">Depends on "gantt" toggle</span>
                    <span className="text-[11px] text-slate-500">— Milestone line</span>
                  </div>

                  {/* Risks analysis */}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">└──</span>
                    <span className="text-amber-500">{'<RiskAnalysis />'}</span>
                    <span className="px-1.5 py-0.2 bg-slate-900 border border-slate-800 text-amber-300 rounded text-[9px] font-bold">Depends on "risks" toggle</span>
                    <span className="text-[11px] text-slate-500">— 5x5 heatmap block</span>
                  </div>

                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Feature Toggle demonstration area */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-850">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Simulação de Fluxo de Renderização do Front-End</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-900 p-3 rounded border border-slate-805 space-y-1">
              <span className="text-indigo-400 font-bold block">1. Usuário Altera Toggle</span>
              <p className="text-[11px] text-slate-400 leading-snug">
                PMO desativa módulo "Riscos" pois o projeto K8s é puramente técnico e monitorado de forma ágil em Kanban.
              </p>
            </div>
            <div className="bg-slate-900 p-3 rounded border border-slate-805 space-y-1">
              <span className="text-yellow-400 font-bold block">2. API Despacha Mudança</span>
              <p className="text-[11px] text-slate-400 leading-snug">
                Envia <code className="text-[10px] text-yellow-300 bg-slate-950 px-1 font-mono">PATCH /projects/:id/features</code> mudando a chave para <code className="text-[10px] bg-slate-950 px-1 font-mono">risks: false</code>.
              </p>
            </div>
            <div className="bg-slate-900 p-3 rounded border border-slate-805 space-y-1">
              <span className="text-emerald-400 font-bold block">3. Re-render Imediato</span>
              <p className="text-[11px] text-slate-400 leading-snug">
                O React redesenha a página, removendo o componente <code className="text-[10px] text-emerald-300 bg-slate-950 px-1 font-mono">RiskAnalysis</code> de cena e economizando recursos.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
