# Gestão de Stock e Inventário

Sistema profissional de gestão de stock, concebido para oferecer uma visão centralizada e em tempo real do inventário, movimentações e alertas de armazém. A aplicação está construída com arquitetura moderna orientada a microsserviços (BaaS), suportando múltiplos papéis de acesso e preparada para operação em contexto móvel e offline (PWA).

## Funcionalidades Principais

* **Catálogo de Produtos:** Gestão detalhada de referências, categorias, preços de custo e limiares de stock mínimo.
* **Hierarquia de Localizações:** Suporte para múltiplos armazéns com divisões lógicas (Corredores, Prateleiras) e geração de QR Codes para identificação rápida.
* **Gestão de Movimentos:** Registo auditável de todas as entradas, saídas e transferências de stock, associando automaticamente o utilizador responsável.
* **Dashboard e Indicadores:** Painel central com resumo financeiro (capital em stock), métricas de movimentação diária e deteção proativa de anomalias (stock baixo e validades expiradas).
* **Gestão de Devoluções:** Fluxo próprio para tratamento de artigos devolvidos, permitindo a reintegração em stock ou o abate (quebra) com respetivo registo de justificação.
* **Leitura de Códigos de Barras e QR Codes:** Interface otimizada para uso em dispositivos móveis, permitindo identificar localizações e produtos com recurso à câmara.
* **Controlo de Acessos (RBAC):** Sistema rígido de papéis (Administrador, Gestor, Auditor e Caixa) que assegura a confidencialidade e a integridade das operações através de Row Level Security (RLS).

## Stack Tecnológica

**Frontend:**
* React 19 (com React Router dom para navegação)
* Vite (Bundler e Dev Server)
* Tailwind CSS v4 (Design System)
* Lucide React (Iconografia)
* TanStack Query (Gestão de estado assíncrono e caching)
* Recharts (Visualização de dados gráficos)
* React Zxing (Processamento de imagem para leitura de códigos)

**Backend as a Service:**
* Supabase (Autenticação, PostgreSQL Database, Realtime Subscriptions, RPCs)

## Estrutura do Projeto

* `/src/components`: Componentes visuais da interface.
* `/src/hooks`: Lógica de negócio e comunicação com a base de dados abstrata em hooks React customizados.
* `/src/pages`: Ecrãs principais da aplicação.
* `/src/types`: Definições de tipagem global TypeScript.
* `/docs`: Documentação técnica, arquitetura e planeamento (ex: `arquitetura.md`, `GROUP_IMPLEMENTATION_PLAN.md`).

## Requisitos de Sistema

* Node.js v18 ou superior.
* Gestor de pacotes npm.
* Projeto ativo no Supabase com estrutura de base de dados e políticas RLS devidamente configuradas de acordo com o planeamento.

## Instalação e Execução

1. Clonar o repositório.
2. Configurar as variáveis de ambiente num ficheiro `.env` na raiz do projeto (obrigatório configurar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`).
3. Instalar as dependências:
   ```bash
   npm install
   ```
4. Executar o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Boas Práticas de Desenvolvimento

* Todo o código está sujeito a validação rigorosa de tipagem (TypeScript).
* O repositório segue normas estritas de ignorar ficheiros sensíveis (`.env` encontra-se fora do controlo de versões).
* Desenvolvimentos futuros devem referir-se à documentação em `/docs/arquitetura.md` para garantir coerência técnica e alinhamento com a estrutura do projeto.
