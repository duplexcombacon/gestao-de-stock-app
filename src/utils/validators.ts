export function isValidBarcode(barcode: string): boolean {
  if (!barcode) return false;
  const clean = barcode.trim();
  // Verifica se contém apenas dígitos
  if (!/^\d+$/.test(clean)) return false;
  // Verifica se tem os comprimentos padrão (EAN-8, UPC-A, EAN-13, GTIN-14)
  return [8, 12, 13, 14].includes(clean.length);
}
