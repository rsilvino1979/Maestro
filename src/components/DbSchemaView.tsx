import React, { useState } from 'react';
import { PRISMA_SCHEMA, POSTGRES_SQL_DDL } from '../data/dbSchema';
import { Tenant, Persona } from '../types';
import { Database, ShieldAlert, Code, Check, Copy, Terminal, KeyRound } from 'lucide-react';

interface DbSchemaViewProps {
  currentTenant: Tenant;
  currentPersona: Persona;
}

export default function DbSchemaView({ currentTenant, currentPersona }: DbSchemaViewProps) {
  const [activeTab, setActiveTab] = useState<'prism' | 'sql' | 'rls'>('rls');
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedSimQuery, setSelectedSimQuery] = useState<number>(0);
  const [sessionTenantContext, setSessionTenantContext] = useState<string>(currentTenant.id);

  // Auto-sync state context with top-bar tenant changes for realism
  React.useEffect(() => {
    setSessionTenantContext(currentTenant.id);
  }, [currentTenant]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => {
      setCopied(null);
    }, 2000);
  };

  const sqlMocks = [
    {
      id: 1,
      title: 'Acessar Projetos do Meu Tenant',
      sql: `SET app.current_tenant_id = '${sessionTenantContext}';\nSELECT * FROM projects;`,
      explanation: 'Esta query simula a sessão do usuário ativo. A política RLS filtra implicitamente, retornando apenas os projetos cujos tenant_id coincidem com as credenciais.',
      result: `-- STATUS: 200 OK (Row-Level Security: ALLOWED)
-- Linhas retornadas filtradas por tenant_id = '${sessionTenantContext}'
[
  { "id": "proj_tech_1", "tenant_id": "${sessionTenantContext}", "name": "Upgrade K8s Cloud Core", "overall_score": 8.00 },
  { "id": "proj_tech_2", "tenant_id": "${sessionTenantContext}", "name": "Portal do Desenvolvedor Dx", "overall_score": 7.00 },
  { "id": "proj_tech_3", "tenant_id": "${sessionTenantContext}", "name": "Antifraude Machine Learning", "overall_score": 8.55 }
]`
    },
    {
      id: 2,
      title: 'Tentativa de Hackear outro Tenant',
      sql: `SET app.current_tenant_id = '${sessionTenantContext}';\n-- Tentativa de forçar o acesso a ID de outro cliente:\nSELECT * FROM projects WHERE tenant_id = '${sessionTenantContext === 'tenant_techstart' ? 'tenant_growthcorp' : 'tenant_techstart'}';`,
      explanation: 'Mesmo especificando o ID de outro tenant explicitamente no WHERE, a política RLS intercepta a nível de kernel de banco de dados e limpa os registros. Nenhuma linha é exposta!',
      result: `-- STATUS: 200 OK (Row-Level Security: COMPLETED)
-- Linhas retornadas: 0 
-- (O banco interceptou a consulta e retornou uma coleção vazia, impedindo vazamento cruzado!)
[]`
    },
    {
      id: 3,
      title: 'Consulta sem Configurar Sessão (Segurança Total)',
      sql: `-- Esquecimento de setar o cabeçalho de sessão pela aplicação:\nSELECT * FROM projects;`,
      explanation: 'Por padrão, o tenant_id na política é comparado com NULL se a propriedade estiver vazia. Nenhuma informação é exposta caso a aplicação falhe em injetar o Tenant ID.',
      result: `-- STATUS: 200 OK (Row-Level Security: BLOCKED-BY-DEFAULT)
-- Linhas retornadas: 0 
-- Motivo: app.current_tenant_id está indefinido ou nulo.
[]`
    },
    {
      id: 4,
      title: 'Comportamento da Tabela de Usuários (RBAC)',
      sql: `SET app.current_tenant_id = '${sessionTenantContext}';\nSELECT id, name, email, role FROM users;`,
      explanation: 'Demonstra a higienização de utilizadores dentro do mesmo cluster lógico da base. RLS também opera para dados cadastrais delicados.',
      result: `-- STATUS: 200 OK (Row-Level Security: ENFORCED)
-- Tenant Filtrado: '${sessionTenantContext}'
[
  { "id": "user_pmo_01", "name": "Camila Rocha (PMO)", "role": "PORTFOLIO_MANAGER" },
  { "id": "user_pm_02", "name": "Diego Santos (PM)", "role": "PROJECT_MANAGER" }
]`
    }
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl" id="db-schema-module">
      <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
            <Database className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100 font-display">
              Arquitetura de Banco de Dados Multi-Tenant
            </h2>
            <p className="text-xs text-slate-400">
              Isolamento lógico absoluto via Postgres Row-Level Security (RLS) & Prisma Client.
            </p>
          </div>
        </div>
        
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 self-start">
          <button
            onClick={() => setActiveTab('rls')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'rls' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Simulador de RLS SQL
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'sql' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            PostgreSQL DDL DDL
          </button>
          <button
            onClick={() => setActiveTab('prism')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'prism' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-300 hover:text-slate-100'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Prisma Schema
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'rls' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left sidebar select */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-950/45 p-4 rounded-lg border border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                  Sessão Ativa Corrente
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">Tenant Ativo:</span>
                    <span className="font-mono text-indigo-400 font-semibold">{currentTenant.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">UUID de Sessão:</span>
                    <span className="font-mono text-slate-300">{sessionTenantContext}</span>
                  </div>
                  <div className="flex justify-between py-2 items-center">
                    <span className="text-slate-400">Persona RBAC:</span>
                    <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded font-semibold text-[10px]">
                      {currentPersona}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Escolha um Cenário de Consulta SQL
                </label>
                {sqlMocks.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSimQuery(idx)}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex flex-col gap-1 ${
                      selectedSimQuery === idx 
                        ? 'bg-indigo-950/40 border-indigo-500/30 text-slate-100 shadow-lg' 
                        : 'bg-slate-950/20 border-slate-800/80 text-slate-400 hover:bg-slate-800/30'
                    }`}
                  >
                    <span className={`font-semibold ${selectedSimQuery === idx ? 'text-indigo-400' : 'text-slate-300'}`}>
                      {s.title}
                    </span>
                    <span className="text-[11px] text-slate-400 line-clamp-2">
                      {s.explanation}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right editor panel */}
            <div className="lg:col-span-7 flex flex-col h-full bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
              <div className="p-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-xs">
                <span className="font-mono text-indigo-400 flex items-center gap-1.5 font-semibold">
                  <Terminal className="w-3.5 h-3.5" />
                  interactive_query_engine.sql
                </span>
                <button
                  onClick={() => handleCopy(sqlMocks[selectedSimQuery].sql, 'sql')}
                  className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[11px] text-slate-300 hover:text-white transition-all flex items-center gap-1"
                >
                  {copied === 'sql' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied === 'sql' ? 'Copiado!' : 'Copiar'}
                </button>
              </div>

              {/* Code display */}
              <div className="p-4 flex-1 font-mono text-xs overflow-auto bg-slate-950 text-slate-300 min-h-[140px]">
                <pre>{sqlMocks[selectedSimQuery].sql}</pre>
              </div>

              {/* Output log */}
              <div className="bg-slate-950 border-t border-slate-850 p-4 font-mono text-xs">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                  Database Response Console log
                </div>
                <div className="bg-slate-900/80 p-3 rounded border border-slate-800 text-emerald-400 overflow-auto max-h-[220px]">
                  <pre className="text-[11px]">{sqlMocks[selectedSimQuery].result}</pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sql' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded border border-indigo-500/15">
              <p className="text-xs text-slate-400">
                Estrutura relacional DDL nativa para PostgreSQL. Note a diretiva <code className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-indigo-300">ENABLE ROW LEVEL SECURITY</code> que instrui o SGBD a auditar pacotes a nível de tabela baseado no <code className="text-indigo-400">tenant_id</code>.
              </p>
              <button
                onClick={() => handleCopy(POSTGRES_SQL_DDL, 'postgres')}
                className="p-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 shadow"
              >
                {copied === 'postgres' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'postgres' ? 'Copiado!' : 'Copiar DDL Completo'}
              </button>
            </div>
            <div className="bg-slate-950 rounded-lg p-5 border border-slate-850 overflow-auto max-h-[460px]">
              <pre className="font-mono text-[11px] text-slate-300 leading-relaxed">{POSTGRES_SQL_DDL}</pre>
            </div>
          </div>
        )}

        {activeTab === 'prism' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded border border-indigo-500/15">
              <p className="text-xs text-slate-400">
                Representação compacta em Prisma Schema para geração segura de migrações e de tipos em tempo de build. Mapeia chaves de isolamento e conexões de cascata.
              </p>
              <button
                onClick={() => handleCopy(PRISMA_SCHEMA, 'prisma')}
                className="p-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 shadow"
              >
                {copied === 'prisma' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'prisma' ? 'Copiado!' : 'Copiar Prisma Schema'}
              </button>
            </div>
            <div className="bg-slate-950 rounded-lg p-5 border border-slate-850 overflow-auto max-h-[460px]">
              <pre className="font-mono text-[11px] text-indigo-200/90 leading-relaxed">{PRISMA_SCHEMA}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
