import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, ScanBarcode } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { BarcodeScanner } from '@/components/domain/BarcodeScanner';
import { categories, getProductById } from '@/data/mock';

export default function ProductEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = getProductById(id || '');
  const categoryOptions = useMemo(() => categories.length ? categories : ['Geral'], []);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: product?.name || '',
    sku: product?.sku || '',
    category: product?.category || categoryOptions[0],
    unit: product?.unit || 'un',
    cost_price: String(product?.cost_price ?? ''),
    sell_price: String(product?.sell_price ?? ''),
    min_stock: String(product?.min_stock ?? ''),
    barcode: product?.barcode || '',
  });

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = 'Nome é obrigatório';
    if (!form.sku.trim()) nextErrors.sku = 'SKU é obrigatório';
    if (Number.isNaN(Number(form.cost_price)) || Number(form.cost_price) < 0) nextErrors.cost_price = 'Preço inválido';
    if (Number.isNaN(Number(form.sell_price)) || Number(form.sell_price) < 0) nextErrors.sell_price = 'Preço inválido';
    if (Number.isNaN(Number(form.min_stock)) || Number(form.min_stock) < 0) nextErrors.min_stock = 'Stock mínimo inválido';

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    // Aqui deve entrar a mutation/update real: supabase.from('products').update(...).eq('id', id)
    await new Promise(resolve => setTimeout(resolve, 250));
    setSaving(false);
    navigate(`/produtos/${id}`);
  };

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
      {scannerOpen && (
        <BarcodeScanner
          title="Ler código de barras"
          hint="Aponte a câmara para o código de barras do produto"
          onClose={() => setScannerOpen(false)}
          onDecode={(value) => {
            update('barcode', value);
            setScannerOpen(false);
          }}
        />
      )}

      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors cursor-pointer">
        <ArrowLeft size={16} /> Voltar
      </button>

      <div className="bg-surface-raised border border-border rounded-xl p-6 space-y-6">
        <div>
          <p className="text-xs text-text-muted font-mono mb-1">{product.sku}</p>
          <h2 className="text-lg font-semibold">Editar Produto</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nome" value={form.name} onChange={e => update('name', e.target.value)} error={errors.name} />
          <Input label="SKU" value={form.sku} onChange={e => update('sku', e.target.value)} error={errors.sku} />
          <Select label="Categoria" value={form.category} onChange={e => update('category', e.target.value)} options={categoryOptions.map(c => ({ value: c, label: c }))} />
          <Select
            label="Unidade"
            value={form.unit}
            onChange={e => update('unit', e.target.value)}
            options={[
              { value: 'un', label: 'Unidade (un)' },
              { value: 'kg', label: 'Quilograma (kg)' },
              { value: 'l', label: 'Litro (l)' },
              { value: 'cx', label: 'Caixa (cx)' },
              { value: 'pack', label: 'Pack' },
            ]}
          />
          <Input label="Preço de Custo (€)" type="number" step="0.01" value={form.cost_price} onChange={e => update('cost_price', e.target.value)} error={errors.cost_price} />
          <Input label="Preço de Venda (€)" type="number" step="0.01" value={form.sell_price} onChange={e => update('sell_price', e.target.value)} error={errors.sell_price} />
          <Input label="Stock Mínimo" type="number" value={form.min_stock} onChange={e => update('min_stock', e.target.value)} error={errors.min_stock} />
          <div className="sm:col-span-2">
            <Input label="Código de Barras" value={form.barcode} onChange={e => update('barcode', e.target.value)} />
            <Button className="mt-2" variant="secondary" size="sm" icon={<ScanBarcode size={14} />} onClick={() => setScannerOpen(true)}>
              Ler com câmara
            </Button>
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
