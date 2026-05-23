import { useState } from 'react';
import { UserPlus, Shield, Pencil, Ban, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Table, type Column } from '@/components/ui/Table';
import { mockUsers } from '@/data/mock';
import { formatDate } from '@/utils/formatters';
import type { User, UserRole } from '@/types';

const roleConfig: Record<UserRole, { label: string; variant: 'accent' | 'success' | 'warning' | 'default' }> = {
  admin: { label: 'Administrador', variant: 'accent' },
  gestor: { label: 'Gestor', variant: 'success' },
  caixa: { label: 'Funcionário', variant: 'warning' },
  auditor: { label: 'Auditor', variant: 'default' },
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'caixa' as UserRole });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = users.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingUser(null);
    setForm({ name: '', email: '', password: '', role: 'caixa' });
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role });
    setErrors({});
    setShowModal(true);
  };

  const update = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!form.email.trim()) newErrors.email = 'Email é obrigatório';
    if (!editingUser && !form.password) newErrors.password = 'Password é obrigatória';
    if (form.password && form.password.length < 6) newErrors.password = 'Mínimo 6 caracteres';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (editingUser) {
      // TODO: supabase.auth.admin.updateUserById(editingUser.id, { email, password })
      //       supabase.from('profiles').update({ name, role }).eq('id', editingUser.id)
      setUsers(prev => prev.map(u =>
        u.id === editingUser.id ? { ...u, name: form.name, email: form.email, role: form.role } : u
      ));
    } else {
      // TODO: supabase.auth.admin.createUser({ email, password, email_confirm: true })
      //       supabase.from('profiles').insert({ id: newUser.id, name, role })
      const newUser: User = {
        id: `u${Date.now()}`,
        name: form.name,
        email: form.email,
        role: form.role,
        created_at: new Date().toISOString(),
      };
      setUsers(prev => [...prev, newUser]);
    }

    setShowModal(false);
  };

  const handleToggleStatus = (user: User) => {
    // TODO: supabase.auth.admin.updateUserById(user.id, { banned: true/false })
    if (confirm(`Desativar a conta de ${user.name}?`)) {
      setUsers(prev => prev.filter(u => u.id !== user.id));
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Utilizador',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-surface-overlay flex items-center justify-center text-xs font-bold text-text-secondary">
            {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{u.name}</p>
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
        const cfg = roleConfig[u.role];
        return (
          <Badge variant={cfg.variant}>
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
            className="p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger-muted transition-colors cursor-pointer"
            title="Desativar"
          >
            <Ban size={14} />
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
        <Button icon={<UserPlus size={16} />} onClick={openCreate}>
          Novo Utilizador
        </Button>
      </div>

      <div className="flex gap-4 text-sm text-text-secondary">
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
        emptyMessage="Nenhum utilizador encontrado"
      />

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? 'Editar Utilizador' : 'Novo Utilizador'}
        size="sm"
      >
        <div className="space-y-4">
          <Input label="Nome completo" placeholder="Ex: João Silva" value={form.name} onChange={e => update('name', e.target.value)} error={errors.name} />
          <Input label="Email" type="email" placeholder="nome@empresa.pt" value={form.email} onChange={e => update('email', e.target.value)} error={errors.email} />
          <Input label={editingUser ? 'Nova password (deixar vazio para manter)' : 'Password'} type="password" placeholder="••••••••" value={form.password} onChange={e => update('password', e.target.value)} error={errors.password} />
          <Select
            label="Papel"
            options={[
              { value: 'admin', label: 'Administrador — Acesso total' },
              { value: 'gestor', label: 'Gestor — Inventário e relatórios' },
              { value: 'caixa', label: 'Funcionário — Entradas/saídas e scan' },
              { value: 'auditor', label: 'Auditor — Apenas leitura' },
            ]}
            value={form.role}
            onChange={e => update('role', e.target.value)}
          />
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSubmit} className="flex-1">
              {editingUser ? 'Guardar Alterações' : 'Criar Utilizador'}
            </Button>
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}