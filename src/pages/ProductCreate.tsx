import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { categories } from '@/data/mock';
import { useProducts } from '@/hooks/useProducts';

export default function ProductCreate() {
  const navigate = useNavigate();
  const { createProduct } = useProducts();
  const [form, setForm] = useState({
    name: '', sku: '', category: categories[0], unit: 'un',
    cost_price: '', min_stock: '', barcode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const update = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!form.sku.trim()) newErrors.sku = 'SKU é obrigatório';
    if (!form.cost_price || Number(form.cost_price) <= 0) newErrors.cost_price = 'Preço deve ser positivo';
    if (!form.min_stock || Number(form.min_stock) < 0) newErrors.min_stock = 'Stock mínimo inválido';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const save = async () => {
      setSaving(true);
      try {
        await createProduct({
          name: form.name.trim(),
          sku: form.sku.trim(),
          category: form.category,
          unit: form.unit,
          cost_price: Number(form.cost_price),
          min_stock: Number(form.min_stock),
          barcode: form.barcode.trim() || undefined,
        });
        navigate('/produtos');
      } catch (error: any) {
        alert('Erro ao criar produto: ' + error.message);
      } finally {
        setSaving(false);
      }
    };
    
    save();
  };

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} /> Voltar
      </button>

      <div className="bg-surface-raised border border-border rounded-xl p-6 space-y-6">
        <h2 className="text-lg font-semibold">Novo Produto</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nome" placeholder="Ex: Água Mineral 1.5L" value={form.name} onChange={e => update('name', e.target.value)} error={errors.name} />
          <Input label="SKU" placeholder="Ex: BEB-001" value={form.sku} onChange={e => update('sku', e.target.value)} error={errors.sku} />
          <Select
            label="Categoria"
            options={categories.map(c => ({ value: c, label: c }))}
            value={form.category}
            onChange={e => update('category', e.target.value)}
          />
          <Select
            label="Unidade"
            options={[
              { value: 'un', label: 'Unidade (un)' },
              { value: 'kg', label: 'Quilograma (kg)' },
              { value: 'l', label: 'Litro (l)' },
              { value: 'cx', label: 'Caixa (cx)' },
            ]}
            value={form.unit}
            onChange={e => update('unit', e.target.value)}
          />
          <Input label="Preço de Custo (€)" type="number" step="0.01" placeholder="0.00" value={form.cost_price} onChange={e => update('cost_price', e.target.value)} error={errors.cost_price} />
          <Input label="Stock Mínimo" type="number" placeholder="0" value={form.min_stock} onChange={e => update('min_stock', e.target.value)} error={errors.min_stock} />
          <div className="sm:col-span-2">
            <Input label="Código de Barras" placeholder="Ler via câmara ou inserir manualmente" value={form.barcode} onChange={e => update('barcode', e.target.value)} />
            <p className="text-xs text-text-muted mt-1">Podes ler o código com o scanner na página /scan</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button icon={<Save size={16} />} onClick={handleSubmit} disabled={saving}>
            {saving ? 'A guardar...' : 'Guardar Produto'}
          </Button>
          <Button variant="ghost" onClick={() => navigate(-1)}>Cancelar</Button>
        </div>
      </div>
    </div>
  );
}
