# Base de Dados — SQL Completo para Supabase

> Copiar todo o conteúdo do bloco SQL abaixo e colar no **Supabase SQL Editor** (Dashboard > SQL Editor > New Query).
> Executar de uma só vez. A ordem já respeita as dependências entre tabelas.

---

## Instruções

1. Abrir o projeto no [Supabase Dashboard](https://supabase.com/dashboard)
2. Ir a **SQL Editor** > **New Query**
3. Colar todo o SQL abaixo
4. Clicar **Run**
5. Verificar que todas as tabelas aparecem em **Table Editor**

---

## SQL Completo

```sql
-- ============================================================
-- GESTÃO DE STOCK — SCHEMA COMPLETO
-- Supabase (PostgreSQL)
-- ============================================================

-- Ativar extensões necessárias
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. PROFILES (extensão do auth.users do Supabase)
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text,
  role text not null check (role in ('admin', 'gestor', 'caixa', 'auditor')),
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.profiles is 'Perfil de utilizador com papel (RBAC)';

-- Trigger para criar perfil automaticamente quando um user se regista
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Novo Utilizador'),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'caixa')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. PRODUCTS (Catálogo de Produtos)
-- ============================================================
create table public.products (
  id uuid default gen_random_uuid() primary key,
  sku text unique not null,
  name text not null,
  description text,
  category text,
  unit text default 'un' check (unit in ('un', 'kg', 'l', 'cx', 'pack')),
  cost_price numeric(10, 2) default 0,
  sell_price numeric(10, 2) default 0,
  min_stock integer default 0,
  barcode text unique,
  image_url text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.products is 'Catálogo global de produtos';

-- Índices para pesquisa rápida
create index idx_products_sku on public.products(sku);
create index idx_products_barcode on public.products(barcode);
create index idx_products_name on public.products using gin(to_tsvector('portuguese', name));
create index idx_products_category on public.products(category);

-- ============================================================
-- 3. WAREHOUSES (Hierarquia de Armazéns)
-- ============================================================
create table public.warehouses (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  parent_id uuid references public.warehouses(id) on delete cascade,
  type text default 'storage' check (type in ('storage', 'shelf', 'corridor', 'zone', 'store')),
  qr_code text unique,
  description text,
  active boolean default true,
  created_at timestamptz default now()
);

comment on table public.warehouses is 'Hierarquia de localizações físicas (armazém > corredor > prateleira)';

create index idx_warehouses_parent on public.warehouses(parent_id);

-- ============================================================
-- 4. INVENTORY (Stock atual por produto/localização)
-- ============================================================
create table public.inventory (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  warehouse_id uuid references public.warehouses(id) on delete cascade not null,
  quantity integer default 0 check (quantity >= 0),
  updated_at timestamptz default now(),
  unique(product_id, warehouse_id)
);

comment on table public.inventory is 'Saldo atual de stock por produto e localização';

create index idx_inventory_product on public.inventory(product_id);
create index idx_inventory_warehouse on public.inventory(warehouse_id);

-- ============================================================
-- 5. BATCHES (Lotes e Validades — FEFO)
-- ============================================================
create table public.batches (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  batch_code text not null,
  expiry_date date not null,
  quantity integer default 0 check (quantity >= 0),
  notes text,
  created_at timestamptz default now()
);

comment on table public.batches is 'Lotes de produtos com rastreio de validade (FEFO)';

create index idx_batches_product on public.batches(product_id);
create index idx_batches_expiry on public.batches(expiry_date);

-- ============================================================
-- 6. MOVEMENTS (Registo de movimentos de stock)
-- ============================================================
create table public.movements (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  warehouse_id uuid references public.warehouses(id) on delete cascade not null,
  destination_warehouse_id uuid references public.warehouses(id) on delete set null,
  batch_id uuid references public.batches(id) on delete set null,
  type text not null check (type in ('in', 'out', 'transfer', 'adjustment')),
  quantity integer not null check (quantity > 0),
  user_id uuid references public.profiles(id) not null,
  notes text,
  created_at timestamptz default now()
);

comment on table public.movements is 'Histórico de todos os movimentos de stock';

create index idx_movements_product on public.movements(product_id);
create index idx_movements_warehouse on public.movements(warehouse_id);
create index idx_movements_user on public.movements(user_id);
create index idx_movements_type on public.movements(type);
create index idx_movements_created on public.movements(created_at desc);

-- ============================================================
-- 7. RETURNS (Devoluções)
-- ============================================================
create table public.returns (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  quantity integer default 1 check (quantity > 0),
  reason text,
  status text default 'pending' check (status in ('pending', 'restocked', 'scrapped')),
  user_id uuid references public.profiles(id) not null,
  resolved_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  resolved_at timestamptz
);

comment on table public.returns is 'Registo de devoluções e sua resolução';

create index idx_returns_status on public.returns(status);
create index idx_returns_product on public.returns(product_id);

-- ============================================================
-- 8. AUDIT_LOGS (Log de Auditoria Imutável)
-- ============================================================
create table public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  entity text not null,
  entity_id uuid not null,
  action text not null,
  user_id uuid references public.profiles(id),
  old_data jsonb,
  new_data jsonb,
  diff jsonb,
  ip_address text,
  created_at timestamptz default now()
);

comment on table public.audit_logs is 'Registo imutável de todas as ações no sistema (append-only)';

create index idx_audit_entity on public.audit_logs(entity, entity_id);
create index idx_audit_user on public.audit_logs(user_id);
create index idx_audit_created on public.audit_logs(created_at desc);

-- ============================================================
-- 9. OPERATOR CHECK-INS (Presenças por Localização)
-- ============================================================
create table public.operator_checkins (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  warehouse_id uuid references public.warehouses(id) on delete cascade not null,
  checked_in_at timestamptz default now() not null,
  checked_out_at timestamptz
);

comment on table public.operator_checkins is 'Registo de presenças (check-in/check-out) dos operadores nos armazéns';

create index idx_checkins_user on public.operator_checkins(user_id);
create index idx_checkins_warehouse on public.operator_checkins(warehouse_id);
create index idx_checkins_open on public.operator_checkins(warehouse_id) where checked_out_at is null;

-- ============================================================
-- 10. VIEWS (Para Dashboard e Alertas)
-- ============================================================

-- Vista de alertas: produtos abaixo do stock mínimo
create or replace view public.low_stock_alerts as
select
  p.id as product_id,
  p.name as product_name,
  p.sku,
  p.min_stock,
  coalesce(sum(i.quantity), 0) as total_stock,
  p.min_stock - coalesce(sum(i.quantity), 0) as deficit
from public.products p
left join public.inventory i on i.product_id = p.id
where p.active = true
group by p.id, p.name, p.sku, p.min_stock
having coalesce(sum(i.quantity), 0) < p.min_stock;

-- Vista de lotes a expirar nos próximos 30 dias
create or replace view public.expiring_batches as
select
  b.id as batch_id,
  b.batch_code,
  b.expiry_date,
  b.quantity,
  p.id as product_id,
  p.name as product_name,
  p.sku,
  w.id as warehouse_id,
  w.name as warehouse_name,
  b.expiry_date - current_date as days_until_expiry
from public.batches b
join public.products p on p.id = b.product_id
left join public.warehouses w on w.id = b.warehouse_id
where b.expiry_date <= current_date + interval '30 days'
  and b.quantity > 0
order by b.expiry_date asc;

-- Vista combinada de alertas (para o Dashboard)
create or replace view public.alerts_view as
select
  'low_stock' as alert_type,
  product_id as entity_id,
  product_name as title,
  'Stock atual: ' || total_stock || ' / Mínimo: ' || min_stock as description,
  null::date as expiry_date,
  deficit as severity
from public.low_stock_alerts
union all
select
  'expiring_batch' as alert_type,
  product_id as entity_id,
  product_name || ' — Lote ' || batch_code as title,
  'Expira em ' || days_until_expiry || ' dias (' || warehouse_name || ')' as description,
  expiry_date,
  case
    when days_until_expiry <= 0 then 100
    when days_until_expiry <= 7 then 75
    when days_until_expiry <= 14 then 50
    else 25
  end as severity
from public.expiring_batches
order by severity desc;

-- ============================================================
-- 10. STORED PROCEDURES (RPC)
-- ============================================================

-- Criar movimento de stock (transação atómica)
create or replace function public.create_movement(
  p_product_id uuid,
  p_warehouse_id uuid,
  p_type text,
  p_quantity integer,
  p_user_id uuid,
  p_destination_warehouse_id uuid default null,
  p_batch_id uuid default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_movement_id uuid;
  v_current_stock integer;
  v_new_stock integer;
begin
  -- Validar tipo
  if p_type not in ('in', 'out', 'transfer', 'adjustment') then
    raise exception 'Tipo de movimento inválido: %', p_type;
  end if;

  -- Validar quantidade
  if p_quantity <= 0 then
    raise exception 'A quantidade deve ser superior a 0';
  end if;

  -- Para transferências, destino é obrigatório
  if p_type = 'transfer' and p_destination_warehouse_id is null then
    raise exception 'Transferências requerem um armazém de destino';
  end if;

  -- Obter stock atual (com lock para evitar race conditions)
  select quantity into v_current_stock
  from public.inventory
  where product_id = p_product_id and warehouse_id = p_warehouse_id
  for update;

  -- Se não existe registo de inventário, criar com 0
  if v_current_stock is null then
    if p_type in ('out', 'transfer') then
      raise exception 'Stock insuficiente: produto não existe nesta localização';
    end if;
    insert into public.inventory (product_id, warehouse_id, quantity)
    values (p_product_id, p_warehouse_id, 0);
    v_current_stock := 0;
  end if;

  -- Validar stock para saídas e transferências
  if p_type in ('out', 'transfer') and v_current_stock < p_quantity then
    raise exception 'Stock insuficiente: disponível = %, pedido = %', v_current_stock, p_quantity;
  end if;

  -- Atualizar inventário de origem
  if p_type = 'in' then
    v_new_stock := v_current_stock + p_quantity;
  elsif p_type in ('out', 'transfer') then
    v_new_stock := v_current_stock - p_quantity;
  elsif p_type = 'adjustment' then
    v_new_stock := p_quantity; -- adjustment define o valor absoluto
  end if;

  update public.inventory
  set quantity = v_new_stock, updated_at = now()
  where product_id = p_product_id and warehouse_id = p_warehouse_id;

  -- Para transferências: incrementar stock no destino
  if p_type = 'transfer' then
    insert into public.inventory (product_id, warehouse_id, quantity)
    values (p_product_id, p_destination_warehouse_id, p_quantity)
    on conflict (product_id, warehouse_id)
    do update set quantity = inventory.quantity + p_quantity, updated_at = now();
  end if;

  -- Inserir movimento
  insert into public.movements (
    product_id, warehouse_id, destination_warehouse_id,
    batch_id, type, quantity, user_id, notes
  )
  values (
    p_product_id, p_warehouse_id, p_destination_warehouse_id,
    p_batch_id, p_type, p_quantity, p_user_id, p_notes
  )
  returning id into v_movement_id;

  -- Inserir no audit log
  insert into public.audit_logs (entity, entity_id, action, user_id, new_data)
  values (
    'movement',
    v_movement_id,
    p_type,
    p_user_id,
    jsonb_build_object(
      'product_id', p_product_id,
      'warehouse_id', p_warehouse_id,
      'destination_warehouse_id', p_destination_warehouse_id,
      'quantity', p_quantity,
      'old_stock', v_current_stock,
      'new_stock', v_new_stock,
      'type', p_type,
      'notes', p_notes
    )
  );

  return v_movement_id;
end;
$$;

-- Resolver devolução
create or replace function public.resolve_return(
  p_return_id uuid,
  p_action text,
  p_user_id uuid
)
returns void
language plpgsql
security definer
as $$
declare
  v_return record;
begin
  -- Validar ação
  if p_action not in ('restock', 'scrap') then
    raise exception 'Ação inválida: %. Use restock ou scrap.', p_action;
  end if;

  -- Obter devolução
  select * into v_return
  from public.returns
  where id = p_return_id and status = 'pending'
  for update;

  if not found then
    raise exception 'Devolução não encontrada ou já resolvida';
  end if;

  -- Se reintegrar: criar movimento de entrada
  if p_action = 'restock' then
    perform public.create_movement(
      v_return.product_id,
      coalesce(v_return.warehouse_id, (select id from public.warehouses limit 1)),
      'in',
      v_return.quantity,
      p_user_id,
      null, null,
      'Reintegração de devolução #' || p_return_id
    );
  end if;

  -- Atualizar estado da devolução
  update public.returns
  set
    status = case when p_action = 'restock' then 'restocked' else 'scrapped' end,
    resolved_by = p_user_id,
    resolved_at = now()
  where id = p_return_id;

  -- Audit log
  insert into public.audit_logs (entity, entity_id, action, user_id, new_data)
  values (
    'return',
    p_return_id,
    'resolve_' || p_action,
    p_user_id,
    jsonb_build_object(
      'product_id', v_return.product_id,
      'quantity', v_return.quantity,
      'action', p_action
    )
  );
end;
$$;

-- Dashboard KPIs
create or replace function public.get_dashboard_kpis()
returns jsonb
language plpgsql
security definer
as $$
declare
  v_total_products integer;
  v_total_capital numeric;
  v_movements_today integer;
  v_active_alerts integer;
begin
  select count(*) into v_total_products
  from public.products where active = true;

  select coalesce(sum(i.quantity * p.cost_price), 0) into v_total_capital
  from public.inventory i
  join public.products p on p.id = i.product_id;

  select count(*) into v_movements_today
  from public.movements
  where created_at >= current_date;

  select count(*) into v_active_alerts
  from public.alerts_view;

  return jsonb_build_object(
    'total_products', v_total_products,
    'total_capital', v_total_capital,
    'movements_today', v_movements_today,
    'active_alerts', v_active_alerts
  );
end;
$$;

-- ============================================================
-- 11. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Ativar RLS em todas as tabelas
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.warehouses enable row level security;
alter table public.inventory enable row level security;
alter table public.batches enable row level security;
alter table public.movements enable row level security;
alter table public.returns enable row level security;
alter table public.audit_logs enable row level security;

-- Helper: obter papel do utilizador atual
create or replace function public.get_user_role()
returns text
language sql
security definer
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- PROFILES: cada user vê o seu; admin vê todos
create policy "Users can view own profile"
  on public.profiles for select
  using (id = auth.uid() or public.get_user_role() = 'admin');

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid());

create policy "Admin can manage all profiles"
  on public.profiles for all
  using (public.get_user_role() = 'admin');

-- PRODUCTS: todos autenticados podem ler; admin e gestor podem editar
create policy "Authenticated users can view products"
  on public.products for select
  using (auth.uid() is not null);

create policy "Admin and gestor can manage products"
  on public.products for all
  using (public.get_user_role() in ('admin', 'gestor'));

-- WAREHOUSES: todos autenticados podem ler; admin e gestor podem editar
create policy "Authenticated users can view warehouses"
  on public.warehouses for select
  using (auth.uid() is not null);

create policy "Admin and gestor can manage warehouses"
  on public.warehouses for all
  using (public.get_user_role() in ('admin', 'gestor'));

-- INVENTORY: todos autenticados podem ler (stock é público internamente)
create policy "Authenticated users can view inventory"
  on public.inventory for select
  using (auth.uid() is not null);

create policy "System can manage inventory"
  on public.inventory for all
  using (public.get_user_role() in ('admin', 'gestor'));

-- BATCHES: todos podem ler; admin e gestor podem gerir
create policy "Authenticated users can view batches"
  on public.batches for select
  using (auth.uid() is not null);

create policy "Admin and gestor can manage batches"
  on public.batches for all
  using (public.get_user_role() in ('admin', 'gestor'));

-- MOVEMENTS: todos podem ler; admin, gestor e caixa podem inserir
create policy "Authenticated users can view movements"
  on public.movements for select
  using (auth.uid() is not null);

create policy "Operational roles can create movements"
  on public.movements for insert
  with check (public.get_user_role() in ('admin', 'gestor', 'caixa'));

-- RETURNS: todos podem ler; caixa pode criar; gestor e admin podem resolver
create policy "Authenticated users can view returns"
  on public.returns for select
  using (auth.uid() is not null);

create policy "Caixa can create returns"
  on public.returns for insert
  with check (public.get_user_role() in ('admin', 'gestor', 'caixa'));

create policy "Gestor can resolve returns"
  on public.returns for update
  using (public.get_user_role() in ('admin', 'gestor'));

-- AUDIT_LOGS: todos podem ler (para auditores); ninguém pode editar/apagar
create policy "Authenticated users can view audit logs"
  on public.audit_logs for select
  using (auth.uid() is not null);

create policy "System can insert audit logs"
  on public.audit_logs for insert
  with check (auth.uid() is not null);

-- OPERATOR CHECK-INS: admin e gestor vêem tudo, utilizador vê as suas
alter table public.operator_checkins enable row level security;

create policy "Admins and managers can view all checkins"
  on public.operator_checkins for select
  using (public.get_user_role() in ('admin', 'gestor') or user_id = auth.uid());

create policy "Users can check themselves in and out"
  on public.operator_checkins for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- 12. TRIGGERS DE UPDATED_AT
-- ============================================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger set_updated_at before update on public.products
  for each row execute function public.update_updated_at();

create trigger set_updated_at before update on public.inventory
  for each row execute function public.update_updated_at();

-- ============================================================
-- 13. ATIVAR REALTIME NAS TABELAS CRÍTICAS
-- ============================================================
-- No Supabase Dashboard > Database > Replication:
-- Ativar Realtime para as tabelas: inventory, movements, returns
-- Ou via SQL:
alter publication supabase_realtime add table public.inventory;
alter publication supabase_realtime add table public.movements;
alter publication supabase_realtime add table public.returns;
```

---

## Resumo das Tabelas

| Tabela       | Descrição                       | Registos esperados  |
| ------------ | ------------------------------- | ------------------- |
| `profiles`   | Utilizadores e papéis (RBAC)    | Dezenas             |
| `products`   | Catálogo de produtos            | Centenas a milhares |
| `warehouses` | Localizações físicas (árvore)   | Dezenas             |
| `inventory`  | Stock atual por produto/local   | Milhares            |
| `batches`    | Lotes com validade              | Centenas            |
| `movements`  | Histórico de transações         | Milhares a milhões  |
| `returns`    | Devoluções pendentes/resolvidas | Centenas            |
| `audit_logs` | Log imutável de auditoria       | Milhões             |

## Views

| View               | Utilização                                      |
| ------------------ | ----------------------------------------------- |
| `low_stock_alerts` | Produtos abaixo do stock mínimo                 |
| `expiring_batches` | Lotes a expirar nos próximos 30 dias            |
| `alerts_view`      | Combinação de todos os alertas (para Dashboard) |

## Stored Procedures (RPC)

| Função                 | Utilização                                       |
| ---------------------- | ------------------------------------------------ |
| `create_movement()`    | Transação atómica de entrada/saída/transferência |
| `resolve_return()`     | Resolver devolução (reintegrar ou abater)        |
| `get_dashboard_kpis()` | Agregar KPIs para o dashboard                    |

## BUCKETS

````sql

-- 1. Permitir leitura pública para que as imagens apareçam na app
create policy "Leitura publica de imagens"
 on storage.objects for select
 using ( bucket_id = 'product-images' );

-- 2. Permitir que apenas Admin e Gestor façam upload (Insert)
create policy "Admin e Gestor podem fazer upload"
 on storage.objects for insert
 with check (
   bucket_id = 'product-images' and
   public.get_user_role() in ('admin', 'gestor')
 );

-- 3. Permitir que apenas Admin e Gestor apaguem/substituam imagens (Update/Delete)
create policy "Admin e Gestor podem alterar/apagar imagens"
 on storage.objects for update
 using (
   bucket_id = 'product-images' and
   public.get_user_role() in ('admin', 'gestor')
 );

create policy "Admin e Gestor podem apagar imagens"
 on storage.objects for delete
 using (
   bucket_id = 'product-images' and
   public.get_user_role() in ('admin', 'gestor')
 );
```sql

## UPDATE (Role admin não estava a ser detetada)

create or replace function public.get_user_role()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
 v_role text;
begin
 select role into v_role from public.profiles where id = auth.uid();
 return v_role;
end;
$$;
````

## UPDATE DO LOOP INFINITO INVISIVEL

````sql

-- 1. Matar as queries encravadas que estão a bloquear o servidor
SELECT pg_cancel_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND pid <> pg_backend_pid();

-- 2. Apagar as políticas que estavam a causar o loop infinito
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;

-- 3. PERMISSÃO DE LEITURA (SELECT): Todos os utilizadores logados podem ver quem está no sistema.
-- ISTO QUEBRA O LOOP INFINITO, porque o SELECT já não precisa de avaliar se és Admin!
CREATE POLICY "Anyone can read profiles"
ON public.profiles FOR SELECT USING (auth.uid() IS NOT NULL);

-- 4. PERMISSÕES DE ESCRITA: Apenas o Admin pode criar, editar ou apagar utilizadores.
CREATE POLICY "Admin can insert profiles"
ON public.profiles FOR INSERT WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admin can update profiles"
ON public.profiles FOR UPDATE USING (public.get_user_role() = 'admin');

CREATE POLICY "Admin can delete profiles"
ON public.profiles FOR DELETE USING (public.get_user_role() = 'admin');

-- 5. O utilizador pode atualizar a própria password/dados (opcional na tabela profiles)
CREATE POLICY "Users can update own profile data"
ON public.profiles FOR UPDATE USING (id = auth.uid());

```sql

## ATUALIZAÇÃO DE GESTÃO DE LOTES

-- ============================================================
-- ATUALIZAÇÃO PARA SUPORTE FEFO (Batches)
-- ============================================================
-- Copiar este código e colar no SQL Editor do Supabase.
-- Esta atualização modifica a função create_movement para
-- abater (ou incrementar) automaticamente a quantidade na tabela batches.

create or replace function public.create_movement(
  p_product_id uuid,
  p_warehouse_id uuid,
  p_type text,
  p_quantity integer,
  p_user_id uuid,
  p_destination_warehouse_id uuid default null,
  p_batch_id uuid default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_movement_id uuid;
  v_current_stock integer;
  v_new_stock integer;
  v_batch_qty integer;
begin
  -- Validar tipo
  if p_type not in ('in', 'out', 'transfer', 'adjustment') then
    raise exception 'Tipo de movimento inválido: %', p_type;
  end if;

  -- Validar quantidade
  if p_quantity <= 0 then
    raise exception 'A quantidade deve ser superior a 0';
  end if;

  -- Para transferências, destino é obrigatório
  if p_type = 'transfer' and p_destination_warehouse_id is null then
    raise exception 'Transferências requerem um armazém de destino';
  end if;

  -- ==========================================
  -- ATUALIZAÇÃO DE LOTE (SE FORNECIDO)
  -- ==========================================
  if p_batch_id is not null then
    select quantity into v_batch_qty from public.batches where id = p_batch_id for update;

    if v_batch_qty is null then
      raise exception 'Lote não encontrado';
    end if;

    if p_type = 'in' then
      update public.batches set quantity = quantity + p_quantity where id = p_batch_id;
    elsif p_type in ('out', 'transfer', 'adjustment') then
      if p_type != 'adjustment' and v_batch_qty < p_quantity then
        raise exception 'Stock insuficiente no lote. Disponível: %, Pedido: %', v_batch_qty, p_quantity;
      end if;

      if p_type = 'adjustment' then
        -- Ajuste direto de quantidade no lote (simplificação: assume-se que ajusta tudo)
        -- Na realidade, adjustment num batch seria mais complexo, mas cobrimos out/transfer
        update public.batches set quantity = quantity - p_quantity where id = p_batch_id;
      else
        update public.batches set quantity = quantity - p_quantity where id = p_batch_id;
      end if;
    end if;
  end if;

  -- ==========================================
  -- ATUALIZAÇÃO DO INVENTÁRIO GERAL
  -- ==========================================
  -- Obter stock atual (com lock para evitar race conditions)
  select quantity into v_current_stock
  from public.inventory
  where product_id = p_product_id and warehouse_id = p_warehouse_id
  for update;

  -- Se não existe registo de inventário, criar com 0
  if v_current_stock is null then
    if p_type in ('out', 'transfer') then
      raise exception 'Stock insuficiente: produto não existe nesta localização';
    end if;
    insert into public.inventory (product_id, warehouse_id, quantity)
    values (p_product_id, p_warehouse_id, 0);
    v_current_stock := 0;
  end if;

  -- Validar stock para saídas e transferências
  if p_type in ('out', 'transfer') and v_current_stock < p_quantity then
    raise exception 'Stock insuficiente no armazém: disponível = %, pedido = %', v_current_stock, p_quantity;
  end if;

  -- Atualizar inventário de origem
  if p_type = 'in' then
    v_new_stock := v_current_stock + p_quantity;
  elsif p_type in ('out', 'transfer') then
    v_new_stock := v_current_stock - p_quantity;
  elsif p_type = 'adjustment' then
    v_new_stock := p_quantity; -- adjustment define o valor absoluto
  end if;

  update public.inventory
  set quantity = v_new_stock, updated_at = now()
  where product_id = p_product_id and warehouse_id = p_warehouse_id;

  -- Para transferências: incrementar stock no destino
  if p_type = 'transfer' then
    insert into public.inventory (product_id, warehouse_id, quantity)
    values (p_product_id, p_destination_warehouse_id, p_quantity)
    on conflict (product_id, warehouse_id)
    do update set quantity = inventory.quantity + p_quantity, updated_at = now();
  end if;

  -- Inserir movimento
  insert into public.movements (
    product_id, warehouse_id, destination_warehouse_id,
    batch_id, type, quantity, user_id, notes
  )
  values (
    p_product_id, p_warehouse_id, p_destination_warehouse_id,
    p_batch_id, p_type, p_quantity, p_user_id, p_notes
  )
  returning id into v_movement_id;

  -- Inserir no audit log
  insert into public.audit_logs (entity, entity_id, action, user_id, new_data)
  values (
    'movement',
    v_movement_id,
    p_type,
    p_user_id,
    jsonb_build_object(
      'product_id', p_product_id,
      'warehouse_id', p_warehouse_id,
      'destination_warehouse_id', p_destination_warehouse_id,
      'batch_id', p_batch_id,
      'quantity', p_quantity,
      'old_stock', v_current_stock,
      'new_stock', v_new_stock,
      'type', p_type,
      'notes', p_notes
    )
  );

  return v_movement_id;
end;
$$;
```sql

## UPDATE SEGURANÇA PARA APAGAR CONTAS NA BD

-- ============================================================
-- FUNÇÃO PARA APAGAR UTILIZADOR (RPC)
-- ============================================================
-- Esta função permite que um Admin apague um utilizador permanentemente.
-- Ao apagar de auth.users, todas as referências (como a tabela profiles)
-- serão apagadas automaticamente por causa do ON DELETE CASCADE.

CREATE OR REPLACE FUNCTION public.delete_user(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Verificar se quem está a executar a função é um Admin
  IF (SELECT role FROM public.profiles WHERE id = auth.uid()) != 'admin' THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores podem apagar contas.';
  END IF;

  -- 2. Não permitir que o admin se apague a si próprio (Prevenção de desastre)
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Não podes apagar a tua própria conta de Administrador!';
  END IF;

  -- 3. Apagar o utilizador da tabela de autenticação base (Isto propaga para profiles)
  DELETE FROM auth.users WHERE id = p_user_id;

END;
$$;
```s

## ROTA PARA RESOLVER DEVOLUÇÕES
```sql

-- ============================================================
-- FUNÇÃO PARA RESOLVER DEVOLUÇÕES (RPC)
-- ============================================================
-- Esta função permite que um gestor/admin resolva uma devolução pendente.
-- Ações possíveis:
-- 'restock': Reintegra no stock (cria movimento de entrada e atualiza inventário)
-- 'scrap': Abate o produto (marca como lixo, não mexe no inventário)

CREATE OR REPLACE FUNCTION public.resolve_return(p_return_id UUID, p_action TEXT, p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
v_return RECORD;
BEGIN
-- 1. Obter a devolução
SELECT \* INTO v_return FROM public.returns WHERE id = p_return_id;

IF v_return.id IS NULL THEN
RAISE EXCEPTION 'Devolução não encontrada';
END IF;

IF v_return.status != 'pending' THEN
RAISE EXCEPTION 'Esta devolução já foi resolvida (estado: %)', v_return.status;
END IF;

-- 2. Processar a ação
IF p_action = 'restock' THEN

    IF v_return.warehouse_id IS NULL THEN
      RAISE EXCEPTION 'Não é possível reintegrar um produto sem localização (warehouse_id)';
    END IF;

    -- A. Atualizar Inventário (Soma a quantidade)
    INSERT INTO public.inventory (product_id, warehouse_id, quantity)
    VALUES (v_return.product_id, v_return.warehouse_id, v_return.quantity)
    ON CONFLICT (product_id, warehouse_id)
    DO UPDATE SET quantity = inventory.quantity + EXCLUDED.quantity, updated_at = now();

    -- B. Registar o Movimento Histórico
    INSERT INTO public.movements (product_id, warehouse_id, type, quantity, user_id, notes)
    VALUES (v_return.product_id, v_return.warehouse_id, 'in', v_return.quantity, p_user_id, 'Reintegração de devolução');

    -- C. Atualizar o estado da Devolução
    UPDATE public.returns
    SET status = 'restocked', resolved_by = p_user_id, resolved_at = now()
    WHERE id = p_return_id;

ELSIF p_action = 'scrap' THEN

    -- Atualizar o estado da Devolução (vai para o lixo, não entra no stock)
    UPDATE public.returns
    SET status = 'scrapped', resolved_by = p_user_id, resolved_at = now()
    WHERE id = p_return_id;

ELSE
RAISE EXCEPTION 'Ação inválida. Use "restock" ou "scrap".';
END IF;

END;

$$
;

-- 3. Dar permissões de execução
GRANT EXECUTE ON FUNCTION public.resolve_return(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_return(UUID, TEXT, UUID) TO anon;

-- 4. Atualizar a cache da API REST
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
$$
````

---

## TABELA: OPERATOR_CHECKINS (Registo de Presenças por QR)

Adiciona suporte ao registo automático de presença dos operadores quando leem um QR Code de localização no Scanner.

```sql
-- ============================================================
-- OPERATOR_CHECKINS — Registo de presença por leitura de QR
-- ============================================================

create table public.operator_checkins (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  warehouse_id uuid references public.warehouses(id) on delete cascade not null,
  checked_in_at timestamptz default now()
);

comment on table public.operator_checkins is 'Registo de presenças de operadores por leitura de QR Code de localização';

-- Índices para pesquisa rápida por utilizador, localização e data
create index idx_checkins_user on public.operator_checkins(user_id);
create index idx_checkins_warehouse on public.operator_checkins(warehouse_id);
create index idx_checkins_date on public.operator_checkins(checked_in_at desc);

-- Ativar RLS
alter table public.operator_checkins enable row level security;

-- Admins e gestores veem todos os check-ins; operadores veem os seus próprios
create policy "Admins e gestores veem todos os check-ins"
  on public.operator_checkins for select
  using (public.get_user_role() in ('admin', 'gestor') or user_id = auth.uid());

-- Qualquer utilizador autenticado pode registar o seu check-in
create policy "Utilizador autenticado pode fazer check-in"
  on public.operator_checkins for insert
  with check (auth.uid() is not null and user_id = auth.uid());

-- Ativar realtime (opcional, para atualização em tempo real na página de presenças)
alter publication supabase_realtime add table public.operator_checkins;
```

## TABELA DE OPERADORES

````sql
-- ============================================================
-- CRIAR TABELA operator_checkins (com entradas e saídas)
-- ============================================================

CREATE TABLE public.operator_checkins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE CASCADE NOT NULL,
  checked_in_at timestamptz DEFAULT now(),
  checked_out_at timestamptz DEFAULT NULL
);

COMMENT ON TABLE public.operator_checkins IS 'Registo de entradas e saídas de operadores por leitura de QR Code de armazém';

-- Índices
CREATE INDEX idx_checkins_user ON public.operator_checkins(user_id);
CREATE INDEX idx_checkins_warehouse ON public.operator_checkins(warehouse_id);
CREATE INDEX idx_checkins_date ON public.operator_checkins(checked_in_at DESC);
CREATE INDEX idx_checkins_open ON public.operator_checkins(user_id, warehouse_id)
  WHERE checked_out_at IS NULL;

-- RLS
ALTER TABLE public.operator_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e gestores veem todos os check-ins"
  ON public.operator_checkins FOR SELECT
  USING (public.get_user_role() IN ('admin', 'gestor') OR user_id = auth.uid());

CREATE POLICY "Utilizador autenticado pode fazer check-in"
  ON public.operator_checkins FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Utilizador pode atualizar o seu proprio check-out"
  ON public.operator_checkins FOR UPDATE
  USING (user_id = auth.uid() OR public.get_user_role() IN ('admin', 'gestor'));

-- Realtime (opcional)
ALTER PUBLICATION supabase_realtime ADD TABLE public.operator_checkins;
```sql
````

## UPDATE 1

-- 1. Apagar a tabela antiga se existir
DROP TABLE IF EXISTS public.operator_checkins;

-- 2. Criar a tabela nova com a coluna checked_out_at
create table public.operator_checkins (
id uuid default gen_random_uuid() primary key,
user_id uuid references public.profiles(id) on delete cascade not null,
warehouse_id uuid references public.warehouses(id) on delete cascade not null,
checked_in_at timestamptz default now() not null,
checked_out_at timestamptz
);

-- 3. Aplicar segurança e políticas de acesso (RLS)
alter table public.operator_checkins enable row level security;

create policy "Admins and managers can view all checkins"
on public.operator_checkins for select
using (public.get_user_role() in ('admin', 'gestor') or user_id = auth.uid());

create policy "Users can check themselves in and out"
on public.operator_checkins for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

## UPDATE 2

-- 1. Apagar a tabela bloqueada
DROP TABLE IF EXISTS public.operator_checkins CASCADE;

-- 2. Recriar a tabela com as colunas certas
CREATE TABLE public.operator_checkins (
id uuid default gen_random_uuid() primary key,
user_id uuid references public.profiles(id) on delete cascade not null,
warehouse_id uuid references public.warehouses(id) on delete cascade not null,
checked_in_at timestamptz default now() not null,
checked_out_at timestamptz
);

-- 3. Garantir que a API tem acesso básico à tabela
GRANT ALL ON TABLE public.operator_checkins TO anon, authenticated, service_role;

-- 4. Ativar segurança
ALTER TABLE public.operator_checkins ENABLE ROW LEVEL SECURITY;

-- 5. Regra à prova de bala: Quem tem login feito pode ler as presenças
CREATE POLICY "Qualquer utilizador com login pode ler presenças"
ON public.operator_checkins FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 6. Regra à prova de bala: Quem tem login feito pode inserir/atualizar a sua presença
CREATE POLICY "Utilizadores podem gerir as suas presenças"
ON public.operator_checkins FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);
