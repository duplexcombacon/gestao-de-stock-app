import { useState, useEffect } from 'react';
import { Save, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function Profile() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) {
      toast.error('O nome não pode estar vazio');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: name.trim() })
        .eq('id', user.id);

      if (error) throw error;
      
      toast.success('Perfil atualizado com sucesso! Faz refresh à página para veres as alterações.', {
        icon: '✅',
      });
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao atualizar perfil: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="bg-surface-raised border border-border rounded-xl p-6 sm:p-8 space-y-8">
        
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-full bg-surface-overlay flex items-center justify-center">
            <UserIcon size={32} className="text-text-muted" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">O Meu Perfil</h2>
            <p className="text-sm text-text-muted">Gere a tua conta e preferências</p>
          </div>
        </div>

        <div className="space-y-4">
          <Input 
            label="Email" 
            value={user?.email || ''} 
            disabled 
            className="opacity-60 cursor-not-allowed"
          />
          <Input 
            label="Papel (Role)" 
            value={user?.role.toUpperCase() || ''} 
            disabled 
            className="opacity-60 cursor-not-allowed"
          />
          <Input 
            label="Nome Completo" 
            placeholder="O teu nome..." 
            value={name} 
            onChange={e => setName(e.target.value)} 
          />
        </div>

        <div className="pt-4 flex justify-end">
          <Button icon={<Save size={16} />} onClick={handleSave} loading={saving}>
            Guardar Alterações
          </Button>
        </div>
      </div>
    </div>
  );
}
