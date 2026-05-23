import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { mockProducts, mockWarehousesFlat } from '@/data/mock';

const reasonOptions = [
  { value: 'Embalagem danificada', label: 'Embalagem danificada' },
  { value: 'Produto expirado', label: 'Produto expirado' },
  { value: 'Engano na saída', label: 'Engano na saída' },
  { value: 'Cliente devolveu', label: 'Cliente devolveu' },
  { value: 'Outro', label: 'Outro' },
];

export default function ReturnCreate() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const productOptions = useMemo(() => mockProducts.map(p => ({ value: p.id, label: `${p.name} · ${p.sku}` })), []);
  const warehouseOptions = useMemo(() => mockWarehousesFlat.map(w => ({ value: w.id, label: w.name })), []);
  const [form, setForm] = useState({
    product_id: mockProducts[0]?.id || '',
    warehouse_id: mockWarehousesFlat[0]?.id || '',
    quantity: '1',
    reason: reasonOptions[0].value,
    notes: '',
  });

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};
    if (!form.product_id) nextErrors.product_id = 'Produto é obrigatório';
    if (!form.warehouse_id) nextErrors.warehouse_id = 'Localização é obrigatória';
    if (Number(form.quantity) <= 0) nextErrors.quantity = 'Quantidade deve ser superior a zero';
    if (!form.reason.trim()) nextErrors.reason = 'Razão é obrigatória';

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    // Aqui deve entrar insert real em returns com status pending.
    await new Promise(resolve => setTimeout(resolve, 250));
    setSaving(false);
    navigate('/devolucoes');
  };

  return (
    <div className="max-w-2xl space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors cursor-pointer">
        <ArrowLeft size={16} /> Voltar
      </button>

      <div className="bg-surface-raised border border-border rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Nova Devolução</h2>
          <p className="text-sm text-text-muted mt-1">Regista uma devolução pendente para análise do gestor.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Select label="Produto" value={form.product_id} onChange={e => update('product_id', e.target.value)} options={productOptions} />
            {errors.product_id && <p className="text-xs text-danger mt-1">{errors.product_id}</p>}
          </div>
          <Select label="Localização" value={form.warehouse_id} onChange={e => update('warehouse_id', e.target.value)} options={warehouseOptions} />
          <Input label="Quantidade" type="number" min="1" value={form.quantity} onChange={e => update('quantity', e.target.value)} error={errors.quantity} />
          <div className="sm:col-span-2">
            <Select label="Razão" value={form.reason} onChange={e => update('reason', e.target.value)} options={reasonOptions} />
          </div>
          <div className="sm:col-span-2">
            <Input label="Notas" placeholder="Opcional" value={form.notes} onChange={e => update('notes', e.target.value)} />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button icon={<Save size={16} />} onClick={handleSave} loading={saving}>Registar Devolução</Button>
          <Button variant="ghost" onClick={() => navigate(-1)}>Cancelar</Button>
        </div>
      </div>
    </div>
  );
}
