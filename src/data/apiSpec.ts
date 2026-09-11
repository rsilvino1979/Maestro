export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  category: 'Tenancy' | 'Prioritization' | 'Features' | 'Upstream' | 'Downstream';
  description: string;
  headers: Record<string, string>;
  requestBody?: string;
  responseBody: string;
}

export const API_ENDPOINTS: ApiEndpoint[] = [
  {
    method: 'GET',
    path: '/api/v1/projects',
    category: 'Upstream',
    description: 'Retrieves all projects for the authenticated tenant. Implicitly applies PostgreSQL Session-level RLS based on the active Tenant context header.',
    headers: {
      'Authorization': 'Bearer <JWT_TOKEN>',
      'X-Tenant-ID': '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
    },
    responseBody: `[
  {
    "id": "project_01",
    "tenantId": "tenant_techstart",
    "name": "Expansão de Infraestrutura Nuvem",
    "description": "Portabilidade e escala do cluster Core...",
    "status": "INTAKE",
    "createdBy": "user_pmo_01",
    "createdAt": "2026-06-01T10:00:00Z",
    "prioritizationScores": {
      "alignment": 8,
      "value": 7,
      "urgency": 9,
      "complexity": 6,
      "overallScore": 7.45
    },
    "features": {
      "canvas": true,
      "business_case": true,
      "budget": false,
      "gantt": false,
      "risks": false
    }
  }
]`
  },
  {
    method: 'POST',
    path: '/api/v1/projects/intake',
    category: 'Upstream',
    description: 'Creates a new item in the Intake Portal (Upstream Pipeline). Sets initial criteria ratings and computes weighted prioritization scores.',
    headers: {
      'Authorization': 'Bearer <JWT_TOKEN>',
      'Content-Type': 'application/json',
      'X-Tenant-ID': '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
    },
    requestBody: `{
  "name": "Automatização de Cobrança B2B",
  "description": "Sistema integrado de faturamento recorrente para clientes enterprise.",
  "scores": {
    "alignment": 9,
    "value": 8,
    "urgency": 7,
    "complexity": 5
  }
}`,
    responseBody: `{
  "success": true,
  "projectId": "proj_auto_billing_102",
  "data": {
    "id": "proj_auto_billing_102",
    "tenantId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "name": "Automatização de Cobrança B2B",
    "status": "INTAKE",
    "prioritizationScores": {
      "alignment": 9,
      "value": 8,
      "urgency": 7,
      "complexity": 5,
      "overallScore": 7.65
    }
  }
}`
  },
  {
    method: 'PATCH',
    path: '/api/v1/projects/:projectId/features',
    category: 'Features',
    description: 'Updates active SaaS feature toggles for a specific project. Controls structural elements visible via Progressive Disclosure on client UI.',
    headers: {
      'Authorization': 'Bearer <JWT_TOKEN>',
      'Content-Type': 'application/json'
    },
    requestBody: `{
  "features": {
    "canvas": true,
    "business_case": true,
    "budget": true,
    "gantt": true,
    "risks": false
  }
}`,
    responseBody: `{
  "projectId": "project_01",
  "featuresUpdated": {
    "canvas": true,
    "business_case": true,
    "budget": true,
    "gantt": true,
    "risks": false
  }
}`
  },
  {
    method: 'POST',
    path: '/api/v1/projects/:projectId/approve',
    category: 'Downstream',
    description: 'Promotes an Intake item (Upstream) to Active execution (Downstream). Enforces that no historical prioritization metadata, Canvas data, or Business Case parameters are lost in the transaction.',
    headers: {
      'Authorization': 'Bearer <JWT_TOKEN>',
      'Content-Type': 'application/json'
    },
    requestBody: `{
  "allocatedBudget": 85000.00
}`,
    responseBody: `{
  "projectId": "project_01",
  "oldStatus": "INTAKE",
  "newStatus": "ACTIVE",
  "allocatedBudget": 85000,
  "approvedAt": "2026-06-09T01:38:00Z",
  "preservedMetadata": {
    "prioritizationScores": {
      "alignment": 8,
      "value": 7,
      "overallScore": 7.45
    }
  }
}`
  },
  {
    method: 'PUT',
    path: '/api/v1/projects/:projectId/canvas',
    category: 'Downstream',
    description: 'Updates the Lean Project Canvas document associated with an active project. Governed by Feature Toggle authorization (active "canvas" toggle required).',
    headers: {
      'Authorization': 'Bearer <JWT_TOKEN>',
      'Content-Type': 'application/json'
    },
    requestBody: `{
  "purpose": "Aumentar a vazão de transações em 400%",
  "targetAudience": "Adquirentes e Gateways de pagamento",
  "channels": "Plataforma SaaS, API RESTful",
  "customerRelations": "Self-service e SLAs dedicados",
  "keyActivities": "Refactoring de Workers, Migração de Redis",
  "keyPartners": "AWS, Stripe Integration Team",
  "costStructure": "Infraestrutura Kubernetes, Licenças Bancárias",
  "expectedBenefitsValue": "Redução do churn de checkout e aumento da estabilidade"
}`,
    responseBody: `{
  "success": true,
  "projectId": "project_01",
  "updatedCanvas": {
    "purpose": "Aumentar a vazão de transações em 400%",
    "updatedAt": "2026-06-09T01:38:00Z"
  }
}`
  },
  {
    method: 'POST',
    path: '/api/v1/projects/:projectId/budget',
    category: 'Downstream',
    description: 'Appends a CapEx or OpEx financial transaction item. Track Baseline and Real-time costs. Fails if "budget" feature toggle is disabled.',
    headers: {
      'Authorization': 'Bearer <JWT_TOKEN>',
      'Content-Type': 'application/json'
    },
    requestBody: `{
  "type": "CAPEX",
  "category": "Licenciamento & Cloud Software",
  "description": "Contrato Anual Cluster Enterprise AWS",
  "baselineCost": 45000.00,
  "actualCost": 42000.00
}`,
    responseBody: `{
  "success": true,
  "budgetLineId": "line_910",
  "projectId": "project_01"
}`
  },
  {
    method: 'PUT',
    path: '/api/v1/projects/:projectId/prioritize',
    category: 'Prioritization',
    description: 'Recalculates prioritize metric weights and stores scores. Restricted to Tenant Admin or Portfolio Manager roles (RBAC).',
    headers: {
      'Authorization': 'Bearer <JWT_TOKEN>',
      'Content-Type': 'application/json'
    },
    requestBody: `{
  "scores": {
    "alignment": 9,
    "value": 10,
    "urgency": 8,
    "complexity": 7
  }
}`,
    responseBody: `{
  "projectId": "project_01",
  "scoresUpdated": {
    "alignment": 9,
    "value": 10,
    "urgency": 8,
    "complexity": 7,
    "overallScore": 8.75
  }
}`
  }
];
