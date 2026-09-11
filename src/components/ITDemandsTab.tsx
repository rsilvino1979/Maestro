import React, { useState, useEffect } from 'react';
import { 
  Inbox, 
  Send, 
  Layers, 
  BarChart4, 
  BookOpen, 
  UserCheck, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Building, 
  ChevronRight, 
  Bot, 
  Briefcase, 
  Globe, 
  Filter, 
  Search, 
  Copy, 
  Check, 
  Plus, 
  RefreshCcw,
  Mail,
  Sliders,
  Table,
  LayoutGrid,
  X
} from 'lucide-react';
import { Project, User } from '../types';

// Declare interfaces for IT demands
export interface ITDemandTimelineEvent {
  id: string;
  date: string;
  status: string;
  message: string;
  user: string;
}

export interface ITDemand {
  id: string; // e.g. "INFRA-1001" or "CH-1001"
  tenantId: string;
  requesterName: string;
  requesterEmail: string;
  department: string;
  title: string;
  problemStatement: string;
  expectedBenefits: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'TRIAGE' | 'ANALYSIS' | 'ROUTED_WORKSPACE' | 'ROUTED_AUTOMATION' | 'ROUTED_PROJECT' | 'REJECTED';
  routedNote?: string;
  createdAt: string;
  updatedAt: string;
  timeline: ITDemandTimelineEvent[];
}

interface ITDemandsTabProps {
  projects: Project[];
  activeTenantId: string;
  currentActiveUser: User | null;
  configAreasAtendidas: string[];
  configPilares: string[];
  activePersona: string;
  onRouteToVMO: (title: string, desc: string, dept: string, urgency: 'LOW' | 'MEDIUM' | 'HIGH') => number;
  onSwitchTab?: (tab: 'backlog' | 'projects' | 'prioritizer' | 'users_admin' | 'config' | 'database' | 'rest_api' | 'components_tree') => void;
}

export default function ITDemandsTab({
  projects,
  activeTenantId,
  currentActiveUser,
  configAreasAtendidas,
  configPilares,
  activePersona,
  onRouteToVMO,
  onSwitchTab
}: ITDemandsTabProps) {
  // Sub-tabs in Demands tab: 'dashboard' | 'open_ticket' | 'queue' | 'requirements'
  const [subTab, setSubTab] = useState<'dashboard' | 'open_ticket' | 'queue' | 'requirements'>('dashboard');

  // View mode for evaluation queue list: 'table' | 'card'
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  // Load and store IT demands integration toggle settings
  const [vmoSyncEnabled, setVmoSyncEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('vmo_it_demands_sync_vmo');
    return saved !== 'false'; // default is true
  });

  useEffect(() => {
    localStorage.setItem('vmo_it_demands_sync_vmo', JSON.stringify(vmoSyncEnabled));
  }, [vmoSyncEnabled]);

  // Load and store IT demands to localstorage to avoid state wipe
  const [demands, setDemands] = useState<ITDemand[]>(() => {
    const saved = localStorage.getItem('vmo_it_demands');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure tenant-isolated structure
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }

    // Default Seed Demands
    const baselineDate = new Date();
    baselineDate.setDate(baselineDate.getDate() - 3);
    const dateStr1 = baselineDate.toISOString();

    const baselineDate2 = new Date();
    baselineDate2.setDate(baselineDate2.getDate() - 1);
    const dateStr2 = baselineDate2.toISOString();

    const defaultDemands: ITDemand[] = [
      {
        id: 'DEM-1001',
        tenantId: 'tenant_techstart',
        requesterName: 'Eduarda Costa',
        requesterEmail: 'eduarda.costa@techstart.io',
        department: 'RH & Operações',
        title: 'Centralização de Feedbacks de Clientes via IA',
        problemStatement: 'Recebemos feedbacks esparsos por e-mail, planilhas e reuniões. Não há um local único e inteligível para entender quais são as dores mais reclamadas nas últimas semanas pelos clientes SaaS.',
        expectedBenefits: 'Consolidação analítica, ganho de tempo de 12 horas semanais da equipe de contas e facilitação de insights de roadmap.',
        urgency: 'MEDIUM',
        status: 'TRIAGE',
        createdAt: dateStr1,
        updatedAt: dateStr1,
        timeline: [
          { id: 't1', date: dateStr1, status: 'Aberto', message: 'Chamado cadastrado na plataforma IT Hub.', user: 'Eduarda Costa' },
          { id: 't2', date: dateStr1, status: 'Em Triagem', message: 'Diretoria de TI iniciou avaliação para designar esteira ideal resolvendo a dor reportada.', user: 'Diretor TI' }
        ]
      },
      {
        id: 'DEM-1002',
        tenantId: 'tenant_techstart',
        requesterName: 'Renato Silvino',
        requesterEmail: 'renato.silvino10@outlook.com',
        department: 'Financeiro & Contábil',
        title: 'Automação de Relatórios de Faturamento de Clientes',
        problemStatement: 'Todo fim de mês demoramos 2 dias digitando manualmente as faturas emitidas para cruzar com o banco. O processo gera erros com frequência e atrasa a apuração fiscal.',
        expectedBenefits: 'Eliminação da redigitação manual, conciliação em segundos e auditoria rápida.',
        urgency: 'HIGH',
        status: 'ROUTED_AUTOMATION',
        routedNote: 'Direcionado para a esteira de Automação Interna. Será construído um painel de faturamento no Power BI conectado à API de cobranças + planilha automatizada via script.',
        createdAt: dateStr2,
        updatedAt: dateStr2,
        timeline: [
          { id: 't3', date: dateStr2, status: 'Aberto', message: 'Demanda de TI criada com nível de Urgência Alto.', user: 'Renato Silvino' },
          { id: 't4', date: dateStr2, status: 'Em Análise', message: 'Análise técnica de escopo realizada pelo time de BI e RPA.', user: 'Time TI' },
          { id: 't5', date: dateStr2, status: 'Encaminhado', message: 'Chamado encaminhado com sucesso para a FILA 2: Automação & Dashboards.', user: 'Diretor TI' }
        ]
      },
      {
        id: 'DEM-1003',
        tenantId: 'tenant_growthcorp',
        requesterName: 'Rodrigo Mendonça',
        requesterEmail: 'rodrigo.m@growthcorp.com.br',
        department: 'Fiscal & Jurídico',
        title: 'Adequação de Portfólio de Contratos à LGPD',
        problemStatement: 'Os novos contratos assinados com fornecedores de tecnologia carecem de auditoria de conformidade, gerando alto risco de passivos jurídicos relacionados à segurança de dados.',
        expectedBenefits: 'Zerar as multas por desconformidade regulatória e padronizar cláusulas contratuais.',
        urgency: 'HIGH',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timeline: [
          { id: 't6', date: new Date().toISOString(), status: 'Aberto', message: 'Criado chamado de alta governança jurídica.', user: 'Rodrigo Mendonça' }
        ]
      },
      {
        id: 'DEM-1004',
        tenantId: 'tenant_techstart',
        requesterName: 'Sérgio Naves',
        requesterEmail: 'sergio.naves@techstart.io',
        department: 'TI & Infraestrutura',
        title: 'Formulários Compartilhados G Suite para Suporte Interno',
        problemStatement: 'A equipe de facilities precisa coletar solicitações de reparo de notebooks de maneira simples e barata, sem complexidade de um sistema externo robusto.',
        expectedBenefits: 'Resolução rápida utilizando o Google Workspace já contratado pela empresa.',
        urgency: 'LOW',
        status: 'ROUTED_WORKSPACE',
        routedNote: 'Configurado um Google Forms com script de notificação automática para TI no Google Workspace.',
        createdAt: dateStr1,
        updatedAt: dateStr1,
        timeline: [
          { id: 't7', date: dateStr1, status: 'Aberto', message: 'Chamado inicial recebido.', user: 'Sérgio Naves' },
          { id: 't8', date: dateStr1, status: 'Resolvido via Workspace', message: 'Encaminhado e implantado na FILA 1: Google Workspace corporativo com sucesso.', user: 'Diretor TI' }
        ]
      }
    ];

    return defaultDemands;
  });

  useEffect(() => {
    localStorage.setItem('vmo_it_demands', JSON.stringify(demands));
  }, [demands]);

  // Form State variables
  const [customRequesterName, setCustomRequesterName] = useState('');
  const [customRequesterEmail, setCustomRequesterEmail] = useState('');
  const [customDept, setCustomDept] = useState('');
  const [demandTitle, setDemandTitle] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [benefitsExpected, setBenefitsExpected] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  
  // Alert/Feedback messages
  const [showFormSuccess, setShowFormSuccess] = useState(false);
  const [lastSubmittedId, setLastSubmittedId] = useState('');

  // Filtering tracking list state
  const [searchEmailFilter, setSearchEmailFilter] = useState('');
  const [selectedUrgencyFilter, setSelectedUrgencyFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // IT evaluation triage action state
  const [selectedDemandToTriage, setSelectedDemandToTriage] = useState<ITDemand | null>(null);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [triageStatusDraft, setTriageStatusDraft] = useState<string>('');

  // Multi-selection states
  const [selectedDemandIds, setSelectedDemandIds] = useState<string[]>([]);

  // Column resizing state
  const [columnWidths, setColumnWidths] = useState({
    select: 40,
    code: 90,
    date: 110,
    title: 290,
    urgency: 110,
    status: 125,
    problem: 320,
    action: 90
  });

  // Triage Select with Auto-Scroll to triage container
  const handleSelectForTriage = (demand: ITDemand) => {
    setSelectedDemandToTriage(demand);
    setTriageStatusDraft(demand.status);
    setFeedbackNote(demand.routedNote || '');
    
    // Smooth scroll down to the triage panel
    setTimeout(() => {
      const el = document.getElementById('it-triage-panel');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Helper for column resizing drag event listeners
  const startResize = (e: React.MouseEvent, column: keyof typeof columnWidths) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columnWidths[column];

    const doDrag = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      setColumnWidths(prev => ({
        ...prev,
        [column]: Math.max(column === 'select' ? 30 : 60, startWidth + deltaX)
      }));
    };

    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  // Bulk update triage for selected demands
  const handleBulkUpdateTriage = (actionType: 'REJECTED' | 'G_WORKSPACE' | 'AUTOMATION' | 'PROJECT') => {
    if (selectedDemandIds.length === 0) {
      alert('Selecione ao menos um chamado para executar a ação em lote.');
      return;
    }

    const confirmAction = window.confirm(
      `Deseja triar ${selectedDemandIds.length} chamado(s) em lote para a esteira correspondente?`
    );
    if (!confirmAction) return;

    const idsToUpdate = [...selectedDemandIds];
    const now = new Date().toISOString();

    setDemands(prev => prev.map(d => {
      if (idsToUpdate.includes(d.id)) {
        let targetStatus: ITDemand['status'] = d.status;
        let logMessage = '';
        let linkId: number | undefined = undefined;

        if (actionType === 'REJECTED') {
          targetStatus = 'REJECTED';
          logMessage = 'Inviabilidade técnica: Solução recusada em lote pela Diretoria de TI.';
        } else if (actionType === 'G_WORKSPACE') {
          targetStatus = 'ROUTED_WORKSPACE';
          logMessage = `Esteira de Solução 1 ativada em lote: Encaminhado para o ecossistema Google Workspace. Tratativa simples, rápida e auto-gerenciada no G Suite corporativo.`;
        } else if (actionType === 'AUTOMATION') {
          targetStatus = 'ROUTED_AUTOMATION';
          logMessage = `Esteira de Solução 2 ativada em lote: Encaminhado para Automações e Relatórios Rápidos (RPA/Power BI/Robots). Demanda sob desenvolvimento ágil descentralizado.`;
        } else if (actionType === 'PROJECT') {
          targetStatus = 'ROUTED_PROJECT';
          if (vmoSyncEnabled) {
            const createdVmoId = onRouteToVMO(
              `[Demanda ${d.id}] ${d.title}`,
              d.problemStatement,
              d.department,
              d.urgency
            );
            linkId = createdVmoId;
            logMessage = `Esteira de Solução 3 de Complexidade Elevada ativada em lote: Direcionado automaticamente para o Backlog do Upstream Maestro como Proposta de Projeto sob o código autonumérico #${linkId}.`;
          } else {
            logMessage = `Esteira de Solução 3 de Complexidade Elevada de TI ativada em lote. [Integração Desligada] Classificado como projeto local de TI sem replicação no cronograma geral do Upstream.`;
          }
        }

        const newTimelineItem: ITDemandTimelineEvent = {
          id: `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          date: now,
          status: targetStatus === 'ROUTED_WORKSPACE' 
            ? 'Workspace' 
            : targetStatus === 'ROUTED_AUTOMATION' 
            ? 'Automação' 
            : targetStatus === 'ROUTED_PROJECT' 
            ? 'Backlog VMO' 
            : targetStatus === 'REJECTED' 
            ? 'Rejeitado' 
            : 'Atualização',
          message: logMessage,
          user: currentActiveUser?.name || 'Diretor TI'
        };

        return {
          ...d,
          status: targetStatus,
          routedNote: actionType === 'G_WORKSPACE' 
            ? 'Resolvido via Google Apps Script ou GSuite Teams (Triagem em Lote).' 
            : actionType === 'AUTOMATION' 
            ? 'Dashboard Power BI ou Script Automação designado (Triagem em Lote).' 
            : actionType === 'PROJECT'
            ? 'Escalado em lote para Gestão de Portfólio Maestro.'
            : 'Escorregado/Inviabilizado após avaliação em lote.',
          updatedAt: now,
          timeline: [...d.timeline, newTimelineItem]
        };
      }
      return d;
    }));

    setSelectedDemandIds([]);
    setSelectedDemandToTriage(null);
  };

  // Is Copied Requirement state
  const [isCopied, setIsCopied] = useState(false);

  // Auto fill form with current active user context if clicked
  const handleAutoFillUser = () => {
    if (currentActiveUser) {
      setCustomRequesterName(currentActiveUser.name);
      setCustomRequesterEmail(currentActiveUser.email);
      setCustomDept(currentActiveUser.tenantId === 'tenant_techstart' ? 'TI & Infraestrutura' : 'Produto & Engenharia');
    }
  };

  // Submit Demand (Chamado) handler
  const handleCreateDemandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demandTitle.trim() || !problemDescription.trim() || !benefitsExpected.trim() || !customRequesterName.trim() || !customRequesterEmail.trim() || !customDept) {
      alert('Por favor, preencha todos os campos obrigatórios da ficha.');
      return;
    }

    const nextIdNum = demands.length > 0 
      ? Math.max(...demands.map(d => parseInt(d.id.replace('DEM-', '')))) + 1 
      : 1005;
    const nextId = `DEM-${nextIdNum}`;

    const newDemand: ITDemand = {
      id: nextId,
      tenantId: activeTenantId,
      requesterName: customRequesterName.trim(),
      requesterEmail: customRequesterEmail.trim().toLowerCase(),
      department: customDept,
      title: demandTitle.trim(),
      problemStatement: problemDescription.trim(),
      expectedBenefits: benefitsExpected.trim(),
      urgency: urgencyLevel,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          id: `t_${Date.now()}_1`,
          date: new Date().toISOString(),
          status: 'Aberto',
          message: 'Demanda de TI cadastrada com absoluto sucesso pelo solicitante.',
          user: customRequesterName.trim()
        }
      ]
    };

    setDemands(prev => [newDemand, ...prev]);
    setLastSubmittedId(nextId);
    setShowFormSuccess(true);

    // Clear operational inputs except identification
    setDemandTitle('');
    setProblemDescription('');
    setBenefitsExpected('');
    
    // Auto timeout success alert
    setTimeout(() => {
      setShowFormSuccess(false);
    }, 10000);
  };

  // Update Status and note in evaluation mode
  const handleUpdateTriage = (demandId: string, actionType: 'STATUS' | 'G_WORKSPACE' | 'AUTOMATION' | 'PROJECT') => {
    const demand = demands.find(d => d.id === demandId);
    if (!demand) return;

    let targetStatus: ITDemand['status'] = demand.status;
    let logMessage = '';
    let linkId: number | undefined = undefined;

    if (actionType === 'STATUS') {
      if (triageStatusDraft === 'TRIAGE') {
        targetStatus = 'TRIAGE';
        logMessage = 'Fração de avaliação classificatória: Chamado movido para Triagem Ativa pela Diretoria de TI.';
      } else if (triageStatusDraft === 'ANALYSIS') {
        targetStatus = 'ANALYSIS';
        logMessage = 'Status atualizado: Sob Análise Técnica detalhada de arquitetura e segurança.';
      } else if (triageStatusDraft === 'REJECTED') {
        targetStatus = 'REJECTED';
        logMessage = `Inviabilidade técnica: Solução recusada pela Diretoria de TI. Motivo: ${feedbackNote || "Escopo incompatível com diretrizes de TI"}.`;
      } else if (triageStatusDraft === 'PENDING') {
        targetStatus = 'PENDING';
        logMessage = 'Controle: Retornado para fila de pendências.';
      }
    } else if (actionType === 'G_WORKSPACE') {
      targetStatus = 'ROUTED_WORKSPACE';
      logMessage = `Esteira de Solução 1 ativada: Encaminhado para o ecossistema Google Workspace. Tratativa simples, rápida e auto-gerenciada no G Suite corporativo.`;
    } else if (actionType === 'AUTOMATION') {
      targetStatus = 'ROUTED_AUTOMATION';
      logMessage = `Esteira de Solução 2 ativada: Encaminhado para Automações e Relatórios Rápidos (RPA/Power BI/Robots). Demanda sob desenvolvimento ágil descentralizado.`;
    } else if (actionType === 'PROJECT') {
      targetStatus = 'ROUTED_PROJECT';
      if (vmoSyncEnabled) {
        // Route automatically into VMO projects lists
        const createdVmoId = onRouteToVMO(
          `[Demanda ${demand.id}] ${demand.title}`,
          demand.problemStatement,
          demand.department,
          demand.urgency
        );
        linkId = createdVmoId;
        logMessage = `Esteira de Solução 3 de Complexidade Elevada ativada: Direcionado automaticamente para o Backlog do Upstream Maestro como Proposta de Projeto sob o código autonumérico do intake #${linkId}.`;
      } else {
        logMessage = `Esteira de Solução 3 de Complexidade Elevada de TI ativada. [Integração Desligada] Como a sincronia automatizada com o Maestro está inativa, este chamado foi classificado como projeto local de TI sem replicação no cronograma geral do Upstream.`;
      }
    }

    const now = new Date().toISOString();
    const newTimelineItem: ITDemandTimelineEvent = {
      id: `t_${Date.now()}`,
      date: now,
      status: targetStatus === 'ROUTED_WORKSPACE' 
        ? 'Workspace' 
        : targetStatus === 'ROUTED_AUTOMATION' 
        ? 'Automação' 
        : targetStatus === 'ROUTED_PROJECT' 
        ? 'Backlog VMO' 
        : targetStatus === 'REJECTED' 
        ? 'Rejeitado' 
        : 'Atualização',
      message: logMessage,
      user: currentActiveUser?.name || 'Diretor TI'
    };

    setDemands(prev => prev.map(d => {
      if (d.id === demandId) {
        return {
          ...d,
          status: targetStatus,
          routedNote: feedbackNote.trim() || d.routedNote || (actionType === 'G_WORKSPACE' ? 'Resolvido via Google Apps Script ou GSuite Teams.' : actionType === 'AUTOMATION' ? 'Dashboard Power BI ou Script Automação designado.' : 'Escalado para Gestão de Portfólio Maestro.'),
          updatedAt: now,
          timeline: [...d.timeline, newTimelineItem]
        };
      }
      return d;
    }));

    // Refresh context modal
    setSelectedDemandToTriage(prev => {
      if (!prev) return null;
      return {
        ...prev,
        status: targetStatus,
        routedNote: feedbackNote.trim() || prev.routedNote,
        updatedAt: now,
        timeline: [...prev.timeline, newTimelineItem]
      };
    });

    setFeedbackNote('');
    alert('Tratativa gravada com absoluto sucesso e comunicada à linha do tempo do usuário!');
  };

  // Is IT team ? We allow portfolio manager, tenant admin, super admin to act as IT triage owners.
  // We can also let the user toggle the administrative view via toggle for testing purposes easily
  const [forceITStaffMode, setForceITStaffMode] = useState(true);

  const isITManager = activePersona === 'SUPER_ADMIN' || activePersona === 'TENANT_ADMIN' || activePersona === 'PORTFOLIO_MANAGER' || forceITStaffMode;

  // Filter demands based on activeTenant
  const tenantDemands = demands.filter(d => d.tenantId === activeTenantId);

  // Apply search/filter inputs
  const filteredDemands = tenantDemands.filter(d => {
    const matchesEmail = searchEmailFilter 
      ? d.requesterEmail.toLowerCase().includes(searchEmailFilter.toLowerCase()) || d.requesterName.toLowerCase().includes(searchEmailFilter.toLowerCase())
      : true;
    const matchesUrgency = selectedUrgencyFilter !== 'ALL' ? d.urgency === selectedUrgencyFilter : true;
    const matchesStatus = selectedStatusFilter !== 'ALL' ? d.status === selectedStatusFilter : true;
    return matchesEmail && matchesUrgency && matchesStatus;
  });

  // Calculate dynamic dashboard indicators
  const totalTickets = tenantDemands.length;
  const pendingTriage = tenantDemands.filter(d => d.status === 'PENDING' || d.status === 'TRIAGE' || d.status === 'ANALYSIS').length;
  const workspaceTotal = tenantDemands.filter(d => d.status === 'ROUTED_WORKSPACE').length;
  const automationTotal = tenantDemands.filter(d => d.status === 'ROUTED_AUTOMATION').length;
  const projectTotal = tenantDemands.filter(d => d.status === 'ROUTED_PROJECT').length;
  const rejectedTotal = tenantDemands.filter(d => d.status === 'REJECTED').length;

  // Department counts
  const deptsCounts: Record<string, number> = {};
  tenantDemands.forEach(d => {
    deptsCounts[d.department] = (deptsCounts[d.department] || 0) + 1;
  });

  // Copy Markdown specifications
  const copyMarkdownToClipboard = () => {
    const markdownContent = `
# CADERNO DE REQUISITOS TÉCNICOS & DE NEGÓCIO
## Sistema Unificado de Fluxos e Esteiras de Solução - Central de Demandas de TI

**Autor:** Diretoria de TI & Governança de Portfólios
**Integração:** Backlog do Upstream Maestro
**Data de Emissão:** 14 de Junho de 2026

---

### 1. VISÃO GERAL & OBJETIVOS
Este caderno formaliza as especificações para o módulo de cadastro, triagem externa e redirecionamento automatizado de demandas de TI enviadas por colaboradores. Ele estabelece uma separação entre dores de produtividade operacional do cotidiano e projetos estruturados de alto impacto.

### 2. ARQUITETURA DE REDIRECIONAMENTO (AS 3 FILAS)
Toda demanda passa por avaliação da equipe d` + `ona da aplicação, sendo obrigatoriamente filtrada em três correntes (esteiras):
1. **Google Workspace**: Demandas de baixa complexidade, solucionadas nativamente através de aplicativos integrados (Google Forms, Google Sheets, Gmail Scripts, Meet ou Drive).
2. **Automação & BI**: Desenvolvimento ágil focado em relatórios dinâmicos, macros, Analytics, painéis de BI e robôs de RPA (Python/Power Automate) que resolvem gargalos de processos curtos.
3. **Projetos (Maestro)**: Quando ultrapassa as correntes anteriores. Direciona imediatamente para o Backlog do Upstream do Maestro com status INTAKE e o demandId gerado.

---

### 3. DICIONÁRIO DE DADOS (FICHA DE DEMANDA)
*   **ID do Chamado (demandId)**: String alfanumérica única (ex: DEM-1001), indexável e persistida.
*   **Nome do Solicitante**: Texto livre obrigatório, identificador corporativo.
*   **E-mail Corporativo**: Padrão de e-mail institucional válido.
*   **Departamento**: Seletor baseado nas áreas ativas no Tenant de Administração.
*   **Título da Solicitação**: Resumo sintético da demanda (até 80 caracteres).
*   **Problema a Resolver**: Resposta discursiva de dor real do negócio. Evita "pedidos de soluções prontas".
*   **Benefícios Esperados**: Resultados quantitativos e operacionais previstos.
*   **Grau de Urgência**: [Baixa | Média | Alta].
*   **Área Impactada**: Área de negócio primária beneficiada.

---

### 4. REQUISITOS DE TRANSPARÊNCIA (COMUNICAÇÃO MULTICHANNEL)
Qualquer alteração na ficha de triagem dispara logs ordenados de timeline visível pelo solicitante, simulando notificações via e-mail corporativo ou chat.

### 5. CONTROLE DINÂMICO E REVERSÍVEL DA INTEGRAÇÃO
A esteira de projetos dispõe de um parâmetro de acoplamento flexível. O gestor pode ligar/desligar a sincronia em tempo real com o Maestro de forma reversível por meio de um controle dedicado. Quando desativado, o encaminhamento da Fila 3 preserva os chamados de forma estritamente local dentro do módulo de TI, sem inserção no backlog unificado do Maestro.
`;
    
    navigator.clipboard.writeText(markdownContent).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER CONTROLS AND TITLE */}
      <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-600/10 rounded-xl text-indigo-400">
              <Inbox className="w-5 h-5" />
            </span>
            <div className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold">Módulo IT Director</div>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
            Central de Demandas &amp; Esteiras de TI
          </h2>
          <p className="text-[11px] md:text-xs text-slate-400 max-w-2xl">
            Centro unificado de admissão onde solicitantes elucidam suas dores reais e o time de TI direciona os chamados para canais de <strong className="text-emerald-400">Workspace</strong>, <strong className="text-blue-400">Automação</strong> ou <strong className="text-indigo-400">Iniciativas de Projetos</strong>.
          </p>
        </div>

        {/* DEMO TOOL: INTERACTIVE ADMINISTRATIVE SIMULATION TOGGLE */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto shrink-0 bg-slate-950/60 p-2.5 rounded-2xl border border-slate-850">
          <div className="text-center sm:text-left pr-2 border-r border-slate-800 hidden sm:block">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">Visão de Teste</span>
            <span className="text-[11px] text-slate-300 font-semibold">Simular Diretor TI</span>
          </div>
          <button
            onClick={() => setForceITStaffMode(!forceITStaffMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              forceITStaffMode 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                : 'bg-indigo-600/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-650/15'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            {forceITStaffMode ? "Modo TI: Ativo (Ver Tudo)" : "Modo TI: Inativo (Ver apenas as minhas)"}
          </button>
        </div>
      </div>

      {/* PAINEL DE CONTROLE: INTEGRAÇÕES, GERENCIAMENTO E ACESSO DIRETO */}
      <div className="bg-slate-900 rounded-3xl p-5 border border-slate-850 grid grid-cols-1 md:grid-cols-3 gap-5 items-center shadow-lg relative overflow-hidden">
        
        {/* Ação 1: Botão Abrir Demanda */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold block">Iniciar Fluxo</span>
          <button
            onClick={() => {
              setSubTab('open_ticket');
              alert('Ficha de Nova Solicitação de TI aberta com sucesso! Preencha as informações da sua dor operacional abaixo.');
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-4 rounded-xl text-xs font-black transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/30 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-100" />
            Abrir Demanda de TI
          </button>
        </div>

        {/* Ação 2: Acesso Direto Maestro */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold block">Acesso Imediato</span>
          <button
            onClick={() => {
              if (onSwitchTab) {
                onSwitchTab('projects');
              } else {
                alert('Erro de Contexto: Callback onSwitchTab indisponível.');
              }
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-4 rounded-xl text-xs font-black transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/30 cursor-pointer border border-indigo-550/30"
          >
            <Briefcase className="w-4 h-4 text-indigo-200" />
            Acessar Maestro (Projetos)
          </button>
        </div>

        {/* Ação 3: Toggle de Integração com o Maestro */}
        <div className="space-y-1.5 bg-slate-950/30 p-3 rounded-2xl border border-slate-850">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold block">Acoplamento</span>
              <label className="text-xs font-extrabold text-slate-350 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${vmoSyncEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                Integração Maestro (Fila 3)
              </label>
            </div>
            
            {/* Custom Interactive Toggle Switch */}
            <button
              onClick={() => {
                setVmoSyncEnabled(!vmoSyncEnabled);
              }}
              className={`w-12 h-6 flex items-center rounded-full p-0.5 transition-all outline-none cursor-pointer ${
                vmoSyncEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <span className="bg-white w-5 h-5 rounded-full shadow-md transform transition-all" />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight font-sans">
            {vmoSyncEnabled 
              ? "Ativo: Demandas triadas como 'Solução de Projeto' geram automático registros estruturados no Backlog do Upstream." 
              : "Inativo: Chamados de projeto ficam retidos localmente como iniciativas independentes de TI."
            }
          </p>
        </div>

      </div>

      {/* INTERNAL SUB-NAVIGATION CHIPS */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 p-1.5 bg-slate-950/40 rounded-2xl border border-slate-850/60">
        <button
          onClick={() => setSubTab('dashboard')}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            subTab === 'dashboard'
              ? 'bg-indigo-600/15 border border-indigo-505/20 text-indigo-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-850/40 border border-transparent'
          }`}
        >
          <BarChart4 className="w-4 h-4" />
          Dashboard de TI
        </button>
        
        <button
          onClick={() => setSubTab('open_ticket')}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            subTab === 'open_ticket'
              ? 'bg-indigo-600/15 border border-indigo-505/20 text-indigo-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-850/40 border border-transparent'
          }`}
        >
          <Send className="w-4 h-4" />
          Ficha de Nova Solicitação
        </button>

        <button
          onClick={() => setSubTab('queue')}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer relative shrink-0 whitespace-nowrap ${
            subTab === 'queue'
              ? 'bg-indigo-600/15 border border-indigo-505/20 text-indigo-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-850/40 border border-transparent'
          }`}
        >
          <Layers className="w-4 h-4" />
          Fila de Avaliação / Triagem
          {pendingTriage > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-500 text-[9px] font-bold text-white shadow-md">
              {pendingTriage}
            </span>
          )}
        </button>

        <button
          onClick={() => setSubTab('requirements')}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            subTab === 'requirements'
              ? 'bg-indigo-600/15 border border-indigo-505/20 text-indigo-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-850/40 border border-transparent'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Caderno de Requisitos
        </button>
      </div>

      {showFormSuccess && (
        <div className="bg-emerald-950/40 border border-emerald-500/20 p-4 rounded-2xl flex items-start gap-3 animate-fade-in text-xs text-emerald-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-slate-100">Chamado Aberto com Sucesso! Cod do Ticket: <span className="font-mono text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded">{lastSubmittedId}</span></h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Sua demanda foi direcionada para a **Fila de Avaliação da Diretoria de TI**. Como solicitante, você já pode pesquisar pelo seu e-mail na área inferior do Dashboard para acompanhar todos os checkpoints da linha do tempo e ler o andamento em tempo real.
            </p>
          </div>
        </div>
      )}

      {/* RENDER VIEW 1: DASHBOARD */}
      {subTab === 'dashboard' && (
        <div className="space-y-6">
          
          {/* KPI CARDS GRID */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">Total Recebidos</span>
              <div className="text-2xl font-black text-slate-100">{totalTickets}</div>
              <p className="text-[10px] text-slate-500 font-mono">Chamados abertos</p>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-805 space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-yellow-500/70 block flex items-center gap-1">
                <Clock className="w-3 h-3" /> Em Avaliação
              </span>
              <div className="text-2xl font-black text-slate-100">{pendingTriage}</div>
              <p className="text-[10px] text-slate-500 font-mono">Aguardando esteira</p>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 block flex items-center gap-1">
                <Globe className="w-3 h-3" /> Workspace
              </span>
              <div className="text-2xl font-black text-emerald-400">{workspaceTotal}</div>
              <p className="text-[10px] text-emerald-600/80 font-mono">Resolvidos na Fila 1</p>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-blue-400 block flex items-center gap-1">
                <Bot className="w-3 h-3" /> Automação &amp; BI
              </span>
              <div className="text-2xl font-black text-blue-400">{automationTotal}</div>
              <p className="text-[10px] text-blue-500/80 font-mono">Construídos na Fila 2</p>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-805 space-y-1 col-span-2 lg:col-span-1">
              <span className="text-[10px] font-mono uppercase font-bold text-indigo-400 block flex items-center gap-1">
                <Briefcase className="w-3 h-3" /> VMO Projetos
              </span>
              <div className="text-2xl font-black text-indigo-400">{projectTotal}</div>
              <p className="text-[10px] text-indigo-500/80 font-mono">Escalados para Fila 3</p>
            </div>
          </div>

          {/* METRIC GRAPHICS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* COMPREHENSIVE HIGH-FIDELITY CUSTOM SVG STREAM CHART */}
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-4">
              <div>
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-indigo-400">Distribuição de Esteiras de Solução</h3>
                <p className="text-[11px] text-slate-400">Carga de encaminhamento real após avaliação da TI corporativa</p>
              </div>

              {/* BAR CHART RENDERING */}
              <div className="space-y-4 pt-2">
                
                {/* 1. Workspace stream */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-emerald-400 rounded-sm"></span>
                      1. Google Workspace (Produtividade Rápida)
                    </span>
                    <span className="text-emerald-400 font-black">{workspaceTotal} chamados ({totalTickets > 0 ? Math.round((workspaceTotal/totalTickets)*100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden border border-slate-850">
                    <div 
                      className="bg-emerald-400 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${totalTickets > 0 ? (workspaceTotal/totalTickets)*100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* 2. Automation stream */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-blue-400 rounded-sm"></span>
                      2. Automação &amp; Dashboards (Power BI, RPA)
                    </span>
                    <span className="text-blue-400 font-black">{automationTotal} automações ({totalTickets > 0 ? Math.round((automationTotal/totalTickets)*100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden border border-slate-850">
                    <div 
                      className="bg-blue-400 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${totalTickets > 0 ? (automationTotal/totalTickets)*100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* 3. Backlog Upstream Maestro project stream */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-indigo-500 rounded-sm"></span>
                      3. Projetos VMO (Desafios Complexos de TI)
                    </span>
                    <span className="text-indigo-400 font-black">{projectTotal} projetos escalados ({totalTickets > 0 ? Math.round((projectTotal/totalTickets)*100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden border border-slate-850">
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${totalTickets > 0 ? (projectTotal/totalTickets)*100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* 4. Pending / Triage */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="font-bold text-slate-400 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-yellow-500 rounded-sm"></span>
                      Aguardando Triagem (Fila TI)
                    </span>
                    <span className="text-yellow-500 font-black">{pendingTriage} chamados ({totalTickets > 0 ? Math.round((pendingTriage/totalTickets)*100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden border border-slate-850">
                    <div 
                      className="bg-yellow-500 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${totalTickets > 0 ? (pendingTriage/totalTickets)*100 : 0}%` }}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* TICKETS BY DEPARTMENT / URGENCY COMPONENT */}
            <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-indigo-400">Demandas por Departamento Requisitante</h3>
                <p className="text-[11px] text-slate-400">Consolidado das áreas para apoiar alocação na diretoria de TI</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                {Object.keys(deptsCounts).length === 0 ? (
                  <p className="col-span-2 text-slate-500 text-xs font-mono text-center">Nenhum chamado registrado para estatísticas.</p>
                ) : (
                  Object.entries(deptsCounts).map(([dept, count]) => (
                    <div key={dept} className="bg-slate-950/55 p-3 rounded-xl border border-slate-850/60 flex items-start justify-between gap-1">
                      <span className="text-[11px] font-semibold text-slate-300 truncate pr-1 max-w-[80%]">{dept}</span>
                      <span className="px-2 py-0.5 bg-indigo-600/10 text-indigo-300 rounded font-mono text-[10px] font-bold shrink-0">{count} ch.</span>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-slate-500">Índice Geral de Criticidade (Urgência)</span>
                <div className="flex gap-1.5 text-[9px] font-mono font-bold">
                  <span className="px-2 py-0.5 bg-red-900/20 text-red-400 border border-red-900/30 rounded">Alta: {tenantDemands.filter(d => d.urgency === 'HIGH').length}</span>
                  <span className="px-2 py-0.5 bg-yellow-900/20 text-yellow-400 border border-yellow-905/30 rounded">Média: {tenantDemands.filter(d => d.urgency === 'MEDIUM').length}</span>
                  <span className="px-2 py-0.5 bg-slate-900/80 text-slate-400 rounded">Baixa: {tenantDemands.filter(d => d.urgency === 'LOW').length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* PERSONAL STATUS MONITORING SEARCH - "TRACK MY PROBLEMS" */}
          <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-4">
            <div className="border-b border-slate-850 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> Fique por Dentro: Linha do Tempo e Comunicação de Chamados
                </h3>
                <p className="text-[11px] text-slate-400">Insira seu e-mail corporativo ou nome para rastrear o andamento de suas solicitações</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Pesquisar por email/solicitante..."
                  value={searchEmailFilter}
                  onChange={(e) => setSearchEmailFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 pl-9 pr-3 py-1.5 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* RESULT SHIELD LISTING VERTICAL PROCESSES TIMELINE */}
            {searchEmailFilter ? (
              <div className="space-y-4">
                {filteredDemands.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950/30 rounded-2xl border border-dashed border-slate-800">
                    <p className="text-xs text-slate-500 font-mono">Nenhum chamado em aberto localizado para o termo "{searchEmailFilter}".</p>
                  </div>
                ) : (
                  filteredDemands.map(demand => {
                    const latestLog = demand.timeline[demand.timeline.length - 1];
                    return (
                      <div key={demand.id} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 space-y-3">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 rounded">
                                {demand.id}
                              </span>
                              <h4 className="text-xs font-bold text-indigo-350">{demand.title}</h4>
                            </div>
                            <p className="text-[10px] text-slate-500 font-mono">
                              Solicitado por <strong className="text-slate-400">{demand.requesterName}</strong> ({demand.requesterEmail}) - {demand.department}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                              demand.urgency === 'HIGH' 
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                                : demand.urgency === 'MEDIUM' 
                                ? 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20' 
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              Criticidade: {demand.urgency === 'HIGH' ? 'Alta' : demand.urgency === 'MEDIUM' ? 'Média' : 'Baixa'}
                            </span>

                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                              demand.status === 'ROUTED_WORKSPACE' 
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                                : demand.status === 'ROUTED_AUTOMATION' 
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' 
                                : demand.status === 'ROUTED_PROJECT' 
                                ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30' 
                                : demand.status === 'REJECTED' 
                                ? 'bg-red-500/10 text-red-400 border border-red-500/10'
                                : 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20'
                            }`}>
                              Status: {
                                demand.status === 'PENDING' ? 'Novo' :
                                demand.status === 'TRIAGE' ? 'Triação Ativa' :
                                demand.status === 'ANALYSIS' ? 'Sob Análise' :
                                demand.status === 'ROUTED_WORKSPACE' ? 'Fila 1: Workspace GSuite' :
                                demand.status === 'ROUTED_AUTOMATION' ? 'Fila 2: Automação / BI' :
                                demand.status === 'ROUTED_PROJECT' ? 'Fila 3: Projetos Maestro' : 'Inviabilizado'
                              }
                            </span>
                          </div>
                        </div>

                        {/* PROBLEM / PROBLEM SOLVING SECTION */}
                        <div className="text-xs bg-slate-900/60 p-3 rounded-xl space-y-1.5 text-slate-350">
                          <p className="text-[11px] leading-relaxed">
                            <strong className="text-indigo-400 font-mono text-[9px] block uppercase">Problema Reportado</strong>
                            {demand.problemStatement}
                          </p>
                          <p className="text-[11px] leading-relaxed">
                            <strong className="text-emerald-400 font-mono text-[9px] block uppercase">Benefícios Desejados</strong>
                            {demand.expectedBenefits}
                          </p>
                          {demand.routedNote && (
                            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                              <strong className="text-indigo-300 font-mono text-[9px] block uppercase">Despacho da TI para esteira</strong>
                              💡 {demand.routedNote}
                            </div>
                          )}
                        </div>

                        {/* PROCESS LIVE TIMELINE FLUID MAP */}
                        <div className="space-y-2 pt-2">
                          <span className="text-[9px] uppercase tracking-widest font-mono text-slate-500 font-bold block">Histórico de Notificações Unificadas</span>
                          <div className="relative pl-4 space-y-3 border-l border-slate-800">
                            {demand.timeline.map((node) => (
                              <div key={node.id} className="relative text-[11px]">
                                <span className="absolute -left-[20.5px] top-1 h-2 w-2 rounded-full bg-indigo-500 border-2 border-slate-950" />
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                                  <span className="text-slate-300 font-bold">{node.message}</span>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    {new Date(node.date).toLocaleString('pt-BR')} por <strong className="text-slate-400">{node.user}</strong>
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-950/20 rounded-2xl border border-slate-850 space-y-2">
                <p className="text-xs text-slate-400 font-mono">🔍 Nenhuma pesquisa de e-mail ativa.</p>
                <p className="text-[11px] text-slate-550 leading-relaxed max-w-md mx-auto">
                  Digite seu e-mail corporativo ou nome ou clique nas sugestões abaixo para simular as notificações e a linha do tempo enviadas aos usuários durante as triagens da TI.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <span className="text-[10px] font-mono text-slate-500">Sugestões:</span>
                  <button onClick={() => setSearchEmailFilter('eduarda')} className="p-1 px-2.5 bg-slate-900 hover:bg-slate-800 rounded font-mono text-[10px] text-slate-300 cursor-pointer">eduarda.costa@techstart.io</button>
                  <button onClick={() => setSearchEmailFilter('renato')} className="p-1 px-2.5 bg-slate-900 hover:bg-slate-800 rounded font-mono text-[10px] text-slate-300 cursor-pointer">renato.silvino10@outlook.com</button>
                  <button onClick={() => setSearchEmailFilter('sergio')} className="p-1 px-2.5 bg-slate-900 hover:bg-slate-800 rounded font-mono text-[10px] text-slate-300 cursor-pointer text-xs">sergio.naves@techstart.io</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RENDER VIEW 2: TICKET OPEN FORM */}
      {subTab === 'open_ticket' && (
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6">
          <div>
            <h3 className="text-sm font-extrabold uppercase font-mono text-indigo-400">Abertura de Chamado de TI (Ficha de Demanda)</h3>
            <p className="text-xs text-slate-400">Toda demanda corporativa deve ser registrada com clareza na formulação do problema técnico ou operacional, permitindo à diretoria direcionar à melhor esteira de sustentação.</p>
          </div>

          <form onSubmit={handleCreateDemandSubmit} className="space-y-4">
            
            {/* SOLICITANTE IDENTIFICATION BLOCK */}
            <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-855 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">1. Identificação do Solicitante</span>
                
                <button
                  type="button"
                  onClick={handleAutoFillUser}
                  className="p-1 px-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 text-[10px] font-bold font-mono rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <UserCheck className="w-3 h-3 text-indigo-400" />
                  Puxar meus dados logados ({currentActiveUser?.name || "Nenhum"})
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold block">Nome Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Paula Costa"
                    value={customRequesterName}
                    onChange={(e) => setCustomRequesterName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold block">E-mail Corporativo</label>
                  <input
                    type="email"
                    required
                    placeholder="Ex: paula.costa@empresa.com"
                    value={customRequesterEmail}
                    onChange={(e) => setCustomRequesterEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold block">Área Solicitante (Departamento)</label>
                  <select
                    required
                    value={customDept}
                    onChange={(e) => setCustomDept(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">Selecione...</option>
                    {configAreasAtendidas.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                    <option value="RH & Operações">RH & Operações</option>
                    <option value="Financeiro & Contábil">Financeiro & Contábil</option>
                    <option value="Fiscal & Jurídico">Fiscal & Jurídico</option>
                  </select>
                </div>
              </div>
            </div>

            {/* FORM SPECIFIC CORPO */}
            <div className="bg-slate-950/20 p-4 rounded-2xl border border-slate-850 space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block">2. Detalhamento Técnico e de Alvo</span>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold block">Título Resumido da Solicitação</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Desenvolvimento de RPA para extração automática de notas PDF da prefeitura"
                  value={demandTitle}
                  onChange={(e) => setDemandTitle(e.target.value)}
                  maxLength={80}
                  className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold block">
                    QUAL O PROBLEMA REAL VOCÊ PRECISA RESOLVER? (DOR DO NEGÓCIO)
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Evite descrever a solução que você acha ideal. Descreva o problema cotidiano: O que atualmente gera perdas de tempo, retrabalho, lentidão ou falha de sistema?"
                    value={problemDescription}
                    onChange={(e) => setProblemDescription(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-505 resize-none leading-relaxed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold block">
                    QUAIS OS BENEFÍCIOS QUANTITATIVOS OU ESPERADOS DA RESOLUÇÃO?
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Ex: Redução de 4 horas extras diárias digitando XML; Aumento na precisão do relatório financeiro consolidado; Agilidade de faturamento ao cliente de 5 dias para instantes."
                    value={benefitsExpected}
                    onChange={(e) => setBenefitsExpected(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-505 resize-none leading-relaxed"
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold block">Grau de Urgência (Severidade Operacional)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 'LOW', label: '① Baixa', desc: 'Processo funciona com atrasos mínimos', color: 'hover:border-slate-500' },
                      { val: 'MEDIUM', label: '② Média', desc: 'Gera retrabalho ou sobrecarga da equipe', color: 'hover:border-yellow-500' },
                      { val: 'HIGH', label: '③ Alta (Crítica)', desc: 'Processo paralisado ou risco legal eminente', color: 'hover:border-red-500' },
                    ].map(item => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setUrgencyLevel(item.val as any)}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                          urgencyLevel === item.val
                            ? item.val === 'HIGH'
                              ? 'bg-red-500/10 border-red-500 text-red-400'
                              : item.val === 'MEDIUM'
                              ? 'bg-yellow-500/10 border-yellow-550 text-yellow-300'
                              : 'bg-indigo-600/10 border-indigo-500 text-indigo-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
                        }`}
                        title={item.desc}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold block">Avisos de Escopo de TI</label>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-[10.5px] text-slate-400 leading-relaxed space-y-1">
                    <p>• Suas informações serão avaliadas sob governança direta de TI.</p>
                    <p>• Caso aprovado como <strong className="text-indigo-400">Módulo VMO (Projetos)</strong>, o orçamento e roadmaps serão geridos de forma automatizada no painel.</p>
                  </div>
                </div>

              </div>

            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="w-full sm:w-auto p-3 px-8 bg-gradient-to-r from-indigo-650 to-indigo-555 hover:from-indigo-600 hover:to-indigo-500 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg transition-all"
              >
                <Plus className="w-5 h-5 text-emerald-300" />
                Registrar na Fila e Comunicar Solicitante
              </button>
            </div>

          </form>
        </div>
      )}

      {/* RENDER VIEW 3: IT EVALUATION QUEUE (ADMIN TRIAGE) */}
      {subTab === 'queue' && (
        <div className="space-y-6">
          
          {/* SEARCH FILTERS HEADER BAR */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-3">
            <div className="flex flex-wrap items-center gap-2">
              
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Pesquisar por solicitante/título..."
                  value={searchEmailFilter}
                  onChange={(e) => setSearchEmailFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 pl-9 pr-3 py-1.5 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={selectedUrgencyFilter}
                onChange={(e) => setSelectedUrgencyFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 p-1.5 rounded-xl text-xs text-slate-300 focus:outline-none cursor-pointer text-xs"
              >
                <option value="ALL">Todas Urgências</option>
                <option value="HIGH">Alta Criticidade</option>
                <option value="MEDIUM">Média Criticidade</option>
                <option value="LOW">Baixa Criticidade</option>
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 p-1.5 rounded-xl text-xs text-slate-300 focus:outline-none cursor-pointer text-xs"
              >
                <option value="ALL">Todos Status</option>
                <option value="PENDING">Novos Pendentes</option>
                <option value="TRIAGE">Em Triage</option>
                <option value="ANALYSIS">Sob Análise</option>
                <option value="ROUTED_WORKSPACE">Fila 1: G-Workspace</option>
                <option value="ROUTED_AUTOMATION">Fila 2: Automação</option>
                <option value="ROUTED_PROJECT">Fila 3: Projetos (VMO)</option>
                <option value="REJECTED">Inviabilizados</option>
              </select>

            </div>

            <div className="flex flex-wrap items-center gap-3.5 justify-between xl:justify-end">
              <div className="text-[10px] font-mono text-slate-500 text-right shrink-0">
                Mostrando <strong className="text-slate-300">{filteredDemands.length}</strong> de <strong className="text-slate-300">{tenantDemands.length}</strong> chamados
              </div>
              
              {/* Seletor do Modo de Visualização */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  title="Visualização em Tabela (Default)"
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'table'
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Tabela</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('card')}
                  title="Visualização em Cards"
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'card'
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Cards</span>
                </button>
              </div>
            </div>
          </div>

          {/* BULK ACTIONS FLOATING CONTROL PANEL */}
          {selectedDemandIds.length > 0 && (
            <div className="bg-slate-900 border-2 border-indigo-505/30 p-4 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 animate-fade-in shadow-2xl shadow-indigo-950/20 mb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-505"></span>
                </span>
                <span className="text-xs font-mono text-slate-200">
                  <strong className="text-indigo-400 font-extrabold text-sm">{selectedDemandIds.length}</strong> chamado(s) focado(s) para Triagem Híbrida:
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 justify-end">
                <button
                  type="button"
                  onClick={() => handleBulkUpdateTriage('G_WORKSPACE')}
                  className="bg-emerald-600/90 hover:bg-emerald-500 text-white font-extrabold text-[10px] uppercase font-mono tracking-wider py-2 px-3.5 rounded-xl cursor-pointer shadow border border-emerald-555/20 transition-all flex items-center gap-1"
                >
                  Fila 1: G-Suite
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkUpdateTriage('AUTOMATION')}
                  className="bg-blue-600/90 hover:bg-blue-500 text-white font-extrabold text-[10px] uppercase font-mono tracking-wider py-2 px-3.5 rounded-xl cursor-pointer shadow border border-blue-555/20 transition-all flex items-center gap-1"
                >
                  Fila 2: Automação
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkUpdateTriage('PROJECT')}
                  className="bg-indigo-600/90 hover:bg-indigo-550 text-white font-extrabold text-[10px] uppercase font-mono tracking-wider py-2 px-3.5 rounded-xl cursor-pointer shadow border border-indigo-555/20 transition-all flex items-center gap-1"
                >
                  Fila 3: Maestro
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkUpdateTriage('REJECTED')}
                  className="bg-red-600/80 hover:bg-red-500 text-white font-extrabold text-[10px] uppercase font-mono tracking-wider py-2 px-3.5 rounded-xl cursor-pointer shadow border border-red-500/20 transition-all flex items-center gap-1"
                >
                  Inviabilizar
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDemandIds([])}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-350 font-bold text-[10px] py-2 px-3.5 rounded-xl cursor-pointer transition-all border border-slate-700"
                >
                  Desmarcar
                </button>
              </div>
            </div>
          )}

          {/* TRIAGE BOARD LAYOUT: ACTIVE LIST TABLE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT: DEMANDS QUEUE LIST */}
            <div className="lg:col-span-12 space-y-3">
              {filteredDemands.length === 0 ? (
                <div className="p-12 text-center bg-slate-900 rounded-3xl border border-slate-800">
                  <Inbox className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-xs text-slate-400 font-mono">Nenhuma solicitação encontrada na lista aplicando os filtros selecionados.</p>
                </div>
              ) : viewMode === 'table' ? (
                <div className="overflow-x-auto bg-slate-950/40 rounded-3xl border border-slate-800/80 shadow-md">
                  <table className="w-full text-left border-collapse text-xs table-fixed">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-405 font-mono text-[9px] uppercase font-bold tracking-wider select-none">
                        
                        {/* Column Checkbox selector */}
                        <th className="p-4 relative text-center" style={{ width: `${columnWidths.select}px` }}>
                          <input 
                            type="checkbox"
                            checked={filteredDemands.length > 0 && selectedDemandIds.length === filteredDemands.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDemandIds(filteredDemands.map(d => d.id));
                              } else {
                                setSelectedDemandIds([]);
                              }
                            }}
                            className="rounded bg-slate-950 border-slate-800 text-indigo-650 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5"
                          />
                          <div 
                            onMouseDown={(e) => startResize(e, 'select')} 
                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors z-20"
                            title="Arraste para redimensionar"
                          />
                        </th>

                        <th className="p-4 relative" style={{ width: `${columnWidths.code}px` }}>
                          <span className="text-slate-400">Código</span>
                          <div 
                            onMouseDown={(e) => startResize(e, 'code')} 
                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors z-20"
                            title="Arraste para redimensionar"
                          />
                        </th>

                        <th className="p-4 relative" style={{ width: `${columnWidths.date}px` }}>
                          <span className="text-slate-400">Criação</span>
                          <div 
                            onMouseDown={(e) => startResize(e, 'date')} 
                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors z-20"
                            title="Arraste para redimensionar"
                          />
                        </th>

                        <th className="p-4 relative" style={{ width: `${columnWidths.title}px` }}>
                          <span className="text-slate-400">Título &amp; Solicitante</span>
                          <div 
                            onMouseDown={(e) => startResize(e, 'title')} 
                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors z-20"
                            title="Arraste para redimensionar"
                          />
                        </th>

                        <th className="p-4 relative" style={{ width: `${columnWidths.urgency}px` }}>
                          <span className="text-slate-400">Criticidade</span>
                          <div 
                            onMouseDown={(e) => startResize(e, 'urgency')} 
                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors z-20"
                            title="Arraste para redimensionar"
                          />
                        </th>

                        <th className="p-4 relative" style={{ width: `${columnWidths.status}px` }}>
                          <span className="text-slate-400">Status</span>
                          <div 
                            onMouseDown={(e) => startResize(e, 'status')} 
                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors z-20"
                            title="Arraste para redimensionar"
                          />
                        </th>

                        <th className="p-4 relative" style={{ width: `${columnWidths.problem}px` }}>
                          <span className="text-slate-400">Problema Técnico</span>
                          <div 
                            onMouseDown={(e) => startResize(e, 'problem')} 
                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors z-20"
                            title="Arraste para redimensionar"
                          />
                        </th>

                        <th className="p-4 text-right relative" style={{ width: `${columnWidths.action}px` }}>
                          <span className="text-slate-400">Ação</span>
                          <div 
                            onMouseDown={(e) => startResize(e, 'action')} 
                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors z-20"
                            title="Arraste para redimensionar"
                          />
                        </th>

                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/40 opacity-90">
                      {filteredDemands.map(demand => {
                        const isSelected = selectedDemandToTriage?.id === demand.id;
                        const isRowChecked = selectedDemandIds.includes(demand.id);
                        return (
                          <tr
                            key={demand.id}
                            onClick={() => {
                              handleSelectForTriage(demand);
                            }}
                            className={`hover:bg-slate-900/55 transition-colors cursor-pointer ${
                              isSelected ? 'bg-indigo-650/10 hover:bg-indigo-650/15' : ''
                            } ${isRowChecked ? 'bg-indigo-950/20' : ''}`}
                          >
                            
                            {/* Checkbox selector td */}
                            <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                              <input 
                                type="checkbox"
                                checked={isRowChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedDemandIds(prev => [...prev, demand.id]);
                                  } else {
                                    setSelectedDemandIds(prev => prev.filter(id => id !== demand.id));
                                  }
                                }}
                                className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5"
                              />
                            </td>

                            <td className="p-4 font-mono font-bold text-indigo-350 truncate">
                              {demand.id}
                            </td>
                            <td className="p-4 text-slate-500 font-mono text-[10.5px] truncate">
                              {new Date(demand.createdAt).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="p-4 overflow-hidden">
                              <div className="space-y-0.5 truncate">
                                <div className="font-bold text-slate-100 truncate">{demand.title}</div>
                                <div className="text-[10px] text-slate-450 leading-tight truncate">
                                  {demand.requesterName} • <span className="font-mono text-[9.5px] text-indigo-400">{demand.department}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 truncate">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold inline-block ${
                                demand.urgency === 'HIGH'
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : demand.urgency === 'MEDIUM'
                                  ? 'bg-yellow-505/10 text-yellow-300 border border-yellow-505/20'
                                  : 'bg-slate-800 text-slate-400'
                              }`}>
                                {demand.urgency === 'HIGH' ? 'Crítica' : demand.urgency === 'MEDIUM' ? 'Média' : 'Baixa'}
                              </span>
                            </td>
                            <td className="p-4 truncate">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold inline-block uppercase tracking-wide ${
                                demand.status === 'ROUTED_WORKSPACE' 
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                                  : demand.status === 'ROUTED_AUTOMATION' 
                                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' 
                                  : demand.status === 'ROUTED_PROJECT' 
                                  ? 'bg-indigo-505/15 text-indigo-450 border border-indigo-500/30' 
                                  : demand.status === 'REJECTED' 
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : 'bg-yellow-505/10 text-yellow-350 border border-yellow-505/20'
                              }`}>
                                {
                                  demand.status === 'PENDING' ? 'Novo' :
                                  demand.status === 'TRIAGE' ? 'Triar' :
                                  demand.status === 'ANALYSIS' ? 'Análise' :
                                  demand.status === 'ROUTED_WORKSPACE' ? 'Workspace' :
                                  demand.status === 'ROUTED_AUTOMATION' ? 'Automação' :
                                  demand.status === 'ROUTED_PROJECT' ? 'Maestro' : 'Inviável'
                                }
                              </span>
                            </td>
                            <td className="p-4 text-slate-400 text-[11px] truncate">
                              {demand.problemStatement}
                            </td>
                            <td className="p-4 text-right" onClick={(e) => {
                              e.stopPropagation();
                              handleSelectForTriage(demand);
                            }}>
                              <span className="text-indigo-400 font-bold hover:underline inline-flex items-center gap-0.5 text-[10px] cursor-pointer">
                                Triar <ChevronRight className="w-3 h-3" />
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredDemands.map(demand => {
                    const latestLog = demand.timeline[demand.timeline.length - 1];
                    const isSelected = selectedDemandToTriage?.id === demand.id;
                    const isCardChecked = selectedDemandIds.includes(demand.id);

                    return (
                      <div 
                        key={demand.id} 
                        onClick={() => {
                          handleSelectForTriage(demand);
                        }}
                        className={`p-4 rounded-3xl border transition-all cursor-pointer text-left flex flex-col justify-between space-y-3 hover:scale-[1.015] ${
                          isSelected 
                            ? 'bg-slate-900 border-indigo-500 shadow-xl' 
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        } ${isCardChecked ? 'ring-2 ring-indigo-500 bg-indigo-950/10' : ''}`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center gap-1.5 flex-wrap">
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <input 
                                type="checkbox"
                                checked={isCardChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedDemandIds(prev => [...prev, demand.id]);
                                  } else {
                                    setSelectedDemandIds(prev => prev.filter(id => id !== demand.id));
                                  }
                                }}
                                className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5"
                              />
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-slate-950 text-indigo-300 rounded border border-slate-800">
                                {demand.id}
                              </span>
                              <span className="text-[9px] font-mono text-slate-500">
                                {new Date(demand.createdAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-bold ${
                                demand.urgency === 'HIGH' 
                                  ? 'bg-red-950 text-red-400 border border-red-900/30' 
                                  : demand.urgency === 'MEDIUM' 
                                  ? 'bg-yellow-950 text-yellow-300 border border-yellow-900/30' 
                                  : 'bg-slate-800 text-slate-400'
                              }`}>
                                {demand.urgency === 'HIGH' ? 'Critica' : demand.urgency === 'MEDIUM' ? 'Média' : 'Baixa'}
                              </span>

                              <span className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase ${
                                demand.status === 'ROUTED_WORKSPACE' 
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/30' 
                                  : demand.status === 'ROUTED_AUTOMATION' 
                                  ? 'bg-blue-950 text-blue-400 border border-blue-900/30' 
                                  : demand.status === 'ROUTED_PROJECT' 
                                  ? 'bg-indigo-950 text-indigo-400 border border-indigo-900/30' 
                                  : demand.status === 'REJECTED' 
                                  ? 'bg-slate-950 text-red-450 border border-red-950'
                                  : 'bg-yellow-950 text-yellow-400 border border-yellow-900/30'
                              }`}>
                                {
                                  demand.status === 'PENDING' ? 'Novo' :
                                  demand.status === 'TRIAGE' ? 'Triar' :
                                  demand.status === 'ANALYSIS' ? 'Análise' :
                                  demand.status === 'ROUTED_WORKSPACE' ? ' Workspace' :
                                  demand.status === 'ROUTED_AUTOMATION' ? ' Automação' :
                                  demand.status === 'ROUTED_PROJECT' ? ' Maestro' : 'Inviável'
                                }
                              </span>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-xs font-bold text-slate-200 line-clamp-1">{demand.title}</h4>
                            <p className="text-[10px] text-slate-400 font-mono">
                              Solicitado por <strong className="text-slate-350">{demand.requesterName}</strong> • {demand.department}
                            </p>
                          </div>

                          <div className="bg-slate-950/60 p-2.5 rounded-xl text-[11px] text-slate-350 leading-relaxed space-y-1 max-h-24 overflow-y-auto">
                            <p className="line-clamp-2"><span className="text-[9px] font-mono font-bold text-indigo-400 block uppercase">Problema</span> {demand.problemStatement}</p>
                            <p className="line-clamp-2"><span className="text-[9px] font-mono font-bold text-emerald-400 block uppercase">Benefício</span> {demand.expectedBenefits}</p>
                          </div>
                        </div>

                        {/* DESPACHO OU TIMELINE LOG PREVIEW */}
                        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono" onClick={(e) => {
                          e.stopPropagation();
                          handleSelectForTriage(demand);
                        }}>
                          <span className="text-slate-500">Log recente: <strong className="text-slate-450">{latestLog?.status || "Início"}</strong></span>
                          <span className="text-indigo-405 font-bold hover:underline flex items-center gap-0.5 cursor-pointer">
                            Triar Solicitação <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* EXPANDED DETAILED MODAL DIALOG: MUTATE / DISPATCH */}
            {selectedDemandToTriage && (
              <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in text-xs overflow-y-auto">
                <div id="it-triage-panel" className="bg-slate-900 border border-indigo-500/30 rounded-3xl max-w-4xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
                  <div className="flex justify-between items-start border-b border-slate-800 pb-3 flex-wrap gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-950 text-indigo-400 rounded border border-slate-800">
                          PROCESSO EXECUTIVO DE TRIAGEM: {selectedDemandToTriage.id}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">Atualizado {new Date(selectedDemandToTriage.updatedAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <h3 className="text-base font-black text-indigo-300">{selectedDemandToTriage.title}</h3>
                      <p className="text-xs text-slate-400">
                        Entrada enviada por <strong className="text-slate-300">{selectedDemandToTriage.requesterName}</strong> (<span className="font-mono text-[11px]">{selectedDemandToTriage.requesterEmail}</span>) do setor <strong className="font-semibold text-slate-300">{selectedDemandToTriage.department}</strong>.
                      </p>
                    </div>

                    <button 
                      onClick={() => setSelectedDemandToTriage(null)}
                      className="p-1.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-bold cursor-pointer transition border border-slate-700 flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      Fechar Triagem
                    </button>
                  </div>

                {/* DOUBLE COLUMN FOR SOLICITATION VS ACTION */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
                  
                  {/* DETAIL FORM DATA DISPLAY */}
                  <div className="xl:col-span-7 bg-slate-950/40 p-4 rounded-2xl border border-slate-850 space-y-4">
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono tracking-widest text-indigo-400 uppercase font-black block">Qual problema o usuário precisa resolver?</span>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/70 p-3 rounded-lg border border-slate-850" style={{ whiteSpace: 'pre-wrap' }}>
                        {selectedDemandToTriage.problemStatement}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-mono tracking-widest text-emerald-400 uppercase font-black block">Quais os benefícios esperados listados pela área?</span>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/70 p-3 rounded-lg border border-slate-850" style={{ whiteSpace: 'pre-wrap' }}>
                        {selectedDemandToTriage.expectedBenefits}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800 space-y-0.5">
                        <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">Severidade</span>
                        <span className="font-bold text-slate-200">
                          {selectedDemandToTriage.urgency === 'HIGH' ? '③ Alta / Crítica' : selectedDemandToTriage.urgency === 'MEDIUM' ? '② Média Severidade' : '① Baixa Urgência'}
                        </span>
                      </div>
                      
                      <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800 space-y-0.5">
                        <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">Data Abertura</span>
                        <span className="font-mono text-slate-300">{new Date(selectedDemandToTriage.createdAt).toLocaleDateString()}</span>
                      </div>

                      <div className="bg-slate-900/70 p-2.5 rounded-xl border border-slate-800 space-y-0.5">
                        <span className="text-[9px] font-mono font-bold text-slate-500 uppercase block">Status Atual</span>
                        <span className="font-bold text-indigo-400 uppercase text-[10px]">
                          {selectedDemandToTriage.status}
                        </span>
                      </div>
                    </div>

                    {/* LIVE TRACK TIMELINE EVENTS OF SELECTED TICKET */}
                    <div className="space-y-2 pt-2 border-t border-slate-800 bg-slate-900/40 p-3 rounded-xl">
                      <span className="text-[9px] uppercase tracking-widest font-mono text-slate-400 font-bold block">Histórico do Chamado &amp; Disparos Automatizados</span>
                      <div className="relative pl-3.5 space-y-2.5 border-l border-slate-800 text-[11px] leading-relaxed">
                        {selectedDemandToTriage.timeline.map(node => (
                          <div key={node.id} className="relative">
                            <span className="absolute -left-[18px] top-1 h-1.5 w-1.5 rounded-full bg-indigo-505" />
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                              <span className="text-slate-300 font-semibold">{node.message}</span>
                              <span className="text-[10px] text-slate-500 font-mono italic">
                                {new Date(node.date).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: RESOLUTIONS STREAMS (THE FORWARD DISPATCH ACTIONS) */}
                  <div className="xl:col-span-5 bg-slate-950/60 p-4 rounded-2xl border border-slate-850 space-y-5">
                    <div>
                      <h4 className="text-xs font-mono font-extrabold tracking-wider text-indigo-400 uppercase">Ação da Diretoria de TI</h4>
                      <p className="text-[11px] text-slate-450 leading-relaxed">Selecione uma das 3 esteiras de encaminhamento ou mude o status para triagem avançada.</p>
                    </div>

                    {/* FEEDBACK COMMENT DRAFT INPUT */}
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-mono tracking-wider text-slate-500 font-bold block">
                        Nota Despacho / Feedback do Chamado (Opcional)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Escreva observações que guiarão o analista ou que justificarão a recusa. Este texto será notificado em tempo real para a linha do tempo do usuário."
                        value={feedbackNote}
                        onChange={(e) => setFeedbackNote(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                      />
                    </div>

                    {/* ACTIONS BOX 1: DISPATCH ENGINES */}
                    <div className="space-y-3.5 bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold block">ENCAMINHAR PARA ESTEIRA DE SOLUÇÃO (AS 3 FILAS)</span>
                      
                      <div className="grid grid-cols-1 gap-2">
                        
                        {/* 1. Google Workspace Dispatch */}
                        <button
                          onClick={() => handleUpdateTriage(selectedDemandToTriage.id, 'G_WORKSPACE')}
                          className="w-full p-2.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-300 border border-emerald-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer text-left flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="p-1 px-1.5 bg-emerald-500/20 font-bold text-[10px] rounded">1</span>
                            <div>
                              <span className="block text-[11px] font-extrabold text-white">Google Workspace</span>
                              <span className="block text-[9px] text-emerald-400/90 font-mono font-normal">Formulários, Drive, Sheets, Macros simples GSuite</span>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 shrink-0 text-emerald-300" />
                        </button>

                        {/* 2. Fast Automation & Analytics BI Dispatch */}
                        <button
                          onClick={() => handleUpdateTriage(selectedDemandToTriage.id, 'AUTOMATION')}
                          className="w-full p-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-300 border border-blue-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer text-left flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="p-1 px-1.5 bg-blue-500/20 font-bold text-[10px] rounded">2</span>
                            <div>
                              <span className="block text-[11px] font-extrabold text-white">Automação &amp; Dashboards</span>
                              <span className="block text-[9px] text-blue-400/90 font-mono font-normal">Robôs RPA, Macros avançadas, Power BI, Analytics</span>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 shrink-0 text-blue-300" />
                        </button>

                        {/* 3. Automatic VMO Backlog Downstream Project Dispatch */}
                        <button
                          onClick={() => handleUpdateTriage(selectedDemandToTriage.id, 'PROJECT')}
                          className="w-full p-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer text-left flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="p-1 px-1.5 bg-indigo-505/20 font-bold text-[10px] rounded">3</span>
                            <div>
                              <span className="text-[11px] font-extrabold text-white flex items-center gap-1.5 font-sans">
                                Escalar para Projetos Maestro
                                {!vmoSyncEnabled && <span className="text-[9px] px-1.5 py-0.2 bg-rose-500/20 text-rose-350 border border-rose-500/30 rounded font-mono font-bold uppercase">Off-line</span>}
                              </span>
                              <span className="block text-[9px] text-indigo-400 font-mono font-normal">
                                {vmoSyncEnabled 
                                  ? "Gera correspondente no Backlog do Upstream" 
                                  : "Retém local na Central de TI [Sincronia Inativa]"
                                }
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 shrink-0 text-indigo-405" />
                        </button>

                      </div>
                    </div>

                    {/* STATUS MANAGEMENT DROPDOWN IN THE FOOTER */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2.5">
                      <div className="flex-1 flex gap-1.5 items-center">
                        <select
                          value={triageStatusDraft}
                          onChange={(e) => setTriageStatusDraft(e.target.value)}
                          className="flex-1 bg-slate-900 border border-slate-800 p-1.5 rounded-lg text-xs text-slate-350 focus:outline-none cursor-pointer"
                        >
                          <option value="TRIAGE">Mover para Triagem</option>
                          <option value="ANALYSIS">Mover para Análise Técnica</option>
                          <option value="PENDING">Voltar para Pendente</option>
                          <option value="REJECTED">Inviabilizado / Recusar</option>
                        </select>
                        <button
                          onClick={() => handleUpdateTriage(selectedDemandToTriage.id, 'STATUS')}
                          className="p-1.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded text-xs font-bold transition cursor-pointer shrink-0"
                        >
                          Gravar Status
                        </button>
                      </div>
                    </div>

                  </div>
                  
                </div>
              </div>
            </div>
          )}

          </div>

        </div>
      )}

      {/* RENDER VIEW 4: CADERNO DE REQUISITOS (INTELLIGENT SPEC) */}
      {subTab === 'requirements' && (
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-sm font-bold font-mono uppercase tracking-widest text-indigo-350">Caderno de Requisitos Técnicos &amp; Negócio</h2>
              <p className="text-xs text-slate-400">Especificação detalhada das esteiras de entrada e admissão corporativa integrada ao Maestro.</p>
            </div>

            <button
              onClick={copyMarkdownToClipboard}
              className="p-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-355 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-all w-full sm:w-auto justify-center shrink-0 border border-indigo-500/20"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  Markdown Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar Especificação em Markdown
                </>
              )}
            </button>
          </div>

          {/* INTERNAL CONTENT TEXT WITH PRISTINE ACCENTS */}
          <div className="space-y-6 text-xs text-slate-300 leading-relaxed font-sans max-h-[550px] overflow-y-auto pr-2">
            
            {/* SECTION 1 */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 border-l-2 border-indigo-500 pl-2">
                1. Introdução e Visão de Negócio
              </h3>
              <p>
                Este documento serve como a **Especificação Técnica de Requisitos (SRS)** para o módulo de admissão e governança descentralizada de solicitações internas de tecnologia em pequenas e médias empresas (PMEs). 
              </p>
              <p>
                O objetivo primário é o **fim do Shadow IT** e de planilhas desarticuladas, oferecendo a colaboradores de qualquer setor (RH, Comercial, Financeiro, Jurídico) um canal transparente de entrada de demandas. A triagem inteligente classifica cada dor operacional e a redireciona de imediato para a esteira mais barata, rápida ou robusta de faturamento operacional.
              </p>
            </div>

            {/* SECTION 2 */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 border-l-2 border-indigo-500 pl-2">
                2. Fluxo Arquitetural da Admissão (As 3 Filas)
              </h3>
              <p>
                A espinha dorsal do sistema baseia-se em **três correntes (esteiras / pipelines)**, mitigando o acúmulo desnecessário de projetos caros de engenharia.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/10 space-y-2">
                  <span className="p-1 px-1.5 bg-emerald-500/10 text-emerald-400 font-mono text-[9px] font-bold rounded">FILA 1: GOOGLE WORKSPACE</span>
                  <p className="text-[10.5px] text-slate-400">
                    Sustentado por recursos colaborativos integrados como **Google Forms**, **Google Sheets**, e gatilhos automatizados em **Google Apps Script**. Soluciona problemas simples de organização administrativa sem custo adicional de licenciamento de software customizado.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-blue-500/10 space-y-2">
                  <span className="p-1 px-1.5 bg-blue-500/10 text-blue-400 font-mono text-[9px] font-bold rounded">FILA 2: AUTOMAÇÃO &amp; ANALYTICS</span>
                  <p className="text-[10.5px] text-slate-400">
                    Sustentado por ferramentas de desenvolvimento de baixo código (**RPA robusto**, **Macros em Python**, dashboards dinâmicos no **Power BI** ou painéis no Looker). Focado em automações curtas e integrações rápidas de APIs setoriais.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-505/10 space-y-2">
                  <span className="p-1 px-1.5 bg-indigo-500/10 text-indigo-400 font-mono text-[9px] font-bold rounded">FILA 3: PROJETOS (MAESTRO)</span>
                  <p className="text-[10.5px] text-slate-400">
                    Iniciativas estruturadas de alto orçamento e grande fôlego tecnológico. Ao ser selecionada, a demanda é **automaticamente provida** como item de proposta de inovação no Backlog do Upstream com status inicial **INTAKE**, permitindo scoreamento pelo Motor de Score VMO.
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 3 */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 border-l-2 border-indigo-500 pl-2">
                3. Matriz Dicionário de Dados: Ficha de Demanda
              </h3>
              <p>
                Esquema de campos estruturais exigidos pelo sistema de admissão formalizando a coleta de dores operacionais (chamado):
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px] bg-slate-950/60 rounded-xl border border-slate-800">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/60 font-mono font-bold text-slate-400">
                      <th className="p-2.5">Nome Técnico</th>
                      <th className="p-2.5">Nome Visível</th>
                      <th className="p-2.5">Tipo</th>
                      <th className="p-2.5">Obrigatoriedade</th>
                      <th className="p-2.5">Descrição/Validação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-805/40 text-slate-300">
                    <tr>
                      <td className="p-2.5 font-mono text-[9.5px] text-indigo-400">demandId</td>
                      <td className="p-2.5">Código do Ticket</td>
                      <td className="p-2.5">String/Autonumeric</td>
                      <td className="p-2.5">Obrigatório (Auto)</td>
                      <td className="p-2.5">Geração sequencial interna sob prefixo DEM-XXXX.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-[9.5px] text-indigo-400">requesterName</td>
                      <td className="p-2.5">Nome Solicitante</td>
                      <td className="p-2.5">Varchar(100)</td>
                      <td className="p-2.5">Obrigatório</td>
                      <td className="p-2.5">Colaborador que abriu a iniciativa. Auto-fill disponível.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-[9.5px] text-indigo-400">requesterEmail</td>
                      <td className="p-2.5">Email Corporativo</td>
                      <td className="p-2.5">Varchar(100)</td>
                      <td className="p-2.5">Obrigatório</td>
                      <td className="p-2.5">Padrão institucional para linkar dados de acompanhamento.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-[9.5px] text-indigo-400">department</td>
                      <td className="p-2.5">Setor Solicitante</td>
                      <td className="p-2.5">Varchar(50)</td>
                      <td className="p-2.5">Obrigatório</td>
                      <td className="p-2.5">Área organizacional de onde provém a iniciativa.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-[9.5px] text-indigo-400">title</td>
                      <td className="p-2.5">Resumo</td>
                      <td className="p-2.5">Varchar(80)</td>
                      <td className="p-2.5">Obrigatório</td>
                      <td className="p-2.5">Título direto sintetizando qual a meta pretendida.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-[9.5px] text-indigo-400">problemStatement</td>
                      <td className="p-2.5">Problema Real</td>
                      <td className="p-2.5">Text (Discursivo)</td>
                      <td className="p-2.5">Obrigatório</td>
                      <td className="p-2.5">Foco rígido na dor do negócio, retrabalho, lentidão ou custos.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-[9.5px] text-indigo-400">expectedBenefits</td>
                      <td className="p-2.5">Benefícios Esperados</td>
                      <td className="p-2.5">Text (Discursivo)</td>
                      <td className="p-2.5">Obrigatório</td>
                      <td className="p-2.5">Ganhos mensuráveis esperados: redução de tempo ou despesa.</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-mono text-[9.5px] text-indigo-400">urgency</td>
                      <td className="p-2.5">Urgência</td>
                      <td className="p-2.5">Enum(LOW, MEDIUM, HIGH)</td>
                      <td className="p-2.5">Obrigatório</td>
                      <td className="p-2.5">Mapeamento operacional de severidade do processo.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 4 */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 border-l-2 border-indigo-500 pl-2">
                4. Comunicação e Feedback (Notabilidade ao Solicitante)
              </h3>
              <p>
                Uma fraqueza crítica de centrais de chamados é o silêncio da equipe executora. Este sistema exige que **qualquer alterabilidade na fila de triagem registre logs transparentes na timeline do usuário**.
              </p>
              <p>
                Os logs devem refletir: a recepção do ticket, as etapas de triagem ou análise ativa, os despachos direcionados para esteiras específicas de Workspace ou BI, e o redirecionamento automático ao Backlog com o respectivo id do projeto correspondente de maneira indexada.
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
