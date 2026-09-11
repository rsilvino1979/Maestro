import React, { useState, useMemo } from 'react';
import { 
  BudgetTarget, CashFlowEntry, Persona, BenefitType, BenefitUnitType, PeriodicityType, BudgetHistoryItem 
} from '../types';
import { formatFinancialValue, getBenefitBadge } from './BudgetTracker';
import { 
  TrendingUp, Target, Plus, Check, Trash2, Edit2, History, X, 
  AlertTriangle, CheckCircle2, Award, ArrowUpRight, BarChart3, PieChart,
  Calendar, Layers, ShieldAlert, Sparkles, Filter
} from 'lucide-react';
import { 
  ResponsiveContainer, ComposedChart, Area, Line, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip as RechartsTooltip, Legend
} from 'recharts';

interface ValueCaptureSectionProps {
  projectId: string;
  targets: BudgetTarget[];
  cashFlowEntries: CashFlowEntry[];
  userRole: Persona;
  onAddTarget: (newTarget: BudgetTarget) => void;
  onUpdateTarget: (updatedTarget: BudgetTarget) => void;
  onDeleteTarget: (targetId: string) => void;
  onAddCashFlow: (newCF: CashFlowEntry) => void;
  onUpdateCashFlow: (updatedCF: CashFlowEntry) => void;
  onDeleteCashFlow: (cfId: string) => void;
  onViewHistory: (item: { title: string; history?: BudgetHistoryItem[] }) => void;
}

export default function ValueCaptureSection({
  projectId,
  targets,
  cashFlowEntries,
  userRole,
  onAddTarget,
  onUpdateTarget,
  onDeleteTarget,
  onAddCashFlow,
  onUpdateCashFlow,
  onDeleteCashFlow,
  onViewHistory
}: ValueCaptureSectionProps) {
  const canEdit = userRole !== 'TEAM_MEMBER';

  // Filter expected result targets
  const resultTargets = useMemo(() => {
    return targets.filter(t => t.type === 'RESULTADO_ESPERADO');
  }, [targets]);

  // Filter realized value capture entries
  const realizedCaptures = useMemo(() => {
    return cashFlowEntries.filter(cf => cf.type === 'RESULTADO_REALIZADO');
  }, [cashFlowEntries]);

  // Available periods sorted
  const availablePeriods = useMemo(() => {
    const periodsSet = new Set<string>();
    resultTargets.forEach(t => periodsSet.add(t.period));
    realizedCaptures.forEach(c => periodsSet.add(c.period));
    // Default standard quarters if empty
    if (periodsSet.size === 0) {
      ['2026 - Q1', '2026 - Q2', '2026 - Q3', '2026 - Q4'].forEach(p => periodsSet.add(p));
    }
    return Array.from(periodsSet).sort();
  }, [resultTargets, realizedCaptures]);

  // =========================================================================
  // CALCULATIONS & METRICS FOR BURN-UP CHART & GAUGE
  // =========================================================================

  // Chart View Mode state (Accumulated vs Per-Period)
  const [chartViewMode, setChartViewMode] = useState<'ACCUMULATED' | 'PERIOD'>('ACCUMULATED');

  // Overall Total Meta vs Total Realized vs Forecast (Realized + Projected - Churn) & NET Absoluto
  const overallMetrics = useMemo(() => {
    const totalPlannedMoney = resultTargets
      .filter(t => !t.unitType || t.unitType === 'CURRENCY')
      .reduce((sum, t) => sum + t.targetAmount, 0);

    const totalRealizedMoney = realizedCaptures
      .filter(c => (!c.unitType || c.unitType === 'CURRENCY') && c.status === 'REALIZADO')
      .reduce((sum, c) => sum + c.amount, 0);

    const totalProjectedMoney = realizedCaptures
      .filter(c => (!c.unitType || c.unitType === 'CURRENCY') && c.status === 'PREVISTO')
      .reduce((sum, c) => sum + c.amount, 0);

    // Positive Realized
    const totalRealizedPos = realizedCaptures
      .filter(c => (!c.unitType || c.unitType === 'CURRENCY') && c.status === 'REALIZADO' && c.amount > 0)
      .reduce((sum, c) => sum + c.amount, 0);

    // Positive Projected
    const totalProjectedPos = realizedCaptures
      .filter(c => (!c.unitType || c.unitType === 'CURRENCY') && c.status === 'PREVISTO' && c.amount > 0)
      .reduce((sum, c) => sum + c.amount, 0);

    // Total Churn (negative impacts / desvios)
    const totalChurn = Math.abs(
      realizedCaptures
        .filter(c => (!c.unitType || c.unitType === 'CURRENCY') && c.amount < 0)
        .reduce((sum, c) => sum + c.amount, 0)
    );

    // Forecast = Realized + Projected (which already accounts for negative values in total, but decomposed as RealPos + ProjPos - Churn)
    const totalForecastMoney = totalRealizedMoney + totalProjectedMoney;

    // NET Absoluto (Forecast Total - Meta Planejada Total)
    const netAbsoluteForecast = totalForecastMoney - totalPlannedMoney;
    const netAbsoluteRealized = totalRealizedMoney - totalPlannedMoney;

    const percentageAchieved = totalPlannedMoney > 0 
      ? Math.min(Math.round((totalRealizedMoney / totalPlannedMoney) * 1000) / 10, 999) 
      : (totalRealizedMoney > 0 ? 100 : 0);

    const percentageForecast = totalPlannedMoney > 0
      ? Math.min(Math.round((totalForecastMoney / totalPlannedMoney) * 1000) / 10, 999)
      : (totalForecastMoney > 0 ? 100 : 0);

    return {
      totalPlannedMoney,
      totalRealizedMoney,
      totalProjectedMoney,
      totalRealizedPos,
      totalProjectedPos,
      totalChurn,
      totalForecastMoney,
      netAbsoluteForecast,
      netAbsoluteRealized,
      percentageAchieved,
      percentageForecast
    };
  }, [resultTargets, realizedCaptures]);

  // Burn-up & Stacked Forecast Data per Period with Forecast = Realized (+) + Projected (+) - Churn (-)
  const burnUpData = useMemo(() => {
    let accPlanned = 0;
    let accRealizedPos = 0;
    let accProjectedPos = 0;
    let accChurn = 0;
    let accForecast = 0;
    let accRealizedNet = 0;

    return availablePeriods.map(p => {
      // Planned in this period (Meta)
      const periodPlanned = resultTargets
        .filter(t => t.period === p && (!t.unitType || t.unitType === 'CURRENCY'))
        .reduce((sum, t) => sum + t.targetAmount, 0);

      // Realized (+) in this period
      const periodRealizedPos = realizedCaptures
        .filter(c => c.period === p && (!c.unitType || c.unitType === 'CURRENCY') && c.status === 'REALIZADO' && c.amount > 0)
        .reduce((sum, c) => sum + c.amount, 0);

      // Projected (+) in this period
      const periodProjectedPos = realizedCaptures
        .filter(c => c.period === p && (!c.unitType || c.unitType === 'CURRENCY') && c.status === 'PREVISTO' && c.amount > 0)
        .reduce((sum, c) => sum + c.amount, 0);

      // Churn (-) in this period
      const periodChurn = Math.abs(
        realizedCaptures
          .filter(c => c.period === p && (!c.unitType || c.unitType === 'CURRENCY') && c.amount < 0)
          .reduce((sum, c) => sum + c.amount, 0)
      );

      const periodRealizedNet = realizedCaptures
        .filter(c => c.period === p && (!c.unitType || c.unitType === 'CURRENCY') && c.status === 'REALIZADO')
        .reduce((sum, c) => sum + c.amount, 0);

      const periodProjectedNet = realizedCaptures
        .filter(c => c.period === p && (!c.unitType || c.unitType === 'CURRENCY') && c.status === 'PREVISTO')
        .reduce((sum, c) => sum + c.amount, 0);

      const periodForecast = periodRealizedPos + periodProjectedPos - periodChurn;
      const periodNetAbsolute = periodForecast - periodPlanned;

      accPlanned += periodPlanned;
      accRealizedPos += periodRealizedPos;
      accProjectedPos += periodProjectedPos;
      accChurn += periodChurn;
      accForecast += periodForecast;
      accRealizedNet += periodRealizedNet;

      const accNetAbsolute = accForecast - accPlanned;

      return {
        period: p,
        periodPlanned,
        periodRealizedPos,
        periodProjectedPos,
        periodChurn,
        periodChurnNeg: -periodChurn,
        periodRealizedNet,
        periodProjectedNet,
        periodForecast,
        periodNetAbsolute,

        accPlanned,
        accRealizedPos,
        accProjectedPos,
        accChurn,
        accChurnNeg: -accChurn,
        accForecast,
        accRealizedNet,
        accNetAbsolute,

        achievementPct: periodPlanned > 0 ? Math.round((periodRealizedNet / periodPlanned) * 100) : 0,
        forecastPct: periodPlanned > 0 ? Math.round((periodForecast / periodPlanned) * 100) : 0,
        accAchievementPct: accPlanned > 0 ? Math.round((accRealizedNet / accPlanned) * 100) : 0,
        accForecastPct: accPlanned > 0 ? Math.round((accForecast / accPlanned) * 100) : 0
      };
    });
  }, [availablePeriods, resultTargets, realizedCaptures]);

  // =========================================================================
  // FORM STATES: PLANEJAMENTO (BASELINE)
  // =========================================================================
  const [showAddBaselineForm, setShowAddBaselineForm] = useState(false);
  const [bPeriodicity, setBPeriodicity] = useState<PeriodicityType>('Quarter');
  const [bPeriod, setBPeriod] = useState('2026 - Q1');
  const [bCategory, setBCategory] = useState('Receita Incremental / ROI');
  const [bDesc, setBDesc] = useState('');
  const [bBenefitType, setBBenefitType] = useState<BenefitType>('Aumento Receita');
  const [bUnitType, setBUnitType] = useState<BenefitUnitType>('CURRENCY');
  const [bAmountVal, setBAmountVal] = useState<number>(50000);

  // Edit Baseline State
  const [editingBaseline, setEditingBaseline] = useState<BudgetTarget | null>(null);
  const [editBPeriodicity, setEditBPeriodicity] = useState<PeriodicityType>('Quarter');
  const [editBPeriod, setEditBPeriod] = useState('');
  const [editBCategory, setEditBCategory] = useState('');
  const [editBDesc, setEditBDesc] = useState('');
  const [editBBenefitType, setEditBBenefitType] = useState<BenefitType>('Aumento Receita');
  const [editBUnitType, setEditBUnitType] = useState<BenefitUnitType>('CURRENCY');
  const [editBAmountVal, setEditBAmountVal] = useState<number>(0);
  const [editBJustification, setEditBJustification] = useState('');
  const [editBError, setEditBError] = useState<string | null>(null);

  // =========================================================================
  // FORM STATES: REGISTRO DE REALIZAÇÃO (CAPTURA DE VALOR)
  // =========================================================================
  const [showAddCaptureForm, setShowAddCaptureForm] = useState(false);
  const [selectedLinkedTargetId, setSelectedLinkedTargetId] = useState<string>('');
  const [cDate, setCDate] = useState(new Date().toISOString().split('T')[0]);
  const [cPeriod, setCPeriod] = useState('2026 - Q1');
  const [cCategory, setCCategory] = useState('Receita Incremental / ROI');
  const [cSupplier, setCSupplier] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [cAmountVal, setCAmountVal] = useState<number>(10000);
  const [cStatus, setCStatus] = useState<'REALIZADO' | 'PREVISTO'>('REALIZADO');
  const [cBenefitType, setCBenefitType] = useState<BenefitType>('Aumento Receita');
  const [cUnitType, setCUnitType] = useState<BenefitUnitType>('CURRENCY');
  const [captureLinkError, setCaptureLinkError] = useState<string | null>(null);

  // Edit Capture State
  const [editingCapture, setEditingCapture] = useState<CashFlowEntry | null>(null);
  const [editCLinkedTargetId, setEditCLinkedTargetId] = useState<string>('');
  const [editCDate, setEditCDate] = useState('');
  const [editCPeriod, setEditCPeriod] = useState('');
  const [editCCategory, setEditCCategory] = useState('');
  const [editCSupplier, setEditCSupplier] = useState('');
  const [editCDesc, setEditCDesc] = useState('');
  const [editCAmountVal, setEditCAmountVal] = useState<number>(0);
  const [editCStatus, setEditCStatus] = useState<'REALIZADO' | 'PREVISTO' | 'CANCELADO'>('REALIZADO');
  const [editCBenefitType, setEditCBenefitType] = useState<BenefitType>('Aumento Receita');
  const [editCUnitType, setEditCUnitType] = useState<BenefitUnitType>('CURRENCY');
  const [editCJustification, setEditCJustification] = useState('');
  const [editCError, setEditCError] = useState<string | null>(null);

  // Deletion modal state (replaces iframe-blocked window.confirm)
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'TARGET' | 'CASHFLOW';
    id: string;
    title: string;
    subtitle?: string;
  } | null>(null);

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'TARGET') {
      onDeleteTarget(itemToDelete.id);
    } else if (itemToDelete.type === 'CASHFLOW') {
      onDeleteCashFlow(itemToDelete.id);
    }
    setItemToDelete(null);
  };

  // =========================================================================
  // HANDLERS: BASELINE (RESULTADO ESPERADO)
  // =========================================================================
  const handleSaveNewBaseline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bDesc.trim()) return;

    const newTarget: BudgetTarget = {
      id: `target_benefit_${Date.now()}`,
      type: 'RESULTADO_ESPERADO',
      periodicity: bPeriodicity,
      period: bPeriod,
      category: bCategory,
      description: bDesc.trim(),
      targetAmount: Number(bAmountVal) || 0,
      benefitType: bBenefitType,
      unitType: bUnitType
    };

    onAddTarget(newTarget);
    setShowAddBaselineForm(false);
    setBDesc('');
    setBAmountVal(50000);
  };

  const handleOpenEditBaseline = (target: BudgetTarget) => {
    setEditingBaseline(target);
    setEditBPeriodicity(target.periodicity || 'Quarter');
    setEditBPeriod(target.period);
    setEditBCategory(target.category);
    setEditBDesc(target.description);
    setEditBBenefitType(target.benefitType || 'Aumento Receita');
    setEditBUnitType(target.unitType || 'CURRENCY');
    setEditBAmountVal(target.targetAmount);
    setEditBJustification('');
    setEditBError(null);
  };

  const handleSaveEditBaseline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBaseline) return;

    const oldVal = editingBaseline.targetAmount;
    const newVal = Number(editBAmountVal) || 0;
    const isFinancialChange = oldVal !== newVal;

    if (isFinancialChange && (!editBJustification.trim() || editBJustification.trim().length < 10)) {
      setEditBError('A alteração de valor financeiro/meta exige justificativa obrigatória com no mínimo 10 caracteres.');
      return;
    }

    const todayStr = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const historyEntry: BudgetHistoryItem = {
      id: `hist_${Date.now()}`,
      changeDate: todayStr,
      changedBy: userRole,
      isFinancialChange,
      oldAmount: oldVal,
      newAmount: newVal,
      oldDescription: editingBaseline.description,
      newDescription: editBDesc,
      justification: isFinancialChange ? editBJustification.trim() : 'Alteração cadastral/metadados da meta'
    };

    const updatedTarget: BudgetTarget = {
      ...editingBaseline,
      periodicity: editBPeriodicity,
      period: editBPeriod,
      category: editBCategory,
      description: editBDesc,
      targetAmount: newVal,
      benefitType: editBBenefitType,
      unitType: editBUnitType,
      history: [historyEntry, ...(editingBaseline.history || [])],
      lastJustification: historyEntry.justification
    };

    onUpdateTarget(updatedTarget);
    setEditingBaseline(null);
  };

  // =========================================================================
  // HANDLERS: REGISTRO DE REALIZAÇÃO (CAPTURA DE VALOR VINCULADA)
  // =========================================================================
  
  // When user selects a linked target in form, auto fill fields
  const handleSelectLinkedTarget = (targetId: string) => {
    setSelectedLinkedTargetId(targetId);
    setCaptureLinkError(null);

    const linked = resultTargets.find(t => t.id === targetId);
    if (linked) {
      setCPeriod(linked.period);
      setCCategory(linked.category);
      if (linked.benefitType) setCBenefitType(linked.benefitType);
      if (linked.unitType) setCUnitType(linked.unitType);
    }
  };

  const handleSaveNewCapture = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLinkedTargetId) {
      setCaptureLinkError('A captura de valor deve ser OBRIGATORIAMENTE vinculada a uma linha de baseline previamente planejada.');
      return;
    }

    if (!cDesc.trim()) return;

    const linked = resultTargets.find(t => t.id === selectedLinkedTargetId);

    const newCF: CashFlowEntry = {
      id: `cf_benefit_${Date.now()}`,
      date: cDate,
      period: cPeriod,
      type: 'RESULTADO_REALIZADO',
      linkedTargetId: selectedLinkedTargetId,
      category: cCategory,
      supplierOrDoc: cSupplier.trim() || (linked ? `Vinculado: ${linked.category}` : 'Evidência de Resultado'),
      description: cDesc.trim(),
      amount: Number(cAmountVal) || 0,
      status: cStatus,
      benefitType: cBenefitType,
      unitType: cUnitType
    };

    onAddCashFlow(newCF);
    setShowAddCaptureForm(false);
    setSelectedLinkedTargetId('');
    setCDesc('');
    setCSupplier('');
    setCAmountVal(10000);
    setCaptureLinkError(null);
  };

  const handleOpenEditCapture = (cf: CashFlowEntry) => {
    setEditingCapture(cf);
    setEditCLinkedTargetId(cf.linkedTargetId || '');
    setEditCDate(cf.date);
    setEditCPeriod(cf.period);
    setEditCCategory(cf.category);
    setEditCSupplier(cf.supplierOrDoc || '');
    setEditCDesc(cf.description);
    setEditCAmountVal(cf.amount);
    setEditCStatus(cf.status);
    setEditCBenefitType(cf.benefitType || 'Aumento Receita');
    setEditCUnitType(cf.unitType || 'CURRENCY');
    setEditCJustification('');
    setEditCError(null);
  };

  const handleSaveEditCapture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCapture) return;

    if (!editCLinkedTargetId) {
      setEditCError('A captura de valor deve ser OBRIGATORIAMENTE vinculada a uma meta de baseline.');
      return;
    }

    const oldVal = editingCapture.amount;
    const newVal = Number(editCAmountVal) || 0;
    const isFinancialChange = oldVal !== newVal;

    if (isFinancialChange && (!editCJustification.trim() || editCJustification.trim().length < 10)) {
      setEditCError('A alteração do valor de resultado realizado exige justificativa obrigatória com no mínimo 10 caracteres.');
      return;
    }

    const todayStr = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const historyEntry: BudgetHistoryItem = {
      id: `hist_${Date.now()}`,
      changeDate: todayStr,
      changedBy: userRole,
      isFinancialChange,
      oldAmount: oldVal,
      newAmount: newVal,
      oldDescription: editingCapture.description,
      newDescription: editCDesc,
      justification: isFinancialChange ? editCJustification.trim() : 'Alteração de dados cadastrais da captura de valor'
    };

    const updatedCF: CashFlowEntry = {
      ...editingCapture,
      date: editCDate,
      period: editCPeriod,
      linkedTargetId: editCLinkedTargetId,
      category: editCCategory,
      supplierOrDoc: editCSupplier,
      description: editCDesc,
      amount: newVal,
      status: editCStatus,
      benefitType: editCBenefitType,
      unitType: editCUnitType,
      history: [historyEntry, ...(editingCapture.history || [])],
      lastJustification: historyEntry.justification
    };

    onUpdateCashFlow(updatedCF);
    setEditingCapture(null);
  };

  return (
    <div className="space-y-8 animate-fade-in text-xs">

      {/* =========================================================================
          SECTION 1: DASHBOARD VISUAL DE ATINGIMENTO (BURN-UP + GAUGE + TABELA)
          ========================================================================= */}
      <div className="bg-slate-900/90 border border-teal-500/30 rounded-2xl p-6 shadow-xl space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-teal-500/15 border border-teal-500/30 rounded-lg text-teal-400">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100 font-display">
                  Dashboard de Atingimento & Captura de Valor
                </h2>
                <p className="text-[11px] text-slate-400">
                  Acompanhamento evolutivo das metas planejadas versus resultados capturados e visão de Forecast (Realizado + Projetado)
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
            <span className="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
              Realizado: {overallMetrics.percentageAchieved}%
            </span>
            <span className="px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              Forecast (Real + Proj - Churn): {overallMetrics.percentageForecast}%
            </span>
            <span className={`px-3 py-1 rounded-full border font-bold flex items-center gap-1.5 ${
              overallMetrics.netAbsoluteForecast >= 0
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}>
              NET Absoluto: {overallMetrics.netAbsoluteForecast >= 0 ? '+' : ''}
              R$ {overallMetrics.netAbsoluteForecast.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* TOP METRICS SUMMARY CARDS: META, REALIZADO, PROJETADO VS CHURN, FORECAST & NET ABSOLUTO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
              Meta Planejada Total
            </span>
            <span className="text-base font-extrabold text-amber-400 font-mono mt-1 block">
              {formatFinancialValue(overallMetrics.totalPlannedMoney)}
            </span>
            <p className="text-[10px] text-slate-500 mt-1">Soma das Metas de Resultado (Baseline)</p>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                  Realizado (+) (Fato Efetivado)
                </span>
                <span className="text-base font-extrabold text-teal-400 font-mono mt-1 block">
                  +R$ {overallMetrics.totalRealizedPos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <span className="px-2 py-0.5 bg-teal-500/10 text-teal-300 border border-teal-500/20 text-[10px] font-mono font-bold rounded">
                {overallMetrics.percentageAchieved}%
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Benefícios positivos capturados e comprovados</p>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
              Projetado (+) vs Churn (-)
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-base font-extrabold text-indigo-300 font-mono">
                +R$ {overallMetrics.totalProjectedPos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10.5px] font-bold text-rose-400 font-mono bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                Churn: -R$ {overallMetrics.totalChurn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Lançamentos previstos e impactos/desvios</p>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-indigo-500/30 shadow-sm bg-gradient-to-br from-indigo-950/30 via-slate-950 to-slate-950">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block font-mono">
                  Forecast Total (Real + Proj - Churn)
                </span>
                <span className="text-base font-extrabold text-indigo-100 font-mono mt-1 block">
                  {formatFinancialValue(overallMetrics.totalForecastMoney)}
                </span>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border ${
                overallMetrics.percentageForecast >= 100 
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
              }`}>
                {overallMetrics.percentageForecast}%
              </span>
            </div>

            {/* NET ABSOLUTO HIGHLIGHT BOX */}
            <div className="mt-2 pt-2 border-t border-indigo-500/20 flex items-center justify-between font-mono">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                NET Absoluto (Forecast - Meta):
              </span>
              <span className={`text-[11px] font-black px-2 py-0.5 rounded border ${
                overallMetrics.netAbsoluteForecast >= 0
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}>
                {overallMetrics.netAbsoluteForecast >= 0 ? '+' : ''}
                R$ {overallMetrics.netAbsoluteForecast.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

        </div>

        {/* METRICS ROW: GAUGE / CIRCULAR PROGRESS + OVERALL CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* GAUGE / PROGRESS CARD (4 cols) */}
          <div className="lg:col-span-4 bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
            
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-teal-400" />
              Índice de Atingimento & Forecast
            </h3>

            {/* Circular Gauge / Ring Component */}
            <div className="relative w-40 h-40 my-2 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background track */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-slate-800"
                  fill="transparent"
                />
                {/* Outer ring: Forecast (Indigo/Cyan) */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="url(#forecastGradient)"
                  strokeWidth="5"
                  strokeDasharray={263.89}
                  strokeDashoffset={263.89 - (263.89 * Math.min(overallMetrics.percentageForecast, 100)) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  fill="transparent"
                />
                {/* Inner ring: Realized (Teal / Amber) */}
                <circle
                  cx="50"
                  cy="50"
                  r="35"
                  stroke="url(#gaugeGradient)"
                  strokeWidth="6"
                  strokeDasharray={219.91}
                  strokeDashoffset={219.91 - (219.91 * Math.min(overallMetrics.percentageAchieved, 100)) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  fill="transparent"
                />
                <defs>
                  <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#14b8a6" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                  <linearGradient id="forecastGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-xl font-black font-mono text-indigo-200 tracking-tight">
                  {overallMetrics.percentageForecast}%
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400">
                  Forecast Total
                </span>
                <span className="text-[10px] font-bold font-mono text-teal-400 mt-0.5">
                  (Real: {overallMetrics.percentageAchieved}%)
                </span>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-1.5 mt-2 pt-3 border-t border-slate-800/80 font-mono text-[10px]">
              <div className="text-left bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[9px]">Planejado (Meta)</span>
                <span className="text-amber-400 font-bold truncate block">
                  {formatFinancialValue(overallMetrics.totalPlannedMoney)}
                </span>
              </div>
              <div className="text-right bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[9px]">Realizado (+)</span>
                <span className="text-teal-400 font-bold truncate block">
                  +R$ {overallMetrics.totalRealizedPos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-left bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[9px]">Projetado (+)</span>
                <span className="text-indigo-300 font-bold truncate block">
                  +R$ {overallMetrics.totalProjectedPos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-right bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[9px]">Churn (-)</span>
                <span className="text-rose-400 font-bold truncate block">
                  -R$ {overallMetrics.totalChurn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="w-full mt-2 pt-2 border-t border-slate-800 flex items-center justify-between font-mono text-[10px]">
              <span className="text-slate-400 text-[9px]">Saldo NET Absoluto:</span>
              <span className={`font-bold ${overallMetrics.netAbsoluteForecast >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {overallMetrics.netAbsoluteForecast >= 0 ? '+' : ''}
                R$ {overallMetrics.netAbsoluteForecast.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

          </div>

          {/* STACKED BAR CHART: FORECAST = REALIZADO + PROJETADO - CHURN (COLUNAR EMPILHADA) + META (EM LINHA) */}
          <div className="lg:col-span-8 bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-200 font-mono flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  Gráfico de Forecast Empilhado (Realizado + Projetado - Churn) vs Meta (Linha)
                </h3>
                <p className="text-[10.5px] text-slate-400">
                  Colunas empilhadas compõem o Forecast (Realizado + Projetado - Churn/Desvios) comparado à Meta em Linha
                </p>
              </div>

              {/* View Mode Toggle: Accumulated vs Per Period */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 font-mono text-[10px]">
                <button
                  type="button"
                  onClick={() => setChartViewMode('ACCUMULATED')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    chartViewMode === 'ACCUMULATED' 
                      ? 'bg-amber-500 text-slate-950 font-extrabold' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Acumulado
                </button>
                <button
                  type="button"
                  onClick={() => setChartViewMode('PERIOD')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    chartViewMode === 'PERIOD' 
                      ? 'bg-amber-500 text-slate-950 font-extrabold' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Por Período
                </button>
              </div>
            </div>

            {/* Custom Chart Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono pb-2 border-b border-slate-800/60">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <span className="w-3 h-0.5 bg-amber-400 inline-block" />
                Meta ({chartViewMode === 'ACCUMULATED' ? 'Linha Acumulada' : 'Linha Período'})
              </div>
              <div className="flex items-center gap-1 text-teal-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-sm bg-teal-500 inline-block" />
                Realizado (+)
              </div>
              <div className="flex items-center gap-1 text-indigo-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-400 inline-block" />
                Projetado (+)
              </div>
              <div className="flex items-center gap-1 text-rose-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
                Churn / Desvios (-)
              </div>
              <div className="flex items-center gap-1 text-sky-400 font-bold">
                <span className="w-3 h-0.5 border-t border-dashed border-sky-400 inline-block" />
                Forecast NET
              </div>
            </div>

            {/* Recharts Chart Container */}
            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={burnUpData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="period" 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false}
                    tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`} 
                  />
                  <RechartsTooltip
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#334155', 
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontSize: '11px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
                    }}
                    formatter={(value: any, name: any, item: any) => {
                      const num = Number(value) || 0;
                      const formatted = `R$ ${Math.abs(num).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                      if (name.includes('Meta')) return [formatted, 'Meta Planejada'];
                      if (name.includes('Realizado')) return [`+${formatted}`, 'Realizado (+)'];
                      if (name.includes('Projetado')) return [`+${formatted}`, 'Projetado (+)'];
                      if (name.includes('Churn')) return [`-${formatted}`, 'Churn / Desvios (-)'];
                      if (name.includes('Forecast')) return [`R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Forecast NET'];
                      return [formatted, name];
                    }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                  />

                  {/* STACKED BARS FOR FORECAST = REALIZADO + PROJETADO - CHURN */}
                  <Bar 
                    dataKey={chartViewMode === 'ACCUMULATED' ? "accRealizedPos" : "periodRealizedPos"} 
                    name="Realizado (+)" 
                    stackId="forecastStack" 
                    fill="#14b8a6" 
                    barSize={24}
                  />
                  <Bar 
                    dataKey={chartViewMode === 'ACCUMULATED' ? "accProjectedPos" : "periodProjectedPos"} 
                    name="Projetado (+)" 
                    stackId="forecastStack" 
                    fill="#818cf8" 
                    barSize={24}
                  />
                  <Bar 
                    dataKey={chartViewMode === 'ACCUMULATED' ? "accChurnNeg" : "periodChurnNeg"} 
                    name="Churn / Desvios (-)" 
                    stackId="forecastStack" 
                    fill="#f43f5e" 
                    barSize={24}
                  />

                  {/* META AS A CRISP LINE */}
                  <Line 
                    type="monotone" 
                    dataKey={chartViewMode === 'ACCUMULATED' ? "accPlanned" : "periodPlanned"} 
                    name="Meta Planejada" 
                    stroke="#f59e0b" 
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#f59e0b', stroke: '#78350f', strokeWidth: 2 }}
                  />

                  {/* FORECAST NET RESULT LINE */}
                  <Line 
                    type="monotone" 
                    dataKey={chartViewMode === 'ACCUMULATED' ? "accForecast" : "periodForecast"} 
                    name="Forecast NET" 
                    stroke="#38bdf8" 
                    strokeWidth={2}
                    strokeDasharray="4 4" 
                    dot={{ r: 3, fill: '#38bdf8', stroke: '#0369a1', strokeWidth: 1.5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

          </div>

        </div>

        {/* SUMMARY TABLE: PLANEJADO VS REALIZADO VS PROJETADO VS CHURN VS FORECAST NET POR PERÍODO */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-bold text-slate-200 font-mono flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-teal-400" />
            Tabela de Resumo de Atingimento e Visão NET Forecast por Período
          </h3>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 font-mono text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <th className="p-3">Período</th>
                  <th className="p-3 text-right">Meta Planejada (R$)</th>
                  <th className="p-3 text-right text-teal-400">Realizado (+) (R$)</th>
                  <th className="p-3 text-right text-indigo-300">Projetado (+) (R$)</th>
                  <th className="p-3 text-right text-rose-400">Churn (-) (R$)</th>
                  <th className="p-3 text-right text-indigo-200">Forecast NET (R$)</th>
                  <th className="p-3 text-right text-amber-300">NET Absoluto (R$)</th>
                  <th className="p-3 text-center">% Forecast</th>
                  <th className="p-3 text-center">Status Forecast</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {burnUpData.map(row => {
                  const isPositiveNet = row.periodNetAbsolute >= 0;
                  return (
                    <tr key={row.period} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-200">{row.period}</td>
                      <td className="p-3 text-right font-mono text-amber-400 font-medium">
                        R$ {row.periodPlanned.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-mono text-teal-300 font-bold">
                        +R$ {row.periodRealizedPos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-mono text-indigo-300">
                        +R$ {row.periodProjectedPos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-mono text-rose-400 font-semibold">
                        {row.periodChurn > 0 ? `-R$ ${row.periodChurn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
                      </td>
                      <td className="p-3 text-right font-mono text-indigo-100 font-extrabold bg-indigo-950/20">
                        R$ {row.periodForecast.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`p-3 text-right font-mono font-black ${isPositiveNet ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositiveNet ? '+' : ''}R$ {row.periodNetAbsolute.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-center font-mono font-extrabold text-indigo-300">
                        {row.forecastPct}%
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          row.forecastPct >= 100 
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                            : row.forecastPct >= 70
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        }`}>
                          {row.forecastPct >= 100 ? '🚀 Meta Superada' : row.forecastPct >= 70 ? '🎯 Parcial' : '⚠️ Desvio/Abaixo'}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {burnUpData.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-500 font-mono">
                      Nenhum período de meta de resultado cadastrado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>


      {/* =========================================================================
          SECTION 2: PLANEJAMENTO DE RESULTADOS (BASELINE ESPERADO)
          ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              1. Planejamento de Resultados (Baseline Esperado)
            </h3>
            <p className="text-[11px] text-slate-400">
              Defina as metas e expectativas de retorno por periodicidade e indicador estratégico
            </p>
          </div>

          {canEdit && (
            <button
              onClick={() => setShowAddBaselineForm(true)}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer text-xs"
            >
              <Plus className="w-4 h-4" /> Nova Meta Baseline
            </button>
          )}
        </div>

        {/* ADD BASELINE FORM */}
        {showAddBaselineForm && (
          <form onSubmit={handleSaveNewBaseline} className="bg-slate-950 border border-amber-500/30 rounded-xl p-4 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                <Target className="w-4 h-4" /> Cadastrar Meta de Baseline de Resultado
              </h4>
              <button
                type="button"
                onClick={() => setShowAddBaselineForm(false)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-amber-300 font-semibold block mb-1">Periodicidade (*Obrigatório)</label>
                <select
                  value={bPeriodicity}
                  onChange={(e) => setBPeriodicity(e.target.value as PeriodicityType)}
                  className="w-full bg-slate-900 border border-amber-500/40 text-amber-200 p-2 rounded-lg font-medium"
                >
                  <option value="Mês">📅 Mês</option>
                  <option value="Quarter">🗓️ Quarter (Trimestre)</option>
                  <option value="Semestre">📆 Semestre</option>
                  <option value="Ano">🌐 Ano</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Período de Referência</label>
                <input
                  type="text"
                  required
                  value={bPeriod}
                  onChange={(e) => setBPeriod(e.target.value)}
                  placeholder="Ex: 2026 - Q1 ou 2026-M03"
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2 rounded-lg font-mono font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Tipo do Benefício</label>
                <select
                  value={bBenefitType}
                  onChange={(e) => setBBenefitType(e.target.value as BenefitType)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2 rounded-lg font-medium"
                >
                  <option value="Aumento Receita">📈 Aumento Receita</option>
                  <option value="Redução de despesas">📉 Redução de despesas</option>
                  <option value="NPS">⭐ NPS</option>
                  <option value="Churn">🔄 Churn</option>
                  <option value="KPIs">🎯 KPIs</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Formato / Unidade</label>
                <select
                  value={bUnitType}
                  onChange={(e) => setBUnitType(e.target.value as BenefitUnitType)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2 rounded-lg font-medium"
                >
                  <option value="CURRENCY">Dinheiro (R$)</option>
                  <option value="NUMBER">Número Absoluto</option>
                  <option value="PERCENTAGE">Percentual (%)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Categoria / Indicador</label>
                <input
                  type="text"
                  required
                  value={bCategory}
                  onChange={(e) => setBCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2 rounded-lg font-medium"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">
                  {bUnitType === 'PERCENTAGE' ? 'Meta (%)' : bUnitType === 'NUMBER' ? 'Meta Numérica' : 'Valor Meta (R$)'}
                </label>
                <input
                  type="number"
                  required
                  step="any"
                  value={bAmountVal}
                  onChange={(e) => setBAmountVal(Number(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 p-2 rounded-lg font-mono font-bold"
                />
                <span className="text-[10px] text-amber-400 font-mono block mt-1">
                  Formatado: <strong>{formatFinancialValue(bAmountVal, bUnitType)}</strong>
                </span>
              </div>

              <div className="md:col-span-2">
                <label className="text-slate-400 block mb-1">Descrição / Finalidade Estratégica</label>
                <input
                  type="text"
                  required
                  value={bDesc}
                  onChange={(e) => setBDesc(e.target.value)}
                  placeholder="Descreva a meta e justificativa estratégica..."
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2 rounded-lg font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddBaselineForm(false)}
                className="px-4 py-1.5 bg-slate-800 text-slate-300 rounded-lg font-semibold hover:bg-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-400 flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-4 h-4" /> Salvar Baseline
              </button>
            </div>
          </form>
        )}

        {/* BASELINES TABLE */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 font-mono text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <th className="p-3">Periodicidade / Período</th>
                <th className="p-3">Tipo do Benefício</th>
                <th className="p-3">Categoria / Indicador</th>
                <th className="p-3">Descrição Estratégica</th>
                <th className="p-3 text-right">Meta de Baseline</th>
                {canEdit && <th className="p-3 text-center">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {resultTargets.map(t => (
                <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-3 font-mono font-semibold text-slate-200">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 text-[10px] font-bold border border-slate-700">
                        {t.periodicity || 'Quarter'}
                      </span>
                      <span>{t.period}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    {getBenefitBadge(t.benefitType)}
                  </td>
                  <td className="p-3 font-medium text-slate-300">{t.category}</td>
                  <td className="p-3 text-slate-400 max-w-[280px]">
                    <div className="truncate">{t.description}</div>
                    {t.lastJustification && (
                      <div className="text-[10px] text-amber-400/90 italic truncate mt-0.5">
                        Obs: {t.lastJustification}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-right font-mono font-extrabold text-amber-400">
                    {formatFinancialValue(t.targetAmount, t.unitType)}
                  </td>
                  {canEdit && (
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {t.history && t.history.length > 0 && (
                          <button
                            onClick={() => onViewHistory({ title: `Auditoria Meta Baseline: ${t.category}`, history: t.history })}
                            title="Ver histórico de alterações"
                            className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded cursor-pointer"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEditBaseline(t)}
                          title="Editar Meta"
                          className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setItemToDelete({
                            type: 'TARGET',
                            id: t.id,
                            title: t.category,
                            subtitle: t.description
                          })}
                          title="Excluir Meta"
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}

              {resultTargets.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500 font-mono">
                    Nenhuma meta de baseline de resultado cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>


      {/* =========================================================================
          SECTION 3: REGISTRO DE REALIZAÇÕES (CAPTURA DE VALOR VINCULADA)
          ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2">
              <Award className="w-4 h-4 text-teal-400" />
              2. Registro de Realizações (Captura de Valor)
            </h3>
            <p className="text-[11px] text-slate-400">
              Apoio de lançamentos de retornos realizados vinculados OBRIGATORIAMENTE às linhas de baseline planejadas
            </p>
          </div>

          {canEdit && (
            <button
              onClick={() => {
                setShowAddCaptureForm(true);
                setCaptureLinkError(null);
              }}
              className="px-3.5 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer text-xs"
            >
              <Plus className="w-4 h-4" /> Registrar Captura de Valor
            </button>
          )}
        </div>

        {/* ADD CAPTURE FORM */}
        {showAddCaptureForm && (
          <form onSubmit={handleSaveNewCapture} className="bg-slate-950 border border-teal-500/30 rounded-xl p-4 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="font-bold text-teal-300 text-xs flex items-center gap-1.5">
                <Award className="w-4 h-4" /> Registrar Captura de Valor Realizada
              </h4>
              <button
                type="button"
                onClick={() => setShowAddCaptureForm(false)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {captureLinkError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{captureLinkError}</span>
              </div>
            )}

            {/* MANDATORY LINKED BASELINE SELECTOR */}
            <div className="bg-teal-950/20 border border-teal-500/30 rounded-xl p-3 space-y-2">
              <label className="text-teal-300 font-bold block text-[11px]">
                🎯 Vincular à Meta de Baseline Planejada (*Obrigatorio)
              </label>
              <select
                required
                value={selectedLinkedTargetId}
                onChange={(e) => handleSelectLinkedTarget(e.target.value)}
                className="w-full bg-slate-900 border border-teal-500/50 text-teal-100 p-2.5 rounded-lg font-bold"
              >
                <option value="">-- Selecione a Meta Planejada Pertencente --</option>
                {resultTargets.map(t => (
                  <option key={t.id} value={t.id}>
                    [{t.period}] {t.category} - Meta: {formatFinancialValue(t.targetAmount, t.unitType)} ({t.benefitType || 'Geral'})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-teal-400/80">
                A seleção da meta preenche automaticamente os parâmetros do indicador e associa a medição ao período correto.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Data da Medição / Lançamento</label>
                <input
                  type="date"
                  required
                  value={cDate}
                  onChange={(e) => setCDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2 rounded-lg font-mono font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Período de Referência</label>
                <input
                  type="text"
                  required
                  value={cPeriod}
                  onChange={(e) => setCPeriod(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2 rounded-lg font-mono font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Tipo do Benefício</label>
                <select
                  value={cBenefitType}
                  onChange={(e) => setCBenefitType(e.target.value as BenefitType)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2 rounded-lg font-medium"
                >
                  <option value="Aumento Receita">📈 Aumento Receita</option>
                  <option value="Redução de despesas">📉 Redução de despesas</option>
                  <option value="NPS">⭐ NPS</option>
                  <option value="Churn">🔄 Churn</option>
                  <option value="KPIs">🎯 KPIs</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Status</label>
                <select
                  value={cStatus}
                  onChange={(e) => setCStatus(e.target.value as 'REALIZADO' | 'PREVISTO')}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2 rounded-lg font-medium"
                >
                  <option value="REALIZADO">✅ REALIZADO / CAPTURADO</option>
                  <option value="PREVISTO">⏳ PREVISTO</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">
                  {cUnitType === 'PERCENTAGE' ? 'Valor Realizado (%)' : cUnitType === 'NUMBER' ? 'Número Realizado' : 'Valor Realizado (R$)'}
                </label>
                <input
                  type="number"
                  required
                  step="any"
                  value={cAmountVal}
                  onChange={(e) => setCAmountVal(Number(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 p-2 rounded-lg font-mono font-bold"
                  placeholder="Valores negativos permitidos para impactos/desvios"
                />
                <span className="text-[10px] text-teal-400 font-mono block mt-1">
                  Formatado: <strong className={cAmountVal < 0 ? 'text-rose-400' : 'text-teal-300'}>{formatFinancialValue(cAmountVal, cUnitType)}</strong>
                  {cAmountVal < 0 && <span className="text-rose-400 font-sans ml-2 font-semibold">(⚠️ Impacto/Desvio Negativo)</span>}
                </span>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Evidência / Documento</label>
                <input
                  type="text"
                  value={cSupplier}
                  onChange={(e) => setCSupplier(e.target.value)}
                  placeholder="Ex: Relatório Financeiro Q2 ou ERP #1029"
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2 rounded-lg font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-slate-400 block mb-1">Descrição / Detalhes da Captura</label>
                <input
                  type="text"
                  required
                  value={cDesc}
                  onChange={(e) => setCDesc(e.target.value)}
                  placeholder="Detalhe o ganho obtido e a metodologia de aferição..."
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2 rounded-lg font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddCaptureForm(false)}
                className="px-4 py-1.5 bg-slate-800 text-slate-300 rounded-lg font-semibold hover:bg-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 bg-teal-500 text-slate-950 font-bold rounded-lg hover:bg-teal-400 flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-4 h-4" /> Registrar Captura
              </button>
            </div>
          </form>
        )}

        {/* REALIZED CAPTURES TABLE */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 font-mono text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <th className="p-3">Data / Período</th>
                <th className="p-3">Baseline Vinculada</th>
                <th className="p-3">Tipo do Benefício</th>
                <th className="p-3">Evidência / Descrição</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Resultado Realizado</th>
                {canEdit && <th className="p-3 text-center">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {realizedCaptures.map(cf => {
                const linked = resultTargets.find(t => t.id === cf.linkedTargetId);
                return (
                  <tr key={cf.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3 font-mono font-semibold text-slate-200">
                      <div>{cf.date}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{cf.period}</div>
                    </td>
                    <td className="p-3 font-medium text-slate-300">
                      {linked ? (
                        <span className="inline-flex items-center gap-1 text-teal-300 font-mono font-semibold text-[11px] bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                          🎯 {linked.category} ({linked.period})
                        </span>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">Nenhum vínculo</span>
                      )}
                    </td>
                    <td className="p-3">
                      {getBenefitBadge(cf.benefitType)}
                    </td>
                    <td className="p-3 text-slate-300 max-w-[260px]">
                      <div className="font-semibold text-slate-200">{cf.supplierOrDoc}</div>
                      <div className="text-slate-400 truncate text-[11px]">{cf.description}</div>
                      {cf.lastJustification && (
                        <div className="text-[10px] text-amber-400/90 italic truncate mt-0.5">
                          Obs: {cf.lastJustification}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        cf.status === 'REALIZADO'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {cf.status}
                      </span>
                    </td>
                    <td className={`p-3 text-right font-mono font-extrabold ${cf.amount < 0 ? 'text-rose-400' : 'text-teal-300'}`}>
                      {formatFinancialValue(cf.amount, cf.unitType)}
                    </td>
                    {canEdit && (
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {cf.history && cf.history.length > 0 && (
                            <button
                              onClick={() => onViewHistory({ title: `Auditoria Captura: ${cf.description}`, history: cf.history })}
                              title="Ver histórico de alterações"
                              className="p-1.5 text-slate-400 hover:text-teal-300 hover:bg-slate-800 rounded cursor-pointer"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditCapture(cf)}
                            title="Editar Captura"
                            className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setItemToDelete({
                              type: 'CASHFLOW',
                              id: cf.id,
                              title: cf.description,
                              subtitle: cf.supplierOrDoc
                            })}
                            title="Excluir Captura"
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}

              {realizedCaptures.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500 font-mono">
                    Nenhum registro de captura de valor efetuado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>


      {/* =========================================================================
          MODAL: EDIT BASELINE WITH AUDIT JUSTIFICATION
          ========================================================================= */}
      {editingBaseline && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                Editar Meta de Baseline ({editingBaseline.category})
              </h3>
              <button
                onClick={() => setEditingBaseline(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editBError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{editBError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditBaseline} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Periodicidade</label>
                  <select
                    value={editBPeriodicity}
                    onChange={(e) => setEditBPeriodicity(e.target.value as PeriodicityType)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2 rounded-lg font-medium"
                  >
                    <option value="Mês">📅 Mês</option>
                    <option value="Quarter">🗓️ Quarter</option>
                    <option value="Semestre">📆 Semestre</option>
                    <option value="Ano">🌐 Ano</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Período</label>
                  <input
                    type="text"
                    required
                    value={editBPeriod}
                    onChange={(e) => setEditBPeriod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2 rounded-lg font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Tipo de Benefício</label>
                  <select
                    value={editBBenefitType}
                    onChange={(e) => setEditBBenefitType(e.target.value as BenefitType)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2 rounded-lg font-medium"
                  >
                    <option value="Aumento Receita">📈 Aumento Receita</option>
                    <option value="Redução de despesas">📉 Redução de despesas</option>
                    <option value="NPS">⭐ NPS</option>
                    <option value="Churn">🔄 Churn</option>
                    <option value="KPIs">🎯 KPIs</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Formato / Unidade</label>
                  <select
                    value={editBUnitType}
                    onChange={(e) => setEditBUnitType(e.target.value as BenefitUnitType)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2 rounded-lg font-medium"
                  >
                    <option value="CURRENCY">Dinheiro (R$)</option>
                    <option value="NUMBER">Número Absoluto</option>
                    <option value="PERCENTAGE">Percentual (%)</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-amber-300 font-bold block mb-1">Valor Meta Baseline</label>
                  <input
                    type="number"
                    required
                    step="any"
                    value={editBAmountVal}
                    onChange={(e) => setEditBAmountVal(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-2.5 rounded-lg font-mono font-bold"
                  />
                  <span className="text-[10px] text-amber-400 font-mono block mt-1">
                    Formatado: <strong>{formatFinancialValue(editBAmountVal, editBUnitType)}</strong>
                  </span>
                </div>

                <div className="col-span-2">
                  <label className="text-slate-400 block mb-1">Descrição</label>
                  <input
                    type="text"
                    required
                    value={editBDesc}
                    onChange={(e) => setEditBDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2 rounded-lg font-medium"
                  />
                </div>

                {/* Justification Textarea */}
                <div className="col-span-2 space-y-1">
                  <label className="text-slate-200 font-bold block">
                    Justificativa da Alteração {editBAmountVal !== editingBaseline.targetAmount && <span className="text-rose-400">(*Obrigatória)</span>}
                  </label>
                  <textarea
                    rows={3}
                    value={editBJustification}
                    onChange={(e) => setEditBJustification(e.target.value)}
                    placeholder={
                      editBAmountVal !== editingBaseline.targetAmount
                        ? "Descreva a justificativa de negócio para alteração do valor financeiro da meta (mínimo 10 caracteres)..."
                        : "Obs opcional para alterações cadastrais..."
                    }
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingBaseline(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg hover:bg-amber-400 flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* =========================================================================
          MODAL: EDIT CAPTURE WITH AUDIT JUSTIFICATION
          ========================================================================= */}
      {editingCapture && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-teal-400" />
                Editar Lançamento de Captura de Valor
              </h3>
              <button
                onClick={() => setEditingCapture(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editCError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{editCError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditCapture} className="space-y-3">
              <div>
                <label className="text-teal-300 font-bold block mb-1">Vincular à Baseline (*Obrigatorio)</label>
                <select
                  required
                  value={editCLinkedTargetId}
                  onChange={(e) => setEditCLinkedTargetId(e.target.value)}
                  className="w-full bg-slate-950 border border-teal-500/40 text-teal-100 p-2 rounded-lg font-bold"
                >
                  <option value="">-- Selecione a Meta Planejada --</option>
                  {resultTargets.map(t => (
                    <option key={t.id} value={t.id}>
                      [{t.period}] {t.category} - Meta: {formatFinancialValue(t.targetAmount, t.unitType)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={editCDate}
                    onChange={(e) => setEditCDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2 rounded-lg font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Status</label>
                  <select
                    value={editCStatus}
                    onChange={(e) => setEditCStatus(e.target.value as 'REALIZADO' | 'PREVISTO' | 'CANCELADO')}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2 rounded-lg font-medium"
                  >
                    <option value="REALIZADO">✅ REALIZADO</option>
                    <option value="PREVISTO">⏳ PREVISTO</option>
                    <option value="CANCELADO">❌ CANCELADO</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-teal-300 font-bold block mb-1">Resultado Realizado</label>
                  <input
                    type="number"
                    required
                    step="any"
                    value={editCAmountVal}
                    onChange={(e) => setEditCAmountVal(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 p-2.5 rounded-lg font-mono font-bold"
                  />
                  <span className="text-[10px] text-teal-400 font-mono block mt-1">
                    Formatado: <strong className={editCAmountVal < 0 ? 'text-rose-400' : 'text-teal-300'}>{formatFinancialValue(editCAmountVal, editCUnitType)}</strong>
                    {editCAmountVal < 0 && <span className="text-rose-400 font-sans ml-2 font-semibold">(⚠️ Impacto/Desvio Negativo)</span>}
                  </span>
                </div>

                <div className="col-span-2">
                  <label className="text-slate-400 block mb-1">Evidência / Descrição</label>
                  <input
                    type="text"
                    required
                    value={editCDesc}
                    onChange={(e) => setEditCDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2 rounded-lg font-medium"
                  />
                </div>

                {/* Justification Textarea */}
                <div className="col-span-2 space-y-1">
                  <label className="text-slate-200 font-bold block">
                    Justificativa da Alteração {editCAmountVal !== editingCapture.amount && <span className="text-rose-400">(*Obrigatória)</span>}
                  </label>
                  <textarea
                    rows={3}
                    value={editCJustification}
                    onChange={(e) => setEditCJustification(e.target.value)}
                    placeholder={
                      editCAmountVal !== editingCapture.amount
                        ? "Descreva a justificativa para alteração do valor de resultado realizado (mínimo 10 caracteres)..."
                        : "Obs opcional para alterações cadastrais..."
                    }
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCapture(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-500 text-slate-950 font-bold rounded-lg hover:bg-teal-400 flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CONFIRM DELETION
          ========================================================================= */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[70] animate-fade-in text-xs">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 font-display">
                  {itemToDelete.type === 'TARGET' ? 'Excluir Meta de Benefício (Baseline)' : 'Excluir Lançamento Realizado'}
                </h3>
                <p className="text-[11px] text-slate-400">Esta ação removerá o registro permanentemente.</p>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Item Selecionado</span>
              <div className="font-semibold text-slate-200 text-xs">{itemToDelete.title}</div>
              {itemToDelete.subtitle && (
                <div className="text-[11px] text-slate-400">{itemToDelete.subtitle}</div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold hover:bg-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-600/20"
              >
                <Trash2 className="w-4 h-4" /> Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
