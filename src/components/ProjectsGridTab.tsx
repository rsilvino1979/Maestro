import React, { useState } from 'react';
import { Project, CanvasData, BusinessCaseData, BudgetLine, Milestone, Risk, FeatureKey, Persona, User, FinancialCategoryConfig } from '../types';
import { 
  Building2, Search, Sliders, Settings, ArrowLeft, LayoutGrid, FileText, 
  Coins, CalendarRange, Activity, Edit2, Trash2, Eye, HelpCircle, FileBarChart,
  List, Download, Calendar, Info
} from 'lucide-react';

// Import our modular sub-windows
import ProjectCanvas from './ProjectCanvas';
import BudgetTracker from './BudgetTracker';
import GanttMilestones from './GanttMilestones';
import RiskAnalysis from './RiskAnalysis';
import ProjectRoadmapTab from './ProjectRoadmapTab';

interface ProjectsGridTabProps {
  projects: Project[];
  activeTenantId: string;
  userRole: Persona;
  configAreasAtendidas: string[];
  configPilares: string[];
  configConsultores?: string[];
  configPorte?: string[];
  configPortfolios?: string[];
  configTemas?: string[];
  configFases?: string[];
  configFinancialCategories?: FinancialCategoryConfig[];
  users?: User[];
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onUpdateCanvas: (updatedCanvas: CanvasData) => void;
  onUpdateBusinessCase: (updatedBusiness: BusinessCaseData) => void;
  onAddBudgetLine: (line: Omit<BudgetLine, 'id'>) => void;
  onDeleteBudgetLine: (id: string) => void;
  onUpdateBudgetLine?: (line: BudgetLine) => void;
  onAddMilestone: (m: Omit<Milestone, 'id'>) => void;
  onDeleteMilestone: (id: string) => void;
  onUpdateMilestoneStatus: (id: string, status: Milestone['status'], progress: number) => void;
  onAddRisk: (r: Omit<Risk, 'id'>) => void;
  onDeleteRisk: (id: string) => void;
  onToggleFeature: (projectId: string, featureKey: FeatureKey) => void;
  onUpdateProjectFields?: (projectId: string, fields: Partial<Project>) => void;
}

type ProjectDetailSubTab = 'details_info' | 'roadmap' | 'canvas' | 'business_case' | 'budget' | 'gantt' | 'risks' | 'toggles';

export default function ProjectsGridTab({
  projects,
  activeTenantId,
  userRole,
  configAreasAtendidas,
  configPilares,
  configConsultores = [],
  configPorte = [],
  configPortfolios = [],
  configTemas = [],
  configFases = [],
  configFinancialCategories = [],
  users = [],
  onEdit,
  onDelete,
  onUpdateCanvas,
  onUpdateBusinessCase,
  onAddBudgetLine,
  onDeleteBudgetLine,
  onUpdateBudgetLine,
  onAddMilestone,
  onDeleteMilestone,
  onUpdateMilestoneStatus,
  onAddRisk,
  onDeleteRisk,
  onToggleFeature,
  onUpdateProjectFields
}: ProjectsGridTabProps) {
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<ProjectDetailSubTab>('details_info');
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Visualization & customization switches
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list');
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({
    demandId: true,
    name: true,
    score: true,
    requestingDept: true,
    strategicPillar: true,
    allocatedBudget: true,
    actualCost: true,
    sponsor: true,
    createdAt: true,
  });

  // Dedicated local edits for "Dados do Projeto" subtab
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [infoConsultant, setInfoConsultant] = useState('');
  const [infoStartDate, setInfoStartDate] = useState('');
  const [infoEndDate, setInfoEndDate] = useState('');
  const [infoPortfolio, setInfoPortfolio] = useState('');
  const [infoTheme, setInfoTheme] = useState('');
  const [infoPhase, setInfoPhase] = useState('');
  const [infoSize, setInfoSize] = useState('');
  const [infoStatus, setInfoStatus] = useState<'INTAKE' | 'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [infoNotes, setInfoNotes] = useState('');

  // Replanning custom confirmation modal states
  const [showReplanningDialog, setShowReplanningDialog] = useState(false);
  const [replanningJustification, setReplanningJustification] = useState('');
  const [pendingEndDate, setPendingEndDate] = useState('');

  React.useEffect(() => {
    if (selectedProject) {
      setInfoConsultant(selectedProject.consultant || '');
      setInfoStartDate(selectedProject.startDate || '');
      setInfoEndDate(selectedProject.endDate || '');
      setInfoPortfolio(selectedProject.portfolio || '');
      setInfoTheme(selectedProject.projectTheme || '');
      setInfoPhase(selectedProject.phase || '');
      setInfoSize(selectedProject.size || '');
      setInfoStatus(selectedProject.status);
      setInfoNotes(selectedProject.notes || '');
    }
  }, [selectedProjectId, selectedProject]);

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    const hasEndDateChanged = infoEndDate !== (selectedProject.endDate || '');

    if (hasEndDateChanged && selectedProject.endDate) {
      setPendingEndDate(infoEndDate);
      setReplanningJustification('');
      setShowReplanningDialog(true);
    } else {
      const updatedFields: Partial<Project> = {
        consultant: infoConsultant,
        startDate: infoStartDate,
        portfolio: infoPortfolio,
        projectTheme: infoTheme,
        phase: infoPhase,
        size: infoSize,
        status: infoStatus,
        notes: infoNotes,
      };

      if (!selectedProject.baselineEndDate && infoEndDate) {
        updatedFields.baselineEndDate = infoEndDate;
      }
      if (infoEndDate) {
        updatedFields.endDate = infoEndDate;
      }

      if (onUpdateProjectFields) {
        onUpdateProjectFields(selectedProject.id, updatedFields);
      }
      setIsEditingInfo(false);
    }
  };

  const handleConfirmReplanning = () => {
    if (!selectedProject || !onUpdateProjectFields) return;

    const previousCount = selectedProject.replanningCount || 0;
    const originalEndDate = selectedProject.endDate || '';
    const previousBaseline = selectedProject.baselineEndDate || originalEndDate;

    const newHistoryRecord = {
      date: new Date().toLocaleDateString('pt-BR'),
      lastPlannedDate: originalEndDate,
      newPlannedDate: pendingEndDate,
      justification: replanningJustification || 'Replanejamento estratégico autorizado.',
    };

    const newHistory = [
      ...(selectedProject.replanningHistory || []),
      newHistoryRecord
    ];

    const updatedFields: Partial<Project> = {
      consultant: infoConsultant,
      startDate: infoStartDate,
      endDate: pendingEndDate,
      lastPlannedEndDate: originalEndDate,
      baselineEndDate: previousBaseline,
      replanningCount: previousCount + 1,
      replanningHistory: newHistory,
      portfolio: infoPortfolio,
      projectTheme: infoTheme,
      phase: infoPhase,
      size: infoSize,
      status: infoStatus,
      notes: infoNotes,
    };

    onUpdateProjectFields(selectedProject.id, updatedFields);
    setShowReplanningDialog(false);
    setIsEditingInfo(false);
  };

  // Search/Filters states for main list
  const [searchQuery, setSearchQuery] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [pillarFilter, setPillarFilter] = useState('');

  // Extract tenant active/archived projects only (not INTAKE)
  const activeProjects = projects.filter(p => p.tenantId === activeTenantId && p.status !== 'INTAKE');

  // Filters logic
  const filteredProjects = activeProjects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArea = areaFilter === '' || p.requestingDept === areaFilter;
    const matchesPillar = pillarFilter === '' || p.strategicPillar === pillarFilter;
    return matchesSearch && matchesArea && matchesPillar;
  });

  // Return back to list trigger
  const handleBackToList = () => {
    setSelectedProjectId(null);
  };

  const handleOpenDetails = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSubTab('details_info'); // default detailed subtab
  };

  // Export to Excel-compatible CSV list helper for downstream
  const handleExportCSV = () => {
    if (filteredProjects.length === 0) {
      alert('Não há projetos exibidos sob os filtros atuais para exportação.');
      return;
    }

    const headers = [
      'ID Projeto', 'Nome do Projeto', 'Pontuação VMO', 'Resumo Escopo', 
      'Área Solicitante', 'Pilar Estratégico', 'Orçamento Autorizado (R$)', 
      'Realizado Total (R$)', 'Saldo Restante (R$)', 'Sponsor', 'Data de Criação'
    ];
    
    const rows = filteredProjects.map(p => {
      const actualTotalCost = p.budgetLines.reduce((acc, line) => acc + (line.actualCost || 0), 0);
      return [
        p.demandId ? `#${p.demandId}` : '',
        p.name,
        p.prioritizationScores.overallScore.toFixed(2),
        p.description.replace(/"/g, '""'),
        p.requestingDept || '',
        p.strategicPillar || '',
        p.allocatedBudget,
        actualTotalCost,
        p.allocatedBudget - actualTotalCost,
        p.sponsor || '',
        new Date(p.createdAt).toLocaleDateString('pt-BR')
      ];
    });

    // Build the CSV adding the UTF-8 BOM byte sequence so Excel auto-recognizes Portuguese characters
    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += headers.map(h => `"${h}"`).join(',') + '\n';
    rows.forEach(r => {
      csvContent += r.map(val => `"${val}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `VMO_Projetos_Downstream_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute stats helper
  const canEditToggles = userRole !== 'TEAM_MEMBER' && userRole !== 'PROJECT_MANAGER';

  if (selectedProject) {
    // Calculadora do realizado
    const totalAllocated = selectedProject.allocatedBudget;
    const totalActual = selectedProject.budgetLines.reduce((acc, l) => acc + (l.actualCost || 0), 0);
    const balance = totalAllocated - totalActual;
    const percentUsed = totalAllocated > 0 ? (totalActual / totalAllocated) * 100 : 0;

    return (
      <div className="space-y-6" id="project-details-view-screen">
        
        {/* Detail Head Title line and back nav */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-4.5 rounded-xl text-xs">
          <button
            onClick={handleBackToList}
            className="p-2 bg-slate-950 border border-slate-800 hover:border-indigo-500 hover:bg-slate-900 text-slate-350 hover:text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-400" />
            Voltar para Lista de Projetos
          </button>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] bg-slate-950 px-2 py-1 border border-slate-800 rounded font-bold text-slate-400">
              Demand ID: #{selectedProject.demandId || 'ACTIVE-00'}
            </span>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase text-[9.5px]">
              {selectedProject.status}
            </span>
          </div>
        </div>

        {/* Dynamic Project visual metadata card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-100 font-display line-clamp-1">{selectedProject.name}</h2>
              <p className="text-xs text-slate-400 leading-normal">{selectedProject.description}</p>
            </div>

            <div className="bg-slate-950 p-2 px-3 border border-slate-800 rounded-lg flex items-center gap-2 font-mono shrink-0">
              <span className="text-[10px] text-slate-500 uppercase font-bold">VMO Score:</span>
              <strong className="text-sm text-violet-400 font-extrabold">{selectedProject.prioritizationScores.overallScore.toFixed(2)}</strong>
            </div>
          </div>

          {/* Quick HUD Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-950/40 rounded-xl border border-slate-850/80 text-[11px] text-slate-400 leading-snug">
            <div>
              <span className="text-[8.5px] uppercase font-bold text-slate-500 block leading-none mb-1">Patrocinador</span>
              <span className="text-slate-300 font-semibold">{selectedProject.sponsor || 'Interno'}</span>
            </div>
            <div>
              <span className="text-[8.5px] uppercase font-bold text-slate-500 block leading-none mb-1">Área Solicitante</span>
              <span className="text-slate-300 font-semibold">{selectedProject.requestingDept || 'Geral'}</span>
            </div>
            <div>
              <span className="text-[8.5px] uppercase font-bold text-slate-500 block leading-none mb-1">Pilar Estratégico</span>
              <span className="text-slate-350">{selectedProject.strategicPillar}</span>
            </div>
            <div>
              <span className="text-[8.5px] uppercase font-bold text-slate-500 block leading-none mb-1">Orçamento Alocado (Budget)</span>
              <span className="text-emerald-450 font-semibold font-mono text-xs">
                R$ {totalAllocated.toLocaleString('pt-BR')}
              </span>
            </div>

            {selectedProject.involvedAreas && selectedProject.involvedAreas.length > 0 && (
              <div className="col-span-1 md:col-span-4 border-t border-slate-900 pt-3 mt-1 flex flex-wrap gap-1.5 items-center">
                <span className="text-[8.5px] uppercase font-bold text-slate-500 mr-2 block leading-none">Áreas Envolvidas:</span>
                {selectedProject.involvedAreas.map(a => (
                  <span key={a} className="bg-slate-900 border border-slate-800 text-slate-350 px-2 py-0.5 rounded text-[10px] truncate max-w-[150px]">
                    {a}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Finance summary tracking meter */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 text-[11px] border-t border-slate-800/40">
            <div className="flex justify-between sm:block space-y-0.5">
              <span className="text-slate-500 block text-[9.5px] uppercase font-bold">Total Gasto (Realizado):</span>
              <strong className="text-slate-200 font-mono">R$ {totalActual.toLocaleString('pt-BR')}</strong>
            </div>
            
            <div className="flex justify-between sm:block space-y-0.5">
              <span className="text-slate-500 block text-[9.5px] uppercase font-bold">Saldo do Orçamento:</span>
              <strong className={`font-mono ${balance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                R$ {balance.toLocaleString('pt-BR')}
              </strong>
            </div>

            <div className="space-y-1.5">
              <span className="text-slate-500 text-[9.5px] uppercase font-bold flex justify-between">
                <span>Percentual Consumido:</span>
                <span className="font-mono font-semibold">{percentUsed.toFixed(1)}%</span>
              </span>
              <div className="w-full bg-slate-950 h-2 border border-slate-850 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${percentUsed > 100 ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, percentUsed)}%` }}
                ></div>
              </div>
            </div>
          </div>

        </div>

         {/* TABS NAVIGATION BAR SYSTEM FOR DETAILS */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-1.5 flex flex-wrap gap-1.5 items-center justify-start shadow-sm">
          {[
            { id: 'details_info', label: 'Dados', fullTitle: 'Dados do Projeto', icon: Info },
            { id: 'roadmap', label: 'Roadmap', fullTitle: 'Roadmap de Entregas (com Replanning)', icon: Calendar },
            { id: 'canvas', label: 'Canvas', fullTitle: 'Project Canvas', icon: LayoutGrid },
            { id: 'business_case', label: 'Business Case', fullTitle: 'Business Case', icon: FileBarChart },
            { id: 'budget', label: 'Financeiro', fullTitle: 'Acompanhamento Financeiro (Capex/Opex)', icon: Coins },
            { id: 'gantt', label: 'Cronograma', fullTitle: 'Cronograma de Marcos (Agile-Gantt)', icon: CalendarRange },
            { id: 'risks', label: 'Riscos', fullTitle: 'Matriz de Riscos (P x I)', icon: Activity },
            { id: 'toggles', label: 'Módulos', fullTitle: 'Ativar/Desativar Módulos do Projeto', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id as ProjectDetailSubTab)}
                title={tab.fullTitle}
                className={`py-2 px-3.5 text-xs rounded-lg transition-all flex items-center gap-2 cursor-pointer border select-none ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-md border-indigo-500/40 font-bold' 
                    : 'bg-slate-950/60 text-slate-300 hover:text-white hover:bg-slate-850 border-slate-800/80 font-medium'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-indigo-400'}`} />
                <span className="whitespace-nowrap leading-none">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* RENDER DETAILED TAB MODULES */}
        <div className="animate-fade-in text-xs">
          
          {subTab === 'details_info' && (
            <div className="space-y-6">
              
              {/* Custom Replanning Modal Overlay */}
              {showReplanningDialog && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in">
                  <div className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                    <div className="flex items-center gap-3 text-amber-400">
                      <div className="p-2 bg-amber-500/10 rounded-lg">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-100 font-display">Confirmar Replanejamento</h3>
                        <p className="text-[10px] text-amber-400 font-medium">Justificativa de alteração de data final</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-slate-300 text-[11px] leading-relaxed">
                      <p>
                        Você está alterando a data de término do projeto de <span className="font-mono bg-slate-950 px-1.5 py-0.5 rounded text-amber-300 font-bold">{selectedProject.endDate || 'N/A'}</span> para <span className="font-mono bg-slate-950 px-1.5 py-0.5 rounded text-emerald-300 font-bold">{pendingEndDate}</span>.
                      </p>
                      <p className="text-slate-450 italic">
                        Esta ação será registrada como um evento de replanejamento na governança PMO.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-sans text-[10px] font-bold uppercase tracking-wider block">Justificativa do Replanejamento</label>
                      <textarea
                        required
                        rows={3}
                        value={replanningJustification}
                        onChange={(e) => setReplanningJustification(e.target.value)}
                        placeholder="Digite o motivo detalhado desta alteração (ex: Mudança de cenário, novos requisitos pelo Sponsor, etc.)"
                        className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-slate-205 focus:outline-none placeholder-slate-600 focus:border-amber-500/50"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
                      <button
                        type="button"
                        onClick={() => setShowReplanningDialog(false)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded text-[11px] font-semibold transition"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={!replanningJustification.trim()}
                        onClick={handleConfirmReplanning}
                        className={`px-3 py-1.5 rounded text-[11px] font-extrabold transition flex items-center gap-1.5 ${
                          replanningJustification.trim()
                            ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Confirmar Replanejamento
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* View / Edit main card */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
                
                <div className="flex justify-between items-center pb-4 border-b border-slate-800/60">
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350">Dados Cadastrais do Projeto</h3>
                    <p className="text-[10px] text-slate-400">Gerenciamento de baseline, cronograma planejado e auditoria do VMO.</p>
                  </div>
                  
                  {!isEditingInfo && (
                    <button
                      onClick={() => setIsEditingInfo(true)}
                      className="px-3 py-1.5 bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-400 border border-indigo-500/20 rounded-lg text-[11.5px] font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Editar Dados Cadastrais
                    </button>
                  )}
                </div>

                {!isEditingInfo ? (
                  /* VIEW MODE */
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      
                      {/* Subcard 1 */}
                      <div className="bg-slate-950/45 p-4 rounded-xl border border-slate-850/80 space-y-2">
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider font-extrabold block">Atribuição e Alocação</span>
                        <div className="space-y-4 pt-1.5">
                          <div>
                            <span className="text-slate-450 text-[10px] block">Gerente de Projeto</span>
                            <span className="text-slate-205 text-xs font-semibold">{selectedProject.consultant || 'Não Atribuído'}</span>
                          </div>
                          <div>
                            <span className="text-slate-450 text-[10px] block">Portfólio VMO</span>
                            <span className="text-slate-205 text-xs font-semibold">{selectedProject.portfolio || 'Sem Portfólio Definido'}</span>
                          </div>
                          <div>
                            <span className="text-slate-450 text-[10px] block">Tema Estratégico</span>
                            <span className="text-slate-205 text-xs font-semibold">{selectedProject.projectTheme || 'Geral'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Subcard 2 */}
                      <div className="bg-slate-950/45 p-4 rounded-xl border border-slate-850/80 space-y-2">
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider font-extrabold block">Datas e Cronograma</span>
                        <div className="space-y-4 pt-1.5">
                          <div>
                            <span className="text-slate-450 text-[10px] block">Data de Início</span>
                            <span className="text-slate-205 text-xs font-semibold font-mono">{selectedProject.startDate ? new Date(selectedProject.startDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não Definida'}</span>
                          </div>
                          <div>
                            <span className="text-slate-450 text-[10px] block">Data de Fim (Planejada)</span>
                            <span className="text-emerald-400 text-xs font-bold font-mono">{selectedProject.endDate ? new Date(selectedProject.endDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não Definida'}</span>
                          </div>
                          <div>
                            <span className="text-slate-450 text-[10px] block">Fase do Projeto</span>
                            <span className="text-indigo-300 text-xs font-bold">{selectedProject.phase || 'Nenhuma'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Subcard 3 */}
                      <div className="bg-slate-950/45 p-4 rounded-xl border border-slate-850/80 space-y-2">
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider font-extrabold block">Porte e Status</span>
                        <div className="space-y-4 pt-1.5">
                          <div>
                            <span className="text-slate-450 text-[10px] block">Porte do Projeto</span>
                            <span className="text-slate-205 text-xs font-semibold">{selectedProject.size || 'Múltiplo'}</span>
                          </div>
                          <div>
                            <span className="text-slate-450 text-[10px] block">Status de Fluxo</span>
                            <span className="inline-block bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded px-1.5 py-0.2 font-bold text-[10px]">
                              {selectedProject.status}
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Timeline of Reanimations / Replanning Tracker block */}
                    <div className="bg-slate-950/50 p-4.5 rounded-xl border border-slate-850/80 space-y-3.5">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-amber-500" />
                          Auditoria de Replanejamentos de Cronograma
                        </h4>
                        
                        <div className="flex items-center gap-2 font-mono text-[10px]">
                          <span className="bg-slate-900 border border-slate-800 text-slate-400 px-2.5 py-0.5 rounded font-bold">
                            Total: <strong className="text-amber-400">{selectedProject.replanningCount || 0}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] bg-slate-900/40 p-3 rounded-lg border border-slate-850">
                        <div>
                          <span className="text-slate-500 text-[10px] block">Data Baseline Inicial</span>
                          <span className="text-slate-300 font-mono font-semibold">
                            {selectedProject.baselineEndDate ? new Date(selectedProject.baselineEndDate + 'T00:00:00').toLocaleDateString('pt-BR') : (selectedProject.endDate ? new Date(selectedProject.endDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Baseline não fixado')}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Última Data Planejada (Anterior)</span>
                          <span className={`${selectedProject.lastPlannedEndDate ? 'text-amber-400' : 'text-slate-500'} font-mono font-semibold`}>
                            {selectedProject.lastPlannedEndDate ? new Date(selectedProject.lastPlannedEndDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não houveram replanejamentos anteriores'}
                          </span>
                        </div>
                      </div>

                      {/* Replanning History Timeline */}
                      {selectedProject.replanningHistory && selectedProject.replanningHistory.length > 0 && (
                        <div className="space-y-2 pt-1 border-t border-slate-900">
                          <span className="text-[10px] text-slate-500 font-mono block">Timeline de Justificativas:</span>
                          <div className="space-y-2 max-h-[150px] overflow-y-auto">
                            {selectedProject.replanningHistory.map((hist, idx) => (
                              <div key={idx} className="bg-slate-900/70 p-3 rounded-lg border border-slate-850/60 flex flex-col gap-1 leading-normal">
                                <div className="flex justify-between items-center font-mono text-[9px] text-slate-500">
                                  <span>📅 {hist.date}</span>
                                  <span>De <strong className="text-rose-400 font-normal">{hist.lastPlannedDate ? new Date(hist.lastPlannedDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'}</strong> para <strong className="text-emerald-400 font-normal">{hist.newPlannedDate ? new Date(hist.newPlannedDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'}</strong></span>
                                </div>
                                <p className="text-slate-300 italic text-[10.5px]">" {hist.justification} "</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Observações textblock */}
                    <div className="bg-slate-950/20 p-4 rounded-xl border border-slate-850 space-y-1.5">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider font-extrabold block">Observações do Projeto</span>
                      <p className="text-slate-300 text-[11.5px] leading-relaxed whitespace-pre-wrap">
                        {selectedProject.notes || 'Nenhuma observação ou anotação cadastrada para esta iniciativa.'}
                      </p>
                    </div>

                  </div>
                ) : (
                  /* EDIT FORM MODE */
                  <form onSubmit={handleSaveInfo} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="space-y-1">
                        <label className="text-slate-450 font-mono text-[9.5px] font-bold uppercase tracking-wide block">Gerente de Projeto Responsável</label>
                        <select
                          value={infoConsultant}
                          onChange={(e) => setInfoConsultant(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-200 focus:outline-none cursor-pointer text-xs"
                        >
                          <option value="">-- Selecione o Gerente de Projeto --</option>
                          {users.filter(u => u.tenantId === activeTenantId && u.role === 'PROJECT_MANAGER').map(u => (
                            <option key={u.id} value={u.name}>{u.name} ({u.email})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-450 font-mono text-[9.5px] font-bold uppercase tracking-wide block">Portfólio</label>
                        <select
                          value={infoPortfolio}
                          onChange={(e) => setInfoPortfolio(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-205 focus:outline-none cursor-pointer"
                        >
                          <option value="">-- Selecione o Portfólio --</option>
                          {configPortfolios.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-450 font-mono text-[9.5px] font-bold uppercase tracking-wide block">Tema do Projeto</label>
                        <select
                          value={infoTheme}
                          onChange={(e) => setInfoTheme(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-205 focus:outline-none cursor-pointer"
                        >
                          <option value="">-- Selecione o Tema --</option>
                          {configTemas.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-450 font-mono text-[9.5px] font-bold uppercase tracking-wide block">Fase Atual</label>
                        <select
                          value={infoPhase}
                          onChange={(e) => setInfoPhase(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-205 focus:outline-none cursor-pointer"
                        >
                          <option value="">-- Selecione a Fase --</option>
                          {configFases.map(f => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-450 font-mono text-[9.5px] font-bold uppercase tracking-wide block">Porte</label>
                        <select
                          value={infoSize}
                          onChange={(e) => setInfoSize(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-205 focus:outline-none cursor-pointer"
                        >
                          <option value="">-- Selecione o Porte --</option>
                          {configPorte.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-450 font-mono text-[9.5px] font-bold uppercase tracking-wide block">Status</label>
                        <select
                          value={infoStatus}
                          onChange={(e) => setInfoStatus(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-205 focus:outline-none cursor-pointer"
                        >
                          <option value="INTAKE">INTAKE</option>
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="ARCHIVED">ARCHIVED</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-450 font-mono text-[9.5px] font-bold uppercase tracking-wide block">Data de Início</label>
                        <input
                          type="date"
                          value={infoStartDate}
                          onChange={(e) => setInfoStartDate(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-205 font-mono focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-450 font-mono text-[9.5px] font-bold uppercase tracking-wide block">Data Fim <span className="text-amber-400 font-sans font-bold">(Altera Baseline)</span></label>
                        <input
                          type="date"
                          value={infoEndDate}
                          onChange={(e) => setInfoEndDate(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-805 p-2 rounded text-slate-200 font-mono font-bold focus:outline-none focus:border-amber-500/40"
                        />
                      </div>

                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-450 font-mono text-[9.5px] font-bold uppercase tracking-wide block">Observações do Projeto</label>
                      <textarea
                        rows={3}
                        value={infoNotes}
                        onChange={(e) => setInfoNotes(e.target.value)}
                        placeholder="Insira detalhes consultivos, notas gerais ou comentários operacionais..."
                        className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-slate-205 focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingInfo(false);
                          // Restore states
                          if (selectedProject) {
                            setInfoConsultant(selectedProject.consultant || '');
                            setInfoStartDate(selectedProject.startDate || '');
                            setInfoEndDate(selectedProject.endDate || '');
                            setInfoPortfolio(selectedProject.portfolio || '');
                            setInfoTheme(selectedProject.projectTheme || '');
                            setInfoPhase(selectedProject.phase || '');
                            setInfoSize(selectedProject.size || '');
                            setInfoStatus(selectedProject.status);
                            setInfoNotes(selectedProject.notes || '');
                          }
                        }}
                        className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded font-bold transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded shadow-md transition cursor-pointer"
                      >
                        Salvar Alterações
                      </button>
                    </div>

                  </form>
                )}

              </div>
            </div>
          )}

          {subTab === 'roadmap' && (
            <ProjectRoadmapTab
              project={selectedProject}
              allProjects={projects}
              users={users}
              userRole={userRole}
              onUpdateProjectFields={onUpdateProjectFields || (() => {})}
            />
          )}

          {subTab === 'canvas' && (
            <ProjectCanvas
              project={selectedProject}
              onUpdateCanvas={onUpdateCanvas}
              onUpdateBusinessCase={onUpdateBusinessCase}
              canEdit={userRole !== 'TEAM_MEMBER'}
              onlyShow="canvas"
            />
          )}

          {subTab === 'business_case' && (
            <ProjectCanvas
              project={selectedProject}
              onUpdateCanvas={onUpdateCanvas}
              onUpdateBusinessCase={onUpdateBusinessCase}
              canEdit={userRole !== 'TEAM_MEMBER'}
              onlyShow="business_case"
            />
          )}

          {subTab === 'budget' && (
            <BudgetTracker
              project={selectedProject}
              configFinancialCategories={configFinancialCategories}
              onAddBudgetLine={onAddBudgetLine}
              onDeleteBudgetLine={onDeleteBudgetLine}
              onUpdateBudgetLine={(updatedLine) => {
                if (onUpdateBudgetLine) {
                  onUpdateBudgetLine(updatedLine);
                } else if (onUpdateProjectFields) {
                  const updatedLines = selectedProject.budgetLines.map(line => line.id === updatedLine.id ? updatedLine : line);
                  onUpdateProjectFields(selectedProject.id, { budgetLines: updatedLines });
                }
              }}
              onUpdateProjectBudgets={(projectId, targets, cashFlow, lines) => {
                if (onUpdateProjectFields) {
                  onUpdateProjectFields(projectId, {
                    budgetTargets: targets,
                    cashFlowEntries: cashFlow,
                    budgetLines: lines
                  });
                }
              }}
              userRole={userRole}
            />
          )}

          {subTab === 'gantt' && (
            <GanttMilestones
              project={selectedProject}
              onAddMilestone={onAddMilestone}
              onDeleteMilestone={onDeleteMilestone}
              onUpdateMilestoneStatus={onUpdateMilestoneStatus}
              userRole={userRole}
            />
          )}

          {subTab === 'risks' && (
            <RiskAnalysis
              project={selectedProject}
              onAddRisk={onAddRisk}
              onDeleteRisk={onDeleteRisk}
              userRole={userRole}
            />
          )}

          {subTab === 'toggles' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350 flex items-center gap-1.5">
                  <Settings className="w-5 h-5 text-indigo-400" />
                  Ativar Módulos do Projeto (Feature Toggles)
                </h3>
              </div>

              {!canEditToggles && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/15 rounded text-amber-400 text-xs text-left">
                  <strong>Somente Leitura:</strong> Seu papel (Persona) atual não possui privilégios de gravação para ativar ou desativar os módulos deste projeto.
                </div>
              )}

              <p className="text-[11px] text-slate-400 max-w-2xl leading-normal">
                Habilite progressive disclosure tático habilitando ou removendo visualizações de execução para este projeto. Desativados não aparecerão no menu principal de navegação.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 text-xs">
                
                {[
                  { key: 'canvas', name: 'Canvas de Projeto', desc: 'Ativa o modelo do canvas de pitch tático.' },
                  { key: 'business_case', name: 'Business Case Simplificado', desc: 'Habilita declaração de escopo, retorno e ROI.' },
                  { key: 'budget', name: 'Acompanhamento Financeiro', desc: 'Ajuste de Capex/Opex e acompanhamento do saldo.' },
                  { key: 'gantt', name: 'Cronograma Híbrido', desc: 'Habilita Gantt de marcos interativos.' },
                  { key: 'risks', name: 'Matriz de Riscos (PxI)', desc: 'Prevensão e plotagem heatmap de contingência.' }
                ].map(item => {
                  return (
                    <div key={item.key} className="flex justify-between items-center p-3.5 bg-slate-950/60 rounded-xl border border-slate-850">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-200">{item.name}</span>
                        <p className="text-[10px] text-slate-500">{item.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        disabled={!canEditToggles}
                        checked={selectedProject.features[item.key as FeatureKey]}
                        onChange={() => onToggleFeature(selectedProject.id, item.key as FeatureKey)}
                        className="accent-indigo-505 w-4.5 h-4.5 rounded cursor-pointer shrink-0 disabled:opacity-40"
                      />
                    </div>
                  );
                })}

              </div>
            </div>
          )}

        </div>

      </div>
    );
  }

  return (
    <div className="space-y-6" id="projects-list-tab">
      
      {/* Search Header visual controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-base font-bold text-slate-100 font-display">Tabela de Projetos Downstream</h1>
            <p className="text-xs text-slate-400">Portfólio de iniciativas e projetos ativos sob execução, acompanhamento de cronogramas e orçamentos.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Switcher */}
            <div className="bg-slate-950 p-1 border border-slate-800 rounded-lg flex items-center gap-0.5">
              <button
                onClick={() => setViewMode('card')}
                className={`p-1.5 px-3 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                  viewMode === 'card' ? 'bg-indigo-650 text-white shadow-md' : 'text-slate-400 hover:text-slate-100'
                }`}
                title="Modo Card"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 px-3 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                  viewMode === 'list' ? 'bg-indigo-650 text-white shadow-md' : 'text-slate-400 hover:text-slate-100'
                }`}
                title="Modo Lista"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabela</span>
              </button>
            </div>

            {/* Toggle Columns visibility configurator */}
            <button
              onClick={() => setIsCustomizeOpen(!isCustomizeOpen)}
              className={`p-2 px-3 bg-slate-950 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                isCustomizeOpen ? 'bg-slate-850 border-slate-700 text-slate-100' : ''
              }`}
            >
              <Sliders className="w-4 h-4 text-indigo-400" />
              Campos Exibidos
            </button>

            {/* Download Excel helper */}
            <button
              onClick={handleExportCSV}
              className="p-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow"
            >
              <Download className="w-4 h-4" />
              Exportar p/ Excel
            </button>
          </div>
        </div>

        {/* Dynamic Personalize Field Columns collapsing wrapper */}
        {isCustomizeOpen && (
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 animate-fade-in space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase text-indigo-400 block tracking-wide">Marque os campos que deseja visualizar:</span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 pt-1 text-xs">
              {Object.keys(visibleFields).map((field) => {
                const labelsMap: Record<string, string> = {
                  demandId: 'ID Projeto',
                  name: 'Nome do Projeto',
                  score: 'Priorização Score',
                  requestingDept: 'Área Solicitante',
                  strategicPillar: 'Pilar Estratégico',
                  allocatedBudget: 'Orçamento Alocado',
                  actualCost: 'Realizado (Gasto)',
                  sponsor: 'Patrocinador',
                  createdAt: 'Data Cadastro'
                };
                return (
                  <label key={field} className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
                    <input
                      type="checkbox"
                      checked={visibleFields[field]}
                      onChange={(e) => setVisibleFields(prev => ({ ...prev, [field]: e.target.checked }))}
                      className="accent-indigo-505 w-4 h-4 rounded text-indigo-600 bg-slate-900 border-none cursor-pointer"
                    />
                    <span>{labelsMap[field] || field}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Real-time filtering controls column row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950/40 p-3.5 rounded-lg border border-slate-850">
          
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Pesquisar projetos por nome, escopo, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-555 hover:border-slate-700 pl-9 p-2 rounded text-xs text-slate-200 outline-none"
            />
          </div>

          <div>
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 p-2 rounded text-xs text-slate-300 cursor-pointer outline-none font-medium"
            >
              <option value="">Todas áreas solicitantes</option>
              {configAreasAtendidas.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={pillarFilter}
              onChange={(e) => setPillarFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 p-2 rounded text-xs text-slate-300 cursor-pointer outline-none font-medium"
            >
              <option value="">Todos pilares estratégicos</option>
              {configPilares.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Projects listing Layout (Card Grid vs Compact Spreadsheet List) */}
      {filteredProjects.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-12 rounded-xl text-center text-xs text-slate-400 italic">
          Nenhum projeto ativo ou finalizado atende aos critérios dos filtros de cabeçalho definidos atualmente.
        </div>
      ) : viewMode === 'card' ? (
        
        // CARD DETAILED GRID VIEW
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((p) => {
            const actualTotalCost = p.budgetLines.reduce((acc, line) => acc + (line.actualCost || 0), 0);
            
            return (
              <div 
                key={p.id}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-900 p-5 rounded-xl flex flex-col justify-between gap-4 transition-all hover:shadow shadow-sm font-sans"
              >
                
                <div className="space-y-3">
                  {/* Top lines demand ID + dates */}
                  <div className="flex justify-between items-start gap-1 pb-2 border-b border-slate-800/40">
                    <div className="flex items-center gap-2">
                      {visibleFields.demandId && (
                        <span className="bg-indigo-505/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono text-[9.5px] font-bold">
                          #{p.demandId || 'PROJECT'}
                        </span>
                      )}
                      {visibleFields.createdAt && (
                        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Cadastro em {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>

                    {visibleFields.score && (
                      <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 border border-slate-850 rounded font-mono text-[10px]">
                        <span className="text-slate-500 font-bold uppercase">VMO score:</span>
                        <span className="font-extrabold text-violet-420">{p.prioritizationScores.overallScore.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    {visibleFields.name && (
                      <h3 className="font-bold text-slate-100 text-xs tracking-tight leading-snug font-display line-clamp-1">{p.name}</h3>
                    )}
                    <p className="text-[11px] text-slate-450 leading-normal line-clamp-2">{p.description}</p>
                  </div>
                  
                  {/* Metadata keyfield badges */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/40 rounded-lg border border-slate-850/60 text-[10.5px]">
                    {visibleFields.requestingDept && (
                      <div>
                        <span className="text-[8.5px] text-slate-500 uppercase font-bold block mb-0.5">Área Solicitante</span>
                        <span className="text-slate-300 font-semibold truncate block">{p.requestingDept || 'Não Informado'}</span>
                      </div>
                    )}

                    {visibleFields.strategicPillar && (
                      <div>
                        <span className="text-[8.5px] text-slate-500 uppercase font-bold block mb-0.5">Pilar Principal</span>
                        <span className="text-slate-300 font-semibold truncate block">{p.strategicPillar || 'Operações'}</span>
                      </div>
                    )}

                    {visibleFields.sponsor && (
                      <div className="col-span-2 border-t border-slate-900/60 pt-1.5">
                        <span className="text-[8.5px] text-slate-500 uppercase font-bold block mb-0.5">Patrocinador (Sponsor)</span>
                        <span className="text-slate-300 font-medium truncate block">{p.sponsor || 'Geral'}</span>
                      </div>
                    )}
                  </div>

                  {/* Allocated Budget stats panel */}
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 grid grid-cols-2 gap-2 text-[10.5px]">
                    {visibleFields.allocatedBudget && (
                      <div>
                        <span className="text-[8.5px] text-slate-505 uppercase font-bold block">Orçamento Alocado</span>
                        <span className="text-emerald-400 font-bold font-mono">
                          R$ {p.allocatedBudget.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    )}
                    {visibleFields.actualCost && (
                      <div>
                        <span className="text-[8.5px] text-slate-550 uppercase font-bold block text-right">Realizado Total</span>
                        <span className="text-slate-200 font-bold font-mono block text-right">
                          R$ {actualTotalCost.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* operations footer panel */}
                <div className="pt-3.5 border-t border-slate-850 flex justify-between items-center bg-slate-900 mt-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(p)}
                      className="p-1 px-2.5 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                      Editar
                    </button>
                    <button
                      onClick={() => onDelete(p.id)}
                      className="p-1 px-2 text-rose-500 hover:text-rose-450 hover:bg-rose-500/10 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Apagar
                    </button>
                  </div>

                  <button
                    onClick={() => handleOpenDetails(p.id)}
                    className="p-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] rounded transition-all shadow flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-200" />
                    Gerenciar Projeto
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        
        // COMPACT SPREADSHEET TABLE VIEW
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-left text-slate-300 divide-y divide-slate-800">
              <thead className="bg-slate-950/40 text-[9px] uppercase tracking-wider text-slate-500 font-mono">
                <tr>
                  {visibleFields.demandId && <th className="p-3.5">ID</th>}
                  {visibleFields.name && <th className="p-3.5">Nome do Projeto</th>}
                  {visibleFields.score && <th className="p-3.5 text-center">Score VMO</th>}
                  {visibleFields.requestingDept && <th className="p-3.5">Área Solicitante</th>}
                  {visibleFields.strategicPillar && <th className="p-3.5">Pilar Estratégico</th>}
                  {visibleFields.allocatedBudget && <th className="p-3.5">Orçamento Alocado</th>}
                  {visibleFields.actualCost && <th className="p-3.5">Realizado Total</th>}
                  {visibleFields.sponsor && <th className="p-3.5">Sponsor</th>}
                  {visibleFields.createdAt && <th className="p-3.5">Data Cadastro</th>}
                  <th className="p-3.5 text-right">Gerenciamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 bg-slate-900/30">
                {filteredProjects.map((p) => {
                  const actualTotalCost = p.budgetLines.reduce((acc, line) => acc + (line.actualCost || 0), 0);
                  
                  return (
                    <tr key={p.id} className="hover:bg-slate-850/30 transition-colors">
                      {visibleFields.demandId && (
                        <td className="p-3.5 font-mono text-indigo-400 font-semibold">
                          #{p.demandId || 'PRJ'}
                        </td>
                      )}

                      {visibleFields.name && (
                        <td className="p-3.5 max-w-[220px]">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-100 text-xs block leading-snug line-clamp-1">{p.name}</span>
                            <span className="text-[10px] text-slate-500 truncate block">{p.description}</span>
                          </div>
                        </td>
                      )}

                      {visibleFields.score && (
                        <td className="p-3.5 text-center font-mono font-extrabold text-xs text-violet-400">
                          {p.prioritizationScores.overallScore.toFixed(2)}
                        </td>
                      )}

                      {visibleFields.requestingDept && (
                        <td className="p-3.5 font-medium text-slate-300">
                          {p.requestingDept || 'Geral'}
                        </td>
                      )}

                      {visibleFields.strategicPillar && (
                        <td className="p-3.5 text-slate-400">
                          {p.strategicPillar || 'Operações'}
                        </td>
                      )}

                      {visibleFields.allocatedBudget && (
                        <td className="p-3.5 text-emerald-400 font-mono font-bold">
                          R$ {p.allocatedBudget.toLocaleString('pt-BR')}
                        </td>
                      )}

                      {visibleFields.actualCost && (
                        <td className="p-3.5 text-slate-300 font-mono">
                          R$ {actualTotalCost.toLocaleString('pt-BR')}
                        </td>
                      )}

                      {visibleFields.sponsor && (
                        <td className="p-3.5 text-slate-400">
                          {p.sponsor || 'Geral'}
                        </td>
                      )}

                      {visibleFields.createdAt && (
                        <td className="p-3.5 text-slate-500 font-mono text-[10px]">
                          {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                      )}

                      <td className="p-3.5 text-right shrink-0">
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => onEdit(p)}
                            className="p-1 px-1.5 bg-slate-950 border border-slate-850 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                          </button>
                          <button
                            onClick={() => onDelete(p.id)}
                            className="p-1 px-1.5 text-rose-500 hover:bg-rose-500/10 rounded transition cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenDetails(p.id)}
                            className="p-1 px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded flex items-center gap-0.5 shadow transition cursor-pointer"
                            title="Acessar Painel Integrado"
                          >
                            <Eye className="w-3 h-3 text-indigo-200" />
                            Acessar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
