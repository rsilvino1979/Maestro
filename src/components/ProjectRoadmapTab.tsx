import React, { useState, useRef } from 'react';
import { Project, RoadmapDeliverable, SubActivity, ReplanningHistoryItem, InterdependenceInfo, User, Persona } from '../types';
import { 
  Calendar, Plus, Upload, Download, History, Edit3, Trash2, CheckCircle2, 
  Clock, AlertTriangle, UserCheck, ShieldAlert, FileSpreadsheet, Eye, 
  X, Check, ArrowRight, RefreshCw, BarChart2, Layers, Link2, ExternalLink,
  GitCommit, HelpCircle, AlertCircle, Ban, ChevronDown, ChevronUp,
  Milestone as MilestoneIcon, ListPlus, CheckSquare, Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ProjectRoadmapTabProps {
  project: Project;
  allProjects?: Project[];
  users?: User[];
  userRole: Persona;
  onUpdateProjectFields: (projectId: string, fields: Partial<Project>) => void;
}

const STANDARD_PHASES = [
  'Iniciação',
  'Planejamento',
  'Desenvolvimento',
  'Homologação / Testes',
  'Go-Live / Implantação',
  'Operação & Sustentação',
  'Outra Fase (Personalizada)'
];

export default function ProjectRoadmapTab({
  project,
  allProjects = [],
  users = [],
  userRole,
  onUpdateProjectFields
}: ProjectRoadmapTabProps) {

  // Current deliverables in the roadmap (fallback to empty array)
  const deliverables: RoadmapDeliverable[] = project.roadmapDeliverables || [];

  // View state
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<string>('ALL');
  const [onlyMilestonesFilter, setOnlyMilestonesFilter] = useState<boolean>(true);

  // WBS / Sub-activities accordion expand state
  const [expandedDeliverables, setExpandedDeliverables] = useState<Record<string, boolean>>({});

  // Sub-activity Modal state
  const [isAddSubModalOpen, setIsAddSubModalOpen] = useState(false);
  const [targetDeliverableForSub, setTargetDeliverableForSub] = useState<RoadmapDeliverable | null>(null);
  const [editingSubActivityId, setEditingSubActivityId] = useState<string | null>(null);
  const [subActivityForm, setSubActivityForm] = useState({
    name: '',
    responsible: '',
    startDate: '',
    endDate: '',
    status: 'NOT_STARTED' as SubActivity['status'],
    progress: 0,
    notes: ''
  });

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isGlobalHistoryOpen, setIsGlobalHistoryOpen] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState<RoadmapDeliverable | null>(null);
  const [viewHistoryDeliverable, setViewHistoryDeliverable] = useState<RoadmapDeliverable | null>(null);

  // Date picker refs
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const endDateInputRef = useRef<HTMLInputElement>(null);

  // Custom phase input state
  const [customPhaseInput, setCustomPhaseInput] = useState('');

  // Manual Form State (New or Edit)
  const [formData, setFormData] = useState({
    name: '',
    responsible: '',
    startDate: '',
    endDate: '',
    status: 'NOT_STARTED' as RoadmapDeliverable['status'],
    progress: 0,
    phase: 'Planejamento',
    isMilestone: true,
    notes: '',
    interdependence: {
      hasInterdependence: false,
      type: 'INTERNAL' as 'INTERNAL' | 'EXTERNAL',
      targetDeliverableId: '',
      targetDeliverableName: '',
      targetProjectId: '',
      targetProjectName: ''
    } as InterdependenceInfo
  });

  // Re-planning warning modal state
  const [isReplanningWarningOpen, setIsReplanningWarningOpen] = useState(false);
  const [pendingSaveDeliverable, setPendingSaveDeliverable] = useState<RoadmapDeliverable | null>(null);
  const [replanningJustification, setReplanningJustification] = useState('');
  const [oldDates, setOldDates] = useState({ startDate: '', endDate: '' });

  // Sub-activity date overflow alert modal state
  const [isSubDateExceededModalOpen, setIsSubDateExceededModalOpen] = useState(false);
  const [pendingSubActivitySave, setPendingSubActivitySave] = useState<{
    targetDeliverable: RoadmapDeliverable;
    updatedSubList: SubActivity[];
    recalculatedDeliverable: RoadmapDeliverable;
  } | null>(null);

  // Upload/Import State
  const [parsedRows, setParsedRows] = useState<Omit<RoadmapDeliverable, 'id' | 'replanningCount'>[]>([]);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [fileName, setFileName] = useState('');

  const canEdit = userRole !== 'TEAM_MEMBER';

  // Compute Statistics for All Statuses
  const totalDeliverables = deliverables.length;
  const milestonesCount = deliverables.filter(d => d.isMilestone !== false).length;
  const notStartedCount = deliverables.filter(d => d.status === 'NOT_STARTED').length;
  const inProgressCount = deliverables.filter(d => d.status === 'IN_PROGRESS').length;
  const completedCount = deliverables.filter(d => d.status === 'COMPLETED').length;
  const delayedCount = deliverables.filter(d => d.status === 'DELAYED' || (d.endDate < new Date().toISOString().split('T')[0] && d.status !== 'COMPLETED' && d.status !== 'BLOCKED')).length;
  const blockedCount = deliverables.filter(d => d.status === 'BLOCKED').length;
  const totalReplannings = deliverables.reduce((sum, d) => sum + (d.replanningCount || 0), 0);

  // Unique phases for filtering
  const phases = Array.from(new Set(deliverables.map(d => d.phase).filter(Boolean))) as string[];

  // Filter deliverables: phase filter + optional milestones-only filter for Roadmap
  const filteredDeliverables = deliverables.filter(d => {
    if (selectedPhaseFilter !== 'ALL' && d.phase !== selectedPhaseFilter) return false;
    if (onlyMilestonesFilter && d.isMilestone === false) return false;
    return true;
  });

  // MS Project Style Roll-up: Sensitize Macro Deliverable based on sub-activities
  const recalculateDeliverableFromSubActivities = (
    deliverable: RoadmapDeliverable,
    subActivities: SubActivity[]
  ): RoadmapDeliverable => {
    if (!subActivities || subActivities.length === 0) {
      return {
        ...deliverable,
        subActivities: []
      };
    }

    const validStartDates = subActivities.map(s => s.startDate).filter(Boolean).sort();
    const newStartDate = validStartDates.length > 0 ? validStartDates[0] : deliverable.startDate;

    const validEndDates = subActivities.map(s => s.endDate).filter(Boolean).sort();
    const newEndDate = validEndDates.length > 0 ? validEndDates[validEndDates.length - 1] : deliverable.endDate;

    const avgProgress = Math.round(
      subActivities.reduce((acc, s) => acc + (s.progress || 0), 0) / subActivities.length
    );

    let newStatus: RoadmapDeliverable['status'] = deliverable.status;
    const todayStr = new Date().toISOString().split('T')[0];
    if (avgProgress === 100) {
      newStatus = 'COMPLETED';
    } else if (avgProgress > 0) {
      newStatus = 'IN_PROGRESS';
    } else if (newEndDate < todayStr) {
      newStatus = 'DELAYED';
    } else {
      newStatus = 'NOT_STARTED';
    }

    return {
      ...deliverable,
      startDate: newStartDate,
      endDate: newEndDate,
      progress: avgProgress,
      status: newStatus,
      subActivities
    };
  };

  // Toggle Sub-activities accordion expand
  const toggleExpandDeliverable = (deliverableId: string) => {
    setExpandedDeliverables(prev => ({
      ...prev,
      [deliverableId]: !prev[deliverableId]
    }));
  };

  // Open Sub-activity Modal for NEW sub-activity
  const handleOpenAddSubModal = (deliverable: RoadmapDeliverable) => {
    setTargetDeliverableForSub(deliverable);
    setEditingSubActivityId(null);
    const today = new Date().toISOString().split('T')[0];
    setSubActivityForm({
      name: '',
      responsible: deliverable.responsible || (users.length > 0 ? users[0].name : ''),
      startDate: deliverable.startDate || today,
      endDate: deliverable.endDate || today,
      status: 'NOT_STARTED',
      progress: 0,
      notes: ''
    });
    setIsAddSubModalOpen(true);
  };

  // Open Sub-activity Modal for EDITING
  const handleOpenEditSubModal = (deliverable: RoadmapDeliverable, sub: SubActivity) => {
    setTargetDeliverableForSub(deliverable);
    setEditingSubActivityId(sub.id);
    setSubActivityForm({
      name: sub.name,
      responsible: sub.responsible || '',
      startDate: sub.startDate,
      endDate: sub.endDate,
      status: sub.status,
      progress: sub.progress,
      notes: sub.notes || ''
    });
    setIsAddSubModalOpen(true);
  };

  // Save Sub-activity (Add or Edit) and Sensitize Parent Deliverable
  const handleSaveSubActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDeliverableForSub || !subActivityForm.name.trim() || !subActivityForm.startDate || !subActivityForm.endDate) {
      alert('Preencha o nome da atividade, data de início e data de término.');
      return;
    }

    let updatedSubList: SubActivity[] = targetDeliverableForSub.subActivities || [];

    if (editingSubActivityId) {
      updatedSubList = updatedSubList.map(s => {
        if (s.id === editingSubActivityId) {
          return {
            ...s,
            name: subActivityForm.name,
            responsible: subActivityForm.responsible,
            startDate: subActivityForm.startDate,
            endDate: subActivityForm.endDate,
            status: subActivityForm.status,
            progress: subActivityForm.status === 'COMPLETED' ? 100 : subActivityForm.progress,
            notes: subActivityForm.notes
          };
        }
        return s;
      });
    } else {
      const newSub: SubActivity = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: subActivityForm.name,
        responsible: subActivityForm.responsible,
        startDate: subActivityForm.startDate,
        endDate: subActivityForm.endDate,
        status: subActivityForm.status,
        progress: subActivityForm.status === 'COMPLETED' ? 100 : subActivityForm.progress,
        notes: subActivityForm.notes
      };
      updatedSubList = [...updatedSubList, newSub];
    }

    const updatedDeliverable = recalculateDeliverableFromSubActivities(targetDeliverableForSub, updatedSubList);

    // Check if sub-activity dates logically exceed the parent deliverable's current range
    const isDateExceeded = 
      (targetDeliverableForSub.startDate && updatedDeliverable.startDate < targetDeliverableForSub.startDate) ||
      (targetDeliverableForSub.endDate && updatedDeliverable.endDate > targetDeliverableForSub.endDate);

    if (isDateExceeded) {
      setPendingSubActivitySave({
        targetDeliverable: targetDeliverableForSub,
        updatedSubList,
        recalculatedDeliverable: updatedDeliverable
      });
      setIsSubDateExceededModalOpen(true);
      return;
    }

    const updatedDeliverables = deliverables.map(d => d.id === targetDeliverableForSub.id ? updatedDeliverable : d);

    onUpdateProjectFields(project.id, { roadmapDeliverables: updatedDeliverables });
    setIsAddSubModalOpen(false);
    setTargetDeliverableForSub(null);
    setEditingSubActivityId(null);
  };

  // Handler: Confirm (SIM) - Replan deliverable with auto justification
  const handleConfirmSubActivityReplanning = () => {
    if (!pendingSubActivitySave) return;

    const todayStr = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const autoJustification = "Data da entrega principal, alterada por conta de inclusão de atividade que excede o prazo original da entrega. Usuário foi notificado e aprovou essa alteração";

    const historyItem: ReplanningHistoryItem = {
      id: `hist_${Date.now()}`,
      changeDate: todayStr,
      deliverableId: pendingSubActivitySave.targetDeliverable.id,
      deliverableName: pendingSubActivitySave.targetDeliverable.name,
      oldStartDate: pendingSubActivitySave.targetDeliverable.startDate,
      newStartDate: pendingSubActivitySave.recalculatedDeliverable.startDate,
      oldEndDate: pendingSubActivitySave.targetDeliverable.endDate,
      newEndDate: pendingSubActivitySave.recalculatedDeliverable.endDate,
      justification: autoJustification,
      changedBy: userRole
    };

    const finalDeliverable: RoadmapDeliverable = {
      ...pendingSubActivitySave.recalculatedDeliverable,
      replanningCount: (pendingSubActivitySave.targetDeliverable.replanningCount || 0) + 1,
      history: [historyItem, ...(pendingSubActivitySave.targetDeliverable.history || [])]
    };

    const updatedDeliverables = deliverables.map(d => d.id === pendingSubActivitySave.targetDeliverable.id ? finalDeliverable : d);
    onUpdateProjectFields(project.id, { roadmapDeliverables: updatedDeliverables });

    setIsSubDateExceededModalOpen(false);
    setPendingSubActivitySave(null);
    setIsAddSubModalOpen(false);
    setTargetDeliverableForSub(null);
    setEditingSubActivityId(null);
  };

  // Handler: Deny (NÃO) - Save sub-activity keeping original parent deliverable dates
  const handleDenySubActivityReplanning = () => {
    if (!pendingSubActivitySave) return;

    const deliverableWithoutDateChange: RoadmapDeliverable = {
      ...pendingSubActivitySave.recalculatedDeliverable,
      startDate: pendingSubActivitySave.targetDeliverable.startDate,
      endDate: pendingSubActivitySave.targetDeliverable.endDate
    };

    const updatedDeliverables = deliverables.map(d => d.id === pendingSubActivitySave.targetDeliverable.id ? deliverableWithoutDateChange : d);
    onUpdateProjectFields(project.id, { roadmapDeliverables: updatedDeliverables });

    setIsSubDateExceededModalOpen(false);
    setPendingSubActivitySave(null);
    setIsAddSubModalOpen(false);
    setTargetDeliverableForSub(null);
    setEditingSubActivityId(null);
  };

  // Handler: Cancel (CANCELAR) - Return to sub-activity form
  const handleCancelSubActivityAlert = () => {
    setIsSubDateExceededModalOpen(false);
    setPendingSubActivitySave(null);
  };

  // Delete Sub-activity and Sensitize Parent Deliverable
  const handleDeleteSubActivity = (deliverableId: string, subId: string, subName: string) => {
    if (!confirm(`Deseja remover a atividade "${subName}"?`)) return;
    const deliverable = deliverables.find(d => d.id === deliverableId);
    if (!deliverable) return;

    const updatedSubList = (deliverable.subActivities || []).filter(s => s.id !== subId);
    const updatedDeliverable = recalculateDeliverableFromSubActivities(deliverable, updatedSubList);

    const updatedDeliverables = deliverables.map(d => d.id === deliverableId ? updatedDeliverable : d);
    onUpdateProjectFields(project.id, { roadmapDeliverables: updatedDeliverables });
  };

  // Open form for NEW deliverable
  const handleOpenAddModal = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setFormData({
      name: '',
      responsible: users.length > 0 ? users[0].name : '',
      startDate: today,
      endDate: nextMonth,
      status: 'NOT_STARTED',
      progress: 0,
      phase: 'Planejamento',
      isMilestone: true,
      notes: '',
      interdependence: {
        hasInterdependence: false,
        type: 'INTERNAL',
        targetDeliverableId: '',
        targetDeliverableName: '',
        targetProjectId: '',
        targetProjectName: ''
      }
    });
    setCustomPhaseInput('');
    setEditingDeliverable(null);
    setIsAddModalOpen(true);
  };

  // Open form for EDITING deliverable
  const handleOpenEditModal = (deliverable: RoadmapDeliverable) => {
    setEditingDeliverable(deliverable);
    const isStdPhase = STANDARD_PHASES.includes(deliverable.phase || '');
    setFormData({
      name: deliverable.name,
      responsible: deliverable.responsible,
      startDate: deliverable.startDate,
      endDate: deliverable.endDate,
      status: deliverable.status,
      progress: deliverable.progress,
      phase: deliverable.phase || 'Planejamento',
      isMilestone: deliverable.isMilestone !== false,
      notes: deliverable.notes || '',
      interdependence: deliverable.interdependence || {
        hasInterdependence: false,
        type: 'INTERNAL',
        targetDeliverableId: '',
        targetDeliverableName: '',
        targetProjectId: '',
        targetProjectName: ''
      }
    });
    if (!isStdPhase && deliverable.phase) {
      setCustomPhaseInput(deliverable.phase);
    } else {
      setCustomPhaseInput('');
    }
    setIsAddModalOpen(true);
  };

  // Save Deliverable Form Handler
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.startDate || !formData.endDate) {
      alert('Por favor, preencha o Nome da entrega, Data de Início e Data de Término.');
      return;
    }

    const effectivePhase = (formData.phase === 'Outra Fase (Personalizada)' || !STANDARD_PHASES.includes(formData.phase))
      ? (customPhaseInput.trim() || formData.phase || 'Geral')
      : formData.phase;

    if (editingDeliverable) {
      // Check if dates were changed
      const startDateChanged = formData.startDate !== editingDeliverable.startDate;
      const endDateChanged = formData.endDate !== editingDeliverable.endDate;

      if (startDateChanged || endDateChanged) {
        // Trigger Warning Modal for Baseline Change / Replanning
        setOldDates({
          startDate: editingDeliverable.startDate,
          endDate: editingDeliverable.endDate
        });

        const updatedPending: RoadmapDeliverable = {
          ...editingDeliverable,
          name: formData.name,
          responsible: formData.responsible || 'Não Definido',
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: formData.status,
          progress: formData.status === 'COMPLETED' ? 100 : formData.progress,
          phase: effectivePhase,
          isMilestone: formData.isMilestone,
          notes: formData.notes,
          interdependence: formData.interdependence
        };

        setPendingSaveDeliverable(updatedPending);
        setReplanningJustification('');
        setIsReplanningWarningOpen(true);
        setIsAddModalOpen(false);
        return;
      } else {
        // Direct save without date replanning
        const updatedDeliverables = deliverables.map(d => {
          if (d.id === editingDeliverable.id) {
            return {
              ...d,
              name: formData.name,
              responsible: formData.responsible || 'Não Definido',
              status: formData.status,
              progress: formData.status === 'COMPLETED' ? 100 : formData.progress,
              phase: effectivePhase,
              isMilestone: formData.isMilestone,
              notes: formData.notes,
              interdependence: formData.interdependence
            };
          }
          return d;
        });

        onUpdateProjectFields(project.id, { roadmapDeliverables: updatedDeliverables });
        setIsAddModalOpen(false);
        setEditingDeliverable(null);
      }
    } else {
      // CREATE NEW Deliverable
      const newDeliverable: RoadmapDeliverable = {
        id: `deliv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: formData.name,
        responsible: formData.responsible || 'Não Definido',
        startDate: formData.startDate,
        endDate: formData.endDate,
        baselineStartDate: formData.startDate,
        baselineEndDate: formData.endDate,
        status: formData.status,
        progress: formData.status === 'COMPLETED' ? 100 : formData.progress,
        phase: effectivePhase,
        isMilestone: formData.isMilestone,
        replanningCount: 0,
        history: [],
        subActivities: [],
        notes: formData.notes,
        interdependence: formData.interdependence
      };

      const updatedDeliverables = [...deliverables, newDeliverable];
      onUpdateProjectFields(project.id, { roadmapDeliverables: updatedDeliverables });
      setIsAddModalOpen(false);
    }
  };

  // Confirm Replanning with Justification
  const handleConfirmReplanning = () => {
    if (!pendingSaveDeliverable || !replanningJustification.trim()) return;

    const todayStr = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    const historyItem: ReplanningHistoryItem = {
      id: `hist_${Date.now()}`,
      changeDate: todayStr,
      deliverableId: pendingSaveDeliverable.id,
      deliverableName: pendingSaveDeliverable.name,
      oldStartDate: oldDates.startDate,
      newStartDate: pendingSaveDeliverable.startDate,
      oldEndDate: oldDates.endDate,
      newEndDate: pendingSaveDeliverable.endDate,
      justification: replanningJustification.trim(),
      changedBy: userRole
    };

    const updatedDeliverable: RoadmapDeliverable = {
      ...pendingSaveDeliverable,
      replanningCount: (pendingSaveDeliverable.replanningCount || 0) + 1,
      history: [historyItem, ...(pendingSaveDeliverable.history || [])]
    };

    const updatedDeliverables = deliverables.map(d => 
      d.id === pendingSaveDeliverable.id ? updatedDeliverable : d
    );

    onUpdateProjectFields(project.id, { roadmapDeliverables: updatedDeliverables });
    setIsReplanningWarningOpen(false);
    setPendingSaveDeliverable(null);
    setReplanningJustification('');
    setEditingDeliverable(null);
  };

  // Delete Deliverable
  const handleDeleteDeliverable = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja remover a entrega "${name}" do roadmap?`)) {
      const updated = deliverables.filter(d => d.id !== id);
      onUpdateProjectFields(project.id, { roadmapDeliverables: updated });
    }
  };

  // Excel / CSV File Upload Parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to JSON rows
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (rawJson.length === 0) {
          alert('A planilha importada está vazia.');
          return;
        }

        // Map columns intelligently
        const parsed: Omit<RoadmapDeliverable, 'id' | 'replanningCount'>[] = rawJson.map((row, idx) => {
          // Normalize key names
          const keys = Object.keys(row);
          const getKey = (patterns: string[]) => 
            keys.find(k => patterns.some(p => k.toLowerCase().includes(p.toLowerCase())));

          const nameKey = getKey(['nome', 'entrega', 'atividade', 'task', 'title', 'item', 'description']) || keys[0];
          const respKey = getKey(['responsável', 'responsavel', 'owner', 'recurso', 'resource', 'atribuído']) || keys[1];
          const startKey = getKey(['início', 'inicio', 'start', 'data_inicio', 'data inicio']) || keys[2];
          const endKey = getKey(['término', 'termino', 'end', 'data_fim', 'data termino', 'finish', 'due']) || keys[3];
          const phaseKey = getKey(['fase', 'etapa', 'phase', 'wbs', 'categoria']) || keys[4];
          const statusKey = getKey(['status', 'situacao', 'situação', 'estado']) || keys[5];

          const nameVal = String(row[nameKey] || `Entrega Importada ${idx + 1}`).trim();
          const respVal = String(row[respKey] || 'Equipe do Projeto').trim();
          
          let startVal = String(row[startKey] || '').trim();
          let endVal = String(row[endKey] || '').trim();

          // Standardize date YYYY-MM-DD
          const today = new Date().toISOString().split('T')[0];
          startVal = startVal ? parseDateToISO(startVal) : today;
          endVal = endVal ? parseDateToISO(endVal) : today;

          const phaseVal = String(row[phaseKey] || 'Planejamento').trim();
          const statusRaw = String(row[statusKey] || 'NOT_STARTED').toLowerCase();

          let statusVal: RoadmapDeliverable['status'] = 'NOT_STARTED';
          if (statusRaw.includes('conclu') || statusRaw.includes('done') || statusRaw.includes('finaliz')) {
            statusVal = 'COMPLETED';
          } else if (statusRaw.includes('andamento') || statusRaw.includes('progress') || statusRaw.includes('execu')) {
            statusVal = 'IN_PROGRESS';
          } else if (statusRaw.includes('atrasa') || statusRaw.includes('delay')) {
            statusVal = 'DELAYED';
          } else if (statusRaw.includes('bloq') || statusRaw.includes('block')) {
            statusVal = 'BLOCKED';
          }

          return {
            name: nameVal,
            responsible: respVal,
            startDate: startVal,
            endDate: endVal,
            baselineStartDate: startVal,
            baselineEndDate: endVal,
            status: statusVal,
            progress: statusVal === 'COMPLETED' ? 100 : statusVal === 'IN_PROGRESS' ? 50 : 0,
            phase: phaseVal,
            history: [],
            interdependence: { hasInterdependence: false }
          };
        });

        setParsedRows(parsed);
      } catch (err) {
        console.error('Error parsing spreadsheet:', err);
        alert('Erro ao ler a planilha. Verifique se o formato (.xlsx, .csv) está correto.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Helper date string standardizer
  const parseDateToISO = (val: string): string => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    // Format DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
      const [d, m, y] = val.split('/');
      return `${y}-${m}-${d}`;
    }
    // Excel serial number timestamp
    if (!isNaN(Number(val)) && Number(val) > 30000) {
      const dateObj = new Date((Number(val) - (25567 + 2)) * 86400 * 1000);
      return dateObj.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  };

  // Confirm Import
  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;

    const formattedImports: RoadmapDeliverable[] = parsedRows.map((r, i) => ({
      ...r,
      id: `deliv_imp_${Date.now()}_${i}`,
      replanningCount: 0
    }));

    let updatedList: RoadmapDeliverable[];
    if (importMode === 'replace') {
      updatedList = formattedImports;
    } else {
      updatedList = [...deliverables, ...formattedImports];
    }

    onUpdateProjectFields(project.id, { roadmapDeliverables: updatedList });
    setIsUploadModalOpen(false);
    setParsedRows([]);
    setFileName('');
  };

  // Export Roadmap to CSV/Excel
  const handleExportCSV = () => {
    if (deliverables.length === 0) {
      alert('Não há entregas para exportar.');
      return;
    }

    const exportData = deliverables.map(d => ({
      'ID Entrega': d.id,
      'Nome da Entrega': d.name,
      'Responsável': d.responsible,
      'Fase / Etapa': d.phase || 'Geral',
      'Data Início': d.startDate,
      'Data Término': d.endDate,
      'Baseline Início': d.baselineStartDate || d.startDate,
      'Baseline Término': d.baselineEndDate || d.endDate,
      'Status': d.status,
      'Progresso (%)': d.progress,
      'Replanejamentos': d.replanningCount || 0,
      'Interdependência': d.interdependence?.hasInterdependence 
        ? `${d.interdependence.type === 'INTERNAL' ? 'Interna' : 'Externa'}: ${d.interdependence.targetDeliverableName || d.interdependence.targetProjectName}` 
        : 'Não',
      'Observações': d.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Roadmap_Entregas');
    XLSX.writeFile(wb, `Roadmap_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
  };

  // Status Badge Component Helper
  const getStatusBadge = (status: RoadmapDeliverable['status']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Concluído
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
            <Clock className="w-3 h-3 text-indigo-400" />
            Em Andamento
          </span>
        );
      case 'DELAYED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 border border-rose-500/30 text-rose-400">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            Atrasado
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Ban className="w-3 h-3 text-amber-400" />
            Bloqueado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-400">
            <Clock className="w-3 h-3 text-slate-400" />
            Não Iniciado
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-xs font-sans" id="project-roadmap-tab">
      
      {/* HEADER ACTION BAR & MINI DASHBOARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-slate-100 font-display">Roadmap de Entregas & Baselines</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Acompanhamento detalhado das entregas, histórico imutável de replanejamentos e interdependências.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            
            {/* Global History Audit Button */}
            <button
              onClick={() => setIsGlobalHistoryOpen(true)}
              className="p-2 px-3 bg-slate-950 hover:bg-slate-850 border border-amber-500/30 text-amber-300 hover:text-amber-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-sm"
              title="Abrir Log Global de Histórico de Replanejamento do Projeto"
            >
              <History className="w-4 h-4 text-amber-400" />
              <span>Log de Replanejamentos ({totalReplannings}x)</span>
            </button>

            {/* Export CSV/Excel */}
            <button
              onClick={handleExportCSV}
              className="p-2 px-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              Exportar
            </button>

            {canEdit && (
              <>
                {/* Import Excel Button */}
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="p-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition shadow"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Importar Planilha / MS Project
                </button>

                {/* Manual Add Button */}
                <button
                  onClick={handleOpenAddModal}
                  className="p-2 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition shadow"
                >
                  <Plus className="w-4 h-4" />
                  Incluir Entrega
                </button>
              </>
            )}

          </div>
        </div>

        {/* MINI DASHBOARD KPI CARDS FOR ALL POSSIBLE STATUSES */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">Total Entregas</span>
            <span className="text-base font-extrabold text-slate-100 font-mono">{totalDeliverables}</span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">Não Iniciado</span>
            <span className="text-base font-extrabold text-slate-300 font-mono">{notStartedCount}</span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">Em Andamento</span>
            <span className="text-base font-extrabold text-indigo-400 font-mono">{inProgressCount}</span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">Concluído</span>
            <span className="text-base font-extrabold text-emerald-400 font-mono">{completedCount}</span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">Atrasado</span>
            <span className="text-base font-extrabold text-rose-400 font-mono">{delayedCount}</span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">Bloqueado</span>
            <span className="text-base font-extrabold text-amber-400 font-mono">{blockedCount}</span>
          </div>

          <div 
            onClick={() => setIsGlobalHistoryOpen(true)}
            className="bg-slate-950 p-2.5 rounded-xl border border-amber-500/30 hover:border-amber-500/60 flex flex-col justify-between cursor-pointer transition"
            title="Clique para abrir log global de auditoria de baseline"
          >
            <span className="text-[10px] text-amber-400 font-mono font-bold uppercase flex items-center gap-1">
              <RefreshCw className="w-3 h-3 text-amber-400" />
              Replanejamentos
            </span>
            <span className="text-base font-extrabold text-amber-300 font-mono">{totalReplannings}x</span>
          </div>

        </div>

        {/* FILTERS & VIEW MODE */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
          
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-slate-450 text-[10px] font-mono font-bold uppercase">Filtrar por Fase:</span>
              <select
                value={selectedPhaseFilter}
                onChange={(e) => setSelectedPhaseFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded p-1.5 font-semibold outline-none cursor-pointer"
              >
                <option value="ALL">Todas as Fases ({deliverables.length})</option>
                {phases.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Roadmap Milestone Filter Toggle */}
            <button
              onClick={() => setOnlyMilestonesFilter(!onlyMilestonesFilter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                onlyMilestonesFilter
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Filtrar visão para exibir apenas as entregas sinalizadas como Marcos Relevantes no Roadmap"
            >
              <MilestoneIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{onlyMilestonesFilter ? `Visão Executiva: Marcos Relevantes (${milestonesCount}/${totalDeliverables})` : `Exibindo: Todos Entregáveis (${totalDeliverables})`}</span>
            </button>
          </div>

          <div className="bg-slate-950 p-1 border border-slate-800 rounded-lg flex items-center gap-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition ${
                viewMode === 'table' ? 'bg-indigo-650 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Tabela de Entregas
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition ${
                viewMode === 'timeline' ? 'bg-indigo-650 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Visão Cronograma (Gantt)
            </button>
          </div>

        </div>

      </div>

      {/* ROADMAP CONTENT AREA */}
      {deliverables.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-12 rounded-xl text-center space-y-4 shadow">
          <div className="w-12 h-12 bg-slate-850 text-slate-500 rounded-full flex items-center justify-center mx-auto border border-slate-800">
            <Calendar className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-sm font-bold text-slate-200 font-display">Nenhuma entrega cadastrada no Roadmap</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inicie incluindo as principais entregas manualmente ou importe uma planilha Excel (.xlsx/.csv) ou projeto MS Project.
            </p>
            {canEdit && (
              <div className="flex justify-center gap-3 pt-3">
                <button
                  onClick={handleOpenAddModal}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" />
                  Incluir Entrega Manual
                </button>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold rounded-lg text-xs transition flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  Importar Planilha
                </button>
              </div>
            )}
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-slate-300 divide-y divide-slate-800">
              <thead className="bg-slate-950/60 text-[9px] uppercase tracking-wider text-slate-400 font-mono">
                <tr>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Nome da Entrega / Atividade</th>
                  <th className="p-3.5">Atividades WBS</th>
                  <th className="p-3.5">Responsável</th>
                  <th className="p-3.5">Fase / Etapa</th>
                  <th className="p-3.5">Data Início</th>
                  <th className="p-3.5">Data Término</th>
                  <th className="p-3.5 text-center">Replanejamento</th>
                  <th className="p-3.5">Progresso</th>
                  {canEdit && <th className="p-3.5 text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 bg-slate-900/40">
                {filteredDeliverables.map((d) => {
                  const hasReplanned = (d.replanningCount || 0) > 0;
                  const isExpanded = !!expandedDeliverables[d.id];
                  const subList = d.subActivities || [];

                  return (
                    <React.Fragment key={d.id}>
                      <tr className="hover:bg-slate-850/40 transition-colors">
                        
                        {/* Status */}
                        <td className="p-3.5 whitespace-nowrap">
                          {getStatusBadge(d.status)}
                        </td>

                        {/* Deliverable Name + Milestone Badge + Interdependence */}
                        <td className="p-3.5 max-w-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-100 text-xs leading-snug">{d.name}</span>
                            {d.isMilestone !== false && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300" title="Marco do Roadmap">
                                <MilestoneIcon className="w-3 h-3 text-amber-400 shrink-0" />
                                Marco
                              </span>
                            )}
                          </div>
                          
                          {/* Interdependence Badge */}
                          {d.interdependence?.hasInterdependence && (
                            <div className="mt-1 flex items-center gap-1">
                              {d.interdependence.type === 'INTERNAL' ? (
                                <span 
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-indigo-950 border border-indigo-500/30 text-indigo-300"
                                  title={`Dependência Interna: ${d.interdependence.targetDeliverableName || 'Outra entrega'}`}
                                >
                                  <GitCommit className="w-3 h-3 text-indigo-400 shrink-0" />
                                  <span className="truncate max-w-[150px]">
                                    Dep. Interna: {d.interdependence.targetDeliverableName || 'Entrega do Projeto'}
                                  </span>
                                </span>
                              ) : (
                                <span 
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-medium bg-amber-950 border border-amber-500/30 text-amber-300"
                                  title={`Dependência Externa: ${d.interdependence.targetProjectName || 'Projeto'} - ${d.interdependence.targetDeliverableName || 'Entrega'}`}
                                >
                                  <ExternalLink className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span className="truncate max-w-[170px]">
                                    Dep. Externa: {d.interdependence.targetProjectName || 'Projeto Externo'}
                                  </span>
                                </span>
                              )}
                            </div>
                          )}

                          {d.notes && (
                            <span className="text-[10px] text-slate-500 block truncate mt-0.5" title={d.notes}>
                              {d.notes}
                            </span>
                          )}
                        </td>

                        {/* WBS Sub-activities trigger button */}
                        <td className="p-3.5 whitespace-nowrap">
                          <button
                            onClick={() => toggleExpandDeliverable(d.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer ${
                              isExpanded 
                                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200' 
                                : subList.length > 0 
                                  ? 'bg-slate-850 hover:bg-slate-800 border-slate-700 text-indigo-300' 
                                  : 'bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-400'
                            }`}
                            title="Clique para gerenciar sub-atividades filhas que sensibilizam as datas da entrega"
                          >
                            <ListPlus className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{subList.length} atividade(s)</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                          </button>
                        </td>

                        {/* Responsible Person */}
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-950 border border-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {d.responsible ? d.responsible.substring(0, 2).toUpperCase() : 'ND'}
                            </div>
                            <span className="text-slate-200 font-medium text-xs truncate max-w-[140px]" title={d.responsible}>
                              {d.responsible || 'Não Definido'}
                            </span>
                          </div>
                        </td>

                        {/* Phase */}
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="bg-slate-950 border border-slate-800 text-slate-350 px-2 py-0.5 rounded text-[10.5px] font-medium">
                            {d.phase || 'Geral'}
                          </span>
                        </td>

                        {/* Start Date */}
                        <td className="p-3.5 whitespace-nowrap font-mono text-[11px] text-slate-300">
                          {d.startDate ? new Date(d.startDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'}
                        </td>

                        {/* End Date */}
                        <td className="p-3.5 whitespace-nowrap font-mono text-[11px]">
                          <span className={hasReplanned ? 'text-amber-400 font-bold' : 'text-slate-200 font-semibold'}>
                            {d.endDate ? new Date(d.endDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'}
                          </span>
                        </td>

                        {/* Replanning Counter */}
                        <td className="p-3.5 whitespace-nowrap text-center">
                          <button
                            onClick={() => setViewHistoryDeliverable(d)}
                            className={`px-3 py-1 rounded-full font-mono text-xs font-extrabold cursor-pointer transition border inline-flex items-center justify-center gap-1 ${
                              hasReplanned 
                                ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-300' 
                                : 'bg-slate-850 hover:bg-slate-800 border-slate-750 text-slate-400'
                            }`}
                            title={`Replanejado ${d.replanningCount || 0} vezes. Clique para abrir o card de histórico de justificativas.`}
                          >
                            {hasReplanned && <RefreshCw className="w-3 h-3 text-amber-400" />}
                            <span>{d.replanningCount || 0}</span>
                          </button>
                        </td>

                        {/* Progress Bar */}
                        <td className="p-3.5 whitespace-nowrap min-w-[110px]">
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-mono">
                              <span className="text-slate-400">{d.progress}%</span>
                            </div>
                            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-850">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  d.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-indigo-500'
                                }`}
                                style={{ width: `${d.progress}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        {canEdit && (
                          <td className="p-3.5 whitespace-nowrap text-right space-x-1">
                            <button
                              onClick={() => handleOpenAddSubModal(d)}
                              className="p-1.5 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 rounded transition"
                              title="Adicionar Atividade Filha"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            {hasReplanned && (
                              <button
                                onClick={() => setViewHistoryDeliverable(d)}
                                className="p-1.5 hover:bg-slate-800 text-amber-400 hover:text-amber-300 rounded transition"
                                title="Ver Histórico de Replanejamentos"
                              >
                                <History className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenEditModal(d)}
                              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
                              title="Editar Entrega"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDeliverable(d.id, d.name)}
                              className="p-1.5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded transition"
                              title="Excluir Entrega"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}

                      </tr>

                      {/* EXPANDABLE WBS SUB-ACTIVITIES PANEL */}
                      {isExpanded && (
                        <tr className="bg-slate-950/80 border-t border-b border-indigo-900/40">
                          <td colSpan={canEdit ? 10 : 9} className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <ListPlus className="w-4 h-4 text-indigo-400" />
                                <span className="font-bold text-slate-200 text-xs">
                                  Atividades Filhas de: <strong className="text-white">{d.name}</strong>
                                </span>
                                <span className="text-[10px] bg-indigo-950 border border-indigo-500/30 text-indigo-300 font-mono px-2 py-0.5 rounded-full">
                                  {subList.length} atividade(s)
                                </span>
                              </div>

                              {canEdit && (
                                <button
                                  onClick={() => handleOpenAddSubModal(d)}
                                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[11px] transition flex items-center gap-1 shadow cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  Cadastrar Atividade
                                </button>
                              )}
                            </div>

                            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-[11px] text-slate-300 space-y-2">
                              <div className="flex items-center gap-1.5 text-[10.5px] text-indigo-300 bg-indigo-950/50 p-2 rounded border border-indigo-500/20">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span>
                                  <strong>Sensibilização MS Project Ativa:</strong> As datas ({d.startDate} até {d.endDate}) e o progresso ({d.progress}%) da macro entrega são atualizados automaticamente pelas sub-atividades abaixo.
                                </span>
                              </div>

                              {subList.length === 0 ? (
                                <div className="text-center py-4 text-slate-500 text-xs italic">
                                  Nenhuma atividade cadastrada sob esta entrega macro. Clique em "Cadastrar Atividade" para adicionar atividades detalhadas.
                                </div>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left divide-y divide-slate-800">
                                    <thead className="bg-slate-950 text-[8.5px] uppercase text-slate-400 font-mono">
                                      <tr>
                                        <th className="p-2">Atividade Filha</th>
                                        <th className="p-2">Responsável</th>
                                        <th className="p-2">Início</th>
                                        <th className="p-2">Término</th>
                                        <th className="p-2">Status</th>
                                        <th className="p-2">Progresso</th>
                                        {canEdit && <th className="p-2 text-right">Ações</th>}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-850">
                                      {subList.map(sub => (
                                        <tr key={sub.id} className="hover:bg-slate-850/50 transition">
                                          <td className="p-2 font-medium text-slate-200">{sub.name}</td>
                                          <td className="p-2 text-slate-400">{sub.responsible || 'ND'}</td>
                                          <td className="p-2 font-mono text-slate-300">{sub.startDate ? new Date(sub.startDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'}</td>
                                          <td className="p-2 font-mono text-slate-300">{sub.endDate ? new Date(sub.endDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'}</td>
                                          <td className="p-2">{getStatusBadge(sub.status)}</td>
                                          <td className="p-2 font-mono text-indigo-300">{sub.progress}%</td>
                                          {canEdit && (
                                            <td className="p-2 text-right space-x-1">
                                              <button
                                                onClick={() => handleOpenEditSubModal(d, sub)}
                                                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                                                title="Editar Atividade"
                                              >
                                                <Edit3 className="w-3.5 h-3.5" />
                                              </button>
                                              <button
                                                onClick={() => handleDeleteSubActivity(d.id, sub.id, sub.name)}
                                                className="p-1 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded"
                                                title="Excluir Atividade"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </td>
                                          )}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VISUAL TIMELINE / GANTT VIEW */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-display">
            Linha do Tempo de Entregas do Roadmap
          </h3>

          <div className="space-y-3 pt-2">
            {filteredDeliverables.map((d, index) => {
              const isCompleted = d.status === 'COMPLETED';
              const isDelayed = d.status === 'DELAYED';
              const hasReplanned = (d.replanningCount || 0) > 0;

              return (
                <div key={d.id} className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  
                  <div className="space-y-1 max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-indigo-400 font-bold bg-indigo-950 px-1.5 py-0.2 rounded border border-indigo-500/20">
                        #{index + 1}
                      </span>
                      <h4 className="font-bold text-slate-200 text-xs">{d.name}</h4>
                    </div>

                    {/* Interdependence badge in Timeline */}
                    {d.interdependence?.hasInterdependence && (
                      <div className="pt-0.5">
                        {d.interdependence.type === 'INTERNAL' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-indigo-300 bg-indigo-950/80 border border-indigo-500/30 px-1.5 py-0.2 rounded font-medium">
                            <GitCommit className="w-3 h-3 text-indigo-400" />
                            Dep. Interna: {d.interdependence.targetDeliverableName || 'Entrega do projeto'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 bg-amber-950/80 border border-amber-500/30 px-1.5 py-0.2 rounded font-medium">
                            <ExternalLink className="w-3 h-3 text-amber-400" />
                            Dep. Externa: {d.interdependence.targetProjectName || 'Projeto Externo'}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-[10.5px] text-slate-400">
                      <span className="flex items-center gap-1"><UserCheck className="w-3 h-3 text-slate-500"/> {d.responsible}</span>
                      <span>•</span>
                      <span>Fase: <strong className="text-slate-300">{d.phase}</strong></span>
                      {hasReplanned && (
                        <>
                          <span>•</span>
                          <button
                            onClick={() => setViewHistoryDeliverable(d)}
                            className="text-amber-400 font-mono font-bold flex items-center gap-0.5 hover:underline cursor-pointer"
                          >
                            <RefreshCw className="w-2.5 h-2.5" /> Replanejado {d.replanningCount}x
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right font-mono text-[11px]">
                      <div className="text-slate-400 text-[10px]">Período Planejado</div>
                      <div className="text-slate-200 font-bold">
                        {d.startDate ? new Date(d.startDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'} até {d.endDate ? new Date(d.endDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'}
                      </div>
                    </div>

                    <div className="w-28 space-y-1">
                      <div className="flex justify-between text-[9.5px] font-mono text-slate-400">
                        <span>Progresso</span>
                        <span className="font-bold">{d.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div 
                          className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : isDelayed ? 'bg-rose-500' : 'bg-indigo-500'}`}
                          style={{ width: `${d.progress}%` }}
                        />
                      </div>
                    </div>

                    {canEdit && (
                      <button
                        onClick={() => handleOpenEditModal(d)}
                        className="p-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded border border-slate-750 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: ADD / EDIT DELIVERABLE FORM
          ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-100 font-display">
                  {editingDeliverable ? 'Editar Entrega do Roadmap' : 'Cadastrar Nova Entrega no Roadmap'}
                </h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              
              {/* Deliverable Name */}
              <div className="space-y-1">
                <label className="text-slate-400 font-mono text-[10px] font-bold uppercase tracking-wider block">
                  Nome da Entrega / Atividade *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Entrega do Módulo de Autenticação SSO & OAuth2"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Milestone Checkbox */}
              <div className="flex items-center gap-3 p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl">
                <input
                  type="checkbox"
                  id="isMilestoneCheckbox"
                  checked={formData.isMilestone}
                  onChange={(e) => setFormData({ ...formData, isMilestone: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700 accent-indigo-500 cursor-pointer"
                />
                <label htmlFor="isMilestoneCheckbox" className="text-xs text-slate-200 cursor-pointer select-none">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                    <MilestoneIcon className="w-3.5 h-3.5 text-amber-400" />
                    Sinalizar como Marco de Entrega Relevante (Exibir no Roadmap Executivo)
                  </div>
                  <span className="block text-[10.5px] text-slate-400 font-normal mt-0.5">
                    Apenas itens marcados como Marco compõem o Roadmap de entregas relevantes. Atividades normais ficam visíveis no Cronograma WBS.
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Responsible Person */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-mono text-[10px] font-bold uppercase tracking-wider block">
                    Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    list="users-list-suggestions"
                    placeholder="Digite ou selecione o responsável"
                    value={formData.responsible}
                    onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                  <datalist id="users-list-suggestions">
                    {users.map(u => (
                      <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                    ))}
                  </datalist>
                </div>

                {/* Phase Dropdown */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-mono text-[10px] font-bold uppercase tracking-wider block">
                    Fase / Macro-etapa *
                  </label>
                  <select
                    value={STANDARD_PHASES.includes(formData.phase) ? formData.phase : 'Outra Fase (Personalizada)'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'Outra Fase (Personalizada)') {
                        setFormData({ ...formData, phase: customPhaseInput || 'Outra Fase' });
                      } else {
                        setFormData({ ...formData, phase: val });
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
                  >
                    {STANDARD_PHASES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>

                  {(!STANDARD_PHASES.includes(formData.phase) || formData.phase === 'Outra Fase (Personalizada)') && (
                    <input
                      type="text"
                      placeholder="Digite o nome da fase personalizada..."
                      value={formData.phase === 'Outra Fase (Personalizada)' ? customPhaseInput : formData.phase}
                      onChange={(e) => {
                        setCustomPhaseInput(e.target.value);
                        setFormData({ ...formData, phase: e.target.value });
                      }}
                      className="w-full bg-slate-950 border border-indigo-500/40 p-2 rounded-lg text-slate-100 mt-1 focus:outline-none"
                    />
                  )}
                </div>

                {/* Start Date + Calendar Picker */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-mono text-[10px] font-bold uppercase tracking-wider block">
                    Data de Início *
                  </label>
                  <div className="relative flex items-center">
                    <input
                      ref={startDateInputRef}
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 pr-9 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-indigo-500 cursor-text"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          startDateInputRef.current?.showPicker();
                        } catch (_) {
                          startDateInputRef.current?.focus();
                        }
                      }}
                      className="absolute right-2 text-slate-400 hover:text-indigo-400 p-1 cursor-pointer"
                      title="Abrir Calendário"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* End Date + Calendar Picker */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-mono text-[10px] font-bold uppercase tracking-wider block">
                    Data de Término *
                  </label>
                  <div className="relative flex items-center">
                    <input
                      ref={endDateInputRef}
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 p-2.5 pr-9 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-indigo-500 cursor-text"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          endDateInputRef.current?.showPicker();
                        } catch (_) {
                          endDateInputRef.current?.focus();
                        }
                      }}
                      className="absolute right-2 text-slate-400 hover:text-indigo-400 p-1 cursor-pointer"
                      title="Abrir Calendário"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-mono text-[10px] font-bold uppercase tracking-wider block">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => {
                      const st = e.target.value as RoadmapDeliverable['status'];
                      setFormData({ 
                        ...formData, 
                        status: st, 
                        progress: st === 'COMPLETED' ? 100 : formData.progress 
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="NOT_STARTED">Não Iniciado</option>
                    <option value="IN_PROGRESS">Em Andamento</option>
                    <option value="COMPLETED">Concluído</option>
                    <option value="DELAYED">Atrasado</option>
                    <option value="BLOCKED">Bloqueado</option>
                  </select>
                </div>

                {/* Progress */}
                <div className="space-y-1">
                  <label className="text-slate-400 font-mono text-[10px] font-bold uppercase tracking-wider block">
                    Progresso: <strong className="text-indigo-400 font-mono">{formData.progress}%</strong>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={formData.progress}
                    onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
                    className="w-full accent-indigo-500 h-2 mt-2"
                  />
                </div>

              </div>

              {/* INTERDEPENDENCE SECTION */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold text-xs flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.interdependence.hasInterdependence}
                      onChange={(e) => setFormData({
                        ...formData,
                        interdependence: {
                          ...formData.interdependence,
                          hasInterdependence: e.target.checked
                        }
                      })}
                      className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 bg-slate-900 cursor-pointer"
                    />
                    <span className="flex items-center gap-1.5">
                      <Link2 className="w-4 h-4 text-indigo-400" />
                      Sinalizar Interdependência nesta Entrega
                    </span>
                  </label>
                </div>

                {formData.interdependence.hasInterdependence && (
                  <div className="space-y-3 pt-2 border-t border-slate-850 text-xs">
                    
                    {/* Interdependence Type Selector */}
                    <div className="space-y-1">
                      <label className="text-slate-400 font-mono text-[10px] font-bold uppercase tracking-wider block">
                        Tipo de Dependência *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            interdependence: {
                              ...formData.interdependence,
                              type: 'INTERNAL'
                            }
                          })}
                          className={`p-2 rounded-lg font-bold text-xs border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            formData.interdependence.type === 'INTERNAL'
                              ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <GitCommit className="w-3.5 h-3.5 text-indigo-400" />
                          Interna (Mesmo Projeto)
                        </button>

                        <button
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            interdependence: {
                              ...formData.interdependence,
                              type: 'EXTERNAL'
                            }
                          })}
                          className={`p-2 rounded-lg font-bold text-xs border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            formData.interdependence.type === 'EXTERNAL'
                              ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                          Externa (Outro Projeto)
                        </button>
                      </div>
                    </div>

                    {/* Internal Deliverable Selection */}
                    {formData.interdependence.type === 'INTERNAL' && (
                      <div className="space-y-1">
                        <label className="text-slate-400 font-mono text-[10px] font-bold uppercase tracking-wider block">
                          Selecione a Entrega do Projeto da qual depende *
                        </label>
                        <select
                          value={formData.interdependence.targetDeliverableId || ''}
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            const foundDeliv = deliverables.find(d => d.id === selectedId);
                            setFormData({
                              ...formData,
                              interdependence: {
                                ...formData.interdependence,
                                targetDeliverableId: selectedId,
                                targetDeliverableName: foundDeliv ? foundDeliv.name : ''
                              }
                            });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="">-- Selecione uma entrega do projeto --</option>
                          {deliverables
                            .filter(d => !editingDeliverable || d.id !== editingDeliverable.id)
                            .map(d => (
                              <option key={d.id} value={d.id}>
                                {d.name} ({d.phase || 'Geral'}) - Término: {d.endDate}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}

                    {/* External Project Selection */}
                    {formData.interdependence.type === 'EXTERNAL' && (
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <label className="text-slate-400 font-mono text-[10px] font-bold uppercase tracking-wider block">
                            Projeto Externo *
                          </label>
                          <select
                            value={formData.interdependence.targetProjectId || ''}
                            onChange={(e) => {
                              const targetProjId = e.target.value;
                              const projObj = (allProjects || []).find(p => p.id === targetProjId);
                              setFormData({
                                ...formData,
                                interdependence: {
                                  ...formData.interdependence,
                                  targetProjectId: targetProjId,
                                  targetProjectName: projObj ? projObj.name : '',
                                  targetDeliverableId: '',
                                  targetDeliverableName: ''
                                }
                              });
                            }}
                            className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            <option value="">-- Selecione o Projeto Externo --</option>
                            {(allProjects || [])
                              .filter(p => p.id !== project.id)
                              .map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                          </select>
                        </div>

                        {formData.interdependence.targetProjectId && (
                          <div className="space-y-1">
                            <label className="text-slate-400 font-mono text-[10px] font-bold uppercase tracking-wider block">
                              Entrega do Projeto Externo *
                            </label>
                            {(() => {
                              const selectedProj = (allProjects || []).find(p => p.id === formData.interdependence.targetProjectId);
                              const extDeliverables = selectedProj?.roadmapDeliverables || [];
                              if (extDeliverables.length > 0) {
                                return (
                                  <select
                                    value={formData.interdependence.targetDeliverableId || ''}
                                    onChange={(e) => {
                                      const delivId = e.target.value;
                                      const extD = extDeliverables.find(d => d.id === delivId);
                                      setFormData({
                                        ...formData,
                                        interdependence: {
                                          ...formData.interdependence,
                                          targetDeliverableId: delivId,
                                          targetDeliverableName: extD ? extD.name : ''
                                        }
                                      });
                                    }}
                                    className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                                  >
                                    <option value="">-- Selecione a entrega externa --</option>
                                    {extDeliverables.map(ed => (
                                      <option key={ed.id} value={ed.id}>{ed.name} ({ed.endDate})</option>
                                    ))}
                                  </select>
                                );
                              } else {
                                return (
                                  <input
                                    type="text"
                                    placeholder="Informe o nome da entrega do outro projeto..."
                                    value={formData.interdependence.targetDeliverableName || ''}
                                    onChange={(e) => setFormData({
                                      ...formData,
                                      interdependence: {
                                        ...formData.interdependence,
                                        targetDeliverableName: e.target.value
                                      }
                                    })}
                                    className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                                  />
                                );
                              }
                            })()}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-slate-400 font-mono text-[10px] font-bold uppercase tracking-wider block">
                  Observações / Detalhes Adicionais
                </label>
                <textarea
                  rows={2}
                  placeholder="Comentários sobre critérios de aceite, dependências técnicas ou riscos..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-bold rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Salvar Entrega
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: REPLANNING BASELINE WARNING DIALOG
          ========================================================================= */}
      {isReplanningWarningOpen && pendingSaveDeliverable && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[70] animate-fade-in">
          <div className="bg-slate-900 border-2 border-amber-500/40 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-3 bg-amber-500/15 rounded-xl border border-amber-500/30 shrink-0">
                <AlertTriangle className="w-7 h-7 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 font-display">Aviso de Alteração de Baseline</h3>
                <p className="text-xs text-amber-300 font-medium">Replanejamento de Datas do Roadmap</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/20 space-y-3 text-xs">
              <p className="text-slate-200 leading-relaxed">
                Você está alterando as datas de início ou término da entrega <strong className="text-amber-300">"{pendingSaveDeliverable.name}"</strong>.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-850 font-mono text-[11px]">
                <div className="space-y-1">
                  <span className="text-[9.5px] uppercase text-slate-500 font-bold block">Data Início</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 line-through">{oldDates.startDate}</span>
                    <ArrowRight className="w-3 h-3 text-amber-400" />
                    <span className="text-emerald-400 font-bold">{pendingSaveDeliverable.startDate}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9.5px] uppercase text-slate-500 font-bold block">Data Término</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 line-through">{oldDates.endDate}</span>
                    <ArrowRight className="w-3 h-3 text-amber-400" />
                    <span className="text-emerald-400 font-bold">{pendingSaveDeliverable.endDate}</span>
                  </div>
                </div>
              </div>

              <div className="bg-amber-500/10 p-2.5 rounded border border-amber-500/20 text-amber-300 text-[11px] flex items-center justify-between">
                <span>Novo Total de Replanejamentos:</span>
                <strong className="font-mono text-sm text-amber-200">
                  {(pendingSaveDeliverable.replanningCount || 0) + 1}x
                </strong>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-sans text-xs font-bold block">
                Justificativa Obrigatória para Replanejamento *
              </label>
              <textarea
                required
                rows={3}
                value={replanningJustification}
                onChange={(e) => setReplanningJustification(e.target.value)}
                placeholder="Informe o motivo detalhado do replanejamento (Ex: Alteração de escopo no comitê, restrição técnica de infraestrutura, etc.)"
                className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500 placeholder-slate-600 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsReplanningWarningOpen(false);
                  setPendingSaveDeliverable(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition text-xs cursor-pointer"
              >
                Cancelar Alteração
              </button>

              <button
                type="button"
                disabled={!replanningJustification.trim()}
                onClick={handleConfirmReplanning}
                className={`px-4 py-2 rounded-lg font-extrabold text-xs transition shadow-lg flex items-center gap-1.5 ${
                  replanningJustification.trim()
                    ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                Confirmar & Incrementar Contador
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: EXCEL / CSV / MS PROJECT UPLOAD MODAL
          ========================================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100 font-display">
                  Importar Roadmap (Excel / CSV / MS Project)
                </h3>
              </div>
              <button 
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setParsedRows([]);
                }}
                className="text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1">
              
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
                <p className="text-slate-300 leading-relaxed">
                  Selecione um arquivo de planilha (.xlsx, .xls, .csv) ou arquivo exportado do MS Project.
                </p>
                <div className="text-[11px] text-slate-400 space-y-1">
                  <strong>Colunas reconhecidas automaticamente:</strong>
                  <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                    <li><code className="text-indigo-300 font-mono">Nome da Entrega</code> (ou Atividade / Task / Name)</li>
                    <li><code className="text-indigo-300 font-mono">Responsável</code> (ou Resource / Recurso / Owner)</li>
                    <li><code className="text-indigo-300 font-mono">Data Início</code> e <code className="text-indigo-300 font-mono">Data Término</code></li>
                    <li><code className="text-indigo-300 font-mono">Fase</code> (ou Etapa / WBS) e <code className="text-indigo-300 font-mono">Status</code> / <code className="text-indigo-300 font-mono">Progresso</code></li>
                  </ul>
                </div>

                <div className="pt-2">
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv, .xml, .mpp"
                    onChange={handleFileUpload}
                    className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-650 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              {parsedRows.length > 0 && (
                <div className="space-y-3">
                  
                  <div className="flex justify-between items-center bg-emerald-950/30 border border-emerald-500/30 p-3 rounded-lg text-emerald-300">
                    <span className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      {parsedRows.length} entrega(s) reconhecida(s) no arquivo "{fileName}"
                    </span>

                    <div className="flex items-center gap-2">
                      <label className="text-[10px] text-slate-400">Modo de Importação:</label>
                      <select
                        value={importMode}
                        onChange={(e) => setImportMode(e.target.value as any)}
                        className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded p-1 font-semibold"
                      >
                        <option value="append">Adicionar ao Roadmap Existente</option>
                        <option value="replace">Substituir Roadmap Atual</option>
                      </select>
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950">
                    <table className="w-full text-left text-[11px] text-slate-300 divide-y divide-slate-850">
                      <thead className="bg-slate-900/80 uppercase text-[9px] text-slate-400 font-mono sticky top-0">
                        <tr>
                          <th className="p-2">Entrega</th>
                          <th className="p-2">Responsável</th>
                          <th className="p-2">Início</th>
                          <th className="p-2">Término</th>
                          <th className="p-2">Fase</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {parsedRows.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-900/50">
                            <td className="p-2 font-semibold text-slate-200">{r.name}</td>
                            <td className="p-2 text-slate-400">{r.responsible}</td>
                            <td className="p-2 font-mono">{r.startDate}</td>
                            <td className="p-2 font-mono text-emerald-400 font-bold">{r.endDate}</td>
                            <td className="p-2 text-slate-400">{r.phase}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              )}

            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setParsedRows([]);
                }}
                className="px-4 py-2 bg-slate-800 text-slate-400 hover:text-slate-200 font-bold rounded-lg transition"
              >
                Cancelar
              </button>
              
              <button
                type="button"
                disabled={parsedRows.length === 0}
                onClick={handleConfirmImport}
                className={`px-4 py-2 rounded-lg font-extrabold transition shadow-lg flex items-center gap-1.5 ${
                  parsedRows.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                    : 'bg-slate-850 text-slate-600 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                Confirmar Importação de {parsedRows.length} Entregas
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: DELIVERABLE / GLOBAL REPLANNING HISTORY COMPARISON CARD MODAL
          ========================================================================= */}
      {(viewHistoryDeliverable || isGlobalHistoryOpen) && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-hidden flex flex-col">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-display">
                    {viewHistoryDeliverable 
                      ? `Card de Replanejamentos: ${viewHistoryDeliverable.name}`
                      : `Log de Auditoria de Baseline & Replanejamentos (${project.name})`
                    }
                  </h3>
                  <p className="text-[10.5px] text-slate-400">
                    Comparativo detalhado de data anterior, data alterada e justificativas registradas.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setViewHistoryDeliverable(null);
                  setIsGlobalHistoryOpen(false);
                }}
                className="text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto pr-1 space-y-3 flex-1">
              
              {(() => {
                const historyItemsToDisplay: ReplanningHistoryItem[] = viewHistoryDeliverable
                  ? (viewHistoryDeliverable.history || [])
                  : deliverables.flatMap(d => d.history || []);

                if (historyItemsToDisplay.length === 0) {
                  return (
                    <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-850 space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                      <p className="text-slate-300 font-bold text-xs">Nenhum replanejamento efetuado nesta entrega</p>
                      <p className="text-slate-500 text-[11px]">
                        Esta entrega permanece no cronograma baseline original de planejamento.
                      </p>
                    </div>
                  );
                }

                return historyItemsToDisplay.map((item, idx) => (
                  <div key={item.id || idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 shadow">
                    
                    <div className="flex justify-between items-center flex-wrap gap-2 text-[10px] font-mono border-b border-slate-850 pb-2">
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 text-amber-400" />
                        Replanejamento #{historyItemsToDisplay.length - idx}
                      </span>
                      <span className="text-slate-400">Data do registro: <strong className="text-slate-200">{item.changeDate}</strong></span>
                      <span className="text-indigo-300 font-semibold">Alterado por: {item.changedBy || 'Usuário'}</span>
                    </div>

                    <div className="space-y-2">
                      <span className="font-bold text-slate-200 text-xs block">{item.deliverableName}</span>
                      
                      {/* Comparison Grid: Old Date vs New/Altered Date */}
                      <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/80 rounded-lg border border-slate-800 font-mono text-[11px]">
                        <div className="space-y-1 border-r border-slate-800 pr-2">
                          <span className="text-[9px] uppercase font-bold text-rose-400 block font-sans">
                            ❌ Data Anterior (Baseline)
                          </span>
                          <div className="text-slate-300 line-through text-[11.5px]">
                            {item.oldStartDate || 'N/A'} até {item.oldEndDate || 'N/A'}
                          </div>
                        </div>

                        <div className="space-y-1 pl-1">
                          <span className="text-[9px] uppercase font-bold text-emerald-400 block font-sans">
                            ✅ Data Alterada (Nova Baseline)
                          </span>
                          <div className="text-emerald-400 font-bold text-[11.5px]">
                            {item.newStartDate || 'N/A'} até {item.newEndDate || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Justification Box */}
                    <div className="bg-slate-900/90 p-3 rounded-lg border border-amber-500/20">
                      <span className="text-[9.5px] uppercase font-bold text-amber-400 block mb-1 font-mono">
                        Justificativa da Alteração:
                      </span>
                      <p className="text-slate-200 italic text-[11px] whitespace-pre-wrap leading-relaxed">
                        "{item.justification}"
                      </p>
                    </div>

                  </div>
                ));
              })()}

            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setViewHistoryDeliverable(null);
                  setIsGlobalHistoryOpen(false);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition cursor-pointer"
              >
                Fechar Card
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: ADD / EDIT SUB-ACTIVITY (WBS) FORM MODAL
          ========================================================================= */}
      {isAddSubModalOpen && targetDeliverableForSub && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ListPlus className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-display">
                    {editingSubActivityId ? 'Editar Atividade Filha' : 'Cadastrar Atividade Filha (WBS)'}
                  </h3>
                  <p className="text-[10.5px] text-indigo-300">
                    Sua data sensibiliza automaticamente a macro entrega: <strong>{targetDeliverableForSub.name}</strong>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsAddSubModalOpen(false);
                  setTargetDeliverableForSub(null);
                  setEditingSubActivityId(null);
                }}
                className="text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubActivity} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-slate-400 font-mono text-[10px] font-bold uppercase tracking-wider block">
                  Nome da Atividade Filha *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mapeamento de tabela e campos do banco"
                  value={subActivityForm.name}
                  onChange={(e) => setSubActivityForm({ ...subActivityForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-mono text-[10px] font-bold uppercase tracking-wider block">
                    Responsável
                  </label>
                  <input
                    type="text"
                    placeholder="Nome do responsável"
                    value={subActivityForm.responsible}
                    onChange={(e) => setSubActivityForm({ ...subActivityForm, responsible: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-mono text-[10px] font-bold uppercase tracking-wider block">
                    Status
                  </label>
                  <select
                    value={subActivityForm.status}
                    onChange={(e) => {
                      const st = e.target.value as SubActivity['status'];
                      setSubActivityForm({
                        ...subActivityForm,
                        status: st,
                        progress: st === 'COMPLETED' ? 100 : subActivityForm.progress
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="NOT_STARTED">Não Iniciado</option>
                    <option value="IN_PROGRESS">Em Andamento</option>
                    <option value="COMPLETED">Concluído</option>
                    <option value="DELAYED">Atrasado</option>
                    <option value="BLOCKED">Bloqueado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-mono text-[10px] font-bold uppercase tracking-wider block">
                    Data Início *
                  </label>
                  <input
                    type="date"
                    required
                    value={subActivityForm.startDate}
                    onChange={(e) => setSubActivityForm({ ...subActivityForm, startDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-mono text-[10px] font-bold uppercase tracking-wider block">
                    Data Término *
                  </label>
                  <input
                    type="date"
                    required
                    value={subActivityForm.endDate}
                    onChange={(e) => setSubActivityForm({ ...subActivityForm, endDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-mono text-[10px] font-bold uppercase tracking-wider block">
                  Progresso: <strong className="text-indigo-400 font-mono">{subActivityForm.progress}%</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={subActivityForm.progress}
                  onChange={(e) => setSubActivityForm({ ...subActivityForm, progress: Number(e.target.value) })}
                  className="w-full accent-indigo-500 h-2 mt-1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddSubModalOpen(false);
                    setTargetDeliverableForSub(null);
                    setEditingSubActivityId(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-bold rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition flex items-center gap-1.5 shadow"
                >
                  <Check className="w-4 h-4" />
                  Salvar Atividade Filha
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: SUB-ACTIVITY DATE EXCEEDED ALERT (REPLANNING CONFIRMATION)
          ========================================================================= */}
      {isSubDateExceededModalOpen && pendingSubActivitySave && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[60] animate-fade-in text-xs">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            
            <div className="flex items-start gap-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100 font-display">
                  Aviso: Data Excede o Prazo do Marco
                </h3>
                <p className="text-[11px] text-slate-300 mt-1">
                  A atividade cadastrada possui datas que excedem o prazo original da entrega principal <strong>"{pendingSubActivitySave.targetDeliverable.name}"</strong>.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2 font-mono text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Prazo Atual do Marco:</span>
                <span className="text-slate-200 font-bold">
                  {pendingSubActivitySave.targetDeliverable.startDate} até {pendingSubActivitySave.targetDeliverable.endDate}
                </span>
              </div>
              <div className="flex justify-between text-amber-300">
                <span>Novo Prazo do Marco:</span>
                <span className="font-bold">
                  {pendingSubActivitySave.recalculatedDeliverable.startDate} até {pendingSubActivitySave.recalculatedDeliverable.endDate}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-300 bg-amber-950/20 border border-amber-500/20 p-3 rounded-xl space-y-1">
              <strong className="text-amber-300 block mb-1">Como deseja proceder?</strong>
              <p className="text-[10.5px] leading-relaxed text-slate-300">
                • <strong>Confirmar (Sim):</strong> Altera a data da entrega principal e registra o replanejamento no histórico com a justificativa automática.<br />
                • <strong>Negar (Não):</strong> Salva a atividade mantendo a data do marco inalterada.<br />
                • <strong>Cancelar:</strong> Cancela e volta para a tela de cadastro da atividade.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleConfirmSubActivityReplanning}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer text-[11px]"
              >
                <Check className="w-4 h-4" />
                Sim (Confirmar)
              </button>

              <button
                type="button"
                onClick={handleDenySubActivityReplanning}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer text-[11px]"
              >
                <X className="w-4 h-4" />
                Não (Negar)
              </button>

              <button
                type="button"
                onClick={handleCancelSubActivityAlert}
                className="py-2.5 px-3 border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 font-semibold rounded-xl transition cursor-pointer text-[11px]"
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
