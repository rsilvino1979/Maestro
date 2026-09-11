import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BudgetLine, BudgetTarget, CashFlowEntry, BudgetHistoryItem, Project, Persona, BenefitType, BenefitUnitType, FinancialCategoryConfig } from '../types';
import { DEFAULT_FINANCIAL_CATEGORIES } from '../data/defaultFinancialCategories';
import { 
  Landmark, TrendingUp, TrendingDown, CircleDollarSign, Plus, Check, Ban, Trash2, 
  ArrowUpRight, Edit2, AlertTriangle, History, X, FileText, ShieldAlert,
  Receipt, Calendar, DollarSign, Filter, Sparkles, Scale, Info, CheckCircle2,
  Clock, ArrowRightLeft, Target, PieChart, Layers, Award, BarChart3, ChevronDown
} from 'lucide-react';
import ValueCaptureSection from './ValueCaptureSection';

// Helper to convert DD/MM/AAAA or YYYY-MM-DD or Quarter string to standard Brazilian format DD/MM/AAAA
export function toBrDateString(val?: string): string {
  if (!val) return '';
  const trimmed = val.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-');
    return `${d}/${m}/${y}`;
  }
  return trimmed;
}

// Helper to convert BR date DD/MM/AAAA to ISO string YYYY-MM-DD for native HTML5 date picker
export function toIsoDateString(val?: string): string {
  if (!val) return '';
  const trimmed = val.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return '';
}

// Custom Date Picker + Free typing component in dd/mm/aaaa
export function ExpirationDatePickerInput({
  id,
  value,
  onChange,
  placeholder = "dd/mm/aaaa",
  className = "",
  label,
  required = false
}: {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  required?: boolean;
}) {
  const hiddenDateRef = useRef<HTMLInputElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let text = e.target.value;
    // Allow digits and slashes
    text = text.replace(/[^\d/]/g, '');
    if (text.length === 2 && !text.includes('/')) {
      text = text + '/';
    } else if (text.length === 5 && text.split('/').length === 2) {
      text = text + '/';
    } else if (text.length > 10) {
      text = text.slice(0, 10);
    }
    onChange(text);
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const iso = e.target.value;
    if (iso) {
      const [y, m, d] = iso.split('-');
      onChange(`${d}/${m}/${y}`);
    }
  };

  const openPicker = () => {
    if (hiddenDateRef.current) {
      try {
        if ('showPicker' in HTMLInputElement.prototype) {
          hiddenDateRef.current.showPicker();
        } else {
          hiddenDateRef.current.focus();
        }
      } catch {
        hiddenDateRef.current.focus();
      }
    }
  };

  const isoValue = toIsoDateString(value);

  return (
    <div>
      {label && <label className="text-slate-400 block mb-1 font-medium">{label}</label>}
      <div className="relative flex items-center">
        <input
          id={id}
          type="text"
          required={required}
          value={value}
          onChange={handleTextChange}
          placeholder={placeholder}
          className={`w-full bg-slate-900 border border-slate-800 text-slate-100 p-2 pr-9 rounded-lg font-mono font-semibold text-xs focus:border-indigo-500 focus:outline-none transition-colors ${className}`}
        />
        <button
          type="button"
          onClick={openPicker}
          className="absolute right-2 text-slate-400 hover:text-indigo-300 p-1 rounded transition-colors cursor-pointer"
          title="Abrir seletor de calendário"
        >
          <Calendar className="w-4 h-4" />
        </button>
        <input
          ref={hiddenDateRef}
          type="date"
          tabIndex={-1}
          value={isoValue}
          onChange={handlePickerChange}
          className="sr-only absolute opacity-0 pointer-events-none w-0 h-0"
        />
      </div>
    </div>
  );
}

// Financial Category Combobox with initiative lookup & helper cards
export function FinancialCategorySelector({
  type,
  selectedCategory,
  onChangeCategory,
  categories,
  showCustomOption = true
}: {
  type: 'CAPEX' | 'OPEX';
  selectedCategory: string;
  onChangeCategory: (cat: string) => void;
  categories: FinancialCategoryConfig[];
  showCustomOption?: boolean;
}) {
  const relevantCategories = categories.filter(c => c.type === type);
  const matched = relevantCategories.find(c => c.category.toLowerCase() === selectedCategory.toLowerCase());
  const isCustom = !matched && selectedCategory !== '';
  const [customMode, setCustomMode] = useState(isCustom);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-slate-400 block font-medium">
          Categoria de Classificação ({type})
        </label>
        {showCustomOption && (
          <button
            type="button"
            onClick={() => {
              setCustomMode(!customMode);
              if (customMode && relevantCategories.length > 0) {
                onChangeCategory(relevantCategories[0].category);
              }
            }}
            className="text-[10px] text-indigo-400 hover:underline cursor-pointer"
          >
            {customMode ? '← Usar lista padrão' : '+ Categoria personalizada'}
          </button>
        )}
      </div>

      {!customMode ? (
        <select
          value={selectedCategory}
          onChange={(e) => {
            if (e.target.value === '__CUSTOM__') {
              setCustomMode(true);
            } else {
              onChangeCategory(e.target.value);
            }
          }}
          className="w-full bg-slate-900 border border-slate-800 text-slate-100 p-2 rounded-lg font-medium text-xs focus:border-indigo-500 focus:outline-none"
        >
          {relevantCategories.map(cat => (
            <option key={cat.id || cat.code || cat.category} value={cat.category}>
              {cat.code ? `[${cat.type}] #${cat.code} - ${cat.category}` : `[${cat.type}] ${cat.category}`}
            </option>
          ))}
          {showCustomOption && (
            <option value="__CUSTOM__">+ Outra / Personalizada...</option>
          )}
        </select>
      ) : (
        <input
          type="text"
          required
          placeholder="Digite o nome da categoria personalizada..."
          value={selectedCategory}
          onChange={(e) => onChangeCategory(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 text-slate-100 p-2 rounded-lg font-medium text-xs focus:border-indigo-500 focus:outline-none"
        />
      )}

      {/* Helper info card for selected category */}
      {matched && (
        <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-850 text-[11px] space-y-1">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
              matched.type === 'CAPEX' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {matched.type} #{matched.code}
            </span>
            <span>{matched.category}</span>
          </div>
          {matched.description && (
            <p className="text-slate-400 text-[10.5px] leading-tight">
              {matched.description}
            </p>
          )}
          {matched.practicalExample && (
            <div className="text-[10px] text-amber-300/90 bg-amber-500/5 p-1 rounded border border-amber-500/10">
              <span className="font-semibold text-amber-300">Exemplo prático:</span> {matched.practicalExample}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function formatFinancialValue(value: number, unitType?: BenefitUnitType): string {
  const num = Number(value) || 0;
  if (unitType === 'PERCENTAGE') {
    return `${num.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
  }
  if (unitType === 'NUMBER') {
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
  // Default CURRENCY
  if (num < 0) {
    return `- R$ ${Math.abs(num).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getBenefitBadge(type?: BenefitType) {
  if (!type) return null;
  switch (type) {
    case 'Aumento Receita':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
          📈 Aumento Receita
        </span>
      );
    case 'Redução de despesas':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
          📉 Redução de despesas
        </span>
      );
    case 'NPS':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
          ⭐ NPS
        </span>
      );
    case 'Churn':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 border border-rose-500/30 text-rose-300">
          🔄 Churn
        </span>
      );
    case 'KPIs':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 border border-purple-500/30 text-purple-300">
          🎯 KPIs
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
          {type}
        </span>
      );
  }
}

interface BudgetTrackerProps {
  project: Project;
  onAddBudgetLine?: (line: Omit<BudgetLine, 'id'>) => void;
  onDeleteBudgetLine?: (id: string) => void;
  onUpdateBudgetLine?: (line: BudgetLine) => void;
  onUpdateProjectBudgets?: (
    projectId: string, 
    budgetTargets: BudgetTarget[], 
    cashFlowEntries: CashFlowEntry[],
    budgetLines: BudgetLine[]
  ) => void;
  userRole: Persona;
  configFinancialCategories?: FinancialCategoryConfig[];
}

export default function BudgetTracker({ 
  project, 
  onAddBudgetLine, 
  onDeleteBudgetLine, 
  onUpdateBudgetLine,
  onUpdateProjectBudgets,
  userRole,
  configFinancialCategories
}: BudgetTrackerProps) {
  // Main Architectural Split: 'COSTS' (Gestão Financeira CAPEX/OPEX) vs 'VALUE_CAPTURE' (Gestão de Resultados)
  const [primaryTab, setPrimaryTab] = useState<'COSTS' | 'VALUE_CAPTURE'>('COSTS');

  // Sub-tab inside COSTS: 'PLANNING' (Planejamento Orçamentário) vs 'CASH_FLOW' (Fluxo de Caixa)
  const [costsSubTab, setCostsSubTab] = useState<'PLANNING' | 'CASH_FLOW'>('PLANNING');

  // Filter state by period
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState<string>('ALL');

  // Combined Financial Categories from config or defaults
  const allFinancialCategories = useMemo<FinancialCategoryConfig[]>(() => {
    if (configFinancialCategories && configFinancialCategories.length > 0) {
      return configFinancialCategories;
    }
    return DEFAULT_FINANCIAL_CATEGORIES;
  }, [configFinancialCategories]);

  // Local state for budget targets and cash flow entries initialized from project props
  const [localTargets, setLocalTargets] = useState<BudgetTarget[]>(() => {
    if (project.budgetTargets && project.budgetTargets.length > 0) {
      return project.budgetTargets;
    }
    // Fallback seed from existing budgetLines if project doesn't have budgetTargets yet
    const mapped: BudgetTarget[] = project.budgetLines.map(line => ({
      id: `target_${line.id}`,
      type: line.type as 'CAPEX' | 'OPEX',
      periodicity: 'Quarter',
      period: line.period ? toBrDateString(line.period) : '31/12/2026',
      category: line.category,
      description: line.description,
      targetAmount: line.baselineCost,
      history: line.history,
      lastJustification: line.lastJustification
    }));
    return mapped.concat([
      {
        id: `target_benefit_1`,
        type: 'RESULTADO_ESPERADO',
        periodicity: 'Quarter',
        period: '31/12/2026',
        category: 'Receita Incremental / ROI',
        description: 'Retorno financeiro projetado em economia operacional e automação',
        targetAmount: (project.budgetLines.reduce((s, l) => s + l.baselineCost, 0) || 50000) * 1.4,
        benefitType: 'Aumento Receita',
        unitType: 'CURRENCY'
      },
      {
        id: `target_benefit_2`,
        type: 'RESULTADO_ESPERADO',
        periodicity: 'Quarter',
        period: '31/12/2026',
        category: 'Qualidade & Satisfação',
        description: 'Elevação do indicador de satisfação do cliente (NPS)',
        targetAmount: 85,
        benefitType: 'NPS',
        unitType: 'NUMBER'
      }
    ]);
  });

  const [localCashFlow, setLocalCashFlow] = useState<CashFlowEntry[]>(() => {
    if (project.cashFlowEntries && project.cashFlowEntries.length > 0) {
      return project.cashFlowEntries;
    }
    // Fallback seed from existing budgetLines actual costs
    return project.budgetLines.filter(l => l.actualCost > 0).map((line, idx) => ({
      id: `cf_${line.id}`,
      date: `15/0${(idx % 6) + 2}/2026`,
      period: line.period || '2026 - Q1',
      type: line.type,
      category: line.category,
      supplierOrDoc: 'NF-e / Contrato Vendedor',
      description: `Pagamento efetuado: ${line.description}`,
      amount: line.actualCost,
      status: 'REALIZADO' as const,
      history: line.history,
      lastJustification: line.lastJustification
    }));
  });

  // Keep local state synchronized with project prop when updated from parent
  useEffect(() => {
    if (project.budgetTargets) {
      setLocalTargets(project.budgetTargets);
    }
    if (project.cashFlowEntries) {
      setLocalCashFlow(project.cashFlowEntries);
    }
  }, [project.id, project.budgetTargets, project.cashFlowEntries]);

  // Default category helper for type
  const getDefaultCategoryForType = (type: 'CAPEX' | 'OPEX') => {
    const found = allFinancialCategories.find(c => c.type === type);
    return found ? found.category : (type === 'CAPEX' ? 'Dev. de Software' : 'Salários e Encargos');
  };

  // State for forms inside COSTS
  const [showAddTargetForm, setShowAddTargetForm] = useState(false);
  const [targetType, setTargetType] = useState<'CAPEX' | 'OPEX'>('CAPEX');
  const [targetPeriod, setTargetPeriod] = useState('31/12/2026');
  const [targetCategory, setTargetCategory] = useState(() => getDefaultCategoryForType('CAPEX'));
  const [targetDesc, setTargetDesc] = useState('');
  const [targetAmountVal, setTargetAmountVal] = useState<number>(15000);

  // When switching target type in add form, update default category if appropriate
  const handleTargetTypeChange = (newType: 'CAPEX' | 'OPEX') => {
    setTargetType(newType);
    const hasCategoryForType = allFinancialCategories.some(c => c.type === newType && c.category === targetCategory);
    if (!hasCategoryForType) {
      setTargetCategory(getDefaultCategoryForType(newType));
    }
  };

  const [showAddCFForm, setShowAddCFForm] = useState(false);
  const todayBR = useMemo(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  const [cfDate, setCfDate] = useState(todayBR);
  const [cfPeriod, setCfPeriod] = useState('2026 - Q1');
  const [cfType, setCfType] = useState<'CAPEX' | 'OPEX'>('CAPEX');
  const [cfCategory, setCfCategory] = useState(() => getDefaultCategoryForType('CAPEX'));
  const [cfSupplier, setCfSupplier] = useState('');
  const [cfDesc, setCfDesc] = useState('');
  const [cfAmountVal, setCfAmountVal] = useState<number>(5000);
  const [cfStatus, setCfStatus] = useState<'REALIZADO' | 'PREVISTO' | 'CANCELADO'>('REALIZADO');

  const handleCfTypeChange = (newType: 'CAPEX' | 'OPEX') => {
    setCfType(newType);
    const hasCategoryForType = allFinancialCategories.some(c => c.type === newType && c.category === cfCategory);
    if (!hasCategoryForType) {
      setCfCategory(getDefaultCategoryForType(newType));
    }
  };

  // Edit target state
  const [editingTarget, setEditingTarget] = useState<BudgetTarget | null>(null);
  const [editTargetType, setEditTargetType] = useState<'CAPEX' | 'OPEX'>('CAPEX');
  const [editTargetPeriod, setEditTargetPeriod] = useState('');
  const [editTargetCategory, setEditTargetCategory] = useState('');
  const [editTargetDesc, setEditTargetDesc] = useState('');
  const [editTargetAmount, setEditTargetAmount] = useState<number>(0);
  const [editTargetJustification, setEditTargetJustification] = useState('');
  const [targetEditError, setTargetEditError] = useState<string | null>(null);

  // Edit Cash flow state
  const [editingCF, setEditingCF] = useState<CashFlowEntry | null>(null);
  const [editCfDate, setEditCfDate] = useState('');
  const [editCfPeriod, setEditCfPeriod] = useState('');
  const [editCfType, setEditCfType] = useState<'CAPEX' | 'OPEX'>('CAPEX');
  const [editCfCategory, setEditCfCategory] = useState('');
  const [editCfSupplier, setEditCfSupplier] = useState('');
  const [editCfDesc, setEditCfDesc] = useState('');
  const [editCfAmount, setEditCfAmount] = useState<number>(0);
  const [editCfStatus, setEditCfStatus] = useState<'REALIZADO' | 'PREVISTO' | 'CANCELADO'>('REALIZADO');
  const [editCfJustification, setEditCfJustification] = useState('');
  const [cfEditError, setCfEditError] = useState<string | null>(null);

  // Insufficient Balance Alert Modal State
  const [insufficientBalanceAlert, setInsufficientBalanceAlert] = useState<{
    type: 'CAPEX' | 'OPEX';
    category: string;
    plannedAmount: number;
    consumedAmount: number;
    availableBalance: number;
    attemptedAmount: number;
    operation: 'CREATE' | 'EDIT';
  } | null>(null);

  const handleEditCfTypeChange = (newType: 'CAPEX' | 'OPEX') => {
    setEditCfType(newType);
    const hasCategoryForType = allFinancialCategories.some(c => c.type === newType && c.category.toLowerCase() === editCfCategory.toLowerCase());
    if (!hasCategoryForType) {
      setEditCfCategory(getDefaultCategoryForType(newType));
    }
  };

  // Helper to check if an attempted cash flow launch exceeds the category's available budget balance
  const checkCategoryBalance = (
    type: 'CAPEX' | 'OPEX',
    category: string,
    attemptedAmount: number,
    excludeCfId?: string
  ): { hasBalance: boolean; info: { type: 'CAPEX' | 'OPEX'; category: string; plannedAmount: number; consumedAmount: number; availableBalance: number; attemptedAmount: number; operation: 'CREATE' | 'EDIT' } } => {
    const plannedAmount = localTargets
      .filter(t => t.type === type && t.category.trim().toLowerCase() === category.trim().toLowerCase())
      .reduce((sum, t) => sum + t.targetAmount, 0);

    const consumedAmount = localCashFlow
      .filter(cf => 
        cf.type === type && 
        cf.category.trim().toLowerCase() === category.trim().toLowerCase() && 
        cf.status !== 'CANCELADO' &&
        (!excludeCfId || cf.id !== excludeCfId)
      )
      .reduce((sum, cf) => sum + cf.amount, 0);

    const availableBalance = Math.max(0, plannedAmount - consumedAmount);
    // Floating point safe comparison
    const hasBalance = attemptedAmount <= (availableBalance + 0.01);

    return {
      hasBalance,
      info: {
        type,
        category,
        plannedAmount,
        consumedAmount,
        availableBalance,
        attemptedAmount,
        operation: excludeCfId ? 'EDIT' : 'CREATE'
      }
    };
  };

  // Live balance info for the Cash Flow Add Form
  const addCategoryBalanceInfo = useMemo(() => {
    const planned = localTargets
      .filter(t => t.type === cfType && t.category.trim().toLowerCase() === cfCategory.trim().toLowerCase())
      .reduce((sum, t) => sum + t.targetAmount, 0);

    const consumed = localCashFlow
      .filter(c => c.type === cfType && c.category.trim().toLowerCase() === cfCategory.trim().toLowerCase() && c.status !== 'CANCELADO')
      .reduce((sum, c) => sum + c.amount, 0);

    const balance = Math.max(0, planned - consumed);
    return { planned, consumed, balance };
  }, [localTargets, localCashFlow, cfType, cfCategory]);

  // Live balance info for the Cash Flow Edit Form
  const editCategoryBalanceInfo = useMemo(() => {
    if (!editingCF) return { planned: 0, consumed: 0, balance: 0 };
    const planned = localTargets
      .filter(t => t.type === editCfType && t.category.trim().toLowerCase() === editCfCategory.trim().toLowerCase())
      .reduce((sum, t) => sum + t.targetAmount, 0);

    const consumed = localCashFlow
      .filter(c => 
        c.type === editCfType && 
        c.category.trim().toLowerCase() === editCfCategory.trim().toLowerCase() && 
        c.status !== 'CANCELADO' &&
        c.id !== editingCF.id
      )
      .reduce((sum, c) => sum + c.amount, 0);

    const balance = Math.max(0, planned - consumed);
    return { planned, consumed, balance };
  }, [localTargets, localCashFlow, editingCF, editCfType, editCfCategory]);

  // History modal
  const [viewHistoryItem, setViewHistoryItem] = useState<{ title: string; history?: BudgetHistoryItem[] } | null>(null);

  // Deletion modal state (replaces iframe-blocked window.confirm)
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'TARGET' | 'CASHFLOW';
    id: string;
    title: string;
    description?: string;
  } | null>(null);

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'TARGET') {
      const nextTargets = localTargets.filter(t => t.id !== itemToDelete.id);
      notifyParent(nextTargets, localCashFlow);
    } else if (itemToDelete.type === 'CASHFLOW') {
      const nextCF = localCashFlow.filter(c => c.id !== itemToDelete.id);
      notifyParent(localTargets, nextCF);
    }
    setItemToDelete(null);
  };

  const canEdit = userRole !== 'TEAM_MEMBER';
  const isBudgetEnabled = project.features.budget;

  // Periods list
  const availablePeriods = useMemo(() => {
    const periodsSet = new Set<string>();
    localTargets.forEach(t => periodsSet.add(t.period));
    localCashFlow.forEach(cf => periodsSet.add(cf.period));
    return Array.from(periodsSet).sort();
  }, [localTargets, localCashFlow]);

  // Synchronize changes back to parent
  const notifyParent = (newTargets: BudgetTarget[], newCashFlow: CashFlowEntry[]) => {
    setLocalTargets(newTargets);
    setLocalCashFlow(newCashFlow);

    if (onUpdateProjectBudgets) {
      // Map back to legacy budgetLines format for backwards compatibility
      const legacyLines: BudgetLine[] = newTargets.map(t => {
        const actualCostForTarget = newCashFlow
          .filter(cf => cf.type === t.type && cf.category === t.category && cf.status === 'REALIZADO')
          .reduce((sum, cf) => sum + cf.amount, 0);

        return {
          id: t.id.replace('target_', ''),
          type: (t.type === 'CAPEX' || t.type === 'OPEX') ? t.type : 'CAPEX',
          category: t.category,
          description: t.description,
          period: t.period,
          baselineCost: t.targetAmount,
          actualCost: actualCostForTarget,
          history: t.history,
          lastJustification: t.lastJustification
        };
      });

      onUpdateProjectBudgets(project.id, newTargets, newCashFlow, legacyLines);
    }
  };

  if (!isBudgetEnabled) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl text-center space-y-4 shadow" id="budget-module">
        <div className="w-12 h-12 bg-slate-850 text-slate-500 rounded-full flex items-center justify-center mx-auto border border-slate-800">
          <Ban className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="text-sm font-semibold text-slate-200">Módulo Financeiro Oculto</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            O acompanhamento financeiro está desativado nos Feature Toggles deste projeto. Ative o módulo nas configurações para gerenciar Orçamento e Fluxo de Caixa.
          </p>
        </div>
      </div>
    );
  }

  // Filtered lists for Costs (CAPEX / OPEX)
  const filteredCostTargets = localTargets
    .filter(t => t.type === 'CAPEX' || t.type === 'OPEX')
    .filter(t => selectedPeriodFilter === 'ALL' || t.period === selectedPeriodFilter);

  const filteredCostCashFlow = localCashFlow
    .filter(cf => cf.type === 'CAPEX' || cf.type === 'OPEX')
    .filter(cf => selectedPeriodFilter === 'ALL' || cf.period === selectedPeriodFilter);

  // Financial KPI totals for COSTS (CAPEX + OPEX)
  const totalCostBudgetPlanned = filteredCostTargets.reduce((acc, i) => acc + i.targetAmount, 0);
  
  const totalCostRealized = filteredCostCashFlow
    .filter(cf => cf.status === 'REALIZADO')
    .reduce((acc, i) => acc + i.amount, 0);

  const totalCostBalance = totalCostBudgetPlanned - totalCostRealized;
  const costConsumedPct = totalCostBudgetPlanned > 0 
    ? Math.min(Math.round((totalCostRealized / totalCostBudgetPlanned) * 1000) / 10, 999) 
    : (totalCostRealized > 0 ? 100 : 0);

  // Handlers for Target Budget (COSTS)
  const handleAddCostTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDesc.trim()) return;

    const newTarget: BudgetTarget = {
      id: `target_${Date.now()}`,
      type: targetType,
      periodicity: 'Quarter',
      period: targetPeriod,
      category: targetCategory,
      description: targetDesc.trim(),
      targetAmount: Number(targetAmountVal) || 0
    };

    const nextTargets = [newTarget, ...localTargets];
    notifyParent(nextTargets, localCashFlow);

    setTargetDesc('');
    setTargetAmountVal(15000);
    setShowAddTargetForm(false);
  };

  const handleOpenEditTarget = (target: BudgetTarget) => {
    setEditingTarget(target);
    setEditTargetType((target.type === 'CAPEX' || target.type === 'OPEX') ? target.type : 'CAPEX');
    setEditTargetPeriod(target.period);
    setEditTargetCategory(target.category);
    setEditTargetDesc(target.description);
    setEditTargetAmount(target.targetAmount);
    setEditTargetJustification('');
    setTargetEditError(null);
  };

  const handleSaveEditTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTarget) return;

    const isFinancialChange = Number(editTargetAmount) !== Number(editingTarget.targetAmount);

    // JUSTIFICATION REQUIRED ONLY IF FINANCIAL VALUES CHANGED
    if (isFinancialChange && (!editTargetJustification.trim() || editTargetJustification.trim().length < 10)) {
      setTargetEditError('A alteração de valor orçamentário financeiro exige justificativa obrigatória com no mínimo 10 caracteres.');
      return;
    }

    const todayStr = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const historyEntry: BudgetHistoryItem = {
      id: `hist_${Date.now()}`,
      changeDate: todayStr,
      changedBy: userRole,
      isFinancialChange,
      oldType: editingTarget.type,
      newType: editTargetType,
      oldCategory: editingTarget.category,
      newCategory: editTargetCategory,
      oldDescription: editingTarget.description,
      newDescription: editTargetDesc,
      oldAmount: editingTarget.targetAmount,
      newAmount: editTargetAmount,
      justification: isFinancialChange ? editTargetJustification.trim() : 'Edição de campos cadastrais (sem alteração de valor financeiro)'
    };

    const updatedTarget: BudgetTarget = {
      ...editingTarget,
      type: editTargetType,
      period: editTargetPeriod,
      category: editTargetCategory,
      description: editTargetDesc,
      targetAmount: Number(editTargetAmount) || 0,
      history: [historyEntry, ...(editingTarget.history || [])],
      lastJustification: historyEntry.justification
    };

    const nextTargets = localTargets.map(t => t.id === editingTarget.id ? updatedTarget : t);
    notifyParent(nextTargets, localCashFlow);
    setEditingTarget(null);
  };

  const handleDeleteTarget = (target: BudgetTarget) => {
    setItemToDelete({
      type: 'TARGET',
      id: target.id,
      title: target.category,
      description: target.description
    });
  };

  // Handlers for Cash Flow (COSTS)
  const handleAddCF = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfDesc.trim()) return;

    const numAmount = Number(cfAmountVal) || 0;

    // Check category budget balance for active transactions
    if (cfStatus !== 'CANCELADO') {
      const { hasBalance, info } = checkCategoryBalance(cfType, cfCategory, numAmount);
      if (!hasBalance) {
        setInsufficientBalanceAlert(info);
        return;
      }
    }

    const newCF: CashFlowEntry = {
      id: `cf_${Date.now()}`,
      date: cfDate,
      period: cfPeriod,
      type: cfType,
      category: cfCategory,
      supplierOrDoc: cfSupplier.trim() || 'N/A',
      description: cfDesc.trim(),
      amount: numAmount,
      status: cfStatus
    };

    const nextCF = [newCF, ...localCashFlow];
    notifyParent(localTargets, nextCF);

    setCfDesc('');
    setCfSupplier('');
    setCfAmountVal(5000);
    setShowAddCFForm(false);
  };

  const handleOpenEditCF = (cf: CashFlowEntry) => {
    setEditingCF(cf);
    setEditCfDate(cf.date);
    setEditCfPeriod(cf.period);
    setEditCfType((cf.type === 'CAPEX' || cf.type === 'OPEX') ? cf.type : 'CAPEX');
    setEditCfCategory(cf.category);
    setEditCfSupplier(cf.supplierOrDoc || '');
    setEditCfDesc(cf.description);
    setEditCfAmount(cf.amount);
    setEditCfStatus(cf.status);
    setEditCfJustification('');
    setCfEditError(null);
  };

  const handleSaveEditCF = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCF) return;

    const numAmount = Number(editCfAmount) || 0;

    // Check category budget balance for active transactions (excluding the current record being edited)
    if (editCfStatus !== 'CANCELADO') {
      const { hasBalance, info } = checkCategoryBalance(editCfType, editCfCategory, numAmount, editingCF.id);
      if (!hasBalance) {
        setInsufficientBalanceAlert(info);
        return;
      }
    }

    const isFinancialChange = numAmount !== Number(editingCF.amount) || editCfType !== editingCF.type || editCfCategory !== editingCF.category;

    if (isFinancialChange && (!editCfJustification.trim() || editCfJustification.trim().length < 10)) {
      setCfEditError('A alteração de valor, tipo ou categoria financeira exige justificativa obrigatória com no mínimo 10 caracteres.');
      return;
    }

    const todayStr = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const historyEntry: BudgetHistoryItem = {
      id: `hist_${Date.now()}`,
      changeDate: todayStr,
      changedBy: userRole,
      isFinancialChange,
      oldType: editingCF.type,
      newType: editCfType,
      oldCategory: editingCF.category,
      newCategory: editCfCategory,
      oldAmount: editingCF.amount,
      newAmount: numAmount,
      oldDescription: editingCF.description,
      newDescription: editCfDesc,
      justification: isFinancialChange ? editCfJustification.trim() : 'Edição cadastral do lançamento de caixa'
    };

    const updatedCF: CashFlowEntry = {
      ...editingCF,
      date: editCfDate,
      period: editCfPeriod,
      type: editCfType,
      category: editCfCategory,
      supplierOrDoc: editCfSupplier,
      description: editCfDesc,
      amount: numAmount,
      status: editCfStatus,
      history: [historyEntry, ...(editingCF.history || [])],
      lastJustification: historyEntry.justification
    };

    const nextCF = localCashFlow.map(c => c.id === editingCF.id ? updatedCF : c);
    notifyParent(localTargets, nextCF);
    setEditingCF(null);
  };

  const handleDeleteCF = (cf: CashFlowEntry) => {
    setItemToDelete({
      type: 'CASHFLOW',
      id: cf.id,
      title: cf.description,
      description: cf.supplierOrDoc ? `Evidência/Doc: ${cf.supplierOrDoc}` : undefined
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-fade-in text-xs" id="budget-module">
      
      {/* Module Title Header & Navigation Tabs */}
      <div className="p-4 px-6 border-b border-slate-800 bg-slate-950/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-display flex items-center gap-2">
              Acompanhamento Financeiro do Projeto
              <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-md">
                Gestão VMO & Controladoria
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Gestão de Custos (CAPEX/OPEX) e Captura de Valor (Resultados & Benefícios Estratégicos)
            </p>
          </div>
        </div>

        {/* Period Filter Dropdown */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 font-medium text-[11px]">Período de Análise:</span>
          <select
            value={selectedPeriodFilter}
            onChange={(e) => setSelectedPeriodFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-indigo-300 font-bold px-3 py-1.5 rounded-lg text-xs outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">Todos os Períodos</option>
            {availablePeriods.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

      </div>

      {/* PRIMARY MODULE TABS: CUSTOS (CAPEX/OPEX) vs RESULTADOS (CAPTURA DE VALOR) */}
      <div className="border-b border-slate-800 bg-slate-950/90 p-2 px-6 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setPrimaryTab('COSTS')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border ${
            primaryTab === 'COSTS'
              ? 'bg-indigo-600 text-white shadow-lg border-indigo-400/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850 border-transparent'
          }`}
        >
          <CircleDollarSign className="w-4 h-4 text-emerald-300" />
          <span>1. Gestão Financeira (Custos - CAPEX / OPEX)</span>
        </button>

        <button
          onClick={() => setPrimaryTab('VALUE_CAPTURE')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border ${
            primaryTab === 'VALUE_CAPTURE'
              ? 'bg-teal-600 text-white shadow-lg border-teal-400/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850 border-transparent'
          }`}
        >
          <Award className="w-4 h-4 text-amber-300" />
          <span>2. Gestão de Resultados & Benefícios (Captura de Valor)</span>
        </button>
      </div>

      {/* RENDER CONTENT BASED ON PRIMARY TAB */}
      <div className="p-6 space-y-6">

        {/* =========================================================================
            TAB 1: GESTÃO FINANCEIRA (CUSTOS - CAPEX / OPEX)
            ========================================================================= */}
        {primaryTab === 'COSTS' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* TOP SUMMARY CARDS (PLANEJADO VS REALIZADO + SALDO + % CONSUMIDO) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Orçado Planejado</span>
                    <span className="text-base font-extrabold text-indigo-400 font-mono mt-1 block">
                      R$ {totalCostBudgetPlanned.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">Soma dos Orçamentos CAPEX + OPEX Aprovados</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Realizado (Gasto)</span>
                    <span className="text-base font-extrabold text-rose-400 font-mono mt-1 block">
                      R$ {totalCostRealized.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">Lançamentos em Fluxo de Caixa efetivados</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Saldo Orçamentário</span>
                    <span className={`text-base font-extrabold font-mono mt-1 block ${totalCostBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      R$ {totalCostBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className={`p-2 rounded-lg border ${totalCostBalance >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                    <Scale className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">Diferença disponível em relação ao orçado</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Consumo do Orçamento</span>
                  <span className={`font-mono font-extrabold ${costConsumedPct > 100 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {costConsumedPct}%
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${costConsumedPct > 100 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, costConsumedPct)}%` }}
                  />
                </div>
                <p className="text-[9.5px] text-slate-500">
                  {costConsumedPct > 100 ? '⚠️ Alerta: Estouro orçamentário' : '✅ Consumo dentro da meta estabelecida'}
                </p>
              </div>

            </div>

            {/* SUB-TAB NAV INSIDE COSTS MODULE: PLANEJAMENTO ORÇAMENTÁRIO VS FLUXO DE CAIXA */}
            <div className="flex border-b border-slate-800 gap-2">
              <button
                onClick={() => setCostsSubTab('PLANNING')}
                className={`pb-2.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  costsSubTab === 'PLANNING'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                Planejamento Orçamentário (CAPEX / OPEX)
              </button>

              <button
                onClick={() => setCostsSubTab('CASH_FLOW')}
                className={`pb-2.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  costsSubTab === 'CASH_FLOW'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                Fluxo de Caixa (Lançamentos Realizados)
              </button>
            </div>

            {/* SUB-SECTION A: PLANEJAMENTO ORÇAMENTÁRIO */}
            {costsSubTab === 'PLANNING' && (
              <div className="space-y-4 animate-fade-in">
                
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-200 text-xs">Orçamentos de CAPEX e OPEX Aprovados</h4>
                  {canEdit && (
                    <button
                      onClick={() => setShowAddTargetForm(!showAddTargetForm)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Novo Orçamento CAPEX / OPEX
                    </button>
                  )}
                </div>

                {/* ADD TARGET FORM */}
                {showAddTargetForm && (
                  <form onSubmit={handleAddCostTarget} className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-4 animate-fade-in shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                      <h5 className="font-bold text-indigo-300 text-xs flex items-center gap-2">
                        <Plus className="w-4 h-4 text-indigo-400" /> Cadastrar Novo Item Orçamentário
                      </h5>
                      <span className="text-[11px] text-slate-400">Configuração de verba por tipo e data limite de utilização</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      
                      {/* TIPO: CAPEX OU OPEX */}
                      <div className="md:col-span-3 space-y-1">
                        <label className="text-slate-400 block font-medium">Tipo de Custo</label>
                        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
                          <button
                            type="button"
                            onClick={() => handleTargetTypeChange('CAPEX')}
                            className={`py-1.5 px-2 rounded-md font-bold text-xs transition-all cursor-pointer ${
                              targetType === 'CAPEX'
                                ? 'bg-indigo-600 text-white shadow'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            CAPEX
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTargetTypeChange('OPEX')}
                            className={`py-1.5 px-2 rounded-md font-bold text-xs transition-all cursor-pointer ${
                              targetType === 'OPEX'
                                ? 'bg-emerald-600 text-white shadow'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            OPEX
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          {targetType === 'CAPEX' ? 'Investimento em ativos ou novos sistemas' : 'Despesa operacional recorrente'}
                        </span>
                      </div>

                      {/* PERÍODO: DATA DE EXPIRAÇÃO (dd/mm/aaaa) */}
                      <div className="md:col-span-3 space-y-1">
                        <ExpirationDatePickerInput
                          id="target-expiration-date"
                          label="Data de Expiração da Verba"
                          required
                          value={targetPeriod}
                          onChange={setTargetPeriod}
                          placeholder="dd/mm/aaaa"
                        />
                        <span className="text-[10px] text-slate-500 block">
                          Data limite para utilização dos recursos
                        </span>
                      </div>

                      {/* VALOR ORÇADO */}
                      <div className="md:col-span-3 space-y-1">
                        <label className="text-slate-400 block font-medium">Valor Orçado (R$)</label>
                        <div className="relative flex items-center">
                          <span className="absolute left-2.5 text-slate-400 font-mono font-bold text-xs">R$</span>
                          <input
                            type="number"
                            required
                            step="any"
                            min="0"
                            value={targetAmountVal}
                            onChange={(e) => setTargetAmountVal(Number(e.target.value) || 0)}
                            className="w-full bg-slate-900 border border-slate-800 text-slate-100 pl-9 p-2 rounded-lg font-mono font-bold text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          Teto financeiro aprovado
                        </span>
                      </div>

                      {/* CATEGORIA COMBO BOX */}
                      <div className="md:col-span-3">
                        <FinancialCategorySelector
                          type={targetType}
                          selectedCategory={targetCategory}
                          onChangeCategory={setTargetCategory}
                          categories={allFinancialCategories}
                        />
                      </div>

                      {/* DESCRIÇÃO */}
                      <div className="md:col-span-12 space-y-1">
                        <label className="text-slate-400 block font-medium">Descrição / Detalhamento da Linha Orçamentária</label>
                        <input
                          type="text"
                          required
                          value={targetDesc}
                          onChange={(e) => setTargetDesc(e.target.value)}
                          placeholder="Descreva a finalidade, entregável ou objetivo desta verba..."
                          className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2 rounded-lg font-medium text-xs focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
                      <button
                        type="button"
                        onClick={() => setShowAddTargetForm(false)}
                        className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 font-semibold cursor-pointer text-xs"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 font-bold flex items-center gap-1 cursor-pointer text-xs shadow-lg shadow-indigo-600/20"
                      >
                        <Check className="w-4 h-4" /> Salvar Orçamento
                      </button>
                    </div>
                  </form>
                )}

                {/* COST TARGETS TABLE */}
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950 font-mono text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                        <th className="p-3">Período / Tipo</th>
                        <th className="p-3">Categoria</th>
                        <th className="p-3">Descrição</th>
                        <th className="p-3 text-right">Valor Orçado</th>
                        <th className="p-3 text-right">Consumido (CF)</th>
                        <th className="p-3">Progresso de Consumo</th>
                        {canEdit && <th className="p-3 text-center">Ações</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {filteredCostTargets.map(t => {
                        const actualSpent = localCashFlow
                          .filter(cf => cf.type === t.type && cf.category === t.category && cf.status === 'REALIZADO')
                          .reduce((sum, cf) => sum + cf.amount, 0);

                        const targetPct = t.targetAmount > 0 ? Math.min(Math.round((actualSpent / t.targetAmount) * 100), 999) : 0;

                        return (
                          <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="p-3 font-mono font-semibold text-slate-200">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.type === 'CAPEX' ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'}`}>
                                  {t.type}
                                </span>
                                <span>{t.period}</span>
                              </div>
                            </td>
                            <td className="p-3 font-medium text-slate-300">{t.category}</td>
                            <td className="p-3 text-slate-400 max-w-[260px]">
                              <div className="truncate">{t.description}</div>
                              {t.lastJustification && (
                                <div className="text-[10px] text-amber-400/90 italic truncate mt-0.5">
                                  Obs: {t.lastJustification}
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-indigo-300">
                              R$ {t.targetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-200">
                              R$ {actualSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 min-w-[140px]">
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-mono">
                                  <span className="text-slate-400">{targetPct}%</span>
                                  <span className={targetPct > 100 ? 'text-rose-400' : 'text-slate-400'}>
                                    {targetPct > 100 ? 'Excedido' : 'OK'}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                                  <div
                                    className={`h-full rounded-full transition-all ${targetPct > 100 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${Math.min(100, targetPct)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            {canEdit && (
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {t.history && t.history.length > 0 && (
                                    <button
                                      onClick={() => setViewHistoryItem({ title: `Auditoria Orçamento: ${t.category}`, history: t.history })}
                                      title="Ver histórico de alterações"
                                      className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded cursor-pointer"
                                    >
                                      <History className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleOpenEditTarget(t)}
                                    title="Editar Orçamento"
                                    className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTarget(t)}
                                    title="Excluir Orçamento"
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

                      {filteredCostTargets.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-slate-500 font-mono">
                            Nenhum orçamento de CAPEX/OPEX cadastrado para o período selecionado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* SUB-SECTION B: FLUXO DE CAIXA (LANÇAMENTOS REALIZADOS) */}
            {costsSubTab === 'CASH_FLOW' && (
              <div className="space-y-4 animate-fade-in">
                
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-200 text-xs">Lançamentos Diários de Fluxo de Caixa (Consumo de Saldo)</h4>
                  {canEdit && (
                    <button
                      onClick={() => setShowAddCFForm(!showAddCFForm)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Novo Lançamento de Caixa
                    </button>
                  )}
                </div>

                {/* ADD CASH FLOW FORM */}
                {showAddCFForm && (
                  <form onSubmit={handleAddCF} className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-4 animate-fade-in shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                      <h5 className="font-bold text-emerald-300 text-xs flex items-center gap-2">
                        <Plus className="w-4 h-4 text-emerald-400" /> Novo Lançamento Diário (Fluxo de Caixa)
                      </h5>
                      <span className="text-[11px] text-slate-400">Registro de consumo e saída de verba realizada</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      
                      {/* DATA DO LANÇAMENTO */}
                      <div className="md:col-span-3 space-y-1">
                        <ExpirationDatePickerInput
                          id="cf-entry-date"
                          label="Data do Pagamento / Lançamento"
                          required
                          value={cfDate}
                          onChange={setCfDate}
                          placeholder="dd/mm/aaaa"
                        />
                        <span className="text-[10px] text-slate-500 block">Data do efetivo desembolso</span>
                      </div>

                      {/* TIPO: CAPEX OU OPEX */}
                      <div className="md:col-span-3 space-y-1">
                        <label className="text-slate-400 block font-medium">Tipo de Custo</label>
                        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
                          <button
                            type="button"
                            onClick={() => handleCfTypeChange('CAPEX')}
                            className={`py-1.5 px-2 rounded-md font-bold text-xs transition-all cursor-pointer ${
                              cfType === 'CAPEX'
                                ? 'bg-indigo-600 text-white shadow'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            CAPEX
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCfTypeChange('OPEX')}
                            className={`py-1.5 px-2 rounded-md font-bold text-xs transition-all cursor-pointer ${
                              cfType === 'OPEX'
                                ? 'bg-emerald-600 text-white shadow'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            OPEX
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-500 block">Classificação contábil</span>
                      </div>

                      {/* STATUS */}
                      <div className="md:col-span-3 space-y-1">
                        <label className="text-slate-400 block font-medium">Status do Pagamento</label>
                        <select
                          value={cfStatus}
                          onChange={(e) => setCfStatus(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2 rounded-lg font-medium text-xs focus:border-indigo-500 focus:outline-none"
                        >
                          <option value="REALIZADO">✅ REALIZADO (Pago)</option>
                          <option value="PREVISTO">⏳ PREVISTO (Compromissado)</option>
                        </select>
                        <span className="text-[10px] text-slate-500 block">Execução financeira</span>
                      </div>

                      {/* VALOR DO LANÇAMENTO */}
                      <div className="md:col-span-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-slate-400 block font-medium">Valor do Lançamento (R$)</label>
                          {addCategoryBalanceInfo && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              Saldo Disp: <strong className={addCategoryBalanceInfo.balance >= cfAmountVal ? 'text-emerald-400' : 'text-rose-400'}>
                                R$ {addCategoryBalanceInfo.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </strong>
                            </span>
                          )}
                        </div>
                        <div className="relative flex items-center">
                          <span className="absolute left-2.5 text-slate-400 font-mono font-bold text-xs">R$</span>
                          <input
                            type="number"
                            required
                            step="any"
                            min="0"
                            value={cfAmountVal}
                            onChange={(e) => setCfAmountVal(Number(e.target.value) || 0)}
                            className="w-full bg-slate-900 border border-slate-800 text-slate-100 pl-9 p-2 rounded-lg font-mono font-bold text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 block">Valor líquido despendido</span>
                      </div>

                      {/* CATEGORIA COMBO BOX */}
                      <div className="md:col-span-6">
                        <FinancialCategorySelector
                          type={cfType}
                          selectedCategory={cfCategory}
                          onChangeCategory={setCfCategory}
                          categories={allFinancialCategories}
                        />
                      </div>

                      {/* FORNECEDOR / DOC */}
                      <div className="md:col-span-6 space-y-1">
                        <label className="text-slate-400 block font-medium">Fornecedor / Doc / NF-e</label>
                        <input
                          type="text"
                          value={cfSupplier}
                          onChange={(e) => setCfSupplier(e.target.value)}
                          placeholder="Ex: Oracle do Brasil / NF-e 991203"
                          className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2 rounded-lg font-medium text-xs focus:border-indigo-500 focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-500 block">Identificador fiscal ou contrato</span>
                      </div>

                      {/* DESCRIÇÃO */}
                      <div className="md:col-span-12 space-y-1">
                        <label className="text-slate-400 block font-medium">Descrição do Pagamento Realizado</label>
                        <input
                          type="text"
                          required
                          value={cfDesc}
                          onChange={(e) => setCfDesc(e.target.value)}
                          placeholder="Descreva o serviço faturado, entrega ou justificativa..."
                          className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2 rounded-lg font-medium text-xs focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
                      <button
                        type="button"
                        onClick={() => setShowAddCFForm(false)}
                        className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 font-semibold cursor-pointer text-xs"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 font-bold flex items-center gap-1 cursor-pointer text-xs shadow-lg shadow-emerald-600/20"
                      >
                        <Check className="w-4 h-4" /> Registrar Lançamento
                      </button>
                    </div>
                  </form>
                )}

                {/* CASH FLOW TABLE */}
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950 font-mono text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                        <th className="p-3">Data / Período</th>
                        <th className="p-3">Tipo / Categoria</th>
                        <th className="p-3">Fornecedor / Descrição</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-right">Valor do Lançamento</th>
                        {canEdit && <th className="p-3 text-center">Ações</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {filteredCostCashFlow.map(cf => (
                        <tr key={cf.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="p-3 font-mono font-semibold text-slate-200">
                            <div>{cf.date}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{cf.period}</div>
                          </td>
                          <td className="p-3 font-medium text-slate-300">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 mr-2">
                              {cf.type}
                            </span>
                            {cf.category}
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
                                : cf.status === 'PREVISTO'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                              {cf.status}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-100">
                            R$ {cf.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          {canEdit && (
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {cf.history && cf.history.length > 0 && (
                                  <button
                                    onClick={() => setViewHistoryItem({ title: `Auditoria Lançamento: ${cf.description}`, history: cf.history })}
                                    title="Ver histórico de alterações"
                                    className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded cursor-pointer"
                                  >
                                    <History className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleOpenEditCF(cf)}
                                  title="Editar Lançamento"
                                  className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCF(cf)}
                                  title="Excluir Lançamento"
                                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}

                      {filteredCostCashFlow.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-500 font-mono">
                            Nenhum lançamento de fluxo de caixa registrado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

          </div>
        )}

        {/* =========================================================================
            TAB 2: GESTÃO DE RESULTADOS E BENEFÍCIOS (CAPTURA DE VALOR)
            ========================================================================= */}
        {primaryTab === 'VALUE_CAPTURE' && (
          <ValueCaptureSection
            projectId={project.id}
            targets={localTargets}
            cashFlowEntries={localCashFlow}
            userRole={userRole}
            onAddTarget={(newTarget) => {
              const nextTargets = [newTarget, ...localTargets];
              notifyParent(nextTargets, localCashFlow);
            }}
            onUpdateTarget={(updatedTarget) => {
              const nextTargets = localTargets.map(t => t.id === updatedTarget.id ? updatedTarget : t);
              notifyParent(nextTargets, localCashFlow);
            }}
            onDeleteTarget={(id) => {
              const nextTargets = localTargets.filter(t => t.id !== id);
              notifyParent(nextTargets, localCashFlow);
            }}
            onAddCashFlow={(newCF) => {
              const nextCF = [newCF, ...localCashFlow];
              notifyParent(localTargets, nextCF);
            }}
            onUpdateCashFlow={(updatedCF) => {
              const nextCF = localCashFlow.map(c => c.id === updatedCF.id ? updatedCF : c);
              notifyParent(localTargets, nextCF);
            }}
            onDeleteCashFlow={(id) => {
              const nextCF = localCashFlow.filter(c => c.id !== id);
              notifyParent(localTargets, nextCF);
            }}
            onViewHistory={(item) => setViewHistoryItem(item)}
          />
        )}

      </div>


      {/* =========================================================================
          MODAL: EDIT COST TARGET WITH AUDIT JUSTIFICATION
          ========================================================================= */}
      {editingTarget && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-400" />
                Editar Orçamento ({editingTarget.type} - {editingTarget.category})
              </h3>
              <button
                onClick={() => setEditingTarget(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {targetEditError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{targetEditError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditTarget} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                
                {/* TIPO */}
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Tipo de Custo</label>
                  <select
                    value={editTargetType}
                    onChange={(e) => setEditTargetType(e.target.value as 'CAPEX' | 'OPEX')}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2 rounded-lg font-medium"
                  >
                    <option value="CAPEX">CAPEX</option>
                    <option value="OPEX">OPEX</option>
                  </select>
                </div>

                {/* PERÍODO: DATA DE EXPIRAÇÃO */}
                <div>
                  <ExpirationDatePickerInput
                    id="edit-target-expiration-date"
                    label="Data de Expiração da Verba"
                    required
                    value={editTargetPeriod}
                    onChange={setEditTargetPeriod}
                    placeholder="dd/mm/aaaa"
                  />
                </div>

                {/* CATEGORIA COMBO BOX */}
                <div className="col-span-2">
                  <FinancialCategorySelector
                    type={editTargetType}
                    selectedCategory={editTargetCategory}
                    onChangeCategory={setEditTargetCategory}
                    categories={allFinancialCategories}
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-indigo-300 font-bold block mb-1">Valor Orçado (R$)</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-slate-400 font-mono font-bold text-xs">R$</span>
                    <input
                      type="number"
                      required
                      step="any"
                      min="0"
                      value={editTargetAmount}
                      onChange={(e) => setEditTargetAmount(Number(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 pl-9 p-2.5 rounded-lg font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="text-slate-400 block mb-1">Descrição</label>
                  <input
                    type="text"
                    required
                    value={editTargetDesc}
                    onChange={(e) => setEditTargetDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2 rounded-lg font-medium"
                  />
                </div>

                {/* Justification Textarea */}
                <div className="col-span-2 space-y-1">
                  <label className="text-slate-200 font-bold block">
                    Justificativa da Alteração {editTargetAmount !== editingTarget.targetAmount && <span className="text-rose-400">(*Obrigatória)</span>}
                  </label>
                  <textarea
                    rows={3}
                    value={editTargetJustification}
                    onChange={(e) => setEditTargetJustification(e.target.value)}
                    placeholder={
                      editTargetAmount !== editingTarget.targetAmount
                        ? "Descreva a justificativa para alteração do valor orçamentário (mínimo 10 caracteres)..."
                        : "Obs opcional para alterações cadastrais..."
                    }
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTarget(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 flex items-center gap-1 cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                  <Check className="w-4 h-4" /> Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* =========================================================================
          MODAL: EDIT CASH FLOW WITH AUDIT JUSTIFICATION
          ========================================================================= */}
      {editingCF && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-400" />
                Editar Lançamento de Caixa ({editingCF.type} - {editingCF.category})
              </h3>
              <button
                onClick={() => setEditingCF(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {cfEditError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{cfEditError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditCF} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                
                {/* DATA DO LANÇAMENTO */}
                <div className="md:col-span-6 space-y-1">
                  <ExpirationDatePickerInput
                    id="edit-cf-date"
                    label="Data do Pagamento / Lançamento"
                    required
                    value={editCfDate}
                    onChange={setEditCfDate}
                    placeholder="dd/mm/aaaa"
                  />
                  <span className="text-[10px] text-slate-500 block">Data do efetivo desembolso</span>
                </div>

                {/* TIPO: CAPEX OU OPEX (MESMO FORMATO DO CADASTRO) */}
                <div className="md:col-span-6 space-y-1">
                  <label className="text-slate-400 block font-medium">Tipo de Custo</label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
                    <button
                      type="button"
                      onClick={() => handleEditCfTypeChange('CAPEX')}
                      className={`py-1.5 px-2 rounded-md font-bold text-xs transition-all cursor-pointer ${
                        editCfType === 'CAPEX'
                          ? 'bg-indigo-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      CAPEX
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditCfTypeChange('OPEX')}
                      className={`py-1.5 px-2 rounded-md font-bold text-xs transition-all cursor-pointer ${
                        editCfType === 'OPEX'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      OPEX
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500 block">Classificação contábil</span>
                </div>

                {/* STATUS DO PAGAMENTO */}
                <div className="md:col-span-6 space-y-1">
                  <label className="text-slate-400 block font-medium">Status do Pagamento</label>
                  <select
                    value={editCfStatus}
                    onChange={(e) => setEditCfStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2 rounded-lg font-medium text-xs focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="REALIZADO">✅ REALIZADO (Pago)</option>
                    <option value="PREVISTO">⏳ PREVISTO (Compromissado)</option>
                    <option value="CANCELADO">❌ CANCELADO</option>
                  </select>
                  <span className="text-[10px] text-slate-500 block">Execução financeira</span>
                </div>

                {/* VALOR DO LANÇAMENTO */}
                <div className="md:col-span-6 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-emerald-400 font-bold block font-medium">Valor do Lançamento (R$)</label>
                    {editCategoryBalanceInfo && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        Saldo Disp: <strong className={editCategoryBalanceInfo.balance >= editCfAmount ? 'text-emerald-400' : 'text-rose-400'}>
                          R$ {editCategoryBalanceInfo.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </strong>
                      </span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-slate-400 font-mono font-bold text-xs">R$</span>
                    <input
                      type="number"
                      required
                      step="any"
                      min="0"
                      value={editCfAmount}
                      onChange={(e) => setEditCfAmount(Number(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 pl-9 p-2 rounded-lg font-mono font-bold text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block">Valor líquido despendido</span>
                </div>

                {/* CATEGORIA COMBO BOX (MESMO FORMATO DO CADASTRO) */}
                <div className="md:col-span-6">
                  <FinancialCategorySelector
                    type={editCfType}
                    selectedCategory={editCfCategory}
                    onChangeCategory={setEditCfCategory}
                    categories={allFinancialCategories}
                  />
                </div>

                {/* FORNECEDOR / DOC */}
                <div className="md:col-span-6 space-y-1">
                  <label className="text-slate-400 block font-medium">Fornecedor / Doc / NF-e</label>
                  <input
                    type="text"
                    value={editCfSupplier}
                    onChange={(e) => setEditCfSupplier(e.target.value)}
                    placeholder="Ex: Oracle do Brasil / NF-e 991203"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2 rounded-lg font-medium text-xs focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 block">Identificador fiscal ou contrato</span>
                </div>

                {/* DESCRIÇÃO */}
                <div className="md:col-span-12 space-y-1">
                  <label className="text-slate-400 block font-medium">Descrição do Pagamento Realizado</label>
                  <input
                    type="text"
                    required
                    value={editCfDesc}
                    onChange={(e) => setEditCfDesc(e.target.value)}
                    placeholder="Descreva o serviço faturado, entrega ou justificativa..."
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2 rounded-lg font-medium text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Justification Textarea */}
                <div className="md:col-span-12 space-y-1">
                  <label className="text-slate-200 font-bold block">
                    Justificativa da Alteração {(editCfAmount !== editingCF.amount || editCfType !== editingCF.type || editCfCategory !== editingCF.category) && <span className="text-rose-400">(*Obrigatória)</span>}
                  </label>
                  <textarea
                    rows={2}
                    value={editCfJustification}
                    onChange={(e) => setEditCfJustification(e.target.value)}
                    placeholder={
                      (editCfAmount !== editingCF.amount || editCfType !== editingCF.type || editCfCategory !== editingCF.category)
                        ? "Descreva a justificativa para alteração de valor, tipo ou categoria financeira (mínimo 10 caracteres)..."
                        : "Obs opcional para alterações cadastrais..."
                    }
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCF(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-500 flex items-center gap-1 cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  <Check className="w-4 h-4" /> Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* =========================================================================
          MODAL: HISTORY AUDIT LOG
          ========================================================================= */}
      {viewHistoryItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                {viewHistoryItem.title}
              </h3>
              <button
                onClick={() => setViewHistoryItem(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {viewHistoryItem.history && viewHistoryItem.history.length > 0 ? (
                viewHistoryItem.history.map(item => (
                  <div key={item.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 font-sans">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-400">{item.changeDate} - por <strong className="text-indigo-300">{item.changedBy}</strong></span>
                      <span className={`px-2 py-0.5 rounded font-bold ${item.isFinancialChange ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-slate-800 text-slate-400'}`}>
                        {item.isFinancialChange ? 'Altera Financeiro' : 'Edição Cadastral'}
                      </span>
                    </div>

                    {item.isFinancialChange && (
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-slate-500 line-through">
                          R$ {item.oldAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-slate-400">➔</span>
                        <span className="text-emerald-400 font-bold">
                          R$ {item.newAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-300 bg-slate-900/80 p-2 rounded border border-slate-850/80">
                      <strong>Justificativa:</strong> {item.justification}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 font-mono text-center py-4">Nenhum registro de auditoria disponível.</p>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setViewHistoryItem(null)}
                className="px-4 py-2 bg-slate-800 text-slate-200 font-bold rounded-lg hover:bg-slate-700 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: INSUFFICIENT BALANCE ALERT POP-UP
          ========================================================================= */}
      {insufficientBalanceAlert && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-[80] animate-fade-in text-xs">
          <div className="bg-slate-900 border-2 border-rose-500/50 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl shadow-rose-950/50 animate-scale-in">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    Lançamento Bloqueado: Saldo Insuficiente
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Não há saldo orçamentário suficiente na categoria para este lançamento.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInsufficientBalanceAlert(null)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category info */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-medium">Categoria do Lançamento:</span>
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                    insufficientBalanceAlert.type === 'CAPEX' 
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {insufficientBalanceAlert.type}
                  </span>
                  <strong className="text-slate-200 text-xs">{insufficientBalanceAlert.category}</strong>
                </div>
              </div>

              {/* Financial Breakdown Table */}
              <div className="space-y-2 pt-2 border-t border-slate-850 text-xs font-mono">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Orçamento Planejado Aprovado:</span>
                  <span className="text-indigo-300 font-bold">
                    R$ {insufficientBalanceAlert.plannedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-400">
                  <span>Total Já Realizado em Outros Lançamentos:</span>
                  <span className="text-slate-300">
                    R$ {insufficientBalanceAlert.consumedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 font-bold">
                  <span className="text-slate-300">Saldo Disponível na Categoria:</span>
                  <span className={insufficientBalanceAlert.availableBalance > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    R$ {insufficientBalanceAlert.availableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center text-rose-300 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20 font-bold">
                  <span>Valor do Lançamento Solicitado:</span>
                  <span className="text-rose-300 text-sm">
                    R$ {insufficientBalanceAlert.attemptedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center text-rose-400 text-[11px] px-1 font-bold">
                  <span>Déficit / Valor Excedente:</span>
                  <span>
                    - R$ {(insufficientBalanceAlert.attemptedAmount - insufficientBalanceAlert.availableBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Explanation alert box */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-amber-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>O que fazer para prosseguir?</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                {insufficientBalanceAlert.plannedAmount === 0
                  ? `Não há verba cadastrada para a categoria "${insufficientBalanceAlert.category}". Cadastre primeiro um orçamento aprovado para esta categoria na aba "Planejamento Orçamentário".`
                  : `Ajuste o valor deste lançamento para até R$ ${insufficientBalanceAlert.availableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, ou solicite a ampliação da verba na aba "Planejamento Orçamentário".`}
              </p>
            </div>

            {/* Action button */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setInsufficientBalanceAlert(null)}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-600/30 cursor-pointer flex items-center justify-center gap-2 text-xs"
              >
                <Check className="w-4 h-4" /> Entendido / Ajustar Lançamento
              </button>
            </div>

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
                  {itemToDelete.type === 'TARGET' ? 'Excluir Linha Orçamentária' : 'Excluir Lançamento de Caixa'}
                </h3>
                <p className="text-[11px] text-slate-400">Esta ação removerá o registro permanentemente.</p>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Item Selecionado</span>
              <div className="font-semibold text-slate-200 text-xs">{itemToDelete.title}</div>
              {itemToDelete.description && (
                <div className="text-[11px] text-slate-400">{itemToDelete.description}</div>
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
