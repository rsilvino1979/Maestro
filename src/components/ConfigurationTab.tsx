import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings, Plus, Edit2, Trash2, Check, X, SlidersHorizontal, 
  AlertCircle, Info, ShieldAlert, Building2, Inbox, Layers, 
  ToggleLeft, ToggleRight, Sparkles, FolderKanban, ClipboardList,
  CheckCircle2, XCircle, Zap, Power, DollarSign, Lightbulb, Search,
  FileText, Tag, RotateCcw, HelpCircle, Landmark
} from 'lucide-react';
import { User, Tenant, Persona, FinancialCategoryConfig } from '../types';
import { DEFAULT_FINANCIAL_CATEGORIES } from '../data/defaultFinancialCategories';

interface CriteriaWeight {
  id: string;
  name: string;
  key: string;
  weight: number;
  desc: string;
}

interface ConfigurationTabProps {
  // Configurations list
  configPorte: string[];
  setConfigPorte: React.Dispatch<React.SetStateAction<string[]>>;
  configPortfolios: string[];
  setConfigPortfolios: React.Dispatch<React.SetStateAction<string[]>>;
  configClientes: string[];
  setConfigClientes: React.Dispatch<React.SetStateAction<string[]>>;
  configSegmentos: string[];
  setConfigSegmentos: React.Dispatch<React.SetStateAction<string[]>>;
  configAreasAtendidas: string[];
  setConfigAreasAtendidas: React.Dispatch<React.SetStateAction<string[]>>;
  configTemas: string[];
  setConfigTemas: React.Dispatch<React.SetStateAction<string[]>>;
  configFases: string[];
  setConfigFases: React.Dispatch<React.SetStateAction<string[]>>;
  configCriteriaWeights: CriteriaWeight[];
  onCriteriaWeightsChange: (newCriteria: CriteriaWeight[]) => void;
  configPilares: string[];
  setConfigPilares: React.Dispatch<React.SetStateAction<string[]>>;
  configFinancialCategories?: FinancialCategoryConfig[];
  setConfigFinancialCategories?: React.Dispatch<React.SetStateAction<FinancialCategoryConfig[]>>;
  userRole: string;
  tenants: Tenant[];
  currentTenantId: string;
  activeTenantId: string;
  setActiveTenantId: React.Dispatch<React.SetStateAction<string>>;
  setTenants?: React.Dispatch<React.SetStateAction<Tenant[]>>;
  isITDemandsModuleEnabled?: boolean;
  setIsITDemandsModuleEnabled?: React.Dispatch<React.SetStateAction<boolean>>;
}

type ConfigCategory = 
  | 'porte'
  | 'portfolios'
  | 'clientes'
  | 'segmentos'
  | 'areas'
  | 'temas'
  | 'fases'
  | 'pesos'
  | 'pilares'
  | 'categoriasFinanceiras'
  | 'modulos'
  | 'tenants';

export default function ConfigurationTab({
  configPorte,
  setConfigPorte,
  configPortfolios,
  setConfigPortfolios,
  configClientes,
  setConfigClientes,
  configSegmentos,
  setConfigSegmentos,
  configAreasAtendidas,
  setConfigAreasAtendidas,
  configTemas,
  setConfigTemas,
  configFases,
  setConfigFases,
  configCriteriaWeights,
  onCriteriaWeightsChange,
  configPilares,
  setConfigPilares,
  configFinancialCategories,
  setConfigFinancialCategories,
  userRole,
  tenants,
  currentTenantId,
  activeTenantId,
  setActiveTenantId,
  setTenants,
  isITDemandsModuleEnabled = true,
  setIsITDemandsModuleEnabled,
}: ConfigurationTabProps) {
  // Determine if user has SUPER_ADMIN or TENANT_ADMIN status
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isTenantAdmin = userRole === 'TENANT_ADMIN';

  // State to hold active category (defaults to 'porte' as required)
  const [activeCategory, setActiveCategory] = useState<ConfigCategory>('porte');
  const [newItemValue, setNewItemValue] = useState('');
  
  // Inline editing states
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  // Auxiliary state for editing a criterion's properties
  const [editingCriterionId, setEditingCriterionId] = useState<string | null>(null);
  const [editingCriterionName, setEditingCriterionName] = useState('');
  const [editingCriterionWeight, setEditingCriterionWeight] = useState<number>(0);
  const [editingCriterionDesc, setEditingCriterionDesc] = useState('');

  // Tenant registration local form state (Only accessible to SUPER_ADMIN)
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantId, setNewTenantId] = useState('');
  const [newTenantDomain, setNewTenantDomain] = useState('');
  const [newTenantPlan, setNewTenantPlan] = useState<'Growth' | 'Enterprise'>('Growth');
  const [newTenantLogo, setNewTenantLogo] = useState<string>('');

  // Financial categories state management
  const finCategories = configFinancialCategories || DEFAULT_FINANCIAL_CATEGORIES;
  const [finFilterType, setFinFilterType] = useState<'ALL' | 'CAPEX' | 'OPEX'>('ALL');
  const [finSearchQuery, setFinSearchQuery] = useState('');
  const [showAddFinModal, setShowAddFinModal] = useState(false);
  const [newFinType, setNewFinType] = useState<'CAPEX' | 'OPEX'>('CAPEX');
  const [newFinCategory, setNewFinCategory] = useState('');
  const [newFinDescription, setNewFinDescription] = useState('');
  const [newFinPracticalExample, setNewFinPracticalExample] = useState('');

  const [editingFinCategory, setEditingFinCategory] = useState<FinancialCategoryConfig | null>(null);

  const canEdit = isSuperAdmin || isTenantAdmin;

  // Define allowed config categories
  const categories = useMemo(() => {
    const list: { id: ConfigCategory; label: string; desc: string }[] = [
      { id: 'porte', label: 'Porte do Projeto', desc: 'Classificação de complexidade, budget e esforço dos projetos' },
      { id: 'portfolios', label: 'Portfólios', desc: 'Macroáreas de investimento ou programas estratégicos' },
      { id: 'clientes', label: 'Clientes', desc: 'Cadastro de clientes internos e externos atendidos pelas demandas' },
      { id: 'segmentos', label: 'Segmentos de Negócio', desc: 'Cadastro dos segmentos de mercado e verticais de atuação' },
      { id: 'areas', label: 'Áreas Atendidas', desc: 'Silos funcionais e departamentos beneficiados diretamente' },
      { id: 'temas', label: 'Temas', desc: 'Rótulos corporativos e verticais tecnológicas do VMO' },
      { id: 'fases', label: 'Fases do Projeto', desc: 'Estágios do ciclo de vida regulados no PMI/Gantt' },
      { id: 'pesos', label: 'Critérios de Avaliação e Pesos', desc: 'Pesos ponderados para classificação de demandas' },
      { id: 'pilares', label: 'Pilar Estratégico Principal', desc: 'Metas globais e propósitos da alta diretoria' },
      { id: 'categoriasFinanceiras', label: 'Categorias de Lançamento (CAPEX / OPEX)', desc: 'Classificação orçamentária e financeira de lançamentos com descrições e exemplos práticos para o projeto' },
      { id: 'modulos', label: 'Módulos & Features', desc: 'Habilitar ou desabilitar módulos do sistema (Ex: Abertura de Demandas de TI)' },
    ];
    if (isSuperAdmin) {
      list.push({ id: 'tenants', label: 'Cadastrar Nova Tenant', desc: 'Painel do Super Admin para provisionar e gerenciar novas empresas' });
    }
    return list;
  }, [isSuperAdmin]);

  // If the active category is tenants or modulos, we can bypass the "select a tenant" validation
  const isBypassedCategory = activeCategory === 'tenants' || activeCategory === 'modulos';

  // Base handlers for additions
  const handleAddValue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemValue.trim()) return;

    if (!canEdit) {
      alert('Não autorizado: Apenas Administradores podem alterar as parametrizações.');
      return;
    }

    // Require tenant selection for Super Admin for configuration categories
    if (isSuperAdmin && !activeTenantId && !isBypassedCategory) {
      alert('Por favor, selecione uma Empresa/Tenant para gerenciar antes de salvar.');
      return;
    }

    const val = newItemValue.trim();

    switch (activeCategory) {
      case 'porte':
        setConfigPorte(prev => [...prev, val]);
        break;
      case 'portfolios':
        setConfigPortfolios(prev => [...prev, val]);
        break;
      case 'clientes':
        setConfigClientes(prev => [...prev, val]);
        break;
      case 'segmentos':
        setConfigSegmentos(prev => [...prev, val]);
        break;
      case 'areas':
        setConfigAreasAtendidas(prev => [...prev, val]);
        break;
      case 'temas':
        setConfigTemas(prev => [...prev, val]);
        break;
      case 'fases':
        setConfigFases(prev => [...prev, val]);
        break;
      case 'pilares':
        setConfigPilares(prev => [...prev, val]);
        break;
    }

    setNewItemValue('');
  };

  // Financial Category Handlers
  const handleAddFinancialCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFinCategory.trim() || !newFinDescription.trim()) return;

    if (!canEdit) {
      alert('Não autorizado: Apenas Administradores podem cadastrar novas categorias.');
      return;
    }

    if (isSuperAdmin && !activeTenantId && !isBypassedCategory) {
      alert('Por favor, selecione uma Empresa/Tenant para gerenciar antes de salvar.');
      return;
    }

    const nextCode = finCategories.length > 0 
      ? Math.max(...finCategories.map(c => c.code || 0)) + 1 
      : 1;

    const newItem: FinancialCategoryConfig = {
      id: `fcat_${Date.now()}`,
      code: nextCode,
      type: newFinType,
      category: newFinCategory.trim(),
      description: newFinDescription.trim(),
      practicalExample: newFinPracticalExample.trim() || 'Exemplo prático aplicado a iniciativas do projeto.'
    };

    if (setConfigFinancialCategories) {
      setConfigFinancialCategories(prev => [...prev, newItem]);
    }

    setNewFinCategory('');
    setNewFinDescription('');
    setNewFinPracticalExample('');
    setShowAddFinModal(false);
  };

  const handleSaveEditFinancialCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFinCategory || !editingFinCategory.category.trim() || !editingFinCategory.description.trim()) return;

    if (!canEdit) return;

    if (setConfigFinancialCategories) {
      setConfigFinancialCategories(prev => 
        prev.map(c => c.id === editingFinCategory.id ? { ...editingFinCategory, category: editingFinCategory.category.trim(), description: editingFinCategory.description.trim(), practicalExample: editingFinCategory.practicalExample.trim() } : c)
      );
    }

    setEditingFinCategory(null);
  };

  const handleResetFinancialCategoriesToDefault = () => {
    if (!canEdit) return;
    if (confirm('Deseja restaurar a lista padrão com as 20 iniciativas de CAPEX e OPEX recomendadas pelo framework VMO?')) {
      if (setConfigFinancialCategories) {
        setConfigFinancialCategories(DEFAULT_FINANCIAL_CATEGORIES);
      }
    }
  };

  // Custom non-blocking state-based removal handlers
  const [deleteDialog, setDeleteDialog] = useState<{
    show: boolean;
    type: 'list' | 'criterion' | 'fin_category';
    indexOrId: number | string;
    label: string;
  }>({
    show: false,
    type: 'list',
    indexOrId: -1,
    label: '',
  });

  const handleDeleteValueTrigger = (index: number, label: string) => {
    if (!canEdit) {
      alert('Não autorizado: Apenas Administradores podem parametrizar dados.');
      return;
    }

    if (isSuperAdmin && !activeTenantId && !isBypassedCategory) {
      alert('Não autorizado: Escolha uma Empresa/Tenant antes de deletar parametrizações.');
      return;
    }

    setDeleteDialog({
      show: true,
      type: 'list',
      indexOrId: index,
      label,
    });
  };

  const handleDeleteCriterionTrigger = (id: string, label: string) => {
    if (!canEdit) {
      alert('Não autorizado: Apenas Administradores podem parametrizar dados.');
      return;
    }

    if (isSuperAdmin && !activeTenantId && !isBypassedCategory) {
      alert('Não autorizado: Escolha uma Empresa/Tenant antes de deletar parametrizações.');
      return;
    }

    setDeleteDialog({
      show: true,
      type: 'criterion',
      indexOrId: id,
      label,
    });
  };

  const handleDeleteFinCategoryTrigger = (id: string, label: string) => {
    if (!canEdit) {
      alert('Não autorizado: Apenas Administradores podem parametrizar dados.');
      return;
    }

    if (isSuperAdmin && !activeTenantId && !isBypassedCategory) {
      alert('Não autorizado: Escolha uma Empresa/Tenant antes de deletar parametrizações.');
      return;
    }

    setDeleteDialog({
      show: true,
      type: 'fin_category',
      indexOrId: id,
      label,
    });
  };

  const executeDelete = () => {
    const { type, indexOrId } = deleteDialog;

    if (type === 'list') {
      const index = indexOrId as number;
      switch (activeCategory) {
        case 'porte':
          setConfigPorte(prev => prev.filter((_, i) => i !== index));
          break;
        case 'portfolios':
          setConfigPortfolios(prev => prev.filter((_, i) => i !== index));
          break;
        case 'clientes':
          setConfigClientes(prev => prev.filter((_, i) => i !== index));
          break;
        case 'segmentos':
          setConfigSegmentos(prev => prev.filter((_, i) => i !== index));
          break;
        case 'areas':
          setConfigAreasAtendidas(prev => prev.filter((_, i) => i !== index));
          break;
        case 'temas':
          setConfigTemas(prev => prev.filter((_, i) => i !== index));
          break;
        case 'fases':
          setConfigFases(prev => prev.filter((_, i) => i !== index));
          break;
        case 'pilares':
          setConfigPilares(prev => prev.filter((_, i) => i !== index));
          break;
      }
    } else if (type === 'criterion') {
      const id = indexOrId as string;
      const updated = configCriteriaWeights.filter(c => c.id !== id);
      onCriteriaWeightsChange(updated);
    } else if (type === 'fin_category') {
      const id = indexOrId as string;
      if (setConfigFinancialCategories) {
        setConfigFinancialCategories(prev => prev.filter(c => c.id !== id));
      }
    }

    setEditingIndex(null);
    setDeleteDialog({ show: false, type: 'list', indexOrId: -1, label: '' });
  };

  const handleStartEdit = (index: number, val: string) => {
    if (!canEdit) return;
    setEditingIndex(index);
    setEditingValue(val);
  };

  const handleSaveEdit = (index: number) => {
    if (!editingValue.trim()) return;

    switch (activeCategory) {
      case 'porte':
        setConfigPorte(prev => prev.map((item, i) => i === index ? editingValue.trim() : item));
        break;
      case 'portfolios':
        setConfigPortfolios(prev => prev.map((item, i) => i === index ? editingValue.trim() : item));
        break;
      case 'clientes':
        setConfigClientes(prev => prev.map((item, i) => i === index ? editingValue.trim() : item));
        break;
      case 'segmentos':
        setConfigSegmentos(prev => prev.map((item, i) => i === index ? editingValue.trim() : item));
        break;
      case 'areas':
        setConfigAreasAtendidas(prev => prev.map((item, i) => i === index ? editingValue.trim() : item));
        break;
      case 'temas':
        setConfigTemas(prev => prev.map((item, i) => i === index ? editingValue.trim() : item));
        break;
      case 'fases':
        setConfigFases(prev => prev.map((item, i) => i === index ? editingValue.trim() : item));
        break;
      case 'pilares':
        setConfigPilares(prev => prev.map((item, i) => i === index ? editingValue.trim() : item));
        break;
    }

    setEditingIndex(null);
  };

  // Weights calculation
  const totalWeights = configCriteriaWeights.reduce((acc, c) => acc + c.weight, 0);

  const handleStartEditCriterion = (criterion: CriteriaWeight) => {
    if (!canEdit) return;
    setEditingCriterionId(criterion.id);
    setEditingCriterionName(criterion.name);
    setEditingCriterionWeight(criterion.weight);
    setEditingCriterionDesc(criterion.desc);
  };

  const handleSaveCriterion = () => {
    if (!editingCriterionName.trim()) return;

    const updated = configCriteriaWeights.map(c => {
      if (c.id === editingCriterionId) {
        return {
          ...c,
          name: editingCriterionName.trim(),
          weight: editingCriterionWeight,
          desc: editingCriterionDesc.trim()
        };
      }
      return c;
    });

    onCriteriaWeightsChange(updated);
    setEditingCriterionId(null);
  };

  // Base64 Logo encoder
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('O arquivo excede o limite estipulado de 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      setNewTenantLogo(base64);
    };
    reader.readAsDataURL(file);
  };

  // Register modern Tenant
  const handleRegisterTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName.trim() || !newTenantId.trim() || !newTenantDomain.trim()) {
      alert('Preencha os campos mandatórios.');
      return;
    }

    const cleanedId = newTenantId.trim().toLowerCase().replace(/\s+/g, '_');
    
    if (tenants.some(t => t.id === cleanedId)) {
      alert('Essa tenant/id já está em uso.');
      return;
    }

    const newTenant: Tenant = {
      id: cleanedId,
      name: newTenantName.trim(),
      domain: newTenantDomain.trim().toLowerCase(),
      plan: newTenantPlan,
      logoUrl: newTenantLogo || undefined,
    };

    if (setTenants) {
      setTenants(prev => [...prev, newTenant]);
      alert(`Tenant "${newTenant.name}" provisionada com absoluto sucesso em isolação multi-tenant!`);
      setNewTenantName('');
      setNewTenantId('');
      setNewTenantDomain('');
      setNewTenantPlan('Growth');
      setNewTenantLogo('');
    }
  };

  const getCurrentList = (): string[] => {
    switch (activeCategory) {
      case 'porte': return configPorte;
      case 'portfolios': return configPortfolios;
      case 'clientes': return configClientes;
      case 'segmentos': return configSegmentos;
      case 'areas': return configAreasAtendidas;
      case 'temas': return configTemas;
      case 'fases': return configFases;
      case 'pilares': return configPilares;
      default: return [];
    }
  };

  const activeCategoryInfo = categories.find(cat => cat.id === activeCategory)!;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6" id="configurations-card-pane">
      
      {/* 1. Header with metadata */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-105 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            Parâmetros Globais do VMO
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure áreas, critérios de peso, portfólios, fases e estratégico da governança corporativa.
          </p>
        </div>
        {!canEdit && (
          <span className="text-[11px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 rounded font-medium flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Leitura Bloqueada
          </span>
        )}
      </div>

      {/* 2. Tenant Select Control for SUPER_ADMIN */}
      {isSuperAdmin && (
        <div className="bg-amber-955/20 border border-amber-500/15 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-[9px] font-mono text-amber-500 font-extrabold uppercase tracking-widest block leading-none">Super-Administrador</span>
            <strong className="text-slate-200 text-xs block font-bold">Chave de Governança Multitenant</strong>
            <p className="text-[10.5px] text-slate-400 max-w-xl">
              Para parametrizar os dados (portfólios, fases, critérios, etc), selecione primeiro a Empresa correspondente abaixo.
            </p>
          </div>
          <div>
            <select
              value={activeTenantId}
              onChange={(e) => setActiveTenantId(e.target.value)}
              className="bg-slate-950 border border-slate-800 p-2 px-3 rounded-lg text-xs font-bold text-amber-400 cursor-pointer outline-none focus:border-amber-505"
            >
              <option value="">-- Escolha um Tenant para Configurar --</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.plan})</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 3. Blocking view for SUPER_ADMIN when no tenant selected and not on 'tenants' category */}
      {isSuperAdmin && !activeTenantId && !isBypassedCategory ? (
        <div className="p-12 text-center bg-slate-950/40 border border-dashed border-slate-800 rounded-xl space-y-3">
          <ShieldAlert className="w-8 h-8 text-amber-500/70 mx-auto block" />
          <h3 className="text-sm font-bold text-slate-300">Nenhum Tenant Selecionado</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Por favor, selecione qual Tenant deseja parametrizar no menu dourado acima ou mude de categoria para <span className="font-bold text-slate-400">"Cadastrar Nova Tenant"</span>.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setActiveCategory('tenants')}
              className="p-1.5 px-3.5 bg-indigo-650 hover:bg-indigo-600 rounded text-white text-xs font-bold cursor-pointer"
            >
              Criar Nova Empresa (Tenant)
            </button>
          </div>
        </div>
      ) : (
        /* Actual Configurations Workspace */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Left Side Sidebar Pills */}
          <div className="md:col-span-4 space-y-1 bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold px-2 tracking-wider">Tabelas Disponíveis</span>
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setEditingIndex(null);
                    setEditingCriterionId(null);
                  }}
                  className={`w-full text-left p-2.5 rounded text-xs transition-all flex justify-between items-center ${
                    isActive 
                      ? 'bg-indigo-600/10 border-l-2 border-indigo-500 text-indigo-300 font-bold shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                  }`}
                >
                  <span>{cat.label}</span>
                  {cat.id === 'pesos' && (
                    <SlidersHorizontal className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-650'}`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Side Category Form workspace */}
          <div className="md:col-span-8 space-y-4">
            
            <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-850 space-y-1">
              <span className="text-[10px] font-mono tracking-widest text-indigo-400 font-bold uppercase">{activeCategoryInfo.label}</span>
              <p className="text-[11px] text-slate-450 leading-relaxed">{activeCategoryInfo.desc}</p>
            </div>

            {activeCategory === 'tenants' ? (
              // REGISTER NEW TENANT
              <div className="space-y-6">
                <form onSubmit={handleRegisterTenant} className="space-y-4 bg-slate-950/60 p-5 rounded-xl border border-slate-850">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Nome Fantasia / Empresa</label>
                      <input
                        type="text"
                        required
                        value={newTenantName}
                        onChange={(e) => setNewTenantName(e.target.value)}
                        placeholder="Ex: TechStart Capital"
                        className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-slate-205 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Chave de ID (Literal, sem espaços)</label>
                      <input
                        type="text"
                        required
                        value={newTenantId}
                        onChange={(e) => setNewTenantId(e.target.value)}
                        placeholder="Ex: techstart"
                        className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-slate-205 focus:outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Domínio da Empresa</label>
                      <input
                        type="text"
                        required
                        value={newTenantDomain}
                        onChange={(e) => setNewTenantDomain(e.target.value)}
                        placeholder="Ex: techstart.com"
                        className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-slate-205 focus:outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Plano de Subscrição</label>
                      <select
                        value={newTenantPlan}
                        onChange={(e) => setNewTenantPlan(e.target.value as 'Growth' | 'Enterprise')}
                        className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-slate-300 focus:outline-none cursor-pointer"
                      >
                        <option value="Growth">Growth</option>
                        <option value="Enterprise">Enterprise</option>
                      </select>
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase block">Logotipo Corporativo (PNG/JPG)</label>
                      <div className="flex items-center gap-3 bg-slate-900 p-2 rounded border border-slate-800">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="text-xs text-slate-450 cursor-pointer flex-1 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-indigo-600/20 file:text-indigo-400 hover:file:bg-indigo-600/30 file:cursor-pointer"
                        />
                        {newTenantLogo && (
                          <div className="w-8 h-8 rounded border border-slate-700 bg-slate-950 p-1 flex items-center justify-center">
                            <img src={newTenantLogo} alt="Preview" className="max-h-full max-w-full object-contain" />
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  <div className="pt-2 border-t border-slate-900 flex justify-end">
                    <button
                      type="submit"
                      className="p-2 px-5 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg transition shadow flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-emerald-400" />
                      Provisionar Tenant Isolada
                    </button>
                  </div>
                </form>

                {/* List of active tenants */}
                <div className="space-y-3 bg-slate-950/25 p-5 rounded-xl border border-slate-850">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-sans">
                    <Building2 className="w-4 h-4 text-indigo-400" />
                    Empresas (Tenants) Cadastradas e Ativas
                  </h4>
                  <div className="overflow-x-auto rounded-lg border border-slate-850 bg-slate-950/40">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-850 bg-slate-950 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          <th className="p-2.5 px-3">Empresa</th>
                          <th className="p-2.5">ID Identificador</th>
                          <th className="p-1.5 font-mono">Domínio</th>
                          <th className="p-2.5">Plano</th>
                          <th className="p-2.5 text-right px-3">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/50">
                        {tenants.map(t => (
                          <tr key={t.id} className="hover:bg-slate-900/10 text-slate-300">
                            <td className="p-2.5 px-3 font-semibold flex items-center gap-2">
                              {t.logoUrl ? (
                                <img src={t.logoUrl} alt="Logo" className="w-5 h-5 object-contain rounded bg-slate-950 p-0.5 border border-slate-800" />
                              ) : (
                                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                              )}
                              {t.name}
                            </td>
                            <td className="p-2.5 font-mono text-indigo-400 text-[11px]">{t.id}</td>
                            <td className="p-2.5 font-mono text-slate-400 text-[11px]">{t.domain}</td>
                            <td className="p-2.5">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${t.plan === 'Enterprise' ? 'bg-amber-950/30 text-amber-400 border border-amber-500/20' : 'bg-slate-950 border border-slate-800 text-slate-350'}`}>
                                {t.plan}
                              </span>
                            </td>
                            <td className="p-2.5 text-right px-3">
                              {t.id !== 'tenant_techstart' && t.id !== 'tenant_growthcorp' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if(confirm(`Deseja realmente remover a tenant "${t.name}"? Todos os usuários e dados associados a esse ID perderão acesso.`)) {
                                      if (setTenants) {
                                        setTenants(prev => prev.filter(x => x.id !== t.id));
                                      }
                                    }
                                  }}
                                  className="p-1 hover:bg-slate-800 rounded text-rose-500 hover:text-rose-400 transition cursor-pointer"
                                  title="Remover Tenant"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-600 font-mono italic">Protegido</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : activeCategory === 'modulos' ? (
              // SYSTEM MODULES & FEATURE TOGGLES MANAGEMENT
              <div className="space-y-6 animate-fade-in">
                
                {/* Header Information Banner */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 flex items-start gap-3">
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400 shrink-0 mt-0.5">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-200">Arquitetura Modular da Plataforma</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Ative ou desative módulos de acordo com a maturidade e o fluxo de trabalho da sua organização. 
                      Módulos desativados são ocultados do menu de navegação e bloqueados para todos os perfis de usuários.
                    </p>
                  </div>
                </div>

                {/* Primary Feature Card: IT Demands Module */}
                <div className={`p-5 rounded-2xl border transition-all duration-300 ${
                  isITDemandsModuleEnabled 
                    ? 'bg-gradient-to-b from-indigo-950/20 via-slate-900 to-slate-950 border-indigo-500/30 shadow-lg shadow-indigo-950/20' 
                    : 'bg-slate-950/40 border-slate-850'
                }`}>
                  
                  {/* Top Row: Icon + Title + Status + Toggle */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-850/80">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className={`p-3 rounded-xl border transition-colors shrink-0 ${
                        isITDemandsModuleEnabled 
                          ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300' 
                          : 'bg-slate-800 border-slate-700 text-slate-500'
                      }`}>
                        <Inbox className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-100 font-display">Módulo: Abertura e Esteiras de Demandas de TI</h3>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold uppercase">
                            Feature Modular
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-450 mt-0.5">
                          Intake de chamados técnicos, triagem operacional, esteiras ágeis e encaminhamento ao VMO
                        </p>
                      </div>
                    </div>

                    {/* Interactive Switch Toggle */}
                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                      <div className="text-right hidden sm:block">
                        <span className={`text-[10px] font-mono font-bold block uppercase tracking-wider ${
                          isITDemandsModuleEnabled ? 'text-emerald-400' : 'text-slate-500'
                        }`}>
                          {isITDemandsModuleEnabled ? 'Módulo Ativo' : 'Módulo Inativo'}
                        </span>
                        <span className="text-[9px] text-slate-500">
                          {isITDemandsModuleEnabled ? 'Visível na barra lateral' : 'Ocultado do sistema'}
                        </span>
                      </div>

                      {canEdit ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (setIsITDemandsModuleEnabled) {
                              const nextState = !isITDemandsModuleEnabled;
                              setIsITDemandsModuleEnabled(nextState);
                            }
                          }}
                          className={`p-1.5 px-3 rounded-xl border font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm select-none ${
                            isITDemandsModuleEnabled
                              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40 hover:border-emerald-500/60'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750 hover:text-slate-200'
                          }`}
                          title={isITDemandsModuleEnabled ? 'Clique para desabilitar o módulo' : 'Clique para habilitar o módulo'}
                        >
                          {isITDemandsModuleEnabled ? (
                            <>
                              <ToggleRight className="w-5 h-5 text-emerald-400" />
                              <span>Habilitado</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-5 h-5 text-slate-500" />
                              <span>Desabilitado</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">Apenas Admin</span>
                      )}
                    </div>
                  </div>

                  {/* Body Feature Breakdown */}
                  <div className="pt-4 space-y-4 text-xs">
                    <p className="text-slate-350 leading-relaxed text-[11.5px]">
                      Quando este módulo está <strong className={isITDemandsModuleEnabled ? 'text-emerald-400' : 'text-slate-400'}>{isITDemandsModuleEnabled ? 'HABILITADO' : 'DESABILITADO'}</strong>, 
                      a ferramenta {isITDemandsModuleEnabled ? 'disponibiliza' : 'oculta'} todo o fluxo de abertura descentralizada de solicitações de TI pelos colaboradores, a aba de navegação lateral "Esteiras de Demanda TI", o painel de triagem técnica e os atalhos de integração com o portfólio downstream do VMO.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      
                      <div className={`p-3 rounded-xl border flex gap-2.5 items-start ${
                        isITDemandsModuleEnabled ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-950/30 border-slate-900 opacity-60'
                      }`}>
                        <div className="p-1.5 rounded bg-indigo-500/10 text-indigo-400 shrink-0 mt-0.5">
                          <Inbox className="w-4 h-4" />
                        </div>
                        <div>
                          <strong className="text-slate-200 block text-[11px]">Aba "Esteiras de Demanda TI"</strong>
                          <p className="text-[10.5px] text-slate-450 mt-0.5 leading-normal">
                            Menu dedicado na barra lateral esquerda para gerenciamento e acompanhamento de chamados técnicos.
                          </p>
                        </div>
                      </div>

                      <div className={`p-3 rounded-xl border flex gap-2.5 items-start ${
                        isITDemandsModuleEnabled ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-950/30 border-slate-900 opacity-60'
                      }`}>
                        <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <strong className="text-slate-200 block text-[11px]">Portal de Intake de TI</strong>
                          <p className="text-[10.5px] text-slate-450 mt-0.5 leading-normal">
                            Formulário simplificado para qualquer colaborador cadastrar problemas, benefícios e urgência.
                          </p>
                        </div>
                      </div>

                      <div className={`p-3 rounded-xl border flex gap-2.5 items-start ${
                        isITDemandsModuleEnabled ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-950/30 border-slate-900 opacity-60'
                      }`}>
                        <div className="p-1.5 rounded bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
                          <SlidersHorizontal className="w-4 h-4" />
                        </div>
                        <div>
                          <strong className="text-slate-200 block text-[11px]">Triagem & Esteiras Especializadas</strong>
                          <p className="text-[10.5px] text-slate-450 mt-0.5 leading-normal">
                            Roteamento inteligente para esteira Workspace, Automação/RPA ou projetos estruturados.
                          </p>
                        </div>
                      </div>

                      <div className={`p-3 rounded-xl border flex gap-2.5 items-start ${
                        isITDemandsModuleEnabled ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-950/30 border-slate-900 opacity-60'
                      }`}>
                        <div className="p-1.5 rounded bg-purple-500/10 text-purple-400 shrink-0 mt-0.5">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <strong className="text-slate-200 block text-[11px]">Encaminhamento ao VMO</strong>
                          <p className="text-[10.5px] text-slate-450 mt-0.5 leading-normal">
                            Conversão em 1-clique de demandas prioritárias para o backlog upstream de projetos do Maestro.
                          </p>
                        </div>
                      </div>

                    </div>

                    {/* Status Notice */}
                    <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      isITDemandsModuleEnabled 
                        ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300' 
                        : 'bg-amber-950/20 border-amber-500/20 text-amber-300'
                    }`}>
                      <div className="flex items-center gap-2">
                        {isITDemandsModuleEnabled ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        <span>
                          {isITDemandsModuleEnabled 
                            ? 'O módulo de Demandas de TI está ativo e operacional para todos os usuários.' 
                            : 'O módulo está inativo. Os dados existentes ficam preservados com segurança no banco de dados.'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase opacity-80">
                        {isITDemandsModuleEnabled ? 'Status: Online' : 'Status: Offline'}
                      </span>
                    </div>

                  </div>
                </div>

                {/* Other Core Platform Modules Showcase */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-300 font-sans flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-400" />
                    Outros Módulos Integrados da Plataforma
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FolderKanban className="w-4 h-4 text-indigo-400" />
                          <strong className="text-slate-200 font-semibold">Gestão de Portfólios</strong>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 font-mono">
                          MÓDULO CORE
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-450 leading-relaxed">
                        Teses de investimento corporativo, horizontes temporais, metas de OKR e distribuição de CapEx/OpEx.
                      </p>
                    </div>

                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-400" />
                          <strong className="text-slate-200 font-semibold">Motor de Score VMO</strong>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 font-mono">
                          MÓDULO CORE
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-450 leading-relaxed">
                        Cálculo ponderado matemático e paramétrico de Alinhamento, Valor de Negócio, Urgência e Complexidade.
                      </p>
                    </div>

                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ClipboardList className="w-4 h-4 text-indigo-400" />
                          <strong className="text-slate-200 font-semibold">Backlog do Upstream (Intake)</strong>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 font-mono">
                          MÓDULO CORE
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-450 leading-relaxed">
                        Funil de entrada de projetos, assessment de riscos e aprovação formal para início de execução downstream.
                      </p>
                    </div>

                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-indigo-400" />
                          <strong className="text-slate-200 font-semibold">Governança Multitenant (RLS)</strong>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 font-mono">
                          MÓDULO CORE
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-450 leading-relaxed">
                        Isolamento rigoroso de dados por organização e controle de acesso baseado em papéis (RBAC).
                      </p>
                    </div>

                  </div>
                </div>

              </div>
            ) : activeCategory === 'pesos' ? (
              // CRITERIA AND WEIGHT PANEL
              <div className="space-y-4">
                
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-medium">Soma de Pesos Ativa:</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`p-1 px-2.5 rounded text-xs font-extrabold font-mono ${totalWeights === 100 ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-500/25' : 'bg-rose-950/30 text-rose-450 border border-rose-500/25'}`}>
                      {totalWeights}%
                    </span>
                    {totalWeights !== 100 && (
                      <span className="text-[10px] text-rose-400 font-bold" title="Importante: A soma de todos os pesos do framework deve totalizar exatamente 100% para perfeito cálculo de notas de priorização.">
                        ⚠️ Ajuste para 100%
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3.5">
                  {configCriteriaWeights.map((criterion) => {
                    const isRowEditing = editingCriterionId === criterion.id;
                    return (
                      <div key={criterion.id} className="bg-slate-950/50 p-4 rounded-xl border border-slate-855 space-y-3 text-xs">
                        
                        {isRowEditing ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                              <div className="col-span-2 space-y-1">
                                <label className="text-[9px] uppercase font-bold text-slate-500 block">Nome do Critério</label>
                                <input
                                  type="text"
                                  value={editingCriterionName}
                                  onChange={(e) => setEditingCriterionName(e.target.value)}
                                  className="w-full bg-slate-900 p-1.5 px-2.5 rounded border border-slate-700 text-slate-200 text-xs focus:outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold text-slate-500 block">Peso (%)</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={editingCriterionWeight}
                                  onChange={(e) => setEditingCriterionWeight(parseInt(e.target.value) || 0)}
                                  className="w-full bg-slate-900 p-1.5 px-2.5 rounded border border-slate-700 text-slate-200 text-xs text-center font-mono focus:outline-none"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-bold text-slate-500 block">Descrição Auxiliar</label>
                              <textarea
                                value={editingCriterionDesc}
                                onChange={(e) => setEditingCriterionDesc(e.target.value)}
                                rows={2}
                                className="w-full bg-slate-900 p-1.5 px-2.5 rounded border border-slate-700 text-slate-200 text-xs focus:outline-none placeholder:text-slate-650"
                              />
                            </div>
                            <div className="flex justify-end gap-1.5 pt-1">
                              <button
                                onClick={handleSaveCriterion}
                                className="p-1 px-3 bg-indigo-650 hover:bg-indigo-600 rounded text-xs font-bold text-white flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-300" />
                                Salvar Parâmetro
                              </button>
                              <button
                                onClick={() => setEditingCriterionId(null)}
                                className="p-1 px-2.5 bg-slate-805 hover:bg-slate-705 rounded text-xs font-bold text-slate-400 cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-200">{criterion.name}</span>
                                <span className="px-1.5 text-[10px] font-mono font-bold bg-indigo-600/10 text-indigo-400 border border-indigo-500/10 rounded">
                                  Peso: {criterion.weight}%
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-450 leading-relaxed font-sans">{criterion.desc}</p>
                            </div>
                            {canEdit && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => handleStartEditCriterion(criterion)}
                                  className="p-1.5 hover:bg-slate-900 text-slate-400 hover:text-indigo-400 rounded transition cursor-pointer"
                                  title="Editar Critério"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCriterionTrigger(criterion.id, criterion.name)}
                                  className="p-1.5 hover:bg-slate-900 text-rose-500 hover:text-rose-400 rounded transition cursor-pointer"
                                  title="Excluir Critério"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>

              </div>
            ) : activeCategory === 'categoriasFinanceiras' ? (
              // CATEGORIAS FINANCEIRAS (CAPEX / OPEX) GESTÃO COMPLETA
              <div className="space-y-5 animate-fade-in">
                
                {/* Top Metrics & Actions Toolbar */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => setFinFilterType('ALL')}
                        className={`px-3 py-1 rounded-md font-bold transition cursor-pointer ${
                          finFilterType === 'ALL'
                            ? 'bg-slate-700 text-white shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Todas ({finCategories.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFinFilterType('CAPEX')}
                        className={`px-3 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          finFilterType === 'CAPEX'
                            ? 'bg-indigo-600 text-white shadow'
                            : 'text-indigo-400 hover:bg-indigo-950/30'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                        CAPEX ({finCategories.filter(c => c.type === 'CAPEX').length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFinFilterType('OPEX')}
                        className={`px-3 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          finFilterType === 'OPEX'
                            ? 'bg-emerald-600 text-white shadow'
                            : 'text-emerald-400 hover:bg-emerald-950/30'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        OPEX ({finCategories.filter(c => c.type === 'OPEX').length})
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {canEdit && (
                        <>
                          <button
                            type="button"
                            onClick={handleResetFinancialCategoriesToDefault}
                            className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700/60 transition flex items-center gap-1.5 cursor-pointer"
                            title="Restaurar as 20 iniciativas padrão da metodologia VMO"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                            <span className="hidden md:inline">Restaurar</span> Padrões
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowAddFinModal(!showAddFinModal)}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            Nova Categoria
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Pesquisar por categoria, descrição ou exemplos de iniciativas..."
                      value={finSearchQuery}
                      onChange={(e) => setFinSearchQuery(e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-800 text-slate-200 pl-9 pr-3 py-2 rounded-lg text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
                    />
                    {finSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setFinSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Form to add new financial category */}
                {showAddFinModal && canEdit && (
                  <form onSubmit={handleAddFinancialCategory} className="bg-slate-950 p-4 rounded-xl border border-indigo-500/30 space-y-4 animate-fade-in shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-indigo-400" />
                        Cadastrar Nova Classificação de Lançamento
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowAddFinModal(false)}
                        className="text-slate-400 hover:text-slate-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      {/* Tipo */}
                      <div>
                        <label className="text-slate-400 font-semibold block mb-1">Tipo Orçamentário</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setNewFinType('CAPEX')}
                            className={`py-2 px-3 rounded-lg font-bold border transition text-center cursor-pointer ${
                              newFinType === 'CAPEX'
                                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            CAPEX (Ativo)
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewFinType('OPEX')}
                            className={`py-2 px-3 rounded-lg font-bold border transition text-center cursor-pointer ${
                              newFinType === 'OPEX'
                                ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-sm'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            OPEX (Operação)
                          </button>
                        </div>
                      </div>

                      {/* Nome da Categoria */}
                      <div className="md:col-span-2">
                        <label className="text-slate-400 font-semibold block mb-1">Nome da Categoria / Iniciativa *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Dev. de Software, Licenças de Software, Treinamento..."
                          value={newFinCategory}
                          onChange={(e) => setNewFinCategory(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                        />
                      </div>

                      {/* Descrição do Item */}
                      <div className="md:col-span-3">
                        <label className="text-slate-400 font-semibold block mb-1">Descrição do Item *</label>
                        <input
                          type="text"
                          required
                          placeholder="Descreva a finalidade e escopo contábil desta categoria orçamentária..."
                          value={newFinDescription}
                          onChange={(e) => setNewFinDescription(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                        />
                      </div>

                      {/* Exemplo Prático */}
                      <div className="md:col-span-3">
                        <label className="text-slate-400 font-semibold block mb-1">Exemplo Prático no Projeto</label>
                        <input
                          type="text"
                          placeholder="Ex: Salários e bônus do time de tecnologia focados em criar novas funcionalidades do sistema..."
                          value={newFinPracticalExample}
                          onChange={(e) => setNewFinPracticalExample(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 text-slate-200 p-2 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
                      <button
                        type="button"
                        onClick={() => setShowAddFinModal(false)}
                        className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 text-xs font-semibold cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
                      >
                        <Check className="w-4 h-4" />
                        Salvar Categoria
                      </button>
                    </div>
                  </form>
                )}

                {/* Categories Table / List */}
                <div className="bg-slate-950/60 rounded-xl border border-slate-800/80 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-950 font-mono text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                          <th className="p-3 w-16 text-center">Cód</th>
                          <th className="p-3 w-28">Tipo</th>
                          <th className="p-3 min-w-[160px]">Categoria</th>
                          <th className="p-3 min-w-[220px]">Descrição do Item</th>
                          <th className="p-3 min-w-[260px]">Exemplo Prático no Projeto</th>
                          {canEdit && <th className="p-3 w-24 text-center">Ações</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-sans">
                        {finCategories
                          .filter(c => {
                            if (finFilterType !== 'ALL' && c.type !== finFilterType) return false;
                            if (finSearchQuery.trim()) {
                              const q = finSearchQuery.toLowerCase();
                              return (
                                c.category.toLowerCase().includes(q) ||
                                c.description.toLowerCase().includes(q) ||
                                c.practicalExample.toLowerCase().includes(q)
                              );
                            }
                            return true;
                          })
                          .map((c) => {
                            const isCapex = c.type === 'CAPEX';
                            return (
                              <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                                <td className="p-3 text-center font-mono text-slate-400 font-semibold text-[11px]">
                                  #{String(c.code).padStart(2, '0')}
                                </td>
                                <td className="p-3">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-extrabold ${
                                    isCapex
                                      ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                                      : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isCapex ? 'bg-indigo-400' : 'bg-emerald-400'}`}></span>
                                    {c.type}
                                  </span>
                                </td>
                                <td className="p-3 font-bold text-slate-100">
                                  {c.category}
                                </td>
                                <td className="p-3 text-slate-300 leading-relaxed">
                                  {c.description}
                                </td>
                                <td className="p-3 text-slate-400">
                                  <div className="flex items-start gap-1.5 bg-slate-900/60 p-2 rounded-lg border border-slate-800/50">
                                    <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                    <span className="text-[11px] leading-relaxed italic text-slate-350">
                                      {c.practicalExample}
                                    </span>
                                  </div>
                                </td>
                                {canEdit && (
                                  <td className="p-3 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => setEditingFinCategory({ ...c })}
                                        title="Editar Categoria"
                                        className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded transition cursor-pointer"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteFinCategoryTrigger(c.id, c.category)}
                                        title="Excluir Categoria"
                                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })}

                        {finCategories.filter(c => {
                          if (finFilterType !== 'ALL' && c.type !== finFilterType) return false;
                          if (finSearchQuery.trim()) {
                            const q = finSearchQuery.toLowerCase();
                            return (
                              c.category.toLowerCase().includes(q) ||
                              c.description.toLowerCase().includes(q) ||
                              c.practicalExample.toLowerCase().includes(q)
                            );
                          }
                          return true;
                        }).length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-500 font-mono">
                              Nenhuma categoria financeira encontrada para os critérios selecionados.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* MODAL: EDIT FINANCIAL CATEGORY */}
                {editingFinCategory && (
                  <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                          <Edit2 className="w-4 h-4 text-indigo-400" />
                          Editar Categoria de Lançamento ({editingFinCategory.category})
                        </h3>
                        <button
                          type="button"
                          onClick={() => setEditingFinCategory(null)}
                          className="text-slate-400 hover:text-slate-200"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <form onSubmit={handleSaveEditFinancialCategory} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-slate-400 font-semibold block mb-1">Tipo de Lançamento</label>
                            <select
                              value={editingFinCategory.type}
                              onChange={(e) => setEditingFinCategory({ ...editingFinCategory, type: e.target.value as 'CAPEX' | 'OPEX' })}
                              className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2 rounded-lg font-bold"
                            >
                              <option value="CAPEX">CAPEX (Investimento / Ativo)</option>
                              <option value="OPEX">OPEX (Despesa Operacional)</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-slate-400 font-semibold block mb-1">Nome da Categoria</label>
                            <input
                              type="text"
                              required
                              value={editingFinCategory.category}
                              onChange={(e) => setEditingFinCategory({ ...editingFinCategory, category: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2 rounded-lg font-medium"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="text-slate-400 font-semibold block mb-1">Descrição do Item</label>
                            <textarea
                              rows={2}
                              required
                              value={editingFinCategory.description}
                              onChange={(e) => setEditingFinCategory({ ...editingFinCategory, description: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2 rounded-lg font-medium"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="text-slate-400 font-semibold block mb-1">Exemplo Prático no Projeto</label>
                            <textarea
                              rows={2}
                              value={editingFinCategory.practicalExample}
                              onChange={(e) => setEditingFinCategory({ ...editingFinCategory, practicalExample: e.target.value })}
                              className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2 rounded-lg font-medium"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => setEditingFinCategory(null)}
                            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-semibold hover:bg-slate-700 cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 flex items-center gap-1 cursor-pointer shadow"
                          >
                            <Check className="w-4 h-4" /> Salvar Alterações
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              // GENERAL PARAMETERS GRID EDITING
              <div className="space-y-4">
                
                {/* Form Input to insert new Parameter element */}
                {canEdit && (
                  <form onSubmit={handleAddValue} className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder={`Adicionar novo em ${activeCategoryInfo.label}...`}
                      value={newItemValue}
                      onChange={(e) => setNewItemValue(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-505 p-2 rounded text-xs text-slate-250 focus:outline-none placeholder:text-slate-605"
                    />
                    <button
                      type="submit"
                      className="p-2 px-3.5 bg-indigo-600 hover:bg-indigo-505 text-white font-bold text-xs rounded transition flex items-center gap-1 shrink-0 shadow cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar
                    </button>
                  </form>
                )}

                {/* Items Table / Cards list */}
                <div className="bg-slate-950/60 rounded-xl border border-slate-850 divide-y divide-slate-850 max-h-[320px] overflow-y-auto">
                  {getCurrentList().length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500 italic">
                      Sem registros cadastrados para esta tabela corporativa.
                    </div>
                  ) : (
                    getCurrentList().map((item, index) => {
                      const isRowEditing = editingIndex === index;
                      return (
                        <div key={index} className="p-3 flex justify-between items-center text-xs gap-3 font-medium">
                          {isRowEditing ? (
                            <div className="flex-1 flex gap-2">
                              <input
                                type="text"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                className="flex-1 bg-slate-900 border border-slate-700 p-1.5 px-2 rounded font-sans text-xs text-slate-200 focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveEdit(index)}
                                className="p-1 px-2.5 bg-indigo-650 hover:bg-indigo-600 rounded text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3 h-3 text-emerald-300" />
                                Salvar
                              </button>
                              <button
                                onClick={() => setEditingIndex(null)}
                                className="p-1 px-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 text-[11px] flex items-center gap-0.5 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="text-slate-300 font-sans">{item}</span>
                              
                              {canEdit && (
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => handleStartEdit(index, item)}
                                    className="p-1 text-slate-450 hover:text-slate-200 hover:bg-slate-900 rounded transition cursor-pointer"
                                    title="Editar"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteValueTrigger(index, item)}
                                    className="p-1 text-rose-500 hover:text-rose-400 hover:bg-slate-900 rounded transition cursor-pointer"
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Sleek multi-tenant state-based Confirmation Modal */}
      {deleteDialog.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in text-slate-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/15">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-100 font-display">Confirmar Exclusão</h3>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Ação Irreversível</p>
              </div>
            </div>
            
            <div className="space-y-2 py-1">
              <p className="text-xs text-slate-300 leading-relaxed">
                Deseja realmente obter a exclusão permanente de <strong className="text-indigo-400 font-semibold font-sans">"{deleteDialog.label}"</strong> das configurações corporativas do VMO?
              </p>
              <p className="text-[10.5px] text-slate-400 leading-normal italic">
                Os projetos que já estiverem associados com esta opção manterão seus dados intactos, mas a opção não estará mais disponível para novas seleções.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={executeDelete}
                className="flex-1 py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition cursor-pointer"
              >
                Sim, Excluir
              </button>
              <button
                onClick={() => setDeleteDialog({ show: false, type: 'list', indexOrId: -1, label: '' })}
                className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-lg transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
