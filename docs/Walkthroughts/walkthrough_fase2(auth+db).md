# Walkthrough: Fase 2 (Auth + DB)

O "Pré-Requisito Global" delineado no plano original está agora implementado!

## O que foi feito

### 1. Ligação Real à Base de Dados
Instalámos a SDK do Supabase (`@supabase/supabase-js`) e inicializámos o cliente oficial utilizando as credenciais fornecidas no ficheiro `.env` do projeto. Isto abriu portas para que a aplicação possa ler e escrever dados na cloud.

### 2. Autenticação e RBAC (Role-Based Access Control)
Substituímos os dados *mockados* no [useAuth.tsx](file:///c:/Users/rodri/OneDrive/Documentos/GitHub/gestao-de-stock-app/src/hooks/useAuth.tsx) por uma integração a 100% com o Supabase Auth.
- Implementámos um `AuthProvider` usando *Context*, que interage com o SDK (via `signInWithPassword` e `onAuthStateChange`).
- Sempre que um login é efetuado, o frontend consulta automaticamente a tabela `profiles` do Supabase de forma a carregar a **Role** (Papel) real do utilizador (`admin`, `gestor`, `caixa` ou `auditor`).

### 3. Proteção de Rotas e Ecrã de Login
- A página de [Login.tsx](file:///c:/Users/rodri/OneDrive/Documentos/GitHub/gestao-de-stock-app/src/pages/Login.tsx) invoca agora o método de sign-in do `useAuth` e redireciona os utilizadores consoante o sucesso da operação, emitindo alertas reais caso os dados estejam incorretos.
- Refatorámos a árvore de rotas no [App.tsx](file:///c:/Users/rodri/OneDrive/Documentos/GitHub/gestao-de-stock-app/src/App.tsx) de forma a englobar toda a aplicação dentro do `AuthProvider`.
- Adicionámos o wrapper `ProtectedRoute` para forçar o login antes de mostrar o layout global da app.
- Adicionámos um `RoleGuard`, usado como teste de caso na rota `/produtos/novo` para garantir que apenas utilizadores das roles `admin` e `gestor` a conseguem aceder.

## Como testar

1. Abre o teu **Supabase Dashboard** na secção de [Authentication > Users](https://supabase.com/dashboard/project/_/auth/users) e adiciona um novo utilizador de teste (com email e password).
2. Como temos um _trigger_ no SQL da base de dados, a tabela `profiles` deve popular automaticamente esse novo registo com a role `caixa` por defeito.
3. Inicia o projeto (`npm run dev`) e acede a `localhost:5173`.
4. Vais ver que és forçado a estar no ecrã de `/login`.
5. Insere os dados criados. O sistema deve agora entrar no *Dashboard* com sucesso.

> [!TIP]
> Se quiseres testar a gestão de permissões, altera o papel deste teu utilizador diretamente na tabela `profiles` no teu Supabase Dashboard de `caixa` para `admin` ou vice-versa, e verifica se perdes/ganhas acesso à página "Novo Produto".

O que vamos fazer a seguir? Seguindo o nosso [GROUP_IMPLEMENTATION_PLAN.md](file:///c:/Users/rodri/OneDrive/Documentos/GitHub/gestao-de-stock-app/docs/GROUP_IMPLEMENTATION_PLAN.md), estamos aptos para arrancar com a **Track A (Catálogo de Produtos)** ou com a **Track B (Hierarquia de Armazéns)**!
