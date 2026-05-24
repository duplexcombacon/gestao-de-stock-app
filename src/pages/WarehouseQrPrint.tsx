import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useWarehouseDetail } from '@/hooks/useWarehouses';
import QRCode from 'react-qr-code';

const typeLabels = {
  warehouse: 'Armazém',
  corridor: 'Corredor',
  shelf: 'Prateleira',
};

export default function WarehouseQrPrint() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { warehouse, isLoading } = useWarehouseDetail(id);

  if (isLoading) {
    return <div className="flex justify-center py-20 text-text-muted">A carregar detalhes...</div>;
  }

  if (!warehouse) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-text-muted">
        <p>Localização não encontrada</p>
        <button onClick={() => navigate('/armazens')} className="mt-3 text-accent hover:underline cursor-pointer">Voltar aos armazéns</button>
      </div>
    );
  }

  const qrValue = warehouse.qr_code || `WAREHOUSE:${warehouse.id}`;

  return (
    <div className="max-w-2xl space-y-6 print:max-w-none">
      <div className="flex items-center justify-between print:hidden">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors cursor-pointer">
          <ArrowLeft size={16} /> Voltar
        </button>
        <Button icon={<Printer size={16} />} onClick={() => window.print()}>Imprimir</Button>
      </div>

      <div className="bg-surface-raised border border-border rounded-xl p-6 print:border-0 print:bg-white print:text-black">
        <div className="flex items-center justify-between gap-4 print:hidden">
          <div>
            <Badge variant="accent">{typeLabels[warehouse.type]}</Badge>
            <h2 className="text-xl font-bold mt-2">QR Code da Localização</h2>
          </div>
          <QrCode size={28} className="text-text-muted" />
        </div>

        <div className="mt-8 print:mt-0 flex flex-col items-center text-center">
          <div className="w-full max-w-sm border-2 border-border rounded-2xl p-8 bg-white text-black print:border-black">
            <p className="text-xs uppercase tracking-[0.25em] text-black/60">StockFlow</p>
            <h1 className="text-2xl font-bold mt-2">{warehouse.name}</h1>
            <p className="text-sm text-black/60 mt-1">{typeLabels[warehouse.type]}</p>

            <div className="mx-auto my-8 size-56 border-4 border-black rounded-xl flex items-center justify-center p-5">
              <div className="text-center">
                <div className="bg-white p-2 inline-block rounded-xl">
                  <QRCode value={qrValue} size={140} level="H" />
                </div>
                <p className="font-mono text-xs break-all mt-4">{qrValue}</p>
              </div>
            </div>

            <p className="text-xs text-black/60">Ler com a página Scanner da aplicação</p>
          </div>
        </div>
      </div>
    </div>
  );
}
