import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, QrCode, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useWarehouses, useWarehouseDetail } from '@/hooks/useWarehouses';
import { toast } from 'sonner';
import type { Warehouse } from '@/types';

type WarehouseType = Warehouse['type'];

export default function WarehouseEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { warehousesFlat, updateWarehouse } = useWarehouses();
  const { warehouse, isLoading } = useWarehouseDetail(id);
  
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: '',
    parent_id: '',
    type: 'warehouse' as WarehouseType,
    qr_code: '',
    description: '',
  });

  useEffect(() => {
    if (warehouse) {
      setForm({
        name: warehouse.name || '',
        parent_id: warehouse.parent_id || '',
        type: warehouse.type as WarehouseType,
        qr_code: warehouse.qr_code || '',
        description: warehouse.description || '',
      });
    }
  }, [warehouse]);

  const parentOptions = useMemo(() => {
    let filtered = warehousesFlat;
    
    // Regras de hierarquia:
    // - Armazém/Loja/Zona: pode estar dentro de outro armazém/zona, ou não ter pai. Não pode estar num corredor/prateleira.
    // - Corredor: só pode estar dentro de um armazém, zona ou loja.
    // - Prateleira: só pode estar dentro de um corredor.
    if (['warehouse', 'store', 'zone'].includes(form.type)) {
      filtered = warehousesFlat.filter(w => ['warehouse', 'store', 'zone'].includes(w.type));
    } else if (form.type === 'corridor') {
      filtered = warehousesFlat.filter(w => ['warehouse', 'store', 'zone'].includes(w.type));
    } else if (form.type === 'shelf') {
      filtered = warehousesFlat.filter(w => w.type === 'corridor');
    }

    return [
      { value: '', label: 'Sem pai · nível principal' },
      ...filtered.filter(w => w.id !== id).map(w => ({ value: w.id, label: w.name })),
    ];
  }, [warehousesFlat, form.type, id]);

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = 'Nome é obrigatório';
    if (!form.qr_code.trim()) nextErrors.qr_code = 'QR code é obrigatório';
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      await updateWarehouse(id!, {
        name: form.name,
        type: form.type,
        parent_id: form.parent_id || null,
        qr_code: form.qr_code,
        description: form.description,
      });
      toast.success('Localização atualizada com sucesso!');
      navigate(`/armazens/${id}`);
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao atualizar localização. Verifica se o QR Code já existe.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20 text-text-muted">A carregar dados...</div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors cursor-pointer">
        <ArrowLeft size={16} /> Voltar
      </button>

      <div className="bg-surface-raised border border-border rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Editar Localização</h2>
          <p className="text-sm text-text-muted mt-1">Atualiza os dados deste armazém, corredor ou prateleira.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nome" placeholder="Ex: Prateleira A3" value={form.name} onChange={e => update('name', e.target.value)} error={errors.name} />
          <Select
            label="Tipo"
            value={form.type}
            onChange={e => update('type', e.target.value)}
            options={[
              { value: 'warehouse', label: 'Armazém' },
              { value: 'zone', label: 'Zona' },
              { value: 'store', label: 'Loja' },
              { value: 'corridor', label: 'Corredor' },
              { value: 'shelf', label: 'Prateleira' },
            ]}
          />
          <div className="sm:col-span-2">
            <Select label="Localização Pai" value={form.parent_id} onChange={e => update('parent_id', e.target.value)} options={parentOptions} />
          </div>
          <div className="sm:col-span-2">
            <Input label="QR Code" value={form.qr_code} onChange={e => update('qr_code', e.target.value)} error={errors.qr_code} />
            <Button className="mt-2" variant="secondary" size="sm" icon={<QrCode size={14} />} onClick={() => update('qr_code', `QR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`)}>
              Gerar novo código
            </Button>
          </div>
          <div className="sm:col-span-2">
            <Input label="Descrição" placeholder="Opcional" value={form.description} onChange={e => update('description', e.target.value)} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface-overlay p-5 text-center">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Pré-visualização QR</p>
          <div className="mx-auto size-36 bg-white rounded-lg flex items-center justify-center text-black font-mono text-xs text-center p-4 break-all">
            {form.qr_code}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button icon={<Save size={16} />} onClick={handleSave} loading={saving}>Guardar Alterações</Button>
          <Button variant="ghost" onClick={() => navigate(-1)}>Cancelar</Button>
        </div>
      </div>
    </div>
  );
}
