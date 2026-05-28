# Walkthrough: Modo Offline & Sincronização

Implementámos todo o "motor" do Modo Offline e Infraestrutura Base de Comunicação para que tu e o teu amigo do frontend só se precisem de preocupar com desenhar os ecrãs!

## O que foi feito

### 1. Base de Dados Local (Dexie.js)
- Instalado e configurado o IndexedDB através do ficheiro [dexie.ts](file:///c:/Users/rodri/OneDrive/Documentos/GitHub/gestao-de-stock-app/src/lib/dexie.ts).
- Foi criada a tabela `pendingOps` que serve como "fila de espera" para registar os movimentos dos produtos lidos com o telemóvel quando não existe rede Wi-Fi/dados no armazém.

### 2. Motor de Sincronização em Background
- Criado o ficheiro [sync.ts](file:///c:/Users/rodri/OneDrive/Documentos/GitHub/gestao-de-stock-app/src/lib/sync.ts) que contém o cérebro da nossa sincronização.
- Lógica inteligente de *event listener*: quando o *browser* reporta a perda de rede, as operações são guardadas; quando o browser deteta a volta do sinal online (ex: `window.addEventListener('online', ...)`), ele descarrega todas as transações pendentes sequencialmente para a cloud do Supabase através da nossa Stored Procedure.

### 3. Integração com os Movimentos
- O Hook de frontend [useMovements.ts](file:///c:/Users/rodri/OneDrive/Documentos/GitHub/gestao-de-stock-app/src/hooks/useMovements.ts) que o teu colega irá usar agora interceta todas as saídas e entradas de stock: se `navigator.onLine` for falso, ele guarda o movimento na Dexie, senão dispara a chamada à base de dados.

### 4. Alertas em Tempo Real (Supabase Realtime)
- Implementámos no [useAlerts.ts](file:///c:/Users/rodri/OneDrive/Documentos/GitHub/gestao-de-stock-app/src/hooks/useAlerts.ts) a subscrição por _WebSockets_. Sempre que a tabela `inventory` sofre qualquer alteração (mesmo se feita por outro utilizador num armazém diferente), o nosso hook avisa o cliente (Invalidate Query) para redesenhar a View de produtos com pouco stock.

## Como testar esta Track

1. No browser, abre as DevTools (F12) e vai ao separador **Network** (Rede).
2. Muda o status de *No throttling* para **Offline**.
3. O código que regista os movimentos (que o teu colega de UI irá chamar num clique de botão ou scan de código de barras) irá agora devolver "Sucesso!" na UI e guardar a entrada na secção `Application > IndexedDB`.
4. Volta a colocar o separador Network como **No throttling** (Online). A consola do browser deverá registar algo como `[Sync] Conexão restaurada. A iniciar sync...` e verás o disparo à API (Supabase) na secção Network!

---

> [!NOTE]
> Esta arquitetura liberta completamente a equipa de Frontend de ter de pensar em estados offline e "retry logic". Fica à vontade para me indicar que outra lógica ou feature não-visual queres que prepare de seguida!
