# Plano de Implementação - Gestão de Stock

Desenvolvimento faseado, onde cada fase entrega valor funcional testável antes de avançar para a seguinte.

---

## Fase 1 — Scaffold e Fundação Técnica

Objetivo: Projeto funcional no browser com routing, design system e ligação ao Supabase.

### 1.1 Inicializar projeto Vite
- `npx create-vite@latest ./ --template react-ts`
- Limpar ficheiros default (App.css, assets genéricos)

### 1.2 Instalar dependências
- `react-router-dom` (routing)
- `@supabase/supabase-js` (backend)
- `@tanstack/react-query` (data fetching)
- `zustand` (estado local)
- `tailwindcss` (UI)
- `vite-plugin-pwa` (PWA)
- `lucide-react` (ícones)

### 1.3 Configurar Tailwind CSS
- Instalar e configurar (postcss, autoprefixer)
- Definir tema base: cores, tipografia (Inter/Outfit via Google Fonts), dark mode

### 1.4 Configurar PWA
- `vite-plugin-pwa` no `vite.config.ts`
- Manifest com nome, ícones, tema
- Service Worker básico (cache de assets estáticos)

### 1.5 Estrutura base de ficheiros
- Criar pastas: `pages/`, `components/`, `hooks/`, `lib/`, `types/`, `utils/`
- `src/lib/supabase.ts` com instância do cliente
- `src/App.tsx` com React Router e layout base (Sidebar + Header + Outlet)

### 1.6 Layout e navegação
- `components/layout/Sidebar.tsx` — menu lateral (desktop)
- `components/layout/Header.tsx` — barra superior
- `components/layout/MobileNav.tsx` — bottom navigation (mobile)
- Componentes UI base: Button, Input, Table, Modal, Alert

### Verificação
- [ ] `npm run dev` abre no browser sem erros
- [ ] Tailwind ativo (classes aplicam estilos)
- [ ] Navegação entre páginas placeholder funciona
- [ ] Service Worker regista no browser (tab Application)

---

## Fase 2 — Autenticação e RBAC

Objetivo: Login funcional com papéis de utilizador que controlam o acesso a cada página.

### 2.1 Supabase Auth
- Criar projeto no Supabase Dashboard
- Configurar `.env` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
- Ativar provider email/password no Supabase

### 2.2 Tabela `users` (extensão de perfil)
```sql
create table public.profiles (
  id uuid references auth.users primary key,
  name text not null,
  role text not null check (role in ('admin', 'gestor', 'caixa', 'auditor')),
  created_at timestamptz default now()
);
```
- Row Level Security (RLS) ativo

### 2.3 Páginas e hooks
- `pages/Login.tsx` — formulário de login com Supabase Auth
- `hooks/useAuth.ts` — sessão atual, papel do utilizador, logout
- Componente `ProtectedRoute` — redireciona para `/login` se não autenticado
- Componente `RoleGuard` — restringe acesso por papel (ex: Auditor não vê `/produtos/novo`)

### 2.4 Redirecionamento por papel
- Admin/Gestor → `/` (Dashboard)
- Caixa → `/scan`
- Auditor → `/movimentos`

### Verificação
- [ ] Login funciona e cria sessão
- [ ] Utilizador não autenticado é redirecionado para `/login`
- [ ] Caixa não consegue aceder a `/produtos/novo`
- [ ] Auditor só vê páginas de leitura

---

## Fase 3 — Catálogo de Produtos

Objetivo: CRUD completo de produtos com pesquisa e associação de código de barras.

### 3.1 Tabela `products`
```sql
create table public.products (
  id uuid default gen_random_uuid() primary key,
  sku text unique not null,
  name text not null,
  category text,
  unit text default 'un',
  cost_price numeric(10,2),
  min_stock integer default 0,
  barcode text unique,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 3.2 Páginas
- `pages/ProductsList.tsx` — tabela com pesquisa (nome/SKU/barcode), filtros, ordenação
- `pages/ProductCreate.tsx` — formulário de criação com validação
- `pages/ProductDetail.tsx` — vista de detalhe (dados + stock por armazém + movimentos)

### 3.3 Hooks
- `hooks/useProducts.ts` — queries TanStack (lista, detalhe) e mutations (criar, editar)

### 3.4 Componentes
- `components/domain/ProductCard.tsx` — card reutilizável
- Integração inicial do scanner na criação do produto (ler barcode via câmara para preencher campo)

### Verificação
- [ ] Criar produto com SKU e código de barras
- [ ] Listar com pesquisa e filtros
- [ ] Editar produto existente
- [ ] Detalhe mostra informação correta

---

## Fase 4 — Hierarquia de Armazéns

Objetivo: Estrutura em árvore de localizações físicas com geração de QR codes.

### 4.1 Tabela `warehouses`
```sql
create table public.warehouses (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  parent_id uuid references public.warehouses(id),
  type text default 'storage',
  qr_code text unique,
  created_at timestamptz default now()
);
```

### 4.2 Tabela `inventory`
```sql
create table public.inventory (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) not null,
  warehouse_id uuid references public.warehouses(id) not null,
  quantity integer default 0,
  updated_at timestamptz default now(),
  unique(product_id, warehouse_id)
);
```

### 4.3 Páginas
- `pages/WarehousesList.tsx` — vista em árvore (parent → children recursivo)
- `pages/WarehouseDetail.tsx` — inventário da localização + botão para gerar QR code

### 4.4 Hooks
- `hooks/useWarehouses.ts` — queries e mutations para armazéns e inventário

### 4.5 Componentes
- `components/domain/WarehouseTree.tsx` — árvore visual recursiva
- Geração de QR code (biblioteca `qrcode` ou SVG inline) para impressão

### Verificação
- [ ] Criar armazém com sub-armazéns (3 níveis)
- [ ] QR code gerado e visível
- [ ] Inventário vazio por default ao criar localização

---

## Fase 5 — Motor de Movimentos (Transações)

Objetivo: O coração funcional — entrada/saída/transferência de stock com auditoria.

### 5.1 Tabelas
```sql
create table public.movements (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) not null,
  warehouse_id uuid references public.warehouses(id) not null,
  type text not null check (type in ('in', 'out', 'transfer')),
  quantity integer not null,
  user_id uuid references public.profiles(id) not null,
  notes text,
  created_at timestamptz default now()
);

create table public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  entity text not null,
  entity_id uuid not null,
  action text not null,
  user_id uuid references public.profiles(id),
  diff jsonb,
  created_at timestamptz default now()
);
```

### 5.2 Stored Procedure (RPC)
```sql
create or replace function create_movement(
  p_product_id uuid, p_warehouse_id uuid,
  p_type text, p_quantity int, p_user_id uuid
) returns uuid as $$
  -- Transação atómica:
  -- 1. Validar stock (se saída)
  -- 2. Atualizar inventory
  -- 3. Inserir movement
  -- 4. Inserir audit_log
$$ language plpgsql;
```

### 5.3 Páginas e hooks
- `pages/MovementLog.tsx` — tabela cronológica, filtros (utilizador, produto, data, tipo), paginação
- `hooks/useMovements.ts` — query de listagem + mutation via `supabase.rpc('create_movement')`

### Verificação
- [ ] Entrada de stock incrementa inventário
- [ ] Saída decrementa e falha se stock insuficiente
- [ ] Cada movimento gera entrada no audit_logs
- [ ] Filtros e paginação funcionam no log

---

## Fase 6 — Scanner Mobile (PWA)

Objetivo: Interface de scan funcional no telemóvel com leitura de barcode/QR.

### 6.1 Hook de scanner
- `hooks/useScanner.ts` — encapsula `react-zxing` ou `html5-qrcode`, gestão de permissões de câmara, parsing do resultado

### 6.2 Página
- `pages/ScanMobile.tsx`:
  - Ecrã de câmara em fullscreen
  - Ao ler barcode de produto → mostra nome + stock atual + botões Entrada/Saída
  - Ao ler QR de armazém → navega para `/armazens/:id`
  - Feedback visual e sonoro (vibração + som) ao ler com sucesso

### 6.3 Componentes
- `components/domain/BarcodeScanner.tsx` — componente de câmara reutilizável
- UI otimizada para uso com uma mão (botões grandes, contraste alto)

### Verificação
- [ ] Câmara abre no telemóvel (Chrome/Safari)
- [ ] Leitura de barcode identifica produto existente
- [ ] Leitura de QR code de armazém navega corretamente
- [ ] Entrada/saída via scan cria movimento com sucesso

---

## Fase 7 — Dashboard, Alertas Realtime e Lotes

Objetivo: Inteligência de negócio e sistema de notificações proativo.

### 7.1 Tabela `batches`
```sql
create table public.batches (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) not null,
  warehouse_id uuid references public.warehouses(id),
  batch_code text not null,
  expiry_date date not null,
  quantity integer default 0,
  created_at timestamptz default now()
);
```

### 7.2 Dashboard KPIs
- `pages/Dashboard.tsx`:
  - Cards: total de SKUs, capital imobilizado (sum de quantity * cost_price), movimentos hoje
  - Gráfico de barras: saídas dos últimos 7 dias
  - Lista: top 5 produtos com mais rotação
- `hooks/useDashboard.ts` — queries agregadas (RPC ou views)
- `components/domain/KpiCard.tsx`

### 7.3 Alertas Realtime
- `hooks/useAlerts.ts` — subscrição Supabase Realtime na tabela `inventory`
- Quando `quantity < min_stock` → alerta visual no header (badge + dropdown)
- View `alerts_view` no Supabase que cruza `inventory.quantity < products.min_stock` e `batches.expiry_date < now() + interval '30 days'`

### 7.4 Gestão de Lotes
- Associar lotes na entrada de stock (via scan ou manual)
- Vista de lotes no detalhe do produto (`ProductDetail.tsx`)
- Ordenação FEFO automática nas sugestões de saída

### Verificação
- [ ] Dashboard mostra KPIs corretos
- [ ] Alerta aparece em tempo real quando stock cai abaixo do mínimo
- [ ] Lotes com validade próxima aparecem no dashboard
- [ ] Gráfico reflete dados reais

---

## Fase 8 — Devoluções e Modo Offline

Objetivo: Fluxo de exceções e resiliência para uso em armazéns sem rede.

### 8.1 Tabela `returns`
```sql
create table public.returns (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) not null,
  warehouse_id uuid references public.warehouses(id),
  quantity integer default 1,
  reason text,
  status text default 'pending' check (status in ('pending', 'restocked', 'scrapped')),
  resolved_by uuid references public.profiles(id),
  user_id uuid references public.profiles(id) not null,
  created_at timestamptz default now(),
  resolved_at timestamptz
);
```

### 8.2 Página de devoluções
- `pages/Returns.tsx`:
  - Tabela de devoluções pendentes
  - Ação do Gestor: "Reintegrar em stock" (cria movimento de entrada) ou "Abater" (marca como quebra)

### 8.3 Modo Offline
- `lib/dexie.ts` — schema do IndexedDB (fila de operações pendentes)
- `lib/sync.ts` — lógica de sincronização:
  - Deteta estado online/offline (`navigator.onLine` + event listeners)
  - Operações offline são guardadas no Dexie com timestamp
  - Quando volta online: envia operações por ordem cronológica via `supabase.rpc()`
  - Tratamento de conflitos: last-write-wins com fallback para notificação manual
- Indicador visual no header: "Online" / "Offline (X operações pendentes)"

### Verificação
- [ ] Criar devolução e resolver como "reintegrar" actualiza stock
- [ ] Resolver como "abater" não altera stock
- [ ] Em modo offline: scan regista operação localmente
- [ ] Ao recuperar rede: operações são enviadas e stock actualizado
- [ ] Indicador de estado online/offline funciona

---

## Ordem de Prioridades

| Fase | Descrição | Dependências |
|------|-----------|-------------|
| 1 | Scaffold e Fundação | Nenhuma |
| 2 | Autenticação e RBAC | Fase 1 |
| 3 | Catálogo de Produtos | Fase 2 |
| 4 | Hierarquia de Armazéns | Fase 2 |
| 5 | Motor de Movimentos | Fase 3 + 4 |
| 6 | Scanner Mobile | Fase 5 |
| 7 | Dashboard, Alertas e Lotes | Fase 5 |
| 8 | Devoluções e Offline | Fase 5 |

> [!NOTE]
> As fases 3 e 4 podem ser desenvolvidas em paralelo. As fases 6, 7 e 8 também são independentes entre si após a Fase 5 estar concluída.
