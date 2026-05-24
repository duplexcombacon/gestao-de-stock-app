import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, ScanBarcode } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useProducts } from '@/hooks/useProducts';
import { CameraScanner } from '@/components/scanner/CameraScanner';

export default function ProductCreate() {
  const navigate = useNavigate();
  const { products, createProduct } = useProducts();
  const categoryOptions = useMemo(() => {
    const derived = [...new Set(products.map(p => p.category))].filter(Boolean) as string[];
    return derived.length ? derived : ['Bebidas', 'Alimentação', 'Limpeza', 'Lacticínios', 'Higiene'];
  }, [products]);
  const [form, setForm] = useState({
    name: '', sku: '', category: 'Bebidas', unit: 'un',
    cost_price: '', sell_price: '', min_stock: '', barcode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const update = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!form.sku.trim()) newErrors.sku = 'SKU é obrigatório';
    if (!form.cost_price || Number(form.cost_price) <= 0) newErrors.cost_price = 'Preço deve ser positivo';
    if (!form.sell_price || Number(form.sell_price) <= 0) newErrors.sell_price = 'Preço deve ser positivo';
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
          sell_price: Number(form.sell_price),
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
            options={categoryOptions.map(c => ({ value: c, label: c }))}
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
          <Input label="Preço de Venda (€)" type="number" step="0.01" placeholder="0.00" value={form.sell_price} onChange={e => update('sell_price', e.target.value)} error={errors.sell_price} />
          <Input label="Stock Mínimo" type="number" placeholder="0" value={form.min_stock} onChange={e => update('min_stock', e.target.value)} error={errors.min_stock} />
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Código de Barras</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input 
                  placeholder="Inserir manualmente..." 
                  value={form.barcode} 
                  onChange={e => update('barcode', e.target.value)} 
                />
              </div>
              <Button
                variant="secondary"
                icon={<ScanBarcode size={18} />}
                onClick={() => setIsCameraOpen(true)}
              >
                Ler com Câmara
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button icon={<Save size={16} />} onClick={handleSubmit} disabled={saving}>
            {saving ? 'A guardar...' : 'Guardar Produto'}
          </Button>
          <Button variant="ghost" onClick={() => navigate(-1)}>Cancelar</Button>
        </div>
      </div>

      {isCameraOpen && (
        <CameraScanner
          mode="product"
          onDecode={(text) => {
            update('barcode', text);
            setIsCameraOpen(false);
          }}
          onClose={() => setIsCameraOpen(false)}
        />
      )}
    </div>
  );
}
