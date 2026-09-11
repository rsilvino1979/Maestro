import React, { useState, useMemo } from 'react';
import { 
  Users, UserPlus, Trash2, ShieldAlert, Key, Mail, 
  Building2, Search, SlidersHorizontal, Check, X, Edit2, ShieldCheck, HelpCircle, Plus 
} from 'lucide-react';
import { User, Tenant, Persona } from '../types';

interface UsersManagementTabProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  tenants: Tenant[];
  currentUser: User;
}

export default function UsersManagementTab({
  users,
  setUsers,
  tenants,
  currentUser,
}: UsersManagementTabProps) {
  // 1. Tenant Selection for SUPER_ADMIN (Blocking Requirement)
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isTenantAdmin = currentUser.role === 'TENANT_ADMIN';
  const isPortfolioManager = currentUser.role === 'PORTFOLIO_MANAGER';

  // State to hold the actively managed tenant
  const [selectedTenantId, setSelectedTenantId] = useState<string>(() => {
    if (isSuperAdmin) {
      return ''; // Super Admin must actively select a tenant first
    }
    return currentUser.tenantId; // Others are bound to their own tenant
  });

  // Filters state (For the list of all users)
  const [filterName, setFilterName] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterTenant, setFilterTenant] = useState<string>('ALL');

  // New user form states
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<Persona>('TEAM_MEMBER');
  const [recentRegistration, setRecentRegistration] = useState<{ name: string; email: string; pass: string } | null>(null);

  // Editing state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingRole, setEditingRole] = useState<Persona>('TEAM_MEMBER');

  // Active Tenant object
  const activeTenant = useMemo(() => {
    return tenants.find(t => t.id === selectedTenantId);
  }, [tenants, selectedTenantId]);

  // Hierarchical Role Comparison: returns true if actionRole can manage targetRole
  const canManageRole = (actionRole: Persona, targetRole: Persona): boolean => {
    if (actionRole === 'SUPER_ADMIN') return true;
    if (actionRole === 'TENANT_ADMIN') {
      return targetRole !== 'SUPER_ADMIN';
    }
    if (actionRole === 'PORTFOLIO_MANAGER') {
      // equal or inferior roles: PORTFOLIO_MANAGER, PROJECT_MANAGER, TEAM_MEMBER
      return targetRole === 'PORTFOLIO_MANAGER' || targetRole === 'PROJECT_MANAGER' || targetRole === 'TEAM_MEMBER';
    }
    return false;
  };

  // Helper to generate a compliant secure password
  const generateRandomPassword = (): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789!@#$%^*';
    const caps = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let pass = '';
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    for (let i = 0; i < 3; i++) {
      pass += caps.charAt(Math.floor(Math.random() * caps.length));
    }
    return pass + '7@';
  };

  // Create user
  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId) {
      alert('Por favor, selecione uma Organização (Tenant) primeiro.');
      return;
    }
    if (!newUserName.trim() || !newUserEmail.trim()) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    const email = newUserEmail.trim();
    if (!email.includes('@')) {
      alert('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    // Check email uniqueness
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      alert('Erro: Já existe um usuário cadastrado com este e-mail.');
      return;
    }

    // Check authority over target role
    if (!canManageRole(currentUser.role, newUserRole)) {
      alert('Não autorizado: Você não dispõe de privilégios para criar usuários com esse perfil.');
      return;
    }

    const generatedPassword = generateRandomPassword();

    const newUser: User = {
      id: `user_${Date.now()}`,
      name: newUserName.trim(),
      email,
      role: newUserRole,
      tenantId: selectedTenantId,
      password: generatedPassword,
      mustChangePassword: false // bypass setup screen for quick testing
    };

    setUsers(prev => [...prev, newUser]);
    
    setRecentRegistration({
      name: newUser.name,
      email: newUser.email,
      pass: generatedPassword,
    });

    // Reset fields
    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole('TEAM_MEMBER');
  };

  // Delete User
  const handleDeleteUser = (user: User) => {
    if (user.id === currentUser.id) {
      alert('Não é permitido excluir sua própria conta enquanto estiver logado.');
      return;
    }

    // Role check
    if (!canManageRole(currentUser.role, user.role)) {
      alert('Não autorizado: Você não possui permissão para gerenciar ou excluir este usuário.');
      return;
    }

    // Tenant check
    if (!isSuperAdmin && user.tenantId !== currentUser.tenantId) {
      alert('Não autorizado: Só é permitido gerenciar usuários da sua própria Organização.');
      return;
    }

    if (confirm(`Deseja realmente remover o usuário "${user.name}"? Esta ação revogará todo o acesso dele à plataforma.`)) {
      setUsers(prev => prev.filter(u => u.id !== user.id));
    }
  };

  // Start Edit
  const handleStartEdit = (user: User) => {
    if (!canManageRole(currentUser.role, user.role)) {
      alert('Não autorizado: Seu perfil não possui permissão para editar este usuário.');
      return;
    }
    setEditingUserId(user.id);
    setEditingName(user.name);
    setEditingRole(user.role);
  };

  // Save Edit
  const handleSaveEdit = (userId: string) => {
    if (!editingName.trim()) {
      alert('O nome do usuário não pode ficar vazio.');
      return;
    }

    // Check if target role change is authorized
    if (!canManageRole(currentUser.role, editingRole)) {
      alert('Não autorizado: Você não pode promover ou definir este cargo.');
      return;
    }

    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          name: editingName.trim(),
          role: editingRole
        };
      }
      return u;
    }));

    setEditingUserId(null);
  };

  // Available roles to create based on permissions
  const availableRolesForCreation = useMemo(() => {
    const roles: { val: Persona; label: string }[] = [];
    if (canManageRole(currentUser.role, 'SUPER_ADMIN')) {
      roles.push({ val: 'SUPER_ADMIN', label: '⚙️ Super Admin' });
    }
    if (canManageRole(currentUser.role, 'TENANT_ADMIN')) {
      roles.push({ val: 'TENANT_ADMIN', label: '👑 Tenant Admin' });
    }
    if (canManageRole(currentUser.role, 'PORTFOLIO_MANAGER')) {
      roles.push({ val: 'PORTFOLIO_MANAGER', label: '💼 Gestor Portfólio (PMO)' });
    }
    if (canManageRole(currentUser.role, 'PROJECT_MANAGER')) {
      roles.push({ val: 'PROJECT_MANAGER', label: '📐 Gerente de Projetos' });
    }
    roles.push({ val: 'TEAM_MEMBER', label: '👥 Membro do Time' });
    return roles;
  }, [currentUser.role]);

  // Filtering & Sorting of all registered users
  const processedUsers = useMemo(() => {
    let list = [...users];

    // Filter by name/email
    if (filterName.trim()) {
      const query = filterName.toLowerCase().trim();
      list = list.filter(u => u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query));
    }

    // Filter by role
    if (filterRole !== 'ALL') {
      list = list.filter(u => u.role === filterRole);
    }

    // Filter by tenant
    if (filterTenant !== 'ALL') {
      list = list.filter(u => u.tenantId === filterTenant);
    }

    // Sort order logic
    const hasFilter = filterName.trim() !== '' || filterRole !== 'ALL' || filterTenant !== 'ALL';
    
    if (!hasFilter) {
      // Sorted by Tenant name or id when no filters are active
      list.sort((a, b) => {
        const tenantA = tenants.find(t => t.id === a.tenantId)?.name || a.tenantId;
        const tenantB = tenants.find(t => t.id === b.tenantId)?.name || b.tenantId;
        const tenantCompare = tenantA.localeCompare(tenantB);
        if (tenantCompare !== 0) return tenantCompare;
        return a.name.localeCompare(b.name);
      });
    } else {
      // Natural sort by name
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [users, filterName, filterRole, filterTenant, tenants]);

  // Roles translated
  const translateRole = (role: Persona): string => {
    switch (role) {
      case 'SUPER_ADMIN': return '⚙️ Super Admin';
      case 'TENANT_ADMIN': return '👑 Tenant Admin';
      case 'PORTFOLIO_MANAGER': return '💼 Gestor Portfólio';
      case 'PROJECT_MANAGER': return '📐 Gerente de Projeto';
      case 'TEAM_MEMBER': return '👥 Membro do Time';
      default: return role;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Branded Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
            <Users className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-lg font-bold text-slate-100 font-display">Acessos & Usuários</h1>
            <p className="text-xs text-slate-450 leading-normal">
              Controle central de credenciais, papéis corporativos (RBAC) e governança de acessos por Tenant.
            </p>
          </div>
        </div>
      </div>

      {/* 2. SUPER ADMIN SPECIFIC - ACTIVE TENANT MANAGER SELECTION */}
      {isSuperAdmin && (
        <div className="bg-amber-950/15 border border-amber-500/15 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-ping"></span>
              <span className="font-mono text-[9px] text-amber-500 uppercase font-extrabold tracking-widest block leading-none">Super-Administração Global</span>
            </div>
            <strong className="block text-slate-205 text-xs">Visão Multiorganização Ativa</strong>
            <p className="text-[10.5px] text-slate-405">
              Por possuir privilégios globais, selecione qual Tenant deseja gerenciar no painel de cadastros abaixo.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <label className="text-[10.5px] text-slate-400 font-mono uppercase font-bold whitespace-nowrap">Tenant Ativo:</label>
            <select
              value={selectedTenantId}
              onChange={(e) => {
                setSelectedTenantId(e.target.value);
                setRecentRegistration(null);
              }}
              className="bg-slate-950 border border-slate-800 rounded-xl p-2 px-3.5 text-xs font-bold text-amber-400 outline-none cursor-pointer focus:border-amber-500/40"
            >
              <option value="">-- Selecione um Tenant para Ativar --</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.plan})</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Main Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* CADASTRO DE NOVO USUÁRIO */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800">
              <UserPlus className="w-4.5 h-4.5 text-indigo-400" />
              <h3 className="text-xs font-bold text-slate-200">Novo Colaborador (Acesso VMO)</h3>
            </div>

            {isSuperAdmin && !selectedTenantId ? (
              <div className="p-6 text-center bg-slate-950/40 border border-dashed border-slate-850 rounded-lg text-xs text-slate-500 italic space-y-1">
                <ShieldAlert className="w-5 h-5 text-amber-500/60 mx-auto block" />
                <p>Selecione uma Tenant na barra superior para habilitar novos cadastros.</p>
              </div>
            ) : (
              <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-xs font-medium">
                {/* Visual indicator of corporate context */}
                <div className="bg-slate-950 p-2.5 rounded border border-slate-850 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-450 shrink-0" />
                  <div>
                    <span className="text-[9px] text-slate-500 block leading-none font-mono uppercase">Destino do Acesso</span>
                    <strong className="text-indigo-400 text-[10.5px]">{activeTenant?.name || 'Sua Organização'}</strong>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">Nome do Usuário</label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Ex: Amanda Silva"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-505 p-2 rounded-lg text-slate-205 focus:outline-none placeholder:text-slate-600 font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">E-mail Corporativo (Login)</label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="Ex: amanda.silva@empresa.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-505 p-2 rounded-lg text-slate-205 focus:outline-none placeholder:text-slate-600 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">Atribuição de Papel (Cargo)</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as Persona)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-505 p-2 rounded-lg text-slate-300 focus:outline-none cursor-pointer"
                  >
                    {availableRolesForCreation.map(role => (
                      <option key={role.val} value={role.val}>{role.label}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-850">
                  <button
                    type="submit"
                    className="w-full p-2.5 bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow cursor-pointer select-none"
                  >
                    <Plus className="w-4 h-4 text-emerald-400" />
                    Criar Usuário de Acesso
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Success Box Display */}
          {recentRegistration && (
            <div className="bg-emerald-950/20 border-2 border-dashed border-emerald-500/30 rounded-xl p-4 space-y-3 relative text-xs text-slate-300">
              <button
                type="button"
                onClick={() => setRecentRegistration(null)}
                className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-400" />
                <h4 className="font-bold text-emerald-300">Credenciais Criadas com Sucesso!</h4>
              </div>
              <p className="text-[11px] leading-relaxed">
                O usuário <strong className="text-white">{recentRegistration.name}</strong> foi registrado. Ele agora pode efetuar login utilizando:
              </p>
              <div className="bg-slate-950 p-2.5 rounded border border-emerald-500/20 space-y-1 font-mono text-[11px] text-slate-350">
                <div><strong>Login:</strong> <span className="text-emerald-300 select-all font-bold">{recentRegistration.email}</span></div>
                <div><strong>Senha:</strong> <span className="text-emerald-300 select-all font-bold">{recentRegistration.pass}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* LISTAGEM DE USUÁRIOS REGISTRADOS */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
            
            {/* Header + Filtros */}
            <div className="space-y-4 pb-4 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Users className="w-4.5 h-4.5 text-slate-400" />
                  Base de Colaboradores Cadastrados ({processedUsers.length})
                </h3>
              </div>

              {/* FILTERS PANEL */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                
                {/* Search Text */}
                <div className="space-y-1 text-[10.5px]">
                  <label className="text-[9px] uppercase font-bold text-slate-505 block">Filtrar por Nome / E-mail</label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-600 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={filterName}
                      onChange={(e) => setFilterName(e.target.value)}
                      placeholder="Pesquisar..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 pl-8 text-xs text-slate-200 focus:outline-none placeholder:text-slate-600"
                    />
                  </div>
                </div>

                {/* Filter Role */}
                <div className="space-y-1 text-[10.5px]">
                  <label className="text-[9px] uppercase font-bold text-slate-505 block">Cargo / Perfil</label>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="ALL">Qualquer Cargo</option>
                    <option value="SUPER_ADMIN">⚙️ Super Admin</option>
                    <option value="TENANT_ADMIN">👑 Tenant Admin</option>
                    <option value="PORTFOLIO_MANAGER">💼 Gestor Portfólio</option>
                    <option value="PROJECT_MANAGER">📐 Gerente de Projeto</option>
                    <option value="TEAM_MEMBER">👥 Membro do Time</option>
                  </select>
                </div>

                {/* Filter Tenant (Enabled for all to search, locked/hidden as needed) */}
                <div className="space-y-1 text-[10.5px]">
                  <label className="text-[9px] uppercase font-bold text-slate-505 block">Empresa / Tenant</label>
                  <select
                    value={filterTenant}
                    disabled={!isSuperAdmin}
                    onChange={(e) => setFilterTenant(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-300 outline-none cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {isSuperAdmin ? (
                      <>
                        <option value="ALL">Todas as Organizações</option>
                        {tenants.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </>
                    ) : (
                      <option value="ALL">{tenants.find(t => t.id === currentUser.tenantId)?.name || 'Sua Organização'}</option>
                    )}
                  </select>
                </div>

              </div>
              
              {/* Filter active state indicator */}
              {(filterName || filterRole !== 'ALL' || filterTenant !== 'ALL') ? (
                <div className="flex items-center justify-between text-[11px] text-indigo-400 bg-indigo-950/15 p-2 px-3 rounded border border-indigo-500/10">
                  <span>Modo Filtro Ativo • Ordenando por nome</span>
                  <button
                    onClick={() => {
                      setFilterName('');
                      setFilterRole('ALL');
                      setFilterTenant('ALL');
                    }}
                    className="text-[10px] uppercase font-black hover:underline cursor-pointer"
                  >
                    Limpar Filtros
                  </button>
                </div>
              ) : (
                <div className="text-[10.5px] text-slate-500 leading-none">
                  💡 Sem filtro de busca ativo • <strong className="text-slate-400 font-semibold underline">Ordenado por Tenant (Organização)</strong> para governança facilitada.
                </div>
              )}
            </div>

            {/* USERS TABLE */}
            <div className="overflow-x-auto rounded-xl border border-slate-850">
              <table className="w-full text-xs text-left text-slate-300 bg-slate-950/50">
                <thead className="text-[10.5px] uppercase font-mono font-bold tracking-wider text-slate-450 bg-slate-950/90 border-b border-slate-850">
                  <tr>
                    <th className="p-3">Nome / Usuário</th>
                    <th className="p-3">Perfil (Role)</th>
                    <th className="p-3">Corporação (Tenant)</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60 font-sans">
                  {processedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500 italic">
                        Nenhum colaborador encontrado com as definições de busca.
                      </td>
                    </tr>
                  ) : (
                    processedUsers.map(u => {
                      const isEditing = editingUserId === u.id;
                      const userTenant = tenants.find(t => t.id === u.tenantId);
                      const isCurrentUserRow = u.id === currentUser.id;
                      const hasManagementRights = canManageRole(currentUser.role, u.role);

                      return (
                        <tr key={u.id} className={`hover:bg-slate-900/40 transition-colors ${isCurrentUserRow ? 'bg-indigo-950/10' : ''}`}>
                          
                          {/* Name / Username cell */}
                          <td className="p-3">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="bg-slate-900 border border-slate-700 text-slate-200 p-1 px-2 rounded w-full focus:outline-none"
                              />
                            ) : (
                              <div className="space-y-0.5">
                                <span className="font-bold text-slate-250 flex items-center gap-1.5">
                                  {u.name}
                                  {isCurrentUserRow && (
                                    <span className="px-1 text-[8.5px] font-mono uppercase bg-indigo-650 text-white rounded font-black whitespace-nowrap">Eu</span>
                                  )}
                                </span>
                                <span className="text-[10.5px] text-slate-500 font-mono block">{u.email}</span>
                              </div>
                            )}
                          </td>

                          {/* Role / Permission Cell */}
                          <td className="p-3 font-medium text-slate-300">
                            {isEditing ? (
                              <select
                                value={editingRole}
                                onChange={(e) => setEditingRole(e.target.value as Persona)}
                                className="bg-slate-900 border border-slate-700 text-slate-200 p-1.5 rounded w-full focus:outline-none focus:border-indigo-505"
                              >
                                {availableRolesForCreation.map(role => (
                                  <option key={role.val} value={role.val}>{role.label}</option>
                                ))}
                              </select>
                            ) : (
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                                u.role === 'SUPER_ADMIN' ? 'bg-amber-950/30 text-amber-500 border border-amber-500/15' :
                                u.role === 'TENANT_ADMIN' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-500/15' :
                                u.role === 'PORTFOLIO_MANAGER' ? 'bg-indigo-950/30 text-indigo-400 border border-indigo-500/15' :
                                u.role === 'PROJECT_MANAGER' ? 'bg-indigo-950/30 text-indigo-300 border border-indigo-500/10' :
                                'bg-slate-900 text-slate-400 border border-slate-800'
                              }`}>
                                {translateRole(u.role)}
                              </span>
                            )}
                          </td>

                          {/* Tenant organization cell */}
                          <td className="p-3">
                            <span className="text-[11px] font-bold text-slate-400 block whitespace-nowrap">
                              🏢 {userTenant?.name || u.tenantId}
                            </span>
                          </td>

                          {/* Action Cell */}
                          <td className="p-3 text-right whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleSaveEdit(u.id)}
                                  className="p-1 px-2.5 bg-indigo-650 hover:bg-indigo-600 rounded text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  Salvar
                                </button>
                                <button
                                  onClick={() => setEditingUserId(null)}
                                  className="p-1 px-1.5 bg-slate-805 hover:bg-slate-705 rounded text-slate-400 text-[11px] cursor-pointer"
                                  title="Cancelar"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1">
                                {hasManagementRights && !isCurrentUserRow ? (
                                  <>
                                    <button
                                      onClick={() => handleStartEdit(u)}
                                      className="p-1.5 hover:bg-slate-900 text-slate-450 hover:text-indigo-400 rounded transition cursor-pointer"
                                      title="Editar Usuário"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(u)}
                                      className="p-1.5 hover:bg-slate-900 text-rose-500 hover:text-rose-400 rounded transition cursor-pointer"
                                      title="Excluir Usuário"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <HelpCircle 
                                    className="w-3.5 h-3.5 text-slate-700 mr-2.5" 
                                    title={isCurrentUserRow ? "Sua própria conta (gerenciada no login)" : "Você não possui permissão de gerenciamento sobre este cargo."}
                                  />
                                )}
                              </div>
                            )}
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
