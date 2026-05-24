# Arquitetura e Definição de Produto - Gestão de Stock

Para executar tem que se usar https:localhost:5173 (o HTTPS é obrigatório devido a alterações do VITE)

Neste projeto adotámos o Supabase como Backend-as-a-Service (BaaS), ou seja, as chamadas à API não feitas através de métodos tradicionais como Node.js, mas sim diretamente na Supabase.

## Papéis de Utilizador

- Administrador: Acesso total a configurações, utilizadores e relatórios globais.
- Gestor de Armazém: Gestão de inventário, lotes, transferências e relatórios.
- Funcionário/Caixa: Registo de entradas/saídas, leitura de códigos e consulta de stock local.
- Auditor: Acesso de leitura para verificar movimentos, histórico e relatórios.

## Organização do Projeto

`components/:` Peças de interface gráfica (UI) reutilizáveis. Tudo o que pode aparecer em vários sítios (como botões, tabelas, a Sidebar, o Header, caixas de diálogo) fica aqui.

`hooks/:` Onde fica a "lógica de negócio" e a ligação à base de dados. Um hook customizado (como o useProducts ou useAuth) serve para separar o código complicado do componente visual. Em vez do componente ter 100 linhas a pedir dados, usa apenas const { products } = useProducts().

`lib/:` Bibliotecas externas e configurações base. É aqui que inicializamos ligações com o mundo exterior. Neste caso, tens o supabase.ts para a base de dados online e o dexie.ts para gerir a base de dados offline (no telemóvel/browser).

`pages/ (ou views):` Representam os ecrãs principais da aplicação que correspondem a um URL específico (ex: A página principal do Dashboard, a página de Login, a lista de Armazéns). Elas juntam os vários components para formar a página final.

`types/:` Ficheiros (normalmente o index.ts) que definem o "formato" (as regras de TypeScript) das tuas variáveis. É o que diz ao editor que um Product tem obrigatoriamente um name e um sell_price, ajudando a evitar erros.

`utils/ (ou helpers):` Funções muito simples e pequeninas que resolvem problemas genéricos, como formatar uma data para português, converter dinheiro ou calcular percentagens.

`data/:` Dados estáticos, normalmente usados para simulações (mock.ts) antes da base de dados real estar ligada.

## Funcionalidades

- Catálogo de Produtos: Criação, edição e listagem (SKU, nome, descrição, categoria).
- Gestão de Inventário: Registo de entradas e saídas de stock.
- Leitor de Código de Barras: Adicionar/remover produtos e registar códigos via câmara.
- Gestão de Lotes e Validades: Rastreio de lotes e alertas de validade (FEFO).
- Gestão de Devoluções: Registar produtos devolvidos e definir destino.
- Hierarquia de Armazéns: Armazém principal e sub-armazéns/prateleiras.
- Navegação por QR Code: Scan de QR code do sub-armazém para listar os produtos associados. Na primeira vez que é feita a leitura a base de dados tem de ler o codigo de barras junto com o nome, e um botao guardar, ao guradar ela fica nova linha na base de dados e a proxima ja la fica.
- Registo de Movimentos: Histórico de quem moveu o quê e quando.
- Alertas em tempo real: Avisos de stock mínimo e validades críticas.
- Modo Offline: Scan de produtos sem internet e sincronização posterior.
- Log de Auditoria: Registo imutável de todas as ações no sistema.
- Dashboard e Estatísticas: Gráficos de vendas, rotação de produtos e capital.

## Plataforma

- Aplicação Web: Backoffice para Administrador, Gestor e Auditor.
- Aplicação Mobile (PWA): Interface focada no Funcionário para leitura de códigos no telemóvel.

## Stack Tecnológica

### Visão Geral

- Arquitetura: Single Page Application (SPA) PWA-first usando React e Supabase as a Backend.

### Frontend

- Framework: React + Vite + TypeScript
- UI: Tailwind CSS
- Estado & Dados: TanStack Query (react-query) para fetching/caching; Zustand para estado local simples.
- PWA / Mobile: PWA nativa com Vite-PWA plugin (Service Workers para offline e add-to-homescreen).
- Testes: Jest + React Testing Library

### Backend / API

- Base de dados: Supabase
- Autenticação & Autorização: Supabase Auth
- Realtime & Notificações: Supabase Realtime

### Base de Dados & Armazenamento

- Base: PostgreSQL (Supabase)
- Storage de ficheiros: Supabase Storage

### Offline & Sincronização

- Local DB no cliente: Dexie.js (IndexedDB)
- Estratégia de sync: operações em fila (append-only), retries exponenciais, merges com políticas (FEFO para validade, last-write-wins ou conflito por versão)

### Leitura de Código de Barras / QR

- Web: `react-zxing` ou `html5-qrcode` com otimizações (exposure, autofocus); PWA com permissões de camera.

### Ferramentas de Qualidade de Código

- Lint/Format: ESLint + Prettier.
- Git hooks: Husky + lint-staged + commitlint.
- Type checking: TypeScript estrito e checks no CI.

### Estrutura de Dados

- `Product` (sku, name, category, price, uom)
- `Warehouse` (location, type)
- `Inventory` (product_id, warehouse_id, quantity)
- `Batch` (product_id, batch_code, expiry_date, quantity)
- `Movement` (type: in/out/transfer, qty, from, to, user_id, timestamp)
- `User` (id, role, contact)
- `AuditLog` (entity, entity_id, action, user_id, timestamp, diff)

### Observações de Escalabilidade

- Começar com Supabase/Next.js agiliza MVP
- Separar leitura/escrita pesada com read replicas, caching e filas para tarefas longas.

---

Se quiser, aplico isto no ficheiro e adiciono um exemplo de `stack` em tabelas com escolhas recomendadas (MVP vs Escala) e um esboço de `docker-compose`/workflow de CI.

## Modo Offline

O modo offline permite o uso da app mesmo sem ligação wifi, isto acontece porque nem sempre nos armazéns o wi-fi é estável. Neste modo o registo de códigos de barras está desligado, pois não é seguro para a integridade dos dados fazer isso offline e depois enviar para o servidor.
Ficaram disponivéis todas as operações em qualquer produto já existente, como adicionar stock, remover stock, etc...
