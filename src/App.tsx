import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';

import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import ProductsList from '@/pages/ProductsList';
import ProductCreate from '@/pages/ProductCreate';
import ProductDetail from '@/pages/ProductDetail';
import ScanMobile from '@/pages/ScanMobile';
import WarehousesList from '@/pages/WarehousesList';
import WarehouseDetail from '@/pages/WarehouseDetail';
import MovementLog from '@/pages/MovementLog';
import Returns from '@/pages/Returns';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
});

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/produtos': 'Catálogo de Produtos',
  '/produtos/novo': 'Novo Produto',
  '/scan': 'Scanner',
  '/armazens': 'Armazéns',
  '/movimentos': 'Movimentos',
  '/devolucoes': 'Devoluções',
};

function AppLayout() {
  const location = useLocation();
  const path = location.pathname;

  // Resolve title: check exact match, then check patterns
  let title = pageTitles[path] || '';
  if (!title) {
    if (path.startsWith('/produtos/')) title = 'Detalhe do Produto';
    else if (path.startsWith('/armazens/')) title = 'Detalhe do Armazém';
    else title = 'StockFlow';
  }

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <div className="lg:ml-60">
        <Header title={title} />
        <main className="p-4 md:p-6 pb-24 lg:pb-6">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/produtos" element={<ProductsList />} />
            <Route path="/produtos/novo" element={<ProductCreate />} />
            <Route path="/produtos/:id" element={<ProductDetail />} />
            <Route path="/scan" element={<ScanMobile />} />
            <Route path="/armazens" element={<WarehousesList />} />
            <Route path="/armazens/:id" element={<WarehouseDetail />} />
            <Route path="/movimentos" element={<MovementLog />} />
            <Route path="/devolucoes" element={<Returns />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
