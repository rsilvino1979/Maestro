/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Project, 
  Tenant, 
  User, 
  Persona, 
  FeatureKey, 
  CanvasData, 
  BusinessCaseData, 
  BudgetLine, 
  Milestone, 
  Risk, 
  PrioritizationWeights,
  Consultant,
  Portfolio,
  FinancialCategoryConfig
} from './types';
import { 
  INITIAL_TENANTS, 
  INITIAL_USERS, 
  INITIAL_PROJECTS, 
  DEFAULT_WEIGHTS 
} from './data/initialState';
import { DEFAULT_FINANCIAL_CATEGORIES } from './data/defaultFinancialCategories';

// Importing Custom Sub-Components
import DbSchemaView from './components/DbSchemaView';
import ApiSpecView from './components/ApiSpecView';
import PrioritizationEngine from './components/PrioritizationEngine';
import ProductTreeExplain from './components/ProductTreeExplain';

// Importing our newly created high-fidelity modular tab components!
import ConfigurationTab from './components/ConfigurationTab';
import BacklogTab from './components/BacklogTab';
import ProjectsGridTab from './components/ProjectsGridTab';
import UsersManagementTab from './components/UsersManagementTab';
import ITDemandsTab from './components/ITDemandsTab';
import PortfolioManagementTab from './components/PortfolioManagementTab';
import MaestroLogo from './components/MaestroLogo';

// Importing Visual Icons
import {
  Building2,
  Users,
  Shield,
  Plus,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Inbox,
  ClipboardList,
  Compass,
  Zap,
  Briefcase,
  AlertCircle,
  HelpCircle,
  FileCheck,
  Settings,
  Sun,
  Moon,
  Info,
  Calendar,
  Layers,
  HeartCrack,
  FolderLock,
  FolderKanban,
  LogOut,
  Lock,
  Eye,
  EyeOff,
  Key,
  Menu
} from 'lucide-react';

interface CriteriaWeight {
  id: string;
  name: string;
  key: string;
  weight: number;
  desc: string;
}

interface LoginFormProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  onLoginSuccess: (user: User) => void;
  theme: string;
  designTheme: string;
}

function LoginForm({ users, setUsers, onLoginSuccess, theme, designTheme }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const found = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!found) {
      setError('Aviso: E-mail não localizado nas bases da plataforma.');
      return;
    }

    if (found.password !== password) {
      setError('Credenciais inválidas: Senha incorreta.');
      return;
    }

    onLoginSuccess(found);
  };

  const prefillAndLogin = (sampleUser: User) => {
    setEmail(sampleUser.email);
    setPassword(sampleUser.password || 'Teste1234@');
    onLoginSuccess(sampleUser);
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-indigo-505 selection:text-white theme-${designTheme}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.08),transparent_50%)] pointer-events-none"></div>
      
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 sm:p-8 relative space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-indigo-600/15 border border-indigo-500/25 rounded-2xl flex items-center justify-center mx-auto text-indigo-400">
            <Building2 className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold font-display text-slate-100">Maestro - Governança</h2>
          <p className="text-xs text-slate-450">Efetue o login para acessar a área segura multitenant</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-505/20 text-rose-400 rounded-lg text-xs font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0"></span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 block">E-mail Corporativo</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="renato.silvino10@outlook.com"
                className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-505 p-2.5 rounded-lg text-xs text-slate-200 outline-none placeholder:text-slate-700"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 block">Senha de Acesso</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha corporativa Iniciar"
                className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-505 p-2.5 rounded-lg text-xs text-slate-200 outline-none placeholder:text-slate-700 font-mono pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-505 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow mt-2"
          >
            <Lock className="w-3.5 h-3.5" />
            Entrar no Hub
          </button>
        </form>

        {/* Rapid login helper block for developers testing the product */}
        <div className="border-t border-slate-850 pt-4 space-y-3">
          <div className="flex items-center gap-1.5 justify-center">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full shrink-0"></span>
            <span className="text-[9.5px] font-mono uppercase font-black text-indigo-450 tracking-wider">🧪 CONTAS DE TESTES RÁPIDOS</span>
          </div>
          <div className="grid grid-cols-1 gap-2 max-h-[190px] overflow-y-auto pr-1">
            {users.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => prefillAndLogin(u)}
                className="p-2 py-1.5 bg-slate-950/60 hover:bg-indigo-950/20 border border-slate-800 hover:border-indigo-505/20 text-left rounded-lg text-[10px] transition text-slate-350 hover:text-slate-100 flex items-center justify-between cursor-pointer"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="font-bold truncate">{u.name} <span className="text-[8.5px] font-mono text-indigo-400">({u.role})</span></div>
                  <div className="text-[8.5px] text-slate-500 font-mono truncate">{u.email}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[8px] bg-slate-90 px-1.5 py-0.2 rounded font-mono font-bold text-indigo-300 border border-indigo-500/10">Senha: {u.password || 'Teste1234@'}</div>
                  <span className="text-[8px] text-slate-500 hover:text-indigo-400 underline block mt-0.5 font-bold">Logar diretamente →</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface PasswordChangeProps {
  user: User;
  onPasswordChanged: (updatedUser: User) => void;
  theme: string;
  designTheme: string;
}

function PasswordChangeForm({ user, onPasswordChanged, theme, designTheme }: PasswordChangeProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('A nova senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword === 'Teste1234@' || newPassword === 'Rs739302@') {
      setError('A nova senha não pode ser idêntica à senha temporária padrão.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('O campo de confirmação não coincide com a nova senha digitada.');
      return;
    }

    const updated: User = {
      ...user,
      password: newPassword,
      mustChangePassword: false
    };

    onPasswordChanged(updated);
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-indigo-505 selection:text-white theme-${designTheme}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(99,102,241,0.06),transparent_50%)] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 sm:p-8 relative space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-indigo-600/15 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto text-indigo-400">
            <Key className="w-6 h-6 animate-bounce" />
          </div>
          <h2 className="text-xl font-bold font-display text-slate-100">Configuração de Nova Senha</h2>
          <p className="text-xs text-slate-450">Por segurança de conformidade, altere sua senha temporária para acessar permanentemente seu painel.</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-505/20 text-rose-400 rounded-lg text-xs font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0"></span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-lg text-[10px] text-slate-400 space-y-1">
            <div><span className="font-bold text-slate-500 uppercase font-mono">Usuário:</span> {user.name} ({user.email})</div>
            <div><span className="font-bold text-slate-500 uppercase font-mono">Governança:</span> {user.role} ({user.tenantId})</div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-bold text-slate-500 block">Nova Senha Corporativa</label>
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {showPass ? 'Ocultar' : 'Exibir'}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Exigido no mínimo 6 caracteres"
                className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-505 p-2.5 rounded-lg text-xs text-slate-200 outline-none font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 block">Confirme a Nova Senha</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Redigite exatamente a mesma senha"
                className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-505 p-2.5 rounded-lg text-xs text-slate-200 outline-none font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-650 hover:bg-indigo-600 text-white p-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow mt-2"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            Configurar e Acessar Plataforma
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  // Global Tenancy and Persona Context states
  const [activeTenantId, setActiveTenantId] = useState<string>(() => {
    const savedUser = localStorage.getItem('vmo_logged_in_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        return u.tenantId;
      } catch (e) {}
    }
    return 'tenant_techstart';
  });
  const [activePersona, setActivePersona] = useState<Persona>(() => {
    const savedUser = localStorage.getItem('vmo_logged_in_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        return u.role;
      } catch (e) {}
    }
    return 'PORTFOLIO_MANAGER';
  });

  // Authenticated User states
  const [loggedInUser, setLoggedInUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('vmo_logged_in_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {}
    }
    return null;
  });
  const [tenants, setTenants] = useState<Tenant[]>(() => {
    const saved = localStorage.getItem('vmo_tenants');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_TENANTS;
  });

  useEffect(() => {
    localStorage.setItem('vmo_tenants', JSON.stringify(tenants));
  }, [tenants]);

  // Theme state - Claro/Escuro e Paletas
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('vmo_theme');
    return (saved as 'dark' | 'light') || 'light';
  });
  const [designTheme, setDesignTheme] = useState<string>(() => {
    const saved = localStorage.getItem('vmo_design_theme');
    return saved || 'ocean_teal';
  });

  useEffect(() => {
    localStorage.setItem('vmo_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('vmo_design_theme', designTheme);
  }, [designTheme]);

  // Active navigational Tab state
  const [activeTab, setActiveTab] = useState<'backlog' | 'portfolio' | 'projects' | 'prioritizer' | 'users_admin' | 'config' | 'database' | 'rest_api' | 'components_tree' | 'it_demands'>('it_demands');

  // System feature module toggle for IT Demands (persisted)
  const [isITDemandsModuleEnabled, setIsITDemandsModuleEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('vmo_module_it_demands');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('vmo_module_it_demands', JSON.stringify(isITDemandsModuleEnabled));
  }, [isITDemandsModuleEnabled]);

  // If the IT Demands module is disabled and the user was on it_demands tab, redirect to backlog
  useEffect(() => {
    if (!isITDemandsModuleEnabled && activeTab === 'it_demands') {
      setActiveTab('backlog');
    }
  }, [isITDemandsModuleEnabled, activeTab]);

  // Portfolios state with baseline seed
  const [portfolios, setPortfolios] = useState<Portfolio[]>(() => {
    const saved = localStorage.getItem('vmo_portfolios');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'pf_1',
        tenantId: 'tenant_techstart',
        name: 'Inovação & TI',
        investmentThesis: 'Tese focada na modernização tecnológica, automação de infraestrutura cloud e inteligência preditiva.',
        category: 'Inovação',
        status: 'Ativo',
        sponsor: 'Camila Rocha',
        portfolioManager: 'Bernardo Lima',
        requestingArea: 'TI & Infraestrutura',
        strategicPillar: 'Eficiência Operacional',
        associatedOKR: 'Redução de 25% na latência e SLA 99.99%',
        timeHorizon: '2026 - Q1 a Q4'
      },
      {
        id: 'pf_2',
        tenantId: 'tenant_techstart',
        name: 'Crescimento SaaS',
        investmentThesis: 'Expansão da base de assinantes e ampliação do LTV através de novos canais e retenção.',
        category: 'Crescimento',
        status: 'Ativo',
        sponsor: 'Helena Oliveira',
        portfolioManager: 'Diego Santos',
        requestingArea: 'Produto & Engenharia',
        strategicPillar: 'Crescimento de Receita (ARR)',
        associatedOKR: 'Atingir R$ 2M de ARR adicional até Q4',
        timeHorizon: '2026 - 2027'
      },
      {
        id: 'pf_3',
        tenantId: 'tenant_techstart',
        name: 'Infraestrutura Core',
        investmentThesis: 'Sustentação de servidores, redes corporativas e conformidade de segurança LGPD/ISO.',
        category: 'Sustentação',
        status: 'Ativo',
        sponsor: 'Renato Silvino',
        portfolioManager: 'Igor Fonseca',
        requestingArea: 'TI & Infraestrutura',
        strategicPillar: 'Compliance Legal ou Fiscal',
        associatedOKR: 'Zero incidentes graves de segurança em 2026',
        timeHorizon: '2026'
      },
      {
        id: 'pf_4',
        tenantId: 'tenant_techstart',
        name: 'Expansão de Mercado',
        investmentThesis: 'Abertura de canais de internacionalização e adequação regulatória fiscal.',
        category: 'Regulatório',
        status: 'Planejamento',
        sponsor: 'Bernardo Lima',
        portfolioManager: 'Camila Rocha',
        requestingArea: 'Comercial & Vendas',
        strategicPillar: 'Crescimento de Receita (ARR)',
        associatedOKR: 'Operação em 3 novos países latino-americanos',
        timeHorizon: '2026 - 2028'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('vmo_portfolios', JSON.stringify(portfolios));
  }, [portfolios]);

  // Last autonumeric Demand Id tracker
  const [lastDemandId, setLastDemandId] = useState<number>(1006);

  // 8 Dynamic configurations states initialized with descriptive baselines
  const [configConsultores, setConfigConsultores] = useState<Consultant[]>(() => {
    const saved = localStorage.getItem('vmo_config_consultores');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    // Baseline seed list linked with tenant_techstart
    return [
      { id: 'c1', name: 'Camila Rocha', email: 'camila.rocha@techstart.io', tenantId: 'tenant_techstart' },
      { id: 'c2', name: 'Bernardo Lima', email: 'bernardo.lima@techstart.io', tenantId: 'tenant_techstart' },
      { id: 'c3', name: 'Helena Oliveira', email: 'helena.oliveira@techstart.io', tenantId: 'tenant_techstart' },
      { id: 'c4', name: 'Diego Santos', email: 'diego.santos@techstart.io', tenantId: 'tenant_techstart' },
      { id: 'c5', name: 'Igor Fonseca', email: 'igor.fonseca@techstart.io', tenantId: 'tenant_techstart' },
      { id: 'c6', name: 'Renato Silvino', email: 'renato.silvino10@outlook.com', tenantId: 'tenant_techstart' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('vmo_config_consultores', JSON.stringify(configConsultores));
  }, [configConsultores]);

  const [configPorte, setConfigPorte] = useState<string[]>(() => {
    const saved = localStorage.getItem('vmo_config_porte');
    return saved ? JSON.parse(saved) : ['Pequeno', 'Médio', 'Grande', 'Complexo/Megaprojeto'];
  });
  useEffect(() => { localStorage.setItem('vmo_config_porte', JSON.stringify(configPorte)); }, [configPorte]);

  const [configPortfolios, setConfigPortfolios] = useState<string[]>(() => {
    const saved = localStorage.getItem('vmo_config_portfolios');
    return saved ? JSON.parse(saved) : ['Inovação & TI', 'Crescimento SaaS', 'Infraestrutura Core', 'Expansão de Mercado'];
  });
  useEffect(() => { localStorage.setItem('vmo_config_portfolios', JSON.stringify(configPortfolios)); }, [configPortfolios]);

  const [configAreasAtendidas, setConfigAreasAtendidas] = useState<string[]>(() => {
    const saved = localStorage.getItem('vmo_config_areas');
    return saved ? JSON.parse(saved) : ['TI & Infraestrutura', 'Produto & Engenharia', 'Comercial & Vendas', 'Marketing & Growth', 'Financeiro & Contábil', 'RH & Operações', 'Fiscal & Jurídico'];
  });
  useEffect(() => { localStorage.setItem('vmo_config_areas', JSON.stringify(configAreasAtendidas)); }, [configAreasAtendidas]);

  const [configClientes, setConfigClientes] = useState<string[]>(() => {
    const saved = localStorage.getItem('vmo_config_clientes');
    return saved ? JSON.parse(saved) : ['Cliente Interno', 'Alpha Corp', 'Beta Logistics', 'Retail Services', 'Global Banking'];
  });
  useEffect(() => { localStorage.setItem('vmo_config_clientes', JSON.stringify(configClientes)); }, [configClientes]);

  const [configSegmentos, setConfigSegmentos] = useState<string[]>(() => {
    const saved = localStorage.getItem('vmo_config_segmentos');
    return saved ? JSON.parse(saved) : ['Varejo', 'Financeiro & Bancário', 'Saúde & Biotecnologia', 'Logística & Cadeia de Suprimentos', 'Tecnologia & B2B SaaS', 'Educação'];
  });
  useEffect(() => { localStorage.setItem('vmo_config_segmentos', JSON.stringify(configSegmentos)); }, [configSegmentos]);

  const [configTemas, setConfigTemas] = useState<string[]>(() => {
    const saved = localStorage.getItem('vmo_config_temas');
    return saved ? JSON.parse(saved) : ['Segurança', 'Gargalo Operacional', 'Inovação de Core', 'Conformidade Fiscal', 'Redução de CapEx'];
  });
  useEffect(() => { localStorage.setItem('vmo_config_temas', JSON.stringify(configTemas)); }, [configTemas]);

  const [configFases, setConfigFases] = useState<string[]>(() => {
    const saved = localStorage.getItem('vmo_config_fases');
    return saved ? JSON.parse(saved) : ['Iniciação', 'Planejamento', 'Execução', 'Monitoramento e Controle', 'Encerramento'];
  });
  useEffect(() => { localStorage.setItem('vmo_config_fases', JSON.stringify(configFases)); }, [configFases]);

  const [configCriteriaWeights, setConfigCriteriaWeights] = useState<CriteriaWeight[]>(() => {
    const saved = localStorage.getItem('vmo_config_criteria');
    return saved ? JSON.parse(saved) : [
      { id: 'alignment', name: 'Alinhamento Estratégico', key: 'alignment', weight: 30, desc: 'Alinhamento geral com os OKRs anuais' },
      { id: 'value', name: 'Valor de Negócio / ROI', key: 'value', weight: 40, desc: 'Retorno financeiro, ARR ou redução de custo' },
      { id: 'urgency', name: 'Urgência de Mercado', key: 'urgency', weight: 15, desc: 'Necessidades regulatórias e janela competitiva' },
      { id: 'complexity', name: 'Simplicidade (Menor Esforço)', key: 'complexity', weight: 15, desc: 'Facilidade técnica e velocidade de entrega (Nota alta = simples)' },
    ];
  });
  useEffect(() => { localStorage.setItem('vmo_config_criteria', JSON.stringify(configCriteriaWeights)); }, [configCriteriaWeights]);

  const [configPilares, setConfigPilares] = useState<string[]>(() => {
    const saved = localStorage.getItem('vmo_config_pilares');
    return saved ? JSON.parse(saved) : ['Eficiência Operacional', 'Crescimento de Receita (ARR)', 'Retenção & NPS do Cliente', 'Redução de Despesa Legal (CapEx)', 'Compliance Legal ou Fiscal'];
  });
  useEffect(() => { localStorage.setItem('vmo_config_pilares', JSON.stringify(configPilares)); }, [configPilares]);

  const [configFinancialCategories, setConfigFinancialCategories] = useState<FinancialCategoryConfig[]>(() => {
    const saved = localStorage.getItem('vmo_config_financial_categories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_FINANCIAL_CATEGORIES;
  });
  useEffect(() => {
    localStorage.setItem('vmo_config_financial_categories', JSON.stringify(configFinancialCategories));
  }, [configFinancialCategories]);

  // Wrapper helper to persist config field safely into tenant keys without race conditions
  const saveTenantConfigField = (field: string, value: any) => {
    if (!activeTenantId) return;
    const tenantKey = `vmo_config_tenant_${activeTenantId}`;
    const saved = localStorage.getItem(tenantKey);
    const struct = saved ? JSON.parse(saved) : {};
    struct[field] = value;
    localStorage.setItem(tenantKey, JSON.stringify(struct));
  };

  const setConfigPorteWrapped = (action: React.SetStateAction<string[]>) => {
    setConfigPorte((prev) => {
      const next = typeof action === 'function' ? (action as any)(prev) : action;
      saveTenantConfigField('porte', next);
      return next;
    });
  };

  const setConfigPortfoliosWrapped = (action: React.SetStateAction<string[]>) => {
    setConfigPortfolios((prev) => {
      const next = typeof action === 'function' ? (action as any)(prev) : action;
      saveTenantConfigField('portfolios', next);
      return next;
    });
  };

  const setConfigClientesWrapped = (action: React.SetStateAction<string[]>) => {
    setConfigClientes((prev) => {
      const next = typeof action === 'function' ? (action as any)(prev) : action;
      saveTenantConfigField('clientes', next);
      return next;
    });
  };

  const setConfigSegmentosWrapped = (action: React.SetStateAction<string[]>) => {
    setConfigSegmentos((prev) => {
      const next = typeof action === 'function' ? (action as any)(prev) : action;
      saveTenantConfigField('segmentos', next);
      return next;
    });
  };

  const setConfigAreasAtendidasWrapped = (action: React.SetStateAction<string[]>) => {
    setConfigAreasAtendidas((prev) => {
      const next = typeof action === 'function' ? (action as any)(prev) : action;
      saveTenantConfigField('areas', next);
      return next;
    });
  };

  const setConfigTemasWrapped = (action: React.SetStateAction<string[]>) => {
    setConfigTemas((prev) => {
      const next = typeof action === 'function' ? (action as any)(prev) : action;
      saveTenantConfigField('temas', next);
      return next;
    });
  };

  const setConfigFasesWrapped = (action: React.SetStateAction<string[]>) => {
    setConfigFases((prev) => {
      const next = typeof action === 'function' ? (action as any)(prev) : action;
      saveTenantConfigField('fases', next);
      return next;
    });
  };

  const setConfigPilaresWrapped = (action: React.SetStateAction<string[]>) => {
    setConfigPilares((prev) => {
      const next = typeof action === 'function' ? (action as any)(prev) : action;
      saveTenantConfigField('pilares', next);
      return next;
    });
  };

  const setConfigFinancialCategoriesWrapped = (action: React.SetStateAction<FinancialCategoryConfig[]>) => {
    setConfigFinancialCategories((prev) => {
      const next = typeof action === 'function' ? (action as any)(prev) : action;
      saveTenantConfigField('financialCategories', next);
      return next;
    });
  };

  // Re-load configurations dynamically based on activeTenantId for true Multi-tenant Isolation
  useEffect(() => {
    if (!activeTenantId) return;

    const tenantKey = `vmo_config_tenant_${activeTenantId}`;
    const saved = localStorage.getItem(tenantKey);
    const isBuiltinTenant = activeTenantId === 'tenant_techstart' || activeTenantId === 'tenant_growthcorp';

    const defaultsPorte = ['Pequeno', 'Médio', 'Grande', 'Complexo/Megaprojeto'];
    const defaultsPortfolios = ['Inovação & TI', 'Crescimento SaaS', 'Infraestrutura Core', 'Expansão de Mercado'];
    const defaultsClientes = ['Cliente Interno', 'Alpha Corp', 'Beta Logistics', 'Retail Services', 'Global Banking'];
    const defaultsSegmentos = ['Varejo', 'Financeiro & Bancário', 'Saúde & Biotecnologia', 'Logística & Cadeia de Suprimentos', 'Tecnologia & B2B SaaS', 'Educação'];
    const defaultsAreas = ['TI & Infraestrutura', 'Produto & Engenharia', 'Comercial & Vendas', 'Marketing & Growth', 'Financeiro & Contábil', 'RH & Operações', 'Fiscal & Jurídico'];
    const defaultsTemas = ['Segurança', 'Gargalo Operacional', 'Inovação de Core', 'Conformidade Fiscal', 'Redução de CapEx'];
    const defaultsFases = ['Iniciação', 'Planejamento', 'Execução', 'Monitoramento e Controle', 'Encerramento'];
    const defaultsPilares = ['Eficiência Operacional', 'Crescimento de Receita (ARR)', 'Retenção & NPS do Cliente', 'Redução de Despesa Legal (CapEx)', 'Compliance Legal ou Fiscal'];

    const checkAndClean = (arr: string[], defaultArr: string[]) => {
      if (isBuiltinTenant) return arr;
      if (!arr || arr.length === 0) return [];
      if (arr.length === defaultArr.length && arr.every((v, i) => v === defaultArr[i])) {
        return [];
      }
      return arr;
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfigPorte(checkAndClean(parsed.porte || [], defaultsPorte));
        setConfigPortfolios(checkAndClean(parsed.portfolios || [], defaultsPortfolios));
        setConfigClientes(checkAndClean(parsed.clientes || [], defaultsClientes));
        setConfigSegmentos(checkAndClean(parsed.segmentos || [], defaultsSegmentos));
        setConfigAreasAtendidas(checkAndClean(parsed.areas || [], defaultsAreas));
        setConfigTemas(checkAndClean(parsed.temas || [], defaultsTemas));
        setConfigFases(checkAndClean(parsed.fases || [], defaultsFases));
        setConfigCriteriaWeights(parsed.criteria || [
          { id: 'alignment', name: 'Alinhamento Estratégico', key: 'alignment', weight: 30, desc: 'Alinhamento geral com os OKRs anuais' },
          { id: 'value', name: 'Valor de Negócio / ROI', key: 'value', weight: 40, desc: 'Retorno financeiro, ARR ou redução de custo' },
          { id: 'urgency', name: 'Urgência de Mercado', key: 'urgency', weight: 15, desc: 'Necessidades regulatórias e janela competitiva' },
          { id: 'complexity', name: 'Simplicidade (Menor Esforço)', key: 'complexity', weight: 15, desc: 'Facilidade técnica e velocidade de entrega (Nota alta = simples)' },
        ]);
        setConfigPilares(checkAndClean(parsed.pilares || [], defaultsPilares));
        if (parsed.financialCategories && Array.isArray(parsed.financialCategories) && parsed.financialCategories.length > 0) {
          setConfigFinancialCategories(parsed.financialCategories);
        } else {
          setConfigFinancialCategories(DEFAULT_FINANCIAL_CATEGORIES);
        }
        return;
      } catch (e) {
        console.error('Error parsing tenant config:', e);
      }
    }

    // Default configuration baselines for fallback or new Tenant initialization
    const defaults = {
      porte: isBuiltinTenant ? defaultsPorte : [],
      portfolios: isBuiltinTenant ? defaultsPortfolios : [],
      clientes: isBuiltinTenant ? defaultsClientes : [],
      segmentos: isBuiltinTenant ? defaultsSegmentos : [],
      areas: isBuiltinTenant ? defaultsAreas : [],
      temas: isBuiltinTenant ? defaultsTemas : [],
      fases: isBuiltinTenant ? defaultsFases : [],
      criteria: [
        { id: 'alignment', name: 'Alinhamento Estratégico', key: 'alignment', weight: 30, desc: 'Alinhamento geral com os OKRs anuais' },
        { id: 'value', name: 'Valor de Negócio / ROI', key: 'value', weight: 40, desc: 'Retorno financeiro, ARR ou redução de custo' },
        { id: 'urgency', name: 'Urgência de Mercado', key: 'urgency', weight: 15, desc: 'Necessidades regulatórias e janela competitiva' },
        { id: 'complexity', name: 'Simplicidade (Menor Esforço)', key: 'complexity', weight: 15, desc: 'Facilidade técnica e velocidade de entrega (Nota alta = simples)' },
      ],
      pilares: isBuiltinTenant ? defaultsPilares : []
    };

    setConfigPorte(defaults.porte);
    setConfigPortfolios(defaults.portfolios);
    setConfigClientes(defaults.clientes);
    setConfigSegmentos(defaults.segmentos);
    setConfigAreasAtendidas(defaults.areas);
    setConfigTemas(defaults.temas);
    setConfigFases(defaults.fases);
    setConfigCriteriaWeights(defaults.criteria);
    setConfigPilares(defaults.pilares);

    // Save defaults
    localStorage.setItem(tenantKey, JSON.stringify(defaults));
  }, [activeTenantId]);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>(() => {
    const gpTestUser: User = {
      id: 'gp_teste_corp',
      name: 'Paula Costa (GP Teste)',
      email: 'gp.teste@techstart.io',
      role: 'PROJECT_MANAGER',
      tenantId: 'tenant_techstart',
      password: 'Teste1234@',
      mustChangePassword: false,
    };

    const saved = localStorage.getItem('vmo_users');
    if (saved) {
      try {
        const parsed: User[] = JSON.parse(saved);
        if (!parsed.some(u => u.email.toLowerCase() === gpTestUser.email.toLowerCase())) {
          parsed.push(gpTestUser);
          localStorage.setItem('vmo_users', JSON.stringify(parsed));
        }
        return parsed;
      } catch (e) {}
    }
    const defaultSuperAdmin: User = {
      id: 'user_renato_silvino',
      name: 'Renato Silvino',
      email: 'renato.silvino10@outlook.com',
      role: 'SUPER_ADMIN',
      tenantId: 'tenant_techstart',
      password: 'Rs739302@',
      mustChangePassword: false, 
    };
    const otherUsers: User[] = INITIAL_USERS.map(u => ({
      ...u,
      password: 'Teste1234@',
      mustChangePassword: false, 
    }));
    
    // Add missing consultant user records for default consultants
    const defaultConsultantsUsers: User[] = [
      {
        id: 'user_helena',
        name: 'Helena Oliveira',
        email: 'helena.oliveira@techstart.io',
        role: 'TEAM_MEMBER',
        tenantId: 'tenant_techstart',
        password: 'Teste1234@',
        mustChangePassword: false,
      },
      {
        id: 'user_igor',
        name: 'Igor Fonseca',
        email: 'igor.fonseca@techstart.io',
        role: 'TEAM_MEMBER',
        tenantId: 'tenant_techstart',
        password: 'Teste1234@',
        mustChangePassword: false,
      }
    ];

    // Filter to avoid duplicating if defaultUsers are already present
    const combined = [defaultSuperAdmin, ...otherUsers];
    defaultConsultantsUsers.forEach(cu => {
      if (!combined.some(u => u.email.toLowerCase() === cu.email.toLowerCase())) {
        combined.push(cu);
      }
    });

    if (!combined.some(u => u.email.toLowerCase() === gpTestUser.email.toLowerCase())) {
      combined.push(gpTestUser);
    }

    return combined;
  });

  useEffect(() => {
    localStorage.setItem('vmo_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (loggedInUser) {
      localStorage.setItem('vmo_logged_in_user', JSON.stringify(loggedInUser));
    } else {
      localStorage.removeItem('vmo_logged_in_user');
    }
  }, [loggedInUser]);

  useEffect(() => {
    const isAdmin = activePersona === 'SUPER_ADMIN' || activePersona === 'TENANT_ADMIN';
    const isAdminTab = activeTab === 'database' || activeTab === 'rest_api' || activeTab === 'components_tree';
    if (!isAdmin && isAdminTab) {
      setActiveTab('projects');
    }
  }, [activePersona, activeTab]);

  // Master local database state (Prepopulated and enriched with demandId and default involvedAreas)
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('vmo_projects');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }

    const consultants = [
      'Camila Rocha', 'Bernardo Lima', 'Helena Oliveira', 'Diego Santos', 'Igor Fonseca', 'Renato Silvino'
    ];
    const portfolios = [
      'Inovação & TI', 'Crescimento SaaS', 'Infraestrutura Core', 'Expansão de Mercado'
    ];
    const themes = [
      'Segurança', 'Gargalo Operacional', 'Inovação de Core', 'Conformidade Fiscal', 'Redução de CapEx'
    ];
    const phases = [
      'Execução', 'Iniciação', 'Monitoramento e Controle', 'Planejamento'
    ];
    const sizes = [
      'Médio', 'Pequeno', 'Grande', 'Complexo/Megaprojeto'
    ];

    return INITIAL_PROJECTS.map((p, idx) => ({
      ...p,
      demandId: p.demandId || (1001 + idx),
      involvedAreas: p.involvedAreas || ['TI & Infraestrutura', 'Produto & Engenharia'].slice(0, (idx % 2) + 1),
      strategicPillar: p.strategicPillar || 'Eficiência Operacional',
      requestingDept: p.requestingDept || 'TI & Infraestrutura',
      consultant: p.consultant || consultants[idx % consultants.length],
      startDate: p.startDate || '2026-06-15',
      endDate: p.endDate || '2026-12-15',
      portfolio: p.portfolio || portfolios[idx % portfolios.length],
      projectTheme: p.projectTheme || themes[idx % themes.length],
      phase: p.phase || phases[idx % phases.length],
      size: p.size || sizes[idx % sizes.length],
      notes: p.notes || 'Iniciativa corporativa priorizada e monitorada no Maestro.',
      replanningCount: p.replanningCount || 0,
      baselineEndDate: p.baselineEndDate || p.endDate || '2026-12-15',
      replanningHistory: p.replanningHistory || []
    }));
  });

  useEffect(() => {
    localStorage.setItem('vmo_projects', JSON.stringify(projects));
  }, [projects]);

  const [weights, setWeights] = useState<PrioritizationWeights>(DEFAULT_WEIGHTS);

  // Synchronize weights when configCriteriaWeights modifies
  const handleUpdateCriteriaWeights = (newCriteria: CriteriaWeight[]) => {
    setConfigCriteriaWeights(newCriteria);
    const alignment = (newCriteria.find(c => c.id === 'alignment')?.weight || 15) / 100;
    const value = (newCriteria.find(c => c.id === 'value')?.weight || 15) / 100;
    const urgency = (newCriteria.find(c => c.id === 'urgency')?.weight || 15) / 100;
    const complexity = (newCriteria.find(c => c.id === 'complexity')?.weight || 15) / 100;

    const newW = { alignment, value, urgency, complexity };
    setWeights(newW);

    // Dynamic score recalculation for realism
    setProjects(prev => prev.map(p => {
      if (p.status === 'INTAKE') {
        const scoreVal = (p.prioritizationScores.alignment * alignment) + 
                         (p.prioritizationScores.value * value) + 
                         (p.prioritizationScores.urgency * urgency) + 
                         (p.prioritizationScores.complexity * complexity);
        return {
          ...p,
          prioritizationScores: {
            ...p.prioritizationScores,
            overallScore: Math.round(scoreVal * 100) / 100
          }
        };
      }
      return p;
    }));
  };

  const handleWeightsChange = (newWeights: PrioritizationWeights) => {
    setWeights(newWeights);
    // Sync back to configCriteriaWeights:
    setConfigCriteriaWeights(prev => prev.map(c => {
      if (c.id === 'alignment') return { ...c, weight: Math.round(newWeights.alignment * 100) };
      if (c.id === 'value') return { ...c, weight: Math.round(newWeights.value * 100) };
      if (c.id === 'urgency') return { ...c, weight: Math.round(newWeights.urgency * 100) };
      if (c.id === 'complexity') return { ...c, weight: Math.round(newWeights.complexity * 100) };
      return c;
    }));

    // Recalculate score for INTAKE projects
    setProjects(prev => prev.map(p => {
      if (p.status === 'INTAKE') {
        const recalculated = computeOverallWeightedScore(
          { 
            alignment: p.prioritizationScores.alignment, 
            value: p.prioritizationScores.value, 
            urgency: p.prioritizationScores.urgency, 
            complexity: p.prioritizationScores.complexity 
          },
          newWeights
        );
        return {
          ...p,
          prioritizationScores: {
            ...p.prioritizationScores,
            overallScore: recalculated
          }
        };
      }
      return p;
    }));
  };

  const [isNewIntakeModalOpen, setIsNewIntakeModalOpen] = useState<boolean>(false);

  // New Intake wizard states
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [intakeStep, setIntakeStep] = useState<number>(1);

  // Stage 1 Fields: Dados do Projeto (SaaS Metadata schema)
  const [newSponsor, setNewSponsor] = useState<string>('');
  const [newRequestingDept, setNewRequestingDept] = useState<string>('TI & Infraestrutura');
  const [newStrategicPillar, setNewStrategicPillar] = useState<string>('Eficiência Operacional');
  const [newClient, setNewClient] = useState<string>('');
  const [newPortfolio, setNewPortfolio] = useState<string>('');
  const [newSegments, setNewSegments] = useState<string[]>([]);
  const [newDesiredBudget, setNewDesiredBudget] = useState<number>(0);
  const [newProposedDeadline, setNewProposedDeadline] = useState<string>('');
  const [newBeneficiaries, setNewBeneficiaries] = useState<string>('');
  const [newInvolvedAreas, setNewInvolvedAreas] = useState<string[]>([]);

  // Stage 2 Assessment Scores
  const [ansQ1, setAnsQ1] = useState<number>(3);
  const [ansQ2, setAnsQ2] = useState<number>(3);
  const [ansQ3, setAnsQ3] = useState<number>(3);
  const [ansQ4, setAnsQ4] = useState<number>(3);
  const [ansQ5, setAnsQ5] = useState<number>(3);
  const [ansQ6, setAnsQ6] = useState<number>(3);
  const [ansQ7, setAnsQ7] = useState<number>(3);
  const [ansQ8, setAnsQ8] = useState<number>(3);

  // Averages for assessment dimensions
  const newSAlignment = ansQ1 + ansQ2;
  const newSValue = ansQ3 + ansQ4;
  const newSUrgency = ansQ5 + ansQ6;
  const newSComplexity = ansQ7 + ansQ8;

  // Edit Project master modal states
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editSponsor, setEditSponsor] = useState('');
  const [editRequestingDept, setEditRequestingDept] = useState('');
  const [editStrategicPillar, setEditStrategicPillar] = useState('');
  const [editClient, setEditClient] = useState('');
  const [editPortfolio, setEditPortfolio] = useState('');
  const [editSegments, setEditSegments] = useState<string[]>([]);
  const [editDesiredBudget, setEditDesiredBudget] = useState<number>(0);
  const [editAllocatedBudget, setEditAllocatedBudget] = useState<number>(0);
  const [editProposedDeadline, setEditProposedDeadline] = useState('');
  const [editBeneficiaries, setEditBeneficiaries] = useState('');
  const [editInvolvedAreas, setEditInvolvedAreas] = useState<string[]>([]);

  // Lookup data context
  const currentTenant = tenants.find(t => t.id === activeTenantId) || tenants[0];
  const tenantUsers = users.filter(u => u.tenantId === activeTenantId);
  const currentActiveUser = users.find(u => u.tenantId === activeTenantId && u.role === activePersona) || tenantUsers[0];

  // Map areas dynamic select fallback on tenant shift
  useEffect(() => {
    if (configAreasAtendidas.length > 0) {
      setNewRequestingDept(configAreasAtendidas[0]);
    }
  }, [configAreasAtendidas]);

  // Adjust fallback strategic pilar
  useEffect(() => {
    if (configPilares.length > 0) {
      setNewStrategicPillar(configPilares[0]);
    }
  }, [configPilares]);

  // Sync default client
  useEffect(() => {
    if (configClientes.length > 0 && !newClient) {
      setNewClient(configClientes[0]);
    }
  }, [configClientes]);

  // Sync default portfolio
  useEffect(() => {
    if (configPortfolios.length > 0 && !newPortfolio) {
      setNewPortfolio(configPortfolios[0]);
    }
  }, [configPortfolios]);

  // General calculator
  const computeOverallWeightedScore = (
    scores: { alignment: number; value: number; urgency: number; complexity: number },
    w: PrioritizationWeights
  ): number => {
    const raw = (scores.alignment * w.alignment) + 
                (scores.value * w.value) + 
                (scores.urgency * w.urgency) + 
                (scores.complexity * w.complexity);
    return Math.round(raw * 100) / 100;
  };

  // 1. Create intake via form
  const handleCreateIntakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const nextId = lastDemandId + 1;
    setLastDemandId(nextId);

    const computedOverall = computeOverallWeightedScore(
      { alignment: newSAlignment, value: newSValue, urgency: newSUrgency, complexity: newSComplexity },
      weights
    );

    const newIntake: Project = {
      id: `proj_custom_${Date.now()}`,
      tenantId: activeTenantId,
      name: newProjectName,
      description: newProjectDesc,
      status: 'INTAKE',
      createdAt: new Date().toISOString(),
      createdBy: currentActiveUser?.name || 'Gestor Logado',
      allocatedBudget: 0.0,
      demandId: nextId,
      involvedAreas: newInvolvedAreas,
      features: {
        canvas: true,
        business_case: true,
        budget: true,
        gantt: true,
        risks: true
      },
      prioritizationScores: {
        alignment: newSAlignment,
        value: newSValue,
        urgency: newSUrgency,
        complexity: newSComplexity,
        overallScore: computedOverall
      },
      sponsor: newSponsor,
      requestingDept: newRequestingDept,
      strategicPillar: newStrategicPillar,
      client: newClient,
      portfolio: newPortfolio,
      segments: newSegments,
      desiredBudget: newDesiredBudget,
      proposedDeadline: newProposedDeadline,
      beneficiaries: newBeneficiaries,
      canvasData: {
        purpose: 'Processo de Intake: ' + newProjectName,
        targetAudience: newBeneficiaries || 'Segmentado',
        channels: 'Web Corporativa',
        customerRelations: 'Otimização interna',
        keyActivities: 'Migração e parametrizações',
        keyPartners: 'Comitê Operacional',
        costStructure: `OpEx de Operação Mensal. Estimativa: R$ ${newDesiredBudget.toLocaleString('pt-BR')}`,
        expectedBenefitsValue: `Pilar Estratégico: ${newStrategicPillar}`
      },
      businessCaseData: {
        problemStatement: 'Mapeado no Intake: ' + newProjectDesc,
        solutionProposed: 'Deploy de melhoria operacional automatizada',
        expectedBenefits: `Alinhamento para a área de ${newRequestingDept}`,
        returnOnInvestment: `Otimização financeira com investimento de R$ ${newDesiredBudget.toLocaleString('pt-BR')}`,
        paybackPeriodMonths: 12
      },
      budgetLines: [],
      milestones: [],
      risks: []
    };

    setProjects(prev => [...prev, newIntake]);
    setIsNewIntakeModalOpen(false);

    // Reset fields
    setNewProjectName('');
    setNewProjectDesc('');
    setNewSponsor('');
    setNewClient(configClientes[0] || '');
    setNewPortfolio(configPortfolios[0] || '');
    setNewSegments([]);
    setNewDesiredBudget(0);
    setNewProposedDeadline('');
    setNewBeneficiaries('');
    setNewInvolvedAreas([]);
    
    setAnsQ1(3);
    setAnsQ2(3);
    setAnsQ3(3);
    setAnsQ4(3);
    setAnsQ5(3);
    setAnsQ6(3);
    setAnsQ7(3);
    setAnsQ8(3);
    setIntakeStep(1);

    setActiveTab('backlog'); // default route back
  };

  // 2. Open edit modal
  const handleOpenEditModal = (p: Project) => {
    setEditingProject(p);
    setEditName(p.name);
    setEditDesc(p.description);
    setEditSponsor(p.sponsor || '');
    setEditRequestingDept(p.requestingDept || configAreasAtendidas[0] || 'TI & Infraestrutura');
    setEditStrategicPillar(p.strategicPillar || configPilares[0] || 'Eficiência Operacional');
    setEditClient(p.client || configClientes[0] || '');
    setEditPortfolio(p.portfolio || configPortfolios[0] || '');
    setEditSegments(p.segments || []);
    setEditDesiredBudget(p.desiredBudget || 0);
    setEditAllocatedBudget(p.allocatedBudget || 0);
    setEditProposedDeadline(p.proposedDeadline || '');
    setEditBeneficiaries(p.beneficiaries || '');
    setEditInvolvedAreas(p.involvedAreas || []);
  };

  const handleSaveProjectEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    setProjects(prev => prev.map(p => {
      if (p.id === editingProject.id) {
        return {
          ...p,
          name: editName,
          description: editDesc,
          sponsor: editSponsor,
          requestingDept: editRequestingDept,
          strategicPillar: editStrategicPillar,
          client: editClient,
          portfolio: editPortfolio,
          segments: editSegments,
          desiredBudget: editDesiredBudget,
          allocatedBudget: editAllocatedBudget,
          proposedDeadline: editProposedDeadline,
          beneficiaries: editBeneficiaries,
          involvedAreas: editInvolvedAreas
        };
      }
      return p;
    }));

    setEditingProject(null);
  };

  // 3. Delete Project
  const handleDeleteProject = (id: string) => {
    if (confirm('Deseja realmente excluir permanentemente este registro de dados? Essa operação é irreversível.')) {
      setProjects(prev => prev.filter(p => p.id !== id));
    }
  };

  // 4. Committee Approve Project backends call
  const handleApproveProject = (project: Project, allocatedBudgetVal: number) => {
    setProjects(prev => prev.map(p => {
      if (p.id === project.id) {
        return {
          ...p,
          status: 'ACTIVE',
          allocatedBudget: allocatedBudgetVal,
          milestones: [
            { id: 'm_auto_1', name: 'Kick-off Geral e Planejamento Downstream', dueDate: '2026-07-20', status: 'IN_PROGRESS', progress: 10 },
            { id: 'm_auto_2', name: 'Baseline de Alocação Capex/Opex', dueDate: '2026-08-30', status: 'NOT_STARTED', progress: 0 }
          ],
          budgetLines: [
            { id: 'b_auto_1', type: 'CAPEX', category: 'Serviços Profissionais', description: 'Consultoria e setup preliminar', baselineCost: allocatedBudgetVal * 0.50, actualCost: 0.0 },
            { id: 'b_auto_2', type: 'OPEX', category: 'Infraestrutura Cloud', description: 'Servidores dedicados', baselineCost: allocatedBudgetVal * 0.20, actualCost: 0.0 }
          ]
        };
      }
      return p;
    }));
  };

  // Dynamic feature toggle handler passed down to Projects grid
  const handleToggleFeature = (projectId: string, featureKey: FeatureKey) => {
    if (activePersona === 'TEAM_MEMBER' || activePersona === 'PROJECT_MANAGER') {
      alert('Acesso Negado: Apenas gestores de portfólio ou administradores táticos podem ajustar módulos.');
      return;
    }

    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          features: {
            ...p.features,
            [featureKey]: !p.features[featureKey]
          }
        };
      }
      return p;
    }));
  };

  // Canvas updates proxy passed down
  const handleUpdateCanvasProxy = (projectId: string, updatedCanvas: CanvasData) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, canvasData: updatedCanvas };
      }
      return p;
    }));
  };

  const handleUpdateBusinessCaseProxy = (projectId: string, updatedBusiness: BusinessCaseData) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, businessCaseData: updatedBusiness };
      }
      return p;
    }));
  };

  // Financial budget proxy passed down
  const handleAddBudgetLineProxy = (projectId: string, line: Omit<BudgetLine, 'id'>) => {
    const newLineId = `b_line_${Date.now().toString().slice(-4)}`;
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          budgetLines: [...p.budgetLines, { ...line, id: newLineId }]
        };
      }
      return p;
    }));
  };

  const handleDeleteBudgetLineProxy = (projectId: string, id: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          budgetLines: p.budgetLines.filter(line => line.id !== id)
        };
      }
      return p;
    }));
  };

  const handleUpdateBudgetLineProxy = (projectId: string, updatedLine: BudgetLine) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          budgetLines: p.budgetLines.map(line => line.id === updatedLine.id ? updatedLine : line)
        };
      }
      return p;
    }));
  };

  // Chronograms milestones proxy passed down
  const handleAddMilestoneProxy = (projectId: string, m: Omit<Milestone, 'id'>) => {
    const newMId = `m_line_${Date.now().toString().slice(-4)}`;
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          milestones: [...p.milestones, { ...m, id: newMId }]
        };
      }
      return p;
    }));
  };

  const handleDeleteMilestoneProxy = (projectId: string, id: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          milestones: p.milestones.filter(m => m.id !== id)
        };
      }
      return p;
    }));
  };

  const handleUpdateMilestoneStatusProxy = (projectId: string, id: string, statusVal: Milestone['status'], progressVal: number) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          milestones: p.milestones.map(m => {
            if (m.id === id) {
              return { ...m, status: statusVal, progress: progressVal };
            }
            return m;
          })
        };
      }
      return p;
    }));
  };

  // Risk analyses proxy passed down
  const handleAddRiskProxy = (projectId: string, r: Omit<Risk, 'id'>) => {
    const newRId = `r_line_${Date.now().toString().slice(-4)}`;
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          risks: [...p.risks, { ...r, id: newRId }]
        };
      }
      return p;
    }));
  };

  const handleDeleteRiskProxy = (projectId: string, id: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          risks: p.risks.filter(r => r.id !== id)
        };
      }
      return p;
    }));
  };

  if (!loggedInUser) {
    return (
      <LoginForm
        users={users}
        setUsers={setUsers}
        onLoginSuccess={(u) => {
          setLoggedInUser(u);
          setActivePersona(u.role);
          setActiveTenantId(u.tenantId);
        }}
        theme={theme}
        designTheme={designTheme}
      />
    );
  }

  if (loggedInUser.mustChangePassword) {
    return (
      <PasswordChangeForm
        user={loggedInUser}
        onPasswordChanged={(updatedUser) => {
          setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
          setLoggedInUser(updatedUser);
        }}
        theme={theme}
        designTheme={designTheme}
      />
    );
  }

  return (
    <div className={`min-h-screen font-sans antialiased selection:bg-indigo-505 selection:text-white transition-all duration-300 ${theme === 'light' ? 'light-theme bg-slate-950 text-slate-100' : 'bg-slate-950 text-slate-100'} theme-${designTheme} flex flex-col md:flex-row`}>
      
      {/* MOBILE TOP BAR HEADER (Shown only on small screens < md) */}
      <header className="md:hidden bg-slate-900 border-b border-slate-800 p-3 px-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 bg-slate-950 border border-slate-800 hover:border-indigo-500 rounded-xl text-slate-300 hover:text-white cursor-pointer transition-all"
            aria-label="Abrir Menu de Navegação"
          >
            <Menu className="w-5 h-5 text-indigo-400" />
          </button>
          <div className="flex items-center gap-2 font-display font-extrabold text-sm text-indigo-400">
            <MaestroLogo variant="icon" className="w-5 h-5" />
            <span className="tracking-tight">Maestro</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold bg-slate-950 px-2 py-1 rounded border border-slate-800 text-emerald-400 truncate max-w-[130px]">
            {currentTenant.name}
          </span>
        </div>
      </header>

      {/* MOBILE BACKDROP OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR LEFT NAVIGATION (Responsive: Drawer on mobile, Sidebar on Desktop) */}
      <aside className={`bg-slate-900 border-r border-slate-800 transition-all duration-300 flex-col shrink-0 ${
        isSidebarCollapsed ? 'md:w-16' : 'md:w-64 lg:w-72'
      } ${
        isMobileMenuOpen 
          ? 'fixed inset-y-0 left-0 z-50 w-72 shadow-2xl flex animate-fade-in' 
          : 'hidden md:flex'
      }`}>
        {/* Sidebar Header with logo/name + Collapse Toggle button */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between overflow-hidden">
          {(!isSidebarCollapsed || isMobileMenuOpen) && (
            <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-sm tracking-tight font-display whitespace-nowrap">
              <MaestroLogo variant="icon" className="w-6 h-6" />
              <span>Maestro</span>
            </div>
          )}
          {isSidebarCollapsed && !isMobileMenuOpen && (
            <div className="mx-auto text-indigo-400 font-extrabold">
              <MaestroLogo variant="icon" className="w-6 h-6" />
            </div>
          )}
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:block p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition cursor-pointer self-center"
              title={isSidebarCollapsed ? "Expandir Menu" : "Ocultar Menu"}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition cursor-pointer"
              title="Fechar Menu"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Sidebar Navigation items */}
        <div className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {[
            { id: 'backlog', label: 'Backlog do Upstream', icon: ClipboardList, badge: projects.filter(p => p.tenantId === activeTenantId && p.status === 'INTAKE').length },
            { id: 'portfolio', label: 'Gestão de Portfólios', icon: FolderKanban, badge: portfolios.filter(p => p.tenantId === activeTenantId || !p.tenantId).length },
            { id: 'projects', label: 'Projetos Downstream', icon: Briefcase, badge: projects.filter(p => p.tenantId === activeTenantId && p.status !== 'INTAKE').length },
            ...(isITDemandsModuleEnabled ? [{ id: 'it_demands', label: 'Esteiras de Demanda TI', icon: Inbox }] : []),
            { id: 'prioritizer', label: 'Motor de Score VMO', icon: Sparkles },
            { id: 'users_admin', label: 'Acessos & Usuários', icon: Users, allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'PORTFOLIO_MANAGER'] },
            { id: 'config', label: 'Configurações', icon: Settings, allowedRoles: ['SUPER_ADMIN', 'TENANT_ADMIN'] },
            { id: 'database', label: 'Banco de Dados (RLS)', icon: Shield, adminOnly: true },
            { id: 'rest_api', label: 'Pontos de API (REST)', icon: Zap, adminOnly: true },
            { id: 'components_tree', label: 'Fronteiras Front-End', icon: Layers, adminOnly: true }
          ].filter(tab => {
            if (tab.adminOnly && activePersona !== 'SUPER_ADMIN' && activePersona !== 'TENANT_ADMIN') {
              return false;
            }
            if (tab.allowedRoles && !tab.allowedRoles.includes(activePersona)) {
              return false;
            }
            return true;
          })
           .map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-3 py-2.5 rounded-xl transition-all flex items-center gap-3 cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-600/15 border border-indigo-500/20 text-indigo-400 font-extrabold shadow-sm' 
                    : 'text-slate-400 hover:bg-slate-850 hover:text-slate-100 border border-transparent'
                } ${isSidebarCollapsed && !isMobileMenuOpen ? 'justify-center' : 'justify-start'}`}
                title={isSidebarCollapsed && !isMobileMenuOpen ? tab.label : undefined}
              >
                <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                {(!isSidebarCollapsed || isMobileMenuOpen) && (
                  <span className="text-xs text-left truncate flex-1">{tab.label}</span>
                )}
                {(!isSidebarCollapsed || isMobileMenuOpen) && tab.badge !== undefined && (
                  <span className={`px-1.5 py-0.2 text-[9px] rounded font-mono font-bold leading-none ${isActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-950 text-slate-500'}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Theme and design themes controls at bottom of sidebar */}
        {(!isSidebarCollapsed || isMobileMenuOpen) ? (
          <div className="p-4 border-t border-slate-800 space-y-3 px-3 bg-slate-950/20">
            <div className="space-y-1 block">
              <span className="text-slate-550 text-[9px] font-mono font-bold uppercase tracking-wide">Paleta de Cores:</span>
              <select
                value={designTheme}
                onChange={(e) => setDesignTheme(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-[10.5px] font-semibold text-slate-300 outline-none cursor-pointer"
              >
                <option value="ocean_teal">🌊 Turquesa & Ouro (Base da Imagem)</option>
                <option value="classic_indigo">🔹 Corporate Indigo (Clássico)</option>
                <option value="emerald_mint">🌱 Organic Emerald (Sustentabilidade)</option>
                <option value="nordic_charcoal">⛰️ Nordic Charcoal (Minimalista)</option>
                <option value="sunset_copper">🔥 Sunset Copper (Creative Agency)</option>
                <option value="cosmic_dark">🌌 Cosmic Dark (Aurora Neon)</option>
              </select>
            </div>

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-full p-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all text-xs font-semibold select-none shadow-sm"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Modo Claro (Fundo Claro)</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Modo Escuro (Fundo Escuro)</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="p-2 border-t border-slate-800 flex flex-col items-center gap-3 bg-slate-955 py-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 hover:bg-slate-850 border border-slate-800 rounded-lg text-slate-450 hover:text-white cursor-pointer transition-all"
              title="Alternar Tema"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>
          </div>
        )}

        {/* Brand identity block (Maestro Logo) */}
        {(!isSidebarCollapsed || isMobileMenuOpen) && (
          <div className="p-5 mx-3 my-2 bg-slate-950/50 rounded-2xl border border-slate-800/80 text-center shadow-lg transition-all shrink-0">
            <span className="text-[8px] font-mono font-bold uppercase tracking-[0.25em] text-indigo-400/55 mb-3 block leading-none">Plataforma Oficial</span>
            <MaestroLogo variant="large" />
          </div>
        )}

        {/* Dynamic Tenant Brand Logo Card (Menu Esquerdo) */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 shrink-0">
          <div className={`flex items-center gap-2.5 ${isSidebarCollapsed && !isMobileMenuOpen ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 rounded bg-slate-950 border border-slate-800/80 flex items-center justify-center p-1 shrink-0 shadow-inner">
              {currentTenant.logoUrl ? (
                <img src={currentTenant.logoUrl} alt={currentTenant.name} className="max-h-full max-w-full object-contain rounded" />
              ) : (
                <Building2 className="w-4 h-4 text-indigo-400" />
              )}
            </div>
            {(!isSidebarCollapsed || isMobileMenuOpen) && (
              <div className="min-w-0 flex-1">
                <span className="text-[9px] text-slate-550 font-mono font-bold leading-none block uppercase">Organização</span>
                <span className="text-xs font-bold text-slate-300 block truncate mt-0.5">{currentTenant.name}</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* RIGHT/MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* GLOBAL ENTERPRISE OVERHEADER SUB-BAR */}
        <div className="bg-slate-900 border-b border-slate-800 text-xs px-3 sm:px-6 py-2 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2 text-slate-400 text-[11px] sm:text-xs">
            <MaestroLogo variant="icon" className="w-4 h-4 shrink-0" />
            <span className="font-semibold text-slate-300 truncate">Maestro - Strategic Portfolio Manager</span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden lg:inline truncate max-w-[280px] sm:max-w-none text-slate-450">Plataforma Multitenant de Governança Híbrida PMI &amp; Ágil</span>
          </div>

          {/* ISOLAMENTO MULTITENANT & AUTENTICAÇÃO REAL - EXIBIÇÃO ESTÁTICA EXCLUSIVA */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-3 bg-slate-950/50 p-2 sm:p-1.5 px-3 rounded-xl border border-slate-850/65 text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-200 font-bold font-sans">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {loggedInUser?.name}
            </span>
            
            <span className="hidden sm:inline text-slate-800 font-light select-none">|</span>
            
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wide hidden sm:inline">Papel:</span>
              <span className="bg-indigo-950/40 text-[10px] sm:text-[10.5px] text-indigo-400 font-bold px-1.5 py-0.5 rounded border border-indigo-500/10 whitespace-nowrap select-none">
                {activePersona === 'SUPER_ADMIN' ? '⚙️ Super Admin' : 
                 activePersona === 'TENANT_ADMIN' ? '👑 Tenant Admin' : 
                 activePersona === 'PORTFOLIO_MANAGER' ? '💼 Gestor Portfólio' : 
                 activePersona === 'PROJECT_MANAGER' ? '📐 GP' : 
                 '👥 Time'}
              </span>
            </div>
            
            <span className="hidden sm:inline text-slate-800 font-light select-none">|</span>
            
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wide">Corporação:</span>
              <span className="text-emerald-400 text-[11px] font-bold select-none">{currentTenant.name}</span>
            </div>

            {/* Sair / LogOut Action */}
            {loggedInUser && (
              <div className="border-l border-slate-800 pl-2 sm:pl-3 ml-0.5 flex items-center justify-center">
                <button
                  onClick={() => {
                    setLoggedInUser(null);
                    alert('Sessão encerrada com sucesso no Maestro.');
                  }}
                  className="p-1 px-2 bg-rose-950/20 border border-rose-500/20 hover:border-rose-500/40 hover:bg-rose-955 rounded text-[10px] font-bold text-rose-400 hover:text-rose-300 transition flex items-center gap-1 cursor-pointer select-none"
                  title="Sair da Plataforma"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* WORKSPACE MAIN CONTENT */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 mt-4 sm:mt-6 space-y-4 sm:space-y-6 overflow-y-auto">
          
          {/* TOP METRICS & USER HEADING PROFILE CARD (Exibido apenas na Tela Principal e no Backlog do Upstream) */}
          {(activeTab === 'it_demands' || activeTab === 'backlog') && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                  <span className="font-mono text-[9px] text-slate-500 uppercase font-extrabold tracking-widest block leading-none">Ambiente Seguro Conectado</span>
                </div>
                <h1 className="text-lg font-bold text-slate-100 font-display">
                  Bem-vindo ao Maestro, {currentActiveUser?.name || 'Gestor'}!
                </h1>
                <p className="text-xs text-slate-450 leading-normal max-w-2xl">
                  Seu papel corporativo está configurado como <strong className="text-slate-300 font-semibold">{activePersona}</strong> para o tenant <strong className="text-indigo-400 font-semibold">{currentTenant.name}</strong>. Toda a visibilidade de linhas do banco de dados está filtrada por esse contexto lógico.
                </p>
              </div>

              {/* Intake button block */}
              <div className="flex items-center shrink-0">
                <button
                  onClick={() => {
                    setIntakeStep(1);
                    setIsNewIntakeModalOpen(true);
                  }}
                  className="w-full sm:w-auto p-3 px-5 bg-gradient-to-r from-indigo-650 to-indigo-555 hover:from-indigo-600 hover:to-indigo-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/10 cursor-pointer transition-all select-none"
                >
                  <Plus className="w-4.5 h-4.5 text-emerald-300" />
                  Novo Intake (Wizard)
                </button>
              </div>
            </div>
          )}

          {/* WORKSPACE DETAILED TAB SCREEN AREA */}
          <div className="animate-fade-in">
          
           {/* A. PRE-EXECUTION BACKLOG TAB */}
          {activeTab === 'backlog' && (
            <BacklogTab
              projects={projects.filter(p => p.tenantId === activeTenantId)}
              configAreasAtendidas={configAreasAtendidas}
              configPilares={configPilares}
              userRole={activePersona}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteProject}
              onApprove={handleApproveProject}
            />
          )}

          {/* PORTFOLIO MANAGEMENT TAB */}
          {activeTab === 'portfolio' && (
            <PortfolioManagementTab
              portfolios={portfolios}
              onSavePortfolio={(savedPortfolio) => {
                setPortfolios(prev => {
                  const exists = prev.some(p => p.id === savedPortfolio.id);
                  if (exists) {
                    return prev.map(p => p.id === savedPortfolio.id ? savedPortfolio : p);
                  } else {
                    return [savedPortfolio, ...prev];
                  }
                });
                if (!configPortfolios.includes(savedPortfolio.name)) {
                  setConfigPortfolios(prev => [...prev, savedPortfolio.name]);
                }
              }}
              onDeletePortfolio={(id) => {
                setPortfolios(prev => prev.filter(p => p.id !== id));
              }}
              projects={projects}
              activeTenantId={activeTenantId}
              userRole={activePersona}
              configAreasAtendidas={configAreasAtendidas}
              configPilares={configPilares}
              configConsultores={configConsultores.map(c => c.name)}
              onSelectPortfolioFilter={(portfolioName) => {
                setActiveTab('projects');
              }}
            />
          )}

          {/* B. ACTIVE PROJECTS GRID TAB */}
          {activeTab === 'projects' && (
            <ProjectsGridTab
              projects={projects.filter(p => p.tenantId === activeTenantId)}
              activeTenantId={activeTenantId}
              userRole={activePersona}
              configAreasAtendidas={configAreasAtendidas}
              configPilares={configPilares}
              configConsultores={configConsultores.filter(c => c.tenantId === activeTenantId).map(c => c.name)}
              configPorte={configPorte}
              configPortfolios={configPortfolios}
              configTemas={configTemas}
              configFases={configFases}
              configFinancialCategories={configFinancialCategories}
              users={users}
              onUpdateProjectFields={(id, fields) => {
                setProjects(prev => prev.map(p => p.id === id ? { ...p, ...fields } : p));
              }}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteProject}
              onToggleFeature={handleToggleFeature}
              onUpdateCanvas={(updated) => {
                const activeId = projects.find(p => p.tenantId === activeTenantId && p.status !== 'INTAKE')?.id;
                if (activeId) handleUpdateCanvasProxy(activeId, updated);
              }}
              onUpdateBusinessCase={(updated) => {
                const activeId = projects.find(p => p.tenantId === activeTenantId && p.status !== 'INTAKE')?.id;
                if (activeId) handleUpdateBusinessCaseProxy(activeId, updated);
              }}
              onAddBudgetLine={(line) => {
                const activeId = projects.find(p => p.tenantId === activeTenantId && p.status !== 'INTAKE')?.id;
                if (activeId) handleAddBudgetLineProxy(activeId, line);
              }}
              onDeleteBudgetLine={(id) => {
                const activeId = projects.find(p => p.tenantId === activeTenantId && p.status !== 'INTAKE')?.id;
                if (activeId) handleDeleteBudgetLineProxy(activeId, id);
              }}
              onUpdateBudgetLine={(updatedLine) => {
                const activeId = projects.find(p => p.tenantId === activeTenantId && p.status !== 'INTAKE')?.id;
                if (activeId) handleUpdateBudgetLineProxy(activeId, updatedLine);
              }}
              onAddMilestone={(m) => {
                const activeId = projects.find(p => p.tenantId === activeTenantId && p.status !== 'INTAKE')?.id;
                if (activeId) handleAddMilestoneProxy(activeId, m);
              }}
              onDeleteMilestone={(id) => {
                const activeId = projects.find(p => p.tenantId === activeTenantId && p.status !== 'INTAKE')?.id;
                if (activeId) handleDeleteMilestoneProxy(activeId, id);
              }}
              onUpdateMilestoneStatus={(id, status, progress) => {
                const activeId = projects.find(p => p.tenantId === activeTenantId && p.status !== 'INTAKE')?.id;
                if (activeId) handleUpdateMilestoneStatusProxy(activeId, id, status, progress);
              }}
              onAddRisk={(r) => {
                const activeId = projects.find(p => p.tenantId === activeTenantId && p.status !== 'INTAKE')?.id;
                if (activeId) handleAddRiskProxy(activeId, r);
              }}
              onDeleteRisk={(id) => {
                const activeId = projects.find(p => p.tenantId === activeTenantId && p.status !== 'INTAKE')?.id;
                if (activeId) handleDeleteRiskProxy(activeId, id);
              }}
            />
          )}

          {/* C. MOTOR DE SCORE PRIORITIZER TAB */}
          {activeTab === 'prioritizer' && (
            <PrioritizationEngine
              weights={weights}
              onWeightsChange={handleWeightsChange}
              userRole={activePersona}
            />
          )}

          {/* D. LIVE GOVERNANCE PARAMS CONFIGURATION TAB */}
          {activeTab === 'config' && (
            <ConfigurationTab
              configPorte={configPorte}
              setConfigPorte={setConfigPorteWrapped}
              configPortfolios={configPortfolios}
              setConfigPortfolios={setConfigPortfoliosWrapped}
              configClientes={configClientes}
              setConfigClientes={setConfigClientesWrapped}
              configSegmentos={configSegmentos}
              setConfigSegmentos={setConfigSegmentosWrapped}
              configAreasAtendidas={configAreasAtendidas}
              setConfigAreasAtendidas={setConfigAreasAtendidasWrapped}
              configTemas={configTemas}
              setConfigTemas={setConfigTemasWrapped}
              configFases={configFases}
              setConfigFases={setConfigFasesWrapped}
              configCriteriaWeights={configCriteriaWeights}
              onCriteriaWeightsChange={handleUpdateCriteriaWeights}
              configPilares={configPilares}
              setConfigPilares={setConfigPilaresWrapped}
              configFinancialCategories={configFinancialCategories}
              setConfigFinancialCategories={setConfigFinancialCategoriesWrapped}
              userRole={activePersona}
              tenants={tenants}
              currentTenantId={loggedInUser!.tenantId}
              activeTenantId={activeTenantId}
              setActiveTenantId={setActiveTenantId}
              setTenants={setTenants}
              isITDemandsModuleEnabled={isITDemandsModuleEnabled}
              setIsITDemandsModuleEnabled={setIsITDemandsModuleEnabled}
            />
          )}

          {/* H. ACCESS AND USERS MANAGEMENT TAB */}
          {activeTab === 'users_admin' && (
            <UsersManagementTab
              users={users}
              setUsers={setUsers}
              tenants={tenants}
              currentUser={loggedInUser!}
            />
          )}

          {/* I. IT DEMANDS & WORKFLOWS TAB */}
          {activeTab === 'it_demands' && isITDemandsModuleEnabled && (
            <ITDemandsTab
              projects={projects}
              activeTenantId={activeTenantId}
              currentActiveUser={currentActiveUser}
              configAreasAtendidas={configAreasAtendidas}
              configPilares={configPilares}
              activePersona={activePersona}
              onSwitchTab={(tab) => {
                setActiveTab(tab as any);
                alert('Você foi redirecionado com sucesso para a ferramenta de Projetos e Backlog do Maestro!');
              }}
              onRouteToVMO={(title, desc, dept, urgency) => {
                const nextId = lastDemandId + 1;
                setLastDemandId(nextId);
                const scores = { 
                  alignment: 5, 
                  value: 6, 
                  urgency: urgency === 'HIGH' ? 9 : urgency === 'MEDIUM' ? 6 : 3, 
                  complexity: 5 
                };
                const computedOverall = computeOverallWeightedScore(scores, weights);
                const newProject: Project = {
                  id: `proj_demand_${Date.now()}`,
                  tenantId: activeTenantId,
                  name: title,
                  description: desc,
                  status: 'INTAKE',
                  createdAt: new Date().toISOString(),
                  createdBy: currentActiveUser?.name || 'Diretoria de TI',
                  demandId: nextId,
                  involvedAreas: [dept],
                  requestingDept: dept,
                  sponsor: 'Diretor TI / VMO Tech',
                  strategicPillar: configPilares[0] || 'Eficiência Operacional',
                  allocatedBudget: 0,
                  desiredBudget: 150000,
                  features: {
                    canvas: true,
                    business_case: true,
                    budget: true,
                    gantt: true,
                    risks: true
                  },
                  prioritizationScores: {
                    ...scores,
                    overallScore: computedOverall
                  },
                  canvasData: {
                    purpose: 'Iniciativa admitida a partir de demanda prioritária de TI.',
                    targetAudience: 'Colaboradores do setor: ' + dept,
                    channels: 'Central de TI - SLA Integrado',
                    customerRelations: 'Acompanhamento contínuo em painel analítico',
                    keyActivities: 'Mapeamento preliminar de requisitos, design de processos corporativos, seleção de infraestrutura cloud',
                    keyPartners: 'Áreas de negócio afetadas, comitê executivo e Diretoria de TI',
                    costStructure: 'Custos de subscrições de software SaaS, desenvolvimento customizado e onboarding de equipes',
                    expectedBenefitsValue: 'Eliminação completa de Shadow IT e otimização substancial de tempo do setor: ' + dept
                  },
                  businessCaseData: {
                    problemStatement: desc,
                    solutionProposed: 'Projeto estruturado de alta fidelidade e desenvolvimento focado em escala pela equipe do VMO.',
                    expectedBenefits: 'Solução corporativa centralizada, segura e totalmente alinhada ao orçamento prioritário.',
                    returnOnInvestment: 'Prevenção de custos com soluções isoladas descentralizadas.',
                    paybackPeriodMonths: 8
                  },
                  budgetLines: [],
                  milestones: [
                    { id: `m_1_${Date.now()}`, name: 'Análise de Viabilidade Técnica e Negócio', dueDate: '2026-07-20', status: 'NOT_STARTED', progress: 0 },
                    { id: `m_2_${Date.now()}`, name: 'Modelagem e Definição de Escopo VMO', dueDate: '2026-08-15', status: 'NOT_STARTED', progress: 0 }
                  ],
                  risks: []
                };

                setProjects(prev => {
                  const updated = [newProject, ...prev];
                  localStorage.setItem('vmo_projects', JSON.stringify(updated));
                  return updated;
                });
                return nextId;
              }}
            />
          )}

          {/* E. POSTGRES SCHEMAS / MODELAGEM TAB */}
          {activeTab === 'database' && (
            <DbSchemaView currentTenant={currentTenant} currentPersona={activePersona} />
          )}

          {/* F. API REST ENDPOINTS DOCUMENTATION */}
          {activeTab === 'rest_api' && (
            <ApiSpecView token={weights} />
          )}

          {/* G. COMPOSITION FOR FRONT COMPONENT TREE */}
          {activeTab === 'components_tree' && (
            <ProductTreeExplain />
          )}

        </div>

      </main>

      </div>

      {/* ==================== 1. WIZARD METRICS INTAKE FORM MODAL (3 STAGES) ==================== */}
      {isNewIntakeModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            
            {/* Modal Header */}
            <div className="bg-slate-950 p-5 border-b border-slate-850 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
                  <ClipboardList className="w-5 h-5 text-indigo-400" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-display">Rito de Intake: Funil de Demandas</h3>
                  <p className="text-[10px] text-slate-500 font-mono">Governança Integrada PMI & Ágil • Multi-step Wizard</p>
                </div>
              </div>
              
              <button 
                onClick={() => setIsNewIntakeModalOpen(false)}
                className="p-1.5 hover:bg-slate-850 rounded text-slate-450 hover:text-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stages visual milestones ticker progress */}
            <div className="bg-slate-950/60 p-3 px-5 border-b border-slate-850 flex justify-between items-center text-[10.5px] font-mono tracking-tight shrink-0 select-none">
              <span className={`font-semibold transition-all ${intakeStep === 1 ? 'text-indigo-400 font-extrabold underline' : 'text-slate-500'}`}>1. Dados Gerais</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-800" />
              <span className={`font-semibold transition-all ${intakeStep === 2 ? 'text-indigo-400 font-extrabold underline' : 'text-slate-500'}`}>2. Assessment Estratégico</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-800" />
              <span className={`font-semibold transition-all ${intakeStep === 3 ? 'text-indigo-400 font-extrabold underline' : 'text-slate-500'}`}>3. Resultado de Prioridade</span>
            </div>

            {/* Modal Body content */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-900 text-slate-300">
              <form onSubmit={handleCreateIntakeSubmit} className="space-y-4">
                
                {/* STAGE 1: DADOS DO PROJETO */}
                {intakeStep === 1 && (
                  <div className="space-y-4 animate-fade-in text-xs">
                    
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850/60 flex gap-3">
                      <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <strong className="block text-slate-205">Campos Regulamentares do Portfolio</strong>
                        <p className="text-[10.5px] text-slate-405 leading-relaxed">
                          Forneça as variáveis de controle corporativo exigidas pelo VMO para preenchimento posterior de CapEx, OpEx e marcos ativos.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* ID da Demanda (autonumeric showcase) */}
                      <div className="space-y-1">
                        <label className="text-slate-450 font-mono text-[10px] font-extrabold uppercase tracking-wider block">ID da Demanda (Auto-incremento)</label>
                        <input
                          type="text"
                          disabled
                          value={`#${lastDemandId + 1}`}
                          className="w-full bg-slate-950/50 border border-slate-850/80 p-2.5 rounded text-indigo-400 font-mono font-bold outline-none select-none"
                        />
                      </div>

                      {/* Nome do Projeto */}
                      <div className="space-y-1">
                        <label className="text-slate-450 font-mono text-[10px] font-extrabold uppercase tracking-wider block">Nome do Projeto / Iniciativa *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Upgrade de Gateway de Pagamento"
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-slate-200 focus:outline-none placeholder-slate-600 font-medium"
                        />
                      </div>

                      {/* Cliente (Obrigatório) */}
                      <div className="space-y-1">
                        <label className="text-slate-450 font-mono text-[10px] font-extrabold uppercase tracking-wider block flex items-center justify-between">
                          <span>Cliente Atendido *</span>
                          <span className="text-rose-400 text-[9px] font-sans font-semibold">Obrigatório</span>
                        </label>
                        <select
                          required
                          value={newClient}
                          onChange={(e) => setNewClient(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-slate-200 focus:outline-none cursor-pointer font-semibold"
                        >
                          <option value="">-- Selecione o Cliente (Obrigatório) --</option>
                          {configClientes.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      {/* Portfólio (Obrigatório) */}
                      <div className="space-y-1">
                        <label className="text-slate-450 font-mono text-[10px] font-extrabold uppercase tracking-wider block flex items-center justify-between">
                          <span>Portfólio Estratégico *</span>
                          <span className="text-rose-400 text-[9px] font-sans font-semibold">Obrigatório</span>
                        </label>
                        <select
                          required
                          value={newPortfolio}
                          onChange={(e) => setNewPortfolio(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-slate-200 focus:outline-none cursor-pointer font-semibold"
                        >
                          <option value="">-- Selecione o Portfólio (Obrigatório) --</option>
                          {configPortfolios.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      {/* Sponsor */}
                      <div className="space-y-1">
                        <label className="text-slate-450 font-mono text-[10px] font-extrabold uppercase tracking-wider block">Patrocinador do Projeto (Sponsor)</label>
                        <input
                          type="text"
                          placeholder="Ex: CTO ou Head of Merchant Growth"
                          value={newSponsor}
                          onChange={(e) => setNewSponsor(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-slate-200 focus:outline-none"
                        />
                      </div>

                      {/* Orçamento Pretendido (Formato Numérico Garantido) */}
                      <div className="space-y-1">
                        <label className="text-slate-450 font-mono text-[10px] font-extrabold uppercase tracking-wider block">Orçamento Pretendido / Investimento Estimado (R$)</label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0,00"
                          value={newDesiredBudget === 0 ? '' : newDesiredBudget}
                          onChange={(e) => setNewDesiredBudget(e.target.value === '' ? 0 : Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-slate-200 font-mono focus:outline-none font-semibold"
                        />
                      </div>

                      {/* Área Solicitante */}
                      <div className="space-y-1">
                        <label className="text-slate-450 font-mono text-[10px] font-extrabold uppercase tracking-wider block">Área Solicitante</label>
                        <select
                          value={newRequestingDept}
                          onChange={(e) => setNewRequestingDept(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-slate-200 focus:outline-none cursor-pointer font-semibold"
                        >
                          {configAreasAtendidas.map(area => (
                            <option key={area} value={area}>{area}</option>
                          ))}
                        </select>
                      </div>

                      {/* Pilar Estratégico Principal */}
                      <div className="space-y-1">
                        <label className="text-slate-450 font-mono text-[10px] font-extrabold uppercase tracking-wider block">Pilar Estratégico Principal</label>
                        <select
                          value={newStrategicPillar}
                          onChange={(e) => setNewStrategicPillar(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-slate-200 focus:outline-none cursor-pointer font-semibold"
                        >
                          {configPilares.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      {/* Prazo Estimado */}
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-slate-450 font-mono text-[10px] font-extrabold uppercase tracking-wider block">Prazo Estimado de Implantação (Quantidade em Meses)</label>
                        <input
                          type="number"
                          min="1"
                          required
                          placeholder="Digite a quantidade de meses (ex: 6)"
                          value={newProposedDeadline}
                          onChange={(e) => setNewProposedDeadline(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-slate-205 focus:outline-none text-[11px] font-mono font-bold"
                        />
                      </div>

                      {/* Segmentos de Negócio (Multiseleção, Obrigatório) */}
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-slate-450 font-mono text-[10px] font-extrabold uppercase tracking-wider block flex items-center justify-between">
                          <span>Segmento(s) de Negócio Atendido(s) * <span className="text-indigo-400 font-mono">(Múltipla Escolha)</span></span>
                          <span className={`${newSegments.length === 0 ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'} text-[9px] font-sans`}>
                            {newSegments.length === 0 ? 'Selecione ao menos 1 (Obrigatório)' : `${newSegments.length} selecionado(s)`}
                          </span>
                        </label>
                        <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg max-h-[140px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {configSegmentos.map(seg => {
                            const isChecked = newSegments.includes(seg);
                            return (
                              <label key={seg} className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none text-[11px]">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setNewSegments(prev => [...prev, seg]);
                                    } else {
                                      setNewSegments(prev => prev.filter(item => item !== seg));
                                    }
                                  }}
                                  className="accent-indigo-505 w-4 h-4 rounded border-slate-850 bg-slate-900 cursor-pointer"
                                />
                                <span>{seg}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Escopo do Projeto */}
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-slate-450 font-mono text-[10px] font-extrabold uppercase tracking-wider block">Resumo do Escopo / Descrição Técnica</label>
                        <textarea
                          required
                          rows={2}
                          placeholder="Escreva um breve resumo contendo as especificações funcionais e entregáveis..."
                          value={newProjectDesc}
                          onChange={(e) => setNewProjectDesc(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-slate-200 focus:outline-none text-[11px]"
                        />
                      </div>

                      {/* 5. Áreas envolvidas (Dynamic multi-selection checkboxes) */}
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-slate-450 font-mono text-[10px] font-extrabold uppercase tracking-wider block">Áreas envolvidas <span className="text-indigo-400 font-mono">(Multiseleção)</span></label>
                        <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg max-h-[140px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {configAreasAtendidas.map(area => {
                            const isChecked = newInvolvedAreas.includes(area);
                            return (
                              <label key={area} className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none text-[11px]">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setNewInvolvedAreas(prev => [...prev, area]);
                                    } else {
                                      setNewInvolvedAreas(prev => prev.filter(item => item !== area));
                                    }
                                  }}
                                  className="accent-indigo-505 w-4 h-4 rounded border-slate-850 bg-slate-900 cursor-pointer"
                                />
                                <span>{area}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                    </div>

                    <div className="pt-4 border-t border-slate-850 flex justify-end gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (!newProjectName.trim()) {
                            alert('Por favor, informe o Nome do Projeto / Iniciativa.');
                            return;
                          }
                          if (!newClient.trim()) {
                            alert('Por favor, selecione o Cliente que será atendido pela demanda (campo obrigatório).');
                            return;
                          }
                          if (!newPortfolio.trim()) {
                            alert('Por favor, selecione o Portfólio do qual a demanda fará parte (campo obrigatório).');
                            return;
                          }
                          if (!newSegments || newSegments.length === 0) {
                            alert('Por favor, selecione ao menos um Segmento de Negócio que a demanda atenderá (campo obrigatório).');
                            return;
                          }
                          setIntakeStep(2);
                        }}
                        className="p-2.5 px-5 bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                      >
                        Prosseguir para o Assessment
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                )}

                {/* STAGE 2: ASSESSMENT QUESTIONS */}
                {intakeStep === 2 && (
                  <div className="space-y-4 animate-fade-in text-xs">
                    
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850/60 flex gap-3">
                      <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <strong className="block text-slate-205">Assessment de Critérios & Cálculo de Priorização</strong>
                        <p className="text-[10.5px] text-slate-405 leading-relaxed">
                          Responda às perguntas objetivas baseadas no framework de avaliação. O motor estratégico calculará automaticamente a pontuação ponderada.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      
                      {/* Critério 1: Alinhamento Estratégico */}
                      <div className="space-y-3 p-3 bg-slate-950/20 rounded-xl border border-slate-850">
                        <span className="text-[9px] font-mono text-indigo-400 font-extrabold uppercase tracking-wider block">Dimensão A: Alinhamento Estratégico</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div className="space-y-1.5">
                            <label className="text-slate-200 font-bold block leading-tight">Q1. Grau de aderência aos OKRs anuais:</label>
                            <select
                              value={ansQ1}
                              onChange={(e) => setAnsQ1(parseInt(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-800 p-2 rounded cursor-pointer text-slate-350"
                            >
                              <option value={1}>1 - Alinhamento nulo ou indireto</option>
                              <option value={2}>2 - Suporta marginalmente 1 OKR</option>
                              <option value={3}>3 - Impacto moderado em OKRs principais</option>
                              <option value={4}>4 - Alinhamento estreito e robusto</option>
                              <option value={5}>5 - Core estratégico indispensável para sustentação</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-slate-200 font-bold block leading-tight">Q2. Potencial de inovação setorial:</label>
                            <select
                              value={ansQ2}
                              onChange={(e) => setAnsQ2(parseInt(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-800 p-2 rounded cursor-pointer text-slate-305"
                            >
                              <option value={1}>1 - Operação pura / Sem valor inovador</option>
                              <option value={2}>2 - Melhoria marginal de processo existente</option>
                              <option value={3}>3 - Evolução tecnológica do ecossistema</option>
                              <option value={4}>4 - Abre nova avenida de receita ou vantagem</option>
                              <option value={5}>5 - Ruptura radical corporativa (Tech-leader)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Critério 2: ROI / Retorno */}
                      <div className="space-y-3 p-3 bg-slate-950/20 rounded-xl border border-slate-850">
                        <span className="text-[9px] font-mono text-emerald-400 font-extrabold uppercase tracking-wider block">Dimensão B: Retorno Financeiro / ROI</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div className="space-y-1.5">
                            <label className="text-slate-200 font-bold block leading-tight">Q3. Potencial de acréscimo de ARR ou MRR:</label>
                            <select
                              value={ansQ3}
                              onChange={(e) => setAnsQ3(parseInt(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-800 p-2 rounded cursor-pointer text-slate-305"
                            >
                              <option value={1}>1 - Retorno intangível / Sem receita</option>
                              <option value={2}>2 - Marginal crescimento em base menor</option>
                              <option value={3}>3 - Retorno financeiro moderado (&lt; 1 ano)</option>
                              <option value={4}>4 - Forte ARR adicionado no trimestre</option>
                              <option value={5}>5 - Multiplicador de ARR bruto global</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-slate-200 font-bold block leading-tight">Q4. Redução de Despesa Corrente (Churn):</label>
                            <select
                              value={ansQ4}
                              onChange={(e) => setAnsQ4(parseInt(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-800 p-2 rounded cursor-pointer text-slate-305"
                            >
                              <option value={1}>1 - Não reduz churn / Sem impacto OpEx</option>
                              <option value={2}>2 - Eficiência discreta localizada</option>
                              <option value={3}>3 - Redução substancial de gargalos</option>
                              <option value={4}>4 - Churn de contas sensivelmente amenizado</option>
                              <option value={5}>5 - Mitiga gastos críticos e otimiza margem</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Dimensões extras de Urgência e Complexidade */}
                      <div className="space-y-3 p-3 bg-slate-950/20 rounded-xl border border-slate-850">
                        <span className="text-[9px] font-mono text-amber-400 font-extrabold uppercase tracking-wider block">Dimensões Complementares</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div className="space-y-1.5">
                            <label className="text-slate-200 font-bold block leading-tight">Q5. Urgência Regulatória:</label>
                            <select
                              value={ansQ5}
                              onChange={(e) => setAnsQ5(parseInt(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-800 p-2 rounded cursor-pointer text-slate-305"
                            >
                              <option value={1}>1 - Baixa - Sem deadline legal</option>
                              <option value={2}>2 - Janela tática de mercado desejável</option>
                              <option value={3}>3 - Exigência de contrato de cliente Tier 1</option>
                              <option value={4}>4 - Penalidade contratual iminente</option>
                              <option value={5}>5 - Regulação mandante / Risco de Compliance imediato</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-slate-200 font-bold block leading-tight">Q7. Simplicidade de Escopo (TI):</label>
                            <select
                              value={ansQ7}
                              onChange={(e) => setAnsQ7(parseInt(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-800 p-2 rounded cursor-pointer text-slate-305"
                            >
                              <option value={1}>1 - Engenharia brutal (&gt; 6 meses de squad)</option>
                              <option value={2}>2 - Alta complexidade em legado (3 meses)</option>
                              <option value={3}>3 - Esforço moderado tático (2 meses)</option>
                              <option value={4}>4 - Sprint operacional padrão (3 semanas)</option>
                              <option value={5}>5 - Implantação rápida ou no-code (Dias)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                    </div>

                    <div className="pt-4 border-t border-slate-850 flex justify-between gap-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIntakeStep(1)}
                        className="p-2 px-4 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 rounded font-bold cursor-pointer"
                      >
                        Voltar para Dados Gerais
                      </button>
                      <button
                        type="button"
                        onClick={() => setIntakeStep(3)}
                        className="p-2.5 px-5 bg-indigo-650 hover:bg-indigo-605 text-white font-bold rounded-lg flex items-center gap-1 cursor-pointer shadow"
                      >
                        Ver Avaliação de Score
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                )}

                {/* STAGE 3: RESULTADO DE SCORE GERAL */}
                 {/* STAGE 3: RESULTADO DE SCORE GERAL */}
                {intakeStep === 3 && (() => {
                  const currentScore = computeOverallWeightedScore(
                    { alignment: newSAlignment, value: newSValue, urgency: newSUrgency, complexity: newSComplexity },
                    weights
                  );
                  
                  let rec = {
                    title: "Aprovação Imediata Recomendada (Alta Prioridade)",
                    color: "text-emerald-400 bg-emerald-950/80 border-emerald-500/20",
                    bullet: "🟢",
                    desc: "Iniciativa altamente estratégica com excelente alinhamento, alto valor agregado e viabilidade técnica. Recomenda-se aprovação imediata para desenvolvimento downstream."
                  };
                  if (currentScore < 5.0) {
                    rec = {
                      title: "Rever Escopo ou Postergar (Baixa Prioridade)",
                      color: "text-rose-400 bg-rose-950/80 border-rose-500/20",
                      bullet: "🔴",
                      desc: "A iniciativa apresenta baixo score global ou alta complexidade de implantação em relação ao retorno previsto. Recomenda-se refinar o Business Case ou adiar para ciclos futuros."
                    };
                  } else if (currentScore < 8.0) {
                    rec = {
                      title: "Planejamento Tático (Média Prioridade)",
                      color: "text-amber-400 bg-amber-950/80 border-amber-500/20",
                      bullet: "🟡",
                      desc: "Iniciativa equilibrada com retornos relevantes, mas complexidade moderada. Recomenda-se aprovação condicionada à capacidade (capacity) das squads sob o roadmap ativo."
                    };
                  }

                  return (
                    <div className="space-y-4 animate-fade-in text-xs">
                      
                      <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 p-5 rounded-xl border border-indigo-500/20 text-center space-y-3">
                        <div>
                          <span className="text-[10px] font-mono text-indigo-400 font-extrabold uppercase tracking-widest block leading-none mb-1">Cálculo de Score de Prioridade Estabelecido</span>
                          <p className="text-[10.5px] text-slate-500">Média ponderada baseada no motor dinâmico PMO.</p>
                        </div>

                        <div className="inline-flex items-baseline justify-center gap-1 bg-slate-950 shadow-inner p-3 px-6 rounded-2xl border border-slate-800">
                          <span className="text-3xl font-extrabold text-violet-400 font-mono">
                            {currentScore.toFixed(2)}
                          </span>
                          <span className="text-slate-500 font-mono text-[11px] font-bold">/ 10</span>
                        </div>
                      </div>

                      {/* RECOMMENDATION ACTION BLOCK */}
                      <div className={`p-4 rounded-xl border ${rec.color} space-y-1.5`}>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{rec.bullet}</span>
                          <strong className="text-xs font-bold font-display">{rec.title}</strong>
                        </div>
                        <p className="text-[11px] leading-relaxed opacity-90">{rec.desc}</p>
                      </div>

                      {/* Progress bars show */}
                      <div className="bg-slate-950/60 p-4 border border-slate-850 rounded-xl space-y-3">
                        <span className="text-[9px] font-mono uppercase font-extrabold text-slate-500 leading-none">Status Dimensional</span>
                        
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-[11px] font-semibold text-slate-350">
                              <span>1. Alinhamento Estratégico (Q1 + Q2):</span>
                              <span className="font-mono text-indigo-405">{newSAlignment} / 10</span>
                            </div>
                            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1">
                              <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${newSAlignment * 10}%` }}></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-[11px] font-semibold text-slate-350">
                              <span>2. Retorno de Negócio (Q3 + Q4):</span>
                              <span className="font-mono text-emerald-405">{newSValue} / 10</span>
                            </div>
                            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${newSValue * 10}%` }}></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-[11px] font-semibold text-slate-350">
                              <span>3. Urgência de Prazo (Q5 + Q6):</span>
                              <span className="font-mono text-amber-405">{newSUrgency} / 10</span>
                            </div>
                            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-1">
                              <div className="bg-amber-500 h-full rounded-full" style={{ width: `${newSUrgency * 10}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-850 flex justify-between gap-2.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIntakeStep(2)}
                          className="p-2 px-4 bg-slate-850 hover:bg-slate-805 text-slate-400 hover:text-slate-200 rounded font-bold cursor-pointer"
                        >
                          Voltar para Assessment
                        </button>
                        <button
                          type="submit"
                          className="p-3 px-6 bg-emerald-600 hover:bg-emerald-505 text-white font-extrabold rounded-lg transition shadow flex items-center gap-1 cursor-pointer select-none"
                        >
                          <Check className="w-4 h-4 text-emerald-300" />
                          Finalizar e Cadastrar no Funil Upstream
                        </button>
                      </div>

                    </div>
                  );
                })()}

              </form>
            </div>

          </div>
        </div>
      )}

      {/* ==================== 2. MASTER EDIT DIALOG PROJECT MODAL (FOR BACKLOGS AND FOR PROJECTS) ==================== */}
      {editingProject && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-indigo-600/10 text-indigo-400 rounded-lg">
                  <Settings className="w-5 h-5 text-indigo-400" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-display">Editar Dados Cadastrais</h3>
                  <p className="text-[10px] text-slate-500 font-mono">Modulando parâmetros de controle de forma direta</p>
                </div>
              </div>
              <button onClick={() => setEditingProject(null)} className="p-1 hover:bg-slate-850 rounded text-slate-405 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProjectEditSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="text-slate-450 font-mono text-[9.5px] font-bold uppercase tracking-wide block">Nome do Projeto/Iniciativa</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-205 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-450 font-mono text-[9.5px] font-bold uppercase tracking-wide block">Cliente Atendido</label>
                  <select
                    value={editClient}
                    onChange={(e) => setEditClient(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-205 cursor-pointer focus:outline-none"
                  >
                    <option value="">-- Selecione o Cliente --</option>
                    {configClientes.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-450 font-mono text-[9.5px] font-bold uppercase tracking-wide block">Portfólio Estratégico</label>
                  <select
                    value={editPortfolio}
                    onChange={(e) => setEditPortfolio(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-205 cursor-pointer focus:outline-none"
                  >
                    <option value="">-- Selecione o Portfólio --</option>
                    {configPortfolios.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-450 font-mono text-[9.5px] font-bold uppercase tracking-wide block">Sponsor (Patrocinador)</label>
                  <input
                    type="text"
                    value={editSponsor}
                    onChange={(e) => setEditSponsor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-205 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-450 font-mono text-[9.5px] font-bold uppercase tracking-wide block">Orçamento Pretendido (CapEx Estimado R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={editDesiredBudget}
                    onChange={(e) => setEditDesiredBudget(e.target.value === '' ? 0 : Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-200 font-mono focus:outline-none"
                  />
                </div>

                {editingProject.status !== 'INTAKE' && (
                  <div className="space-y-1">
                    <label className="text-slate-450 font-mono text-[9.5px] font-bold bg-indigo-500/10 text-indigo-400 p-0.5 px-1.5 rounded uppercase tracking-wide block">Orçamento Autorizado (Budget Alocado R$)</label>
                    <input
                      type="number"
                      value={editAllocatedBudget}
                      onChange={(e) => setEditAllocatedBudget(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-indigo-900/60 p-2 rounded text-indigo-300 font-mono focus:outline-none font-bold"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-slate-450 font-mono text-[9.5px] font-bold uppercase tracking-wide block">Área Solicitante</label>
                  <select
                    value={editRequestingDept}
                    onChange={(e) => setEditRequestingDept(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-350 cursor-pointer focus:outline-none"
                  >
                    {configAreasAtendidas.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-450 font-mono text-[9.5px] font-bold uppercase tracking-wide block">Pilar Estratégico Principal</label>
                  <select
                    value={editStrategicPillar}
                    onChange={(e) => setEditStrategicPillar(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-350 cursor-pointer focus:outline-none font-medium"
                  >
                    {configPilares.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-450 font-mono text-[9.5px] font-bold uppercase tracking-wide block">Prazo Estimado de Implantação (Quantidade em Meses)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editProposedDeadline}
                    onChange={(e) => setEditProposedDeadline(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-205 focus:outline-none font-mono font-bold"
                  />
                </div>

                {/* Segmentos de Negócio */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-450 font-mono text-[9.5px] font-bold uppercase tracking-wide block">Segmento(s) de Negócio <span className="text-indigo-400 font-mono">(Multiseleção)</span></label>
                  <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-lg max-h-[120px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {configSegmentos.map(seg => {
                      const isChecked = editSegments.includes(seg);
                      return (
                        <label key={seg} className="flex items-center gap-2 text-slate-300 hover:text-white cursor-pointer select-none text-[11px]">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditSegments(prev => [...prev, seg]);
                              } else {
                                setEditSegments(prev => prev.filter(item => item !== seg));
                              }
                            }}
                            className="accent-indigo-505 w-3.5 h-3.5 rounded border-slate-850 bg-slate-900 cursor-pointer"
                          />
                          <span>{seg}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-450 font-mono text-[9.5px] font-bold uppercase tracking-wide block">Resumo do Escopo / Descrição</label>
                  <textarea
                    rows={2}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-205 focus:outline-none"
                  />
                </div>

                {/* Edit involvedAreas checkbox list */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-slate-450 font-mono text-[9.5px] font-bold uppercase tracking-wide block">Áreas envolvidas <span className="text-indigo-400 font-mono">(Multiseleção)</span></label>
                  <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg max-h-[120px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {configAreasAtendidas.map(area => {
                      const isChecked = editInvolvedAreas.includes(area);
                      return (
                        <label key={area} className="flex items-center gap-2 cursor-pointer text-slate-350 hover:text-white select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditInvolvedAreas(prev => [...prev, area]);
                              } else {
                                setEditInvolvedAreas(prev => prev.filter(a => a !== area));
                              }
                            }}
                            className="accent-indigo-505 w-4 h-4 rounded border-slate-850 bg-slate-900 cursor-pointer"
                          />
                          <span>{area}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

              </div>

              <div className="pt-3 border-t border-slate-800/80 flex gap-2.5 justify-end">
                <button
                  type="submit"
                  className="p-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs"
                >
                  Salvar Alterações
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="p-2 px-3 bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
