import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useProductDetail } from '@/hooks/useProducts';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useBatches } from '@/hooks/useBatches';

export default function ProductBatchCreate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { product, isLoading: productLoading } = useProductDetail(id);
  const { warehouses } = useWarehouses();
  const { createBatch } = useBatches(id);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    batch_code: '',
    expiry_date: '',
    quantity: '1',
    warehouse_id: '',
    notes: '',
  });

  // Pre-select the first warehouse once they load
  useEffect(() => {
    if (warehouses.length > 0 && !form.warehouse_id) {
      setForm(prev => ({ ...prev, warehouse_id: warehouses[0].id }));
    }
  }, [warehouses, form.warehouse_id]);

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};
    if (!form.batch_code.trim()) nextErrors.batch_code = 'Código do lote é obrigatório';
    if (!form.expiry_date) nextErrors.expiry_date = 'Validade é obrigatória';
    if (Number(form.quantity) <= 0) nextErrors.quantity = 'Quantidade deve ser superior a zero';
    if (!form.warehouse_id) nextErrors.warehouse_id = 'Escolhe uma localização';

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      await createBatch({
        product_id: id as string,
        warehouse_id: form.warehouse_id,
        batch_code: form.batch_code,
        expiry_date: form.expiry_date,
        quantity: Number(form.quantity),
        notes: form.notes,
      });
      navigate(`/produtos/${id}`);
    } catch (err: any) {
      console.error(err);
      setErrors({ batch_code: err.message || 'Erro ao criar lote' });
    } finally {
      setSaving(false);
    }
  };

  if (productLoading) {
    return <div className="flex justify-center py-20 text-text-muted">A carregar produto...</div>;
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-muted">
        <p>Produto não encontrado</p>
        <button onClick={() => navigate('/produtos')} className="mt-3 text-accent hover:underline cursor-pointer">Voltar ao catálogo</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors cursor-pointer">
        <ArrowLeft size={16} /> Voltar
      </button>

      <div className="bg-surface-raised border border-border rounded-xl p-6 space-y-6">
        <div>
          <p className="text-xs text-text-muted font-mono mb-1">{product.sku}</p>
          <h2 className="text-lg font-semibold">Novo Lote</h2>
          <p className="text-sm text-text-muted mt-1">{product.name}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Código do Lote" placeholder="Ex: LT-2026-001" value={form.batch_code} onChange={e => update('batch_code', e.target.value)} error={errors.batch_code} />
          <Input label="Validade" type="date" value={form.expiry_date} onChange={e => update('expiry_date', e.target.value)} error={errors.expiry_date} />
          <Input label="Quantidade Inicial" type="number" min="1" value={form.quantity} onChange={e => update('quantity', e.target.value)} error={errors.quantity} />
          <Select
            label="Localização"
            value={form.warehouse_id}
            onChange={e => update('warehouse_id', e.target.value)}
            options={warehouses.map(w => ({ value: w.id, label: w.name }))}
          />
          <div className="sm:col-span-2">
            <Input label="Notas" placeholder="Opcional" value={form.notes} onChange={e => update('notes', e.target.value)} />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button icon={<Save size={16} />} onClick={handleSave} loading={saving}>Guardar Lote</Button>
          <Button variant="ghost" onClick={() => navigate(-1)}>Cancelar</Button>
        </div>
      </div>
    </div>
  );
}
