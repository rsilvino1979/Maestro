export const PRISMA_SCHEMA = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

/// Dynamic tenancy model targeting SaaS B2B SMEs
model Tenant {
  id        String    @id @default(uuid())
  name      String
  domain    String    @unique
  plan      String    // e.g., "Growth", "Enterprise"
  createdAt DateTime  @default(now()) @map("created_at")
  users     User[]
  projects  Project[]

  @@map("tenants")
}

model User {
  id        String    @id @default(uuid())
  tenantId  String    @map("tenant_id")
  name      String
  email     String    @unique
  role      String    // SUPER_ADMIN, TENANT_ADMIN, PORTFOLIO_MANAGER, PROJECT_MANAGER, TEAM_MEMBER
  createdAt DateTime  @default(now()) @map("created_at")
  tenant    Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@map("users")
}

model Project {
  id                  String             @id @default(uuid())
  tenantId            String             @map("tenant_id")
  name                String
  description         String
  status              String             // "INTAKE", "ACTIVE", "ARCHIVED"
  alignmentWeight     Float              @default(0.3)
  valueWeight         Float              @default(0.4)
  urgencyWeight       Float              @default(0.15)
  complexityWeight    Float              @default(0.15)
  alignmentScore      Int                @default(5)
  valueScore          Int                @default(5)
  urgencyScore        Int                @default(5)
  complexityScore      Int                @default(5)
  overallScore        Float              @default(5.0)
  allocatedBudget     Decimal            @default(0.0) @db.Decimal(12, 2)
  createdAt           DateTime           @default(now()) @map("created_at")
  createdBy           String             @map("created_by")
  
  tenant              Tenant             @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  featureToggles      FeatureToggle[]
  canvas              ProjectCanvas?
  businessCase        BusinessCase?
  budgetLines         BudgetLine[]
  milestones          Milestone[]
  risks               Risk[]

  @@index([tenantId])
  @@map("projects")
}

model FeatureToggle {
  id        String   @id @default(uuid())
  projectId String   @map("project_id")
  tenantId  String   @map("tenant_id")
  feature   String   // "canvas", "business_case", "budget", "gantt", "risks"
  enabled   Boolean  @default(true)
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@unique([projectId, feature])
  @@index([tenantId])
  @@map("project_features")
}

model ProjectCanvas {
  id              String   @id @default(uuid())
  projectId       String   @unique @map("project_id")
  tenantId        String   @map("tenant_id")
  purpose         String   @db.Text
  targetAudience  String   @db.Text
  channels        String   @db.Text
  relations       String   @db.Text
  keyActivities   String   @db.Text
  keyPartners      String   @db.Text
  costStructure   String   @db.Text
  expectedBenefits String   @db.Text
  project         Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@map("project_canvas")
}

model BusinessCase {
  id                  String   @id @default(uuid())
  projectId           String   @unique @map("project_id")
  tenantId            String   @map("tenant_id")
  problemStatement    String   @db.Text
  solutionProposed    String   @db.Text
  expectedBenefits    String   @db.Text
  returnOnInvestment  String   @db.Text
  paybackPeriodMonths Int
  project             Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@map("project_business_case")
}

model BudgetLine {
  id           String   @id @default(uuid())
  projectId    String   @map("project_id")
  tenantId     String   @map("tenant_id")
  type         String   // "CAPEX" or "OPEX"
  category     String   // e.g., "Software License", "Engineering Hours"
  description  String
  baselineCost Decimal  @db.Decimal(12, 2)
  actualCost   Decimal  @db.Decimal(12, 2)
  project      Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@map("project_budget_lines")
}

model Milestone {
  id        String   @id @default(uuid())
  projectId String   @map("project_id")
  tenantId  String   @map("tenant_id")
  name      String
  dueDate   DateTime @map("due_date")
  status    String   // "NOT_STARTED", "IN_PROGRESS", "COMPLETED"
  progress  Int      @default(0) // 0-100
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@map("project_milestones")
}

model Risk {
  id             String   @id @default(uuid())
  projectId      String   @map("project_id")
  tenantId       String   @map("tenant_id")
  category       String   // "Strategic", "Financial", etc.
  description    String
  probability    Int      // 1-5
  impact         Int      // 1-5
  mitigationPlan String   @db.Text
  project        Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@map("project_risks")
}`;

export const POSTGRES_SQL_DDL = `-- ==========================================
-- 1. TENANCY AND IDENTITY TABLES
-- ==========================================

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    plan VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL, -- SUPER_ADMIN, TENANT_ADMIN, PORTFOLIO_MANAGER, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexing for lookup speed and partition queries
CREATE INDEX idx_users_tenant ON users(tenant_id);

-- ==========================================
-- 2. CORE PROJECT PORTFOLIO TABLES
-- ==========================================

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'INTAKE' NOT NULL, -- INTAKE, ACTIVE, ARCHIVED
    alignment_weight NUMERIC(3,2) DEFAULT 0.30 NOT NULL,
    value_weight NUMERIC(3,2) DEFAULT 0.40 NOT NULL,
    urgency_weight NUMERIC(3,2) DEFAULT 0.15 NOT NULL,
    complexity_weight NUMERIC(3,2) DEFAULT 0.15 NOT NULL,
    alignment_score INT DEFAULT 5 NOT NULL,
    value_score INT DEFAULT 5 NOT NULL,
    urgency_score INT DEFAULT 5 NOT NULL,
    complexity_score INT DEFAULT 5 NOT NULL,
    overall_score NUMERIC(4,2) DEFAULT 5.00 NOT NULL,
    allocated_budget NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    created_by UUID REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_projects_tenant ON projects(tenant_id);

-- ==========================================
-- 3. THE MODULAR FEATURE TOGGLES TABLE
-- ==========================================

CREATE TABLE project_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    feature VARCHAR(50) NOT NULL, -- canvas, business_case, budget, gantt, risks
    enabled BOOLEAN DEFAULT TRUE NOT NULL,
    CONSTRAINT uq_project_feature UNIQUE(project_id, feature)
);

CREATE INDEX idx_features_tenant ON project_features(tenant_id);

-- ==========================================
-- 4. MODULAR DATA TABLES (UPSTREAM & DOWNSTREAM)
-- ==========================================

CREATE TABLE project_canvas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID UNIQUE REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    purpose TEXT,
    target_audience TEXT,
    channels TEXT,
    relations TEXT,
    key_activities TEXT,
    key_partners TEXT,
    cost_structure TEXT,
    expected_benefits TEXT
);

CREATE TABLE project_business_case (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID UNIQUE REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    problem_statement TEXT,
    solution_proposed TEXT,
    expected_benefits TEXT,
    return_on_investment TEXT,
    payback_period_months INT
);

CREATE TABLE project_budget_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(20) NOT NULL, -- CAPEX, OPEX
    category VARCHAR(100) NOT NULL,
    description TEXT,
    baseline_cost NUMERIC(12,2) NOT NULL,
    actual_cost NUMERIC(12,2) DEFAULT 0.00 NOT NULL
);

CREATE TABLE project_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'NOT_STARTED' NOT NULL, -- NOT_STARTED, IN_PROGRESS, COMPLETED
    progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100) NOT NULL
);

CREATE TABLE project_risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    category VARCHAR(50) NOT NULL, -- Strategic, Financial, Technical, Operational
    description TEXT NOT NULL,
    probability INT CHECK (probability >= 1 AND probability <= 5) NOT NULL,
    impact INT CHECK (impact >= 1 AND impact <= 5) NOT NULL,
    mitigation_plan TEXT
);

-- ==========================================
-- 5. ROW-LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Step A: Enable Row Level Security (RLS) on all B2B tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_canvas ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_business_case ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_budget_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_risks ENABLE ROW LEVEL SECURITY;

-- Step B: Define policy utilizing application context set at connection time (or JWT claim)
-- We fetch current context tenant id using 'app.current_tenant_id' in standard Cloud PostgreSQL / RDS

-- RLS for projects table
CREATE POLICY tenant_isolation_on_projects ON projects
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

-- RLS for other tables
CREATE POLICY tenant_isolation_on_users ON users
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_on_features ON project_features
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_on_canvas ON project_canvas
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_on_business_case ON project_business_case
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_on_budget ON project_budget_lines
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_on_milestones ON project_milestones
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_on_risks ON project_risks
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
`;
