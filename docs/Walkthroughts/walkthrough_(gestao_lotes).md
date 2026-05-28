# Gestão de Lotes e Validades Implementada! 📦⏳

A lógica de Gestão de Lotes e suporte a FEFO foi implementada na aplicação. Aqui está o resumo do que foi feito e os próximos passos para testares.

## O que foi alterado no código:

### 1. Novo Hook para Lotes (`useBatches.ts`)
Criado um serviço dedicado para ler e criar lotes. Quando um lote é criado na aplicação (numa determinada localização e com uma certa quantidade inicial), o sistema agora:
1. Regista o lote na tabela `batches` com a quantidade inicial a 0.
2. Faz uma chamada segura à função de criação de movimento (`create_movement`) para registar a **Entrada** no sistema, o que preenche a quantidade no inventário global e no próprio lote (através da nova regra SQL).

### 2. Novo Ecrã de Registo de Lotes
A página `ProductBatchCreate.tsx` foi completamente refatorada. Deixou de usar dados de mentira (mocks) e agora lista os armazéns reais vindos da tua base de dados, permitindo a criação do lote com ligação ao novo hook.

### 3. Melhoria no Histórico de Movimentos
No `MovementLog.tsx`, sempre que um movimento for feito a partir de um Lote específico, a aplicação vai apresentar uma etiqueta (badge) com o `batch_code` por baixo do SKU do produto.

---

## 🛑 PASSO CRÍTICO: Atualizar a Base de Dados

Para que o sistema seja capaz de deduzir ou acrescentar produtos à tabela de `batches` sempre que há um movimento, tens de atualizar a função principal do Supabase.

> [!IMPORTANT]
> Copiei o código necessário para um ficheiro temporário. Segue estes passos:
> 1. Abre o ficheiro: [fefo_update.sql](file:///C:/Users/rodri/.gemini/antigravity-ide/brain/b0cdb4fd-3606-4cbb-ae1f-cefcb0f3b0fb/scratch/fefo_update.sql)
> 2. Copia **todo** o conteúdo que lá está.
> 3. Vai ao [Dashboard do Supabase](https://supabase.com/dashboard) > **SQL Editor** > **New Query**.
> 4. Cola o código e clica em **Run** (basta fazer isto uma vez).

## Como Testar
1. Executa o SQL acima no Supabase.
2. Abre a aplicação, vai ao catálogo de Produtos e entra num produto qualquer.
3. Clica em **"Lote"** (botão com o + ao lado de Editar).
4. Regista um novo lote com uma validade. Se reparares na página de Detalhe do Produto, o inventário desse armazém vai aumentar, o Lote vai aparecer na tabela de "Lotes Ativos" em baixo, e o movimento de Entrada vai ficar registado no Histórico com a respetiva *tag* do lote!
