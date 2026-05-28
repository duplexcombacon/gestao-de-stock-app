# Funcionalidades Implementadas - Gestão de Stock

Este documento serve como registo do estado atual do projeto e detalha todas as funcionalidades que já foram desenvolvidas e integradas na aplicação.

## 1. Fundação Técnica e UI
- **PWA e Modo Offline Base**: App configurada como Progressive Web App (PWA) utilizando Vite. Integração do Dexie.js (IndexedDB) para permitir cache de dados e suportar navegação quando não há internet.
- **Design System**: Sistema de design moderno, responsivo (mobile-first) e focado em usabilidade, com suporte a *Dark Mode*.
- **Componentes Reutilizáveis**: Criação de vários componentes standard como `Button`, `Input`, `Select`, `Modal`, `Badge`, `KpiCard` e tabelas.

## 2. Autenticação e Autorização (RBAC)
- **Supabase Auth**: Sistema de login por email e password totalmente integrado com a Supabase.
- **Controlo de Acessos**: Implementação de `RoleGuard` e `ProtectedRoute` baseados em 4 perfis de utilizador:
  - Administrador
  - Gestor de Armazém
  - Funcionário / Caixa
  - Auditor

## 3. Catálogo de Produtos
- **Base de Dados Supabase**: Tabela `products` sincronizada e funcional.
- **Gestão de Produtos**:
  - Listagem de produtos (`ProductsList.tsx`).
  - Criação de novos produtos (`ProductCreate.tsx`) ligado à base de dados.
  - Edição de produtos (Interface construída, mas atualmente a aguardar ligação final à mutation da base de dados).
  - Vista detalhada de cada produto (`ProductDetail.tsx`).
- **Integração de Códigos de Barras**: Associação de `barcode` e `sku` a cada produto.

## 4. Hierarquia de Armazéns e QR Codes
- **Estrutura em Árvore**: Suporte para múltiplos níveis de localização (Armazém > Zona > Corredor > Prateleira) usando a tabela `warehouses` com referências `parent_id`.
- **Geração de QR Codes**: Sistema integrado que cria e permite a impressão de QR Codes únicos para cada localização física.
- **Gestão de Armazéns**: Criação, listagem e edição de armazéns e sub-armazéns.

## 5. Motor de Movimentos e Stock (Inventário)
- **Registo Atómico**: Entradas e saídas de stock atualizam automaticamente a tabela `inventory`.
- **Histórico (Audit Log)**: Página `MovementLog.tsx` que regista todos os movimentos (quem, quando, o quê, onde, quantidade).
- **Integração Realtime**: Hook `useMovements.ts` que permite a criação transacional de movimentos (via RPC `create_movement` no Supabase).

## 6. Scanner Mobile
- **Leitor Integrado (`BarcodeScanner`)**: Acesso à câmara do telemóvel nativamente no browser.
- **Página de Leitura (`ScanMobile.tsx`)**: Otimizada para uma mão, permitindo ler o código de um produto e registar entrada/saída de forma imediata.
- **Prevenção de Erros Offline**: Se a rede falhar, o scanner consegue verificar a cache local (via Dexie.js) e colocar o movimento numa fila de sincronização.

## 7. Dashboard e KPIs
- **Página Inicial Analítica**: Dashboard completo (`Dashboard.tsx`) para Gestores e Admins.
- **Métricas Chave**: Visualização em tempo real do total de produtos, capital em stock (€), e movimentos do dia.
- **Gráficos**: Gráfico de saídas dos últimos 7 dias gerado com dados dinâmicos da tabela de movimentos.
- **Top Produtos**: Lista automática dos 5 produtos com maior volume de saída.

## 8. Alertas em Tempo Real e Lotes
- **Sistema de Alertas**: Lógica construída para notificar o utilizador sobre:
  - Stock Baixo (quando quantidade cai abaixo do `min_stock`).
  - Lotes a Expirar.

## 9. Devoluções
- **Fluxo de Devolução (`Returns.tsx`)**: Página e sistema para gerir itens devolvidos.
- **Resolução de Devoluções**: Possibilidade de aceitar o produto de volta para o stock ("Reintegrar") ou regista-lo como lixo/dano ("Abater / Quebra").

---

> **Nota:** As páginas antigas de planeamento foram eliminadas e substituídas por este documento que reflete o que foi efetivamente construído.
