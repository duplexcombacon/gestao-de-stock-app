import { useState } from 'react';
import { useZxing } from 'react-zxing';
import { QrCode, ScanBarcode, X } from 'lucide-react';
import type { ScanMode } from '@/types';

interface CameraScannerProps {
  mode: ScanMode;
  onDecode: (text: string) => void;
  onClose: () => void;
}

export function CameraScanner({ mode, onDecode, onClose }: CameraScannerProps) {
  // Guard against firing onDecode multiple times for the same frame burst
  const [fired, setFired] = useState(false);

  const { ref } = useZxing({
    constraints: { 
      video: { 
        facingMode: 'environment',
        width: { ideal: 1280 }, // Resolução superior ajuda imenso na leitura de 1D barcodes
        height: { ideal: 720 },
        advanced: [{ focusMode: 'continuous' } as any] // Força autofocus contínuo (em dispositivos compatíveis)
      } 
    },
    timeBetweenDecodingAttempts: 50, // 20 FPS em vez de 3 FPS (300ms) para ser instantâneo
    onDecodeResult(result) {
      if (fired) return;
      setFired(true);
      onDecode(result.getText());
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <div className="flex items-center gap-2">
          {mode === 'location' ? (
            <QrCode size={18} className="text-blue-400" />
          ) : (
            <ScanBarcode size={18} className="text-green-400" />
          )}
          <span className="text-white text-sm font-medium">
            {mode === 'location' ? 'Ler QR Code da localização' : 'Ler código de barras'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="size-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          aria-label="Fechar câmara"
        >
          <X size={18} />
        </button>
      </div>

      {/* Camera feed or error */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={ref}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />

        {/* Scan frame */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-64 h-64">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-10 h-10 border-t-[3px] border-l-[3px] border-blue-400 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-10 h-10 border-t-[3px] border-r-[3px] border-blue-400 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[3px] border-l-[3px] border-blue-400 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[3px] border-r-[3px] border-blue-400 rounded-br-lg" />
            {/* Animated scan line */}
            <div className="absolute top-2 left-3 right-3 h-[2px] bg-blue-400/70 animate-scan-line" />
          </div>
        </div>

        {/* Vignette overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 220px 220px at 50% 50%, transparent 40%, rgba(0,0,0,0.65) 100%)',
          }}
        />
      </div>

      {/* Footer hint */}
      <div className="px-4 py-4 bg-black/80 text-center">
        <p className="text-white/50 text-xs">
          {mode === 'location'
            ? 'Aponte a câmara para o QR Code da prateleira ou corredor'
            : 'Aponte a câmara para o código de barras'}
        </p>
      </div>
    </div>
  );
}
