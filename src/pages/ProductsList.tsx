import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Table, type Column } from '@/components/ui/Table';
import { formatCurrency } from '@/utils/formatters';
import type { Product } from '@/types';
import { useProducts } from '@/hooks/useProducts';

export default function ProductsList() {
  const navigate = useNavigate();
  const { products, isLoading, getStockTotal } = useProducts();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categoryOptions = (() => {
    const derived = [...new Set(products.map(p => p.category))].filter(Boolean) as string[];
    return derived.length ? derived : ['Bebidas', 'Alimentação', 'Limpeza', 'Lacticínios', 'Higiene'];
  })();

  const filtered = products.filter(p => {
    const matchesSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.includes(search);
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });


  const getStockStatus = (product: Product) => {
    const total = getStockTotal(product.id);
    if (total === 0) return { label: 'Esgotado', variant: 'danger' as const };
    if (total < product.min_stock) return { label: 'Baixo', variant: 'warning' as const };
    return { label: 'Normal', variant: 'success' as const };
  };

  const columns: Column<Product>[] = [
    {
      key: 'sku',
      header: 'SKU',
      render: (p) => <span className="font-mono text-text-muted text-xs">{p.sku}</span>,
      sortable: true,
      sortFn: (a, b) => a.sku.localeCompare(b.sku),
    },
    {
      key: 'name',
      header: 'Produto',
      render: (p) => (
        <div>
          <p className="font-medium">{p.name}</p>
          <p className="text-xs text-text-muted">{p.category}</p>
        </div>
      ),
      sortable: true,
      sortFn: (a, b) => a.name.localeCompare(b.name),
    },
    {
      key: 'stock',
      header: 'Stock',
      render: (p) => {
        const total = getStockTotal(p.id);
        const status = getStockStatus(p);
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono">{total}</span>
            <Badge variant={status.variant} dot>{status.label}</Badge>
          </div>
        );
      },
      sortable: true,
      sortFn: (a, b) => getStockTotal(a.id) - getStockTotal(b.id),
    },
    {
      key: 'price',
      header: 'Preço Custo',
      render: (p) => <span className="font-mono">{formatCurrency(p.cost_price)}</span>,
      sortable: true,
      sortFn: (a, b) => a.cost_price - b.cost_price,
      className: 'hidden sm:table-cell',
    },
    {
      key: 'min_stock',
      header: 'Mín.',
      render: (p) => <span className="text-text-muted font-mono">{p.min_stock}</span>,
      className: 'hidden md:table-cell',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex-1 w-full sm:max-w-sm">
          <Input
            placeholder="Pesquisar por nome, SKU ou código..."
            icon={<Search size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Select
            options={[
              { value: 'all', label: 'Todas as categorias' },
              ...categoryOptions.map(c => ({ value: c, label: c })),
            ]}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          />
          <Button
            icon={<Plus size={16} />}
            onClick={() => navigate('/produtos/novo')}
          >
            <span className="hidden sm:inline">Novo Produto</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={filtered}
        keyExtractor={(p) => p.id}
        onRowClick={(p) => navigate(`/produtos/${p.id}`)}
        emptyMessage={isLoading ? "A carregar produtos..." : "Nenhum produto encontrado"}
      />
    </div>
  );
}
