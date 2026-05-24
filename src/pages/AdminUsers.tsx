import { useState, useEffect } from 'react';
import { Shield, Pencil, Ban, Search, UserPlus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Table, type Column } from '@/components/ui/Table';
import { formatDate } from '@/utils/formatters';
import type { User, UserRole } from '@/types';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

const secondarySupabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const roleConfig: Record<UserRole, { label: string; variant: 'accent' | 'success' | 'warning' | 'default' }> = {
  admin: { label: 'Administrador', variant: 'accent' },
  gestor: { label: 'Gestor', variant: 'success' },
  caixa: { label: 'Funcionário', variant: 'warning' },
  auditor: { label: 'Auditor', variant: 'default' },
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', role: 'caixa' as UserRole });
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'caixa' as UserRole });
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (data) {
      setUsers(data as User[]);
    } else if (error) {
      console.error('Erro ao buscar utilizadores:', error);
    }
    setLoading(false);
  }

  const filtered = users.filter(u =>
    (!search || u.name.toLowerCase().includes(search.toLowerCase()) || (u.email && u.email.toLowerCase().includes(search.toLowerCase())))
  );

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({ name: user.name, role: user.role });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ name: form.name, role: form.role })
      .eq('id', editingUser.id);

    if (!error) {
      setUsers(prev => prev.map(u => 
        u.id === editingUser.id ? { ...u, name: form.name, role: form.role } : u
      ));
      setShowEditModal(false);
    } else {
      alert('Erro ao guardar: ' + error.message);
    }
    setSaving(false);
  };

  const handleCreate = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      alert('Preenche todos os campos.');
      return;
    }
    setCreating(true);
    
    // Usamos um cliente secundário (sem persistência) para não deslogar o Admin!
    const { error } = await secondarySupabase.auth.signUp({
      email: createForm.email,
      password: createForm.password,
      options: {
        data: {
          name: createForm.name,
          role: createForm.role
        }
      }
    });

    if (error) {
      alert('Erro ao criar utilizador: ' + error.message);
    } else {
      fetchUsers();
      setShowCreateModal(false);
      setCreateForm({ name: '', email: '', password: '', role: 'caixa' as UserRole });
    }
    setCreating(false);
  };

  const handleToggleStatus = async (user: User) => {
    const isActive = user.active !== false; // default true
    if (confirm(`Tem a certeza que deseja ${isActive ? 'desativar' : 'ativar'} a conta de ${user.name}?`)) {
      const { error } = await supabase
        .from('profiles')
        .update({ active: !isActive })
        .eq('id', user.id);
        
      if (!error) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: !isActive } : u));
      } else {
        alert('Erro ao alterar estado: ' + error.message);
      }
    }
  };

  const handleDelete = async () => {
    if (!userToDelete || deleteEmailConfirm !== userToDelete.email) return;
    setDeleting(true);
    
    // Call the custom RPC function to delete from auth.users
    const { error } = await supabase.rpc('delete_user', { p_user_id: userToDelete.id });
    
    if (!error) {
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      setUserToDelete(null);
      setDeleteEmailConfirm('');
    } else {
      alert('Erro ao apagar utilizador: ' + error.message);
    }
    setDeleting(false);
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Utilizador',
      render: (u) => (
        <div className={`flex items-center gap-3 ${u.active === false ? 'opacity-50' : ''}`}>
          <div className="size-8 rounded-full bg-surface-overlay flex items-center justify-center text-xs font-bold text-text-secondary shrink-0">
            {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-medium flex items-center gap-2">
              {u.name}
              {u.active === false && <Badge variant="default">Inativo</Badge>}
            </p>
            <p className="text-xs text-text-muted">{u.email}</p>
          </div>
        </div>
      ),
      sortable: true,
      sortFn: (a, b) => a.name.localeCompare(b.name),
    },
    {
      key: 'role',
      header: 'Papel',
      render: (u) => {
        const cfg = roleConfig[u.role] || { label: u.role, variant: 'default' };
        return (
          <Badge variant={cfg.variant as any}>
            <Shield size={12} /> {cfg.label}
          </Badge>
        );
      },
    },
    {
      key: 'created',
      header: 'Registado em',
      render: (u) => <span className="text-text-muted text-sm">{formatDate(u.created_at)}</span>,
      className: 'hidden sm:table-cell',
      sortable: true,
      sortFn: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      key: 'actions',
      header: '',
      render: (u) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(u); }}
            className="p-1.5 rounded-md text-text-muted hover:text-accent hover:bg-surface-overlay transition-colors cursor-pointer"
            title="Editar"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleToggleStatus(u); }}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              u.active === false 
                ? 'text-success hover:bg-success-muted' 
                : 'text-text-muted hover:text-warning hover:bg-warning/15'
            }`}
            title={u.active === false ? "Ativar conta" : "Desativar conta"}
          >
            {u.active === false ? <Shield size={14} /> : <Ban size={14} />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setUserToDelete(u); setDeleteEmailConfirm(''); }}
            className="p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger/15 transition-colors cursor-pointer"
            title="Apagar conta permanentemente"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
      className: 'w-20',
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex-1 w-full sm:max-w-sm">
          <Input
            placeholder="Pesquisar por nome ou email..."
            icon={<Search size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button icon={<UserPlus size={16} />} onClick={() => setShowCreateModal(true)}>
          Novo Utilizador
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
        {Object.entries(roleConfig).map(([role, cfg]) => {
          const count = users.filter(u => u.role === role).length;
          return (
            <span key={role} className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{
                backgroundColor: role === 'admin' ? '#4f8cff' : role === 'gestor' ? '#34d399' : role === 'caixa' ? '#fbbf24' : '#8b90a0'
              }} />
              {count} {cfg.label}{count !== 1 ? 's' : ''}
            </span>
          );
        })}
      </div>

      <Table
        columns={columns}
        data={filtered}
        keyExtractor={(u) => u.id}
        emptyMessage={loading ? "A carregar utilizadores..." : "Nenhum utilizador encontrado"}
      />

      {/* Edit Modal */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Utilizador"
        size="sm"
      >
        <div className="space-y-4">
          <Input 
            label="Nome completo" 
            placeholder="Ex: João Silva" 
            value={form.name} 
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
          />
          <Select
            label="Papel"
            options={[
              { value: 'admin', label: 'Administrador — Acesso total' },
              { value: 'gestor', label: 'Gestor — Inventário e relatórios' },
              { value: 'caixa', label: 'Funcionário — Entradas/saídas e scan' },
              { value: 'auditor', label: 'Auditor — Apenas leitura' },
            ]}
            value={form.role}
            onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
          />
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} className="flex-1" disabled={saving}>
              {saving ? 'A guardar...' : 'Guardar Alterações'}
            </Button>
            <Button variant="ghost" onClick={() => setShowEditModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* Create User Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Adicionar Utilizador"
        size="sm"
      >
        <div className="space-y-4">
          <Input 
            label="Nome completo" 
            placeholder="Ex: Ana Costa" 
            value={createForm.name} 
            onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} 
          />
          <Input 
            label="Email" 
            type="email"
            placeholder="ana@empresa.pt" 
            value={createForm.email} 
            onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} 
          />
          <Input 
            label="Password" 
            type="password"
            placeholder="••••••••" 
            value={createForm.password} 
            onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} 
          />
          <Select
            label="Papel"
            options={[
              { value: 'admin', label: 'Administrador — Acesso total' },
              { value: 'gestor', label: 'Gestor — Inventário e relatórios' },
              { value: 'caixa', label: 'Funcionário — Entradas/saídas e scan' },
              { value: 'auditor', label: 'Auditor — Apenas leitura' },
            ]}
            value={createForm.role}
            onChange={e => setCreateForm(f => ({ ...f, role: e.target.value as UserRole }))}
          />
          <div className="flex gap-3 pt-2">
            <Button onClick={handleCreate} className="flex-1" disabled={creating}>
              {creating ? 'A criar...' : 'Criar Utilizador'}
            </Button>
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      {/* Delete User Modal */}
      <Modal
        open={!!userToDelete}
        onClose={() => { setUserToDelete(null); setDeleteEmailConfirm(''); }}
        title="Apagar Conta Permanentemente"
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-danger/15 text-danger p-3 rounded-lg text-sm">
            <p className="font-bold mb-1">Aviso Crítico!</p>
            <p>Esta ação é irreversível. O utilizador <strong>{userToDelete?.name}</strong> será permanentemente removido do sistema.</p>
          </div>
          
          <div>
            <p className="text-sm text-text-secondary mb-2">
              Para confirmar, escreva o email da conta (<strong>{userToDelete?.email}</strong>):
            </p>
            <Input 
              placeholder={userToDelete?.email} 
              value={deleteEmailConfirm} 
              onChange={e => setDeleteEmailConfirm(e.target.value)} 
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              variant="danger" 
              onClick={handleDelete} 
              className="flex-1" 
              disabled={deleting || deleteEmailConfirm !== userToDelete?.email}
            >
              {deleting ? 'A apagar...' : 'Apagar Conta'}
            </Button>
            <Button variant="ghost" onClick={() => { setUserToDelete(null); setDeleteEmailConfirm(''); }}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}