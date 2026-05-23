import { useState } from 'react';
import { useZxing } from 'react-zxing';
import { AlertCircle, ScanBarcode, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface BarcodeScannerProps {
  title?: string;
  hint?: string;
  onDecode: (value: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ title = 'Ler código', hint = 'Aponte a câmara para o código', onDecode, onClose }: BarcodeScannerProps) {
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [fired, setFired] = useState(false);

  const { ref } = useZxing({
    constraints: { video: { facingMode: 'environment' } },
    timeBetweenDecodingAttempts: 350,
    onDecodeResult(result) {
      if (fired) return;
      setFired(true);
      onDecode(result.getText());
    },
    onError(error) {
      setDecodeError(error instanceof Error ? error.message : 'Erro desconhecido ao iniciar a câmara');
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <div className="flex items-center gap-2 text-white">
          <ScanBarcode size={18} />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <button
          onClick={onClose}
          className="size-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          aria-label="Fechar câmara"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {decodeError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <AlertCircle size={48} className="text-red-400" />
            <p className="text-white text-base font-semibold">Câmara não disponível</p>
            <p className="text-white/60 text-sm">{decodeError}</p>
            <Button variant="secondary" onClick={onClose}>Fechar</Button>
          </div>
        ) : (
          <>
            <video ref={ref} className="absolute inset-0 w-full h-full object-cover" autoPlay playsInline muted />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-64 h-64">
                <div className="absolute top-0 left-0 w-10 h-10 border-t-[3px] border-l-[3px] border-blue-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-10 h-10 border-t-[3px] border-r-[3px] border-blue-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[3px] border-l-[3px] border-blue-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[3px] border-r-[3px] border-blue-400 rounded-br-lg" />
                <div className="absolute top-2 left-3 right-3 h-[2px] bg-blue-400/70 animate-scan-line" />
              </div>
            </div>
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 220px 220px at 50% 50%, transparent 40%, rgba(0,0,0,0.65) 100%)' }} />
          </>
        )}
      </div>

      <div className="px-4 py-4 bg-black/80 text-center">
        <p className="text-white/50 text-xs">{hint}</p>
      </div>
    </div>
  );
}
