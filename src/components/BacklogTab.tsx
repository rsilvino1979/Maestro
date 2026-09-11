import React, { useState } from 'react';
import { Project } from '../types';
import { 
  Search, Filter, Download, LayoutGrid, List, Sliders, CheckSquare, 
  Trash2, Edit2, Play, AlertCircle, Calendar, Briefcase, Sparkles, Check, X, ShieldAlert 
} from 'lucide-react';

interface BacklogTabProps {
  projects: Project[];
  configAreasAtendidas: string[];
  configPilares: string[];
  userRole: string;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onApprove: (project: Project, allocatedBudget: number) => void;
}

export default function BacklogTab({
  projects,
  configAreasAtendidas,
  configPilares,
  userRole,
  onEdit,
  onDelete,
  onApprove
}: BacklogTabProps) {
  
  // Local backlogs filters
  const [searchQuery, setSearchQuery] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [pillarFilter, setPillarFilter] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list');
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  // States for multiselection and resizable columns
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    select: 40,
    demandId: 85,
    name: 240,
    score: 90,
    client: 120,
    portfolio: 120,
    segments: 140,
    requestingDept: 140,
    strategicPillar: 140,
    desiredBudget: 125,
    sponsor: 120,
    beneficiaries: 130,
    actions: 140
  });

  const startResize = (e: React.MouseEvent, column: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columnWidths[column] || 100;

    const doDrag = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      setColumnWidths(prev => ({
        ...prev,
        [column]: Math.max(30, startWidth + deltaX)
      }));
    };

    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  };

  // States for localized approval popups
  const [approvingItem, setApprovingItem] = useState<Project | null>(null);
  const [approvedBudget, setApprovedBudget] = useState<number>(85000);

  // Togglable field visibility settings
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({
    demandId: true,
    name: true,
    score: true,
    client: true,
    portfolio: true,
    segments: true,
    requestingDept: true,
    strategicPillar: true,
    desiredBudget: true,
    sponsor: true,
    beneficiaries: true,
    involvedAreas: true,
    createdAt: true
  });

  const canApprove = userRole !== 'TEAM_MEMBER' && userRole !== 'PROJECT_MANAGER';

  // Extract intake only
  const backlogProjects = projects.filter(p => p.status === 'INTAKE');

  // Filter logic
  const filteredBacklog = backlogProjects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArea = areaFilter === '' || p.requestingDept === areaFilter;
    const matchesPillar = pillarFilter === '' || p.strategicPillar === pillarFilter;
    return matchesSearch && matchesArea && matchesPillar;
  });

  // Export to Excel-compatible CSV list helper
  const handleExportCSV = () => {
    if (filteredBacklog.length === 0) {
      alert('Não há itens exibidos sob os filtros atuais para exportação.');
      return;
    }

    const headers = [
      'ID Demanda', 'Nome da Demanda', 'Pontuação VMO', 'Resumo Escopo', 
      'Cliente', 'Portfólio', 'Segmentos', 'Área Solicitante', 'Pilar Estratégico', 'Orçamento Pretendido', 
      'Sponsor', 'Área Demandante', 'Áreas Envolvidas', 'Data de Criação'
    ];
    
    const rows = filteredBacklog.map(p => [
      p.demandId ? `#${p.demandId}` : '',
      p.name,
      p.prioritizationScores.overallScore.toFixed(2),
      p.description.replace(/"/g, '""'),
      p.client || '',
      p.portfolio || '',
      (p.segments || []).join('; '),
      p.requestingDept || '',
      p.strategicPillar || '',
      p.desiredBudget ? `R$ ${p.desiredBudget.toLocaleString('pt-BR')}` : 'R$ 0',
      p.sponsor || '',
      p.beneficiaries || '',
      (p.involvedAreas || []).join('; '),
      new Date(p.createdAt).toLocaleDateString('pt-BR')
    ]);

    // Build the CSV adding the UTF-8 BOM byte sequence so Excel auto-recognizes Portuguese characters
    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += headers.map(h => `"${h}"`).join(',') + '\n';
    rows.forEach(r => {
      csvContent += r.map(val => `"${val}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `VMO_Backlog_Intake_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerApproval = (project: Project) => {
    if (!canApprove) {
      alert('Acesso Negado: Membros de equipe ou gerentes de projetos comuns não têm privilégios de comitê para aprovar demandas.');
      return;
    }
    setApprovingItem(project);
    setApprovedBudget(project.desiredBudget || 65000);
  };

  const confirmApproval = () => {
    if (!approvingItem) return;
    onApprove(approvingItem, approvedBudget);
    setApprovingItem(null);
  };

  return (
    <div className="space-y-6" id="backlog-tab-wrapper">
      
      {/* 1. FILTERS & HEADER UTILITY HUD */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg shrink-0">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-base font-bold text-slate-100 font-display">Backlog do Upstream</h1>
              <p className="text-xs text-slate-400">Listagem consolidada de todas as demandas em fase de <strong>INTAKE</strong> para priorização.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* View Mode Switcher */}
            <div className="bg-slate-950 p-1 border border-slate-800 rounded-lg flex items-center gap-0.5">
              <button
                onClick={() => setViewMode('card')}
                className={`p-1.5 px-3 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                  viewMode === 'card' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-450 hover:text-slate-200'
                }`}
                title="Modo Card"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 px-3 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                  viewMode === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-450 hover:text-slate-200'
                }`}
                title="Modo Lista"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabela</span>
              </button>
            </div>

            {/* Toggle Columns visibility configurator */}
            <button
              onClick={() => setIsCustomizeOpen(!isCustomizeOpen)}
              className={`p-2 px-3 bg-slate-950 border border-slate-800 text-slate-350 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                isCustomizeOpen ? 'bg-slate-850 border-slate-700 text-slate-150' : ''
              }`}
            >
              <Sliders className="w-4 h-4 text-indigo-400" />
              Campos Exibidos
            </button>

            {/* Download Excel helper */}
            <button
              onClick={handleExportCSV}
              className="p-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow"
            >
              <Download className="w-4 h-4" />
              Exportar p/ Excel
            </button>
          </div>
        </div>

        {/* Dynamic Personalize Field Columns collapsing wrapper */}
        {isCustomizeOpen && (
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 animate-fade-in space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase text-indigo-400 block tracking-wide">Marque os campos que deseja visualizar:</span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 pt-1 text-xs">
              {Object.keys(visibleFields).map((field) => {
                const labelsMap: Record<string, string> = {
                  demandId: 'ID Demanda',
                  name: 'Nome Inteligente',
                  score: 'Score Priorizado',
                  client: 'Cliente',
                  portfolio: 'Portfólio',
                  segments: 'Segmentos',
                  requestingDept: 'Área Solicitante',
                  strategicPillar: 'Pilar Estratégico',
                  desiredBudget: 'CapEx Pretendido',
                  sponsor: 'Patrocinador',
                  beneficiaries: 'Área Demandante',
                  involvedAreas: 'Outras Áreas',
                  createdAt: 'Data Cadastro'
                };
                return (
                  <label key={field} className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
                    <input
                      type="checkbox"
                      checked={visibleFields[field]}
                      onChange={(e) => setVisibleFields(prev => ({ ...prev, [field]: e.target.checked }))}
                      className="accent-indigo-505 w-4 h-4 rounded text-indigo-600 bg-slate-900 border-none cursor-pointer"
                    />
                    <span>{labelsMap[field] || field}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Bulk operations bar */}
        {selectedProjectIds.length > 0 && (
          <div className="bg-slate-900 border-2 border-indigo-500/30 p-3.5 rounded-xl flex flex-col md:flex-row justify-between items-center gap-3 animate-fade-in shadow-xl mb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
              </span>
              <span className="text-xs font-mono text-slate-200">
                <strong className="text-indigo-400 font-extrabold text-sm">{selectedProjectIds.length}</strong> demanda(s) selecionada(s)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Deseja excluir ${selectedProjectIds.length} demanda(s) selecionada(s)?`)) {
                    selectedProjectIds.forEach(id => onDelete(id));
                    setSelectedProjectIds([]);
                  }
                }}
                className="bg-rose-600/90 hover:bg-rose-500 text-white font-extrabold text-[10px] uppercase font-mono tracking-wider py-1.5 px-3 rounded-lg cursor-pointer transition-all flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir Selecionadas
              </button>
              <button
                type="button"
                onClick={() => setSelectedProjectIds([])}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] py-1.5 px-3 rounded-lg cursor-pointer transition-all border border-slate-700"
              >
                Desmarcar Todas
              </button>
            </div>
          </div>
        )}

        {/* 2. REALTIME FILTER CONTROLS COLUMN ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950/40 p-3.5 rounded-lg border border-slate-850">
          
          {/* General Text search query */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Pesquisar por título de demanda, escopo, etc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-505 hover:border-slate-700 pl-9 p-2 rounded text-xs text-slate-200 outline-none"
            />
          </div>

          {/* Area solicitante drop */}
          <div>
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 p-2 rounded text-xs text-slate-300 cursor-pointer outline-none"
            >
              <option value="">Todas áreas solicitantes</option>
              {configAreasAtendidas.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Pillar estrategico drop */}
          <div>
            <select
              value={pillarFilter}
              onChange={(e) => setPillarFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 p-2 rounded text-xs text-slate-300 cursor-pointer outline-none"
            >
              <option value="">Todos pilares estratégicos</option>
              {configPilares.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* 3. VISUALS REPRESENTATION CONTAINER: CARD VS LIST */}
      {filteredBacklog.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-12 rounded-xl text-center space-y-3">
          <div className="w-12 h-12 bg-slate-950 text-slate-500 rounded-full flex items-center justify-center mx-auto border border-slate-800">
            <AlertCircle className="w-6 h-6 text-amber-500" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-sm font-semibold text-slate-200">Nenhum Registro Encontrado</h3>
            <p className="text-xs text-slate-400 mt-1">Nenhuma iniciativa em Intake (Upstream) atende aos critérios dos filtros de cabeçalho definidos atualmente.</p>
          </div>
        </div>
      ) : viewMode === 'card' ? (
        
        // CARD DETAILED GRID LAYOUT VIEW
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBacklog.map((p) => {
            return (
              <div 
                key={p.id} 
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-md flex flex-col justify-between gap-4 transition-all"
              >
                <div className="space-y-3.5">
                  
                  {/* Top line ID + Score ticker */}
                  <div className="flex justify-between items-start gap-1 pb-2 border-b border-slate-800/40">
                    <div className="flex items-center gap-2">
                      {visibleFields.demandId && (
                        <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-mono text-[10.5px] font-extrabold p-1 leading-none shadow">
                          #{p.demandId || 'INTAKE'}
                        </span>
                      )}
                      {visibleFields.createdAt && (
                        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>

                    {visibleFields.score && (
                      <div className="flex items-center gap-1.5 bg-slate-955 px-2 py-1 border border-slate-800 rounded font-mono">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">VMO Score:</span>
                        <span className="font-extrabold text-xs text-violet-400">{p.prioritizationScores.overallScore.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {visibleFields.name && (
                      <h3 className="font-bold text-slate-100 text-xs tracking-tight font-display line-clamp-2 leading-tight">
                        {p.name}
                      </h3>
                    )}
                    <p className="text-[11px] text-slate-400 leading-normal line-clamp-3">
                      {p.description}
                    </p>
                  </div>

                  {/* Metadata keyfields badges container */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/40 rounded-lg border border-slate-850/60 text-[10.5px] leading-snug">
                    
                    {visibleFields.client && (
                      <div>
                        <span className="text-[8.5px] text-slate-500 uppercase font-bold block leading-none mb-1">Cliente</span>
                        <span className="text-slate-200 font-semibold truncate block">{p.client || '---'}</span>
                      </div>
                    )}

                    {visibleFields.portfolio && (
                      <div>
                        <span className="text-[8.5px] text-slate-500 uppercase font-bold block leading-none mb-1">Portfólio</span>
                        <span className="text-indigo-300 font-semibold truncate block">{p.portfolio || '---'}</span>
                      </div>
                    )}

                    {visibleFields.requestingDept && (
                      <div>
                        <span className="text-[8.5px] text-slate-500 uppercase font-bold block leading-none mb-1">Área Solicitante</span>
                        <span className="text-slate-300 font-semibold truncate block">{p.requestingDept || 'Não Informado'}</span>
                      </div>
                    )}

                    {visibleFields.strategicPillar && (
                      <div>
                        <span className="text-[8.5px] text-slate-500 uppercase font-bold block leading-none mb-1">Pilar Principal</span>
                        <span className="text-slate-300 font-semibold truncate block">{p.strategicPillar || 'Operações'}</span>
                      </div>
                    )}

                    {visibleFields.segments && p.segments && p.segments.length > 0 && (
                      <div className="col-span-2 border-t border-slate-900 pt-1.5 mt-1">
                        <span className="text-[8.5px] text-slate-505 uppercase font-bold block leading-none mb-1">Segmentos de Negócio</span>
                        <div className="flex flex-wrap gap-1">
                          {p.segments.map(s => (
                            <span key={s} className="bg-slate-900 text-indigo-300 px-1.5 py-0.5 rounded text-[9.5px] border border-slate-800 font-mono">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {visibleFields.desiredBudget && (
                      <div>
                        <span className="text-[8.5px] text-slate-500 uppercase font-bold block leading-none mb-1">Budget Pretendido</span>
                        <span className="text-emerald-400 font-bold font-mono">
                          R$ {(p.desiredBudget || 0).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    )}

                    {visibleFields.sponsor && (
                      <div>
                        <span className="text-[8.5px] text-slate-500 uppercase font-bold block leading-none mb-1">Patrocinador (Sponsor)</span>
                        <span className="text-slate-300 font-medium truncate block">{p.sponsor || 'Geral'}</span>
                      </div>
                    )}

                    {visibleFields.beneficiaries && (
                      <div className="col-span-2 border-t border-slate-900 pt-1.5 mt-1">
                        <span className="text-[8.5px] text-slate-505 uppercase font-bold block leading-none mb-1">Área demandante</span>
                        <span className="text-slate-350 line-clamp-1 block">{p.beneficiaries || 'Toda a corporação'}</span>
                      </div>
                    )}

                    {visibleFields.involvedAreas && p.involvedAreas && p.involvedAreas.length > 0 && (
                      <div className="col-span-2 pt-1 border-t border-slate-900/60 flex flex-wrap gap-1">
                        <span className="text-[8.5px] text-slate-505 uppercase font-bold block leading-none mb-1 w-full">Áreas Envolvidas</span>
                        {p.involvedAreas.map(a => (
                          <span key={a} className="bg-slate-900 text-slate-350 px-1.5 py-0.2 rounded text-[9.5px] border border-slate-800 font-medium truncate max-w-[120px]" title={a}>
                            {a}
                          </span>
                        ))}
                      </div>
                    )}

                  </div>

                </div>

                {/* Card Operations Footer Panel */}
                <div className="pt-3.5 border-t border-slate-850 flex justify-between items-center bg-slate-900 mt-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(p)}
                      className="p-1 px-2.5 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-350 hover:text-slate-100 rounded text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                      Editar
                    </button>
                    <button
                      onClick={() => onDelete(p.id)}
                      className="p-1 px-2 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Apagar
                    </button>
                  </div>

                  <button
                    onClick={() => triggerApproval(p)}
                    className="p-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white hover:text-indigo-100 font-bold text-[11px] rounded transition-all shadow flex items-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3 h-3 text-emerald-300" />
                    Aprovar Demanda
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        
        // COMPACT SPREADSHEET-LIKE ROW LIST VIEW
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-left text-slate-300 divide-y divide-slate-800 table-fixed">
              <thead className="bg-slate-950/40 text-[9px] uppercase tracking-wider text-slate-500 font-mono select-none">
                <tr>
                  <th className="p-3.5 relative text-center" style={{ width: `${columnWidths.select || 40}px` }}>
                    <input 
                      type="checkbox"
                      checked={filteredBacklog.length > 0 && selectedProjectIds.length === filteredBacklog.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProjectIds(filteredBacklog.map(p => p.id));
                        } else {
                          setSelectedProjectIds([]);
                        }
                      }}
                      className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5"
                    />
                    <div 
                      onMouseDown={(e) => startResize(e, 'select')} 
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors z-10"
                      title="Arraste para redimensionar"
                    />
                  </th>

                  {visibleFields.demandId && (
                    <th className="p-3.5 relative" style={{ width: `${columnWidths.demandId || 85}px` }}>
                      <span>ID</span>
                      <div 
                        onMouseDown={(e) => startResize(e, 'demandId')} 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors z-10"
                        title="Arraste para redimensionar"
                      />
                    </th>
                  )}

                  {visibleFields.name && (
                    <th className="p-3.5 relative" style={{ width: `${columnWidths.name || 240}px` }}>
                      <span>Nome / Iniciativa</span>
                      <div 
                        onMouseDown={(e) => startResize(e, 'name')} 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors z-10"
                        title="Arraste para redimensionar"
                      />
                    </th>
                  )}

                  {visibleFields.score && (
                    <th className="p-3.5 text-center relative" style={{ width: `${columnWidths.score || 90}px` }}>
                      <span>Score VMO</span>
                      <div 
                        onMouseDown={(e) => startResize(e, 'score')} 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors z-10"
                        title="Arraste para redimensionar"
                      />
                    </th>
                  )}

                  {visibleFields.client && (
                    <th className="p-3.5 relative" style={{ width: `${columnWidths.client || 120}px` }}>
                      <span>Cliente</span>
                      <div 
                        onMouseDown={(e) => startResize(e, 'client')} 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors z-10"
                        title="Arraste para redimensionar"
                      />
                    </th>
                  )}

                  {visibleFields.portfolio && (
                    <th className="p-3.5 relative" style={{ width: `${columnWidths.portfolio || 120}px` }}>
                      <span>Portfólio</span>
                      <div 
                        onMouseDown={(e) => startResize(e, 'portfolio')} 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors z-10"
                        title="Arraste para redimensionar"
                      />
                    </th>
                  )}

                  {visibleFields.segments && (
                    <th className="p-3.5 relative" style={{ width: `${columnWidths.segments || 140}px` }}>
                      <span>Segmentos</span>
                      <div 
                        onMouseDown={(e) => startResize(e, 'segments')} 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors z-10"
                        title="Arraste para redimensionar"
                      />
                    </th>
                  )}

                  {visibleFields.requestingDept && (
                    <th className="p-3.5 relative" style={{ width: `${columnWidths.requestingDept || 140}px` }}>
                      <span>Área Solicitante</span>
                      <div 
                        onMouseDown={(e) => startResize(e, 'requestingDept')} 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors z-10"
                        title="Arraste para redimensionar"
                      />
                    </th>
                  )}

                  {visibleFields.strategicPillar && (
                    <th className="p-3.5 relative" style={{ width: `${columnWidths.strategicPillar || 140}px` }}>
                      <span>Pilar Estratégico</span>
                      <div 
                        onMouseDown={(e) => startResize(e, 'strategicPillar')} 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors z-10"
                        title="Arraste para redimensionar"
                      />
                    </th>
                  )}

                  {visibleFields.desiredBudget && (
                    <th className="p-3.5 relative" style={{ width: `${columnWidths.desiredBudget || 125}px` }}>
                      <span>CapEx Pretendido</span>
                      <div 
                        onMouseDown={(e) => startResize(e, 'desiredBudget')} 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors z-10"
                        title="Arraste para redimensionar"
                      />
                    </th>
                  )}

                  {visibleFields.sponsor && (
                    <th className="p-3.5 relative" style={{ width: `${columnWidths.sponsor || 120}px` }}>
                      <span>Sponsor</span>
                      <div 
                        onMouseDown={(e) => startResize(e, 'sponsor')} 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors z-10"
                        title="Arraste para redimensionar"
                      />
                    </th>
                  )}

                  {visibleFields.beneficiaries && (
                    <th className="p-3.5 relative" style={{ width: `${columnWidths.beneficiaries || 130}px` }}>
                      <span>Área demandante</span>
                      <div 
                        onMouseDown={(e) => startResize(e, 'beneficiaries')} 
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors z-10"
                        title="Arraste para redimensionar"
                      />
                    </th>
                  )}

                  <th className="p-3.5 text-right relative" style={{ width: `${columnWidths.actions || 140}px` }}>
                    <span>Ações de Gestão</span>
                    <div 
                      onMouseDown={(e) => startResize(e, 'actions')} 
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors z-10"
                      title="Arraste para redimensionar"
                    />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 bg-slate-900/30">
                {filteredBacklog.map((p) => {
                  const isChecked = selectedProjectIds.includes(p.id);
                  return (
                    <tr key={p.id} className={`hover:bg-slate-850/30 transition-colors ${isChecked ? 'bg-indigo-950/20' : ''}`}>
                      <td className="p-3.5 text-center">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProjectIds(prev => [...prev, p.id]);
                            } else {
                              setSelectedProjectIds(prev => prev.filter(id => id !== p.id));
                            }
                          }}
                          className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-3.5 h-3.5"
                        />
                      </td>
                      {visibleFields.demandId && (
                        <td className="p-3.5 font-mono text-indigo-400 font-semibold select-all">
                          #{p.demandId || 'INT'}
                        </td>
                      )}
                      
                      {visibleFields.name && (
                        <td className="p-3.5 max-w-[240px]">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-100 text-xs block leading-snug line-clamp-1">{p.name}</span>
                            <span className="text-[10px] text-slate-500 truncate block">{p.description}</span>
                          </div>
                        </td>
                      )}

                      {visibleFields.score && (
                        <td className="p-3.5 text-center font-mono font-extrabold text-xs text-violet-400">
                          {p.prioritizationScores.overallScore.toFixed(2)}
                        </td>
                      )}

                      {visibleFields.client && (
                        <td className="p-3.5 truncate font-medium text-slate-200">
                          {p.client || '---'}
                        </td>
                      )}

                      {visibleFields.portfolio && (
                        <td className="p-3.5 truncate font-medium text-indigo-300">
                          {p.portfolio || '---'}
                        </td>
                      )}

                      {visibleFields.segments && (
                        <td className="p-3.5 text-slate-350 max-w-[150px]">
                          {p.segments && p.segments.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {p.segments.map(seg => (
                                <span key={seg} className="bg-slate-950 px-1.5 py-0.5 rounded text-[9.5px] border border-slate-800 font-mono text-indigo-300">
                                  {seg}
                                </span>
                              ))}
                            </div>
                          ) : '---'}
                        </td>
                      )}

                      {visibleFields.requestingDept && (
                        <td className="p-3.5 truncate font-medium text-slate-300">
                          {p.requestingDept}
                        </td>
                      )}

                      {visibleFields.strategicPillar && (
                        <td className="p-3.5 truncate text-slate-400">
                          {p.strategicPillar}
                        </td>
                      )}

                      {visibleFields.desiredBudget && (
                        <td className="p-3.5 text-emerald-400 font-mono font-bold">
                          R$ {(p.desiredBudget || 0).toLocaleString('pt-BR')}
                        </td>
                      )}

                      {visibleFields.sponsor && (
                        <td className="p-3.5 text-slate-400">
                          {p.sponsor || '---'}
                        </td>
                      )}

                      {visibleFields.beneficiaries && (
                        <td className="p-3.5 text-slate-405 truncate max-w-[140px]">
                          {p.beneficiaries || '---'}
                        </td>
                      )}

                      <td className="p-3.5 text-right shrink-0">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => onEdit(p)}
                            className="p-1 px-1.5 bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800 transition cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                          </button>
                          <button
                            onClick={() => onDelete(p.id)}
                            className="p-1 px-1.5 text-rose-500 hover:bg-rose-500/10 rounded transition cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => triggerApproval(p)}
                            className="p-1 px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded flex items-center gap-0.5 shadow transition cursor-pointer"
                            title="Aprovar Projeto"
                          >
                            <Play className="w-3 h-3 text-emerald-300" />
                            Aprovar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== 4. COMMITTEE ROAD-APPROVAL MODAL POPUP ==================== */}
      {approvingItem && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-4">
            
            <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-800">
              <span className="p-2 bg-indigo-600/10 text-indigo-400 rounded-lg">
                <CheckSquare className="w-5 h-5 text-indigo-400" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Aprovação de Iniciativa VMO</h3>
                <p className="text-[10px] text-slate-500">Fluxo de transação Upstream → Downstream ativo</p>
              </div>
            </div>

            <div className="bg-amber-500/5 p-3 rounded-lg border border-amber-500/10 flex items-start gap-2.5 text-amber-400">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="block text-[11px] leading-tight">Você está prestes a aprovar uma demanda!</strong>
                <p className="text-[10.5px] text-slate-400 leading-normal">
                  Uma vez aprovado, o item sai da listagem do Backlog de Intake e é disponibilizado no portfólio de projetos ativos sob execução em tempo real.
                </p>
              </div>
            </div>

            <div className="space-y-1 pt-1.5">
              <span className="text-[9px] uppercase font-mono tracking-wider font-extrabold text-slate-450 block">Iniciativa Selecionada</span>
              <p className="font-bold text-slate-205 leading-snug font-sans">
                {approvingItem.name}
              </p>
              <div className="flex justify-between items-center text-[10.5px] text-slate-450 font-mono pt-1">
                <span>VMO Score Priorizado:</span>
                <strong className="text-indigo-400 font-bold">{approvingItem.prioritizationScores.overallScore.toFixed(2)} / 10</strong>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-450 block">Definir Orçamento Autorizado Downstream (R$)</label>
              <input
                type="number"
                min="0"
                value={approvedBudget}
                onChange={(e) => setApprovedBudget(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-505 p-2.5 rounded font-mono font-bold text-emerald-400 text-xs"
              />
              <span className="text-[10px] text-slate-500 italic block mt-1">Sugerido / Pretendido: R$ {(approvingItem.desiredBudget || 0).toLocaleString('pt-BR')}</span>
            </div>

            <div className="flex gap-2.5 pt-4 border-t border-slate-800 justify-end">
              <button
                type="button"
                onClick={confirmApproval}
                className="p-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs tracking-tight transition"
              >
                Aprovar & Iniciar Execução (R$ {approvedBudget.toLocaleString('pt-BR')})
              </button>
              <button
                type="button"
                onClick={() => setApprovingItem(null)}
                className="p-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg text-xs"
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
