import { Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';

// ... (existing imports stay as they were, we will re-import them below)
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

function ProtectedRoute() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="size-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <AppLayout />;
}

function RoleGuard({ roles, children }: { roles: UserRole[]; children: React.ReactNode }) {
  const { hasRole, loading } = useAuth();
  
  if (loading) return null;
  
  if (!hasRole(...roles)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Rotas Protegidas */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/produtos" element={<ProductsList />} />
              
              {/* Apenas admin e gestor podem criar produtos */}
              <Route 
                path="/produtos/novo" 
                element={
                  <RoleGuard roles={['admin', 'gestor']}>
                    <ProductCreate />
                  </RoleGuard>
                } 
              />
              
              <Route path="/produtos/:id" element={<ProductDetail />} />
              <Route path="/scan" element={<ScanMobile />} />
              <Route path="/armazens" element={<WarehousesList />} />
              <Route path="/armazens/:id" element={<WarehouseDetail />} />
              <Route path="/movimentos" element={<MovementLog />} />
              <Route path="/devolucoes" element={<Returns />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
