import { useState } from 'react';
import { ScanBarcode, Camera, Package, ArrowDownToLine, ArrowUpFromLine, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { getProductById, mockProducts } from '@/data/mock';
import type { Product } from '@/types';

export default function ScanMobile() {
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isOnline] = useState(true);
  const [pendingOps] = useState(0);

  const simulateScan = () => {
    // Simulate scanning a random product
    const random = mockProducts[Math.floor(Math.random() * mockProducts.length)];
    setScannedProduct(random);
  };

  const handleManualLookup = () => {
    const found = mockProducts.find(p =>
      p.barcode === manualCode || p.sku.toLowerCase() === manualCode.toLowerCase()
    );
    setScannedProduct(found || null);
    if (!found) alert('Produto não encontrado');
  };

  const handleMovement = (type: 'in' | 'out') => {
    if (!scannedProduct) return;
    // TODO: call supabase.rpc('create_movement') or queue in Dexie if offline
    console.log(`${type} movement for ${scannedProduct.name}`);
    alert(`${type === 'in' ? 'Entrada' : 'Saída'} registada para ${scannedProduct.name}`);
    setScannedProduct(null);
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Status bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs">
          {isOnline ? (
            <Badge variant="success" dot>Online</Badge>
          ) : (
            <Badge variant="danger" dot>Offline ({pendingOps} pendentes)</Badge>
          )}
        </div>
      </div>

      {/* Camera area */}
      <div className="relative aspect-square bg-surface-overlay border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-4">
        <div className="size-16 rounded-2xl bg-surface-raised flex items-center justify-center">
          <Camera size={32} className="text-text-muted" />
        </div>
        <div className="text-center">
          <p className="text-sm text-text-secondary font-medium">Câmara de scanner</p>
          <p className="text-xs text-text-muted mt-1">react-zxing será integrado aqui</p>
        </div>

        {/* Scan overlay corners */}
        <div className="absolute inset-8 pointer-events-none">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-accent rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-accent rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-accent rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-accent rounded-br-lg" />
        </div>

        <Button onClick={simulateScan} icon={<ScanBarcode size={16} />} size="lg">
          Simular Scan
        </Button>
      </div>

      {/* Manual input */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Código de barras ou SKU..."
            value={manualCode}
            onChange={e => setManualCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleManualLookup()}
          />
        </div>
        <Button variant="secondary" onClick={handleManualLookup}>Procurar</Button>
      </div>

      {/* Scanned product panel */}
      {scannedProduct && (
        <div className="bg-surface-raised border border-border rounded-xl p-5 space-y-4 animate-[slideUp_0.2s_ease-out]">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-lg bg-accent-muted flex items-center justify-center">
              <Package size={18} className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{scannedProduct.name}</p>
              <p className="text-xs text-text-muted font-mono">{scannedProduct.sku} · {scannedProduct.barcode}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-surface-overlay rounded-lg p-3">
              <p className="text-lg font-bold font-mono">120</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Stock</p>
            </div>
            <div className="bg-surface-overlay rounded-lg p-3">
              <p className="text-lg font-bold font-mono">{scannedProduct.min_stock}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Mínimo</p>
            </div>
            <div className="bg-surface-overlay rounded-lg p-3">
              <p className="text-lg font-bold font-mono">{scannedProduct.cost_price.toFixed(2)}€</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Custo</p>
            </div>
          </div>

          {/* Action buttons — big for mobile thumb zone */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="success"
              size="lg"
              icon={<ArrowDownToLine size={18} />}
              onClick={() => handleMovement('in')}
              className="py-4"
            >
              Entrada
            </Button>
            <Button
              variant="danger"
              size="lg"
              icon={<ArrowUpFromLine size={18} />}
              onClick={() => handleMovement('out')}
              className="py-4"
            >
              Saída
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
