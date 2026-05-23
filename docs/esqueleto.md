# Esqueleto da Aplicação - Gestão de Stock

Este documento mapeia todas as páginas, endpoints e estrutura de ficheiros da aplicação.
Stack: React + Vite + TypeScript | Supabase (PostgreSQL, Auth, Realtime, Storage) | PWA com Vite-PWA plugin.

---

## Estrutura de Páginas (Frontend - React Router)

SPA com React Router. Interface responsiva, com foco mobile-first na área operacional (/scan).

### Autenticação
- `/login` - Login com Supabase Auth (email/password). Redireciona por papel (RBAC).

### Dashboard
- `/` - Página principal. KPIs (total produtos, valor em stock, movimentos do dia), alertas de stock mínimo, lotes a expirar, gráficos de saídas recentes. Visível para Administrador, Gestor e Auditor.

### Catálogo de Produtos
- `/produtos` - Tabela com catálogo global. Pesquisa por nome/SKU/código de barras, filtros por categoria, ordenação.
- `/produtos/novo` - Formulário de criação (nome, SKU, categoria, unidade, preço custo, stock mínimo, código de barras via câmara).
- `/produtos/:id` - Detalhe do produto: dados base, distribuição de stock por armazém, histórico de movimentos, lotes e validades.

### Scanner (Mobile/PWA)
- `/scan` - Interface mobile-first. Ativa câmara (react-zxing / html5-qrcode), lê códigos de barras e QR codes. Permite entrada/saída rápida de stock. Funciona offline via Dexie.js (IndexedDB), sincroniza quando volta a ter rede.

### Armazéns
- `/armazens` - Vista em árvore da hierarquia de espaços (Armazém > Corredor > Prateleira). Criação de sub-armazéns e geração de QR codes.
- `/armazens/:id` - Inventário de uma localização específica. Acedida também via scan de QR code físico.

### Movimentos e Auditoria
- `/movimentos` - Log de auditoria cronológico e imutável. Colunas: Data/Hora, Utilizador, Ação, Produto, Quantidade, Origem/Destino. Filtros avançados e paginação.

### Devoluções
- `/devolucoes` - Painel de gestão de devoluções. Fluxo: entrada pendente → análise → reintegração em stock ou abate (quebra).

---

## Estrutura de Endpoints (Supabase + Edge Functions)

Como usamos Supabase diretamente no frontend (via `@supabase/supabase-js`), as leituras simples (listar produtos, ver armazéns) são feitas com queries diretas ao PostgreSQL protegidas por Row Level Security (RLS). As operações críticas e transacionais usam Supabase Edge Functions ou RPC (stored procedures) para garantir atomicidade.

### Produtos (Queries diretas via Supabase Client)
- `supabase.from('products').select()` - Lista produtos (com filtros de pesquisa).
- `supabase.from('products').insert()` - Cria produto novo.
- `supabase.from('products').select().eq('id', id)` - Detalhe de um produto.
- `supabase.from('products').update().eq('id', id)` - Edita dados do produto.

### Armazéns (Queries diretas)
- `supabase.from('warehouses').select()` - Árvore hierárquica dos armazéns.
- `supabase.from('warehouses').insert()` - Cria novo sub-armazém.
- `supabase.from('inventory').select().eq('warehouse_id', id)` - Stock de uma localização.

### Movimentos (RPC / Edge Function - Transação atómica)
- `supabase.rpc('create_movement', { ... })` - O núcleo da aplicação.
  - Payload: `{ product_id, warehouse_id, type (in/out), quantity, user_id }`
  - Lógica (executada numa transação SQL):
    1. Valida permissões do utilizador (RBAC).
    2. Se saída: verifica stock >= quantidade (impede saldo negativo).
    3. Atualiza tabela `inventory`.
    4. Insere registo na tabela `audit_logs` (append-only, imutável).
    5. Se stock novo < stock mínimo: emite evento Realtime para alertas.
- `supabase.from('movements').select()` - Histórico filtrável com paginação.

### Lotes e Validades
- `supabase.from('batches').select().eq('product_id', id)` - Lotes de um produto.
- `supabase.from('batches').insert()` - Regista novo lote com validade.
- `supabase.from('batches').select().lt('expiry_date', threshold)` - Lotes prestes a expirar.

### Dashboard / KPIs (Views ou RPC)
- `supabase.rpc('get_dashboard_kpis')` - Totais agregados (produtos, capital, movimentos do dia).
- `supabase.from('alerts_view').select()` - View materializada com stock abaixo do mínimo e validades críticas.

### Devoluções
- `supabase.from('returns').insert()` - Regista devolução (estado: pendente).
- `supabase.rpc('resolve_return', { id, action })` - Gestor resolve: reintegra ou abate.

### Alertas em Tempo Real (Supabase Realtime)
- `supabase.channel('alerts').on('postgres_changes', ...)` - Subscrição a alterações na tabela de inventário. Notifica o frontend quando stock cai abaixo do mínimo ou quando um lote entra em período crítico de validade.

---

## Estrutura de Ficheiros do Projeto

```
src/
├── main.tsx                    # Entry point
├── App.tsx                     # Router + providers (QueryClient, Supabase)
├── index.css                   # Tailwind imports + tokens globais
│
├── lib/
│   ├── supabase.ts             # Instância do cliente Supabase
│   ├── dexie.ts                # Configuração do IndexedDB (offline)
│   └── sync.ts                 # Lógica de sincronização offline → Supabase
│
├── hooks/
│   ├── useAuth.ts              # Hook de autenticação e papel do utilizador
│   ├── useProducts.ts          # Queries TanStack para produtos
│   ├── useMovements.ts         # Queries e mutations para movimentos
│   ├── useWarehouses.ts        # Queries para armazéns
│   ├── useAlerts.ts            # Subscrição Realtime de alertas
│   └── useScanner.ts           # Hook para câmara e leitura de códigos
│
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── ProductsList.tsx
│   ├── ProductCreate.tsx
│   ├── ProductDetail.tsx
│   ├── ScanMobile.tsx
│   ├── WarehousesList.tsx
│   ├── WarehouseDetail.tsx
│   ├── MovementLog.tsx
│   └── Returns.tsx
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── MobileNav.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Table.tsx
│   │   ├── Modal.tsx
│   │   └── Alert.tsx
│   └── domain/
│       ├── ProductCard.tsx
│       ├── MovementRow.tsx
│       ├── WarehouseTree.tsx
│       ├── KpiCard.tsx
│       └── BarcodeScanner.tsx
│
├── types/
│   └── index.ts                # Product, Warehouse, Movement, Batch, User, AuditLog
│
└── utils/
    ├── formatters.ts           # Formatação de datas, moeda, quantidades
    └── validators.ts           # Validação de formulários
```

---

## Estrutura de Dados (Tabelas Supabase / PostgreSQL)

- `users` (id, email, name, role, created_at)
- `products` (id, sku, name, category, unit, cost_price, min_stock, barcode, created_at)
- `warehouses` (id, name, parent_id, type, qr_code, created_at)
- `inventory` (id, product_id, warehouse_id, quantity, updated_at)
- `batches` (id, product_id, warehouse_id, batch_code, expiry_date, quantity, created_at)
- `movements` (id, product_id, warehouse_id, type, quantity, user_id, notes, created_at)
- `returns` (id, product_id, warehouse_id, status, resolution, user_id, created_at)
- `audit_logs` (id, entity, entity_id, action, user_id, diff, created_at)
