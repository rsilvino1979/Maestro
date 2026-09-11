import React, { useState, useMemo } from 'react';
import { Portfolio, Project, Persona, PortfolioCategory, PortfolioStatus } from '../types';
import { 
  FolderKanban, Plus, Edit2, Trash2, Check, X, Shield, 
  TrendingUp, Coins, Target, Layers, ChevronRight, Eye, 
  BarChart3, Award, CheckCircle2, AlertCircle, Sparkles, Building2, User
} from 'lucide-react';

interface PortfolioManagementTabProps {
  portfolios: Portfolio[];
  onSavePortfolio: (portfolio: Portfolio) => void;
  onDeletePortfolio: (id: string) => void;
  projects: Project[];
  activeTenantId: string;
  userRole: Persona;
  configAreasAtendidas: string[];
  configPilares: string[];
  configConsultores?: string[];
  onSelectPortfolioFilter?: (portfolioName: string) => void;
}

export default function PortfolioManagementTab({
  portfolios,
  onSavePortfolio,
  onDeletePortfolio,
  projects,
  activeTenantId,
  userRole,
  configAreasAtendidas,
  configPilares,
  configConsultores = [],
  onSelectPortfolioFilter
}: PortfolioManagementTabProps) {
  const canEdit = userRole !== 'TEAM_MEMBER';

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);

  // Detail Drawer / Modal state
  const [selectedDetailPortfolio, setSelectedDetailPortfolio] = useState<Portfolio | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formThesis, setFormThesis] = useState('');
  const [formCategory, setFormCategory] = useState<string>('Inovação');
  const [formStatus, setFormStatus] = useState<PortfolioStatus>('Ativo');
  const [formSponsor, setFormSponsor] = useState('');
  const [formManager, setFormManager] = useState('');
  const [formArea, setFormArea] = useState('');
  const [formPillar, setFormPillar] = useState('');
  const [formOKR, setFormOKR] = useState('');
  const [formHorizon, setFormHorizon] = useState('2026 - Q1 a Q4');

  // Filter & Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Compute bottom-up financial and value metrics for a single portfolio
  const getPortfolioMetrics = (portfolio: Portfolio) => {
    const linkedProjects = projects.filter(p => 
      p.tenantId === activeTenantId && 
      (p.portfolio === portfolio.name || p.portfolio === portfolio.id)
    );

    let plannedCapEx = 0;
    let realizedCapEx = 0;
    let plannedOpEx = 0;
    let realizedOpEx = 0;
    let benefitTarget = 0;
    let valueCapturedRealized = 0;
    let valueCapturedProjected = 0;

    linkedProjects.forEach(p => {
      // 1. CapEx & OpEx Targets vs Realized
      if (p.budgetTargets && p.budgetTargets.length > 0) {
        p.budgetTargets.forEach(t => {
          if (t.type === 'CAPEX') plannedCapEx += t.targetAmount;
          if (t.type === 'OPEX') plannedOpEx += t.targetAmount;
          if (t.type === 'RESULTADO_ESPERADO' && (!t.unitType || t.unitType === 'CURRENCY')) {
            benefitTarget += t.targetAmount;
          }
        });
      } else if (p.budgetLines && p.budgetLines.length > 0) {
        p.budgetLines.forEach(l => {
          if (l.type === 'CAPEX') plannedCapEx += l.baselineCost;
          if (l.type === 'OPEX') plannedOpEx += l.baselineCost;
        });
      }

      // 2. Realized Cash Flows
      if (p.cashFlowEntries && p.cashFlowEntries.length > 0) {
        p.cashFlowEntries.forEach(c => {
          if (c.type === 'CAPEX' && c.status === 'REALIZADO') realizedCapEx += c.amount;
          if (c.type === 'OPEX' && c.status === 'REALIZADO') realizedOpEx += c.amount;
          if (c.type === 'RESULTADO_REALIZADO' && (!c.unitType || c.unitType === 'CURRENCY')) {
            if (c.status === 'REALIZADO') valueCapturedRealized += c.amount;
            if (c.status === 'PREVISTO') valueCapturedProjected += c.amount;
          }
        });
      } else if (p.budgetLines && p.budgetLines.length > 0) {
        p.budgetLines.forEach(l => {
          if (l.type === 'CAPEX') realizedCapEx += l.actualCost;
          if (l.type === 'OPEX') realizedOpEx += l.actualCost;
        });
      }
    });

    const totalPlannedBudget = plannedCapEx + plannedOpEx;
    const totalRealizedBudget = realizedCapEx + realizedOpEx;
    const totalValueCaptured = valueCapturedRealized + valueCapturedProjected;

    const financialExecutionPct = totalPlannedBudget > 0 
      ? Math.round((totalRealizedBudget / totalPlannedBudget) * 100) 
      : 0;

    const valueAchievementPct = benefitTarget > 0 
      ? Math.round((totalValueCaptured / benefitTarget) * 100) 
      : (totalValueCaptured > 0 ? 100 : 0);

    const activeCount = linkedProjects.filter(p => p.status === 'ACTIVE').length;
    const intakeCount = linkedProjects.filter(p => p.status === 'INTAKE').length;
    const archivedCount = linkedProjects.filter(p => p.status === 'ARCHIVED').length;

    return {
      linkedProjects,
      totalProjects: linkedProjects.length,
      activeCount,
      intakeCount,
      archivedCount,
      plannedCapEx,
      realizedCapEx,
      plannedOpEx,
      realizedOpEx,
      totalPlannedBudget,
      totalRealizedBudget,
      benefitTarget,
      valueCapturedRealized,
      valueCapturedProjected,
      totalValueCaptured,
      financialExecutionPct,
      valueAchievementPct
    };
  };

  // Aggregated Overall Portfolio Top Dashboard Gauges
  const globalSummary = useMemo(() => {
    let totalPlannedCapEx = 0;
    let totalRealizedCapEx = 0;
    let totalPlannedOpEx = 0;
    let totalRealizedOpEx = 0;
    let totalBenefitTarget = 0;
    let totalCapturedValue = 0;
    let totalProjectsLinked = 0;

    portfolios.forEach(pf => {
      const metrics = getPortfolioMetrics(pf);
      totalPlannedCapEx += metrics.plannedCapEx;
      totalRealizedCapEx += metrics.realizedCapEx;
      totalPlannedOpEx += metrics.plannedOpEx;
      totalRealizedOpEx += metrics.realizedOpEx;
      totalBenefitTarget += metrics.benefitTarget;
      totalCapturedValue += metrics.totalValueCaptured;
      totalProjectsLinked += metrics.totalProjects;
    });

    const grandPlannedBudget = totalPlannedCapEx + totalPlannedOpEx;
    const grandRealizedBudget = totalRealizedCapEx + totalRealizedOpEx;

    const globalFinancialPct = grandPlannedBudget > 0 
      ? Math.round((grandRealizedBudget / grandPlannedBudget) * 100) 
      : 0;

    const globalValuePct = totalBenefitTarget > 0 
      ? Math.round((totalCapturedValue / totalBenefitTarget) * 100) 
      : (totalCapturedValue > 0 ? 100 : 0);

    return {
      totalPortfolios: portfolios.length,
      activePortfolios: portfolios.filter(p => p.status === 'Ativo').length,
      planningPortfolios: portfolios.filter(p => p.status === 'Planejamento').length,
      totalProjectsLinked,
      grandPlannedBudget,
      grandRealizedBudget,
      globalFinancialPct,
      totalBenefitTarget,
      totalCapturedValue,
      globalValuePct
    };
  }, [portfolios, projects, activeTenantId]);

  // Filtered Portfolios
  const filteredPortfolios = useMemo(() => {
    return portfolios.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.investmentThesis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sponsor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.portfolioManager.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [portfolios, searchTerm, categoryFilter, statusFilter]);

  // Open Create / Edit Form
  const handleOpenModal = (p?: Portfolio) => {
    if (p) {
      setEditingPortfolio(p);
      setFormName(p.name);
      setFormThesis(p.investmentThesis || '');
      setFormCategory(p.category || 'Inovação');
      setFormStatus(p.status || 'Ativo');
      setFormSponsor(p.sponsor || '');
      setFormManager(p.portfolioManager || '');
      setFormArea(p.requestingArea || configAreasAtendidas[0] || 'TI & Infraestrutura');
      setFormPillar(p.strategicPillar || configPilares[0] || 'Eficiência Operacional');
      setFormOKR(p.associatedOKR || '');
      setFormHorizon(p.timeHorizon || '2026 - Q1 a Q4');
    } else {
      setEditingPortfolio(null);
      setFormName('');
      setFormThesis('');
      setFormCategory('Inovação');
      setFormStatus('Ativo');
      setFormSponsor(configConsultores[0] || '');
      setFormManager(configConsultores[1] || 'Líder VMO');
      setFormArea(configAreasAtendidas[0] || 'TI & Infraestrutura');
      setFormPillar(configPilares[0] || 'Eficiência Operacional');
      setFormOKR('');
      setFormHorizon('2026 - Q1 a Q4');
    }
    setIsModalOpen(true);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const newPortfolio: Portfolio = {
      id: editingPortfolio ? editingPortfolio.id : `pf_${Date.now()}`,
      tenantId: activeTenantId,
      name: formName.trim(),
      investmentThesis: formThesis.trim(),
      category: formCategory,
      status: formStatus,
      sponsor: formSponsor.trim(),
      portfolioManager: formManager.trim(),
      requestingArea: formArea,
      strategicPillar: formPillar,
      associatedOKR: formOKR.trim(),
      timeHorizon: formHorizon.trim(),
      updatedAt: new Date().toISOString(),
      createdAt: editingPortfolio ? editingPortfolio.createdAt : new Date().toISOString()
    };

    onSavePortfolio(newPortfolio);
    setIsModalOpen(false);
  };

  const getStatusBadge = (status: PortfolioStatus) => {
    switch (status) {
      case 'Ativo':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/10 text-teal-300 border border-teal-500/30">🟢 ATIVO</span>;
      case 'Planejamento':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">⏳ PLANEJAMENTO</span>;
      case 'Encerrado':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">🔒 ENCERRADO</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">{status}</span>;
    }
  };

  const getCategoryBadge = (category: string) => {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
        📌 {category}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs" id="portfolio-management-module">
      
      {/* MODULE HEADER TITLE */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-500/10 border border-teal-500/25 rounded-xl text-teal-400">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-100 font-display">Gestão de Portfólios Estratégicos</h2>
              <span className="text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                Turquesa & Ouro • Bottom-up
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Consolidação financeira (CapEx, OpEx) e métricas de captura de valor sintetizadas dinamicamente a partir dos projetos vinculados.
            </p>
          </div>
        </div>

        {canEdit && (
          <button
            onClick={() => handleOpenModal()}
            className="p-2.5 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs transition shadow flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Novo Portfólio Estratégico
          </button>
        )}
      </div>

      {/* DASHBOARD / CARDS DE INDICADORES VISUAIS (MAESTRO PALETTE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Portfólios & Projetos */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg relative overflow-hidden flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">
              Portfólios & Projetos
            </span>
            <span className="p-1.5 bg-teal-500/10 text-teal-400 rounded-lg border border-teal-500/20">
              <Layers className="w-4 h-4" />
            </span>
          </div>

          <div>
            <div className="text-xl font-extrabold font-mono text-slate-100 flex items-baseline gap-2">
              <span>{globalSummary.totalPortfolios}</span>
              <span className="text-xs font-normal text-slate-400 font-sans">
                Portfólios ({globalSummary.activePortfolios} Ativos)
              </span>
            </div>

            <div className="text-[11px] text-teal-300 font-mono font-semibold mt-1">
              {globalSummary.totalProjectsLinked} Projetos Vinc. no Downstream
            </div>
          </div>

          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="bg-teal-400 h-full rounded-full" 
              style={{ width: `${globalSummary.totalPortfolios > 0 ? (globalSummary.activePortfolios / globalSummary.totalPortfolios) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Card 2: Orçamento Geral do Portfólio (CapEx + OpEx) */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg relative overflow-hidden flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">
              Orçado x Realizado Geral
            </span>
            <span className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
              <Coins className="w-4 h-4" />
            </span>
          </div>

          <div>
            <div className="text-xl font-extrabold font-mono text-slate-100">
              R$ {globalSummary.grandRealizedBudget.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              Meta Orçada: <strong className="text-slate-200">R$ {globalSummary.grandPlannedBudget.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</strong>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-slate-400">Consumo Financeiro</span>
              <span className={globalSummary.globalFinancialPct > 100 ? 'text-rose-400 font-bold' : 'text-teal-300 font-bold'}>
                {globalSummary.globalFinancialPct}%
              </span>
            </div>
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
              <div 
                className={`h-full rounded-full ${globalSummary.globalFinancialPct > 100 ? 'bg-rose-500' : 'bg-teal-400'}`}
                style={{ width: `${Math.min(100, globalSummary.globalFinancialPct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Captura de Valor Total (OURO) */}
        <div className="bg-slate-900 border border-amber-500/20 p-4 rounded-xl shadow-lg relative overflow-hidden flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-400/90">
              Captura de Valor (Benefícios)
            </span>
            <span className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/30">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>

          <div>
            <div className="text-xl font-extrabold font-mono text-amber-400">
              R$ {globalSummary.totalCapturedValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              Meta Esperada: <strong className="text-slate-200">R$ {globalSummary.totalBenefitTarget.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</strong>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-slate-400">Atingimento da Meta</span>
              <span className="text-amber-300 font-extrabold">{globalSummary.globalValuePct}%</span>
            </div>
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="bg-amber-400 h-full rounded-full" 
                style={{ width: `${Math.min(100, globalSummary.globalValuePct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Saúde Financeira e Alinhamento Estratégico */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg relative overflow-hidden flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">
              Saúde do Portfólio
            </span>
            <span className="p-1.5 bg-teal-500/10 text-teal-400 rounded-lg border border-teal-500/20">
              <Award className="w-4 h-4" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-sm font-bold text-slate-100">Saúde Executiva OK</span>
            </div>
            <p className="text-[10.5px] text-slate-400 mt-1 leading-normal">
              100% dos portfólios possuem Sponsor e Pilar Estratégico vinculados.
            </p>
          </div>

          <div className="text-[10px] font-mono text-teal-400 font-bold bg-teal-500/10 p-1.5 rounded border border-teal-500/20 text-center">
            ✔ Governança VMO Ativa
          </div>
        </div>

      </div>

      {/* FILTER AND SEARCH CONTROLS */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="w-full sm:w-72 relative">
          <input
            type="text"
            placeholder="Buscar por nome, tese, sponsor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 p-2 pl-8 rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none text-xs"
          />
          <FolderKanban className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">Categoria:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 p-1.5 rounded text-xs font-medium cursor-pointer"
            >
              <option value="ALL">Todas as Categorias</option>
              <option value="Inovação">Inovação</option>
              <option value="Sustentação">Sustentação</option>
              <option value="Crescimento">Crescimento</option>
              <option value="Regulatório">Regulatório</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 p-1.5 rounded text-xs font-medium cursor-pointer"
            >
              <option value="ALL">Todos os Status</option>
              <option value="Ativo">Ativo</option>
              <option value="Planejamento">Planejamento</option>
              <option value="Encerrado">Encerrado</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABELA DE LISTAGEM DE PORTFÓLIOS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 font-mono text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <th className="p-3.5">Portfólio & Categoria</th>
                <th className="p-3.5">Governança (Sponsor / VMO)</th>
                <th className="p-3.5">Alinhamento & Pilar</th>
                <th className="p-3.5 text-center">Projetos</th>
                <th className="p-3.5 text-right">CapEx (Plan x Real)</th>
                <th className="p-3.5 text-right">OpEx (Plan x Real)</th>
                <th className="p-3.5 text-right">Captura Valor x Meta</th>
                <th className="p-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans text-xs">
              {filteredPortfolios.map(pf => {
                const metrics = getPortfolioMetrics(pf);

                return (
                  <tr key={pf.id} className="hover:bg-slate-900/50 transition-colors">
                    
                    {/* Portfólio & Categoria */}
                    <td className="p-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-100 font-bold text-xs">{pf.name}</strong>
                          {getStatusBadge(pf.status)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {getCategoryBadge(pf.category)}
                          <span className="text-[10px] text-slate-500 font-mono">{pf.timeHorizon}</span>
                        </div>
                        {pf.investmentThesis && (
                          <div className="text-[10.5px] text-slate-400 truncate max-w-[280px]">
                            {pf.investmentThesis}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Governança */}
                    <td className="p-3.5 font-mono text-[11px]">
                      <div className="space-y-0.5">
                        <div className="text-slate-200 flex items-center gap-1 font-semibold">
                          <User className="w-3 h-3 text-teal-400 shrink-0" />
                          <span>Sponsor: {pf.sponsor || 'N/A'}</span>
                        </div>
                        <div className="text-slate-400 text-[10px]">
                          VMO: {pf.portfolioManager || 'N/A'}
                        </div>
                        <div className="text-slate-500 text-[9.5px]">
                          Área: {pf.requestingArea}
                        </div>
                      </div>
                    </td>

                    {/* Alinhamento */}
                    <td className="p-3.5 text-[11px]">
                      <div className="space-y-0.5">
                        <span className="inline-block bg-teal-500/10 text-teal-300 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border border-teal-500/20">
                          🎯 {pf.strategicPillar}
                        </span>
                        {pf.associatedOKR && (
                          <div className="text-slate-400 text-[10px] font-mono truncate max-w-[180px]">
                            OKR: {pf.associatedOKR}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Projetos Vinc. */}
                    <td className="p-3.5 text-center font-mono">
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-teal-300 font-bold text-xs inline-block">
                          {metrics.totalProjects}
                        </span>
                        <div className="text-[9px] text-slate-500">
                          {metrics.activeCount} Ativos • {metrics.intakeCount} Intake
                        </div>
                      </div>
                    </td>

                    {/* CapEx (Plan x Real) */}
                    <td className="p-3.5 text-right font-mono">
                      <div className="space-y-0.5">
                        <div className="text-indigo-300 font-bold">
                          R$ {metrics.realizedCapEx.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Meta: R$ {metrics.plannedCapEx.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </div>
                      </div>
                    </td>

                    {/* OpEx (Plan x Real) */}
                    <td className="p-3.5 text-right font-mono">
                      <div className="space-y-0.5">
                        <div className="text-teal-300 font-bold">
                          R$ {metrics.realizedOpEx.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Meta: R$ {metrics.plannedOpEx.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </div>
                      </div>
                    </td>

                    {/* Captura de Valor Total x Meta */}
                    <td className="p-3.5 text-right font-mono">
                      <div className="space-y-1">
                        <div className="text-amber-400 font-extrabold text-xs">
                          R$ {metrics.totalValueCaptured.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Meta: R$ {metrics.benefitTarget.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </div>
                        <div className="w-24 ml-auto bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                          <div 
                            className="bg-amber-400 h-full rounded-full" 
                            style={{ width: `${Math.min(100, metrics.valueAchievementPct)}%` }}
                          />
                        </div>
                        <div className="text-[9px] text-amber-300 font-bold">
                          {metrics.valueAchievementPct}% Atingido
                        </div>
                      </div>
                    </td>

                    {/* Ações */}
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedDetailPortfolio(pf)}
                          title="Ver Detalhes do Portfólio e Projetos Vinculados"
                          className="p-1.5 text-teal-400 hover:text-teal-200 hover:bg-slate-800 rounded cursor-pointer transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <>
                            <button
                              onClick={() => handleOpenModal(pf)}
                              title="Editar Portfólio"
                              className="p-1.5 text-indigo-400 hover:text-indigo-200 hover:bg-slate-800 rounded cursor-pointer transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Deseja excluir o portfólio "${pf.name}"?`)) {
                                  onDeletePortfolio(pf.id);
                                }
                              }}
                              title="Excluir Portfólio"
                              className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-slate-800 rounded cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}

              {filteredPortfolios.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 font-mono">
                    Nenhum portfólio estratégico localizado. Clique em "Novo Portfólio Estratégico" para cadastrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CRIAÇÃO E EDIÇÃO DE PORTFÓLIO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            
            {/* Modal Header */}
            <div className="bg-slate-950 p-5 border-b border-slate-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-lg">
                  <FolderKanban className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-100 font-display">
                    {editingPortfolio ? 'Editar Portfólio Estratégico' : 'Cadastrar Novo Portfólio Estratégico'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Estrutura de Governança VMO • Turquesa e Ouro
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-900 text-slate-300 space-y-6">
              <form id="portfolio-form" onSubmit={handleSaveSubmit} className="space-y-6">
                
                {/* BLOCO 1: IDENTIFICAÇÃO */}
                <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-mono font-bold text-teal-400 uppercase tracking-wider block">
                    1. Identificação do Portfólio
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-slate-400 font-mono text-[10px] uppercase font-bold block">
                        Nome do Portfólio *
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Ex: Inovação & Transformação Digital"
                        className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-slate-100 font-semibold focus:outline-none focus:border-teal-500/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400 font-mono text-[10px] uppercase font-bold block">
                        Categoria do Portfólio
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-slate-200 font-semibold focus:outline-none cursor-pointer"
                      >
                        <option value="Inovação">Inovação</option>
                        <option value="Sustentação">Sustentação</option>
                        <option value="Crescimento">Crescimento</option>
                        <option value="Regulatório">Regulatório</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400 font-mono text-[10px] uppercase font-bold block">
                        Status do Portfólio
                      </label>
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as PortfolioStatus)}
                        className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-slate-200 font-semibold focus:outline-none cursor-pointer"
                      >
                        <option value="Ativo">🟢 Ativo</option>
                        <option value="Planejamento">⏳ Planejamento</option>
                        <option value="Encerrado">🔒 Encerrado</option>
                      </select>
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-slate-400 font-mono text-[10px] uppercase font-bold block">
                        Descrição / Tese de Investimento
                      </label>
                      <textarea
                        rows={3}
                        value={formThesis}
                        onChange={(e) => setFormThesis(e.target.value)}
                        placeholder="Descreva a tese estratégica, justificativa de alocação de recursos e valor pretendido..."
                        className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-slate-200 focus:outline-none text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* BLOCO 2: GOVERNANÇA */}
                <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-mono font-bold text-teal-400 uppercase tracking-wider block">
                    2. Governança Executiva
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-400 font-mono text-[10px] uppercase font-bold block">
                        Patrocinador Executivo (Sponsor)
                      </label>
                      <input
                        type="text"
                        value={formSponsor}
                        onChange={(e) => setFormSponsor(e.target.value)}
                        placeholder="Ex: Camila Rocha"
                        className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-slate-200 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400 font-mono text-[10px] uppercase font-bold block">
                        Portfolio Manager (Líder VMO)
                      </label>
                      <input
                        type="text"
                        value={formManager}
                        onChange={(e) => setFormManager(e.target.value)}
                        placeholder="Ex: Bernardo Lima"
                        className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-slate-200 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400 font-mono text-[10px] uppercase font-bold block">
                        Área Solicitante
                      </label>
                      <select
                        value={formArea}
                        onChange={(e) => setFormArea(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-slate-200 focus:outline-none cursor-pointer"
                      >
                        {configAreasAtendidas.map(a => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* BLOCO 3: ALINHAMENTO ESTRATÉGICO */}
                <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                    3. Alinhamento Estratégico & OKRs
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-slate-400 font-mono text-[10px] uppercase font-bold block">
                        Pilar Estratégico Vinculado
                      </label>
                      <select
                        value={formPillar}
                        onChange={(e) => setFormPillar(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-slate-200 focus:outline-none cursor-pointer"
                      >
                        {configPilares.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400 font-mono text-[10px] uppercase font-bold block">
                        OKR / Meta Associada
                      </label>
                      <input
                        type="text"
                        value={formOKR}
                        onChange={(e) => setFormOKR(e.target.value)}
                        placeholder="Ex: Atingir R$ 2M de ARR"
                        className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-slate-200 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400 font-mono text-[10px] uppercase font-bold block">
                        Horizonte de Tempo
                      </label>
                      <input
                        type="text"
                        value={formHorizon}
                        onChange={(e) => setFormHorizon(e.target.value)}
                        placeholder="Ex: 2026 - Q1 a Q4"
                        className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-slate-200 font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* BLOCO 4: INDICADORES FINANCEIROS BOTTOM-UP (READ-ONLY RESUMO) */}
                {editingPortfolio && (
                  <div className="space-y-3 bg-slate-950/80 p-4 rounded-xl border border-teal-500/20">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono font-bold text-teal-300 uppercase tracking-wider block">
                        4. Consolidação Bottom-up (Read-only)
                      </span>
                      <span className="text-[9.5px] font-mono text-slate-400">
                        Total Projetos Vinculados: <strong className="text-teal-300">{getPortfolioMetrics(editingPortfolio).totalProjects}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-mono text-[11px]">
                      <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                        <span className="text-slate-500 text-[9px] block">CapEx Realizado / Plan</span>
                        <span className="text-indigo-300 font-bold">
                          R$ {getPortfolioMetrics(editingPortfolio).realizedCapEx.toLocaleString('pt-BR')}
                        </span>
                        <span className="text-slate-500 text-[9px] block">
                          / R$ {getPortfolioMetrics(editingPortfolio).plannedCapEx.toLocaleString('pt-BR')}
                        </span>
                      </div>

                      <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                        <span className="text-slate-500 text-[9px] block">OpEx Realizado / Plan</span>
                        <span className="text-teal-300 font-bold">
                          R$ {getPortfolioMetrics(editingPortfolio).realizedOpEx.toLocaleString('pt-BR')}
                        </span>
                        <span className="text-slate-500 text-[9px] block">
                          / R$ {getPortfolioMetrics(editingPortfolio).plannedOpEx.toLocaleString('pt-BR')}
                        </span>
                      </div>

                      <div className="bg-slate-900 p-2.5 rounded border border-slate-800 col-span-2 sm:col-span-1">
                        <span className="text-slate-500 text-[9px] block">Captura de Valor / Meta</span>
                        <span className="text-amber-400 font-bold">
                          R$ {getPortfolioMetrics(editingPortfolio).totalValueCaptured.toLocaleString('pt-BR')}
                        </span>
                        <span className="text-slate-500 text-[9px] block">
                          / R$ {getPortfolioMetrics(editingPortfolio).benefitTarget.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

              </form>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-950 p-4 border-t border-slate-800 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold cursor-pointer transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="portfolio-form"
                className="p-2 px-5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-lg text-xs cursor-pointer transition flex items-center gap-1.5 shadow"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                Salvar Portfólio
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE VISUALIZAÇÃO DETALHADA DO PORTFÓLIO E PROJETOS VINCULADOS */}
      {selectedDetailPortfolio && (() => {
        const detailMetrics = getPortfolioMetrics(selectedDetailPortfolio);

        return (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              
              {/* Header */}
              <div className="bg-slate-950 p-5 border-b border-slate-800 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-lg">
                    <FolderKanban className="w-6 h-6" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-100 font-display">
                        {selectedDetailPortfolio.name}
                      </h3>
                      {getStatusBadge(selectedDetailPortfolio.status)}
                      {getCategoryBadge(selectedDetailPortfolio.category)}
                    </div>
                    <p className="text-[10.5px] text-slate-400 font-mono mt-0.5">
                      Pilar: {selectedDetailPortfolio.strategicPillar} • Horizonte: {selectedDetailPortfolio.timeHorizon}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedDetailPortfolio(null)}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1 bg-slate-900 text-slate-300 space-y-6">
                
                {/* Tese de Investimento & Governança */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-[9.5px] font-mono font-bold text-teal-400 uppercase tracking-wider block">
                      Tese de Investimento
                    </span>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      {selectedDetailPortfolio.investmentThesis || 'Nenhuma tese cadastrada.'}
                    </p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 font-mono text-[11px]">
                    <span className="text-[9.5px] font-mono font-bold text-teal-400 uppercase tracking-wider block">
                      Governança Executiva
                    </span>
                    <div className="space-y-1">
                      <div><strong className="text-slate-400">Sponsor:</strong> <span className="text-slate-200">{selectedDetailPortfolio.sponsor}</span></div>
                      <div><strong className="text-slate-400">VMO Manager:</strong> <span className="text-slate-200">{selectedDetailPortfolio.portfolioManager}</span></div>
                      <div><strong className="text-slate-400">Área:</strong> <span className="text-slate-200">{selectedDetailPortfolio.requestingArea}</span></div>
                      <div><strong className="text-slate-400">OKR:</strong> <span className="text-amber-300">{selectedDetailPortfolio.associatedOKR || 'N/A'}</span></div>
                    </div>
                  </div>
                </div>

                {/* Dashboard Bottom-up Resumo Financeiro */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[9.5px] font-mono font-bold text-indigo-400 uppercase tracking-wider block">CapEx Consolidado</span>
                    <div className="text-base font-extrabold font-mono text-indigo-300">
                      R$ {detailMetrics.realizedCapEx.toLocaleString('pt-BR')}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Meta Planejada: R$ {detailMetrics.plannedCapEx.toLocaleString('pt-BR')}
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[9.5px] font-mono font-bold text-teal-400 uppercase tracking-wider block">OpEx Consolidado</span>
                    <div className="text-base font-extrabold font-mono text-teal-300">
                      R$ {detailMetrics.realizedOpEx.toLocaleString('pt-BR')}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Meta Planejada: R$ {detailMetrics.plannedOpEx.toLocaleString('pt-BR')}
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/20 space-y-1">
                    <span className="text-[9.5px] font-mono font-bold text-amber-400 uppercase tracking-wider block">Captura de Valor</span>
                    <div className="text-base font-extrabold font-mono text-amber-400">
                      R$ {detailMetrics.totalValueCaptured.toLocaleString('pt-BR')}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Meta Esperada: R$ {detailMetrics.benefitTarget.toLocaleString('pt-BR')} ({detailMetrics.valueAchievementPct}%)
                    </div>
                  </div>
                </div>

                {/* Projetos Vinculados Table */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-teal-400" />
                      Projetos Vinculados a este Portfólio ({detailMetrics.totalProjects})
                    </h4>

                    {onSelectPortfolioFilter && (
                      <button
                        onClick={() => {
                          onSelectPortfolioFilter(selectedDetailPortfolio.name);
                          setSelectedDetailPortfolio(null);
                        }}
                        className="text-[11px] font-bold text-teal-400 hover:underline flex items-center gap-1"
                      >
                        Filtrar no Módulo de Projetos →
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-950 font-mono text-[9.5px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                          <th className="p-3">ID / Nome do Projeto</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Sponsor / Responsável</th>
                          <th className="p-3 text-right">Orçamento Alocado</th>
                          <th className="p-3 text-right">Realizado Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-sans">
                        {detailMetrics.linkedProjects.map(p => {
                          const pActual = (p.cashFlowEntries && p.cashFlowEntries.length > 0)
                            ? p.cashFlowEntries.reduce((s, c) => s + (c.status === 'REALIZADO' ? c.amount : 0), 0)
                            : p.budgetLines.reduce((s, l) => s + (l.actualCost || 0), 0);

                          return (
                            <tr key={p.id} className="hover:bg-slate-950/40">
                              <td className="p-3 font-semibold text-slate-200">
                                <span className="font-mono text-teal-400 mr-1">#{p.demandId || 'PRJ'}</span>
                                {p.name}
                              </td>
                              <td className="p-3 font-mono">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  p.status === 'ACTIVE' 
                                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
                                    : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                                }`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="p-3 text-slate-300">{p.sponsor || p.createdBy}</td>
                              <td className="p-3 text-right font-mono font-bold text-slate-200">
                                R$ {p.allocatedBudget.toLocaleString('pt-BR')}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-teal-300">
                                R$ {pActual.toLocaleString('pt-BR')}
                              </td>
                            </tr>
                          );
                        })}

                        {detailMetrics.linkedProjects.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-slate-500 font-mono">
                              Nenhum projeto vinculado a este portfólio no momento.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="bg-slate-950 p-4 border-t border-slate-800 flex justify-end shrink-0">
                <button
                  onClick={() => setSelectedDetailPortfolio(null)}
                  className="p-2 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs cursor-pointer transition"
                >
                  Fechar
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
