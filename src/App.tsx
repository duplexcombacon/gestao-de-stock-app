import { Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';

import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { Toaster } from 'sonner';
import { useNotifications } from '@/hooks/useNotifications';
import { forceSync } from '@/lib/sync';
import { useEffect } from 'react';

import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import ProductsList from '@/pages/ProductsList';
import ProductCreate from '@/pages/ProductCreate';
import ProductDetail from '@/pages/ProductDetail';
import ProductEdit from '@/pages/ProductEdit';
import ProductBatchCreate from '@/pages/ProductBatchCreate';
import ScanMobile from '@/pages/ScanMobile';
import WarehousesList from '@/pages/WarehousesList';
import WarehouseDetail from '@/pages/WarehouseDetail';
import WarehouseCreate from '@/pages/WarehouseCreate';
import WarehouseEdit from '@/pages/WarehouseEdit';
import WarehouseQrPrint from '@/pages/WarehouseQrPrint';
import MovementLog from '@/pages/MovementLog';
import Returns from '@/pages/Returns';
import ReturnCreate from '@/pages/ReturnCreate';
import AdminUsers from '@/pages/AdminUsers';
import Profile from '@/pages/Profile';
import OperatorCheckins from '@/pages/OperatorCheckins';

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
  '/armazens/novo': 'Nova Localização',
  '/movimentos': 'Movimentos',
  '/devolucoes': 'Devoluções',
  '/devolucoes/nova': 'Nova Devolução',
  '/admin/utilizadores': 'Gestão de Utilizadores',
  '/operadores/presencas': 'Presenças de Operadores',
  '/perfil': 'O Meu Perfil',
};

function AppLayout() {
  const location = useLocation();
  const path = location.pathname;
  useNotifications();

  useEffect(() => {
    forceSync(); // Tenta forçar a sincronização de dados offline mal a app abra
  }, []);

  // Determinar o título da página com base no caminho atual
  let title = pageTitles[path] || '';
  if (!title) {
    if (path.endsWith('/editar')) title = 'Editar Produto';
    else if (path.endsWith('/lotes/novo')) title = 'Novo Lote';
    else if (path.startsWith('/produtos/')) title = 'Detalhe do Produto';
    else if (path.endsWith('/qr')) title = 'QR Code';
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
    // Mostra um spinner de carregamento enquanto verifica a sessão do utilizador
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="size-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!user) {
    // Redireciona para o login se não houver utilizador autenticado
    return <Navigate to="/login" replace />;
  }
  
  return <AppLayout />;
}

// Componente que bloqueia o acesso a certas páginas baseado na função (role) do utilizador
function RoleGuard({ roles, children }: { roles: UserRole[]; children: React.ReactNode }) {
  const { hasRole, loading } = useAuth();
  
  if (loading) return null;
  
  if (!hasRole(...roles)) {
    // Redireciona para a home se o utilizador não tiver o role necessário
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster theme="dark" position="top-right" />
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
              <Route path="/produtos/:id/editar" element={<RoleGuard roles={['admin', 'gestor']}><ProductEdit /></RoleGuard>} />
              <Route path="/produtos/:id/lotes/novo" element={<RoleGuard roles={['admin', 'gestor']}><ProductBatchCreate /></RoleGuard>} />
              <Route path="/scan" element={<ScanMobile />} />
              <Route path="/armazens" element={<WarehousesList />} />
              <Route path="/armazens/novo" element={<RoleGuard roles={['admin', 'gestor']}><WarehouseCreate /></RoleGuard>} />
              <Route path="/armazens/:id" element={<WarehouseDetail />} />
              <Route path="/armazens/:id/editar" element={<RoleGuard roles={['admin', 'gestor']}><WarehouseEdit /></RoleGuard>} />
              <Route path="/armazens/:id/qr" element={<WarehouseQrPrint />} />
              <Route path="/movimentos" element={<MovementLog />} />
              <Route path="/devolucoes" element={<Returns />} />
              <Route path="/devolucoes/nova" element={<RoleGuard roles={['admin', 'gestor', 'caixa']}><ReturnCreate /></RoleGuard>} />
              
              {/* Apenas admin pode gerir utilizadores */}
              <Route 
                path="/admin/utilizadores" 
                element={
                  <RoleGuard roles={['admin']}>
                    <AdminUsers />
                  </RoleGuard>
                } 
              />

              {/* Admin e gestor podem ver presenças de operadores */}
              <Route
                path="/operadores/presencas"
                element={
                  <RoleGuard roles={['admin', 'gestor']}>
                    <OperatorCheckins />
                  </RoleGuard>
                }
              />
              
              {/* Perfil de Utilizador (Todos podem aceder) */}
              <Route path="/perfil" element={<Profile />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}