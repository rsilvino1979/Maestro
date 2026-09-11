/**
 * Types and interfaces for the VMO Management Portal.
 */

export type Persona = 
  | 'SUPER_ADMIN' 
  | 'TENANT_ADMIN' 
  | 'PORTFOLIO_MANAGER' 
  | 'PROJECT_MANAGER' 
  | 'TEAM_MEMBER';

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  plan: 'Growth' | 'Enterprise';
  logoUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Persona;
  tenantId: string;
  password?: string;
  mustChangePassword?: boolean;
}

export interface Consultant {
  id: string;
  name: string;
  email: string;
  tenantId: string;
}

export type FeatureKey = 'canvas' | 'business_case' | 'budget' | 'gantt' | 'risks';

export interface FeatureToggle {
  key: FeatureKey;
  name: string;
  description: string;
}

export interface SystemModulesConfig {
  itDemands: boolean; // Módulo de Abertura e Esteiras de Demanda de TI
  portfolioManagement?: boolean; // Módulo de Gestão de Portfólios
  scoreEngine?: boolean; // Motor de Score Ponderado VMO
}

export interface PrioritizationWeights {
  alignment: number;   // Alinhamento Estratégico (e.g., 0.3)
  value: number;       // Valor de Negócio / ROI (e.g., 0.4)
  urgency: number;     // Urgência de Mercado (e.g., 0.15)
  complexity: number;  // Baixa Complexidade / Facilidade (e.g., 0.15)
}

export interface PrioritizationScores {
  alignment: number;   // 1 to 10
  value: number;       // 1 to 10
  urgency: number;     // 1 to 10
  complexity: number;  // 1 to 10 (where 10 is easiest/least effort)
  overallScore: number;
}

export interface CanvasData {
  purpose: string;
  targetAudience: string;
  channels: string;
  customerRelations: string;
  keyActivities: string;
  keyPartners: string;
  costStructure: string;
  expectedBenefitsValue: string;
}

export interface BusinessCaseData {
  problemStatement: string;
  solutionProposed: string;
  expectedBenefits: string;
  returnOnInvestment: string;
  paybackPeriodMonths: number;
}

export interface BudgetHistoryItem {
  id: string;
  changeDate: string;
  changedBy?: string;
  fieldChanged?: string;
  oldType?: string;
  newType?: string;
  oldCategory?: string;
  newCategory?: string;
  oldDescription?: string;
  newDescription?: string;
  oldBaselineCost?: number;
  newBaselineCost?: number;
  oldActualCost?: number;
  newActualCost?: number;
  oldAmount?: number;
  newAmount?: number;
  isFinancialChange: boolean;
  justification?: string;
}

export type BenefitType = 'Aumento Receita' | 'Redução de despesas' | 'NPS' | 'Churn' | 'KPIs';
export type BenefitUnitType = 'CURRENCY' | 'NUMBER' | 'PERCENTAGE';
export type PeriodicityType = 'Mês' | 'Quarter' | 'Semestre' | 'Ano';

export interface BudgetTarget {
  id: string;
  type: 'CAPEX' | 'OPEX' | 'RESULTADO_ESPERADO';
  targetName?: string; // Nome da Meta (ex: Meta MAUs Consumo, Meta Receita PME)
  periodicity?: PeriodicityType; // Mês, Quarter, Semestre, Ano
  period: string; // e.g., '31/12/2026', 'Q1 2026', '2026-M01', 'Ano 2026'
  expirationDate?: string; // Data de expiração/validade da verba (dd/mm/aaaa ou YYYY-MM-DD)
  category: string;
  description: string;
  targetAmount: number; // Valor Planejado / Meta
  benefitType?: BenefitType;
  unitType?: BenefitUnitType;
  history?: BudgetHistoryItem[];
  lastJustification?: string;
}

export interface FinancialCategoryConfig {
  id: string;
  code: number;
  type: 'CAPEX' | 'OPEX';
  category: string; // Nome da Categoria
  description: string; // Descrição do Item
  practicalExample: string; // Exemplo Prático no Projeto
}

export interface CashFlowEntry {
  id: string;
  date: string; // YYYY-MM-DD
  period: string; // e.g., 'Q1 2026', '2026-M08'
  type: 'CAPEX' | 'OPEX' | 'RESULTADO_REALIZADO';
  targetName?: string; // Nome da Meta vinculada
  linkedTargetId?: string; // ID da linha de baseline planejada vinculada
  category: string;
  supplierOrDoc?: string; // Fornecedor / NF / Evidência
  description: string;
  amount: number; // Valor Consumido / Pago / Capturado
  status: 'REALIZADO' | 'PREVISTO' | 'CANCELADO';
  benefitType?: BenefitType;
  unitType?: BenefitUnitType;
  history?: BudgetHistoryItem[];
  lastJustification?: string;
}

export interface BudgetLine {
  id: string;
  type: 'CAPEX' | 'OPEX';
  category: string;
  description: string;
  baselineCost: number;
  actualCost: number;
  period?: string;
  history?: BudgetHistoryItem[];
  lastJustification?: string;
}

export interface Milestone {
  id: string;
  name: string;
  dueDate: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  progress: number; // 0 to 100
}

export interface ReplanningHistoryItem {
  id: string;
  changeDate: string;           // ISO timestamp or formatted date
  deliverableId: string;
  deliverableName: string;
  oldStartDate?: string;
  newStartDate?: string;
  oldEndDate?: string;
  newEndDate?: string;
  justification: string;
  changedBy?: string;
}

export interface InterdependenceInfo {
  hasInterdependence: boolean;
  type?: 'INTERNAL' | 'EXTERNAL';
  targetDeliverableId?: string;
  targetDeliverableName?: string;
  targetProjectId?: string;
  targetProjectName?: string;
  notes?: string;
}

export interface SubActivity {
  id: string;
  name: string;
  responsible?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'BLOCKED';
  progress: number;  // 0 to 100
  notes?: string;
}

export interface RoadmapDeliverable {
  id: string;
  name: string;                  // Nome da Entrega / Atividade
  responsible: string;           // Responsável (ex: "Carlos Silva")
  startDate: string;             // Data Início (YYYY-MM-DD)
  endDate: string;               // Data Término (YYYY-MM-DD)
  baselineStartDate?: string;    // Data de Início original
  baselineEndDate?: string;      // Data de Término original
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'BLOCKED';
  progress: number;              // 0 a 100
  phase?: string;                // Fase / Macro-etapa
  isMilestone?: boolean;         // Sinalizado como Marco de Entrega Relevante (Exibido no Roadmap Executivo)
  subActivities?: SubActivity[];  // Atividades cadastradas abaixo da macro entrega (sensibilizam datas/progresso MS Project style)
  replanningCount: number;       // Contador de replanejamentos de data
  history?: ReplanningHistoryItem[]; // Histórico de alterações de baseline desta entrega
  interdependence?: InterdependenceInfo; // Sinalização de interdependência
  notes?: string;
}

export interface Risk {
  id: string;
  category: 'Strategic' | 'Financial' | 'Technical' | 'Operational' | 'Schedule';
  description: string;
  probability: number; // 1 to 5
  impact: number;      // 1 to 5
  mitigationPlan: string;
}

export interface Project {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  status: 'INTAKE' | 'ACTIVE' | 'ARCHIVED';
  features: Record<FeatureKey, boolean>;
  prioritizationScores: PrioritizationScores;
  canvasData: CanvasData;
  businessCaseData: BusinessCaseData;
  budgetLines: BudgetLine[];
  budgetTargets?: BudgetTarget[];
  cashFlowEntries?: CashFlowEntry[];
  milestones: Milestone[];
  roadmapDeliverables?: RoadmapDeliverable[];
  risks: Risk[];
  createdAt: string;
  createdBy: string;
  allocatedBudget: number;
  // Optional professional intake metadata fields
  demandId?: number;
  involvedAreas?: string[];
  sponsor?: string;
  proposedPM?: string;
  requestingDept?: string;
  strategicPillar?: string;
  desiredBudget?: number;
  proposedDeadline?: string;
  beneficiaries?: string;
  // Simple registry fields
  consultant?: string;
  startDate?: string;
  endDate?: string;
  portfolio?: string;
  client?: string;
  segments?: string[];
  projectTheme?: string;
  phase?: string;
  size?: string;
  notes?: string;
  // Replanning tracks
  replanningCount?: number;
  lastPlannedEndDate?: string;
  baselineEndDate?: string;
  replanningHistory?: { date: string; lastPlannedDate: string; newPlannedDate: string; justification: string }[];
}

export type PortfolioCategory = 'Inovação' | 'Sustentação' | 'Crescimento' | 'Regulatório' | 'Outros';
export type PortfolioStatus = 'Ativo' | 'Planejamento' | 'Encerrado';

export interface Portfolio {
  id: string;
  tenantId: string;
  name: string;
  investmentThesis: string;
  category: PortfolioCategory | string;
  status: PortfolioStatus;
  sponsor: string;
  portfolioManager: string;
  requestingArea: string;
  strategicPillar: string;
  associatedOKR: string;
  timeHorizon: string;
  createdAt?: string;
  updatedAt?: string;
}
