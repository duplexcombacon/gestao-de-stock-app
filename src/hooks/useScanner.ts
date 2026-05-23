import { useState, useCallback } from 'react';
import type { ScanMode } from '@/types';

export function useScanner() {
  const [isActive, setIsActive] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<ScanMode>('location');

  const startScanning = useCallback((mode: ScanMode) => {
    setScanMode(mode);
    setLastResult(null);
    setIsActive(true);
  }, []);

  const stopScanning = useCallback(() => {
    setIsActive(false);
  }, []);

  const onDecode = useCallback((result: string) => {
    setLastResult(result);
    if (navigator.vibrate) navigator.vibrate(100);
    setIsActive(false);
  }, []);

  return { isActive, lastResult, scanMode, setScanMode, startScanning, stopScanning, onDecode };
}
