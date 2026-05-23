import { useState, useCallback } from 'react';

export function useScanner() {
  const [isActive, setIsActive] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const startScanning = useCallback(() => setIsActive(true), []);
  const stopScanning = useCallback(() => setIsActive(false), []);
  const onDecode = useCallback((result: string) => {
    setLastResult(result);
    if (navigator.vibrate) navigator.vibrate(100);
  }, []);
  return { isActive, lastResult, startScanning, stopScanning, onDecode };
}
