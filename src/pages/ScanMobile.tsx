import { useState, useCallback, useEffect } from 'react';
import {
  QrCode, ScanBarcode, MapPin, Package, X, CheckCircle, AlertCircle,
  ArrowDownToLine, ArrowUpFromLine, Plus, Minus, Loader2, Save,
  ChevronRight, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { findWarehouseByQrCode, getInventoryByWarehouse } from '@/hooks/useWarehouses';
import { findProductByBarcode, createProductFromBarcode, createMovement } from '@/hooks/useProducts';
import { useNetworkState } from '@/hooks/useNetworkState';
import { CameraScanner } from '@/components/scanner/CameraScanner';
import { cn } from '@/utils/formatters';
import type { Warehouse, Product, InventoryItem, NewProductFormData, ScanMode } from '@/types';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface InventoryItemWithProduct extends InventoryItem {
  product: Product;
}

interface Feedback {
  type: 'success' | 'error';
  message: string;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const UNIT_OPTIONS = [
  { value: 'un', label: 'Unidade (un)' },
  { value: 'kg', label: 'Quilograma (kg)' },
  { value: 'l', label: 'Litro (L)' },
  { value: 'cx', label: 'Caixa (cx)' },
  { value: 'm', label: 'Metro (m)' },
];

const CATEGORY_OPTIONS = [
  { value: 'Bebidas', label: 'Bebidas' },
  { value: 'Alimentação', label: 'Alimentação' },
  { value: 'Lacticínios', label: 'Lacticínios' },
  { value: 'Limpeza', label: 'Limpeza' },
  { value: 'Higiene', label: 'Higiene' },
  { value: 'Outro', label: 'Outro' },
];

const LOCATION_TYPE_LABEL: Record<string, string> = {
  warehouse: 'Armazém',
  corridor: 'Corredor',
  shelf: 'Prateleira',
};

const EMPTY_FORM: NewProductFormData = {
  barcode: '', name: '', sku: '', category: 'Bebidas', unit: 'un', cost_price: 0, sell_price: 0, min_stock: 0,
};

// Removed CameraScanner, now imported

// ─────────────────────────────────────────────────────────────
// QtyStepper sub-component
// ─────────────────────────────────────────────────────────────

interface QtyStepperProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
}

function QtyStepper({ value, onChange, min = 1 }: QtyStepperProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="size-9 rounded-lg bg-surface-overlay border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-border transition-colors"
      >
        <Minus size={16} />
      </button>
      <span className="w-12 text-center font-mono font-bold text-text-primary text-xl">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="size-9 rounded-lg bg-surface-overlay border border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-border transition-colors"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────

export default function ScanMobile() {
  const { isOnline } = useNetworkState();
  // ── Location state ──
  const [activeLocation, setActiveLocation] = useState<Warehouse | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemWithProduct[]>([]);

  // ── Product state ──
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [unknownBarcode, setUnknownBarcode] = useState<string | null>(null);

  // ── Camera state ──
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>('location');

  // ── New product form ──
  const [newProductForm, setNewProductForm] = useState<NewProductFormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  // ── Movement state ──
  const [movementQty, setMovementQty] = useState(1);
  const [isMoving, setIsMoving] = useState(false);

  // ── Feedback ──
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  // ── Manual input ──
  const [manualInput, setManualInput] = useState('');

  // Auto-dismiss feedback after 4 seconds
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(t);
  }, [feedback]);

  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
  }, []);

  // ── Open camera in a given mode ──
  const openCamera = useCallback((mode: ScanMode) => {
    if (mode === 'product' && !activeLocation) {
      showFeedback('error', 'Leia primeiro o QR Code da localização');
      return;
    }
    setScanMode(mode);
    setIsCameraOpen(true);
  }, [activeLocation, showFeedback]);

  // ── Handle a decoded value (from camera or manual input) ──
  const handleDecode = useCallback(async (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    setIsCameraOpen(false);

    if (scanMode === 'location') {
      const warehouse = await findWarehouseByQrCode(text);
      if (warehouse) {
        setActiveLocation(warehouse);
        const items = await getInventoryByWarehouse(warehouse.id);
        setInventoryItems(items);
        setScannedProduct(null);
        setUnknownBarcode(null);
        showFeedback('success', `Localização "${warehouse.name}" ativada`);
      } else {
        showFeedback('error', `Localização não encontrada para: "${text}"`);
      }
    } else {
      if (!activeLocation) {
        showFeedback('error', 'Leia primeiro o QR Code da localização');
        return;
      }
      const product = await findProductByBarcode(text);
      if (product) {
        setScannedProduct(product);
        setUnknownBarcode(null);
        setMovementQty(1);
      } else {
        if (!isOnline) {
          showFeedback('error', 'Criação de novos produtos indisponível em modo offline');
          return;
        }
        setScannedProduct(null);
        setUnknownBarcode(text);
        setNewProductForm({ ...EMPTY_FORM, barcode: text });
      }
    }
  }, [scanMode, showFeedback, activeLocation, isOnline]);

  // ── Manual input submit ──
  const handleManualSubmit = useCallback(async () => {
    const trimmed = manualInput.trim();
    if (!trimmed) return;
    await handleDecode(trimmed);
    setManualInput('');
  }, [manualInput, handleDecode]);

  // ── Register a stock movement ──
  const handleMovement = useCallback(async (type: 'in' | 'out') => {
    if (!scannedProduct || !activeLocation) return;
    const warehouseId = activeLocation.id;
    setIsMoving(true);
    try {
      await createMovement(type, scannedProduct.id, warehouseId, movementQty);
      showFeedback(
        'success',
        `${type === 'in' ? 'Entrada' : 'Saída'} de ${movementQty}×  ${scannedProduct.name} registada`,
      );
      // Refresh inventory if a location is active
      if (activeLocation) {
        const items = await getInventoryByWarehouse(activeLocation.id);
        setInventoryItems(items);
      }
      setScannedProduct(null);
      setMovementQty(1);
    } catch {
      showFeedback('error', 'Erro ao registar o movimento');
    } finally {
      setIsMoving(false);
    }
  }, [scannedProduct, activeLocation, movementQty, showFeedback]);

  // ── Save new product from form ──
  const handleSaveNewProduct = useCallback(async () => {
    if (!activeLocation) {
      showFeedback('error', 'Selecione uma localização antes de guardar o produto');
      return;
    }
    if (!newProductForm.name.trim() || !newProductForm.sku.trim()) {
      showFeedback('error', 'Nome e SKU são obrigatórios');
      return;
    }
    setIsSaving(true);
    try {
      const product = await createProductFromBarcode(newProductForm);
      // Register product in the active location's inventory (qty 0 as baseline)
      await createMovement('in', product.id, activeLocation.id, 0);
      // Refresh inventory list
      const items = await getInventoryByWarehouse(activeLocation.id);
      setInventoryItems(items);
      setScannedProduct(product);
      setUnknownBarcode(null);
      setMovementQty(1);
      setNewProductForm(EMPTY_FORM);
      showFeedback('success', `Produto "${product.name}" criado e associado a "${activeLocation.name}"`);
    } catch {
      showFeedback('error', 'Erro ao guardar o produto');
    } finally {
      setIsSaving(false);
    }
  }, [newProductForm, showFeedback, activeLocation]);

  // ── Clear active location ──
  const clearLocation = useCallback(() => {
    setActiveLocation(null);
    setInventoryItems([]);
    setScannedProduct(null);
    setUnknownBarcode(null);
    setScanMode('location');
  }, []);

  // ── Stock quantity at the active location for the scanned product ──
  const stockAtLocation =
    scannedProduct && activeLocation
      ? (inventoryItems.find(i => i.product_id === scannedProduct.id)?.quantity ?? 0)
      : null;

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="max-w-md mx-auto space-y-4 pb-10">

      {/* ── Camera overlay ── */}
      {isCameraOpen && (
        <CameraScanner
          mode={scanMode}
          onDecode={handleDecode}
          onClose={() => setIsCameraOpen(false)}
        />
      )}

      {/* ── Feedback banner ── */}
      {feedback && (
        <div
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium border',
            feedback.type === 'success'
              ? 'bg-success/10 text-success border-success/20'
              : 'bg-danger/10 text-danger border-danger/20',
          )}
        >
          {feedback.type === 'success' ? (
            <CheckCircle size={18} className="shrink-0" />
          ) : (
            <AlertCircle size={18} className="shrink-0" />
          )}
          <span className="flex-1">{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Fechar"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Active location banner ── */}
      <div
        className={cn(
          'rounded-xl border px-4 py-3 flex items-center gap-3 transition-all',
          activeLocation
            ? 'bg-accent/5 border-accent/20'
            : 'bg-surface-raised border-border',
        )}
      >
        <div
          className={cn(
            'size-10 rounded-xl flex items-center justify-center shrink-0',
            activeLocation ? 'bg-accent/15' : 'bg-surface-overlay',
          )}
        >
          <MapPin size={20} className={activeLocation ? 'text-accent' : 'text-text-muted'} />
        </div>
        <div className="flex-1 min-w-0">
          {activeLocation ? (
            <>
              <p className="text-[11px] text-accent font-semibold uppercase tracking-wider">
                {LOCATION_TYPE_LABEL[activeLocation.type] ?? 'Localização'}
              </p>
              <p className="font-semibold text-text-primary truncate">{activeLocation.name}</p>
            </>
          ) : (
            <>
              <p className="font-medium text-text-secondary">Sem localização ativa</p>
              <p className="text-xs text-text-muted">Leia o QR Code de uma prateleira</p>
            </>
          )}
        </div>
        {activeLocation && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => openCamera('location')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-overlay text-xs text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors"
              aria-label="Trocar localização"
            >
              <RefreshCw size={12} />
              <span>Trocar</span>
            </button>
            <button
              onClick={clearLocation}
              className="size-7 rounded-full bg-surface-overlay flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-border transition-colors"
              aria-label="Limpar localização"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ── Scan action buttons ── */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => openCamera('location')}
          className="flex flex-col items-center gap-2.5 rounded-xl border border-border bg-surface-raised p-4 hover:border-blue-400/40 hover:bg-blue-500/5 transition-all active:scale-[0.97]"
        >
          <div className="size-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <QrCode size={24} className="text-blue-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-text-primary">QR Localização</p>
            <p className="text-[11px] text-text-muted leading-tight mt-0.5">Prateleira / Corredor</p>
          </div>
        </button>

        <button
          onClick={() => openCamera('product')}
          disabled={!activeLocation}
          className={cn(
            'flex flex-col items-center gap-2.5 rounded-xl border p-4 transition-all',
            activeLocation
              ? 'border-border bg-surface-raised hover:border-green-400/40 hover:bg-green-500/5 active:scale-[0.97]'
              : 'border-border/50 bg-surface-raised/50 opacity-50 cursor-not-allowed',
          )}
        >
          <div className={cn('size-12 rounded-xl flex items-center justify-center', activeLocation ? 'bg-green-500/10' : 'bg-surface-overlay')}>
            <ScanBarcode size={24} className={activeLocation ? 'text-green-400' : 'text-text-muted'} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-text-primary">Código Produto</p>
            <p className="text-[11px] text-text-muted leading-tight mt-0.5">
              {activeLocation ? 'Entrada / Saída' : 'Leia a localização primeiro'}
            </p>
          </div>
        </button>
      </div>

      {/* ── Manual input (for testing without camera) ── */}
      <div>
        <p className="text-[11px] text-text-muted uppercase tracking-wider font-medium mb-1.5 px-0.5">
          {activeLocation ? 'Input manual · ex: 5601234567890' : 'Input manual · ex: QR-W4'}
        </p>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder={activeLocation ? 'Código de barras do produto...' : 'QR Code da localização...'}
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
            />
          </div>
          <Button
            variant="secondary"
            onClick={handleManualSubmit}
            disabled={!manualInput.trim()}
          >
            Ler
          </Button>
        </div>
        <p className="text-[10px] text-text-muted mt-1 px-0.5">
          {activeLocation
            ? 'Modo: produto — o código será interpretado como barcode'
            : 'Modo: localização — introduza o QR Code da prateleira ou corredor'}
        </p>
      </div>

      {/* ── Product found card ── */}
      {scannedProduct && (
        <div className="bg-surface-raised border border-border rounded-xl p-5 space-y-4 animate-[slideUp_0.2s_ease-out]">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="size-11 rounded-xl bg-accent-muted flex items-center justify-center shrink-0">
              <Package size={20} className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <p className="font-semibold text-text-primary leading-tight">{scannedProduct.name}</p>
                <Badge variant="default">{scannedProduct.category}</Badge>
              </div>
              <p className="text-xs text-text-muted font-mono mt-0.5">
                {scannedProduct.sku}
                {scannedProduct.barcode && ` · ${scannedProduct.barcode}`}
              </p>
            </div>
          </div>

          {/* Stock stats */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-surface-overlay rounded-lg p-3 text-center">
              <p className="text-xl font-bold font-mono">
                {stockAtLocation !== null ? stockAtLocation : '—'}
              </p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">
                {activeLocation ? 'Nesta loc.' : 'Aqui'}
              </p>
            </div>
            <div className="bg-surface-overlay rounded-lg p-3 text-center">
              <p className="text-xl font-bold font-mono text-warning">
                {scannedProduct.min_stock}
              </p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">Mínimo</p>
            </div>
            <div className="bg-surface-overlay rounded-lg p-3 text-center">
              <p className="text-xl font-bold font-mono">{scannedProduct.cost_price.toFixed(2)}€</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">Custo</p>
            </div>
          </div>

          {/* Quantity stepper */}
          <div className="flex items-center justify-between px-1">
            <span className="text-sm text-text-secondary font-medium">Quantidade</span>
            <QtyStepper value={movementQty} onChange={setMovementQty} />
          </div>

          {/* Movement buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="success"
              size="lg"
              icon={isMoving ? <Loader2 size={18} className="animate-spin" /> : <ArrowDownToLine size={18} />}
              onClick={() => handleMovement('in')}
              disabled={isMoving}
              className="py-4"
            >
              Entrada
            </Button>
            <Button
              variant="danger"
              size="lg"
              icon={isMoving ? <Loader2 size={18} className="animate-spin" /> : <ArrowUpFromLine size={18} />}
              onClick={() => handleMovement('out')}
              disabled={isMoving}
              className="py-4"
            >
              Saída
            </Button>
          </div>

          <button
            onClick={() => { setScannedProduct(null); setMovementQty(1); }}
            className="w-full text-center text-xs text-text-muted hover:text-text-secondary transition-colors py-1"
          >
            Limpar seleção
          </button>
        </div>
      )}

      {/* ── Unknown barcode — new product form ── */}
      {unknownBarcode && !scannedProduct && (
        <div className="bg-surface-raised border border-warning/25 rounded-xl p-5 space-y-4 animate-[slideUp_0.2s_ease-out]">
          <div className="flex items-start gap-3">
            <div className="size-11 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
              <Package size={20} className="text-warning" />
            </div>
            <div>
              <p className="font-semibold text-text-primary">Novo produto encontrado</p>
              <p className="text-xs text-text-muted font-mono mt-0.5">{unknownBarcode}</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Barcode — read-only */}
            <Input
              label="Código de barras"
              value={newProductForm.barcode}
              readOnly
              className="opacity-60 cursor-not-allowed"
            />
            <Input
              label="Nome do produto *"
              placeholder="ex: Água Mineral 1.5L"
              value={newProductForm.name}
              onChange={e => setNewProductForm(f => ({ ...f, name: e.target.value }))}
            />
            <Input
              label="SKU *"
              placeholder="ex: BEB-011"
              value={newProductForm.sku}
              onChange={e => setNewProductForm(f => ({ ...f, sku: e.target.value }))}
            />
            <Select
              label="Categoria"
              options={CATEGORY_OPTIONS}
              value={newProductForm.category}
              onChange={e => setNewProductForm(f => ({ ...f, category: e.target.value }))}
            />
            <Select
              label="Unidade"
              options={UNIT_OPTIONS}
              value={newProductForm.unit}
              onChange={e => setNewProductForm(f => ({ ...f, unit: e.target.value }))}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                label="Custo (€)"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={newProductForm.cost_price || ''}
                onChange={e =>
                  setNewProductForm(f => ({ ...f, cost_price: parseFloat(e.target.value) || 0 }))
                }
              />
              <Input
                label="Venda (€)"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={newProductForm.sell_price || ''}
                onChange={e =>
                  setNewProductForm(f => ({ ...f, sell_price: parseFloat(e.target.value) || 0 }))
                }
              />
              <Input
                label="Mínimo"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={newProductForm.min_stock || ''}
                onChange={e =>
                  setNewProductForm(f => ({ ...f, min_stock: parseInt(e.target.value) || 0 }))
                }
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              variant="primary"
              icon={isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              onClick={handleSaveNewProduct}
              disabled={isSaving}
              className="flex-1"
            >
              Guardar produto
            </Button>
            <Button
              variant="ghost"
              onClick={() => setUnknownBarcode(null)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* ── Inventory list for active location ── */}
      {activeLocation && !scannedProduct && !unknownBarcode && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <p className="text-sm font-semibold text-text-primary">
              Produtos nesta localização
            </p>
            <Badge variant="default">{inventoryItems.length}</Badge>
          </div>

          {inventoryItems.length === 0 ? (
            <div className="bg-surface-raised border border-dashed border-border rounded-xl p-8 text-center">
              <Package size={32} className="text-text-muted mx-auto mb-2" />
              <p className="text-sm text-text-secondary">Nenhum produto registado aqui</p>
              <p className="text-xs text-text-muted mt-0.5">
                Use "Código Produto" para adicionar
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {inventoryItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setScannedProduct(item.product);
                    setMovementQty(1);
                  }}
                  className="w-full flex items-center gap-3 bg-surface-raised border border-border rounded-xl px-4 py-3 hover:border-accent/30 hover:bg-accent/5 transition-all text-left active:scale-[0.99]"
                >
                  <div className="size-9 rounded-lg bg-surface-overlay flex items-center justify-center shrink-0">
                    <Package size={16} className="text-text-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-text-muted font-mono">{item.product.sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={cn(
                        'text-sm font-bold font-mono',
                        item.quantity < item.product.min_stock ? 'text-danger' : 'text-text-primary',
                      )}
                    >
                      {item.quantity}
                    </p>
                    <p className="text-[10px] text-text-muted">{item.product.unit}</p>
                  </div>
                  <ChevronRight size={16} className="text-text-muted shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
