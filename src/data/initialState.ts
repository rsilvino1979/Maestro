import { Project, Tenant, User, PrioritizationWeights } from '../types';

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'tenant_techstart',
    name: 'TechStart SaaS Ltd',
    domain: 'techstart.io',
    plan: 'Growth'
  },
  {
    id: 'tenant_growthcorp',
    name: 'Sistemas GrowthCorp S/A',
    domain: 'growthcorp.com.br',
    plan: 'Enterprise'
  }
];

export const INITIAL_USERS: User[] = [
  // Tenant A: TechStart SaaS
  {
    id: 'user_tech_super',
    tenantId: 'tenant_techstart',
    name: 'Aline Souza',
    email: 'aline.souza@platform.io',
    role: 'SUPER_ADMIN'
  },
  {
    id: 'user_tech_admin',
    tenantId: 'tenant_techstart',
    name: 'Bernardo Lima',
    email: 'bernardo.lima@techstart.io',
    role: 'TENANT_ADMIN'
  },
  {
    id: 'user_tech_pmo',
    tenantId: 'tenant_techstart',
    name: 'Camila Rocha (PMO)',
    email: 'camila.rocha@techstart.io',
    role: 'PORTFOLIO_MANAGER'
  },
  {
    id: 'user_tech_pm',
    tenantId: 'tenant_techstart',
    name: 'Diego Santos (PM)',
    email: 'diego.santos@techstart.io',
    role: 'PROJECT_MANAGER'
  },
  {
    id: 'user_tech_member',
    tenantId: 'tenant_techstart',
    name: 'Eduarda Costa',
    email: 'eduarda.costa@techstart.io',
    role: 'TEAM_MEMBER'
  },

  // Tenant B: GrowthCorp
  {
    id: 'user_growth_admin',
    tenantId: 'tenant_growthcorp',
    name: 'Gabriel Nogueira',
    email: 'gabriel.n@growthcorp.com.br',
    role: 'TENANT_ADMIN'
  },
  {
    id: 'user_growth_pmo',
    tenantId: 'tenant_growthcorp',
    name: 'Helena Oliveira (PMO)',
    email: 'helena.o@growthcorp.com.br',
    role: 'PORTFOLIO_MANAGER'
  },
  {
    id: 'user_growth_pm',
    tenantId: 'tenant_growthcorp',
    name: 'Igor Fonseca (PM)',
    email: 'igor.f@growthcorp.com.br',
    role: 'PROJECT_MANAGER'
  }
];

export const DEFAULT_WEIGHTS: PrioritizationWeights = {
  alignment: 0.30,  // 30% Alignment
  value: 0.40,      // 40% Business Value / ROI
  urgency: 0.15,    // 15% Urgency
  complexity: 0.15  // 15% Simplicity (10 is easiest, 1 is hardest)
};

export const INITIAL_PROJECTS: Project[] = [
  // Projects for Tenant 1: TechStart SaaS
  {
    id: 'proj_tech_1',
    tenantId: 'tenant_techstart',
    name: '1. Expansão Cloud Core (Upgrade K8s)',
    description: 'Portabilidade global de workloads de microsserviços integrando clusters AWS de alta disponibilidade com pods auto-escaláveis.',
    status: 'ACTIVE',
    createdAt: '2026-05-10T09:00:00Z',
    createdBy: 'Camila Rocha (PMO)',
    allocatedBudget: 120000.00,
    features: {
      canvas: true,
      business_case: true,
      budget: true,
      gantt: true,
      risks: true
    },
    prioritizationScores: {
      alignment: 9,
      value: 8,
      urgency: 8,
      complexity: 6,
      overallScore: 8.00 // (9*0.3) + (8*0.4) + (8*0.15) + (6*0.15) = 2.7 + 3.2 + 1.2 + 0.9 = 8.0
    },
    canvasData: {
      purpose: 'Garantir disponibilidade de 99.99% e absorver crescimento repentino de tráfego de API.',
      targetAudience: 'Clientes Enterprise que utilizam as APIs de pagamento recorrente.',
      channels: 'Infraestrutura interna via Terraform e Helm charts dedicados.',
      customerRelations: 'Gerentes técnicos internos e DevOps dedicados à monitoração de latência.',
      keyActivities: 'Migrations de DB PostgreSQL, tunning de pods, parametrização de autoscaler hpa.',
      keyPartners: 'Engenheiros AWS do plano Premium Enterprise Support.',
      costStructure: 'Custos com instâncias EC2, RDS Aurora Multi-AZ e balanceadores de carga ALB.',
      expectedBenefitsValue: 'Redução de incidentes em produção P1 e latência abaixo de 45ms globalmente.'
    },
    businessCaseData: {
      problemStatement: 'Saturação de carga frequente no servidor de checkout principal, causando bottlenecks no fim do mês.',
      solutionProposed: 'Distribuição regional georoteada e replicação assíncrona do tenant database.',
      expectedBenefits: 'Resiliência operacional a falhas regionais AWS e tempo de resposta otimizado.',
      returnOnInvestment: 'Prevenção de multas de SLA estimadas em R$ 350K/ano.',
      paybackPeriodMonths: 4
    },
    budgetLines: [
      { id: 'b_t1_1', type: 'CAPEX', category: 'Infraestrutura Cloud', description: 'Migração de instâncias AWS Aurora EC2 Serverless', baselineCost: 60000.00, actualCost: 58000.00 },
      { id: 'b_t1_2', type: 'CAPEX', category: 'Licenciamento de Software', description: 'Assinatura Enterprise Datadog APM', baselineCost: 20000.00, actualCost: 22000.00 },
      { id: 'b_t1_3', type: 'OPEX', category: 'Serviços Profissionais', description: 'Consultoria de Tuning Postgres Sênior (120h)', baselineCost: 40000.00, actualCost: 35000.00 }
    ],
    milestones: [
      { id: 'm_t1_1', name: 'Mapeamento de Dependências e Arquitetura', dueDate: '2026-06-15', status: 'COMPLETED', progress: 100 },
      { id: 'm_t1_2', name: 'Provisionamento e Homologação Sandbox', dueDate: '2026-07-20', status: 'IN_PROGRESS', progress: 65 },
      { id: 'm_t1_3', name: 'Cutover Final e Virada de Produção Core', dueDate: '2026-08-30', status: 'NOT_STARTED', progress: 0 }
    ],
    roadmapDeliverables: [
      {
        id: 'deliv_1_1',
        name: 'Mapeamento de Dependências de Arquitetura & Cloud Migration',
        responsible: 'Bernardo Lima',
        startDate: '2026-05-01',
        endDate: '2026-06-15',
        baselineStartDate: '2026-05-01',
        baselineEndDate: '2026-06-15',
        status: 'COMPLETED',
        progress: 100,
        phase: 'Iniciação',
        replanningCount: 0,
        history: [],
        notes: 'Documentação de arquitetura homologada pelo comitê técnico.'
      },
      {
        id: 'deliv_1_2',
        name: 'Provisionamento de Instâncias Aurora & Tuning de Banco',
        responsible: 'Camila Rocha',
        startDate: '2026-06-16',
        endDate: '2026-07-28',
        baselineStartDate: '2026-06-16',
        baselineEndDate: '2026-07-15',
        status: 'IN_PROGRESS',
        progress: 65,
        phase: 'Desenvolvimento',
        replanningCount: 1,
        history: [
          {
            id: 'h_1_2_1',
            changeDate: '10/06/2026 14:30',
            deliverableId: 'deliv_1_2',
            deliverableName: 'Provisionamento de Instâncias Aurora & Tuning de Banco',
            oldStartDate: '2026-06-16',
            newStartDate: '2026-06-16',
            oldEndDate: '2026-07-15',
            newEndDate: '2026-07-28',
            justification: 'Atraso na liberação da cota de instâncias pela AWS Security Governance.',
            changedBy: 'PROJECT_MANAGER'
          }
        ],
        notes: 'Ambientes de homologação ativos. Ajustes de IOPS em andamento.'
      },
      {
        id: 'deliv_1_3',
        name: 'Cutover Final e Virada de Produção Core (Go-Live)',
        responsible: 'Bernardo Lima',
        startDate: '2026-08-01',
        endDate: '2026-08-30',
        baselineStartDate: '2026-08-01',
        baselineEndDate: '2026-08-30',
        status: 'NOT_STARTED',
        progress: 0,
        phase: 'Go-Live',
        replanningCount: 0,
        history: [],
        notes: 'Data crítica com janela de manutenção agendada para fim de semana.'
      }
    ],
    risks: [
      { id: 'r_t1_1', category: 'Technical', description: 'Incompatibilidade de drivers JDBC do PostgreSQL legado com nova versão AWS Aurora v15.', probability: 4, impact: 5, mitigationPlan: 'Instanciar Sandbox preliminar e rodar suite automatizada de integração de driver por 72 horas contínuas' },
      { id: 'r_t1_2', category: 'Financial', description: 'Oscilação do Dólar americano afetando faturamento variável de recursos Kubernetes na AWS.', probability: 3, impact: 3, mitigationPlan: 'Comprar crédito pré-pago AWS com trava cambial no início do trimestre.' }
    ]
  },
  {
    id: 'proj_tech_2',
    tenantId: 'tenant_techstart',
    name: '2. Portal do Desenvolvedor Refatorado (Developer Experience)',
    description: 'Portal de documentação de APIs interativo, com sandbox de testes e SDKs para acelerar onboardings.',
    status: 'ACTIVE',
    createdAt: '2026-05-18T14:20:00Z',
    createdBy: 'Bernardo Lima',
    allocatedBudget: 45000.00,
    features: {
      canvas: true,
      business_case: false,
      budget: true,
      gantt: true,
      risks: false
    },
    prioritizationScores: {
      alignment: 7,
      value: 7,
      urgency: 5,
      complexity: 9,
      overallScore: 7.00 // (7*0.3) + (7*0.4) + (5*0.15) + (9*0.15) = 2.1 + 2.8 + 0.75 + 1.35 = 7.0
    },
    canvasData: {
      purpose: 'Facilitar a integração de parceiros no nosso gateway de cobrança autodidata.',
      targetAudience: 'Desenvolvedores externos e integradores das plataformas parceiras.',
      channels: 'Subdomínio docs.techstart.io integrado com gerador Docusaurus.',
      customerRelations: 'Comunidade no Slack de devs e suporte ágil via discord.',
      keyActivities: 'Escrever OpenAPI/Swagger especificação, testar snippets Node/Python.',
      keyPartners: 'Google Workspace Developer relations e agência de design UX local.',
      costStructure: 'Custos com hospedagem Netlify Premium e ferramentas de mock dinâmico Apiary.',
      expectedBenefitsValue: 'Reduzir o tempo de go-live de novos clientes integrados de 14 dias para menos de 2 horas.'
    },
    businessCaseData: {
      problemStatement: 'Documentação defasada em PDF gera 60% dos tickets de suporte do onboarding de novos clientes.',
      solutionProposed: 'Substituição completa por documentação interativa e gerador dinâmico de chaves API.',
      expectedBenefits: 'Diminuição dos chamados de suporte e aumento de conversões orgânicas na API pública.',
      returnOnInvestment: 'Economia estimada de 30% do tempo do time de suporte de Nível 2.',
      paybackPeriodMonths: 3
    },
    budgetLines: [
      { id: 'b_t2_1', type: 'CAPEX', category: 'Infraestrutura Cloud', description: 'Assinatura Stoplight e Redocly Studio', baselineCost: 15000.00, actualCost: 14000.00 },
      { id: 'b_t2_2', type: 'OPEX', category: 'Serviços Profissionais', description: 'Contratação de Copywriter Técnico Freelance para APIs', baselineCost: 30000.00, actualCost: 31000.00 }
    ],
    milestones: [
      { id: 'm_t2_1', name: 'Consolidação das OpenAPI Specs v3.1', dueDate: '2026-06-30', status: 'IN_PROGRESS', progress: 40 },
      { id: 'm_t2_2', name: 'Integração de OAuth Sandbox interativo', dueDate: '2026-07-31', status: 'NOT_STARTED', progress: 0 }
    ],
    risks: []
  },
  {
    id: 'proj_tech_3',
    tenantId: 'tenant_techstart',
    name: '3. Sistema Antifraude com Machine Learning P0',
    description: 'Análise probabilística heurística em tempo real para barrar transações suspeitas e chargebacks.',
    status: 'INTAKE',
    createdAt: '2026-06-03T11:00:00Z',
    createdBy: 'Camila Rocha (PMO)',
    allocatedBudget: 0.00, // Still intake, budget not set
    features: {
      canvas: true,
      business_case: true,
      budget: false, // Upstream intake disabled initially
      gantt: false,
      risks: true
    },
    prioritizationScores: {
      alignment: 10,
      value: 9,
      urgency: 9,
      complexity: 4, // Complex item (low value = hard)
      overallScore: 8.55 // (10*0.3) + (9*0.4) + (9*0.15) + (4*0.15) = 3.0 + 3.6 + 1.35 + 0.6 = 8.55
    },
    canvasData: {
      purpose: 'Prevenir fraudes recorrentes vindas de cartões clonados ou suspeitos.',
      targetAudience: 'Operação de prevenção de fraudes e compliance da empresa.',
      channels: 'Micro-serviço em Python rodando em paralelo ao pipeline de autorização.',
      customerRelations: 'Interface interna de reconciliação de disputas para analistas.',
      keyActivities: 'Feature engineering, processamento em batch, calibragem de limiares de acerto.',
      keyPartners: 'Bureau de crédito e gateways estatais de validação cadastral.',
      costStructure: 'Custos de infraestrutura GPU em nuvem para treinamento e storage S3.',
      expectedBenefitsValue: 'Reduzir chargebacks para menos de 0.25% faturado.'
    },
    businessCaseData: {
      problemStatement: 'Acúmulo de chargebacks ultrapassa R$ 80 mil mensais, gerando risco de punição pela bandeira Visa.',
      solutionProposed: 'Motor preditivo com árvore de decisão cruzando IP, geolocalização e ticket médio.',
      expectedBenefits: 'Salvar multas contratuais e economizar chargebacks na ordem de R$ 60 mil/mês.',
      returnOnInvestment: 'Retorno projetado de 450% sobre o investimento inicial.',
      paybackPeriodMonths: 2
    },
    budgetLines: [],
    milestones: [],
    risks: [
      { id: 'r_t3_1', category: 'Strategic', description: 'Aumento de Falso-Positivo bloqueando o processamento de compras de clientes legítimos.', probability: 3, impact: 5, mitigationPlan: 'Implementar modo observabilidade por 15 dias computando sem de fato negar a transação' }
    ]
  },
  {
    id: 'proj_tech_4',
    tenantId: 'tenant_techstart',
    name: '4. Integração Pix Parcelado (Buy Now Pay Later)',
    description: 'Pesquisa e design de fluxo de pagamento via QR Code Pix simulando financiamento direto no app.',
    status: 'INTAKE',
    createdAt: '2026-06-05T15:30:00Z',
    createdBy: 'Diego Santos (PM)',
    allocatedBudget: 0.00,
    features: {
      canvas: true,
      business_case: false,
      budget: false,
      gantt: false,
      risks: false
    },
    prioritizationScores: {
      alignment: 8,
      value: 6,
      urgency: 8,
      complexity: 7,
      overallScore: 7.05 // (8*0.3) + (6*0.4) + (8*0.15) + (7*0.15) = 2.4 + 2.4 + 1.2 + 1.05 = 7.05
    },
    canvasData: {
      purpose: 'Adotar modalidade com crescimento de 150% ao ano de adesão em PMEs.',
      targetAudience: 'Consumidores finais de lojas virtuais parceiras de ticket médio alto.',
      channels: 'Widget modular de pagamento embarcado no checkout do lojista.',
      customerRelations: 'Automação de lembrete de parcela via WhatsApp e notificações PUSH.',
      keyActivities: 'Homologar contrato com emissor de crédito parceiro, desenhar fluxo de juros.',
      keyPartners: 'Fintech financeira estruturada (banco parceiro de liquidação).',
      costStructure: 'Taxas percentuais por originação cobradas pelo banco emissor do empréstimo.',
      expectedBenefitsValue: 'Elevar o ticket médio global dos lojistas aderentes em até 40%.'
    },
    businessCaseData: {
      problemStatement: 'Muitas compras são canceladas na tela final pelo limite do cartão do cliente ser em média menor que o produto.',
      solutionProposed: 'Parcelamento facilitado via Pix Direto garantido pelo banco parceiro.',
      expectedBenefits: 'Novas receitas de comissão financeira de taxas de parcelamento e maior conversão de checkout.',
      returnOnInvestment: 'Taxa interna de retorno estimada em 24% over year.',
      paybackPeriodMonths: 9
    },
    budgetLines: [],
    milestones: [],
    risks: []
  },

  // Projects for Tenant 2: GrowthCorp
  {
    id: 'proj_growth_1',
    tenantId: 'tenant_growthcorp',
    name: '1. Unificação do CRM Corporativo',
    description: 'Migração centralizada de múltiplos softwares legados de filiais com unificação da base de leads sob um único cluster Salesforce.',
    status: 'ACTIVE',
    createdAt: '2026-04-12T08:00:00Z',
    createdBy: 'Helena Oliveira (PMO)',
    allocatedBudget: 280000.00,
    features: {
      canvas: true,
      business_case: true,
      budget: true,
      gantt: true,
      risks: true
    },
    prioritizationScores: {
      alignment: 8,
      value: 9,
      urgency: 7,
      complexity: 5,
      overallScore: 7.80 // (8*0.3) + (9*0.4) + (7*0.15) + (5*0.15) = 2.4 + 3.6 + 1.05 + 0.75 = 7.8
    },
    canvasData: {
      purpose: 'Unificar a visão do cliente de ponta a ponta e melhorar o cross-sell entre filiais.',
      targetAudience: 'Executivos de Vendas internos e Gerência de Marketing unificada.',
      channels: 'Login em Portal Web integrado com SAML single-sign on corporativo.',
      customerRelations: 'Controle de pipeline estendido, atribuição inteligente de contatos.',
      keyActivities: 'Higienização de cadastros duplicados, migração de dados de 6 planilhas e 2 CRMs.',
      keyPartners: 'Consultor de Integração credenciado Salesforce Platinum.',
      costStructure: 'Custos recorrentes pesados de licenças de SaaS e taxas de migração profissional.',
      expectedBenefitsValue: 'Geração de mais de R$ 1.2M em novos cross-sells identificados automaticamente.'
    },
    businessCaseData: {
      problemStatement: 'Cultura fragmentada de silos comerciais. Uma filial oferece serviços de forma concorrente sem saber.',
      solutionProposed: 'Infraestrutura comum Salesforce Sales Cloud Custom com regras tributárias.',
      expectedBenefits: 'Fim da concorrência interna, relatórios gerenciais consolidados em tempo de execução.',
      returnOnInvestment: 'Taxa de conversão de leads aumentada em 18%.',
      paybackPeriodMonths: 6
    },
    budgetLines: [
      { id: 'b_t3_1', type: 'CAPEX', category: 'Software Licenciamento', description: 'Licenciamento Salesforce Enterprise (120 assentos)', baselineCost: 180000.00, actualCost: 180000.00 },
      { id: 'b_t3_2', type: 'OPEX', category: 'Serviços de Integração', description: 'Consultoria Accenture para Migração e Carga de Dados', baselineCost: 100000.00, actualCost: 105000.00 }
    ],
    milestones: [
      { id: 'm_t3_1', name: 'Alinhamento Comercial e Mapeamento de Funis', dueDate: '2026-05-15', status: 'COMPLETED', progress: 100 },
      { id: 'm_t3_2', name: 'Integração de APIs de Faturamento e ERP SAP', dueDate: '2026-06-30', status: 'IN_PROGRESS', progress: 50 },
      { id: 'm_t3_3', name: 'Treinamento das Equipes e Onboarding Comercial', dueDate: '2026-08-01', status: 'NOT_STARTED', progress: 0 }
    ],
    risks: [
      { id: 'r_t3_1', category: 'Operational', description: 'Resistência cultural das equipes comerciais locais a preencher novo padrão de CRM.', probability: 4, impact: 4, mitigationPlan: 'Vincular comissionamento mensal exclusivamente ao preenchimento dos campos obrigatórios no CRM' }
    ]
  },
  {
    id: 'proj_growth_2',
    tenantId: 'tenant_growthcorp',
    name: '2. Automação de Relatórios Tributários Sped',
    description: 'Módulo fiscal eletrônico complementar para extração e agrupamento de notas de saída para fins de auditoria interna.',
    status: 'INTAKE',
    createdAt: '2026-06-01T10:00:00Z',
    createdBy: 'Helena Oliveira (PMO)',
    allocatedBudget: 0.00,
    features: {
      canvas: true,
      business_case: true,
      budget: false,
      gantt: false,
      risks: true
    },
    prioritizationScores: {
      alignment: 9,
      value: 6,
      urgency: 10,
      complexity: 9,
      overallScore: 7.95 // (9*0.3)+ (6*0.4) + (10*0.15) + (9*0.15) = 2.7 + 2.4 + 1.5 + 1.35 = 7.95
    },
    canvasData: {
      purpose: 'Automatizar o compliance fiscal, eliminando retrabalho das secretárias tributárias.',
      targetAudience: 'Contabilidade e Time Fiscal Interno.',
      channels: 'Módulo acessório embarcado no ERP Totvs.',
      customerRelations: 'Painel autoexplicativo com alertas de divergência cadastral de CNPJs.',
      keyActivities: 'Mapeamento de alíquotas estaduais, cruzamento de XML de notas fiscais.',
      keyPartners: 'Receita Federal parceiros técnicos de homologação de Web Service.',
      costStructure: 'Custos baixos baseados em processamento de servidor sob demanda.',
      expectedBenefitsValue: 'Economizar 120 horas mensais de emissão de guias tributárias manuais.'
    },
    businessCaseData: {
      problemStatement: 'Erros de preenchimento causam multas médias de R$ 15 mil ao ano pelo fisco estadual.',
      solutionProposed: 'Software validador de arquivo fiscal antes de consolidar a guia do imposto.',
      expectedBenefits: 'Zeramento de erro material passível de autuação administrativa fiscal.',
      returnOnInvestment: 'Mitigação integral de passivos contingenciais de R$ 50 mil/ano.',
      paybackPeriodMonths: 2
    },
    budgetLines: [],
    milestones: [],
    risks: [
      { id: 'r_growth2_1', category: 'Technical', description: 'Mudança repentina do padrão XML emitido pela SEFAZ Estadual no meio do projeto.', probability: 2, impact: 4, mitigationPlan: 'Uso de adaptadores de padrão factory de parsing no backend para rápida adequação sem rebuild.' }
    ]
  }
];
