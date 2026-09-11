import React, { useState } from 'react';
import { CanvasData, BusinessCaseData, Project } from '../types';
import { LayoutGrid, FileText, Landmark, Users2, HelpCircle, Save, Check, Ban, AlertCircle } from 'lucide-react';

interface ProjectCanvasProps {
  project: Project;
  onUpdateCanvas: (updatedCanvas: CanvasData) => void;
  onUpdateBusinessCase: (updatedBusinessCase: BusinessCaseData) => void;
  canEdit: boolean;
  onlyShow?: 'canvas' | 'business_case';
}

export default function ProjectCanvas({ project, onUpdateCanvas, onUpdateBusinessCase, canEdit, onlyShow }: ProjectCanvasProps) {
  const [localCanvas, setLocalCanvas] = useState<CanvasData>({ ...project.canvasData });
  const [localBusinessCase, setLocalBusinessCase] = useState<BusinessCaseData>({ ...project.businessCaseData });
  const [canvasSaved, setCanvasSaved] = useState<boolean>(false);
  const [businessSaved, setBusinessSaved] = useState<boolean>(false);

  // Sync with project changes
  React.useEffect(() => {
    setLocalCanvas({ ...project.canvasData });
    setLocalBusinessCase({ ...project.businessCaseData });
  }, [project]);

  const handleCanvasSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCanvas(localCanvas);
    setCanvasSaved(true);
    setTimeout(() => setCanvasSaved(false), 2000);
  };

  const handleBusinessSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBusinessCase(localBusinessCase);
    setBusinessSaved(true);
    setTimeout(() => setBusinessSaved(false), 2000);
  };

  // Progressive Disclosure check
  const isCanvasEnabled = onlyShow ? (onlyShow === 'canvas' && project.features.canvas) : project.features.canvas;
  const isBusinessCaseEnabled = onlyShow ? (onlyShow === 'business_case' && project.features.business_case) : project.features.business_case;

  if (!onlyShow && !isCanvasEnabled && !isBusinessCaseEnabled) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl text-center space-y-4">
        <div className="w-12 h-12 bg-slate-850 text-slate-500 rounded-full flex items-center justify-center mx-auto border border-slate-800">
          <Ban className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="text-sm font-semibold text-slate-200">Módulos Upstream Ocultos</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Os módulos **Canvas de Projeto** e **Business Case** estão desativados nos Feature Toggles deste projeto. Use o painel de fardos laterais de toggles para ativá-los imediatamente.
          </p>
        </div>
      </div>
    );
  }

  if (onlyShow === 'canvas' && !project.features.canvas) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl text-center space-y-4">
        <div className="w-12 h-12 bg-slate-850 text-slate-500 rounded-full flex items-center justify-center mx-auto border border-slate-800">
          <Ban className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="text-sm font-semibold text-slate-200">Canvas Desativado</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            O módulo **Canvas de Projeto** está desativado nos Feature Toggles deste projeto. Use a aba "Ativar Módulos" para habilitá-lo.
          </p>
        </div>
      </div>
    );
  }

  if (onlyShow === 'business_case' && !project.features.business_case) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl text-center space-y-4">
        <div className="w-12 h-12 bg-slate-850 text-slate-500 rounded-full flex items-center justify-center mx-auto border border-slate-800">
          <Ban className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="text-sm font-semibold text-slate-200">Business Case Desativado</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            O módulo **Business Case** está desativado nos Feature Toggles deste projeto. Use a aba "Ativar Módulos" para habilitá-lo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 1. PROJECT CANVAS SECTION - PROGRESSIVE DISCLOSURE IN ACTION */}
      {isCanvasEnabled ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg animate-fade-in">
          <div className="p-5 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4.5 h-4.5 text-indigo-400" />
              <h3 className="text-sm font-semibold text-slate-100 font-display">
                Canvas de Pitch Simplificado (Upstream PMI + Ágil)
              </h3>
            </div>

            <button
              onClick={handleCanvasSave}
              disabled={!canEdit}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-md text-xs transition-all flex items-center gap-1.5 shadow"
            >
              {canvasSaved ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Save className="w-3.5 h-3.5" />}
              {canvasSaved ? 'Salvo!' : 'Salvar Canvas'}
            </button>
          </div>

          <div className="p-5">
            {!canEdit && (
              <div className="bg-amber-500/10 border border-amber-500/15 p-2.5 rounded-lg mb-4 flex items-center gap-2 text-amber-400 text-xs text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span><strong>Somente Leitura:</strong> Seu papel (Persona) atual não possui privilégios de gravação para o Canvas deste projeto.</span>
              </div>
            )}

            {/* Lean Canvas Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 font-sans text-xs">
              
              {/* Box 1: Propósito & Objetivos - col 4 */}
              <div className="md:col-span-4 bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex flex-col justify-between min-h-[140px]">
                <span className="font-semibold text-indigo-400 block mb-1">Propósito / Objetivos</span>
                <span className="text-[11px] text-slate-500 italic block mb-2 leading-tight">O que esperamos resolver e por quê?</span>
                <textarea
                  value={localCanvas.purpose}
                  disabled={!canEdit}
                  onChange={(e) => setLocalCanvas(prev => ({ ...prev, purpose: e.target.value }))}
                  className="w-full flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:outline-none p-2 rounded text-slate-200 resize-none leading-normal text-[11px]"
                />
              </div>

              {/* Box 2: Atividades Chave - col 4 */}
              <div className="md:col-span-4 bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex flex-col justify-between min-h-[140px]">
                <span className="font-semibold text-slate-300 block mb-1">Entregáveis & Atividades Chave</span>
                <span className="text-[11px] text-slate-500 italic block mb-2 leading-tight">Quais são as tarefas críticas e epics?</span>
                <textarea
                  value={localCanvas.keyActivities}
                  disabled={!canEdit}
                  onChange={(e) => setLocalCanvas(prev => ({ ...prev, keyActivities: e.target.value }))}
                  className="w-full flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:outline-none p-2 rounded text-slate-200 resize-none leading-normal text-[11px]"
                />
              </div>

              {/* Box 3: Clientes Target - col 4 */}
              <div className="md:col-span-4 bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex flex-col justify-between min-h-[140px]">
                <span className="font-semibold text-emerald-400 block mb-1">Segmento de Clientes</span>
                <span className="text-[11px] text-slate-500 italic block mb-2 leading-tight">Quem é o usuário final beneficiado?</span>
                <textarea
                  value={localCanvas.targetAudience}
                  disabled={!canEdit}
                  onChange={(e) => setLocalCanvas(prev => ({ ...prev, targetAudience: e.target.value }))}
                  className="w-full flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:outline-none p-2 rounded text-slate-200 resize-none leading-normal text-[11px]"
                />
              </div>

              {/* Box 4: Parceiros Estratégicos - col 3 */}
              <div className="md:col-span-3 bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex flex-col justify-between min-h-[130px]">
                <span className="font-semibold text-slate-300 block mb-1">Parceiros Críticos</span>
                <span className="text-[11px] text-slate-400 block mb-2 leading-tight">Terceiros ou fornecedores.</span>
                <textarea
                  value={localCanvas.keyPartners}
                  disabled={!canEdit}
                  onChange={(e) => setLocalCanvas(prev => ({ ...prev, keyPartners: e.target.value }))}
                  className="w-full flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:outline-none p-2 rounded text-slate-200 resize-none leading-normal text-[11px]"
                />
              </div>

              {/* Box 5: Relacionamento de Rede - col 3 */}
              <div className="md:col-span-3 bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex flex-col justify-between min-h-[130px]">
                <span className="font-semibold text-slate-300 block mb-1">Relações de Comunidade</span>
                <span className="text-[11px] text-slate-400 block mb-2 leading-tight">Como comunicamos progresso?</span>
                <textarea
                  value={localCanvas.customerRelations}
                  disabled={!canEdit}
                  onChange={(e) => setLocalCanvas(prev => ({ ...prev, customerRelations: e.target.value }))}
                  className="w-full flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:outline-none p-2 rounded text-slate-200 resize-none leading-normal text-[11px]"
                />
              </div>

              {/* Box 6: Canais de Promoção - col 6 */}
              <div className="md:col-span-6 bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex flex-col justify-between min-h-[130px]">
                <span className="font-semibold text-slate-300 block mb-1">Canais / Fluxos de Distribuição</span>
                <span className="text-[11px] text-slate-400 block mb-2 leading-tight">Como o subproduto do projeto atinge o pipeline?</span>
                <textarea
                  value={localCanvas.channels}
                  disabled={!canEdit}
                  onChange={(e) => setLocalCanvas(prev => ({ ...prev, channels: e.target.value }))}
                  className="w-full flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:outline-none p-2 rounded text-slate-200 resize-none leading-normal text-[11px]"
                />
              </div>

              {/* Box 7: Estrutura Estimada Custos - col 6 */}
              <div className="md:col-span-6 bg-slate-950 p-3.5 rounded-lg border border-rose-500/10 flex flex-col justify-between min-h-[130px]">
                <span className="font-semibold text-rose-400 block mb-1">Opex / Capex Estimado</span>
                <span className="text-[11px] text-slate-400 block mb-2 leading-tight">Onde residirá a maior despesa (serviços ou hardware)?</span>
                <textarea
                  value={localCanvas.costStructure}
                  disabled={!canEdit}
                  onChange={(e) => setLocalCanvas(prev => ({ ...prev, costStructure: e.target.value }))}
                  className="w-full flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:outline-none p-2 rounded text-slate-200 resize-none leading-normal text-[11px]"
                />
              </div>

              {/* Box 8: Benefícios Almejados - col 6 */}
              <div className="md:col-span-6 bg-slate-950 p-3.5 rounded-lg border border-emerald-500/10 flex flex-col justify-between min-h-[130px]">
                <span className="font-semibold text-emerald-400 block mb-1">Retorno de Valor (Benefícios)</span>
                <span className="text-[11px] text-slate-400 block mb-2 leading-tight">Quais métricas de vaidade ou eficiência atingiremos?</span>
                <textarea
                  value={localCanvas.expectedBenefitsValue}
                  disabled={!canEdit}
                  onChange={(e) => setLocalCanvas(prev => ({ ...prev, expectedBenefitsValue: e.target.value }))}
                  className="w-full flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:outline-none p-2 rounded text-slate-200 resize-none leading-normal text-[11px]"
                />
              </div>

            </div>
          </div>
        </div>
      ) : null}

      {/* 2. BUSINESS CASE HIGHLIGHTS - PROGRESSIVE DISCLOSURE IN ACTION */}
      {isBusinessCaseEnabled ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg animate-fade-in text-xs">
          <div className="p-5 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-100 font-display">
                Business Case Executivo (Relação de Retorno Financeiro)
              </h3>
            </div>
            
            <button
              onClick={handleBusinessSave}
              disabled={!canEdit}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-md text-xs transition-all flex items-center gap-1.5 shadow"
            >
              {businessSaved ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Save className="w-3.5 h-3.5" />}
              {businessSaved ? 'Salvo!' : 'Salvar Business Case'}
            </button>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-8 space-y-4">
              <div className="space-y-1">
                <label className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Declaração do Problema (Problem Statement)
                </label>
                <textarea
                  rows={2}
                  disabled={!canEdit}
                  value={localBusinessCase.problemStatement}
                  onChange={(e) => setLocalBusinessCase(prev => ({ ...prev, problemStatement: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 hover:border-slate-700 p-2.5 rounded text-slate-200 focus:border-indigo-500 focus:outline-none font-sans text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Solução Proposta (Engineered Approach)
                </label>
                <textarea
                  rows={2}
                  disabled={!canEdit}
                  value={localBusinessCase.solutionProposed}
                  onChange={(e) => setLocalBusinessCase(prev => ({ ...prev, solutionProposed: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-850 hover:border-slate-700 p-2.5 rounded text-slate-200 focus:border-indigo-500 focus:outline-none font-sans text-xs"
                />
              </div>
            </div>

            <div className="md:col-span-4 bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Retorno Esperado do Investimento (ROI)
                  </label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={localBusinessCase.returnOnInvestment}
                    onChange={(e) => setLocalBusinessCase(prev => ({ ...prev, returnOnInvestment: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-emerald-400 font-semibold text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Payback Projetado (Meses)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      disabled={!canEdit}
                      min="1"
                      value={localBusinessCase.paybackPeriodMonths}
                      onChange={(e) => setLocalBusinessCase(prev => ({ ...prev, paybackPeriodMonths: parseInt(e.target.value) || 1 }))}
                      className="w-20 bg-slate-900 border border-slate-800 p-2 rounded text-slate-200 font-mono text-xs"
                    />
                    <span className="text-xs text-slate-400 font-sans">Meses de Amortização</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-900 mt-4 text-[11px] text-slate-500 leading-snug">
                <span>Calculadora integrada com o DRE. Indica viabilidade financeira antecipada para o comitê de priorização de Portfólio.</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
