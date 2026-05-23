# GROUP IMPLEMENTATION PLAN — Gestão de Stock

> Plano de trabalho paralelo para equipas de desenvolvimento.
> O scaffold (Fase 1 do implementation_plan.md) está **concluído**.
> A Fase 2 (Auth + RBAC) é o único bloqueador global — deve estar feita antes de qualquer outra track começar.
> Após isso, as tracks A, B, C e D podem correr em paralelo por pessoas diferentes.

---

## PRÉ-REQUISITO GLOBAL (1–2 dias) — Toda a equipa depende disto

**Responsável:** 1 pessoa (preferencialmente o lead técnico)

- [ ] Criar projeto no Supabase Dashboard
- [ ] Configurar `.env` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
- [ ] Correr o SQL das tabelas base (`profiles`, `products`, `warehouses`, `inventory`) no Supabase SQL Editor
- [ ] Configurar Row Level Security (RLS) nas tabelas
- [ ] Implementar `pages/Login.tsx`, `hooks/useAuth.ts`, `ProtectedRoute`, `RoleGuard`
- [ ] Partilhar o `.env` com a equipa (via gestor de segredos, não no git)

**Entrega:** App só acessível via login; 4 papéis funcionais (admin, gestor, caixa, auditor).

---

## TRACK A — Catálogo de Produtos + Design System UI

**Pode começar:** Após o pré-requisito
**Ideal para:** Dev com foco em frontend/UI
**Ficheiros:** `pages/Product*.tsx`, `hooks/useProducts.ts`, `components/ui/*`, `components/domain/ProductCard.tsx`

### Tarefas

**A1 — Componentes UI Base**
- [ ] `Button.tsx` — variantes (primary, secondary, danger, ghost)
- [ ] `Input.tsx` — campo de texto com label, erro e ícone
- [ ] `Table.tsx` — tabela com ordenação, paginação e estado vazio
- [ ] `Modal.tsx` — modal acessível com overlay e fechar ao clicar fora
- [ ] `Badge.tsx` — etiqueta de estado (ativo, esgotado, crítico)

**A2 — Catálogo de Produtos**
- [ ] `ProductsList.tsx` — tabela com pesquisa por nome/SKU/barcode, filtros por categoria
- [ ] `ProductCreate.tsx` — formulário com validação (nome, SKU, categoria, unidade, preço, stock mínimo)
- [ ] `ProductDetail.tsx` — detalhe com dados base, distribuição de stock por armazém, histórico de movimentos

**A3 — Hook de Produtos**
- [ ] `hooks/useProducts.ts` — queries TanStack (lista, detalhe, pesquisa) e mutations (criar, editar, desativar)

**Verificação:**
- [ ] CRUD completo de produtos funcional
- [ ] Pesquisa devolve resultados corretos
- [ ] Tabela de lista tem paginação

---

## TRACK B — Hierarquia de Armazéns + QR Codes

**Pode começar:** Após o pré-requisito
**Ideal para:** Dev com gosto em estruturas de dados e lógica recursiva
**Ficheiros:** `pages/Warehouse*.tsx`, `hooks/useWarehouses.ts`, `components/domain/WarehouseTree.tsx`

### Tarefas

**B1 — Base de Dados**
- [ ] Correr SQL das tabelas `warehouses` e `inventory` no Supabase
- [ ] Testar que a referência `parent_id` auto-referencial funciona

**B2 — Componente de Árvore**
- [ ] `WarehouseTree.tsx` — componente recursivo que renderiza hierarquia de localizações
- [ ] Expandir/colapsar sub-níveis com animação suave
- [ ] Botões de ação em cada nó (adicionar sub-armazém, gerar QR)

**B3 — Páginas de Armazéns**
- [ ] `WarehousesList.tsx` — vista em árvore com criação de novos nós
- [ ] `WarehouseDetail.tsx` — inventário em tempo real de uma localização + botão de gerar QR code

**B4 — Geração de QR Codes**
- [ ] Instalar biblioteca `qrcode` (`npm install qrcode @types/qrcode`)
- [ ] Gerar QR code único para cada sub-armazém e guardar no campo `qr_code` da tabela
- [ ] Botão de "Imprimir QR" que abre uma janela de impressão otimizada

**B5 — Hook de Armazéns**
- [ ] `hooks/useWarehouses.ts` — queries (lista hierárquica, detalhe, inventário de um nó) e mutations (criar, renomear)

**Verificação:**
- [ ] Criar 3 níveis de hierarquia (Armazém > Corredor > Prateleira)
- [ ] QR code gerado e visível em cada localização
- [ ] Inventário do nó mostra produtos corretos

---

## TRACK C — Motor de Movimentos + Audit Log

**Pode começar:** Após Tracks A e B estarem concluídas (precisa de produtos e armazéns)
**Ideal para:** Dev com mais experiência em backend/SQL/transações
**Ficheiros:** `hooks/useMovements.ts`, `pages/MovementLog.tsx`, SQL procedures no Supabase

### Tarefas

**C1 — Base de Dados (SQL)**
- [ ] Correr SQL das tabelas `movements` e `audit_logs`
- [ ] Implementar a stored procedure `create_movement()` como função PostgreSQL no Supabase:
  - Validar permissões via `user_id`
  - Bloquear saída se `stock < quantidade`
  - Atualizar `inventory` atomicamente
  - Inserir em `audit_logs` sempre (append-only)
  - Disparar evento Realtime se stock novo < min_stock

**C2 — Hook de Movimentos**
- [ ] `hooks/useMovements.ts` — mutation via `supabase.rpc('create_movement')` + query paginada

**C3 — Página de Audit Log**
- [ ] `pages/MovementLog.tsx` — tabela com colunas: Data/Hora, Utilizador, Tipo, Produto, Quantidade, Localização
- [ ] Filtros: por utilizador, por produto, por tipo (entrada/saída), por intervalo de datas
- [ ] Paginação (cursor-based para performance)
- [ ] Exportação simples para CSV

**Verificação:**
- [ ] Entrada incrementa `inventory`
- [ ] Saída falha com erro claro se stock insuficiente
- [ ] Todo o movimento aparece no audit_log
- [ ] Filtros e paginação funcionam

---

## TRACK D — Scanner Mobile PWA + Modo Offline

**Pode começar:** Após o pré-requisito (pode ser desenvolvida em paralelo com A, B, C)
**Ideal para:** Dev com interesse em mobile/câmara/PWA
**Ficheiros:** `hooks/useScanner.ts`, `pages/ScanMobile.tsx`, `components/domain/BarcodeScanner.tsx`, `lib/dexie.ts`, `lib/sync.ts`

### Tarefas

**D1 — Scanner de Câmara**
- [ ] Instalar `react-zxing` (`npm install react-zxing`)
- [ ] `hooks/useScanner.ts` — pede permissão de câmara, parseia resultado (barcode vs QR code), lida com erros
- [ ] `BarcodeScanner.tsx` — componente de câmara reutilizável com overlay de mira

**D2 — Interface Mobile de Scan**
- [ ] `pages/ScanMobile.tsx`:
  - Fullscreen com câmara ativa
  - Ao ler barcode de produto → painel deslizante com nome, stock atual, botões "Entrada" e "Saída"
  - Ao ler QR code de armazém → navegar para `/armazens/:id`
  - Feedback: vibração (`navigator.vibrate`) e som ao ler com sucesso
- [ ] UI otimizada para uso com uma mão (botões grandes, zona de polegar)

**D3 — Modo Offline (Dexie.js)**
- [ ] `lib/dexie.ts` — definir schema do IndexedDB:
  ```ts
  class StockDB extends Dexie {
    pendingOps!: Table<PendingOperation>
  }
  ```
- [ ] `lib/sync.ts` — lógica de sincronização:
  - Detetar `online`/`offline` via `window.addEventListener`
  - Guardar operações offline na fila do Dexie
  - Quando volta online: enviar por ordem com retries exponenciais
  - Marcar operações como concluídas ou com erro
- [ ] Indicador visual no Header: "Online" | "Offline (3 pendentes)"

**D4 — Integração com Motor de Movimentos**
- [ ] Após Track C estar concluída: ligar `ScanMobile.tsx` à mutation `create_movement`
- [ ] Se offline: guardar no Dexie em vez de chamar Supabase

**Verificação:**
- [ ] Câmara funciona em Chrome mobile e Safari iOS
- [ ] Barcode lido identifica produto correto
- [ ] QR code lido navega para o armazém correto
- [ ] Em modo offline, scan regista na fila local
- [ ] Ao voltar online, fila é sincronizada corretamente

---

## TRACK E — Dashboard + Alertas Realtime + Lotes

**Pode começar:** Após Track C estar concluída
**Ideal para:** Dev com gosto em dados/gráficos/UX
**Ficheiros:** `pages/Dashboard.tsx`, `hooks/useDashboard.ts`, `hooks/useAlerts.ts`, `components/domain/KpiCard.tsx`

### Tarefas

**E1 — Tabela de Lotes**
- [ ] Correr SQL da tabela `batches` no Supabase
- [ ] Criar view `alerts_view` que cruza stock baixo e validades críticas

**E2 — Dashboard KPIs**
- [ ] `KpiCard.tsx` — card com título, valor, tendência e ícone
- [ ] `pages/Dashboard.tsx`:
  - 4 cards: Total SKUs, Capital em Stock (€), Movimentos Hoje, Alertas Ativos
  - Gráfico de barras com saídas dos últimos 7 dias (biblioteca `recharts`)
  - Tabela de "Top 5 Produtos com mais saídas"
  - Lista de alertas (stock baixo + validades a expirar)
- [ ] `hooks/useDashboard.ts` — queries agregadas via RPC

**E3 — Alertas em Tempo Real**
- [ ] `hooks/useAlerts.ts` — subscrição Supabase Realtime na tabela `inventory`
- [ ] Badge de notificação no Header com número de alertas ativos
- [ ] Dropdown de alertas com links para o produto/armazém afetado

**E4 — Gestão de Lotes (FEFO)**
- [ ] Vista de lotes no `ProductDetail.tsx` (código, validade, quantidade)
- [ ] Ao criar movimento de entrada: opção de associar a um lote
- [ ] Sugestão de FEFO automática nas saídas (primeiro a expirar, primeiro a sair)

**Verificação:**
- [ ] KPIs mostram dados corretos vs Supabase
- [ ] Alerta aparece em tempo real (sem refresh) quando stock cai
- [ ] Lotes com validade < 30 dias aparecem destacados
- [ ] Gráfico reflete dados reais

---

## TRACK F — Devoluções

**Pode começar:** Após Track C estar concluída
**Ideal para:** Dev que queira uma tarefa mais isolada e bem definida
**Ficheiros:** `pages/Returns.tsx`, `hooks/useReturns.ts`

### Tarefas

**F1 — Base de Dados**
- [ ] Correr SQL da tabela `returns` no Supabase
- [ ] Criar RPC `resolve_return(id, action)` — action: 'restock' | 'scrap'

**F2 — Página de Devoluções**
- [ ] `pages/Returns.tsx`:
  - Tabela de devoluções pendentes (produto, quantidade, razão, data, quem registou)
  - Botão "Reintegrar em Stock" → cria movimento de entrada + atualiza status para 'restocked'
  - Botão "Abater (Quebra)" → atualiza status para 'scrapped' sem alterar stock
  - Filtros por estado (pendente, resolvido)

**F3 — Hook de Devoluções**
- [ ] `hooks/useReturns.ts` — queries e mutations

**Verificação:**
- [ ] Criar devolução aumenta lista de pendentes
- [ ] "Reintegrar" cria movimento no audit log e atualiza inventário
- [ ] "Abater" não altera stock
- [ ] Histórico de devoluções resolvidas é acessível

---

## Mapa de Dependências e Paralelismo

```
PRÉ-REQUISITO (Auth + DB Base)
        │
        ├── TRACK A (Produtos + UI)      ← paralelo com B
        ├── TRACK B (Armazéns + QR)      ← paralelo com A
        └── TRACK D (Scanner + Offline)  ← paralelo com A e B

                 A + B concluídas
                       │
                 TRACK C (Movimentos)
                       │
        ┌──────────────┼──────────────┐
   TRACK D (ligar)  TRACK E (Dashboard) TRACK F (Devoluções)
```

---

## Estimativa de Esforço por Track

| Track | Descrição | Estimativa | Paralela com |
|-------|-----------|------------|-------------|
| Pré-req | Auth + DB + RLS | 1–2 dias | — |
| A | Produtos + UI base | 3–4 dias | B, D |
| B | Armazéns + QR | 2–3 dias | A, D |
| C | Movimentos + Audit Log | 3–4 dias | — (depende A+B) |
| D | Scanner Mobile + Offline | 4–5 dias | A, B; ligar após C |
| E | Dashboard + Alertas + Lotes | 3–4 dias | F (depende C) |
| F | Devoluções | 1–2 dias | E (depende C) |

**Total estimado com 3 devs:** ~10–12 dias de trabalho paralelo
**Total estimado com 1 dev:** ~20–25 dias sequenciais

---

## Convenções para Trabalho em Equipa

- Cada track trabalha numa branch git separada: `feat/track-a-produtos`, `feat/track-b-armazens`, etc.
- Antes de fazer merge, abrir Pull Request e pedir review de pelo menos 1 colega.
- Ficheiros partilhados (`App.tsx`, `types/index.ts`) devem ser coordenados para evitar conflitos — definir os tipos globais no início.
- O ficheiro `src/types/index.ts` deve ser criado logo no início com os tipos partilhados (`Product`, `Warehouse`, `Movement`, `User`, etc.) para todas as tracks usarem a mesma interface.
